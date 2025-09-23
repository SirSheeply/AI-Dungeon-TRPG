
// Checkout the Guidebook examples to get an idea of other ways you can use scripting
// https://help.aidungeon.com/scripting

// Your "Output" tab should look like this

// Every script needs a modifier function
const modifier = (text) => {
  // Your other output modifier scripts go here (preferred)
  [text, stop] = AIDungeonTRPG_output(text)
  // Your other output modifier scripts go here (alternative)
  return { text, stop }
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////

function AIDungeonTRPG_output(text, stop=false) {
  AIDungeonTRPG_initialize()

  // Disables output
  if(state.TRPG.showOutput == false) {
    clearState()
    return ["", stop]
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
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////

// Don't modify this part
modifier(text)