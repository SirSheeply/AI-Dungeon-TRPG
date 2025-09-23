
// Checkout the Guidebook examples to get an idea of other ways you can use scripting
// https://help.aidungeon.com/scripting

// Your "Context" tab should look like this

// Every script needs a modifier function
const modifier = (text) => {
  // Your other context modifier scripts go here (preferred)
  [text, stop] = AIDungeonTRPG_context(text)
  // Your other context modifier scripts go here (alternative)
  return { text, stop }
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////

function AIDungeonTRPG_context(text, stop=false) {
  AIDungeonTRPG_initialize()
  return [text, stop]
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////// | /////////////////////////////////////////////////////////////

// Don't modify this part
modifier(text)