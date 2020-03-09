// ==UserScript==
// @name         AMQ Rig Tracker Lite
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Rig tracker for AMQ, writes rig to scoreboard next to players' scores
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// ==/UserScript==

// don't load the script until logged in
if (!window.setupDocumentDone) return;

let scoreboardReady = false;
let playerDataReady = false;
let playerData = {};

// Initial setup on quiz start
let quizReadyRigTracker = new Listener("quiz ready", (data) => {
    returningToLobby = false;
    clearPlayerData();
    initialiseScoreboard();
    initialisePlayerData();
});

// stuff to do on answer reveal
let answerResultsRigTracker = new Listener("answer results", (result) => {
    if (!playerDataReady) {
        initialisePlayerData();
    }
    if (!scoreboardReady) {
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
        }
        if (scoreboardReady) {
            writeRigToScoreboard();
        }
    }
});

// reset rig when leaving lobby
let newRoomsListener = new Listener("New Rooms", (rooms) => {
    clearPlayerData();
    clearScoreboard();
});

// initialize scoreboard, set rig of all players to 0
function initialiseScoreboard() {
    for (let entryId in quiz.scoreboard.playerEntries) {
        let tmp = quiz.scoreboard.playerEntries[entryId];
        let rig = $(`<span class="qpsPlayerRig">0</span>`);
        tmp.$entry.find(".qpsPlayerName").before(rig);
    }
    scoreboardReady = true;
}

// initialize player data, set rig of all players to 0
function initialisePlayerData() {
    for (let entryId in quiz.scoreboard.playerEntries) {
         playerData[entryId] = {
             rig: 0
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

// bind listeners
quizReadyRigTracker.bindListener();
answerResultsRigTracker.bindListener();
newRoomsListener.bindListener();

AMQ_addStyle(`
    .qpsPlayerRig {
        padding-right: 5px;
        opacity: 0.3;
    }
`);