// ==UserScript==
// @name         AMQ Dice Roller
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Dice roller for general usage, type "/roll" in chat to output a random number from 1-100
// @author       Anopob
// @match        https://animemusicquiz.com/*
// @grant        none
// ==/UserScript==

if (!window.setupDocumentDone) return;

let command = "/roll";
let diceResult;

let commandListener = new Listener("Game Chat Message", (payload) => {
    if (payload.sender === selfName && payload.message === command) {
        if (lobby.inLobby) {
            // todo: maybe allow more dice rolling options
            diceResult = getRandomIntInclusive(1, 100);
            sendChatMessage(" rolls " + diceResult);
        }
        else {
            gameChat.systemMessage("Must be in pre-game lobby");
        }
    }
});

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sendChatMessage(message) {
    gameChat.$chatInputField.val(message);
    gameChat.sendMessage();
}

commandListener.bindListener();