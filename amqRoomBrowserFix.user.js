// ==UserScript==
// @name         AMQ Room Browser Borgar Placement
// @namespace    SkayeScripts
// @version      2.1
// @description  Moves the "All Settings Menu" icon on room browsers to keep the height consistent. It even looks decent!
// @author       RivenSkaye, Zolhungaj
// @match        https://animemusicquiz.com/*
// @grant        none
// @updateURL    https://github.com/TheJoseph98/AMQ-Scripts/raw/master/amqRoomBrowserFix.user.js
// ==/UserScript==

if (typeof Listener === "undefined") return;
let loadInterval = setInterval(() => {
    if ($("#loadingScreen").hasClass("hidden")) {
        clearInterval(loadInterval);
        setup();
    }
}, 500);

function setup() {
    if (ROOM_TILE_TEMPLATE) {
        ROOM_TILE_TEMPLATE = ROOM_TILE_TEMPLATE
            .replace("<i class=\"fa fa-bars rbrAllOptionsIcon clickAble\" aria-hidden=\"true\" data-toggle=\"tooltip\" data-placement=\"top\" title=\"All Settings\"></i>", "")
            .replace("<div class=\"rbrRoomNameContainer\">", "<i class=\"fa fa-bars rbrAllOptionsIcon clickAble\" aria-hidden=\"true\" data-toggle=\"tooltip\" style=\"margin-right: 3px;\" data-placement=\"top\" title=\"All Settings\"></i>\n\t\t\t<div class=\"rbrRoomNameContainer\">");
    }
}
