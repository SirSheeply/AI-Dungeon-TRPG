/*
THIS is a sandbox area for testing, debugging, experimenting, and developing code blocks.

// Checkout the Guidebook examples to get an idea of other ways you can use scripting:
// https://help.aidungeon.com/scripting or ~/documents/scripting.md in this project
*/

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////// CONSTANTS /////////////////////////////////////////////////////////

const diceRegex = /^(\d+)?d\d+([+-]\d+)?$/i;
const advantageNames = ["normal", "advantage", "disadvantage"]
const difficultyScale = {
  "impossible": 30,
  "extreme": 25,
  "hard": 20,
  "medium": 15,
  "easy": 10,
  "effortless": 5,
  "veryeasy": 5,
  "very easy": 5,
  "automatic": 0,
  "auto": 0
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////

// Helpers for type checks
const isNumber = (t) => !isNaN(t);
const isDice = (t) => diceRegex.test(t);
const isVantage = (t) => advantageNames.some(k => k.toLowerCase() === t.toLowerCase());
const isDC = (t) => Object.keys(difficultyScale).some(k => k.toLowerCase() === t.toLowerCase());
const isBoolean = (t) => typeof t === "boolean" || (typeof t === "string" && ["true", "false"].includes(t.toLowerCase()));
const isItem = (t) => searchStoryCards({ type: "item", title: singularize(t), exactTitle: true }).length > 0;
const isSpell = (t) => searchStoryCards({ type: "spell", title: t, exactTitle: true }).length > 0;
const isCharacter = (t) => searchStoryCards({ type: "character", title: t, exactTitle: true }).length > 0;

const typeCheckers = [
  { type: "number",     fn: isNumber,     hascards: false,  fallback: false,  singularize: false },
  { type: "boolean",    fn: isBoolean,    hascards: false,  fallback: false,  singularize: false },
  { type: "dc",         fn: isDC,         hascards: false,  fallback: false,  singularize: false },
  { type: "dice",       fn: isDice,       hascards: false,  fallback: false,  singularize: false },
  { type: "vantage",    fn: isVantage,    hascards: false,  fallback: false,  singularize: false },
  { type: "item",       fn: isItem,       hascards: true,   fallback: true,   singularize: true },
  { type: "spell",      fn: isSpell,      hascards: true,   fallback: false,  singularize: false },
  { type: "character",  fn: isCharacter,  hascards: true,   fallback: false,  singularize: false }
];

function guessType(variable) {
  for (const { type, fn } of typeCheckers) {
    if (fn(variable)) return type;
  }
  return "string";
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////

function searchStoryCards({ type = null, title = null, exactType = true, exactTitle = true } = {}) {
  if (storyCards.length < 1) return [];

  const normalizedType = type ? type.toLowerCase() : null;
  const normalizedTitle = title ? title.toLowerCase() : null;

  return storyCards.filter(card => {
    let typeMatch = true;
    let titleMatch = true;

    if (normalizedType) {
      const cardType = card.type.toLowerCase();
      typeMatch = exactType ? (cardType === normalizedType) : cardType.includes(normalizedType);
    }

    if (normalizedTitle) {
      const cardTitle = card.title.toLowerCase();
      titleMatch = exactTitle ? (cardTitle === normalizedTitle) : cardTitle.includes(normalizedTitle);
    }

    return typeMatch && titleMatch;
  });
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////

function parseArgs(commandEntry, argumentText) {
  if (!commandEntry.args || commandEntry.args.length === 0) return [];

  // Normalize arg specs like "spell*", "character?" → { type, required }
  const argSpecs = commandEntry.args.map((spec) => {
    const specType = spec.replace(/[*?]$/, "").toLowerCase()
    return {
      type: specType,
      checker: typeCheckers.find(tc => tc.type == specType),
      required: spec.endsWith("*")
  }});

  // Split into tokens, filtering empty strings
  const tokens = argumentText.split(/\s+/).map(t => t.trim()).filter(Boolean);
  const results = [];

  for (const argDef of argSpecs) {
    // Consume matched tokens if we found a span
    const { value, matchedCard, span } = matchArgument(argDef, tokens, argumentText);
    if (span) tokens.splice(span[0], span[1] - span[0]);

    // Enforce required args
    if (!value && argDef.required) {
      throw new Error(`Missing required argument: ${argDef.type}`);
    }

    results.push({
      type: argDef.type,
      value: value || null,
      card: matchedCard || null,
      required: argDef.required
    });
  }

  return results;
}

// Unified matcher for arguments
function matchArgument(argDef, tokens, rawText) {
  let value = null;
  let matchedCard = null;
  let span = null;

  // 1) Storycard + multi-word handling
  if (argDef.checker.hascards) {
    const cardMatch = findBestCardMatch(argDef, tokens);
    if (cardMatch) {
      value = cardMatch.card.title;
      matchedCard = cardMatch.card;
      span = cardMatch.span;
    }
  }

  // 2) Single-token type check
  if (!value) {
    for (let i = 0; i < tokens.length; i++) {
      if (argDef.checker.fn(tokens[i]) || argDef.type === "string") {
        value = tokens[i];
        span = [i, i + 1];
        break;
      }
    }
  }

  // 3) Fallback for items
  if (!value && argDef.checker.fallback) {
    const fallback = fallbackItemExtraction(tokens, rawText);
    if (fallback) {
      value = fallback;
      const idx = tokens.findIndex(
        t => t.toLowerCase() === fallback.toLowerCase()
      );
      if (idx !== -1) span = [idx, idx + 1];
    }
  }

  return { value, matchedCard, span };
}

// Helper: find best storycard match for a given type
function findBestCardMatch(argDef, tokens) {
  if (!tokens.length) return null;

  const titles = storyCards.filter(c => c.type.toLowerCase() === argDef.type).map(c => c.title.toLowerCase());

  if (!titles.length) return null;

  // Try all n-grams from longest to shortest
  for (let n = tokens.length; n > 0; n--) {
    for (let i = 0; i <= tokens.length - n; i++) {
      let phrase = tokens.slice(i, i + n).join(" ").toLowerCase();
      if (argDef.checker.singularize) phrase = singularize(phrase)
      if (titles.includes(phrase)) {
        const card = storyCards.find(c => c.title.toLowerCase() === phrase);
        return { match: phrase, card, span: [i, i + n] };
      }
    }
  }
  return null;
}

// Smarter fallback for item names
function fallbackItemExtraction(tokens, rawText) {
  // 1. If first token is a number, separate it
  if (/^\d+$/.test(tokens[0])) {
    return tokens.slice(1).join(" ")
  }

  // 2. Otherwise, trim off trailing prepositions/phrases
  const leadingArticles = ["a", "an", "the"];
  const stopWords = ["from", "to", "on", "in", "at", "with"];
  const words = rawText.split(/\s+/);

  // Trim leading articles
  while (words.length && leadingArticles.includes(words[0].toLowerCase())) {
    words.shift();
  }

  // Trim trailing stop words
  let cutoff = words.length;
  for (let i = 0; i < words.length; i++) {
    if (stopWords.includes(words[i].toLowerCase())) {
      cutoff = i; // stop before preposition
      break;
    }
  }

  return words.slice(0, cutoff).join(" ")
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////

function singularize(word, makeSingle = true) {
  if (!word || typeof word !== 'string') return word;

  const uncountable = new Set([
    'sheep', 'fish', 'deer', 'moose', 'series', 'species', 'money',
    'rice', 'information', 'equipment', 'gold', 'bass', 'milk', 'food',
    'water', 'bread', 'sugar', 'tea', 'cheese', 'coffee', 'currency',
    'seafood', 'oil', 'software'
  ]);

  const irregular = {
    move: 'moves',
    foot: 'feet',
    goose: 'geese',
    sex: 'sexes',
    child: 'children',
    man: 'men',
    woman: 'women',
    tooth: 'teeth',
    person: 'people'
  };

  const pluralRules = [
    ['(quiz)$', '$1zes'],
    ['^(ox)$', '$1en'],
    ['(m|l)ouse$', '$1ice'],
    ['(matr|vert|ind)(ix|ex)$', '$1ices'],
    ['(x|ch|ss|sh)$', '$1es'],
    ['([^aeiouy]|qu)y$', '$1ies'],
    ['(hive)$', '$1s'],
    ['(?:([^f])fe|([lr])f)$', '$1$2ves'],
    ['(shea|lea|loa|thie)f$', '$1ves'],
    ['sis$', 'ses'],
    ['([ti])um$', '$1a'],
    ['(tomat|potat|ech|her|vet)o$', '$1oes'],
    ['(bu)s$', '$1ses'],
    ['(alias)$', '$1es'],
    ['(octop)us$', '$1i'],
    ['(ax|test)is$', '$1es'],
    ['(us)$', '$1es'],
    ['([^s]+)$', '$1s'] // fallback
  ];

  const singularRules = [
    ['(quiz)zes$', '$1'],
    ['(matr)ices$', '$1ix'],
    ['(vert|ind)ices$', '$1ex'],
    ['^(ox)en$', '$1'],
    ['(alias)es$', '$1'],
    ['(octop|vir)i$', '$1us'],
    ['(cris|ax|test)es$', '$1is'],
    ['(shoe)s$', '$1'],
    ['(o)es$', '$1'],
    ['(bus)es$', '$1'],
    ['(m|l)ice$', '$1ouse'],
    ['(x|ch|ss|sh)es$', '$1'],
    ['(m)ovies$', '$1ovie'],
    ['(s)eries$', '$1eries'],
    ['([^aeiouy]|qu)ies$', '$1y'],
    ['([lr])ves$', '$1f'],
    ['(tive)s$', '$1'],
    ['(hive)s$', '$1'],
    ['(li|wi|kni)ves$', '$1fe'],
    ['(shea|loa|lea|thie)ves$', '$1f'],
    ['(^analy)ses$', '$1sis'],
    ['((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$', '$1$2sis'],
    ['([ti])a$', '$1um'],
    ['(n)ews$', '$1ews'],
    ['(h|bl)ouses$', '$1ouse'],
    ['(corpse)s$', '$1'],
    ['(us)es$', '$1'],
    ['s$', ''] // fallback
  ];

  const lower = word.toLowerCase();
  if (uncountable.has(lower)) return word;

  // Irregulars
  for (const key in irregular) {
    const pattern = makeSingle
      ? new RegExp(`^${irregular[key]}$`, 'i')
      : new RegExp(`^${key}$`, 'i');
    if (pattern.test(word)) {
      return word.replace(pattern, makeSingle ? key : irregular[key]);
    }
  }

  const rules = makeSingle ? singularRules : pluralRules;
  for (const [rule, replacement] of rules) {
    const pattern = new RegExp(rule, 'i');
    if (pattern.test(word)) {
      return word.replace(pattern, replacement);
    }
  }

  return word;
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////

const storyCards = []
storyCards.push({title:"fireball", type:"spell"})
storyCards.push({title:"goblin", type:"character"})
storyCards.push({title:"orange", type:"item"})

const registry = [
    // <><> Core Commands
    { handler: "doTry",     helpText: "doTryHelp",      synonyms: ["try", "tries"],       args: ["skill*"] },
    { handler: "doCast",    helpText: "doCastHelp",     synonyms: ["cast", "activate"],   args: ["spell*", "number?", "character?"] },
    { handler: "doAttack",  helpText: "doAttackHelp",   synonyms: ["attack"],             args: ["item?", "character?"] },

    // <><> Item Commands
    { handler: "doTrade",    helpText: "doTradeHelp",   synonyms: ["buy", "sell", "trade"],   args: ["item*", "number?", "item*", "number?"] },
    { handler: "doDrop",     helpText: "doDropHelp",    synonyms: ["drop", "remove"],         args: ["item*", "number?"] },
    { handler: "doTake",     helpText: "doTakeHelp",    synonyms: ["take", "pocket"],         args: ["item*", "number?"] }
]

const argumentText1 = "a magic spell at the goblin, sending a lvl 1 fireball at it's head"
const argumentText2 = "fireball at level 1 at the goblin"
const argumentText3 = "fireball at the goblin"
const argumentText4 = "fireball at the skeleton"
const argumentText5 = "a spell"

const argumentText6 = "the orange"
const argumentText7 = "10 oranges"
const argumentText8 = "a sword"
const argumentText9 = "sean's sword from the desk."

try {
  console.log(parseArgs(registry[1], argumentText1));
  console.log(parseArgs(registry[1], argumentText2));
  console.log(parseArgs(registry[1], argumentText3));
  console.log(parseArgs(registry[1], argumentText4));
  // console.log(parseArgs(registry[0], argumentText5));
  console.log("\n")
  console.log(parseArgs(registry[5], argumentText6));
  console.log(parseArgs(registry[5], argumentText7));
  console.log(parseArgs(registry[5], argumentText8));
  console.log(parseArgs(registry[5], argumentText9));
} catch (e) {
  console.error(e.message);
}