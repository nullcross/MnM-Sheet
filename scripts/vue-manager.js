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

function appendAttribute(target, attrName, value, prepend = false) 
{
    if (prepend) target.setAttribute(attrName, value + target.getAttribute(attrName));

    else target.setAttribute(attrName, target.getAttribute(attrName) + value);
}

// #endregion

// #region Data Classes

class Score 
{
    constructor(displayName, base = 0, extr = 0, moddedBy = null) 
    {
        this.displayName = displayName;
        this.base = base ?? 0; this.extr = extr ?? 0;
        this.moddedBy = moddedBy;
    }
}

class Skill
{
    constructor(displayName, ability, rank = 0, mods = 0, trainedOnly = false, type = null, subtypes = [])
    {
        this.displayName = displayName; this.ability = ability;
        this.rank = rank ?? 0; this.mods = mods ?? 0;
        this.trainedOnly = trainedOnly ?? false;
        this.type = type; this.subtypes = subtypes;
    }
}

// #endregion

createApp({
    setup()
    {
        const currentDisplayMode = ref(window.matchMedia("(prefers-color-scheme: dark)").matches ? themes[1] : themes[0]);

        const info = ref({
            "name": "",
            "altIdentity": "", "identSecrecy": true,
            "powerLevel": 1,
            "affiliation": "", "base": "", "debut": "",
            "size": 0, "height": "", "weight": "",
            "age": "", "skin": "", "eyes": "", "hair": "",
        });

        const stats = ref({
            main: {
                "str": new Score("Strength", 10),
                "dex": new Score("Dexterity", 10),
                "con": new Score("Constitution", 10),
                "int": new Score("Intelligence", 10),
                "wis": new Score("Wisdom", 10),
                "cha": new Score("Charisma", 10),
            },
            saves: {
                "tou": new Score("Toughness", 0, 0, "con"),
                "for": new Score("Fortitude", 0, 0, "con"),
                "ref": new Score("Reflex", 0, 0, "dex"),
                "wil": new Score("Will", 0, 0, "wis"),
            },
            conditions: {
                "staggered": false, "disabled": false,
                "unconscious": false, "dying": false,
                "fatigued": false, "exhausted": false,
            },
            other: {
                "heroPoints": 1,
                "bruises": 0, "injuries": 0,
                "attackBonus": 0, "meleeBonus": 0, "rangedBonus": 0,
                "defenseBonus": 0, "extraDodge": 0,
                "initiativePower": 0, "initiativeFeat": 0,
            },
        })

        const skills = ref({
            "acrobatics": new Skill("Acrobatics", "dex", 0, 0, true),
            "bluff": new Skill("Bluff", "cha"),
            "climb": new Skill("Climb", "str"),
            "computers": new Skill("Computers", "int", 0, 0, true),
            "concentration": new Skill("Concentration", "wis"),
            "craft": new Skill("Craft", "int", 0, 0, true, ""),
            "diplomacy": new Skill("Diplomacy", "cha"),
            "disableDevice": new Skill("Disable Device", "int", 0, 0, true),
            "disguise": new Skill("Disguise", "cha"),
            "drive": new Skill("Drive", "dex", 0, 0, true),
            "escape": new Skill("Escape Artist", "dex"),
            "gatherInfo": new Skill("Gather Info", "cha"),
            "handleAnimal": new Skill("Handle Animal", "cha"),
            "intimidate": new Skill("Intimidate", "cha"),
            "knowledge": new Skill("Knowledge", "int", 0, 0, true, ""),
            "language": new Skill("Language", " - ", 0, 0, true),
            "medicine": new Skill("Medicine", "wis"),
            "notice": new Skill("Notice", "wis"),
            "perform": new Skill("Perform", "cha", 0, 0, true, ""),
            "pilot": new Skill("Pilot", "dex", 0, 0, true),
            "profession": new Skill("Profession", "wis", 0, 0, true, ""),
            "ride": new Skill("Ride", "dex", 0, 0, true),
            "search": new Skill("Search", "int"),
            "sense": new Skill("Sense Motive", "wis"),
            "sleight": new Skill("Sleight of Hand", "dex", 0, 0, true),
            "stealth": new Skill("Stealth", "dex"),
            "survival": new Skill("Survival", "wis"),
            "swim": new Skill("Swim", "str"),
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

        function addSubtype(e, skillKey)
        {
            const thisSkill = skills.value[skillKey];
            thisSkill.subtypes.push(new Skill(
                thisSkill.displayName, thisSkill.ability, 0, 0, thisSkill.trainedOnly, "", null
            ));
        }
        function removeSubtype(e, skillKey, thisIndex)
        {
            skills.value[skillKey].subtypes.splice(thisIndex, 1);
        }


        function applyChanges(e, destination) 
        {
            destination[e.target.name] = e.target.value;
        }


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

            const targetScore = stats.value.main[scoreAbbrv] ?? stats.value.saves[scoreAbbrv] ?? stats.value.other[scoreAbbrv];
            return targetScore?.base + targetScore?.extr;
        }

        function getScoreBonus(scoreAbbrv)
        {
            if (!scoreAbbrv || scoreAbbrv.trim() === "-") return 0;

            return Math.floor((getScoreTotal(scoreAbbrv) - 10) / 2);
        }



        onMounted(() =>
        {
            setTheme(null, currentDisplayMode.value);
        })

        return {
            NumberTypes,
            info,
            stats,
            skills,
            formatNumber,

            setTheme,
            addSubtype,
            removeSubtype,
            applyChanges,
            applyParsedChanges,
            getScoreTotal,
            getScoreBonus,
        }
    }
}).mount('#app')

