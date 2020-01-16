// ==UserScript==
// @name         AMQ Rig Tracker
// @namespace    http://tampermonkey.net/
// @version      0.1.1
// @description  Rig tracker for AMQ, supports writing rig to chat for AMQ League games and writing rig to the scoreboard for general use (supports infinitely many players and all modes), many customisable options available
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @downloadURL  https://github.com/TheJoseph98/AMQ-Scripts/raw/master/amqRigTracker.user.js
// @updateURL    https://github.com/TheJoseph98/AMQ-Scripts/raw/master/amqRigTracker.user.js
// @grant        none
// @require      https://gist.githubusercontent.com/arantius/3123124/raw/grant-none-shim.js
// ==/UserScript==

if (!window.setupDocumentDone) return;

let scoreboardReady = false;
let playerDataReady = false;
let returningToLobby = false;
let playerData = {};

// data for the checkboxes
let settingsData = [
    {
        containerId: "smRigTrackerOptions",
        title: "Rig Tracker",
        data: [
            {
                label: "Track Rig",
                id: "smRigTracker",
                popover: "Enables or disabled the rig tracker",
                enables: ["smRigTrackerChat", "smRigTrackerScoreboard"],
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
                label: "On quiz end",
                id: "smRigTrackerQuizEnd",
                popover: "Write the final results at the end of the quiz",
                enables: ["smRigTrackerQuizEndNames", "smRigTrackerQuizEndScore", "smRigTrackerQuizEndRig"],
                offset: 3,
                default: true
            },
            {
                label: "Player Names",
                id: "smRigTrackerQuizEndNames",
                popover: "Include player names on final results when the quiz ends",
                offset: 4,
                default: true
            },
            {
                label: "Score",
                id: "smRigTrackerQuizEndScore",
                popover: "Include the final score on final result when the quiz ends",
                offset: 4,
                default: true
            },
            {
                label: "Rig",
                id: "smRigTrackerQuizEndRig",
                popover: "Include the final rig on final results when the quiz ends",
                offset: 4,
                default: true
            },
            {
                label: "On returning to lobby",
                id: "smRigTrackerLobby",
                popover: "Write the final results when returning to lobby",
                enables: ["smRigTrackerLobbyNames", "smRigTrackerLobbyScore", "smRigTrackerLobbyRig"],
                offset: 3,
                default: false
            },
            {
                label: "Player Names",
                id: "smRigTrackerLobbyNames",
                popover: "Include player names on final results when returning to lobby",
                offset: 4,
                default: false
            },
            {
                label: "Score",
                id: "smRigTrackerLobbyScore",
                popover: "Include the final score on final result when returning to lobby",
                offset: 4,
                default: false
            },
            {
                label: "Rig",
                id: "smRigTrackerLobbyRig",
                popover: "Include the final rig on final results when returning to lobby",
                offset: 4,
                default: false
            },
            {
                label: "Write rig to scoreboard",
                id: "smRigTrackerScoreboard",
                popover: "Writes the rig to the scoreboards next to each person's score",
                offset: 1,
                default: true
            }
        ]
    }
];

