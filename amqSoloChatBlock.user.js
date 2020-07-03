// ==UserScript==
// @name         AMQ Solo Chat Block
// @namespace    SkayeScripts
// @version      1.3.2
// @description  Puts a nice image over the chat in solo and Ranked rooms, customizable. Improves overall performance.
// @author       Riven Skaye || FokjeM
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// @downloadURL  https://github.com/FokjeM/AMQ-Scripts-1/raw/master/amqSoloChatBlock.user.js
// @updateURL    https://github.com/FokjeM/AMQ-Scripts-1/raw/master/amqSoloChatBlock.user.js
// ==/UserScript==

/*** Common code to many scripts ***/
//Register to Joseph's list
const SCRIPT_INFO = {
        name: "AMQ Solo Chat Block",
        author: "RivenSkaye",
        description: `
            <p>Hides the chat in Solo rooms, since it's useless anyway. Also allows for killing Ranked chat</p>
            <p>This should hopefully be configurable, someday. For now, you can manually change stuff by setting new values on the SoloChatBlock and BlockRankedChat entries in localStorage.</p>
        `
    };
AMQ_addScriptData(SCRIPT_INFO);
// Make sure not to run on before the page is loaded
if (!window.setupDocumentDone) return;

/*** Setup for this script ***/
/*
 * Callback function for the MutationObserver on the lobby.
 * This observer makes sure the script only runs when a lobby is entered without using eventspace.
 * After all, the main target of this script is to reduce the amount of eventhandlers
 * in places where they are either useless or causing problems.
 */
function lobbyOpen(mutations, observer){
    mutations.forEach((mutation) => {
        mutation.oldValue == "text-center hidden" ? setTimeout(changeChat, 50) : null;
    });
}
// Create the observer for opening a lobby and start it. Listen for class changes on the object, since those signal hiding/showing it
let lobbyObserver = new MutationObserver(lobbyOpen);
lobbyObserver.observe($("#lobbyPage")[0], {attributes: true, attributeOldValue: true, characterDataOldValue: true, attributeFilter: ["class"]});
// Fix for room hopping by invite. Requires using an event because there is no detectable difference within any existing objects.
let switchGameListener = new Listener("Spectate Game", () => {
    setTimeout(restoreChat, 100);
});

//These are the default settings. Laevateinn should be bliss to everyone.
const gcC_css_default = {
    "backgroundImage": "url(https://i.imgur.com/9gdEjUf.jpg)",
    "backgroundRepeat": "no-repeat",
    "backgroundPosition": "left top",
    "backgroundSize": "cover",
    "backgroundAttachment": "fixed",
    "transform": "scale(1)",
    "opacity": 1.0
};
// Variables for setting and changing data
let gcC_css;
let old_gcC_css;
let settings;
let NCM_restore;
// A small helper to prevent people from expecting preview stuff
let chat_exists = false;
let user_ack = false;

// The page loaded, so we move on to testing storage. Set settings or error out
storageAvailable ? settings = window.localStorage : displayMessage("Browser Issue", "Your current browser or session does not support localStorage.\nGet a different browser or change applicable settings.");
if(!settings) return; // Exit if we can't do anything

// Initialize some stuff and create DOM objects
initSettingsWindow();

/*** Function definitions ***/
/*
 * Function that actually replaces the chatbox with an image.
 * Loads in the last saved settings, or the default if nothing was set.
 */
function changeChat(){
    // This should only be false if a lobby has not been opened before
    chat_exists = true;
    // Check if it has a value already, to prevent entering a solo room twice in one session from breaking the chat
    old_gcC_css = old_gcC_css ? old_gcC_css : getOldStyles(Object.keys(gcC_css));
    // Then check if this is valid, since we wouldn't want tp restore undefined.
    if(!settings || (!inRanked() && lobby.settings.roomSize > 1)){
        restoreChat();
        return;
    }
    // unbind all listeners
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
    // If you join another game, we gotta restore the chat
    switchGameListener.bindListener();
    // For the complete delete mode
    if(settings.getItem("NoChatMode") ? settings.getItem("NoChatMode") == "true" : false){
        noChatMode();
    }
    // In any other case
    else {
        // Apply the CSS and hide the chat
        $("#gcContent").css(gcC_css);
    }
    // And always remove the input box
    $("#gcChatContent").css("display", "none");
}

