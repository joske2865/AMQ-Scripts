// ==UserScript==
// @name         AMQ Dice Roller
// @namespace    https://github.com/TheJoseph98
// @version      1.3
// @description  Dice roller for general usage, type "/roll" followed by a number
// @author       Anopob & TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://github.com/joske2865/AMQ-Scripts/raw/master/common/amqScriptInfo.js
// @downloadURL  https://github.com/joske2865/AMQ-Scripts/raw/master/amqDiceRoller.user.js
// @updateURL    https://github.com/joske2865/AMQ-Scripts/raw/master/amqDiceRoller.user.js
// ==/UserScript==

// Wait until the LOADING... screen is hidden and load script
if (typeof Listener === "undefined") return;
let loadInterval = setInterval(() => {
    if ($("#loadingScreen").hasClass("hidden")) {
        clearInterval(loadInterval);
        setup();
    }
}, 500);

const version = "1.3";

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
    new Listener("game chat update", (payload) => {
        payload.messages.forEach(message => {
            if (message.sender === selfName && message.message.startsWith("/roll")) {
                let args = message.message.split(/\s+/);
                if (args[1]) {
                    let maxRoll = parseInt(args[1].trim());
                    if (!isNaN(maxRoll) && maxRoll > 0) {
                        sendChatMessage("rolls " + getRandomIntInclusive(1, maxRoll));
                    }
                }
            }
        });
    }).bindListener();

    AMQ_addScriptData({
        name: "Dice Roller",
        author: "Anopob & TheJoseph98",
        version: version,
        link: "https://github.com/joske2865/AMQ-Scripts/raw/master/amqDiceRoller.user.js",
        description: `
            <p>Adds a dice roller to AMQ. To roll, type "/roll #" in chat (# can be any number). You will receive a random number between 1 and the selected number</p>
            <p>Because it requires typing to chat, it does not work in ranked, due to slow mode</p>
        `
    });
}
