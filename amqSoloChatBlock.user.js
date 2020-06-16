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
        storage = window.localStorage;
        storage.setItem("Riven is amazing", "Hell yeah");
        storage.removeItem("Riven is amazing");
        return true;
    }
    catch(e) {
        return false;
    }
}
//These are the defaults. Laevateinn should be bliss to everyone. JQuery CSS notation since we leverage Ege's resources.
const gcC_css_default = {
    "background-image": "https://i.imgur.com/9gdEjUf.jpg",
    "background-repeat": "no-repeat",
    "background-attachment": "fixed",
    "background-position": "left top",
    "background-size": "cover",
    "transform": "scale(1, 1)",
    "opacity": 1.0
};
let settings;
storageAvailable ? settings = window.localStorage : displayMessage("Browser Issue", "Your current browser or session does not support localStorage.\nGet a different browser or change applicable settings.", "Aye");

/*
 * Function that actually replaces the chatbox with an image.
 * Loads in the last saved settings, or the default if nothing was set.
 */
function changeChat(){
    if(!settings){
        return;
    }else if(!lobby.soloMode){
        displayMessage("Be social!", "This script only hides chat in solo rooms.", "Aye");
        return;
    }
    // If it's not set yet, create the object in localStorage using the defaults. Hail persistence!
    !settings.getItem("soloChatBlock") ? localStorage.setItem("SoloChatBlock", JSON.stringify(gcC_css_default)) : null;
    // Load in whatever the last saved ssettings were
    gcC_css = JSON.parse(settings.getItem("soloChatBlock"));
    // Apply the CSS and hide the chat
    $("#gcContent").css(gcC_css);
    $("#gcChatContent").css("display", "none");
}

/*
 * Internal function to update settings. Until stuff is finalized, this can be used to change them.
 * Saves the given settings to the localStorage object and applies changes to the variable gcC_css.
 * Until the script is finalized, call changeChat() to apply them.
 */
function updateSettings(bg, repeat, attachment, bgpos, size, transform, opacity){
    gcC_css["background-image"] = `url(${bg})`;
    gcC_css["background-repeat"] = repeat;
    gcC_css["background-attachment"] = attachment;
    gcC_css["background-position"] = bgpos;
    gcC_css["background-size"] = size;
    gcC_css["transform"] = `scale(${transform ? -1 : 1})`;
    gcC_css["opacity"] = opacity;
    // Save the settings to localStorage
    localStorage.setItem("SoloChatBlock", JSON.stringify(gcC_css_default);
}