/*
 * Edgecase function, someone wants the chat block GONE
 */
function noChatMode(){
    $("#gcContent").css({"backgroundImage": "none", "opacity": 0});
    let killkeys = ['background-color', '-webkit-box-shadow', 'box-shadow'];
    NCM_restore = $("#gameChatContainer").css(killkeys);
    killkeys.forEach((key) => {
        let val;
        key == 'background-color' ? val = "rgba(0,0,0,0)" : val = "none";
        // just delete the properties altogether
        $("#gameChatContainer").css(key, val);
    });
    $("#lobbyCountContainer").css({'right': '-25vw'});
}

/*
 * Undo the changes specific to No Chat Mode
 */
function undoNCM(){
    $("#gameChatContainer").css(NCM_restore);
    $("#lobbyCountContainer").css({'right': '0px'});
    $("#gcContent").css(gcC_css);
    NCM_restore = null;
}

/*
 * Restores the chat to its original state.
 * This should always be called when joining a new, non-targeted room
 */
function restoreChat(){
    // If we're in No Chat Mode, restore to script defaults first!
    NCM_restore ? undoNCM() : null;
    switchGameListener.unbindListener();
    $("#gcContent").css(old_gcC_css);
    $("#gcChatContent").css("display", "");
    // DO NOT BIND THE LISTENERS or you'd be listening to two chats. Enjoy running it on ranked and leaving midway then
}

/*
 * Internal function to update settings. Just grab the current CSS values and roll with it.
 * WYSIWYG, which is exactly what a user wants to save.
 */
function updateSettings(){
    // Get all dem CSS. Ordering is important for CSS!
    // Background image link, or none if empty
    gcC_css.backgroundImage = $("#soloChatBlockImg").val() ? `url(${$("#soloChatBlockImg").val()})` : "none";
    // Repeat value
    gcC_css.backgroundRepeat = $("#SoloChatBlockRepeat").val();
    // Jump through a hoop, get the checked radio button's value and ignore the rest
    gcC_css.backgroundPosition = $('input[name="SoloChatBlockPositionSelect"]:checked').val();
    // Selected size option
    gcC_css.backgroundSize = $("#SoloChatBlockSize").val();
    // Selected attachment option
    gcC_css.backgroundAttachment = $("#SoloChatBlockAttachment").val();
    // Transform value, this decides whether or not to flip the image
    gcC_css.transform = $("#SoloChatBlockTransform").val();
    // Opacity, we need to transform this to usable values
    gcC_css.opacity = Number($("#soloChatBlockOpacity").val())/100;
    // Apply for good measure
    $("#gcContent").css(gcC_css);
    // Save the settings to localStorage
    settings.setItem("SoloChatBlock", JSON.stringify(gcC_css));
}

/*
 * Function to apply content changes in preview mode.
 * Takes a property name and a value to update in the chat block
 */
function settingsChangePreview(property, value){
    if(!chat_exists){
        user_ack ? null : displayMessage("Can't change options!", "The chat object does not exist until after entering a room or lobby.\nYou may change the settings and save them, but preview mode is unavailable.");
        user_ack = true;
        return;
    }
    if(!inRanked() || lobby.settings.roomSize > 1){
       return;
    }
    // If it's a backgroundImage or opacity value, we should set it to CSS values. These can be quite tricky and I just want it to be easy in the HTML part. Pass only property and value.
    property === "backgroundImage" ? value ? value = `url(${value})` : "none" : property === "opacity" ? value = Number(value)/100 : null;
    // Except for the above cases before changing them, any property-value pair should be usable as-is
    let preview_css = Object.assign({}, gcC_css);
    preview_css[property] = value;
    $("#gcContent").css(property, value);
}

/*** Helper functions ***/
/*
 * Helper function to determine if the user is in Ranked
 */
function inRanked(){
    return settings.getItem("BlockRankedChat") ? (settings.getItem("BlockRankedChat") == "true" && lobby.settings.gameMode === "Ranked") : function(){settings.setItem("BlockRankedChat", false); return false;}() && lobby.settings.gameMode === "Ranked";
}
/*
 * Function to check if localStorage even exists here. If it doesn't, people are using a weird browser and we can't support them.
 * Tests the storage by adding and removing an object from it. If it all succeeds, we can carry on and run this script
 */
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
 * Function that gets all currently set styles on the chat and saves them to old_gcC_css
 */
