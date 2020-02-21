// ==UserScript==
// @name         AMQ Speedrun
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Tracks guess times for each song, including total and average times
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://gist.githubusercontent.com/arantius/3123124/raw/grant-none-shim.js
// ==/UserScript==

if (!window.setupDocumentDone) return;

let fastestGuess = 9999999999;
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
let speedrunWindowHeader;
let speedrunWindowContent;
let speedrunWindowBodyUpper;
let speedrunWindowBodyLower;
let speedrunWindowCloseButton;

let oldWidth = $("#qpOptionContainer").width();
$("#qpOptionContainer").width(oldWidth + 35);
$("#qpOptionContainer > div").append($("<div></div>")
    .attr("id", "qpSpeedrun")
    .attr("class", "clickAble qpOption")
    .html("<i aria-hidden=\"true\" class=\"fa fa-clock-o qpMenuItem\"></i>")
    .click(() => {
        if (speedrunWindow.is(":visible")) {
            speedrunWindow.hide();
        }
        else {
            speedrunWindow.show();
        }
    })
    .popover({
        content: "Speedrun",
        trigger: "hover",
        placement: "bottom"
    })
);

function createSpeedrunWindow() {
    speedrunWindow = $("<div></div>")
        .attr("id", "speedrunWindow")
        .css("position", "absolute")
        .css("top", "0px")
        .css("left", "0px")
        .css("z-index", "1055");

    speedrunWindowHeader = $("<div></div>")
        .addClass("modal-header")
        .attr("id", "speedrunWindowHeader")
        .append($("<h2></h2>")
            .attr("class", "modal-title")
            .text("Speedrun")
        );

    speedrunWindowContent = $("<div></div>")
        .attr("id", "speedrunWindowContent");

    speedrunWindowBodyUpper = $("<div></div>")
        .attr("id", "speedrunWindowBodyUpper")
        .addClass("modal-body")
        .css("height", "150px")
        .append($("<div></div>")
            .attr("id", "speedrunInfoLeft")
            .html(`
                <p>Fastest correct guess:</p>
                <p>Slowest correct guess:</p>
                <p>Guess rate:</p>
                <p>Average time (correct):</p>
                <p>Average time (total):</p>
                <p>Total time:</p>
                <p>Previous guess time:</p>
            `)
        )
        .append($("<div></div>")
            .attr("id", "speedrunInfoRight")
            .html(`
                <p id="srFastestTime">0.000</p>
                <p id="srSlowestTime">0.000</p>
                <p id="srGuessRate">0%</p>
                <p id="srAverageCorrect">0.000</p>
                <p id="srAverageTotal">0.000</p>
                <p id="srTotalTime">0.000</p>
                <p id="srPreviousTime">0.000</p>
            `)
        )

    speedrunWindowBodyLower = $("<div></div>")
        .attr("id", "speedrunWindowBodyLower")
        .addClass("modal-body")
        .css("height", "175px")
        .css("overflow-y", "auto")
        .append($("<div></div>")
            .attr("id", "speedrunTimesLeft")
        )
        .append($("<div></div>")
            .attr("id", "speedrunTimesRight")
        )

    speedrunWindowCloseButton = $("<div></div>")
        .attr("class", "close")
        .attr("type", "button")
        .html("<span aria-hidden=\"true\">×</span>")
        .click(() => {
            speedrunWindow.hide();
        });

    speedrunWindowContent.append(speedrunWindowBodyUpper);
    speedrunWindowContent.append(speedrunWindowBodyLower);
    speedrunWindowHeader.prepend(speedrunWindowCloseButton);
    speedrunWindow.append(speedrunWindowHeader);
    speedrunWindow.append(speedrunWindowContent);
    $("#gameContainer").append(speedrunWindow);
}

createSpeedrunWindow();

// clear times on quiz ready
let quizReadyListener = new Listener("quiz ready", data => {
    resetTimes();
    $("#qpAnswerInput").keypress(function (event) {
        if (event.which === 13) {
            answerSubmitTime = Date.now();
            autoSubmitFlag = false;
        }
    })
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

function updateInfo(songNumber, newTime) {
    $("#srFastestTime").text(formatTime(fastestGuess));
    $("#srSlowestTime").text(formatTime(slowestGuess));
    $("#srGuessRate").text((guessRate * 100).toFixed(2) + "%");
    $("#srAverageCorrect").text(formatTime(averageCorrect));
    $("#srAverageTotal").text(formatTime(averageTotal));
    $("#srTotalTime").text(formatTime(totalTime));
    $("#srPreviousTime").text(formatTime(previousGuess));
    $("#speedrunTimesLeft").append($("<p></p>").text("Song " + songNumber));
    $("#speedrunTimesRight").append($("<p></p>").text(formatTime(newTime.time)));
    $("#speedrunWindowBodyLower").scrollTop($("#speedrunWindowBodyLower").get(0).scrollHeight);
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
    fastestGuess = 9999999999;
    slowestGuess = 0;
    totalTime = 0;
    averageCorrect = 0;
    correctCount = 0;
    averageTotal = 0;
    guessRate = 0;
    previousGuess = 0;
    times = {};
}

$("#speedrunWindow").draggable({
    handle: "#speedrunWindowHeader",
    containment: "#gameContainer"
});

quizReadyListener.bindListener();
quizAnswerResultsListener.bindListener();
quizPlayNextSongListener.bindListener();

GM_addStyle(`
#qpSpeedrun {
    width: 30px;
    margin-right: 5px;
}
#speedrunWindow {
    width: 250px;
    height: 400px;
    background-color: #424242;
    border: 1px solid rgba(27, 27, 27, 0.2);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
    display: none;
}
#speedrunWindowBodyUpper {
    border-bottom: 1px solid #6d6d6d;
    padding: 5px;
}
#speedrunWindowBodyLower {
    padding: 5px;
}
#speedrunWindow .close {
    font-size: 32px;
}
#speedrunWindowHeader {
    cursor: move;
}
#speedrunInfoLeft {
    width: 65%;
    float: left;
}
#speedrunInfoRight {
    width: 35%;
    float: right;
}
#speedrunTimesLeft {
    width: 50%;
    float: left;
}
#speedrunTimesRight {
    width: 50%;
    float: right;
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