# AMQ-Scripts

### Installation

Requires Tampermonkey browser extension (Greasemonkey doesn't work).

- Step 1) Select a script you want to install  
- Step 2) Click "raw"   
- Step 3) The browser extension should automatically prompt you to install the script, if it doesn't, just create a new script and copy-paste the code


### Note

Scripts in the "test" folder are not complete and might be full of bugs, use at your own risk

## Script descriptions and usage info

### amqSongListUI.user.js

Adds a window which lists all of the songs that play during a quiz in real time (during answer reveal phase). This window can be opened by pressing the "Song List" icon at the top right of the quiz screen (the same place where you change video resolution, volume and open the room settings) or by pressing the Pause/Break key on the keyboard

Features:
- Table which displays various information about the song that played such as:
  - Which song number it was
  - Name of the song
  - Artist of the song
  - Which anime it was from
  - Which song type the song is
  - What your answer was for that song
  - How many people guessed the song
  - Which sample of the song played (the start point of the song)
  - Green or red background color for if you guessed the song correctly or incorrectly (or standard gray background if you are spectating)
- Customizable settings:
  - Show or hide individual columns in the table
  - Change anime titles between English and Romaji
  - Auto Scroll: automatically scrolls to the end of the list when a new entry gets added during answer reveal phase
  - Auto Clear List: automatically clears the table when leaving a lobby, or when a new quiz starts
  - Show Correct: enable or disable the green and red background colors for your correct or incorrect guesses
  - These settings are saved to your browser's localStorage, if you use any 3rd party programs or tools that delete such data, your settings data might be deleted as well and will have to change settings every time you open AMQ
- Extra song info window, which can be opened by clicking an entry in the table which in addition to information visible in the table itself also shows things such as:
  - Which players guessed the song, sorted alphabetically for standard, LMS and BR modes and sorted by fastest guess first in Quickdraw mode (along with their score)
  - Which lists the anime is from with watching status and score (Note: they must have "Share Entries" enabled in their AMQ list settings for this to work)
  - all video URLs that have been uploaded for that particular song (catbox, animethemes and openings.moe)
