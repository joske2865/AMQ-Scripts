// ==UserScript==
// @name         AMQ Short Sample Radio
// @namespace    SkayeScripts
// @version      1.3.2
// @description  Loops through your entire list to not answer songs. Pushes difficulty for them down as fast as possible.
// @author       Riven Skaye || FokjeM & TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// @downloadURL  https://github.com/RivenSkaye/AMQ-Scripts-1/raw/master/amqShortSampleRadio.user.js
// @updateURL    https://github.com/RivenSkaye/AMQ-Scripts-1/raw/master/amqShortSampleRadio.user.js
// ==/UserScript==
// Thanks a million for the help and some of the code bud!

// Register the script to Joseph's list of installed scripts
const SCRIPT_INFO = {
        name: "AMQ Short Sample Radio",
        author: "RivenSkaye",
        description: `
            <p>Plays all 5 second samples in your list between difficulty settings 10% - 100% until there is nothing left.</p>
            <p>Adds a button in the top bar of lobbies to start the script. Stops when manually returning to lobby or if you've pushed your entire list to below 10% guess rate.</p>
            <p>If your entire list is in 0% - 15% you are a <b>BIG BOOLI</b> and you should feel bad.</p>
        `
    };
AMQ_addScriptData(SCRIPT_INFO);

// Don't do anything on the sign-in page
if(document.getElementById('startPage')) return;

// Create the button to add it later
let ASSRButton = document.createElement("div");
ASSRButton.id = "ASSR";
ASSRButton.innerHTML = "<h1>AMQ pls</h1>"
$(ASSRButton).addClass("clickAble topMenuButton topMenuBigButton");
$(ASSRButton).css("right", "70.5%");
$(ASSRButton).click(() => {
    if(!playMore){
        playMore = true;
        ASSR_START();
    } else {
        ASSR_STOP();
    }});

/*
 * Function to start the game and prevent the AFK timeout
 */
function startGame(){
    // Start the game
    $("#lbStartButton").click();
}

/*
 * Callback function for the MutationObserver on the lobby. Should make sure the script only runs when a lobby is entered.
 */
function lobbyOpen(mutations, observer){
    mutations.forEach((mutation) => {
        mutation.oldValue == "text-center hidden" ? lobby.soloMode ? $("#lnSettingsButton").parent().append(ASSRButton) : null : $(ASSRButton).remove();
    });
}
// Create the observer for opening a lobby
let lobbyObserver = new MutationObserver(lobbyOpen);
// create and start the observer
lobbyObserver.observe($("#lobbyPage")[0], {attributes: true, attributeOldValue: true, characterDataOldValue: true, attributeFilter: ["class"]});

// Variables for listeners so we can unfuck the game
let quizOver;
let oldQuizOver;
let noSongs;
let quizNoSongs;
let playMore = false;

/*
 * Starts the actual script and locks you in 5sNDD settings
 */
function ASSR_START(OPs=true, EDs=true, INS=true){
    if(!(lobby.inLobby && lobby.soloMode)){
        displayMessage("Error", "You must be in a solo lobby.\nIt is recommended that you use a guest account for the impact on your personal stats.", ASSR_STOP);
        return;
    }

    // Save old listeners
    oldQuizOver = quiz._quizOverListner;
    noSongs = quiz._noSongsListner;

    //Create and assign the new ones, kill the old ones
    quizOver = new Listener("quiz over", payload => {
        lobby.setupLobby(payload, quiz.isSpectator);
        viewChanger.changeView("lobby", {
            supressServerMsg: true,
            keepChatOpen: true
        });
        if (lobby.inLobby && lobby.soloMode) {
            playMore ? startGame() : null;
        }
        else {
            displayMessage("Error", "You must be in a solo lobby.\nIt is recommended that you use a guest account for the impact on your personal stats.", ASSR_STOP);
            stopCounting();
        }
    });
    quizOver.bindListener();
    oldQuizOver.unbindListener();

    quizNoSongs = new Listener("Quiz no songs", () => {
    displayMessage("Sasuga", "You must be a true boolli!\nNo remaining songs left in 10% - 100%.", "Whoa snap!", ASSR_STOP());
    });
    quizNoSongs.bindListener();
    noSongs.unbindListener();

    // Set to 20 songs to prevent AFK timeout, 5s per song, advanced difficulties: 10-100, only watched, dups on
    hostModal.numberOfSongsSliderCombo.setValue(20);
    hostModal.playLengthSliderCombo.setValue(5);
    hostModal.songDiffAdvancedSwitch.setOn(true);
    hostModal.songDiffRangeSliderCombo.setValue([10,100]);
    hostModal.songSelectionAdvancedController.setOn(false);
    hostModal.$songPool.slider("setValue", 3);
    $("#mhDuplicateShows").prop("checked", true);

    // Turn on Auto Skip for the replay phase. Leave the guess phase because we're not entering anything
    options.$AUTO_VOTE_REPLAY.prop("checked", true);
    options.updateAutoVoteSkipReplay();

    //Collect the song types and their status
    let openings = hostModal.$songTypeOpening;
    let endings = hostModal.$songTypeEnding;
    let inserts = hostModal.$songTypeInsert;

    //And turn them all on if required
    openings.is(":checked")? (OPs ? null : openings.click()) : (OPs ? openings.click() : null);
    endings.is(":checked") ? (EDs ? null : endings.click()) : (EDs ? endings.click() : null);
    inserts.is(":checked") ? (INS ? null : inserts.click()) : (INS ? inserts.click() : null);

    //Apply game settings
    lobby.changeGameSettings();
    playMore = true;
    startGame();

    // Add event to return to lobby button to stop
    $("#qpReturnToLobbyButton").on('click', (() => {ASSR_STOP(); quiz.startReturnLobbyVote();}));
}

/*
 * Function to stop the script, triggered by returning to lobby
 */
function ASSR_STOP(){
    playMore = false;
    quizOver.unbindListener();
    oldQuizOver.bindListener();
    quizNoSongs.unbindListener();
    noSongs.bindListener();
}
