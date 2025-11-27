
// Checkout the Guidebook examples to get an idea of other ways you can use scripting
// https://help.aidungeon.com/scripting

// Any functions or variables you define here will be available in your other modifier scripts.

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////// CONSTANTS /////////////////////////////////////////////////////////

// Keywords
const skillsKeyword = "skills"

// Constants
const TRPGCardType = "TRPG"

// Regex
const hasCommandRegex = (/(?:^|\s)#\w+/);                          // Check if there's a '#' at the start of any word (not mid-word)

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
  state.TRPG.actorName = "You"  //TODO: Fix hardcoded "You" to character name
  state.TRPG.config = {
    defaultCheckDice: 20,       // Dice / Range to use for making checks
    actionExp: 100,             // Base amount of EXP rewarded for successful actions
  }
  enforceConfig() // Load config changes from story cards
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
    { handler: doHelp,        helpText: doHelpHelp,        synonyms: ["help"]  },
    { handler: doReset,       helpText: doResetHelp,       synonyms: ["reset"]  },

    // <><> Skills & Abilities
    { handler: doTry,         helpText: doTryHelp,         synonyms: ["try", "attempt"] },
  ]

  // Handles searching of the command registry if needed
  if (!commandName) return registry;
  for (let entry of registry) {
    if (entry.synonyms.some(s => s === commandName || singularize(s, false) === commandName)) {
      return entry;
    }
  }

  // Defaults to doTry if no valid command is found
  return registry.find(e => e.handler === doTry);
}

