// ==UserScript==
// @name         AMQ Speedrun
// @namespace    https://github.com/TheJoseph98
// @version      1.1.4
// @description  Tracks guess times for each song, including total and average times
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqWindows.js
// @updateURL    https://github.com/TheJoseph98/AMQ-Scripts/raw/master/amqSpeedrun.user.js
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

let fastestGuess = 999999;
let slowestGuess = 0;
let totalTime = 0;
let averageCorrect = 0;
let correctCount = 0;
let averageTotal = 0;
let guessRate = 0;
let previousGuess = 0;
let times = {};

let songStartTime = 0;
let answerSubmitTime = 0;
let autoSubmitFlag = true;

let speedrunWindow;

let oldWidth = $("#qpOptionContainer").width();
$("#qpOptionContainer").width(oldWidth + 35);
$("#qpOptionContainer > div").append($(`<div id="qpSpeedrun" class="clickAble qpOption"><i aria-hidden="true" class="fa fa-clock-o qpMenuItem"></i></div>`)
    .click(() => {
        if (speedrunWindow.isVisible()) {
            speedrunWindow.close();
        }
        else {
            speedrunWindow.open();
        }
    })
    .popover({
        content: "Speedrun",
        trigger: "hover",
        placement: "bottom"
    })
);

function createSpeedrunWindow() {
    speedrunWindow = new AMQWindow({
        title: "Speedrun",
        width: 250,
        height: 400,
        minWidth: 250,
        minHeight: 330,
        zIndex: 1055,
        draggable: true,
        resizable: true,
    });

    speedrunWindow.addPanel({
        width: 1.0,
        height: 145,
        id: "speedrunWindowUpper"
    });

    speedrunWindow.panels[0].addPanel({
        width: "calc(65% - 5px)",
        height: 1.0,
        position: {
            x: 5,
            y: 0
        },
        id: "speedrunInfoLeft"
    });

    speedrunWindow.panels[0].addPanel({
        width: "calc(35% - 5px)",
        height: 1.0,
        position: {
            x: 0.65,
            y: 0
        },
        id: "speedrunInfoRight"
    });

    speedrunWindow.addPanel({
        width: 1.0,
        height: "calc(100% - 145px)",
        position: {
            x: 0,
            y: 145
        },
        scrollable: {
            x: false,
            y: true
        }
    });

    speedrunWindow.panels[1].addPanel({
        width: "calc(50% - 5px)",
        height: "auto",
        position: {
            x: 5,
            y: 0
        },
        id: "speedrunTimesLeft"
    });

    speedrunWindow.panels[1].addPanel({
        width: "calc(50% - 5px)",
        height: "auto",
        position: {
            x: 0.5,
            y: 0
        },
        id: "speedrunTimesRight"
    });

    speedrunWindow.panels[0].panels[0].panel
        .html(`
            <p>Fastest correct guess:</p>
            <p>Slowest correct guess:</p>
            <p>Guess rate:</p>
            <p>Average time (correct):</p>
            <p>Average time (total):</p>
            <p>Total time:</p>
            <p>Previous guess time:</p>
        `);

    speedrunWindow.panels[0].panels[1].panel
        .html(`
            <p id="srFastestTime">0.000</p>
            <p id="srSlowestTime">0.000</p>
            <p id="srGuessRate">0%</p>
            <p id="srAverageCorrect">0.000</p>
            <p id="srAverageTotal">0.000</p>
            <p id="srTotalTime">0.000</p>
            <p id="srPreviousTime">0.000</p>
        `);
}