// Create the "Custom" tab in settings
$("#settingModal .tabContainer")
    .append($("<div></div>")
        .addClass("tab leftRightButtonTop clickAble")
        .attr("onClick", "options.selectTab('settingsCustomContainer', this)")
        .append($("<h5></h5>")
            .text("Custom")
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
                    .append($("<label for='" + data.id + "'>✔</label>"))
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
    let parent;
    settingsData.forEach((setting) => {
        parent = setting.data.find((data) => {
            return data.id === settingId;
        });
    });
    if (parent === undefined) {
        return;
    }
    if (parent.enables === undefined) {
        return;
    }
    else {
        for (let enableId of parent.enables) {
            if ($("#" + parent.id).prop("checked") && !$("#" + parent.id).parent().parent().hasClass("disabled")) {
                $("#" + enableId).parent().parent().removeClass("disabled");
            }
            else {
                $("#" + enableId).parent().parent().addClass("disabled");
            }
            updateEnabled(enableId);
        }
    }
}

// Updates the preset settings tabs and container, this is mostly to allow interaction with the newly added "Custom" tab
options.$SETTING_TABS = $("#settingModal .tab");
options.$SETTING_CONTAINERS = $(".settingContentContainer");

// Initial setup on quiz start
let quizReadyRigTracker = new Listener("quiz ready", (data) => {
    returningToLobby = false;
    clearPlayerData();
    if ($("#smRigTracker").prop("checked")) {
        if ($("#smRigTrackerScoreboard").prop("checked")) {
            initialiseScoreboard();
        }
        initialisePlayerData();
    }
    else {
        quizReadyRigTracker.unbindListener();
        answerResultsRigTracker.unbindListener();
        quizEndRigTracker.unbindListener();
        returnLobbyVoteListener.unbindListener();
        newRoomsListener.unbindListener();
    }
});

// stuff to do on answer reveal
let answerResultsRigTracker = new Listener("answer results", (result) => {
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
let quizEndRigTracker = new Listener("quiz end result", (result) => {
    if ($("#smRigTrackerChat").prop("checked") && $("#smRigTrackerFinalResult").prop("checked") && $("#smRigTrackerQuizEnd").prop("checked")) {
        writeResultsToChat();
    }
});

// stuff to do on returning to lobby
let returnLobbyVoteListener = new Listener("return lobby vote result", (payload) => {
    if (payload.passed) {
        returningToLobby = true;
        if ($("#smRigTrackerChat").prop("checked") && $("#smRigTrackerFinalResult").prop("checked") && $("#smRigTrackerLobby").prop("checked")) {
            writeResultsToChat();
        }
    }
});

// New rooms listener for the room browser, used for detecting when the player leaves a lobby (mid-game or otherwise)
let newRoomsListener = new Listener("New Rooms", (rooms) => {
    clearPlayerData();
});

// Creates the rig counters on the scoreboard and sets them to 0
function initialiseScoreboard() {
    for (let entryId in quiz.scoreboard.playerEntries) {
        let tmp = quiz.scoreboard.playerEntries[entryId];
        let rig = $("<span></span>");
        rig.text("0");
        rig.addClass("qpsPlayerRig");
        tmp.$entry.find(".qpsPlayerName").before(rig);
    }
    scoreboardReady = true;
}

// Creates the player data for counting rig (and score)
function initialisePlayerData() {
    for (let entryId in quiz.scoreboard.playerEntries) {
         playerData[entryId] = {
             rig: 0,
             score: 0,
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
    // Send "Something went wrong" in case the message is empty for some reason
    if (message === "") {
        message = "Something went wrong";
        console.debug("player data: " + playerData);
        console.debug("tmp data: " + tmpData);
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

// Enable or disable rig tracking on checking or unchecking the rig tracker checkbox
$("#smRigTracker").click(function () {
    let rigTrackerEnabled = $(this).prop("checked");
    if (!rigTrackerEnabled) {
        quizReadyRigTracker.unbindListener();
        answerResultsRigTracker.unbindListener();
        quizEndRigTracker.unbindListener();
        returnLobbyVoteListener.unbindListener();
        newRoomsListener.unbindListener();
        clearScoreboard();
    }
    else {
        quizReadyRigTracker.bindListener();
        answerResultsRigTracker.bindListener();
        quizEndRigTracker.bindListener();
        returnLobbyVoteListener.bindListener();
        newRoomsListener.bindListener();
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
newRoomsListener.bindListener();

// CSS stuff
GM_addStyle(`
    .qpsPlayerRig {
        padding-right: 5px;
        opacity: 0.3;
    }
    .customCheckboxContainer > div {
        display: inline-block;
        margin: 5px 0px;
    }
    .customCheckboxContainer > .customCheckboxContainerLabel {
        margin-left: 5px;
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
