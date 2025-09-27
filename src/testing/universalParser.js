/*
THIS is sandbox area for testing, debugging, experimenting, and developing code blocks.

// Checkout the Guidebook examples to get an idea of other ways you can use scripting:
// https://help.aidungeon.com/scripting or ~/documents/scripting.md in this project
*/

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////// CONSTANTS /////////////////////////////////////////////////////////

// Keywords
const attributesKeyword = "attributes"
const skillsKeyword = "skills"
const infoKeyword = "info"
const difficultyKeyword = "difficulty"

// Constants
const TRPGCardType = "TRPG"
const TRPGCharacterType = `${TRPGCardType} - character`
const TRPGAttributeType = `${TRPGCardType} - ${attributesKeyword}`
const TRPGSkillType = `${TRPGCardType} - ${skillsKeyword}`
const TRPGDifficultyType = `${TRPGCardType} - ${difficultyKeyword}`
const TRPGItemType = `${TRPGCardType} - item`

// Regex
const hasRegex = (/(?:^|\s)#\w+/);                          // Check if there's a '#' at the start of any word (not mid-word)
const inputRegex = (/^(.*?)\s*#(\w+)([^.]*)\.?\s*(.*)$/s);  // Match: actor, #command, arguments (until .), flavor
const parenthesesWholeRegex = (/\(.*?\)/g);                 // Matches whole (parentheses)
const parenthesesInnerRegex = (/\((.*?)\)/g);               // Matches parentheses content
const matchSpaceRegex = (/\s+/);                            // Matches one or more whitespace characters
const matchNumberRegex = (/^\d+$/);                         // Matches a string that is entirely a number (digits only)
const specMatch = (/^([a-zA-Z0-9_]+)([*?])(.*)$/)           // Matches spec*type|type for command argument format

// Lookups
const metaArgs = ["difficulty?difficulty|number", "vantage?vantage"] // Used to parse meta args in input
const advantageNames = ["advantage", "disadvantage"]

// Prepositions Phrases
const leadingArticles = ["a", "an", "the"];
const tailingArticles = ["from", "to", "on", "in", "at", "with"];

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////// INITIALIZER ////////////////////////////////////////////////////////

function AIDungeonTRPG_initialize() {
  if(!state.TRPG) {
    state.TRPG = {}
    state.TRPG.showOutput = true
    state.TRPG.outputText = ""
    state.TRPG.prefixText = ""
    state.TRPG.postfixText = ""
  }
  state.TRPG.config = {
    defaultDifficulty: 10,      // Difficulty of checks when not specified in commands
    defaultCheckDice: 20,       // Dice / Range to use for making checks
    showRolls: true,            // Enables/Disables the dice result text being displayed
    showExp: true,              // Enables/Disables the exp text being displayed
    actionExp: 100,             // Base amount of EXP rewarded for successful actions
  }
  // enforceConfig() // Load config changes from story cards (Not needed in Mock)

  // Load Story Card Configs
  state.TRPG.attributes = Object.fromEntries(searchStoryCards({type:TRPGAttributeType}).map(card => [card.title, JSON.parse(card.description)]));
  state.TRPG.skills = Object.fromEntries(searchStoryCards({type:TRPGSkillType}).map(card => [card.title, JSON.parse(card.description)]));
  state.TRPG.difficultyScale = JSON.parse(searchStoryCards({type:TRPGDifficultyType})[0].description);
}

function enforceConfig() {
  // Get config story card or create one
  const configTitle = `${TRPGCardType} - CONFIG`
  const configCardIndex = storyCards.findIndex(card => card.title.toLowerCase() === configTitle.toLowerCase() && card.type === TRPGCardType);
  if (configCardIndex >= 0) {
    try {
      const newSettings = JSON.parse(storyCards[configCardIndex].entry)
      Object.keys(newSettings).forEach(key => { state.TRPG.config[key] = validateType(newSettings[key], state.TRPG.config[key]) });
    } catch (error) {
      updateStoryCard(configCardIndex, "", JSON.stringify(state.TRPG.config, null, 2), TRPGCardType, configTitle, "")
    }
  } else {
    addStoryCard("", JSON.stringify(state.TRPG.config, null, 2), TRPGCardType, configTitle, "")
  }
}

function validateType(value, expectedValue) {
  if (typeof value !== typeof expectedValue) {
    if (typeof expectedValue === "boolean") {
      return Boolean(value) || expectedValue;
    }
    if (typeof expectedValue === "number" && !isNaN(value)) {
      return Number(value) || expectedValue;
    }
    return expectedValue
  }
  return value
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// UTILITY //////////////////////////////////////////////////////////

/**
* Generates a random integer between the specified minimum and maximum values, inclusive.
* @function
* @param {number} min - The lower bound (inclusive).
* @param {number} max - The upper bound (inclusive).
* @returns {number} A random integer between min and max.
*/
function getRandomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
* Generates a random floating-point number between the specified minimum and maximum values.
* @function
* @param {number} min - The lower bound (inclusive).
* @param {number} max - The upper bound (exclusive).
* @returns {number} A random float between min (inclusive) and max (exclusive).
*/
function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////// COMMANDS REGISTRY /////////////////////////////////////////////////////

function commandRegistry(commandName) {
  const registry = [
    // <><> Core Commands
    { handler: doHelp,        helpText: doHelpHelp,        args: [],                               synonyms: ["help"]  },
    { handler: doReset,       helpText: doResetHelp,       args: [],                               synonyms: ["reset"]  },

    // <><> Char Commands
    { handler: doNewChar,     helpText: doNewCharHelp,     args: [],                               synonyms: ["newchar"]  },
    { handler: doDeleteChar,  helpText: doDeleteCharHelp,  args: [],                               synonyms: ["delchar"]  },

    // <><> Game Commands
    { handler: doTry,         helpText: doTryHelp,         args: ["checkType*attributes|skills"],  synonyms: ["try", "attempt"] },
    { handler: doTake,        helpText: doTakeHelp,        args: ["amount?number", "item*item"],   synonyms: ["take", "steal", "get", "grab", "receive", "pocket", "bag", "stow"] },
    { handler: doDrop,        helpText: doDropHelp,        args: ["amount?number", "item*item"],   synonyms: ["discard", "drop", "leave", "dispose", "trash", "donate", "eat", "consume", "use", "drink", "pay", "lose"] },
  ]

  // Handles searching of the command registry if needed
  if (!commandName) return registry;
  for (let entry of registry) {
    if (entry.synonyms.some(s => s === commandName || singularize(s, false) === commandName)) {
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

  // Parse Command Args, and Load Character
  const character = loadCharacter(actorText)
  const commandEntry = commandRegistry(commandName)
  const parsedArgs = parseArgs(commandEntry.args, argumentText)
  const parsedMeta = parseArgs(metaArgs, metaText)
  
  return {
    actorText,    // Raw text containing character name / actor
    character,    // Loaded character from the actorText (defaults to blank)
    commandName,  // #command being called
    commandEntry, // Command Registery Entry determined for the #commandName
    argumentText, // Raw text potentially containing arguments for the command
    parsedArgs,   // Parsed argumentText into named arguments for use in the command
    flavorText,   // Flavor text after period in player input
    metaText,     // Raw meta text which was in ()
    parsedMeta,   // Parsed metaText () into variables (dc, vantage)
    rawText       // Raw unedit player input text
  };
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
const isVantage = (t) => advantageNames.some(k => k.toLowerCase() === t.toLowerCase());
const isDC = (t) => Object.keys(state.TRPG.difficultyScale).some(k => k.toLowerCase() === t.toLowerCase());
const isBoolean = (t) => typeof t === "boolean" || (typeof t === "string" && ["true", "false"].includes(t.toLowerCase()));
const isItem = (t) => searchStoryCards({ type: TRPGItemType, title: singularize(t) }).length > 0;
const isSpell = (t) => searchStoryCards({ type: "spell", title: t }).length > 0;
const isCharacter = (t) => validateCharacter(t);
const isAttribute = (t) => Object.keys(state.TRPG.attributes).some(k => k.toLowerCase() === t.toLowerCase());
const isSkill = (t) => Object.keys(state.TRPG.skills).some(k => k.toLowerCase() === t.toLowerCase());

const typeCheckers = [
  { type: "number",          fn: isNumber,     hascards: false,  fallback: false,  singularize: false },
  { type: "boolean",         fn: isBoolean,    hascards: false,  fallback: false,  singularize: false },
  { type: difficultyKeyword, fn: isDC,         hascards: false,  fallback: false,  singularize: false },
  { type: "vantage",         fn: isVantage,    hascards: false,  fallback: false,  singularize: false },
  { type: "item",            fn: isItem,       hascards: true,   fallback: true,   singularize: true },
  { type: "spell",           fn: isSpell,      hascards: true,   fallback: false,  singularize: false },
  { type: "character",       fn: isCharacter,  hascards: true,   fallback: false,  singularize: false },
  { type: attributesKeyword, fn: isAttribute,  hascards: true,   fallback: false,  singularize: false },
  { type: skillsKeyword,     fn: isSkill,      hascards: true,   fallback: false,  singularize: false }
];

function guessType(variable) {
  for (const { type, fn } of typeCheckers) {
    if (fn(variable)) return type;
  }
  return "string";
}

function parseArgs(commandArgs, argumentText) {
  if (!commandArgs || commandArgs.length === 0 || !argumentText) return [];

  // Normalize arg specs like "buyItem*item", "amount?number", "check*skill|attribute"
  const argSpecs = commandArgs.map((spec) => {
    const match = spec.match(specMatch);
    if (!match) { throw new Error(`Invalid argument spec: ${spec}`); }
    const [, argName, marker, types] = match;
    return {
      argName: argName,
      types: types.split("|").map(t => t.toLowerCase().trim()).filter(Boolean),
      required: marker === "*"
  }})

  // Split into tokens, filtering empty strings
  const tokens = argumentText.split(matchSpaceRegex).map(t => t.trim()).filter(Boolean);
  const results = {};

  for (const argDef of argSpecs) {
    // Consume matched tokens if we found a span
    const { value, matchedCard, matchType, span } = matchArgument(argDef, tokens);
    if (span) tokens.splice(span[0], span[1] - span[0]);

    // Enforce required args
    if (!value && argDef.required) {
      throw new Error(`Missing required argument: ${argDef.argName}`);
    }

    results[argDef.argName] = {
      type: matchType,
      value: value || null,
      card: matchedCard ? JSON.parse(matchedCard.description) : null,
      required: argDef.required
    }
  }

  return results;
}

// Unified matcher for arguments
function matchArgument(argDef, tokens) {
  let value = null;
  let matchedCard = null;
  let matchType = null;
  let span = null;
  
  // Check All Types
  for (const type of argDef.types) {
    const checker = typeCheckers.find(tc => tc.type == type)
    
    // 1) Storycard + multi-word handling
    if (checker.hascards) {
      const cardMatch = findBestCardMatch(type, checker, tokens);
      if (cardMatch) {
        value = cardMatch.card.title;
        matchedCard = cardMatch.card;
        span = cardMatch.span;
        matchType = type;
      }
    }

    // 2) Single-token type check
    if (!value) {
      for (let i = 0; i < tokens.length; i++) {
        if (checker.fn(tokens[i]) || type === "string") {
          value = tokens[i];
          span = [i, i + 1];
          matchType = type === "string" ? "string" : type;
          break;
        }
      }
    }

    // 3) Fallback for items
    if (!value && checker.fallback) {
      const fallback = fallbackItemExtraction(tokens);
      if (fallback) {
        value = fallback;
        const idx = tokens.findIndex(
          t => t.toLowerCase() === fallback.toLowerCase()
        );
        if (idx !== -1) span = [idx, idx + 1];
        matchType = type;
      }
    }
  }
  
  return { value, matchedCard, matchType, span };
}

// Helper: find best storycard match for a given type
function findBestCardMatch(type, checker, tokens) {
  if (!tokens.length) return null;

  const titles = storyCards.filter(c => c.type.toLowerCase() === `${TRPGCardType} - ${type}`.toLowerCase()).map(c => c.title.toLowerCase());

  if (!titles.length) return null;

  // Try all n-grams from longest to shortest
  for (let n = tokens.length; n > 0; n--) {
    for (let i = 0; i <= tokens.length - n; i++) {
      let phrase = tokens.slice(i, i + n).join(" ").toLowerCase();
      if (checker.singularize) phrase = singularize(phrase)
      if (titles.includes(phrase)) {
        const card = storyCards.find(c => c.title.toLowerCase() === phrase);
        return { match: phrase, card, span: [i, i + n] };
      }
    }
  }
  return null;
}

// Smarter fallback for item names
function fallbackItemExtraction(tokens) {
  let words = [...tokens]; // default to cleaned tokens

  // 1. If first token is a number, drop it
  if (matchNumberRegex.test(words[0])) {
    words.shift();
  }

  // 2. Remove leading articles
  while (words.length && leadingArticles.includes(words[0].toLowerCase())) {
    words.shift();
  }

  // 3. Remove trailing prepositional phrases
  let cutoff = words.length;
  for (let i = 0; i < words.length; i++) {
    if (tailingArticles.includes(words[i].toLowerCase())) {
      cutoff = i;
      break;
    }
  }

  return words.slice(0, cutoff).join(" ");
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
    move: 'moves', foot: 'feet', goose: 'geese',
    sex: 'sexes', child: 'children', man: 'men',
    woman: 'women', tooth: 'teeth', person: 'people'
  };

  const pluralRules = [
    ['(quiz)$', '$1zes'], ['^(ox)$', '$1en'], ['(m|l)ouse$', '$1ice'],
    ['(matr|vert|ind)(ix|ex)$', '$1ices'], ['(x|ch|ss|sh)$', '$1es'],
    ['([^aeiouy]|qu)y$', '$1ies'], ['(hive)$', '$1s'],
    ['(?:([^f])fe|([lr])f)$', '$1$2ves'], ['(shea|lea|loa|thie)f$', '$1ves'],
    ['sis$', 'ses'], ['([ti])um$', '$1a'], ['(tomat|potat|ech|her|vet)o$', '$1oes'],
    ['(bu)s$', '$1ses'], ['(alias)$', '$1es'], ['(octop)us$', '$1i'],
    ['(ax|test)is$', '$1es'], ['(us)$', '$1es'], ['([^s]+)$', '$1s'] // fallback
  ];

  const singularRules = [
    ['(quiz)zes$', '$1'], ['(matr)ices$', '$1ix'], ['(vert|ind)ices$', '$1ex'],
    ['^(ox)en$', '$1'], ['(alias)es$', '$1'], ['(octop|vir)i$', '$1us'],
    ['(cris|ax|test)es$', '$1is'], ['(shoe)s$', '$1'], ['(o)es$', '$1'],
    ['(bus)es$', '$1'], ['(m|l)ice$', '$1ouse'], ['(x|ch|ss|sh)es$', '$1'],
    ['(m)ovies$', '$1ovie'], ['(s)eries$', '$1eries'], ['([^aeiouy]|qu)ies$', '$1y'],
    ['([lr])ves$', '$1f'], ['(tive)s$', '$1'], ['(hive)s$', '$1'],
    ['(li|wi|kni)ves$', '$1fe'], ['(shea|loa|lea|thie)ves$', '$1f'], ['(^analy)ses$', '$1sis'],
    ['((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$', '$1$2sis'],
    ['([ti])a$', '$1um'], ['(n)ews$', '$1ews'], ['(h|bl)ouses$', '$1ouse'],
    ['(corpse)s$', '$1'], ['(us)es$', '$1'], ['s$', ''] // fallback
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
/////////////////////////////////////////////////////// CORE COMMANDS ///////////////////////////////////////////////////////

function allCommandsHelp() {
  let textBuilder = "This is a list of all commands, and their synonyms:\n\n"
  for (let entry of commandRegistry()) {
    textBuilder += `#${entry.synonyms[0]}\n[${entry.synonyms.join(", ")}]\n\n`
  }
  textBuilder += "You can use #help followed by a command name for specific info; e.g. '#help help'.\n\n"
  return textBuilder
}

function doHelp(inputMaster) {
  const helpType = inputMaster.argumentText
  const cmdEntry = commandRegistry(helpType)
  if (helpType != "" && cmdEntry != null) {
    state.TRPG.outputText = `${cmdEntry.helpText}\nSynonyms: [${cmdEntry.synonyms.join(", ")}]`
  } else {
    state.TRPG.outputText = allCommandsHelp()
  }
  return [null, true]
}

const doHelpHelp = `<><> #help command
-- Displays help information for a specific command.
-- OR synonym list for all commands, if none specified.
-- I see you're already a master of the help command ;)
Usage: #help (command)\n`

function doReset(inputMaster) {
  state.TRPG = null
  return ["AIDungeonTRPG has been reset!", false]
}

const doResetHelp = `<><> #reset command
-- DANGER! This will delete all AIDungeonTRPG state data.
-- Story cards will not be impacted.
Usage: #reset\n`

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
//////////////////////////////////////////////////// CHARACTER COMMANDS /////////////////////////////////////////////////////

function characterTemplate(name) {
  return {
    info: {
      name: name.trim(),
      class: "Adventurer",
      level: 0
    },
    attributes: Object.fromEntries(searchStoryCards({type:TRPGAttributeType}).map(card => [card.title, JSON.parse(card.description)])),
    skills: Object.fromEntries(searchStoryCards({type:TRPGSkillType}).map(card => [card.title, JSON.parse(card.description)])),
    inventory: {}
  };
}

function loadCharacter(name) {
  // Create a new blank character to fill
  const character = characterTemplate(name)

  // Load and Normalize character attributes
  const attributesCard = searchStoryCards({type: TRPGCharacterType, title: `${name} - ${attributesKeyword}`})
  if (attributesCard.length > 0) {
    try {
      const attCardContent = JSON.parse(attributesCard[0].description)
      for (const fieldKey in character[attributesKeyword]) {
        character[attributesKeyword][fieldKey] = attCardContent[fieldKey]
        addExperience(character, 0, attributesKeyword, fieldKey)
      }
    } catch {
      throw new Error(`"${name} - ${attributesKeyword}" card entry is invalid JSON!`)
    }
  }

  // Load and Normalize character skills
  const skillsCard = searchStoryCards({type: TRPGCharacterType, title: `${name} - ${skillsKeyword}`})
  if (skillsCard.length > 0) {
    try {
      const skillCardContent = JSON.parse(skillsCard[0].description)
      for (const fieldKey in character[skillsKeyword]) {
        character[skillsKeyword][fieldKey] = skillCardContent[fieldKey]
        addExperience(character, 0, skillsKeyword, fieldKey, character[skillsKeyword][fieldKey].attribute)
      }
    } catch {
      throw new Error(`"${name} - ${skillsKeyword}" card entry is invalid JSON!`)
    }
  }

  // Laod inventory (a simple full load of inventory card for now)
  character.inventory = Object.fromEntries(searchStoryCards({type:TRPGCharacterType, title:`${name} - inventory`}).map(card => [card.title, JSON.parse(card.description)]))

  // Update story cards to be consistent (characters with cards only)
  if(validateCharacter(name)) updateCharacter(character)
  return character
}

function updateCharacter(character) {
  for (const sectionKey in character) {
    const cardName = `${character.info.name} - ${sectionKey}`.toLowerCase()
    const cardIndex = storyCards.findIndex(card => card.title.toLowerCase() === cardName && card.type === TRPGCharacterType);
    if (cardIndex < 0) throw new Error(`Error: Missing character ${sectionKey} card for ${character.info.name}`)
    const cardContent = JSON.stringify(character[sectionKey], null, 2);
    updateStoryCard(cardIndex, "", "", TRPGCharacterType, cardName, cardContent);
  }
}

function doNewChar(inputMaster) {
  // Validate character name
  const name = inputMaster.actorText?.trim();
  if (!name) throw new Error("Error: No character name detected!");

  // Setup new character template
  const newCharacter = characterTemplate(name);

  // Prevent duplicate characters
  for (const sectionKey in newCharacter) {
    if (validateCharacter(name)) {
      throw new Error(`Error: Character ${sectionKey} already exists!`);
    }
  }

  // Create story cards
  for (const sectionKey in newCharacter) {
    const cardName = `${name} - ${sectionKey}`;
    const cardContent = JSON.stringify(newCharacter[sectionKey], null, 2);
    addStoryCard("", "", TRPGCharacterType, cardName, cardContent);
  }

  return [`Character '${name}' has been created!`, false];
}

const doNewCharHelp = `<><> #newChar command
-- Creates a new blank character with story cards.
Usage: character_name #newChar\n`

function doDeleteChar(inputMaster) {
  // Check for a valid character name
  const name = inputMaster.actorText?.trim();
  if (!name) throw new Error("Error: No character name detected!");

  // Setup new character template
  const newCharacter = characterTemplate(name)

  // Check that character cards do not exist
  for (const sectionKey in newCharacter) {
    const searchTitle = `${name} - ${sectionKey}`.toLowerCase()
    const cardIndex = storyCards.findIndex(card => card.title.toLowerCase() === searchTitle && card.type === TRPGCharacterType);
    if (cardIndex >= 0) removeStoryCard(cardIndex)
  }

  return [`Character '${name}' has been deleted!`, false]
}

const doDeleteCharHelp = `<><> #delChar command
-- Deletes a character's story cards.
Usage: character_name #delChar\n`

function validateCharacter(name) {
  if (!name) return false
  for (const sectionKey in characterTemplate(name)) {
    if (searchStoryCards({ type: TRPGCharacterType, title: `${name} - ${sectionKey}`}).length <= 0) {
      return false
    }
  }
  return true
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////// ATTRIBUTE MOD ///////////////////////////////////////////////////////

function getAttributeMod(character, attributeName) {
  const attributeBase = state.TRPG.attributes[attributeName].level
  const charAttribute = character[attributesKeyword][attributeName].level
  return Math.floor((charAttribute - attributeBase) / 2)
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////// EXP|LVL //////////////////////////////////////////////////////////

function getExpForLevel(level) {
  // This gives the level progression of: 1=300, 2=1000, 3=2200, 5=7700, 10=53000, 20=406000
  // OR actions based on actionXP of 100: 1=3  , 2=10  , 3=22  , 5=77  , 10=530  , 20=4060
  return Math.floor(Math.round((level ** 3) * 50 + (level*300)) / 100)*100;
}

function addExperience(character, exp, statType, statValue, statAttribute=null) {
  const possessiveName = character.info.name.toLowerCase() == "you" ? "Your" : character.info.name+"'s"
  let expText = `[${possessiveName} ${statValue} has gained ${exp}xp`

  // Calculate total exp for current level (minus base for attributes)
  const statObject = character[statType][statValue]
  let statLevel = statObject.level
  let baseLevel = 0
  if (statType == attributesKeyword) {
    baseLevel = state.TRPG.attributes[statValue].level
    statLevel -= baseLevel
  }
  const totalExp = getExpForLevel(statLevel) + statObject.exp + exp
  
  // Apply and Handle leveling up and leveling down
  let levelAdjustment = 0
  while (totalExp >= getExpForLevel(statLevel+levelAdjustment+1)) { levelAdjustment += 1 }
  while (totalExp <= getExpForLevel(statLevel+levelAdjustment-1)) { levelAdjustment -= 1 }
  if (levelAdjustment != 0) {
    statObject.level += levelAdjustment
    if (statObject.level < 0) statObject.level = 0
    expText += `; ${statValue} is now level ${statObject.level}`
  }

  // Apply EXP and ensure non-negative
  statObject.exp = totalExp - getExpForLevel(statObject.level-baseLevel)
  if (statObject.exp < 0) statObject.exp = 0
  expText += `; ${getExpForLevel(statObject.level-baseLevel+1)-statObject.exp}xp until next level]`

  // Handle attributes if one was provided
  if(statAttribute != null) {
    const attributeExp = Math.floor(exp*0.5)
    expText += "\n"+addExperience(character, attributeExp, attributesKeyword, statAttribute)
  }

  // Handle overall character level
  const newLevel = characterLevel(character)
  if (character[infoKeyword].level != newLevel) {
    expText += `\n[${possessiveName} level has increase to ${newLevel}!]`
  }
  character[infoKeyword].level = newLevel
  // Handle text result
  return expText
}

function characterLevel(character) {
  let sum = 0
  for (attribute in character[attributesKeyword]) {
    const base = state.TRPG.attributes[attribute].level
    sum += character[attributesKeyword][attribute].level - base || 0
  }
  const K = Object.values(character[attributesKeyword]).length;
  return Math.floor(sum / K);
}

function determineExp(score, success, difficulty) {
  const config = state.TRPG.config
  const baseExp = config.actionExp * (difficulty / (config.defaultCheckDice/2));
  
  if (score == 1 || score < difficulty/2) return 0
  if (score == config.defaultCheckDice) return baseExp*2
  if (!success) return Math.floor(baseExp * 0.1)
  if (score <= difficulty) return baseExp
  
  const bonus = Math.min(1.5, score / difficulty)
  return Math.floor(baseExp*bonus)
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////// TRY COMMAND ////////////////////////////////////////////////////////

function doTry(inputMaster) {
  const config = state.TRPG.config
  const checkType = inputMaster.parsedArgs.checkType
  const character = inputMaster.character
  
  // Calculate the check mods
  let checkMod = character[checkType.type][checkType.value].level
  if (checkType.type == skillsKeyword) {
    checkMod += getAttributeMod(character, checkType.card.attribute)
  }

  // Roll dice
  const diceRoll1 = getRandomInteger(1, config.defaultCheckDice)
  const diceRoll2 = getRandomInteger(1, config.defaultCheckDice)

  // Check Difficulty
  const vantage = inputMaster.parsedMeta.vantage?.value ?? null
  const difficulty = inputMaster.parsedMeta.difficulty?.value ?? config.defaultDifficulty

  const advScore = vantage?.toLowerCase() == "advantage" ? Math.max(diceRoll1, diceRoll2) : null
  const disScore = vantage?.toLowerCase() == "disadvantage" ? Math.min(diceRoll1, diceRoll2) : null

  const score = vantage ? advScore ?? disScore : diceRoll1
  const success = score == config.defaultCheckDice ? true : score == 1 ? false : (score + checkMod >= difficulty)

  // Result
  const critText = score == config.defaultCheckDice ? "critical " : score == 1 ? "critically " : ""
  const successText = success ? `with ${critText}success` : `but ${critText}failed`
  const resultText = `${character.info.name} ${inputMaster.commandName} ${inputMaster.argumentText}, ${successText}.`

  // Show Dice Roll
  if (state.TRPG.config.showRolls) {
    const diceText = vantage ? `(${diceRoll1} | ${diceRoll2}) at ${vantage}` : `${diceRoll1}`
    state.message = `[Roll: ${diceText} + ${checkMod} vs ${difficulty} -- ACTION ${success ? "SUCCEEDED" : "FAILED"}]`
  }

  // Add actionXP for skill leveling (save only for existing characters)
  const expGained = determineExp(score, success, difficulty)
  const expText = addExperience(character, expGained, checkType.type, checkType.value, checkType.card.attribute ?? null)
  if (validateCharacter(character.info.name)) updateCharacter(character);
  if (config.showExp && expGained != 0) { state.message += "\n"+expText }

  return [resultText, true]
}

const doTryHelp = `<><> #try command
-- Performs a check by rolling 1d20 against a difficulty.
-- Uses a character's attribute or skill modifier if one is named.
-- If no attribute or skill is given, the roll is made as a general check.
-- Difficulty (DC) and advantage/disadvantage may be defined in meta info ().
-- If advantage/disadvantage is not given, the roll is normal.
-- If the actor is not a character, default attribute|skill values are used.
-- If difficulty is not given, the config default is used.
-- Roll results are prefixed to AI Dungeon output (can be disabled in config).
-- The task/argument text is free form, but arguments are parsed in order.
-- Anything after a period is falvor text and not parsed in the command.
Usage: you|actor #try ... attribute|skill ... (DC advantage/disadvantage)\n.`

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
/////////////////////////////////////////////////// INVENTORY  MANAGEMENT ///////////////////////////////////////////////////

function newItem(card=null) {
  return {
    category: card ? card.category : "junk",
    rarity: card ? card.rarity : 1.0,
    amount: card ? card.amount : 1,
    level: card ? card.level : 0,
    dmgType: card ? card.dmgType : "none",
  }
}

function doTake(inputMaster) {
  const character = inputMaster.character
  const item = newItem(inputMaster.parsedArgs.item.card)
  const itemName = singularize(inputMaster.parsedArgs.item.value.toLowerCase())
  const itemAmnt = inputMaster.parsedArgs.amount.value ?? item.amount
  const invItem = character.inventory[itemName]
  if (invItem) invItem.amount += itemAmnt
  else {
    character.inventory[itemName] = item
    character.inventory[itemName].amount = itemAmnt
  }
  // Handle take text output
  const hasWord = character.info.name.toLowerCase() == "you" ? "have" : "has"
  const qtyName = character.inventory[itemName].amount > 1 ? singularize(itemName, false) : itemName
  state.message = `${character.info.name} ${hasWord} ${character.inventory[itemName].amount} ${qtyName}`
  const takeText = `${character.info.name} ${inputMaster.commandName} ${inputMaster.argumentText}`
  return [takeText, true]
}

const doTakeHelp = `<><> #take command
-- Adds an instance of the specified item(s) to the character's inventory.
-- (quantity) is optional, defaults to one.
Usage: you|actor #take (quantity) item_name\n`

function doDrop(inputMaster) {
  const character = inputMaster.character
  const item = newItem(inputMaster.parsedArgs.item.card)
  const itemName = singularize(inputMaster.parsedArgs.item.value.toLowerCase())
  const itemAmnt = inputMaster.parsedArgs.amount.value ?? item.amount
  const invItem = character.inventory[itemName]
  if (invItem) {
    invItem.amount -= itemAmnt
    if (invItem.amount <= 0)
      delete character.inventory[itemName]
  }
  // Handle take text output
  const hasWord = character.info.name.toLowerCase() == "you" ? "have" : "has"
  const qtyName = character.inventory[itemName]?.amount > 1 ? singularize(itemName, false) : itemName
  state.message = `${character.info.name} ${hasWord} ${character.inventory[itemName]?.amount || "zero"} ${qtyName}`
  const takeText = `${character.info.name} ${inputMaster.commandName} ${inputMaster.argumentText}`
  return [takeText, true]
}

const doDropHelp = `<><> #drop command
-- Removes an instance of the specified item(s) from the character's inventory.
-- (quantity) is optional, defaults to one.
Usage: you|actor #drop (quantity) item_name\n`

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////// OUTPUT|INPUT ////////////////////////////////////////////////////////

function AIDungeonTRPG_input(text, stop=false) {
  state.message = "" // Clear the message bank
  AIDungeonTRPG_initialize()
  // No "#" means no command
  if (!text.match(hasRegex)) {
    return [text, stop]
  }

  //try { // Need error line for mock debugging
    // Parse text into blocks, then find the command entry
    const inputMaster = commandExtract(text)
    // Where showInput replaces input text, and showOutput controls output display
    let [showInput, showOutput] = inputMaster.commandEntry.handler(inputMaster)
    if (showInput) text = showInput+" "+inputMaster.flavorText
    state.TRPG.showOutput = showOutput
  // } catch (err) {
  //   console.log(err.message)
  //   state.TRPG.showOutput = false
  //   return [text, true]
  // }
  return [text, stop]
}

function AIDungeonTRPG_output(text, stop=false) {
  AIDungeonTRPG_initialize()

  // Disables output
  if(state.TRPG.showOutput == false) {
    clearState()
    return [" ", stop]
  }

  // Replaces AI Dungeon output
  if (state.TRPG.outputText != "") {
    text = state.TRPG.outputText
  }

  // Apply Prefixes/Postfixes to output (if any)
  text = state.TRPG.prefixText + text + state.TRPG.postfixText

  // Clear the states
  clearState()
  return [text, stop]
}

function clearState() {
  state.TRPG.showOutput = true
  state.TRPG.outputText = ""
  state.TRPG.prefixText = ""
  state.TRPG.postfixText = ""
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
    "value": "",
    "type": "TRPG - Difficulty",
    "title": "TRPG - Difficulty Scale",
    "description": "{\n  \"impossible\": 30,\n  \"extreme\": 25,\n  \"hard\": 20,\n  \"medium\": 15,\n  \"easy\": 10,\n  \"effortless\": 5,\n  \"veryeasy\": 5,\n  \"very easy\": 5,\n  \"automatic\": 0,\n  \"auto\": 0\n}",
    "useForCharacterCreation": false
  },
  {
    "keys": "",
    "value": "Vigor — Bodily robustness, covering strength, endurance, and physical resilience.",
    "type": "TRPG - Attributes",
    "title": "Vigor",
    "description": "{ \"level\": 10, \"exp\": 0 }",
    "useForCharacterCreation": false
  },
  {
    "keys": "",
    "value": "Strength — Raw muscular power: lifting, carrying, grappling, smashing.",
    "type": "TRPG - Skills",
    "title": "Strength",
    "description": "{ \"attribute\": \"Vigor\", \"level\": 0, \"exp\": 0}",
    "useForCharacterCreation": false
  },
  {
    "keys": "",
    "value": "A simple sword made of steel.",
    "type": "TRPG - item",
    "title": "sword",
    "description": "{ \"category\": \"weapon\", \"rarity\": 1.0, \"amount\": 1, \"level\": 0, \"dmgType\": \"Slashing\"}",
    "useForCharacterCreation": false
  }
]

// MOCK player input
const playerInput1 = "> You #take the fish." // Unknown item
const playerInput2 = "> You #take a fish from the table." // Unknown item variation
const playerInput3 = "> You #take the sword." // Known item
const playerInput4 = "> You #take a sword from the table." // Known item variation
const playerInput5 = "> You #take 2 swords." // Known item, plural
const playerInput6 = "> You #take 2 Swords." // Known item, case sensitive check
const playerInput7 = "> You #take strong fish." // Unknown item, multi-word
const playerInput8 = "> You #take 2 strong fish." // Unknown item, multi-word, amount
const playerInput9 = "> You #take 2 strong fish of the sea." // Unknown item, long multi-word, amount

console.log(AIDungeonTRPG_input(playerInput1))
console.log(AIDungeonTRPG_output("AI DUNGEON TEXT"))
console.log(state.message ?? "")

console.log("")
console.log(AIDungeonTRPG_input(playerInput2))
console.log(AIDungeonTRPG_output("AI DUNGEON TEXT"))
console.log(state.message ?? "")

console.log("")
console.log(AIDungeonTRPG_input(playerInput3))
console.log(AIDungeonTRPG_output("AI DUNGEON TEXT"))
console.log(state.message ?? "")

console.log("")
console.log(AIDungeonTRPG_input(playerInput4))
console.log(AIDungeonTRPG_output("AI DUNGEON TEXT"))
console.log(state.message ?? "")

console.log("")
console.log(AIDungeonTRPG_input(playerInput5))
console.log(AIDungeonTRPG_output("AI DUNGEON TEXT"))
console.log(state.message ?? "")

console.log("")
console.log(AIDungeonTRPG_input(playerInput6))
console.log(AIDungeonTRPG_output("AI DUNGEON TEXT"))
console.log(state.message ?? "")

console.log("")
console.log(AIDungeonTRPG_input(playerInput7))
console.log(AIDungeonTRPG_output("AI DUNGEON TEXT"))
console.log(state.message ?? "")

console.log("")
console.log(AIDungeonTRPG_input(playerInput8))
console.log(AIDungeonTRPG_output("AI DUNGEON TEXT"))
console.log(state.message ?? "")

console.log("")
console.log(AIDungeonTRPG_input(playerInput9))
console.log(AIDungeonTRPG_output("AI DUNGEON TEXT"))
console.log(state.message ?? "")