function updateInfo(songNumber, newTime) {
    $("#srFastestTime").text(formatTime(fastestGuess));
    $("#srSlowestTime").text(formatTime(slowestGuess));
    $("#srGuessRate").text((guessRate * 100).toFixed(2) + "%");
    $("#srAverageCorrect").text(formatTime(averageCorrect));
    $("#srAverageTotal").text(formatTime(averageTotal));
    $("#srTotalTime").text(formatTime(totalTime));
    $("#srPreviousTime").text(formatTime(previousGuess));
    speedrunWindow.panels[1].panels[0].panel.append($("<p></p>").text("Song " + songNumber));
    speedrunWindow.panels[1].panels[1].panel.append($("<p></p>").text(formatTime(newTime.time)));
    speedrunWindow.panels[1].panel.scrollTop(speedrunWindow.panels[1].panel.get(0).scrollHeight);
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

function resetTimes() {
    $("#speedrunTimesLeft").html("");
    $("#speedrunTimesRight").html("");
    $("#srFastestTime").text("0.000");
    $("#srSlowestTime").text("0.000");
    $("#srGuessRate").text("0%");
    $("#srAverageCorrect").text("0.000");
    $("#srAverageTotal").text("0.000");
    $("#srTotalTime").text("0.000");
    $("#srPreviousTime").text("0.000");
    fastestGuess = 999999;
    slowestGuess = 0;
    totalTime = 0;
    averageCorrect = 0;
    correctCount = 0;
    averageTotal = 0;
    guessRate = 0;
    previousGuess = 0;
    times = {};
}

function setup() {
    createSpeedrunWindow();

    // clear times on quiz ready
    let quizReadyListener = new Listener("quiz ready", data => {
        resetTimes();
        $("#qpAnswerInput").off("keypress", answerHandler);
        $("#qpAnswerInput").on("keypress", answerHandler);
    });

    // start timer on song start
    let quizPlayNextSongListener = new Listener("play next song", data => {
        songStartTime = Date.now();
        autoSubmitFlag = true;
    });


    // set time on answer reveal
    let quizAnswerResultsListener = new Listener("answer results", result => {
        // check if the player is playing the game
        let findPlayer = Object.values(quiz.players).find((tmpPlayer) => {
            return tmpPlayer._name === selfName && tmpPlayer.avatarSlot._disabled === false
        });
        if (findPlayer !== undefined) {
            let playerIdx = Object.values(result.players).findIndex(tmpPlayer => {
                return findPlayer.gamePlayerId === tmpPlayer.gamePlayerId
            });
            let tmpGuessTime = answerSubmitTime - songStartTime;
            let tmpCorrect = result.players[playerIdx].correct;
            let songNumber = parseInt($("#qpCurrentSongCount").text());
            if (tmpCorrect === false) {
                tmpGuessTime = (quizVideoController.getCurrentPlayer().bufferLength - 13) * 1000;
                guessRate = (guessRate*(songNumber-1) + 0) / songNumber;
                if (tmpGuessTime < fastestGuess) {
                    fastestGuess = tmpGuessTime;
                }
            }
            else {
                correctCount++;
                if (autoSubmitFlag === true) {
                    tmpGuessTime = (quizVideoController.getCurrentPlayer().bufferLength - 13) * 1000;
                }
                if (tmpGuessTime < fastestGuess) {
                    fastestGuess = tmpGuessTime;
                }
                if (tmpGuessTime > slowestGuess) {
                    slowestGuess = tmpGuessTime;
                }
                averageCorrect = (averageCorrect*(correctCount-1) + tmpGuessTime) / correctCount;
                guessRate = (guessRate*(songNumber-1) + 1) / songNumber;
            }
            previousGuess = tmpGuessTime;
            averageTotal = (averageTotal*(songNumber-1) + tmpGuessTime) / songNumber;
            totalTime += tmpGuessTime;
            times[songNumber] = {
                correct: tmpCorrect,
                time: tmpGuessTime
            }
            updateInfo(songNumber, times[songNumber]);
        }
    });

    let answerHandler = function (event) {
        if (event.which === 13) {
            answerSubmitTime = Date.now();
            autoSubmitFlag = false;
        }
    }

    quizReadyListener.bindListener();
    quizAnswerResultsListener.bindListener();
    quizPlayNextSongListener.bindListener();

    $(".modal").on("show.bs.modal", () => {
        speedrunWindow.setZIndex(1025);
    });

    $(".modal").on("hidden.bs.modal", () => {
        speedrunWindow.setZIndex(1055);
    });

    $(".slCheckbox label").hover(() => {
        speedrunWindow.setZIndex(1025);
    }, () => {
        speedrunWindow.setZIndex(1055);
    });

    AMQ_addScriptData({
        name: "Speedrun",
        author: "TheJoseph98",
        description: `
            <p>Adds a new window which can be accessed by clicking the clock icon in the top right while in a quiz which tracks how fast you guessed each song, including total time, average time, fastest time and more</p>
            <a href="https://i.imgur.com/LOJCzWm.png" target="_blank"><img src="https://i.imgur.com/LOJCzWm.png" /></a>
            <p>Timer start when the guess phase starts (not when you get sound) and ends on your latest Enter key input</p>
            <p>An incorrect answer counts as the full guess time for the song, not submitting an answer with the Enter key (ie. using autosubmit) also counts as full guess time</p>
            <a href="https://i.imgur.com/1uJEh39.png" target="_blank"><img src="https://i.imgur.com/1uJEh39.png" /></a>
        `
    });

    AMQ_addStyle(`
        #qpSpeedrun {
            width: 30px;
            margin-right: 5px;
        }
        #speedrunWindowUpper {
            border-bottom: 1px solid #6d6d6d;
        }
        #speedrunInfoLeft > p {
            font-size: 14px;
            margin-bottom: 0px;
        }
        #speedrunInfoRight > p {
            font-size: 14px;
            margin-bottom: 0px;
            text-align: right;
        }
        #speedrunTimesLeft > p {
            font-size: 18px;
            margin-bottom: 0px;
        }
        #speedrunTimesRight > p {
            font-size: 18px;
            margin-bottom: 0px;
            text-align: right;
        }
    `);
}
