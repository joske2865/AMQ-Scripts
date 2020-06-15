// ==UserScript==
// @name         AMQ Short Sample Radio
// @namespace    https://github.com/FokjeM
// @version      1.0
// @description  Puts a nice image over the chat in solo rooms, customizable.
// @author       Riven Skaye // FokjeM
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// ==/UserScript==


// First we check if localStorage even exists here. If it doesn't, people are using a weird browser and we can't support them.
function storageAvailable() {
    let storage;
    try {
        storage = window['localStorage'];
        storage.setItem("Riven is amazing", "Hell yeah");
        storage.removeItem("Riven is amazing");
        return true;
    }
    catch(e) {
        return false;
    }
}

let settings;
storageAvailable ? settings = window.localStorage : displayMessage("Browser Issue", "Your current browser or session does not support localStorage.\nGet a different browser or change applicable settings.", "Aye");

function changeChat(){
    if(!settings){
        return;
    }
    !lobby.soloMode ? displayMessage("Be social!", "This script only hides chat in solo rooms.", "Aye") : null;
    !settings.getItem("SoloChatBlock-bg") ? localStorage.setItem("SoloChatBlock-bg", "https://i.imgur.com/9gdEjUf.jpg") : null;
    !settings.getItem("SoloChatBlock-flip") ? localStorage.setItem("SoloChatBlock-flip", false) : null;
    !settings.getItem("SoloChatBlock-position") ? localStorage.setItem("SoloChatBlock-position", "left top") : null;
    !settings.getItem("SoloChatBlock-repeat") ? localStorage.setItem("SoloChatBlock-repeat", "no-repeat") : null;
    !settings.getItem("SoloChatBlock-attachment") ? localStorage.setItem("SoloChatBlock-attachment", "fixed") : null;
    !settings.getItem("SoloChatBlock-size") ? localStorage.setItem("SoloChatBlock-size", "cover") : null;
    let gcC_css = {
        "background-image": `url(${settings.getItem("SoloChatBlock-bg")}`,
        "background-repeat": `${settings.getItem("SoloChatBlock-repeat")}`,
        "background-attachment": `${settings.getItem("SoloChatBlock-attachment")}`,
        "background-position": `${settings.getItem("SoloChatBlock-position")}`,
        "background-size": `${settings.getItem("SoloChatBlock-size")}`,
        "transform": `scale(${settings.getItem("SoloChatBlock-flip") ? -1 : 1}, 1)`
    };

    $("#gcContent").css(gcC_css);
    $("#gcChatContent").css("display", "none");
}
