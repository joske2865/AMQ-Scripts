// ==UserScript==
// @name         AMQ Chat Timestamps
// @namespace    https://github.com/TheJoseph98
// @version      1.1
// @description  Adds timestamps to chat messages
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// ==/UserScript==

if (!window.setupDocumentDone) return;

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
            $(node).prepend($(`<span class="gcTimestamp" style="opacity: 0.5;">` + timeFormat +`</span>`));
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
    description: `<p>Adds a timestamp to chat messages indicating when the message was sent, this is based on your local system time</p>`
});