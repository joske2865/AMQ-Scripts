// ==UserScript==
// @name         AMQ Buzzer
// @namespace    https://github.com/TheJoseph98
// @version      1.1.2
// @description  Mutes the song on the buzzer (Enter key on empty answer field) and displays time you buzzed in
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// @updateURL    https://github.com/TheJoseph98/AMQ-Scripts/raw/master/amqBuzzer.user.js
// ==/UserScript==

// don't load on login page
if (document.getElementById("startPage")) return;

// Wait until the LOADING... screen is hidden and load script
let loadInterval = setInterval(() => {
    if (document.getElementById("loadingScreen").classList.contains("hidden")) {
        setup();
        clearInterval(loadInterval);
    }
}, 500);

let songStartTime = 0;
let buzzerTime = 0;
let isPlayer = false;
let buzzed = false;

let answerHandler;

function showBuzzMessage(buzzTime) {
    gameChat.systemMessage(`Song ${parseInt($("#qpCurrentSongCount").text())}, buzz: ${buzzTime}`);
}

function formatTime(time) {
    let formattedTime = "";
    let milliseconds = Math.floor(time % 1000);
    let seconds = Math.floor(time / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let secondsLeft = seconds - minutes * 60;
    let minutesLeft = minutes - hours * 60;
    if (hours > 0) {
        formattedTime += hours + ":";
    }
    if (minutes > 0) {
        formattedTime += (minutesLeft < 10 && hours > 0) ? "0" + minutesLeft + ":" : minutesLeft + ":";
    }
    formattedTime += (secondsLeft < 10 && minutes > 0) ? "0" + secondsLeft + "." : secondsLeft + ".";
    if (milliseconds < 10) {
        formattedTime += "00" + milliseconds;
    }
    else if (milliseconds < 100) {
        formattedTime += "0" + milliseconds;
    }
    else {
        formattedTime += milliseconds;
    }
    return formattedTime;
}

function setup() {
    let quizReadyListener = new Listener("quiz ready", data => {
        // reset the event listener
        $("#qpAnswerInput").off("keypress", answerHandler);
        $("#qpAnswerInput").on("keypress", answerHandler);
    });

    let quizPlayNextSongListener = new Listener("play next song", data => {
        // reset the "buzzed" flag and get the start time on song start
        buzzed = false;
        songStartTime = Date.now();
    });

    let quizAnswerResultsListener = new Listener("answer results", result => {
        // show the buzz message only if the player is playing the game (ie. is not spectating)
        isPlayer = Object.values(quiz.players).some(player => player.isSelf === true);
        if (!buzzed && isPlayer) {
            showBuzzMessage("N/A");
        }
        // unmute only if the player muted the sound by buzzing and not by manually muting the song
        if (buzzed) {
            volumeController.muted = false;
            volumeController.adjustVolume();
        }
    });

    answerHandler = function (event) {
        // on enter key
        if (event.which === 13) {
            // check if the answer field is empty and check if the player has not buzzed before, so to not spam the chat with messages
            if ($(this).val() === "" && buzzed === false) {
                buzzed = true;
                buzzerTime = Date.now();
                volumeController.muted = true;
                volumeController.adjustVolume();
                showBuzzMessage(formatTime(buzzerTime - songStartTime));
            }
        }
    }

    quizReadyListener.bindListener();
    quizAnswerResultsListener.bindListener();
    quizPlayNextSongListener.bindListener();

    AMQ_addScriptData({
        name: "Buzzer",
        author: "TheJoseph98 & Anopob",
        description: `
            <p>Adds a buzzer to AMQ, you activate it by pressing the Enter key in the empty answer field</p>
            <p>When you buzz, your sound will be muted until the answer reveal and in chat you will receive a message stating how fast you buzzed since the start of the song</p>
            <p>The timer starts when the guess phase begins (NOT when you get sound)</p>
        `
    });
}
