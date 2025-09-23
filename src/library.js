
// Checkout the Guidebook examples to get an idea of other ways you can use scripting
// https://help.aidungeon.com/scripting

// Any functions or variables you define here will be available in your other modifier scripts.

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
//////////////////////////////////////////////////////// INITIALIZER ////////////////////////////////////////////////////////

function AIDungeonTRPG_initialize() {
  if(!state.TRPG) {
    state.TRPG = {}
    state.TRPG.showOutput = true
    state.TRPG.outputText = ""
    state.TRPG.prefixText = ""
    state.TRPG.postfixText = ""
  }
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
////////////////////////////////////////////////////// COMMAD REGISTRY //////////////////////////////////////////////////////

function commandRegistry(commandName) {
  const registry = [
    // <><> Core Commands
    { handler: doHelp,                 helpText: doHelpHelp,                synonyms: ["help"],        args: [] },
    { handler: doReset,                helpText: doResetHelp,               synonyms: ["reset"],       args: [] },

    // <><> Char Commands
    { handler: doNewChar,              helpText: doNewCharHelp,             synonyms: ["newchar"],     args: [] },
    { handler: doDeleteChar,           helpText: doDeleteCharHelp,          synonyms: ["delchar"],     args: [] }
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
/////////////////////////////////////////////////////// CORE COMMANDS ///////////////////////////////////////////////////////

function allCommandsHelp() {
  let textBuilder = "This is a list of all commands, and their synonyms:\n\n"
  for (let entry of commandRegistry()) {
    textBuilder += `#${entry.synonyms[0]}\n[${entry.synonyms.join(", ")}]\n\n`
  }
  textBuilder += "You can use #help followed by a command name for specific info; e.g. '#help help'.\n\n"
  return textBuilder
}

function doHelp(commandInput) {
  const helpType = commandInput.argumentText
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

function doReset(commandInput) {
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
  // Base info
  const blankCharacter = {
    info: {
      name: name.trim(),
      class: "Adventurer"
    }
  };

  // Helper to load a definition card and build a section
  function loadSection(sectionTitle) {
    const cards = searchStoryCards({ type: AIDungeonTRPGCardType, title: sectionTitle, exactType: true, exactTitle: true });
    if (cards.length === 0) {
      throw new Error(`${sectionTitle} card does not exist!`);
    }
    try {
      const definition = JSON.parse(cards[0].description);
      blankCharacter[sectionTitle] = {};
      for (const key in definition) {
        blankCharacter[sectionTitle][key] = definition[key].baseValue;
      }
    } catch {
      throw new Error(`${sectionTitle} card entry is invalid JSON!`);
    }
  }

  // Add attributes + skills
  loadSection("attributes");
  loadSection("skills");

  return blankCharacter;
}

function loadCharacter(name) {
  const character = characterTemplate(name)
  for (const sectionKey in character) {
    const searchTitle = name + " - " + sectionKey
    const cards = searchStoryCards({title: searchTitle, exactTitle: true})
    if (cards.length <= 0) throw new Error(`Error: Missing character ${sectionKey} card for ${name}`)
    try {
      character[sectionKey] = JSON.parse(cards[0].description);
    } catch {
      throw new Error(`${sectionTitle} card entry is invalid JSON!`)
    }
  }
  return character
}

function updateCharacter(character) {
  for (const sectionKey of Object.keys(character)) {
    const cardName = `${character.info.name} - ${sectionKey}`
    const cardIndex = storyCards.findIndex(item => item.title === cardName);
    if (cardIndex < 0) throw new Error(`Error: Missing character ${sectionKey} card for ${character.info.name}`)
    const cardContent = JSON.stringify(character[sectionKey], null, 2);
    updateStoryCard(cardIndex, "", "", `${AIDungeonTRPGCardType} - Character`, cardName, cardContent);
  }
}

function doNewChar(commandInput) {
  // Validate character name
  const name = commandInput.actorText?.trim();
  if (!name) throw new Error("Error: No character name detected!");

  // Setup new character template
  const newCharacter = characterTemplate(name);

  // Prevent duplicates
  for (const sectionKey of Object.keys(newCharacter)) {
    if (isCharacter(`${name} - ${sectionKey}`)) {
      throw new Error(`Error: Character ${sectionKey} already exists!`);
    }
  }

  // Create story cards
  for (const sectionKey of Object.keys(newCharacter)) {
    const cardName = `${name} - ${sectionKey}`;
    const cardContent = JSON.stringify(newCharacter[sectionKey], null, 2);
    addStoryCard("", "", `${AIDungeonTRPGCardType} - Character`, cardName, cardContent);
  }

  return [`Character '${name}' has been created!`, false];
}

const doNewCharHelp = `<><> #newChar command
-- Creates a new blank character with story cards.
Usage: character_name #newChar\n`

function doDeleteChar(commandInput) {
  // Check for a valid character name
  const name = commandInput.actorText?.trim();
  if (!name) throw new Error("Error: No character name detected!");

  // Setup new character template
  const newCharacter = characterTemplate(name)

  // Check that character cards do not exist
  for (const sectionKey in newCharacter) {
    const searchTitle = `${name} - ${sectionKey}`
    const cardIndex = storyCards.findIndex(item => item.title === searchTitle);
    if (cardIndex >= 0) removeStoryCard(cardIndex)
  }

  return [`Character '${name}' has been deleted!`, false]
}

const doDeleteCharHelp = `<><> #delChar command
-- Deletes a character's story cards.
Usage: character_name #delChar\n`

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////