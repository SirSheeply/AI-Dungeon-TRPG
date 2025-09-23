
// Checkout the Guidebook examples to get an idea of other ways you can use scripting
// https://help.aidungeon.com/scripting

// Your "Input" tab should look like this

// Every script needs a modifier function
const modifier = (text) => {
  // Your other input modifier scripts go here (preferred)
  [text, stop] = AIDungeonTRPG_input(text)
  // Your other input modifier scripts go here (alternative)
  return { text, stop }
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////

function AIDungeonTRPG_input(text, stop=false) {
  AIDungeonTRPG_initialize()
  // No "#" means no command
  if (!text.match(hasRegex)) {
    return [text, stop]
  }

  try {
    // Parse text into blocks, then find the command entry
    const commandInput = commandExtract(text)
    const commandEntry = commandRegistry(commandInput.commandName)

    // Where showInput replaces input text, and showOutput controls output display
    let [showInput, showOutput] = commandEntry.handler(commandInput)
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
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////

// Don't modify this part
modifier(text)