// ==UserScript==
// @name         AMQ Chat Timestamps
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds timestamps to chat messages
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// ==/UserScript==

if (!window.setupDocumentDone) return;

let gameChatNode = document.getElementById("gcMessageContainer");

let gameChatObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (!mutation.addedNodes) return;

        for (let i = 0; i < mutation.addedNodes.length; i++) {
         	let node = mutation.addedNodes[i];
            if ($(node).hasClass("gcTimestamp")) return;
            let d = new Date();
            let mins = d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes();
            let hours = d.getHours() < 10 ? "0" + d.getHours() : d.getHours();
            let dateFormat = hours + ":" + mins;
            $(node).prepend($("<span></span>")
                .addClass("gcTimestamp")
                .css("opacity", "0.5")
                .text(dateFormat));
        }
    });
});

gameChatObserver.observe(gameChatNode, {
    childList: true,
    attributes: false,
    CharacterData: false
});