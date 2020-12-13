// ==UserScript==
// @name         AMQ Rig Tracker Lite
// @namespace    https://github.com/TheJoseph98
// @version      1.0.3
// @description  Rig tracker for AMQ, writes rig to scoreboard next to players' scores
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// @updateURL    https://github.com/TheJoseph98/AMQ-Scripts/raw/master/amqRigTrackerLite.user.js
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
let playerData = {};

// initialize scoreboard, set rig of all players to 0
function initialiseScoreboard() {
    clearScoreboard();
    for (let entryId in quiz.scoreboard.playerEntries) {
        let tmp = quiz.scoreboard.playerEntries[entryId];
        let rig = $(`<span class="qpsPlayerRig">0</span>`);
        tmp.$entry.find(".qpsPlayerName").before(rig);
    }
    scoreboardReady = true;
}

// initialize player data, set rig of all players to 0
function initialisePlayerData() {
    clearPlayerData();
    for (let entryId in quiz.players) {
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

function setup() {
    // Initial setup on quiz start
    let quizReadyRigTracker = new Listener("quiz ready", (data) => {
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

    // Reset data when joining a lobby
    let joinLobbyListener = new Listener("Join Game", (payload) => {
        clearPlayerData();
        clearScoreboard();
    });

    // Reset data when spectating a lobby
    let spectateLobbyListener = new Listener("Spectate Game", (payload) => {
        clearPlayerData();
        clearScoreboard();
    });

    // bind listeners
    quizReadyRigTracker.bindListener();
    answerResultsRigTracker.bindListener();
    joinLobbyListener.bindListener();
    spectateLobbyListener.bindListener();

    AMQ_addScriptData({
        name: "Rig Tracker Lite",
        author: "TheJoseph98",
        description: `
            <p>Counts how many times a certain player's list has appeared in a quiz and displays it next to each person's score</p>
            <p>Rig is only counted if the player has enabled "Share Entries" in their AMQ list settings (noted by the blue ribbon in their answer field during answer reveal)</p>
            <a href="https://i.imgur.com/4jF8vja.png" target="_blank"><img src="https://i.imgur.com/4jF8vja.png" /></a>
            <p>If you're looking for a version with customisable options including writing to chat for 1v1 games and which can be enabled or disabled at will, check out the original <a href="https://github.com/TheJoseph98/AMQ-Scripts/raw/master/amqRigTracker.user.js">Rig Tracker</a>
        `
    });

    AMQ_addStyle(`
        .qpsPlayerRig {
            padding-right: 5px;
            opacity: 0.3;
        }
    `);
}
