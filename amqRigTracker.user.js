// ==UserScript==
// @name         AMQ Rig Tracker
// @namespace    https://github.com/TheJoseph98
// @version      1.3.4
// @description  Rig tracker for AMQ, supports writing rig to chat for AMQ League games and writing rig to the scoreboard for general use (supports infinitely many players and all modes), many customisable options available
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @downloadURL  https://github.com/TheJoseph98/AMQ-Scripts/raw/master/amqRigTracker.user.js
// @updateURL    https://github.com/TheJoseph98/AMQ-Scripts/raw/master/amqRigTracker.user.js
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// @updateURL    https://github.com/TheJoseph98/AMQ-Scripts/raw/master/amqRigTracker.user.js
// ==/UserScript==

// don't load on login page
if (document.getElementById("startPage")) return;

// Wait until the LOADING... screen is hidden and load script
let loadInterval = setInterval(() => {
    if (document.getElementById("loadingScreen").classList.contains("hidden")) {
        setup();
        clearInterval(loadInterval);
    }
}, 500);

let scoreboardReady = false;
let playerDataReady = false;
let returningToLobby = false;
let missedFromOwnList = 0;
let playerData = {};

// listeners
let quizReadyRigTracker;
let answerResultsRigTracker;
let quizEndRigTracker;
let returnLobbyVoteListener;
let joinLobbyListener;
let spectateLobbyListener;

// data for the checkboxes
let settingsData = [
    {
        containerId: "smRigTrackerOptions",
        title: "Rig Tracker Options",
        data: [
            {
                label: "Track Rig",
                id: "smRigTracker",
                popover: "Enables or disabled the rig tracker",
                enables: ["smRigTrackerChat", "smRigTrackerScoreboard", "smRigTrackerMissedOwn"],
                offset: 0,
                default: true
            },
            {
                label: "Write rig to chat",
                id: "smRigTrackerChat",
                popover: "Writes the rig to chat. Used for AMQ League games, requires 2 players, automatically disabled if the requirement is not met",
                enables: ["smRigTrackerAnime", "smRigTrackerPlayerNames", "smRigTrackerScore", "smRigTrackerFinalResult"],
                offset: 1,
                default: false
            },
            {
                label: "Anime Name",
                id: "smRigTrackerAnime",
                popover: "Include the anime name when writing rig to chat",
                enables: ["smRigTrackerAnimeEnglish", "smRigTrackerAnimeRomaji"],
                offset: 2,
                default: true
            },
            {
                label: "English",
                id: "smRigTrackerAnimeEnglish",
                popover: "English anime names",
                unchecks: ["smRigTrackerAnimeRomaji"],
                offset: 3,
                default: false
            },
            {
                label: "Romaji",
                id: "smRigTrackerAnimeRomaji",
                popover: "Romaji anime names",
                unchecks: ["smRigTrackerAnimeEnglish"],
                offset: 3,
                default: true
            },
            {
                label: "Player Names",
                id: "smRigTrackerPlayerNames",
                popover: "Include the player names when writing rig to chat",
                offset: 2,
                default: true
            },
            {
                label: "Score",
                id: "smRigTrackerScore",
                popover: "Include the players' scores when writing rig to chat",
                offset: 2,
                default: false
            },
            {
                label: "Final results",
                id: "smRigTrackerFinalResult",
                popover: "Write the final results of the game",
                enables: ["smRigTrackerQuizEnd", "smRigTrackerLobby"],
                offset: 2,
                default: true
            },
            {
                label: "Write rig to scoreboard",
                id: "smRigTrackerScoreboard",
                popover: "Writes the rig to the scoreboards next to each person's score",
                offset: 1,
                default: true
            },
            {
                label: "Display missed from list",
                id: "smRigTrackerMissedOwn",
                popover: "Display the number of songs you missed from your own list in the chat at the end of the quiz",
                enables: ["smRigTrackerMissedAll"],
                offset: 1,
                default: true
            },
            {
                label: "Display missed from all lists",
                id: "smRigTrackerMissedAll",
                popover: "Display the number of songs all players missed from their own lists in the chat at the end of the quiz",
                offset: 2,
                default: false
            }
        ]
    },
    {
        containerId: "smRigTrackerFinalOptions",
        title: "Final Results Options",
        data: [
            {
                label: "On quiz end",
                id: "smRigTrackerQuizEnd",
                popover: "Write the final results at the end of the quiz",
                enables: ["smRigTrackerQuizEndNames", "smRigTrackerQuizEndScore", "smRigTrackerQuizEndRig"],
                offset: 0,
                default: true
            },
            {
                label: "Player Names",
                id: "smRigTrackerQuizEndNames",
                popover: "Include player names on final results when the quiz ends",
                offset: 1,
                default: true
            },
            {
                label: "Score",
                id: "smRigTrackerQuizEndScore",
                popover: "Include the final score on final result when the quiz ends",
                offset: 1,
                default: true
            },
            {
                label: "Rig",
                id: "smRigTrackerQuizEndRig",
                popover: "Include the final rig on final results when the quiz ends",
                offset: 1,
                default: true
            },
            {
                label: "On returning to lobby",
                id: "smRigTrackerLobby",
                popover: "Write the final results when returning to lobby",
                enables: ["smRigTrackerLobbyNames", "smRigTrackerLobbyScore", "smRigTrackerLobbyRig"],
                offset: 0,
                default: false
            },
            {
                label: "Player Names",
                id: "smRigTrackerLobbyNames",
                popover: "Include player names on final results when returning to lobby",
                offset: 1,
                default: false
            },
            {
                label: "Score",
                id: "smRigTrackerLobbyScore",
                popover: "Include the final score on final result when returning to lobby",
                offset: 1,
                default: false
            },
            {
                label: "Rig",
                id: "smRigTrackerLobbyRig",
                popover: "Include the final rig on final results when returning to lobby",
                offset: 1,
                default: false
            }
        ]
    }
];

