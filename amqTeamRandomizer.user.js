// ==UserScript==
// @name         AMQ Team Randomizer
// @namespace    https://github.com/TheJoseph98
// @version      1.0.1
// @description  Team randomizer for tag team custom mode, once all players join the lobby, type "/teams" in chat to randomize teams, the teams will be output to chat
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// ==/UserScript==

if (!window.setupDocumentDone) return;

let players = [];
let playersPerTeam = 2;

let commandListener = new Listener("Game Chat Message", (payload) => {
    if (payload.sender === selfName && payload.message.startsWith("/teams")) {
        if (lobby.inLobby) {
            let message = "";
            sendChatMessage("Randomizing teams...");

            for (let playerId in lobby.players) {
                players.push(lobby.players[playerId]._name);
            }

            shuffle(players);

            for (let teamId = 0; teamId < players.length / playersPerTeam; teamId++) {
                message += "Team " + (teamId + 1) + ": ";
                for (let playerId = 0; playerId < playersPerTeam; playerId++) {
                    let playerIdx = teamId * playersPerTeam + playerId;
                    if (playerId === 0 && playerIdx < players.length) {
                        message += "@" + players[playerIdx];
                    }
                    if (playerId !== 0 && playerIdx < players.length) {
                        message += " / @" + players[playerIdx];
                    }
                }
                sendChatMessage(message);
                message = "";
            }

            players = [];
        }
        else {
            gameChat.systemMessage("Must be in pre-game lobby");
        }
    }
});


function shuffle(array) {
    let counter = array.length;
    while (counter > 0) {
        let index = Math.floor(Math.random() * counter);
        counter--;
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }
    return array;
}

function sendChatMessage(message) {
    gameChat.$chatInputField.val(message);
    gameChat.sendMessage();
}

commandListener.bindListener();

AMQ_addScriptData({
    name: "Team Randomizer",
    author: "TheJoseph98",
    description: `
        <p>Team randomizer for the Tag Teams custom mode</p>
        <p>Type "/teams" in chat to randomize the teams</p>
        <p>Works only while in the lobby (ie. not currently in a quiz)</p>
    `
})