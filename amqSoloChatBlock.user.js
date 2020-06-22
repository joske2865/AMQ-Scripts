// ==UserScript==
// @name         AMQ Solo Chat Block
// @namespace    SkayeScripts
// @version      0.8.1
// @description  Puts a nice image over the chat in solo and Ranked rooms, customizable. Improves overall performance.
// @author       Riven Skaye // FokjeM
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// @downloadURL  https://github.com/FokjeM/AMQ-Scripts-1/raw/master/amqSoloChatBlock.user.js
// @updateURL    https://github.com/FokjeM/AMQ-Scripts-1/raw/master/amqSoloChatBlock.user.js
// ==/UserScript==

// Register the script to Joseph's list of installed scripts
const SCRIPT_INFO = {
        name: "AMQ Solo Chat Block",
        author: "RivenSkaye",
        description: `
            <p>Hides the chat in Solo rooms, since it's useless anyway. Also allows for killing Ranked chat</p>
            <p>This should hopefully be configurable, someday. For now, you can manually change stuff by setting new values on the SoloChatBlock and BlockRankedChat entries in localStorage.</p>
        `
    };
AMQ_addScriptData(SCRIPT_INFO);

// Don't do anything on the sign-in page
if (!window.setupDocumentDone) return;

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

/*
 * Callback function for the MutationObserver on the lobby. Should make sure the script only runs when a lobby is entered.
 */
function lobbyOpen(mutations, observer){
    mutations.forEach((mutation) => {
        mutation.oldValue == "text-center hidden" ? changeChat() : restoreChat();
    });
}
// Create the observer for opening a lobby
let lobbyObserver = new MutationObserver(lobbyOpen);
// Start the observer
lobbyObserver.observe($("#lobbyPage")[0], {attributes: true, attributeOldValue: true, characterDataOldValue: true, attributeFilter: ["class"]});

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

// Variables to store old and new stuff so we can unfuck later
let gcC_css;
let old_gcC_css;
let settings;
let updateBlockLive = false;

// Grab the local storage or error out
storageAvailable ? settings = window.localStorage : displayMessage("Browser Issue", "Your current browser or session does not support localStorage.\nGet a different browser or change applicable settings.", "Aye");

/*
 * Function that actually replaces the chatbox with an image.
 * Loads in the last saved settings, or the default if nothing was set.
 * Unbinds a lot of listeners for improving performance. Mainly an issue in Ranked.
 */
function changeChat(){
    if(!settings || (!lobby.soloMode && !inRanked())){
        return;
    }
    old_gcC_css = $("#gcContent").css(["backgroundImage", "backgroundRepeat", "backgroundAttachment", "backgroundPosition", "backgroundSize", "transform", "opacity"]);
    // If it's not set yet, create the object in localStorage using the defaults. Hail persistence!
    !settings.getItem("SoloChatBlock") ? localStorage.setItem("SoloChatBlock", JSON.stringify(gcC_css_default)) : null;
    // Load in whatever the last saved ssettings were, or the defaults if we just set them
    gcC_css = JSON.parse(settings.getItem("SoloChatBlock"));
    // Apply the CSS and hide the chat
    $("#gcContent").css(gcC_css);
    $("#gcChatContent").css("display", "none");
    updateBlockLive = true;
    gameChat._newMessageListner.unbindListener();
	gameChat._newSpectatorListner.unbindListener();
	gameChat._spectatorLeftListner.unbindListener();
	gameChat._playerLeaveListner.unbindListener();
	gameChat._spectatorChangeToPlayer.unbindListener();
	gameChat._newQueueEntryListener.unbindListener();
	gameChat._playerLeftQueueListener.unbindListener();
	gameChat._hostPromotionListner.unbindListener();
	gameChat._playerNameChangeListner.unbindListener();
	gameChat._spectatorNameChangeListner.unbindListener();
	gameChat._deletePlayerMessagesListener.unbindListener();
	gameChat._deleteChatMessageListener.unbindListener();
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

/*
 * The actual unfucking of the chat
 * We don't need to bind the listeners again, the game does so when entering a lobby.
 * Binding them will probably cause more issues since the game unbinds when leaving as well.
 */
function restoreChat(){
    $("#gcContent").css(old_gcC_css);
    $("#gcChatContent").css("display", "block");
    updateBlockLive = false;
}

/*
 * A utility function to determine whether or not to block the chat in Ranked.
 * Defaults to NOPE
 */
function inRanked(){
    return settings.getItem("BlockRankedChat") ? (settings.getItem("BlockRankedChat") == "true") : function(){settings.setItem("BlockRankedChat", false); return false;}() && lobby.settings.gameMode === "Ranked";
}