function getOldStyles(keys){
    let ret = {};
    keys.forEach(key => {
        let val = $("#gcContent").css(key);
        ret[key] = typeof val !== "undefined" ? val : "";
    });
    return ret;
}

/*** Not even really a function anymore. This behemoth creates and inserts the settings modal. BOW TO IT, FOR IT PRESENTS YOU WITH THE OPTION TO VIEW YOUR WAIFU! ***/

/*
 * Function that runs once to create the settings window and add it to the game.
 * Adds an entry to the settings slide-out to customize options. Use it while in a lobby to see live changes.
 * Click save to save the settings, close the window to undo them.
 * Initializes some starting data as well.
 */
function initSettingsWindow(){
    //create the window. Inspired by TheJoseph98's amqScriptInfo.js, which can be found in the @require link up top.
    if (!window.setupDocumentDone) return;

    // If it's not set yet, create the object in localStorage using the defaults. Hail persistence!
    !settings.getItem("SoloChatBlock") ? localStorage.setItem("SoloChatBlock", JSON.stringify(gcC_css_default)) : null;
    // Load in whatever the last saved ssettings were, or the defaults if we just set them
    gcC_css = JSON.parse(settings.getItem("SoloChatBlock"));

    // If it doesn't exist, create the entire modal window without the relevant content. THIS IS HELL
    // Adding content is done in a seperate function call to allow for easy fixing when "Cancel" is pressed
    if ($("#soloChatBlock").length === 0) {
        $("#gameContainer").append($(`
            <div class="modal fade" id="soloChatBlock" tabindex="-1" role="dialog">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="cancel">
                                <span aria-hidden="true">x</span>
                            </button>
                            <h2 class="modal-title">Solo Chat Block Configuration</h2>
                            <p style='text-align: center; font-style: italic;'>Changes are applied as preview, click 'Cancel' to undo them.<br />Exiting without clicking cancel leaves the preview as-is.</p>
                        </div>
                        <div class="modal-body" style="overflow-y: auto; max-height: calc(83vh - 150px);">
                            <div style='text-align: center;'>
                                <h2 style='display: inline-block;'>Block Ranked Chat?</h2>
                                <div class='customCheckbox' style='margin-left: 2vw;'>
                                    <input type='checkbox' id='mhKillRankedChat'${settings.getItem("BlockRankedChat") ? settings.getItem("BlockRankedChat") == "true" ? " checked=''" : null : settings.setItem("BlockRankedChat", false)} />
                                    <label for='mhKillRankedChat'><i class="fa fa-check" aria-hidden="true"></i></label>
                                </div>
                                <p style='font-style: italic;'>Changing this applies immediately. Re-enter ranked to trigger.</p>
                            </div>
                            <div style='text-align: center;'>
                                <h2 style='display: inline-block;'>No Chat Mode?</h2>
                                <div class='customCheckbox' style='margin-left: 2vw;'>
                                    <input type='checkbox' id='mhNoChatMode'${settings.getItem("NoChatMode") ? settings.getItem("NoChatMode") == "true" ? " checked=''" : null : settings.setItem("NoChatMode", false)} />
                                    <label for='mhNoChatMode'><i class="fa fa-check" aria-hidden="true"></i></label>
                                </div>
                                <p style='font-style: italic;'>Changing this applies immediately. Deletes chat completely.</p>
                            </div>
                            <div id="scbcContainer" style='text-align: center;'>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button id="scbcCancel" class="btn btn-default" type="button" data-dismiss="modal">Cancel</button>
                            <button id="scbcSave" class="btn btn-primary" type="button" data-dismiss="modal">Save</button>
                        </div>
                    </div>
                </div>
            </div>
        `));

        // Add the menu option
        $("#optionsContainer > ul").prepend($(`
            <li id='SoloChatBlockOptionsMenuItem' class="clickAble" data-toggle="modal" data-target="#soloChatBlock">Solo Chat Block</li>
        `));

        // Add the event for turning it on/off for Ranked
        $("#mhKillRankedChat").change(function(){
            // If the setting doesn't exist, or it's false, set it to true. If it's true, set it to false. Double inline if because these are much faster than if{if...else}...else
            settings.getItem("BlockRankedChat") ? settings.getItem("BlockRankedChat") == "true" ? settings.setItem("BlockRankedChat", false) : settings.setItem("BlockRankedChat", true) : settings.setItem("BlockRankedChat", true);
        });

        // Rig up for No Chat Mode
        $("#mhNoChatMode").change(function(){
            settings.getItem("NoChatMode") ? settings.getItem("NoChatMode") == "true" ? settings.setItem("NoChatMode", false) : settings.setItem("NoChatMode", true) : settings.setItem("NoChatMode", false)
            // Alternate between on and off
            NCM_restore ? undoNCM() : noChatMode();
        });

        // Fill up the modal with the configuration options
        addSettingsContent();

        // They clicked "Cancel"! Remove everything we added and create it from scratch. Don't forget to restore shit!
        // The cancel and save buttons are static, so their events should only be assigned an action once
        $("#scbcCancel").click(function(){
            // Put the CSS back to the last saved state
            $("#gcContent").css(gcC_css);
            // Make sure NOTHING remains since we'll be creating everything from scratch
            $("#scbcContainer").empty();
            // And fill it up again, since it's less work to paste HTML than to traverse it
            addSettingsContent();
        });

        // This is the worst case scenario. Someone doesn't like Laevateinn and wants to change the image.
        $("#scbcSave").click(updateSettings);
    }
}

