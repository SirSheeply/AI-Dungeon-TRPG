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
* Character's have inventories. Take & Drop items as you please.

## Installation
1. Edit a scenario you own and click edit scripts under details.
2. Copy library.js, context.js, input.js, and output.js into their respective files.
3. Export your story cards, and add this project's storycards to the end.
4. Import the combined storycards.json back into your scenario.
5. Play and enjoy!

## How to Begin (Basics)
1. Enter #newChar into a do action to create a new character (named "You").
2. You may View and Edit your character sheet in the story cards:
    * The "info" story card contains name, class, overall level.
    * The "attributes" story card contains the character's attribute levels & exp.
    * The "skills" story card contains the character's skill levels & exp.
3. Once you have edited your character as you like, use the #try command as a do action to perform a D&D style check for success.
    * For exmaple "#try to climb the wall using athletics."
    * You must include an attribute or skill name after the #try and before the first period; but otherwise, anything goes.
    * EXP & levels are automatically caluclated!
    * If you wat to make a check harder or easier you can include a difficulty and advantage/disadvantage in ().
    * For example "#try to climb the wall using athletics (15 advantage)."
4. You may use the story action to do any of the above for other named characters, just include the name before the command, e.g. "Sheep #newChar" or "Sheep #tries athletics."
5. Play as you please, make checks, level up, become unstopable!