- Other options:
  - Clear list: shown by the trash icon, manually clears the song list table (must be double clicked)
  - Open in New Tab: shown by the + icon, opens the list in a seperate tab in (mostly) full screen
  - Export: shown by a blank page icon, creates a downloadable file in JSON format which contains information of all the songs that played, including all information about guesses and which lists individual anime were from including watching status and score, this file can be imported to [AMQ Song List Viewer](https://thejoseph98.github.io/AMQ-Song-List-Viewer/) to view the state of the game at each individual song (Note: might take a few seconds for larger files to load)
  - Search input field: Search for specific songs in the list (Note: this searches *everything* even things like the guessed player percentage and sample point and also searches columns you have hidden in the settings)

- The windows can be dragged and resized (resizing only works at the corners of the windows, you can't resize by clicking and dragging on the edges)

Known bugs:
- None

### amqSongList.user.js

Adds a button which copies the current song info in JSON format to the user's clipboard, this button can be found at the top right of the quiz

Features:
- Outputs each individual song info object to the browser's console
- Outputs the entire song list to the browser's console at the end of the game
- Copy JSON to clipboard button: copies the list in JSON format to the user's clipboard, which contains info such as:
  - The number of the song
  - Name of the song
  - Artist of the song
  - English and Romaji anime titles
  - Song type
  - Number of players who guessed the song
  - Number of total (active) players
  - Start sample of the song
  - Total length of the song
  - URLs for both the webm and mp3 (Host priority: catbox > animethemes > openings.moe, resolution priority for webm: 720p > 480p)
- Example of the JSON output: https://pastebin.com/LmD7k1pW (Note: this data can *not* be used with the [AMQ Song List Viewer](https://thejoseph98.github.io/AMQ-Song-List-Viewer/))

Known bugs:
- None

### amqRigTracker.user.js

Counts how many times each person's list has appeared during a quiz (Note: only counts if the player has "Share Entries" enabled in their AMQ list settings)

Terminology:
- Rig: the number of times a certain player's list has appeared in game

Features:
- Display each player's rig on the scoreboard next to each player's score
- Send rig data to chat if there are exactly 2 players in the format `playerName1 x-y playerName2` this is commonly used for 1v1 tournament-style matches where in addition to keeping track player's scores, you might want to keep track of how many times certain lists have appeared
- Customizable options which can be accessed by going to your AMQ settings and selecting "Rig Tracker" tab:
  - Rig Tracker: enable or disable the rig tracker (Default: Enabled)
    - Write Rig to Chat: Posts rig to chat in the format `playerName1 x-y playerName2` for 1v1 games (Default: Disabled)
      - Anime Name: include the name of the anime which played, you can select the English or Romaji title (Default: Enabled, Romaji)
      - Player Names: include the names of the players (Default: Enabled)
      - Score: include the player's scores in addition to their rig (default: Disabled)
      - Final Results: posts the final rig and score data when the quiz ends (default: Enabled)
    - Write Rig to Scoreboard: Writes each individual player's rig to the scoreboard to the right of their score (or to the right of their correct guesses for Quickdraw, LMS and BR modes)
    - Final Results Options: options for the final results when you have enabled "Final Results" in "Write Rig to Chat" option
      - On Quiz End: posts the results when the quiz ends normally
        - Player names: include the player's names when posting results
        - Score: include the player's scores when posting results
        - Rig: include the player's rig when posting results
      - On Returning to Lobby: posts the results when the quiz "ends" as a result of returning to lobby vote
        - Player names: include the player's names when posting results
        - Score: include the player's scores when posting results
        - Rig: include the player's rig when posting results

Known bugs:
- None

### amqRigTrackerLite.user.js

A less customizable version of amqRigTracker.user.js with only one feature.

Terminology:
- Rig: the number of times a certain player's list has appeared in game

Features:
- Displays each player's individual rig to the right of their score (or correct guesses in Quickdraw, LMS and BR modes) on the scoreboard, resets after each quiz (Note: rig is only counted if the player has "Share Entries" enabled in their AMQ list settings)

Known bugs:
- None

### amqTeamRandomizer.user.js

Randomizes all players into teams of 2 and posts each team in chat. to use, type "/teams" in AMQ chat. Only works while in lobby (before the start of the quiz). Only randomizes the players (not spectators).

Known bugs:
- None

### amqDiceRoller.user.js

Rolls a random number between 1 and a max value (inclusive). To use, type "/roll" and add a max value, for example "/roll 10". This will roll a random number between 1 and 10. Default max value is 100.

Known bugs:
- You can add a negative number as the argument (example: "/roll -5"), but it doesn't work

### amqDiceRollerUI.user.js

Adds a user interface window that allows you to roll and edit custom dice rolls. To open this window, click the box icon (supposed to represent a dice) in the top right corner while in a quiz.

Features:
- Main dice window where you select a dice and roll a random value associated with that dice or edit that particular dice
- Dice editor window where you can add new dice and manage values for each dice
  - The left side of the editor are your dice, you can add, remove or rename your dice
  - The right side of the editor are the values for your dice (they're like numbers 1-6 on a regular dice) and you can add or remove values (if you want certain values to have a higher chance of appearing, you can add the same value multiple times, for example, say you had a dice with 4 values: "Season 1", "Season 2", "Season 2", "Season 2", in this example, you will be 3 times more likely to roll "Season 2" as opposed to "Season 1")

Known bugs:
- None

### amqSpeedrun.user.js

Adds a user interface window that shows information about fast you answer songs. To open this window, click the clock icon in the top right corner while in a quiz.

Features:
- Information on the speed of your guesses including:
  - Fastest guess
  - Slowest (but still correct) guess
  - Average time counting all answers
  - Average time counting only correct guesses
  - Total time
  - Correct guess ratio
  - Last song guess time
  - Individual song guess time breakdown
- Time measured is your latest Enter key input, so if you want fast times, try not to spam enter key too much
- Guessing a song incorrectly counts as full guess time for that song
- Using the auto submit to submit the answer counts as full guess time for that song (but counts as a correct guess for the purposes of the slowest guess time)
- All data is reset on the start of a new quiz

Known bugs:
- None

### amqChatTimestamps.user.js

Adds timestamps to messages (and system messages) in chat in HH:MM format, based on user's local system time

Known bugs:
- None

### amqBuzzer.user.js

Adds a buzzer to AMQ, which mutes the current song and posts the time you buzzed in in the chat. To use, press the Enter key on an empty answer field (doesn't work if you already have something typed in)

Known bugs:
- None

### amqSongDifficultyCounter.user.js

A counting tool which counts how many songs there are on any given difficulty. Can be customized to count any difficulty range and any song type. To use, open a solo lobby and click the "Counter" button, next to the "Room settings" button. Usage of guest account strongly recommended so you don't inflate your Songs Played and Guess Rate as the tool simulates games and you need to hear at least 1 song before you can return to lobby.

Terminology:
- Difficulty: refers to the 1% song difficulty range between it and 1% less than it, for example: Difficulty 52 refers to 51-52% song difficulty, 30% is 29-30%, etc.

Features:
- Customizable difficulty ranges from 1-100 for all 3 song types
- Option to send song difficulty data to a [public Spreadsheet](https://docs.google.com/spreadsheets/d/1mvwE_7CPN0jV5C76vHVX67ijo4VfhgIkkSxc5LOJLJE/edit?usp=sharing), which will automatically create the data table and graphs.
- Option to update existing sheets, by inputting the same username as on the spreadsheet (NOTE: this is case-sensitive, for example: "thejoseph98" and "THEJOSEPH98" are NOT the same)
- Option to automatically divide the difficulty into years if you find more than 100 songs
- Option to count by a single difficulty, without counting through all other difficulties

Known bugs:
- None
