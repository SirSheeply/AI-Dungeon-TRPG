/*
THIS is a sandbox area for testing, debugging, experimenting, and developing code blocks.

// Checkout the Guidebook examples to get an idea of other ways you can use scripting:
// https://help.aidungeon.com/scripting or ~/documents/scripting.md in this project
*/

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////// CONSTANTS /////////////////////////////////////////////////////////

// Constants
const AIDungeonTRPGCardType = "AIDungeonTRPG"

// Regex
const diceRegex = (/^(\d+)?d\d+([+-]\d+)?$/i);              // Checks for dice formatted string d20, 1d8, 1d8+1, etc
const hasRegex = (/(?:^|\s)#\w+/);                          // Check if there's a '#' at the start of any word (not mid-word)
const inputRegex = (/^(.*?)\s*#(\w+)([^.]*)\.?\s*(.*)$/s);  // Match: actor, #command, arguments (until .), flavor
const parenthesesWholeRegex = (/\(.*?\)/g);                 // Matches whole (parentheses)
const parenthesesInnerRegex = (/\((.*?)\)/g);               // Matches parentheses content
const asterisksQuestionRegex = (/[*?]$/);                   // Matches if a string ends with '*' or '?'
const matchSpaceRegex = (/\s+/);                            // Matches one or more whitespace characters
const matchNumberRegex = (/^\d+$/);                         // Matches a string that is entirely a number (digits only)

// Lookups
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

// Prepositions Phrases
const leadingArticles = ["a", "an", "the"];
const tailingArticles = ["from", "to", "on", "in", "at", "with"];

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////// COMMANDS REGISTRY /////////////////////////////////////////////////////

function commandRegistry(commandName) {
  const registry = [
    // <><> Game Commands
    { handler: doTry, helpText: doTryHelp, synonyms: ["try", "tries", "attempt", "attempts"], args: [] },
  ]

  // Handles searching of the command registry if needed
  if (!commandName) return registry;
  for (let entry of registry) {
    if (entry.synonyms.some(s => s === commandName || s + "s" === commandName)) {
      return entry;
    }
  }
  return null
}

function commandExtract(rawText) {
  // Match: actor, #command, arguments (until .), flavor
  rawText = rawText.replace("> ", "");
  const match = rawText.match(inputRegex);

  if (!match) return [null, null, null, null, null];

  const actorText = match[1].trim();
  const commandName = match[2].trim();
  let argumentText = match[3].trim();
  const flavorText = match[4].trim();

  // Extract all parentheticals; Merge multiple () blocks into a single string
  const metaMatches = [...argumentText.matchAll(parenthesesInnerRegex)].map(m => m[1].trim());
  const metaText = metaMatches.join(" ").trim() || null;
  argumentText = argumentText.replace(parenthesesWholeRegex, "").trim(); // Remove parentheticals
  
  return {actorText, commandName, argumentText, flavorText, metaText, rawText};
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////// STORY CARDS ////////////////////////////////////////////////////////

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
//////////////////////////////////////////////////////// ARGS PARSER ////////////////////////////////////////////////////////

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

function parseArgs(commandEntry, argumentText) {
  if (!commandEntry.args || commandEntry.args.length === 0) return [];

  // Normalize arg specs like "spell*", "character?" → { type, required }
  const argSpecs = commandEntry.args.map((spec) => {
    const specType = spec.replace(asterisksQuestionRegex, "").toLowerCase()
    return {
      type: specType,
      checker: typeCheckers.find(tc => tc.type == specType),
      required: spec.endsWith("*")
  }});

  // Split into tokens, filtering empty strings
  const tokens = argumentText.split(matchSpaceRegex).map(t => t.trim()).filter(Boolean);
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
  if (matchNumberRegex.test(tokens[0])) {
    return tokens.slice(1).join(" ")
  }

  // 2. Otherwise, trim off trailing/leading prepositions/phrases
  const words = rawText.split(matchSpaceRegex);
  while (words.length && leadingArticles.includes(words[0].toLowerCase())) {
    words.shift();
  }

  // Trim trailing stop words
  let cutoff = words.length;
  for (let i = 0; i < words.length; i++) {
    if (tailingArticles.includes(words[i].toLowerCase())) {
      cutoff = i; // stop before preposition
      break;
    }
  }

  return words.slice(0, cutoff).join(" ")
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
//////////////////////////////////////////////////// TEXT MANIPULATION //////////////////////////////////////////////////////

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
////////////////////////////////////////////////////////// DEV|CMD //////////////////////////////////////////////////////////

function doTry(commandInput) {
  // Load the character (or use default for NPC)
  return [JSON.stringify(commandInput, null, 2), false]
}

const doTryHelp = `<><> #doTry command
-- Deletes a character's story cards.
Usage: you|actor #try\n`

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////// MOCKS|INPUT ////////////////////////////////////////////////////////

function AIDungeonTRPG_initialize() {
  if(!state.TRPG) {
    state.TRPG = {}
    state.TRPG.showOutput = true
    state.TRPG.outputText = ""
    state.TRPG.prefixText = ""
    state.TRPG.postfixText = ""
  }
}

function AIDungeonTRPG_input(text, stop=false) {
  AIDungeonTRPG_initialize()
  // No "#" means no command
  if (!text.match(hasRegex)) {
    return [text, stop]
  }

  try {
    // Parse text into blocks, then find the command entry
    const commandInput = commandExtract(text)
    commandInput.commandEntry = commandRegistry(commandInput.commandName)
    commandInput.commandArgs = parseArgs(commandInput.commandEntry, commandInput.argumentText)

    // Where showInput replaces input text, and showOutput controls output display
    let [showInput, showOutput] = commandInput.commandEntry.handler(commandInput)
    if (showInput) text = showInput + commandInput.flavorText
    state.TRPG.showOutput = showOutput

  } catch (err) {
    state.TRPG.showOutput = false
    return [err.message, stop]
  }
  return [text, stop]
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////// MOCK|TEST /////////////////////////////////////////////////////////////

// MOCK AI Dungeon Stats and StoryCards
const state = {}
const storyCards = [
  {
    "keys": "",
    "description": "{\n    \"Vigor\": { \"baseValue\": 10 },\n    \"Finesse\": { \"baseValue\": 10 },\n    \"Agility\": { \"baseValue\": 10 },\n    \"Intellect\": { \"baseValue\": 10 },\n    \"Spirit\": { \"baseValue\": 10 },\n    \"Intuition\": { \"baseValue\": 10 },\n    \"Charisma\": { \"baseValue\": 10 }\n}",
    "type": "AIDungeonTRPG",
    "title": "Attributes",
    "entry": ""
  },
  {
    "keys": "",
    "description": "{\n  \"name\": \"You\",\n  \"class\": \"Adventurer\"\n}",
    "type": "Character",
    "title": "You - info",
    "entry": ""
  },
  {
    "keys": "",
    "description": "{\n  \"Strength\": 0,\n  \"Constitution\": 0,\n  \"Athletics\": 0,\n  \"Block\": 0,\n  \"Dexterity\": 0,\n  \"Accuracy\": 0,\n  \"Crafting\": 0,\n  \"Parry\": 0,\n  \"Acrobatics\": 0,\n  \"Stealth\": 0,\n  \"Dodge\": 0,\n  \"Arcana\": 0,\n  \"Science\": 0,\n  \"History\": 0,\n  \"Medicine\": 0,\n  \"Theology\": 0,\n  \"Willpower\": 0,\n  \"Clairvoyance\": 0,\n  \"Channeling\": 0,\n  \"Insight\": 0,\n  \"Perception\": 0,\n  \"Survival\": 0,\n  \"Deception\": 0,\n  \"Intimidation\": 0,\n  \"Performance\": 0,\n  \"Persuasion\": 0\n}",
    "type": "Character",
    "title": "You - skills",
    "entry": ""
  },
  {
    "keys": "",
    "description": "{\n  \"Vigor\": 10,\n  \"Finesse\": 10,\n  \"Agility\": 10,\n  \"Intellect\": 10,\n  \"Spirit\": 10,\n  \"Intuition\": 10,\n  \"Charisma\": 10\n}",
    "type": "Character",
    "title": "You - attributes",
    "entry": ""
  },
  {
    "keys": "",
    "description": "{\n    \"Strength\":         { \"attribute\": \"Vigor\", \"baseValue\": 0},\n    \"Constitution\":     { \"attribute\": \"Vigor\", \"baseValue\": 0},\n    \"Athletics\":        { \"attribute\": \"Vigor\", \"baseValue\": 0},\n    \"Block\":            { \"attribute\": \"Vigor\", \"baseValue\": 0},\n    \n    \"Dexterity\":        { \"attribute\": \"Finesse\", \"baseValue\": 0},\n    \"Accuracy\":         { \"attribute\": \"Finesse\", \"baseValue\": 0},\n    \"Crafting\":         { \"attribute\": \"Finesse\", \"baseValue\": 0},\n    \"Parry\":            { \"attribute\": \"Finesse\", \"baseValue\": 0},\n    \n    \"Acrobatics\":       { \"attribute\": \"Agility\", \"baseValue\": 0},\n    \"Stealth\":          { \"attribute\": \"Agility\", \"baseValue\": 0},\n    \"Dodge\":            { \"attribute\": \"Agility\", \"baseValue\": 0},\n    \n    \"Arcana\":           { \"attribute\": \"Intellect\", \"baseValue\": 0},\n    \"Science\":          { \"attribute\": \"Intellect\", \"baseValue\": 0},\n    \"History\":          { \"attribute\": \"Intellect\", \"baseValue\": 0},\n    \"Medicine\":         { \"attribute\": \"Intellect\", \"baseValue\": 0},\n    \"Theology\":         { \"attribute\": \"Intellect\", \"baseValue\": 0},    \n    \n    \"Willpower\":        { \"attribute\": \"Spirit\", \"baseValue\": 0},\n    \"Clairvoyance\":     { \"attribute\": \"Spirit\", \"baseValue\": 0},\n    \"Channeling\":       { \"attribute\": \"Spirit\", \"baseValue\": 0},\n    \n    \"Insight\":          { \"attribute\": \"Intuition\", \"baseValue\": 0},\n    \"Perception\":       { \"attribute\": \"Intuition\", \"baseValue\": 0},\n    \"Survival\":         { \"attribute\": \"Intuition\", \"baseValue\": 0},\n    \n    \"Deception\":        { \"attribute\": \"Charisma\", \"baseValue\": 0},\n    \"Intimidation\":     { \"attribute\": \"Charisma\", \"baseValue\": 0},\n    \"Performance\":      { \"attribute\": \"Charisma\", \"baseValue\": 0},\n    \"Persuasion\":       { \"attribute\": \"Charisma\", \"baseValue\": 0}\n}",
    "type": "AIDungeonTRPG",
    "title": "Skills",
    "entry": ""
  }
]

// MOCK player input
const playerInput1 = "> You #try to swim across the ocean." // Has no skill or attribute, should fail as command
const playerInput2 = "> You #try to swim using your atheletics." // Has a named skill
const playerInput3 = "> You #try to swim with great vigor." // Has a named attribute
const playerInput4 = "> You #try swimming with great vigor." // Alternate wording

console.log(AIDungeonTRPG_input(playerInput1))
// console.log(AIDungeonTRPG_input(playerInput2))
// console.log(AIDungeonTRPG_input(playerInput3))
// console.log(AIDungeonTRPG_input(playerInput4))