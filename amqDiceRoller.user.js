// ==UserScript==
// @name         AMQ Dice Roller
// @namespace    https://github.com/TheJoseph98
// @version      1.1.3
// @description  Dice roller for general usage, type "/roll" in chat to output a random number from 1-100
// @author       Anopob & TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// @updateURL    https://github.com/TheJoseph98/AMQ-Scripts/raw/master/amqDiceRoller.user.js
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

let command = "/roll";
let maxRoll = 100;
let diceResult;

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sendChatMessage(message) {
    gameChat.$chatInputField.val(message);
    gameChat.sendMessage();
}

function setup() {
    let commandListener = new Listener("game chat update", (payload) => {
        payload.messages.forEach(message => {
            if (message.sender === selfName && message.message.startsWith(command)) {
                let args = message.message.split(/\s+/);
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
    });

    commandListener.bindListener();

    AMQ_addScriptData({
        name: "Dice Roller",
        author: "Anopob & TheJoseph98",
        description: `
            <p>Adds a dice roller to AMQ, to roll a dice type "/roll" in chat, you will receive a random number between 1 and 100</p>
            <p>You can set a max roll value by adding a number, for example "/roll 5" will roll a random number between 1 and 5</p>
            <p>Because it requires typing to chat, it does not work in ranked, due to slow mode</p>
        `
    });
}