/*
 * Internal helper function, creates and adds all of the new menu internals.
 * Split off so we can easily delete them and put them back instead of manually resetting all values.
 * When creating these from scratch, make sure to call $(parent).empty() to ensure no data remains!
 */
function addSettingsContent(){
    // Input element for the image link
    let imgSelect = $(`<div style='margin-top: 2vh;'>
                          <h2>Image link</h2>
                          <input style='text-align: center; width: 62.5%; color: black;' type='text' id='soloChatBlockImg' value='${gcC_css.backgroundImage.slice(4, -1)}' />
                      </div>`);
    // Select element for the repeat option
    let repeatSelect = $(`<div style='margin-top: 2vh;'>
                              <h2>Repeat value</h2>
                              <select style='text-align: center; width: 62.5%; color: black;' id='SoloChatBlockRepeat'>
                                  <option value='repeat'${gcC_css.backgroundRepeat === "repeat" ? ' selected' : ""}>repeat</option>
                                  <option value='repeat-x'${gcC_css.backgroundRepeat === "repeat-x" ? ' selected' : ""}>repeat-x</option>
                                  <option value='repeat-y'${gcC_css.backgroundRepeat === "repeat-y" ? ' selected' : ""}>repeat-y</option>
                                  <option value='no-repeat'${gcC_css.backgroundRepeat === "no-repeat" ? ' selected' : ""}>no-repeat</option>
                                  <option value='initial'${gcC_css.backgroundRepeat === "initial" ? ' selected' : ""}>initial</option>
                                  <option value='inherit'${gcC_css.backgroundRepeat === "inherit" ? ' selected' : ""}>inherit</option>
                              </select>
                          <div>`);
    // Radiobuttons to select the anchoring position. SWEET JESUS NEVER AGAIN
    let positionSelect = $(`<div class='checkboxContainer' style='margin-top: 2vh;'>
                                <h2>Anchor Position Selector</h2>
                                <div style='margin: auto 2vw;'>
                                    <div class="customCheckbox">
                                        <input value='left top' class='SoloChatBlockPositionRadio' id="scbLeftTop" type="radio" name='SoloChatBlockPositionSelect'${gcC_css.backgroundPosition === "left top" ? ' checked' : ""}>
                                        <label for="scbLeftTop"><i class="fa fa-check" aria-hidden="true"></i></label>
                                        <p></p>
                                    </div>
                                    <p>Left Top</p>
                                </div>
                                <div style='margin: auto 2vw;'>
                                    <div class="customCheckbox">
                                        <input value='left center' class='SoloChatBlockPositionRadio' id="scbLeftCenter" type="radio" name='SoloChatBlockPositionSelect'${gcC_css.backgroundPosition === "left center" ? ' checked' : ""}>
                                        <label for="scbLeftCenter"><i class="fa fa-check" aria-hidden="true"></i></label>
                                        <p></p>
                                    </div>
                                    <p>Left Center</p>
                                </div>
                                <div style='margin: auto 2vw;'>
                                    <div class="customCheckbox">
                                        <input value='left bottom' class='SoloChatBlockPositionRadio' id="scbLeftBottom" type="radio" name='SoloChatBlockPositionSelect'${gcC_css.backgroundPosition === "left bottom" ? ' checked' : ""}>
                                        <label for="scbLeftBottom"><i class="fa fa-check" aria-hidden="true"></i></label>
                                        <p></p>
                                    </div>
                                    <p>Left Bottom</p>
                                </div><br />
                                <div style='margin: auto 2vw;'>
                                    <div class="customCheckbox">
                                        <input value='center top' class='SoloChatBlockPositionRadio' id="scbCenterTop" type="radio" name='SoloChatBlockPositionSelect'${gcC_css.backgroundPosition === "center top" ? ' checked' : ""}>
                                        <label for="scbCenterTop"><i class="fa fa-check" aria-hidden="true"></i></label>
                                        <p></p>
                                    </div>
                                    <p>Center Top</p>
                                </div>
                                <div style='margin: auto 2vw;'>
                                    <div class="customCheckbox">
                                        <input value='center center' class='SoloChatBlockPositionRadio' id="scbCenterCenter" type="radio" name='SoloChatBlockPositionSelect'${gcC_css.backgroundPosition === "center center" ? ' checked' : ""}>
                                        <label for="scbCenterCenter"><i class="fa fa-check" aria-hidden="true"></i></label>
                                        <p></p>
                                    </div>
                                    <p>Center Center</p>
                                </div>
                                <div style='margin: auto 2vw;'>
                                    <div class="customCheckbox">
                                        <input value='center bottom' class='SoloChatBlockPositionRadio' id="scbCenterBottom" type="radio" name='SoloChatBlockPositionSelect'${gcC_css.backgroundPosition === "center bottom" ? ' checked' : ""}>
                                        <label for="scbCenterBottom"><i class="fa fa-check" aria-hidden="true"></i></label>
                                        <p></p>
                                    </div>
                                    <p>Center Bottom</p>
                                </div><br />
                                <div style='margin: auto 2vw;'>
                                    <div class="customCheckbox">
                                        <input value='right top' class='SoloChatBlockPositionRadio' id="scbRightTop" type="radio" name='SoloChatBlockPositionSelect'${gcC_css.backgroundPosition === "right top" ? ' checked' : ""}>
                                        <label for="scbRightTop"><i class="fa fa-check" aria-hidden="true"></i></label>
                                        <p></p>
                                    </div>
                                    <p>Right Top</p>
                                </div>
                                <div style='margin: auto 2vw;'>
                                    <div class="customCheckbox">
                                        <input value='right center' class='SoloChatBlockPositionRadio' id="scbRightCenter" type="radio" name='SoloChatBlockPositionSelect'${gcC_css.backgroundPosition === "right center" ? ' checked' : ""}>
                                        <label for="scbRightCenter"><i class="fa fa-check" aria-hidden="true"></i></label>
                                        <p></p>
                                    </div>
                                    <p>Right Center</p>
                                </div>
                                <div style='margin: auto 2vw;'>
                                    <div class="customCheckbox">
                                        <input value='right bottom' class='SoloChatBlockPositionRadio' id="scbRightBottom" type="radio" name='SoloChatBlockPositionSelect'${gcC_css.backgroundPosition === "right bottom" ? ' checked' : ""}>
                                        <label for="scbRightBottom"><i class="fa fa-check" aria-hidden="true"></i></label>
                                        <p></p>
                                    </div>
                                    <p>Right Bottom</p>
                                </div>
                            </div>`);
    // Select element for the usual CSS Size options. Custom Values can be set through the console / inspector stuff
    let sizeSelect = $(`<div style='margin-top: 2vh;'>
                            <h2>Size Selector</h2>
                            <p>Static options only, working with multiple value types is a lot of effort, set those through the console instead.</p>
                            <select style='text-align: center; width: 62.5%; color: black;' id='SoloChatBlockSize'>
                                <option value='auto'${gcC_css.backgroundSize === "auto" ? ' selected' : ""}>auto</option>
                                <option value='cover'${gcC_css.backgroundSize === "cover" ? ' selected' : ""}>cover</option>
                                <option value='contain'${gcC_css.backgroundSize === "contain" ? ' selected' : ""}>contain</option>
                            </select>
                          </div>
                        </div>`);
    // Select element for the attachment value. Some of the names aren't logical, so the text presented to the user is added to make it more logical
    let attachmentSelect = $(`<div style='margin-top: 2vh;'>
                                  <h2>Attachment Selector</h2>
                                  <p>This usually doesn't need editing, but it's included as to provide all possible options.<br />
                                     The only case that would warrant changing it is by selecting flip to "force as-is" as the transform should make the image cover the chat</p>
                                  <select style='text-align: center; width: 62.5%; color: black;' id='SoloChatBlockAttachment'>
                                      <option value='fixed'${gcC_css.backgroundAttachment === "fixed" ? ' selected' : ""}>fixed</option>
                                      <option value='scroll'${gcC_css.backgroundAttachment === "scroll" ? ' selected' : ""}>scroll with page</option>
                                      <option value='local'${gcC_css.backgroundAttachment === "local" ? ' selected' : ""}>scroll with element</option>
                                  </select>
                                </div>
                              </div>`);
    // Select element for flipping or not flipping the image.
    let transformSelect = $(`<div style='margin-top: 2vh;'>
                            <h2>Flip Image Selector</h2>
                            <p>Whether or not to flip the image. This property uses CSS transform's scale function to make the image fill out the chat space. Use "Force original" to prevent the CSS transform property from being used.</p>
                            <select style='text-align: center; width: 62.5%; color: black;' id='SoloChatBlockTransform'>
                                <option value='scale(-1, 1)'${gcC_css.transform.localeCompare("scale(-1, 1)") == 0 ? ' selected' : ""}>Flip image</option>
                                <option value='scale(1)'${gcC_css.transform.localeCompare("scale(1)") == 0 ? ' selected' : ""}>Don't flip image</option>
                            </select>
                          </div>
                        </div>`);
    // Change the opacity of the chat so the image becomes see-through
    let opacitySelect = $(`<div style='margin-top: 2vh;'>
                           <h2>Element opacity</h2>
                           <p>Set the entire box's opacity on a scale of 0 (invisible) to 100 (default, fully visible)
                              <input style='text-align: center; width: 62.5%; color: black;' type='number' id='soloChatBlockOpacity' value='${Number(gcC_css.opacity)*100}' min='0' max='100' step='1' />
                           </div>`);
    // Add all of the options to the modal window to create a nice menu. Thanks for laying out the groundwork Ege and Joseph!
    $("#scbcContainer").append(imgSelect);
    $("#scbcContainer").append(repeatSelect);
    $("#scbcContainer").append(positionSelect);
    $("#scbcContainer").append(sizeSelect);
    $("#scbcContainer").append(attachmentSelect);
    $("#scbcContainer").append(transformSelect);
    $("#scbcContainer").append(opacitySelect);
    // Assign the functions for the change events for live previews
    $("#soloChatBlockImg").change(function(){
        settingsChangePreview("backgroundImage", this.value);
    });
    $("#SoloChatBlockRepeat").change(function(){
        settingsChangePreview("backgroundRepeat", this.value);
    });
    // This uses a class instead of an ID because all those radiobuttons change the same thing
    $(".SoloChatBlockPositionRadio").change(function(){
        settingsChangePreview("backgroundPosition", this.value);
    });
    $("#SoloChatBlockSize").change(function(){
        settingsChangePreview("backgroundSize", this.value);
    });
    $("#SoloChatBlockAttachment").change(function(){
        settingsChangePreview("backgroundAttachment", this.value);
    });
    $("#SoloChatBlockTransform").change(function(){
        settingsChangePreview("transform", this.value);
    });
    $("#soloChatBlockOpacity").on('input', function(){
        settingsChangePreview("opacity", this.value);
    });
}
