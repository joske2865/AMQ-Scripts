// ==UserScript==
// @name         AMQ Rewards Tracker
// @namespace    https://github.com/TheJoseph98
// @version      1.0.2
// @description  Tracks rewards gained per hour such as xp, notes and tickets
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqWindows.js
// @updateURL    https://github.com/TheJoseph98/AMQ-Scripts/raw/master/amqRewardsTracker.user.js
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

let startXP;
let startNotes;
let startTickets;
let startTime;

let gainedXP;
let gainedNotes;
let gainedTickets;
let elapsedTime;

let trackerWindow;
let trackerPaused = false;

let quizXPGainListener;

let updateInterval = setInterval(function () {}, 333);

function startTracker() {
    if (trackerPaused) {
        startTime = Date.now() - elapsedTime;
    }
    else {
        resetTracker();
        startTime = Date.now();
    }
    updateInterval = setInterval(updateTracker, 333);
    quizXPGainListener.bindListener();
    $("#trackerWindowControlsStart").off("click").text("Stop");
    $("#trackerWindowControlsStart").click(function () {
        stopTracker();
    });
}

function stopTracker() {
    trackerPaused = true;
    clearInterval(updateInterval);
    quizXPGainListener.unbindListener();
    $("#trackerWindowControlsStart").off("click").text("Start");
    $("#trackerWindowControlsStart").click(function () {
        startTracker();
    });
}

function updateTracker() {
    elapsedTime = Date.now() - startTime;
    let xpHour = Math.round((gainedXP / elapsedTime) * 3600000);
    let notesHour = Math.round((gainedNotes / elapsedTime) * 3600000);
    let ticketsHour = (gainedTickets / elapsedTime) * 3600000;

    $("#resultsElapsedTime").text(formatTime(elapsedTime));
    $("#resultsXPGained").text(gainedXP);
    $("#resultsNotesGained").text(gainedNotes);
    $("#resultsTicketsGained").text(gainedTickets);
    $("#resultsXPPerHour").text(xpHour);
    $("#resultsNotesPerHour").text(notesHour);
    $("#resultsTicketsPerHour").text(ticketsHour.toFixed(3));
}

function resetTracker() {
    startXP = 0;
    startNotes = xpBar.currentCreditCount;
    startTickets = xpBar.currentTicketCount;
    gainedXP = 0;
    gainedNotes = 0;
    gainedTickets = 0;

    $("#resultsElapsedTime").text(formatTime(0));
    $("#resultsXPGained").text(0);
    $("#resultsNotesGained").text(0);
    $("#resultsTicketsGained").text(0);
    $("#resultsXPPerHour").text(0);
    $("#resultsNotesPerHour").text(0);
    $("#resultsTicketsPerHour").text("0.000");
    stopTracker();

    trackerPaused = false;
}

// formats the time in milliseconds to hh:mm:ss format
function formatTime(time) {
    let seconds = Math.floor(time / 1000);
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds - hours * 3600) / 60);
    seconds = (seconds - minutes * 60 - hours * 3600);

    let formattedHours = hours < 10 ? "0" + hours : hours;
    let formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
    let formattedSeconds = seconds < 10 ? "0" + seconds : seconds;
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

function setup() {
    trackerWindow = new AMQWindow({
        title: "Reward Tracker",
        width: 300,
        height: 270,
        zIndex: 1054,
        draggable: true
    });

    trackerWindow.addPanel({
        width: 1.0,
        height: 50,
        id: "trackerWindowControls"
    });

    trackerWindow.addPanel({
        width: 1.0,
        height: 135,
        position: {
            x: 0,
            y: 50
        },
        id: "trackerWindowResults"
    });

    trackerWindow.panels[0].panel.append(
        $(`<div id="trackerWindowControlsContainer"></div>`)
        .append(
            $(`<button id="trackerWindowControlsReset" class="btn btn-default">Reset</button>`).click(function () {
                resetTracker();
            })
        )
        .append(
            $(`<button id="trackerWindowControlsStart" class="btn btn-primary">Start</button>`).click(function () {
                startTracker();
            })
        )
    );

    trackerWindow.panels[1].panel.append(
        $(`<div id="trackerWindowResultsContainer"></div>`)
        .append(
            $(
                `<div id="trackerWindowResultsLeft">
                    <p>Elapsed Time</p>
                    <p>XP gained</p>
                    <p>Notes gained</p>
                    <p>Tickets gained</p>
                    <p>XP/hour</p>
                    <p>Notes/hour</p>
                    <p>Tickets/hour</p>
                </div>`
            )
        )
        .append(
            $(
                `<div id="trackerWindowResultsRight">
                    <p id="resultsElapsedTime">00:00:00</p>
                    <p id="resultsXPGained">0</p>
                    <p id="resultsNotesGained">0</p>
                    <p id="resultsTicketsGained">0</p>
                    <p id="resultsXPPerHour">0</p>
                    <p id="resultsNotesPerHour">0</p>
                    <p id="resultsTicketsPerHour">0</p>
                </div>`
            )
        )
    )

    let oldWidth = $("#qpOptionContainer").width();
    $("#qpOptionContainer").width(oldWidth + 35);
    $("#qpOptionContainer > div").append($(`<div id="qpResultsTracker" class="clickAble qpOption"><i aria-hidden="true" class="fa fa-line-chart qpMenuItem"></i></div>`)
        .click(() => {
            if (trackerWindow.isVisible()) {
                trackerWindow.close();
            }
            else {
                trackerWindow.open();
            }
        })
        .popover({
            content: "Results Tracker",
            trigger: "hover",
            placement: "bottom"
        })
    );

    quizXPGainListener = new Listener("quiz xp credit gain", data => {
        gainedNotes = data.credit - startNotes;
        gainedXP += data.xpInfo.lastGain;
        gainedTickets = data.tickets - startTickets;
    });

    resetTracker();

    AMQ_addScriptData({
        name: "Rewards Tracker",
        author: "TheJoseph98",
        description: `
            <p>Adds a new window where you can start or stop a tracker which counts how much XP, notes and tickets you gained since starting and calculates approximate gains per hour.</p>
            <p>The tracker can be opened by clicking the graph icon at the top right corner of the quiz screen.</p>
        `
    });

    AMQ_addStyle(`
        #qpResultsTracker {
            width: 30px;
            margin-right: 5px;
        }
        #trackerWindowResultsLeft {
            width: 50%;
            float: left;
            text-align: left;
            padding-left: 5px;
        }
        #trackerWindowResultsRight {
            width: 50%;
            float: right;
            text-align: right;
            padding-right: 5px;
        }
        #trackerWindowResultsLeft > p {
            margin-bottom: 0;
        }
        #trackerWindowResultsRight > p {
            margin-bottom: 0;
        }
        #trackerWindowControls {
            border-bottom: 1px solid #6d6d6d;
            text-align: center;
        }
        #trackerWindowControlsContainer > button {
            width: 70px;
            margin: 7px;
        }
    `);
}
