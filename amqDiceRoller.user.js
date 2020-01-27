// ==UserScript==
// @name         AMQ Dice Roller
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Dice roller for general usage, type "/roll" in chat to output a random number from 1-100
// @author       Anopob
// @match        https://animemusicquiz.com/*
// @grant        none
// ==/UserScript==

if (!window.setupDocumentDone) return;

let command = "/roll";
let maxRoll = 100;
let diceResult;

let commandListener = new Listener("Game Chat Message", (payload) => {
    if (payload.sender === selfName && payload.message.startsWith(command)) {
        let args = payload.message.split(/\s+/);        
        if (args[1] !== undefined) {
            maxRoll = parseInt(args[1].trim());
            if (isNaN(maxRoll)) {
                sendChatMessage("Please enter a valid number");
            }
            else {
                diceResult = getRandomIntInclusive(1, maxRoll);
                sendChatMessage(" rolls " + diceResult);
            }
        }
        else {
            maxRoll = 100;
            diceResult = getRandomIntInclusive(1, maxRoll);
            sendChatMessage(" rolls " + diceResult);
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
