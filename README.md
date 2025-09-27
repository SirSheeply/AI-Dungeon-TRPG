# AI-Dungeon-TRPG

## Goals
The primary goal of AI-Dungeon-TRPG is to create a command system for AI Dungeon to handle TRPG features, like: character attributes & skills, items, check actions, combat stats, casting spells, etc.
* Create an intuitive command system for players.
* Create customisable system for authors to add content.
* Keep the code base and systems clean and to the point.
* Maintain a balance between narrative vs TRPG systems.

## Features
* In-game command system, try #help to see a full list.
* Create character sheets with #newChar then view/edit them in your story cards.
* Skills and Attributes of your character level as you use them in actions, like the #try command.
* Config story card for various settings, scales, and display options.

## Installation
1. Edit a scenario you own and click edit scripts under details.
2. Copy library.js, context.js, input.js, and output.js into their respective files.
3. Export your story cards, and add this project's storycards to the end.
4. Import the combined storycards.json back into your scenario.
5. Play and enjoy!

## How to Begin 101
1. Enter #newChar into a do action to create a new character (named "You").
2. You may view your character sheet in the story cards:
    i. The "info" story card contains name, class, overall level.
    ii. The "attributes" story card contains the character's attribute levels & exp.
    iii. The "skills" story card contains the character's skill levels & exp.
3. Once you have edited your character as you like, use the #try command as a do action to perform a check.
    i. For exmaple "#try to climb the wall using athletics."
    ii. You must include an attribute or skill name after the #try and before the first period.
    iii. Anything after the first period is considered flavor text and has no bearing on the command.
    iv. The check behaves like D&D; a d20 is rolled and then the modifer/level of your skill is added to it.
    v. For the action to succeed it must pass the difficulty (there is a default difficulty in the config story card)
    vi. You may also provide a difficulty and advantage/disadvanatge to the check by included them in () before the first period.
    vii. For example "#try to climb the wall using athletics (12)" or "#try to climb the wall using athletics (disadvanatge)" or both (12, advantage)
