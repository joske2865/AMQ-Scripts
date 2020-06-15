// ==UserScript==
// @name         AMQ Short Sample Radio
// @namespace    https://github.com/FokjeM
// @version      0.1
// @description  Loops through your entire list to not answer songs. Pushes difficulty for them down as fast as possible.
// @author       Riven Skaye // FokjeM
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// ==/UserScript==
// Thanks a million for the help and some of the code bud!
const SCRIPT_INFO = {
        name: "AMQ Short Sample Radio",
        author: "RivenSkaye",
        description: `
            <p>Plays all 5 second samples in your list between difficulty settings 10% - 100% until there is nothing left.</p>
            <p>Adds a button in the top bar of lobbies to start and stop the script. Stops by itself if you've pushed your entire list to below 10% guess rate.</p>
            <p>If your entire list is in 0% - 15% you are a <b>BIG BOOLI</b> and you should feel bad.</p>
        `
    };
AMQ_addScriptData(SCRIPT_INFO);
let ASSRButton = document.createElement("div");
ASSRButton.id = "ASSR";
ASSRButton.innerHTML = "<h1>ASSR</h1>"
$(ASSRButton).addClass("clickAble topMenuButton topMenuBigButton");
$(ASSRButton).css("right", "70.5%");
$("#lnSettingsButton").parent().append(ASSRButton);
$(ASSRButton).click(() => {
    if(!playMore){
        playMore = true;
        ASSR_START();
    } else {
        playMore = false;
    }});

let quizOver;
let oldQuizOver;
let noSongs;
let playMore = false;

function setup(){
    if(document.getElementById('startPage')) {
        return
    }
    oldQuizOver = quiz._quizOverListner;
    noSongs = quiz._noSongsListner;
}

function ASSR_START(OPs=true, EDs=true, INS=true){
    if(!(lobby.inLobby && lobby.soloMode)){
        displayMessage("Error", "You must be in a solo lobby.<br />It is recommended that you use a guest account for the impact on your personal stats.");
        return;
    }
    // Set to 20 songs to prevent AFK timeout, 5s per song, advanced difficulties: 10-100
    hostModal.numberOfSongsSliderCombo.setValue(20);
    hostModal.playLengthSliderCombo.setValue(5);
    hostModal.songDiffAdvancedSwitch.setOn(true);
    hostModal.songDiffRangeSliderCombo.setValue([10,100]);
    // Turn on Auto Skip for the replay phase. Leave the guess phase because we're not entering anything
    options.$AUTO_VOTE_REPLAY.prop("checked", true)
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
}

function startGame(){
    // Start the game
    $("#lbStartButton").click();
}

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
        displayMessage("Error", "You must be in a solo lobby.<br />It is recommended that you use a guest account for the impact on your personal stats.");
        stopCounting();
    }
});

let quizNoSongsListener = new Listener("Quiz no songs", payload => {
    displayMessage("Sasuga", "You must be a true bulli!<br />Mo remaining songs left in 10% - 100%.");
});
