import { fromMarkdown } from 'https://esm.sh/mdast-util-from-markdown@2?bundle'
import { gfm } from 'https://esm.sh/micromark-extension-gfm@3?bundle'
import { gfmFromMarkdown } from 'https://esm.sh/mdast-util-gfm@3?bundle'
import { newlineToBreak } from 'https://esm.sh/mdast-util-newline-to-break@2?bundle'
import { toHast } from 'https://esm.sh/mdast-util-to-hast@13?bundle'
import { sanitize } from 'https://esm.sh/hast-util-sanitize@5?bundle'
import { minifyWhitespace } from 'https://esm.sh/hast-util-minify-whitespace@1?bundle'
import { toHtml } from 'https://esm.sh/hast-util-to-html@9?bundle'
import { toString } from 'https://esm.sh/mdast-util-to-string@4'
// \+/ See https://github.com/syntax-tree.



export function renderMDToHTML(md)
{
    const mTree = fromMarkdown(md, {
        extensions: [gfm()],
        mdastExtensions: [gfmFromMarkdown()]
    });
    newlineToBreak(mTree);

    ////console.group("Debug info regarding line break addition/restoration:");
    mTree.children = syncMdastLinePositions(mTree.children);
    ////console.groupEnd();

    const hTree = sanitize(toHast(mTree));
    minifyWhitespace(hTree);
    hTree.children = earmarkHastNodeOffsets(hTree.children);

    return toHtml(hTree);
}

/**
 * Takes a string with markdown syntax in it, parses it, and returns plaintext.\
 * &emsp; Note that this *should* mean that lone asterisks and similar inert formatting characters are preserved.
 * @param {String} mdString A string with markdown syntax to be removed.
 * 
 * @returns {String} {@linkcode mdString}, with all parsed markdown formatting characters removed.
 */
export function unMarkdownString(mdString)
{
    const mTree = fromMarkdown(mdString, {
        extensions: [gfm()],
        mdastExtensions: [gfmFromMarkdown()]
    });
    return toString(mTree);
}



/**
 * Traverses the provided mdast items, and inserts breaks to fill gaps between the end/start lines of positioned elements.
 * @param {[]} treeArray The array of items the mdast is made of (typically the `children` property).
 * 
 * @returns {[]} {@linkcode treeArray}, with breaks inserted to line up the positions of each element.
 */
function syncMdastLinePositions(treeArray)
{
    // Init to 0, so the first positioned element can be property indented/synced as well
    let lastPos = { end: { line: 0 } };
    let breaks = 0;

    for (let i = 0; i < treeArray.length; i++)
    {
        ////console.log(treeArray[i]);

        const pos = treeArray[i].position;
        if (!pos)
        {
            // Add one to breaks if this is one (true/false converts to 1/0)
            breaks += treeArray[i].type === "break";
            continue;
        }

        // Get the difference between the end/start line of the last/current item. Factor in any existing breaks.
        let lineDelta = (pos.start.line - 1) - lastPos.end.line - breaks;
        for (; lineDelta > 0; lineDelta--)
        {
            // Insert a break at current, then increment i to put us back where we started.
            treeArray.splice(i, 0, { type: "break" });

            ////console.log("\t%o", treeArray[i]);
            i++;
        }

        lastPos = pos;
        breaks = 0;
    }

    return treeArray;
}

/**
 * Traverses the provided hast items and, for each of type `element` that has positional data, attaches an attribute\
 * indicating that data; its character offset, start & end.\
 * &emsp; *(Remarkably enough, these offsets are according to the markdown it was created from!)*
 * @param {[]} inputNodes The array of items that make up the hast we want to mark (typically the `children` property).
 * 
 * @returns {[]} {@linkcode inputNodes}, with each `element` type item & sub-item given attributes containing data about\
 * its position, via the `properties` property.
 */
