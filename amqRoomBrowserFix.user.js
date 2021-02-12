// ==UserScript==
// @name         AMQ Room Browser Borgar Placement
// @namespace    SkayeScripts
// @version      2.0
// @description  Moves the "All Settings Menu" icon on room browsers to keep the height consistent. It even looks decent!
// @author       RivenSkaye, Zolhungaj
// @match        https://animemusicquiz.com/*
// @grant        none
// @updateURL    https://github.com/RivenSkaye/AMQ-Scripts-1/raw/master/amqRoomBrowserFix.user.js
// ==/UserScript==

if(!document.getElementById("startPage")){
    // Wait until the LOADING... screen is hidden and load script
    let loadInterval = setInterval(() => {
        if (document.getElementById("loadingScreen").classList.contains("hidden")) {
            // No need for setup or anything, this is the only thing it does and should only run once
            if(ROOM_TILE_TEMPLATE){
                ROOM_TILE_TEMPLATE = ROOM_TILE_TEMPLATE
                                        .replace("<i class=\"fa fa-bars rbrAllOptionsIcon clickAble\" aria-hidden=\"true\" data-toggle=\"tooltip\" data-placement=\"top\" title=\"All Settings\"></i>", "")
                                        .replace("<div class=\"rbrRoomNameContainer\">", "<i class=\"fa fa-bars rbrAllOptionsIcon clickAble\" aria-hidden=\"true\" data-toggle=\"tooltip\" style=\"margin-right: 3px;\" data-placement=\"top\" title=\"All Settings\"></i>\n\t\t\t<div class=\"rbrRoomNameContainer\">");
            }
            clearInterval(loadInterval);
        }
    }, 500);
}
