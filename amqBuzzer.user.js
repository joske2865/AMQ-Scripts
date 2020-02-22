// ==UserScript==
// @name         AMQ Buzzer
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Mutes the song on the buzzer (Enter key on empty answer field) and displays time you buzzed in
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://gist.githubusercontent.com/arantius/3123124/raw/grant-none-shim.js
// ==/UserScript==

if (!window.setupDocumentDone) return;

let songStartTime = 0;
let buzzerTime = 0;
let buzzed = false;

let quizReadyListener = new Listener("quiz ready", data => {
    $("#qpAnswerInput").off("keypress", answerHandler);
    $("#qpAnswerInput").on("keypress", answerHandler);
});

let quizPlayNextSongListener = new Listener("play next song", data => {
    buzzed = false;
    songStartTime = Date.now();
});

let quizAnswerResultsListener = new Listener("answer results", result => {
    volumeController.muted = false;
    volumeController.adjustVolume();
});

let answerHandler = function (event) {
    if (event.which === 13) {
        if ($(this).val() === "" && buzzed === false) {
            buzzed = true;
            buzzerTime = Date.now();
            volumeController.muted = true;
            volumeController.adjustVolume();
            gameChat.systemMessage("Buzzed in: " + formatTime(buzzerTime - songStartTime));
        }
    }
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

quizReadyListener.bindListener();
quizAnswerResultsListener.bindListener();
quizPlayNextSongListener.bindListener();