function earmarkHastNodeOffsets(inputNodes)
{
    for (let i = 0; i < inputNodes.length; i++)
    {
        // Can't put attributes on non-elements.
        if (inputNodes[i]?.type !== "element") continue;
        ////console.log(i, ": ", inputNodes[i].position || "[NO POSITIONING DATA]");

        // If we have positioning information for this element,
        if (inputNodes[i].position)
        {
            // Add some of that information to it by merging some items into its `properties` property.
            inputNodes[i].properties = {
                ...inputNodes[i].properties,

                "dataMdStart": [
                    inputNodes[i].position.start.line,
                    inputNodes[i].position.start.column,
                    inputNodes[i].position.start.offset,].join(";"),
                "dataMdEnd": [
                    inputNodes[i].position.end.line,
                    inputNodes[i].position.end.column,
                    inputNodes[i].position.end.offset,].join(";")
            };

            // If this node has children, and the first one has a position, note it; this'll indicate the
            // presence of any formatting characters at the very start.
            if (inputNodes[i].children?.[0]?.position)
            {
                inputNodes[i].properties = {
                    ...inputNodes[i].properties,

                    "dataMdFirstChildStart": [
                        inputNodes[i].children[0].position.start.line,
                        inputNodes[i].children[0].position.start.column,
                        inputNodes[i].children[0].position.start.offset].join(";")
                };

                ////console.log(inputNodes[i], ": ", inputNodes[i].properties.dataMdFirstChildStart);
            }
        }

        // Do the same for children, if any exist.
        //     We could check if there are any of type `element` before delving in, but that 
        //     would require a loop as well, i.e. be redundant.
        if (!inputNodes[i].children) continue;
        ////console.groupCollapsed("-> ", inputNodes[i].children);
        inputNodes.children = earmarkHastNodeOffsets(inputNodes[i].children);
        ////console.groupEnd();
    }

    return inputNodes;
}



function separateMdastListEndings(treeArray)
{
    for (let i = 0; i < treeArray.length; i++)
    {
        if (treeArray[i].type !== "list") continue;

        // current -> last child of current -> singular paragraph child -> actual content of last list item
        const lastChildPara = treeArray[i].children[item.children.length - 1].children[0];
        const lcContents = lastChildPara.children;
        const lcIndent = lastChildPara.position.start.column;

        if (lastChildPara.children.length <= 1
            || lcContents[lcContents.length - 2].type !== "break"
            || !RegExp(`\\s{${lcIndent + 2}}`).test(lcContents[lcContents.length - 1].value))
            continue;

        // Remove element from this spot, put it outside
        let relocated = { type: "paragraph", children: [lcContents.splice(lcContents.length - 2, 2)[1]] };

        if (i + 1 < treeArray.length)
            treeArray.splice(i + 1, 0, relocated);
        else
            treeArray.push(relocated);
    }
}

/**
 * Traverses the provided hast elements, and inserts `<br>`s to fill gaps between the end/\
 * start lines of positioned elements.
 * @param {[]} treeArray The array of elements/nodes the hast is made of (typically the `children` property of\
 *                       objects returned by {@linkcode toHast()})
 * @returns {[]} {@linkcode treeArray}, with breaks inserted to line up the positions of each element.
 */
function syncHastLinePositions(treeArray)
{
    let lastPositionedIndex, breaks = -1;

    for (let i = 0; i < treeArray.length; i++)
    {
        const pos = treeArray[i].position;
        if (!pos)
        {
            // Add one to breaks if there's a br (true/false convert to 1/0).
            //     If not, and value exists, add one for each \n in there.
            breaks += treeArray[i].tagName === "br" ||
                (treeArray[i].value?.match(/\n/gm)?.length ?? 0);

            continue;
        }

        // Only do the following once we've got an item with `position` defined behind us.
        if (lastPositionedIndex >= 0)
        {
            // Get the difference between the end of the last line and the start of current. Factor in any existing breaks.
            //     -1 because we want the lines to go in sequence; if previous end was 3, current start should be 4
            let lineDelta = (pos.start.line - 1) - treeArray[lastPositionedIndex].position.end.line - breaks;

            for (; lineDelta > 0; lineDelta--)
            {

                treeArray.splice(i, 0, { type: "element", tagName: "br", properties: {}, children: [] });
                i++;

                // If this is the last break, put a newline after it, for prettier/more proper HTML.
                //     Could alternatively put newlines between *every* <br>, but it seems nicer to have them grouped.
                if (lineDelta <= 1)
                {
                    treeArray.splice(i, 0, { type: "text", value: "\n" });
                    i++;
                }
            }

            // Reset our breaks counter; -1 because a single newline only separates elements rather than 
            // putting space between them 
            breaks = -1;
        }

        lastPositionedIndex = i;
    }

    return treeArray;
}