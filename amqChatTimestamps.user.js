// ==UserScript==
// @name         AMQ Chat Timestamps
// @namespace    https://github.com/TheJoseph98
// @version      1.5
// @description  Adds timestamps to chat messages
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://github.com/joske2865/AMQ-Scripts/raw/master/common/amqScriptInfo.js
// @downloadURL  https://github.com/joske2865/AMQ-Scripts/raw/master/amqChatTimestamps.user.js
// @updateURL    https://github.com/joske2865/AMQ-Scripts/raw/master/amqChatTimestamps.user.js
// ==/UserScript==

// Wait until the LOADING... screen is hidden and load script
if (typeof Listener === "undefined") return;
let loadInterval = setInterval(() => {
    if ($("#loadingScreen").hasClass("hidden")) {
        clearInterval(loadInterval);
        setup();
    }
}, 500);

const version = "1.5";

function setup() {
    let gameChatNode = document.getElementById("gcMessageContainer");

    let gameChatObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (!mutation.addedNodes) return;

            for (let i = 0; i < mutation.addedNodes.length; i++) {
                let node = mutation.addedNodes[i];
                if ($(node).hasClass("gcTimestamp")) return;
                if ($(node).hasClass("ps__scrollbar-y-rail")) return;
                if ($(node).hasClass("ps__scrollbar-x-rail")) return;
                let d = new Date();
                let mins = d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes();
                let hours = d.getHours() < 10 ? "0" + d.getHours() : d.getHours();
                let timeFormat = hours + ":" + mins;
                if ($(node).find(".gcTeamMessageIcon").length === 1) {
                    $(node).find(".gcTeamMessageIcon").after($(`<span class="gcTimestamp" style="opacity: 0.5;">${timeFormat}</span>`));
                }
                else {
                    $(node).prepend($(`<span class="gcTimestamp" style="opacity: 0.5;">${timeFormat}</span>`));
                }

                // scroll to bottom
                let chat = gameChat.$chatMessageContainer;
                let atBottom = chat.scrollTop() + chat.innerHeight() >= chat[0].scrollHeight - 25;
                if (atBottom) {
                    chat.scrollTop(chat.prop("scrollHeight"));
                }
            }
        });
    });
    
    gameChatObserver.observe(gameChatNode, {
        childList: true,
        attributes: false,
        CharacterData: false
    });

    AMQ_addScriptData({
        name: "Chat Timestamps",
        author: "TheJoseph98",
        version: version,
        link: "https://github.com/joske2865/AMQ-Scripts/raw/master/amqChatTimestamps.user.js",
        description: `<p>Adds a timestamp to chat messages indicating when the message was sent, this is based on your local system time</p>`
    });
}
