// import { createApp, ref, onMounted } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.prod.js'
import { createApp, ref, onMounted } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

// #region Helpers and Consts

const themes = [
    { "index": 0, "className": "light", "displayName": "Light", "iconSrc": "media/alessio-atzeni-sun-icon.svg" },
    { "index": 1, "className": "dark", "displayName": "Dark", "iconSrc": "media/fa-moon-solid.svg" },
];

// Enum structure taken from https://stackoverflow.com/a/44447975
const NumberTypes = Object.freeze({
    INT: Symbol("int"),
    FLOAT: Symbol("float"),
})



// Applies the default number format, i.e. the number format of the user's browser, then gets whatever the resulting separators are
const localeTestNumber = Intl.NumberFormat().format(1000.01);
const thousandsSeparator = localeTestNumber.charAt(1);
const decimalSeparator = localeTestNumber.charAt(5);

/**
 * Uses regex to turn a number formatted in the browser's locale into one javascript parsing functions can understand, 
 * then returns the result of the passed parser function.
 * @param {String} stringToParse 
 * @param {function(String):Number} parser 
 * @returns {Number} `stringToParse` as parsed by `parser`.
 */
function parseNumberInternational(stringToParse, parser)
{
    // Removes all thousands separators; unnecessary for parsing
    stringToParse = stringToParse.replace(new RegExp(`\\${thousandsSeparator}`, "g"), "");
    // Replaces all decimal separtors with `.`; this is the only decimal separator native javascript parsers accept
    stringToParse = stringToParse.replace(new RegExp(`\\${decimalSeparator}`, "g"), ".");

    return parser(stringToParse);
}

function formatNumber(num) { return typeof num === "number" ? Intl.NumberFormat().format(num) : num; }

// #endregion