function commandExtract(rawText) {
  // Extract command name
  const commandName = rawText.match(/#(\S+)/)[1];
  const targetNames = rawText.match(/@(\S+)/);

  // Clean input (remove symbols)
  const cleanInput = rawText.replace(/(?<!\w)[#@](?=\w)/g, '');
  
  return {
    commandName,    // #command referenced in input
    targetNames,    // @targets referenced in input
    cleanInput      // Raw unedit player input text
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

function card2json(cardContent) {
  const lineSplits = cardContent.split("\n")
  const jsonOutput = {}
  for (const i in lineSplits) {
    const line = lineSplits[i]
    const colonSplit = line.split(":")
    jsonOutput[colonSplit[0]] = colonSplit[1].trim()
  }
  return jsonOutput
}

function json2card(jsonData) {
  let stringBuilder = ""
  for (const key in jsonData) {
    stringBuilder += `${key}: ${jsonData[key]}\n`
  }
  return stringBuilder.trim()
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

function doHelp(inputMaster) {
  let textBuilder = "This is a list of all commands, and their synonyms:\n\n"
  for (let entry of commandRegistry()) {
    textBuilder += `#${entry.synonyms[0]}\n[${entry.synonyms.join(", ")}]\n\n`
  }
  textBuilder += "You can use #help followed by a command name for specific info; e.g. '#help help'.\n\n"
  state.TRPG.outputText = textBuilder
  return [null, true]
}

const doHelpHelp = `<><> #help command
-- Displays help information for all commands.
-- I see you're already a master of the help command ;)
Usage: #help\n`

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
//////////////////////////////////////////////////////// TRY COMMAND ////////////////////////////////////////////////////////

const doTryHelp = `<><> #try command
-- Performs a check by rolling 1d20 against an AI determined difficulty.
-- AI determines advantages and hinderences that may increase or reduce difficulty.
-- If the actor is not a character, no skill reductions are made, defaulkt actor is You.
Usage: you|actor #try ... \n`

function doTry(inputMaster) {
  const config = state.TRPG.config

  // Get the list of character skills
  const skillsCard = searchStoryCards({type: TRPGCardType, title: `${state.TRPG.actorName} - ${skillsKeyword}`})
  const infoCard = searchStoryCards({type: TRPGCardType, title: `${state.TRPG.actorName} - Info`})

  const skillsList = (skillsCard.length > 0) ? skillsCard[0].entry : []
  const charLevel = (infoCard.length > 0) ? parseInt(infoCard[0].entry.match(/Level:\s*(\d+)/)[1]) : 1

  // Pre-roll a dice value
  const diceRoll = getRandomInteger(1, config.defaultCheckDice)

  // Set the context and hope for the best
  state.memory.authorsNote = tryInstructions(skillsList, diceRoll, charLevel)
  return [inputMaster.cleanInput, true]
}

function tryInstructions(skillList, roll, level) {
  const tryCard = searchStoryCards({type: TRPGCardType, title: `TRPG - Try Instructions`})
  if (tryCard.length < 0) throw new Error("Action Failed! Try Instructions card does not exist!")
  
  let instructions = tryCard[0].description
  instructions = instructions.replaceAll("skillList", skillList)
  instructions = instructions.replaceAll("rollValue", roll)
  instructions = instructions.replaceAll("levelMod", Math.floor(level / 4))
  return instructions
}

// Splits the result block from the story text after try actions (used in output.js)
const divider = "=====NARRATIVE=====";
const backupDivider = "Outcome:";

function splitTryResult(outputText) {
  let idx = outputText.indexOf(divider);

  if (idx === -1) {
    // Try backup divider
    const backupIdx = outputText.indexOf(backupDivider);
    if (backupIdx !== -1) {
      // Include the whole Outcome: line in the result block
      const lineEnd = outputText.indexOf("\n", backupIdx);
      const splitPoint = lineEnd === -1 ? outputText.length : lineEnd + 1;

      return {
        resultBlock: outputText.slice(0, splitPoint).trim(),
        narrativeText: outputText.slice(splitPoint).trim()
      };
    }

    // No divider found at all
    return {
      resultBlock: "",
      narrativeText: outputText
    };
  }

  const resultBlock = outputText.slice(0, idx).trim();
  const narrativeText = outputText.slice(idx + divider.length).trim();
  return { resultBlock, narrativeText };
}

// Saves results block of try action to story cards for viewing (used in output.js)
function saveActionResult(outputText) {
  const cardName = "TRPG - Actions";

  // Check for divider
  if(!outputText.includes(divider) && !outputText.includes(backupDivider)) {
    return outputText
  }

  // Split the output text into result and narrative
  const { resultBlock, narrativeText } = splitTryResult(outputText)
  log(resultBlock)

  // Find existing TRPG - Actions card
  const existingIndex = storyCards.findIndex(card => card.title.toLowerCase() === cardName.toLowerCase() && card.type === TRPGCardType);
  if (existingIndex < 0) {
    addStoryCard("", resultBlock, TRPGCardType, cardName, "")
    return narrativeText
  }

  // Update existing card by appending the new block
  updateStoryCard(existingIndex, "", resultBlock, TRPGCardType, cardName, "");

  // Apply experience gain
  addExp(state.TRPG.actorName, resultBlock.includes("SUCCESS"))
  return narrativeText
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////// CHARACTER /////////////////////////////////////////////////////////

function characterTemplate(name, title, level, exp) {
  return `Name: ${name}\nTitle: ${title}\nLevel: ${level}\nEXP: ${exp}`
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////// EXP & LEVEL ////////////////////////////////////////////////////////

// Gets the required experience points for the character's next level.
function getExpForLevel(level) {
  // Gives the level progression of: 1=300, 2=1000, 3=2200, 5=7700, 10=53000, 20=406000
  return Math.floor(Math.round((level ** 3) * 50 + (level*300)) / 100)*100;
}

// Determines the current level of a character based on their experience points.
function getLevel(experience) {
  if (experience < 0) experience = 0
  let level = 1
  while (getExpForLevel(level) <= experience) { level++ }
  return level
}

function addExp(successFlag) {
  const expGain = successFlag ? state.TRPG.config.actionExp : state.TRPG.config.actionExp / 4
  const cardName = `${state.TRPG.actorName} - Info`;

  // Find existing TRPG character card
  const existingIndex = storyCards.findIndex(card => card.title.toLowerCase() === cardName.toLowerCase() && card.type === TRPGCardType);
  if (existingIndex < 0) {
    const cardContent = characterTemplate(state.TRPG.actorName, "none", 1, expGain)
    addStoryCard("", cardContent, TRPGCardType, cardName, "");
    return;
  }

  // Update existing card by appending the new exp & level
  let character = card2json(storyCards[existingIndex].entry)
  character["EXP"] = parseInt(character["EXP"]) + expGain
  character["Level"] = getLevel(character["EXP"])
  updateStoryCard(existingIndex, "", json2card(character), TRPGCardType, cardName, "");
}