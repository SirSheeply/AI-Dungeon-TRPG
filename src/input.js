
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
    const inputMaster = commandExtract(text)

    // Where showInput replaces input text, and showOutput controls output display
    let [showInput, showOutput] = inputMaster.commandEntry.handler(inputMaster)
    if (showInput) text = showInput+" "+inputMaster.flavorText
    state.TRPG.showOutput = showOutput

  } catch (err) {
    console.log(err.message)
    state.TRPG.showOutput = false
    state.message = err.message
    return [text, true]
  }
  return [text, stop]
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////

// Don't modify this part
modifier(text)