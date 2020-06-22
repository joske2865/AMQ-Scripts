// ==UserScript==
// @name         AMQ Solo Chat Block
// @namespace    SkayeScripts
// @version      0.8
// @description  Puts a nice image over the chat in solo and Ranked rooms, customizable. Improves overall performance.
// @author       Riven Skaye // FokjeM & TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// @downloadURL  https://github.com/TheJoseph98/AMQ-Scripts/raw/master/test/amqSoloChatBlocker.user.js
// @updateURL    https://github.com/TheJoseph98/AMQ-Scripts/raw/master/test/amqSoloChatBlocker.user.js
// ==/UserScript==

if (!window.setupDocumentDone) return;

const SCRIPT_INFO = {
        name: "AMQ Solo Chat Block",
        author: "RivenSkaye & TheJoseph98",
        description: `
            <p>Hides the chat in Solo rooms, since it's useless anyway. Also allows for killing Ranked chat</p>
            <p>This should hopefully be configurable, someday. For now, you can manually change stuff by setting new values on the SoloChatBlock and BlockRankedChat entries in localStorage.</p>
        `
    };
AMQ_addScriptData(SCRIPT_INFO);

// Function to check if localStorage even exists here. If it doesn't, people are using a weird browser and we can't support them.
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

let hostGameListener = new Listener("Host Game", payload => {
    if (payload.soloMode) {
        changeChat();
    }
    else {
        restoreChat();
    }
});

let joinGameListener = new Listener("Join Game", payload => {
    if (payload.settings.gameMode === "Ranked" && localStorage.getItem("BlockRankedChat") === "true") {
        changeChat();
    }
    else {
        restoreChat();
    }
});

let spectateGameListener = new Listener("Spectate Game", payload => {
    if (payload.settings.gameMode === "Ranked" && localStorage.getItem("BlockRankedChat") === "true") {
        changeChat();
    }
    else {
        restoreChat();
    }
});

hostGameListener.bindListener();
joinGameListener.bindListener();
spectateGameListener.bindListener();

//These are the defaults. Laevateinn should be bliss to everyone. JQuery CSS notation since we leverage Ege's resources.
const gcC_css_default = {
    "backgroundImage": "url(https://i.imgur.com/9gdEjUf.jpg)",
    "backgroundRepeat": "no-repeat",
    "backgroundAttachment": "fixed",
    "backgroundPosition": "left top",
    "backgroundSize": "cover",
    "transform": "scale(1, 1)",
    "opacity": 1.0
};
let gcC_css;
let old_gcC_css;
let settings;
let updateBlockLive = false;
storageAvailable ? settings = window.localStorage : displayMessage("Browser Issue", "Your current browser or session does not support localStorage.\nGet a different browser or change applicable settings.", "Aye");

/*
 * unbind chat listeners if chat is blocked.
 * Since the host/join/spectate listeners fire before gameChat.openView, it means that chat listeners are unbound (via changeChat function) and then bound again.
 * overloading gameChat.openView fixes that
 */
let oldOpenView = GameChat.prototype.openView.bind(gameChat);
GameChat.prototype.openView = function () {
    oldOpenView();
    if (updateBlockLive) {
        this._newMessageListner.unbindListener();
        this._newSpectatorListner.unbindListener();
        this._spectatorLeftListner.unbindListener();
        this._playerLeaveListner.unbindListener();
        this._spectatorChangeToPlayer.unbindListener();
        this._newQueueEntryListener.unbindListener();
        this._playerLeftQueueListener.unbindListener();
        this._hostPromotionListner.unbindListener();
        this._playerNameChangeListner.unbindListener();
        this._spectatorNameChangeListner.unbindListener();
        this._deletePlayerMessagesListener.unbindListener();
        this._deleteChatMessageListener.unbindListener();
    }
}

/*
 * Function that actually replaces the chatbox with an image.
 * Loads in the last saved settings, or the default if nothing was set.
 */
function changeChat(){
    if(!settings){
        return;
    }
    updateBlockLive = true;
    old_gcC_css = $("#gcContent").css(["backgroundImage", "backgroundRepeat", "backgroundAttachment", "backgroundPosition", "backgroundSize", "transform", "opacity"]);
    // If it's not set yet, create the object in localStorage using the defaults. Hail persistence!
    !settings.getItem("SoloChatBlock") ? localStorage.setItem("SoloChatBlock", JSON.stringify(gcC_css_default)) : null;
    // Load in whatever the last saved ssettings were, or the defaults if we just set them
    gcC_css = JSON.parse(settings.getItem("SoloChatBlock"));
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
    gcC_css["backgroundImage"] = bg ? `url(${bg})` :  gcC_css["background-image"];
    gcC_css["backgroundRepeat"] = repeat ? repeat : gcC_css["background-repeat"];
    gcC_css["backgroundAttachment"] = attachment ? attachment :  gcC_css["background-attachment"];
    gcC_css["backgroundPosition"] = bgpos ? bgpos :  gcC_css["background-position"];
    gcC_css["backgroundSize"] = size ? size :  gcC_css["background-attachment"];
    gcC_css["transform"] = transform != null ? `scale(${transform ? -1 : 1})` :  gcC_css["transform"];
    gcC_css["opacity"] = opacity != null ? opacity : gcC_css["opacity"];
    // Save the settings to localStorage
    localStorage.setItem("SoloChatBlock", JSON.stringify(gcC_css_default));
}

function restoreChat(){
    updateBlockLive = false;
    $("#gcContent").css(old_gcC_css);
    $("#gcChatContent").css("display", "block");
}