// Create the "Rig Tracker" tab in settings
$("#settingModal .tabContainer")
    .append($("<div></div>")
        .addClass("tab leftRightButtonTop clickAble")
        .attr("onClick", "options.selectTab('settingsCustomContainer', this)")
        .append($("<h5></h5>")
            .text("Rig Tracker")
        )
    );

// Create the body base
$("#settingModal .modal-body")
    .append($("<div></div>")
        .attr("id", "settingsCustomContainer")
        .addClass("settingContentContainer hide")
        .append($("<div></div>")
            .addClass("row")
        )
    );


// Create the checkboxes
for (let setting of settingsData) {
    $("#settingsCustomContainer > .row")
        .append($("<div></div>")
            .addClass("col-xs-6")
            .attr("id", setting.containerId)
            .append($("<div></div>")
                .attr("style", "text-align: center")
                .append($("<label></label>")
                    .text(setting.title)
                )
            )
        );
    for (let data of setting.data) {
        $("#" + setting.containerId)
            .append($("<div></div>")
                .addClass("customCheckboxContainer")
                .addClass(data.offset !== 0 ? "offset" + data.offset : "")
                .addClass(data.offset !== 0 ? "disabled" : "")
                .append($("<div></div>")
                    .addClass("customCheckbox")
                    .append($("<input id='" + data.id + "' type='checkbox'>")
                        .prop("checked", data.default !== undefined ? data.default : false)
                    )
                    .append($("<label for='" + data.id + "'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                )
                .append($("<label></label>")
                    .addClass("customCheckboxContainerLabel")
                    .text(data.label)
                )
            );
        if (data.popover !== undefined) {
            $("#" + data.id).parent().parent().find("label:contains(" + data.label + ")")
                .attr("data-toggle", "popover")
                .attr("data-content", data.popover)
                .attr("data-trigger", "hover")
                .attr("data-html", "true")
                .attr("data-placement", "top")
                .attr("data-container", "#settingModal")
        }
    }
}

// Update the enabled and checked checkboxes
for (let setting of settingsData) {
    for (let data of setting.data) {
        updateEnabled(data.id);
        $("#" + data.id).click(function () {
            updateEnabled(data.id);
            if (data.unchecks !== undefined) {
                data.unchecks.forEach((settingId) => {
                    if ($(this).prop("checked")) {
                        $("#" + settingId).prop("checked", false);
                    }
                    else {
                        $(this).prop("checked", true);
                    }
                })
            }
        });
    }
}

// Updates the enabled checkboxes, checks each node recursively
function updateEnabled(settingId) {
    let current;
    settingsData.some((setting) => {
        current = setting.data.find((data) => {
            return data.id === settingId;
        });
        return current !== undefined;
    });
    if (current === undefined) {
        return;
    }
    if (current.enables === undefined) {
        return;
    }
    else {
        for (let enableId of current.enables) {
            if ($("#" + current.id).prop("checked") && !$("#" + current.id).parent().parent().hasClass("disabled")) {
                $("#" + enableId).parent().parent().removeClass("disabled");
            }
            else {
                $("#" + enableId).parent().parent().addClass("disabled");
            }
            updateEnabled(enableId);
        }
    }
}

// Creates the rig counters on the scoreboard and sets them to 0
function initialiseScoreboard() {
    clearScoreboard();
    for (let entryId in quiz.scoreboard.playerEntries) {
        let tmp = quiz.scoreboard.playerEntries[entryId];
        let rig = $(`<span class="qpsPlayerRig">0</span>`);
        tmp.$entry.find(".qpsPlayerName").before(rig);
    }
    scoreboardReady = true;
}

// Creates the player data for counting rig (and score)
function initialisePlayerData() {
    clearPlayerData();
    for (let entryId in quiz.players) {
         playerData[entryId] = {
             rig: 0,
             score: 0,
             missedList: 0,
             name: quiz.players[entryId]._name
         };
    }
    playerDataReady = true;
}

// Clears the rig counters from scoreboard
function clearScoreboard() {
    $(".qpsPlayerRig").remove();
    scoreboardReady = false;
}

// Clears player data
function clearPlayerData() {
    playerData = {};
    playerDataReady = false;
    missedFromOwnList = 0;
}

// Writes the current rig to scoreboard
function writeRigToScoreboard() {
    if (playerDataReady) {
        for (let entryId in quiz.scoreboard.playerEntries) {
            let entry = quiz.scoreboard.playerEntries[entryId];
            let rigCounter = entry.$entry.find(".qpsPlayerRig");
            rigCounter.text(playerData[entryId].rig);
        }
    }
}

// Writes the rig to chat (for 2 players, automatically disables if there's more or less than 2 players)
function writeRigToChat(animeTitle) {
    let tmpData = [];
    let message = "";
    if (Object.keys(playerData).length !== 2) {
        gameChat.systemMessage("Writing rig to chat requires exactly 2 players, writing rig to chat has been disabled");
        $("#smRigTrackerChat").prop("checked", false);
        updateEnabled("smRigTrackerChat");
    }
    else {
        for (let key of Object.keys(playerData)) {
            tmpData.push(playerData[key]);
        }
        if ($("#smRigTrackerPlayerNames").prop("checked")) {
            message += tmpData[0].name + " " + tmpData[0].rig + "-" + tmpData[1].rig + " " + tmpData[1].name;
        }
        else {
            message += tmpData[0].rig + "-" + tmpData[1].rig;
        }
        if ($("#smRigTrackerScore").prop("checked")) {
            message += ", Score: " + tmpData[0].score + "-" + tmpData[1].score;
        }
        if ($("#smRigTrackerAnime").prop("checked")) {
            if ($("#smRigTrackerAnimeRomaji").prop("checked")) {
                message += " (" + animeTitle.romaji + ")";
            }
            else if ($("#smRigTrackerAnimeEnglish").prop("checked")){
                message += " (" + animeTitle.english + ")";
            }
            else {
                message += " (" + animeTitle.romaji + ")";
            }
        }
    }
    let oldMessage = gameChat.$chatInputField.val();
    gameChat.$chatInputField.val(message);
    gameChat.sendMessage();
    gameChat.$chatInputField.val(oldMessage);
}

// Write the final result at the end of the game
function writeResultsToChat() {
    let tmpData = [];
    for (let key of Object.keys(playerData)) {
        tmpData.push(playerData[key]);
    }
    let oldMessage = gameChat.$chatInputField.val();
    gameChat.$chatInputField.val("========FINAL RESULT========");
    gameChat.sendMessage();
    if (!returningToLobby) {
        if ($("#smRigTrackerQuizEndScore").prop("checked")) {
            if ($("#smRigTrackerQuizEndNames").prop("checked")) {
                gameChat.$chatInputField.val("Score: " + tmpData[0].name + " " + tmpData[0].score + "-" + tmpData[1].score + " " + tmpData[1].name);
                gameChat.sendMessage();
            }
            else {
                gameChat.$chatInputField.val("Score: " + tmpData[0].score + "-" + tmpData[1].score);
                gameChat.sendMessage();
            }
        }
        if ($("#smRigTrackerQuizEndRig").prop("checked")) {
            if ($("#smRigTrackerQuizEndNames").prop("checked")) {
                gameChat.$chatInputField.val("Rig: " + tmpData[0].name + " " + tmpData[0].rig + "-" + tmpData[1].rig + " " + tmpData[1].name);
                gameChat.sendMessage();
            }
            else {
                gameChat.$chatInputField.val("Rig: " + tmpData[0].rig + "-" + tmpData[1].rig);
                gameChat.sendMessage();
            }
        }
    }
    else {
        if ($("#smRigTrackerLobbyScore").prop("checked")) {
            if ($("#smRigTrackerLobbyNames").prop("checked")) {
                gameChat.$chatInputField.val("Score: " + tmpData[0].name + " " + tmpData[0].score + "-" + tmpData[1].score + " " + tmpData[1].name);
                gameChat.sendMessage();
            }
            else {
                gameChat.$chatInputField.val("Score: " + tmpData[0].score + "-" + tmpData[1].score);
                gameChat.sendMessage();
            }
        }
        if ($("#smRigTrackerLobbyRig").prop("checked")) {
            if ($("#smRigTrackerLobbyNames").prop("checked")) {
                gameChat.$chatInputField.val("Rig: " + tmpData[0].name + " " + tmpData[0].rig + "-" + tmpData[1].rig + " " + tmpData[1].name);
                gameChat.sendMessage();
            }
            else {
                gameChat.$chatInputField.val("Rig: " + tmpData[0].rig + "-" + tmpData[1].rig);
                gameChat.sendMessage();
            }
        }
    }

    gameChat.$chatInputField.val(oldMessage);
}

function displayMissedList() {
    let inQuiz = Object.values(quiz.players).some(player => player.isSelf === true);
    if ($("#smRigTrackerMissedOwn").prop("checked") && !$("#smRigTrackerMissedAll").prop("checked") && inQuiz && quiz.gameMode !== "Ranked") {
        if (missedFromOwnList === 0){
            gameChat.systemMessage(`No misses. GG`);
            // Just change anything on the message, it's your game after all.
            // If you want the classic "You missed 0 songs" message, either edit the message or remove the if-else statement 
        }
        else{
            gameChat.systemMessage(`You missed ${missedFromOwnList === 1 ? missedFromOwnList + " song" : missedFromOwnList + " songs"} from your own list`);
            // Quick guide: If you only missed one, customize the " song" and if it's two or more, customize " songs". You can re-arrange the orders though.
        }
    }
    if ($("#smRigTrackerMissedAll").prop("checked") && $("#smRigTrackerMissedOwn").prop("checked") && quiz.gameMode !== "Ranked") {
        for (let id in playerData) {
            gameChat.systemMessage(`${playerData[id].name} missed ${playerData[id].missedList === 1 ? playerData[id].missedList + " song" : playerData[id].missedList + " songs"} from their own list`);
        }
    }
}

function setup() {
    // Updates the preset settings tabs and container, this is mostly to allow interaction with the newly added "Custom" tab
    options.$SETTING_TABS = $("#settingModal .tab");
    options.$SETTING_CONTAINERS = $(".settingContentContainer");

    // Initial setup on quiz start
    quizReadyRigTracker = new Listener("quiz ready", (data) => {
        returningToLobby = false;
        clearPlayerData();
        clearScoreboard();
        if ($("#smRigTracker").prop("checked") && quiz.gameMode !== "Ranked") {
            answerResultsRigTracker.bindListener();
            quizEndRigTracker.bindListener();
            returnLobbyVoteListener.bindListener();
            if ($("#smRigTrackerScoreboard").prop("checked")) {
                initialiseScoreboard();
            }
            initialisePlayerData();
        }
        else {
            answerResultsRigTracker.unbindListener();
            quizEndRigTracker.unbindListener();
            returnLobbyVoteListener.unbindListener();
        }
    });

    // stuff to do on answer reveal
    answerResultsRigTracker = new Listener("answer results", (result) => {
        if (quiz.gameMode === "Ranked") {
            return;
        }
        if (!playerDataReady) {
            initialisePlayerData();
        }
        if (!scoreboardReady && $("#smRigTrackerScoreboard").prop("checked")) {
            initialiseScoreboard();
            if (playerDataReady) {
                writeRigToScoreboard();
            }
        }
        if (playerDataReady) {
            for (let player of result.players) {
                if (player.listStatus !== null && player.listStatus !== undefined && player.listStatus !== false && player.listStatus !== 0) {
                    playerData[player.gamePlayerId].rig++;
                    if (player.correct === false) {
                        playerData[player.gamePlayerId].missedList++;
                    }
                    if (player.correct === false && quiz.players[player.gamePlayerId]._name === selfName) {
                        missedFromOwnList++;
                    }
                }
                if (player.correct === true) {
                    playerData[player.gamePlayerId].score++;
                }
            }
            if ($("#smRigTrackerChat").prop("checked") && !returningToLobby) {
                writeRigToChat(result.songInfo.animeNames);
            }
            if (scoreboardReady) {
                writeRigToScoreboard();
            }
        }
    });

    // stuff to do on quiz end
    quizEndRigTracker = new Listener("quiz end result", (result) => {
        if ($("#smRigTrackerChat").prop("checked") && $("#smRigTrackerFinalResult").prop("checked") && $("#smRigTrackerQuizEnd").prop("checked")) {
            writeResultsToChat();
        }
        displayMissedList();
    });

    // stuff to do on returning to lobby
    returnLobbyVoteListener = new Listener("return lobby vote result", (payload) => {
        if (payload.passed) {
            returningToLobby = true;
            if ($("#smRigTrackerChat").prop("checked") && $("#smRigTrackerFinalResult").prop("checked") && $("#smRigTrackerLobby").prop("checked")) {
                writeResultsToChat();
            }
            //displayMissedList();
        }
    });

    // Reset data when joining a lobby
    joinLobbyListener = new Listener("Join Game", (payload) => {
        if (payload.error) {
            return;
        }
        if ($("#smRigTracker").prop("checked") && payload.settings.gameMode !== "Ranked") {
            answerResultsRigTracker.bindListener();
            quizEndRigTracker.bindListener();
            returnLobbyVoteListener.bindListener();
        }
        else {
            answerResultsRigTracker.unbindListener();
            quizEndRigTracker.unbindListener();
            returnLobbyVoteListener.unbindListener();
        }
        clearPlayerData();
        clearScoreboard();
    });

    // Reset data when spectating a lobby
    spectateLobbyListener = new Listener("Spectate Game", (payload) => {
        if (payload.error) {
            return;
        }
        if ($("#smRigTracker").prop("checked") && payload.settings.gameMode !== "Ranked") {
            answerResultsRigTracker.bindListener();
            quizEndRigTracker.bindListener();
            returnLobbyVoteListener.bindListener();
        }
        else {
            answerResultsRigTracker.unbindListener();
            quizEndRigTracker.unbindListener();
            returnLobbyVoteListener.unbindListener();
        }
        clearPlayerData();
        clearScoreboard();
    });

    // Enable or disable rig tracking on checking or unchecking the rig tracker checkbox
    $("#smRigTracker").click(function () {
        let rigTrackerEnabled = $(this).prop("checked");
        if (!rigTrackerEnabled) {
            quizReadyRigTracker.unbindListener();
            answerResultsRigTracker.unbindListener();
            quizEndRigTracker.unbindListener();
            returnLobbyVoteListener.unbindListener();
            clearScoreboard();
        }
        else {
            quizReadyRigTracker.bindListener();
            answerResultsRigTracker.bindListener();
            quizEndRigTracker.bindListener();
            returnLobbyVoteListener.bindListener();
            if ($("#smRigTrackerScoreboard").prop("checked")) {
                initialiseScoreboard();
                writeRigToScoreboard();
            }
        }
    });

    // Enable or disable rig display on the scoreboard on checking or unchecking the scoreboard checkbox
    $("#smRigTrackerScoreboard").click(function () {
        let rigTrackerScoreboardEnabled = $(this).prop("checked");
        if (rigTrackerScoreboardEnabled) {
            initialiseScoreboard();
            writeRigToScoreboard();
        }
        else {
            clearScoreboard();
        }
    });

    // bind listeners
    quizReadyRigTracker.bindListener();
    answerResultsRigTracker.bindListener();
    quizEndRigTracker.bindListener();
    returnLobbyVoteListener.bindListener();
    joinLobbyListener.bindListener();
    spectateLobbyListener.bindListener();

    AMQ_addScriptData({
        name: "Rig Tracker",
        author: "TheJoseph98",
        description: `
            <p>Rig tracker for AMQ counts how many times a certain player's list has appeared in a quiz, mainly created for AMQ League games to reduce the need for dedicated players who track the rig</p>
            <p>Rig is only counted if the player has enabled "Share Entries" in their AMQ list settings (noted by the blue ribbon in their answer field during answer reveal)</p>
            <p>Rig tracker has multiple options available which can be accessed by opening AMQ settings and selecting the "Rig Tracker" tab</p>
            <a href="https://i.imgur.com/LQE4PGg.png" target="_blank"><img src="https://i.imgur.com/LQE4PGg.png" /></a>
            <p>Rig tracker also has an option of writing rig to the scoreboard next to players' scores for non-league and more than 2 players games</p>
            <a href="https://i.imgur.com/4jF8vja.png" target="_blank"><img src="https://i.imgur.com/4jF8vja.png" /></a>
            <p>If you're looking for a smaller version without these options and which can only write rig to scoreboard, check out <a href="https://github.com/TheJoseph98/AMQ-Scripts/raw/master/amqRigTrackerLite.user.js">Rig Tracker Lite</a>
        `
    });

    // CSS stuff
    AMQ_addStyle(`
        .qpsPlayerRig {
            padding-right: 5px;
            opacity: 0.3;
        }
        .customCheckboxContainer {
            display: flex;
        }
        .customCheckboxContainer > div {
            display: inline-block;
            margin: 5px 0px;
        }
        .customCheckboxContainer > .customCheckboxContainerLabel {
            margin-left: 5px;
            margin-top: 5px;
            font-weight: normal;
        }
        .offset1 {
            margin-left: 20px;
        }
        .offset2 {
            margin-left: 40px;
        }
        .offset3 {
            margin-left: 60px;
        }
        .offset4 {
            margin-left: 80px;
        }
    `);
}