createApp({
    setup()
    {
        const currentDisplayMode = ref(window.matchMedia("(prefers-color-scheme: dark)").matches ? themes[1] : themes[0]);

        const stats = ref({
            "name": "",
            "altIdentity": "",
            "identSecrecy": true,
            "powerLevel": 1,
            "affiliation": "",
            "base": "",
            "debut": "",
            "size": "",
            "height": "",
            "age": "",
            "weight": "",
            "eyes": "",
            "hair": "",

            "strBase": 10, "strExtr": 0,
            "dexBase": 10, "dexExtr": 0,
            "conBase": 10, "conExtr": 0,
            "intBase": 10, "intExtr": 0,
            "wisBase": 10, "wisExtr": 0,
            "chaBase": 10, "chaExtr": 0,

            "touBase": 0, "touExtr": 0,
            "forBase": 0, "forExtr": 0,
            "refBase": 0, "refExtr": 0,
            "wilBase": 0, "wilExtr": 0,

            "heroPoints": 1,
            "bruises": 0, "injuries": 0,
            "staggered": false, "disabled": false,
            "unconscious": false, "dying": false,
            "fatigued": false, "exhausted": false,

            "attackBonus": 0, "meleeBonus": 0, "rangedBonus": 0,
            "defenseBonus": 0, "extraDodge": 0, "sizeBonus": 0,
            "initiativePower": 0, "initiativeFeat": 0,
        });

        const skills = ref({
            "acrobatics": { "displayName": "Acrobatics", "ability": "dex", "rank": 0, "mods": 0, "trainedOnly": true, "multiples": null, },
            "bluff": { "displayName": "Bluff", "ability": "cha", "rank": 0, "mods": 0, "trainedOnly": false, "multiples": null, },
            "climb": { "displayName": "Climb", "ability": "str", "rank": 0, "mods": 0, "trainedOnly": false, "multiples": null, },
            "computers": { "displayName": "Computers", "ability": "int", "rank": 0, "mods": 0, "trainedOnly": true, "multiples": null, },
            "concentration": { "displayName": "Concentration", "ability": "wis", "rank": 0, "mods": 0, "trainedOnly": false, "multiples": null, },
            "craft": { "displayName": "Craft", "ability": "int", "rank": 0, "mods": 0, "trainedOnly": true, "multiples": [], },
            "diplomacy": { "displayName": "Diplomacy", "ability": "cha", "rank": 0, "mods": 0, "trainedOnly": false, "multiples": null, },
            "disableDevice": { "displayName": "Disable Device", "ability": "int", "rank": 0, "mods": 0, "trainedOnly": true, "multiples": null, },
            "disguise": { "displayName": "Disguise", "ability": "cha", "rank": 0, "mods": 0, "trainedOnly": false, "multiples": null, },
            "drive": { "displayName": "Drive", "ability": "dex", "rank": 0, "mods": 0, "trainedOnly": true, "multiples": null, },
            "escape": { "displayName": "Escape Artist", "ability": "dex", "rank": 0, "mods": 0, "trainedOnly": false, "multiples": null, },
            "gatherInfo": { "displayName": "Gather Info", "ability": "cha", "rank": 0, "mods": 0, "trainedOnly": false, "multiples": null, },
            "handleAnimal": { "displayName": "Handle Animal", "ability": "cha", "rank": 0, "mods": 0, "trainedOnly": false, "multiples": null, },
            "intimidate": { "displayName": "Intimidate", "ability": "cha", "rank": 0, "mods": 0, "trainedOnly": false, "multiples": null, },
            "knowledge": { "displayName": "Knowledge", "ability": "int", "rank": 0, "mods": 0, "trainedOnly": true, "multiples": [], },
            "language": { "displayName": "Language", "ability": " - ", "rank": 0, "mods": 0, "trainedOnly": true, "multiples": null, },
            "medicine": { "displayName": "Medicine", "ability": "wis", "rank": 0, "mods": 0, "trainedOnly": false, "multiples": null, },
            "notice": { "displayName": "Notice", "ability": "wis", "rank": 0, "mods": 0, "trainedOnly": false, "multiples": null, },
            "perform": { "displayName": "Perform", "ability": "cha", "rank": 0, "mods": 0, "trainedOnly": true, "multiples": [], },
            "pilot": { "displayName": "Pilot", "ability": "dex", "rank": 0, "mods": 0, "trainedOnly": true, "multiples": null, },
            "profession": { "displayName": "Profession", "ability": "wis", "rank": 0, "mods": 0, "trainedOnly": true, "multiples": [], },
            "ride": { "displayName": "Ride", "ability": "dex", "rank": 0, "mods": 0, "trainedOnly": true, "multiples": null, },
            "search": { "displayName": "Search", "ability": "int", "rank": 0, "mods": 0, "trainedOnly": false, "multiples": null, },
            "sense": { "displayName": "Sense Motive", "ability": "wis", "rank": 0, "mods": 0, "trainedOnly": false, "multiples": null, },
            "sleight": { "displayName": "Sleight of Hand", "ability": "dex", "rank": 0, "mods": 0, "trainedOnly": true, "multiples": null, },
            "stealth": { "displayName": "Stealth", "ability": "dex", "rank": 0, "mods": 0, "trainedOnly": false, "multiples": null, },
            "survival": { "displayName": "Survival", "ability": "wis", "rank": 0, "mods": 0, "trainedOnly": false, "multiples": null, },
            "swim": { "displayName": "Swim", "ability": "str", "rank": 0, "mods": 0, "trainedOnly": false, "multiples": null, },
        });



        function setTheme(e, t = "")
        {
            let targetMode;
            // If t is a display mode object, just use it
            if (t.iconSrc) targetMode = t;
            // if not, try and find a matching mode (don't waste time on empty/whitespace)
            else if (typeof t === "string" && !/^\s*$/.test(t))
                targetMode = themes.find(el => el.className === t);


            // If we've got an e with a valid currentTarget, use that, otherwise go fetch the button
            let modeButton = (e ? e.currentTarget : null) ?? document.querySelector("#toggle-theme");
            // If no target mode, take the mode directly after the current one (wrapping around with %)
            targetMode ??= themes[(currentDisplayMode.value.index + 1) % themes.length];


            document.documentElement.setAttribute("class", targetMode.className);

            modeButton.setAttribute("title", `Theme: ${targetMode.displayName} - Click to switch`);
            modeButton.setAttribute("aria-label", `Theme: ${targetMode.displayName} - Click to switch`);
            modeButton.querySelector("img").setAttribute("src", targetMode.iconSrc);

            modeButton.value = targetMode.index;
            currentDisplayMode.value = targetMode;
        }


        function applyChanges(e) { stats.value[e.target.name] = e.target.value; console.log(e.target) }


        function applyParsedChanges(e, destination, parseType, allowUnparseable = true)
        {
            let parser;
            switch (parseType)
            {
                case NumberTypes.INT:
                    parser = parseInt;
                    break;

                case NumberTypes.FLOAT:
                default:
                    parser = parseFloat;
                    break;
            }

            let parseAttempt = parseNumberInternational(e.target.value, parser);

            // If parse was successful (result is a non-NaN number), apply that to stats
            if (!Number.isNaN(+parseAttempt))
            {
                destination[e.target.name] = parseAttempt;
            }
            // If it wasn't, reset to saved value unless we allow unparsable entries
            else if (allowUnparseable)
            {
                destination[e.target.name] = e.target.value;
            }
            else
            {
                e.target.value = destination[e.target.name];
            }
        }


        function getScoreTotal(scoreAbbrv)
        {
            if (!scoreAbbrv || scoreAbbrv.trim() === "-") return 0;

            const baseKey = scoreAbbrv + "Base"
            const extrKey = scoreAbbrv + "Extr"
            return stats.value[baseKey] + stats.value[extrKey];
        }

        function getScoreBonus(scoreAbbrv)
        {
            if (!scoreAbbrv || scoreAbbrv.trim() === "-") return 0;

            const baseKey = scoreAbbrv + "Base"
            const extrKey = scoreAbbrv + "Extr"
            return Math.floor((stats.value[baseKey] + stats.value[extrKey] - 10) / 2);
        }



        onMounted(() =>
        {
            setTheme(null, currentDisplayMode.value);
        })

        return {
            NumberTypes,
            stats,
            skills,
            formatNumber,

            setTheme,
            applyChanges,
            applyParsedChanges,
            getScoreTotal,
            getScoreBonus,
        }
    }
}).mount('#app')

