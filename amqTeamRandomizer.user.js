// ==UserScript==
// @name         AMQ Team Randomizer
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Team randomizer for tag team custom mode, once all players join the lobby, type "/teams" in chat to randomize teams, the teams will be output to chat
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://gist.githubusercontent.com/arantius/3123124/raw/grant-none-shim.js
// ==/UserScript==

if (!window.setupDocumentDone) return;

let players = [];
let playersPerTeam = 2;

let commandListener = new Listener("Game Chat Message", (payload) => {
    if (payload.sender === selfName && payload.message === "/teams") {
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
                        message += players[playerIdx];
                    }
                    if (playerId !== 0 && playerIdx < players.length) {
                        message += "/" + players[playerIdx];
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