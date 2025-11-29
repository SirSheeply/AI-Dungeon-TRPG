
// Checkout the Guidebook examples to get an idea of other ways you can use scripting
// https://help.aidungeon.com/scripting

// Any functions or variables you define here will be available in your other modifier scripts.

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////// CONSTANTS /////////////////////////////////////////////////////////

// Constants
const TRPGCardType = "TRPG"

// Keywords
const InfoKeyword = "Info"
const DataKeyword = "Data"
const SkillsKeyword = "Skills"
const NameKeyword = "Name"
const LevelKeyword = "Level"
const TitleKeyword = "Title"
const EXPKeyword = "EXP"

// Regex
const hasCommandRegex = (/(?:^|\s)#\w+/);                          // Check if there's a '#' at the start of any word (not mid-word)
const intParenthesesRegex = (/\((\d+)\)$/)                         // /\(\d+\)$/

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
  state.TRPG.actor = getSetCharacter({name: "You"})  // Get's the actor character (or creates one) // TODO: Fix hardcoded "You" to character name
  state.TRPG.config = {
    defaultCheckDice: 20,       // Dice / Range to use for making checks
    actionExp: 100,             // Base amount of EXP rewarded for successful actions
    newSkillExp: -1000          // Starting amount of EXP for newly learning skills
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
      Object.keys(state.TRPG.config).forEach(key => { state.TRPG.config[key] = validateType(newSettings[key], state.TRPG.config[key]) });
      updateStoryCard(configCardIndex, "", JSON.stringify(state.TRPG.config[key], null, 2), TRPGCardType, configTitle, "")
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
  const cleanInput = rawText.replace(/(^|\s)[#@](?=\w)/g, '$1');
  
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
-- If the actor is not a character, no skill reductions are made, default actor is You.
-- EXP is gained for successful check (25% for failed attempt), amount can be configured (actionExp).
Usage: Any text with #skillName or #try \n`

function doTry(inputMaster) {
  const config = state.TRPG.config
  const character = state.TRPG.actor

  // Pre-roll a dice value
  const diceRoll = getRandomInteger(1, config.defaultCheckDice)

  // Set the context and hope for the best
  state.memory.authorsNote = tryInstructions(character[InfoKeyword][SkillsKeyword], diceRoll, parseInt(character[InfoKeyword][LevelKeyword]), Object.keys(character[DataKeyword][SkillsKeyword]))
  return [inputMaster.cleanInput, true]
}

function tryInstructions(skillList, roll, level, allSkills) {
  const tryCard = searchStoryCards({type: TRPGCardType, title: `TRPG - Try Instructions`})
  if (tryCard.length <= 0) throw new Error("Action Failed! Try Instructions card does not exist!")
  
  let instructions = tryCard[0].description
  instructions = instructions.replaceAll("skillList", skillList)
  instructions = instructions.replaceAll("rollValue", roll)
  instructions = instructions.replaceAll("levelMod", Math.floor(level / 4))
  instructions = instructions.replaceAll("allSkillNames", allSkills)
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
  } else {
    updateStoryCard(existingIndex, "", resultBlock, TRPGCardType, cardName, "")
  }

  // Update expGain and relevant skill progress
  const expGain = resultBlock.includes("SUCCESS") ? state.TRPG.config.actionExp : state.TRPG.config.actionExp / 4
  const relevantSkills = (resultBlock.match(/^[ \t]*relevant skills:\s*(.*)$/im) || [,''])[1]
  updateCharacter({name: state.TRPG.actor[InfoKeyword][NameKeyword], expGain: expGain, rskills: relevantSkills})

  return narrativeText
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////// CHARACTER /////////////////////////////////////////////////////////

function characterTemplate({name = state.characterName || "You", title = "none", level = 1, exp = 0, skills = ""} = {}) {
  return `Name: ${name}\nTitle: ${title}\nLevel: ${level}\nEXP: ${exp}\n${SkillsKeyword}: ${skills}`
}

function skillsTemplate(skills) {
  const skillsData = {}
  const skillList = skills.split(',').map(s => s.trim()).filter(Boolean)
  for (const s of skillList) {
    const level = parseInt(s.match(intParenthesesRegex)?.[1] || 0, 10);
    const name = s.replace(intParenthesesRegex, '').trim();
    skillsData[name] = { [LevelKeyword]: level, [EXPKeyword]: getExpForLevel(level-1)+1 };
  }
  return skillsData
}

// Smart update of character by applying exp gain to character level and relevant skills
function updateCharacter({name = state.characterName || "You", expGain = 0, rskills = ""} = {}) {
  const cardName = `${name} - ${InfoKeyword}`;
  let existingIndex = storyCards.findIndex(card => card.title.toLowerCase() === cardName.toLowerCase() && card.type === TRPGCardType)

  // Create a character card if none exists
  if (existingIndex < 0) {
    const notes = {}
    notes[SkillsKeyword] = {}
    existingIndex = addStoryCard("", characterTemplate({name: name}), TRPGCardType, cardName, JSON.stringify(notes, null, 2))-1
  }

  // Get existing card details
  const cardContent = card2json(storyCards[existingIndex].entry)
  const cardNotes = JSON.parse(storyCards[existingIndex].description)

  // Update character level and exp
  cardContent[EXPKeyword] = parseInt(cardContent[EXPKeyword]) + expGain
  cardContent[LevelKeyword] = getLevel(cardContent[EXPKeyword])

  // Update the relevant skills list in the card notes
  const skillList = rskills.split(',').map(s => s.replace(intParenthesesRegex, '').trim()).filter(Boolean)
  for (const rs of skillList) {
    const keys = Object.keys(cardNotes[SkillsKeyword]);
    const index = keys.findIndex(k => k.toLowerCase() === rs.toLowerCase());
    const rsindex = index >= 0 ? keys[index] : rs // preserve original case if new
    if (index >= 0) {
      cardNotes[SkillsKeyword][rsindex][EXPKeyword] += expGain
    } else {
      cardNotes[SkillsKeyword][rsindex] = {}
      cardNotes[SkillsKeyword][rsindex][EXPKeyword] = state.TRPG.config.newSkillExp
    }
    cardNotes[SkillsKeyword][rsindex][LevelKeyword] = getLevel(cardNotes[SkillsKeyword][rsindex][EXPKeyword])
  }

  // Promote and update levels of skills in the card info
  const infoSkills = cardContent[SkillsKeyword].split(',').map(s => s.replace(intParenthesesRegex, "").trim()).filter(Boolean)
  for (const si in cardNotes[SkillsKeyword]) {
    const skillLevel = cardNotes[SkillsKeyword][si][LevelKeyword]
    if (skillLevel > 0) {
      const index = infoSkills.findIndex(v => v.toLowerCase() === si.toLowerCase());
      const skillName = index >= 0 ? infoSkills[index] : si
      const skillString = `${skillName}(${skillLevel})`
      if (index >= 0) infoSkills[index] = skillString
      else infoSkills.push(skillString)
    }
  }
  cardContent[SkillsKeyword] = infoSkills.join(", ")

  // Finally apply the update
  updateStoryCard(existingIndex, storyCards[existingIndex].keys, json2card(cardContent), TRPGCardType, cardName, JSON.stringify(cardNotes, null, 2))
}

// Can be used to get, set, and/or create a character
function getSetCharacter({name = state.characterName || "You", title = null, level = null, exp = null, skills = null, rskills = null} = {}) {
  const cardName = `${name} - ${InfoKeyword}`;
  let existingIndex = storyCards.findIndex(card => card.title.toLowerCase() === cardName.toLowerCase() && card.type === TRPGCardType)

  // Create a character card if none exists
  if (existingIndex < 0) {
    const cardConent = characterTemplate({name: name})
    const cardNotes = {}
    cardNotes[SkillsKeyword] = skillsTemplate(skills || "")
    existingIndex = addStoryCard("", cardConent, TRPGCardType, cardName, JSON.stringify(cardNotes, null, 2))-1
  }

  // Then update with the argument values, if not null
  const cardContent = card2json(storyCards[existingIndex].entry)
  const cardNotes = JSON.parse(storyCards[existingIndex].description)
  if (name    != null) cardContent[NameKeyword]   = name
  if (title   != null) cardContent[TitleKeyword]  = title
  if (level   != null) cardContent[LevelKeyword]  = level
  if (exp     != null) cardContent[EXPKeyword]    = exp
  if (skills  != null) cardContent[SkillsKeyword] = skills
  if (rskills != null) cardNotes[SkillsKeyword]   = rskills

  // Validate cardContent levels -> exp to check if player has updated level values out of sync with exp
  const charLevel = cardContent[LevelKeyword]
  if (getExpForLevel(charLevel-1)+1 > cardContent[EXPKeyword] || getExpForLevel(charLevel) < cardContent[EXPKeyword]) {
    cardContent[EXPKeyword] = getExpForLevel(charLevel-1)+1 // Reset exp to minimum for current level
  }

  // Validate cardNotes levels -> skill exp to check if player has updated level values out of sync with exp
  const infoSkills = skillsTemplate(cardContent[SkillsKeyword] || "")
  const skillData = cardNotes[SkillsKeyword] || {}
  for (const skill in infoSkills) {
    const keys = Object.keys(skillData)
    if (keys.includes(skill) || keys.includes(skill.toLowerCase())) {
      const index = keys.includes(skill) ? skill : keys.includes(skill.toLowerCase()) ? skill.toLowerCase() : ""
      // check if the levels are the same; if not, update skillData level to infoSkills level
      const skillLevel = infoSkills[skill][LevelKeyword]
      if (skillData[index][LevelKeyword] != skillLevel) {
        skillData[index][LevelKeyword] = skillLevel
      }
      // check if the skillData exp is in the expected range for the infoSkill level; if not update the skillData exp to the minimum for that level
      const dataExp = skillData[index][EXPKeyword]
      if (getExpForLevel(skillLevel-1)+1 > dataExp || getExpForLevel(skillLevel) < dataExp) {
        skillData[index][EXPKeyword] = infoSkills[skill][EXPKeyword] // Reset exp to minimum for current level
      }
    } else {
      // Else Player has added a new skill: Update skillData with new skill
      skillData[skill] = {}
      skillData[skill][LevelKeyword] = infoSkills[skill][LevelKeyword]
      skillData[skill][EXPKeyword] = infoSkills[skill][EXPKeyword]
    }
  }
  cardNotes[SkillsKeyword] = skillData // Update the cardNotes with the validations (if any)

  // Finally update the character story card
  updateStoryCard(existingIndex, storyCards[existingIndex].keys, json2card(cardContent), TRPGCardType, cardName, JSON.stringify(cardNotes, null, 2))

  // Return character data with both info and data (for easy access later / get functionality)
  const character = {}
  character[InfoKeyword] = cardContent
  character[DataKeyword] = cardNotes
  return character
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////// EXP & LEVEL ////////////////////////////////////////////////////////

// Gets the required experience points for the character's next level.
function getExpForLevel(level) {
  // Gives the level progression of: 1=1, 2=300, 3=1000, 4=2200, 6=7700, 11=53000, 21=406000
  return Math.floor(Math.round((level ** 3) * 50 + (level*300)) / 100)*100;
}

// Determines the current level of a character based on their experience points.
function getLevel(experience) {
  let level = 0
  if (experience <= 0) return level
  while (getExpForLevel(level) <= experience) { level++ }
  return level
}