// ==UserScript==
// @name         AMQ Room Browser Borgar Placement
// @namespace    SkayeScripts
// @version      1.0
// @description  Moves the "All Settings Menu" icon on room browsers to keep the height consistent. It even looks decent!
// @author       RivenSkaye
// @match        https://animemusicquiz.com/*
// @grant        none
// @updateURL    https://github.com/RivenSkaye/AMQ-Scripts-1/raw/master/amqRoomBrowserFix.user.js
// ==/UserScript==

// don't load on login page
if (document.getElementById("startPage")) return;

let loadInterval = setInterval(() => {
    if (document.getElementById("loadingScreen").classList.contains("hidden")) {
        setup();
        clearInterval(loadInterval);
    }
}, 500);

function shiftIcon(room){
    let borgar = room.childNodes[9].removeChild(room.childNodes[9].childNodes[7]);
    room.insertBefore(borgar, room.childNodes[1]);
    borgar.style.marginRight = "3px";
}

const newRooms = new MutationObserver(mutations => {
    mutations.forEach(m => {
        shiftIcon(m.addedNodes[1]);
    });
});
function setup(){
    newRooms.observe(document.getElementById("rbRoomContainer"), {'subtree': false, 'childList': true});
}
