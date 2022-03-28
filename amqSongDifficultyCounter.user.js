// ==UserScript==
// @name         AMQ Song Difficulty Counter
// @namespace    https://github.com/TheJoseph98
// @version      1.3.1
// @description  Counts the songs by individual difficulty, per song type
// @author       TheJoseph98
// @grant        GM_xmlhttpRequest
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @match        https://animemusicquiz.com/*
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// @updateURL    https://github.com/TheJoseph98/AMQ-Scripts/raw/master/amqSongDifficultyCounter.user.js
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

let counting = false; // counting currently active
let countingAdvanced = false; // counting currently active by years
let autoCountAdvanced = false; // auto counting by years for 100+ songs active

// object containing counted songs, this gets sent to the spreadsheet
let count = {
    username: null,
    openings: {},
    endings: {},
    inserts: {}
};
let sendToSpreadsheet = false; // enable sending to spreadsheet

// difficulty ranges and types
let typeRanges = []; // difficulty ranges for each type (openings, endings and inserts) (eg. [[10, 50], [50, 80], [53, 89]])
let curDiffRange = [0, 1]; // current selected difficulty
let curType = 0; // current selected type, index of types array
let types = []; // types ("opening", "ending" and "insert")

let minYear = 1944;
let maxYear = 2022;
let yearRanges = []; // year ranges array for counting by years
let yearIndex = 0; // current index of the year ranges array
let curYearRange = [minYear, maxYear]; // default year range

// difficulty sliders
let openingsDiffSlider;
let endingsDiffSlider;
let insertsDiffSlider;

// old listeners
let oldSettingsChangeListener;
let oldQuizNoSongsListener;
let oldQuizOverListener;

// new listeners
let quizReadyListener;
let playNextSongListener;
let quizNoSongsListener;
let quizOverListener;
let settingsChangeListener;
let hostGameListener;
let joinGameListener;
let spectateGameListener;

let buttonHidden = false;

function createSongCounterModal() {
    let buttonHTML = $(`
        <div class="clickAble topMenuButton topMenuMediumButton" id="lbCounterButton">
            <h3>Counter</h3>
        </div>`);

    let counterModalHTML = $(`
        <div class="modal fade tab-modal" id="songCounterModal" tabindex="-1" role="dialog">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">×</span>
                        </button>
                        <h2 class="modal-title">Song Counter</h2>
                    </div>
                    <div class="modal-body" style="overflow-y: auto;max-height: calc(100vh - 150px);">
                        <div id="scDifficultySliderContainer">
                            <div class="scTypeContainer">
                                <div class="scTypeCheckboxContainer">
                                    <div class="customCheckbox">
                                        <input id="scTypeOpenings" type="checkbox" checked="">
                                        <label for="scTypeOpenings"><i class="fa fa-check" aria-hidden="true"></i></label>
                                    </div>
                                    <span>Openings</span>
                                </div>
                                <div class="scTypeDifficultySlider">
                                    <input id="scOpeningsDiffMin" type="text" value="1" class="minWell text-center mhRangeSliderTextBox">
                                    <input class="sliderInput" id="scOpeningsDiffRange" data-slider-class="scDifficultySlider" data-slider-id="scOpeningsDifficultySlider" type="text" style="display: none;" data-value="1" value="1">
                                    <input id="scOpeningsDiffMax" type="text" value="100" class="minWell text-center mhRangeSliderTextBox">
                                </div>
                            </div>
                            <div class="scTypeContainer">
                                <div class="scTypeCheckboxContainer">
                                    <div class="customCheckbox">
                                        <input id="scTypeEndings" type="checkbox" checked="">
                                        <label for="scTypeEndings"><i class="fa fa-check" aria-hidden="true"></i></label>
                                    </div>
                                    <span>Endings</span>
                                </div>
                                <div class="scTypeDifficultySlider">
                                    <input id="scEndingsDiffMin" type="text" value="1" class="minWell text-center mhRangeSliderTextBox">
                                    <input class="sliderInput" id="scEndingsDiffRange" data-slider-class="scDifficultySlider" data-slider-id="scEndingsDifficultySlider" type="text" style="display: none;" data-value="1" value="1">
                                    <input id="scEndingsDiffMax" type="text" value="100" class="minWell text-center mhRangeSliderTextBox">
                                </div>
                            </div>
                            <div class="scTypeContainer">
                                <div class="scTypeCheckboxContainer">
                                    <div class="customCheckbox">
                                        <input id="scTypeInserts" type="checkbox" checked="">
                                        <label for="scTypeInserts"><i class="fa fa-check" aria-hidden="true"></i></label>
                                    </div>
                                    <span>Inserts</span>
                                </div>
                                <div class="scTypeDifficultySlider">
                                    <input id="scInsertsDiffMin" type="text" value="1" class="minWell text-center mhRangeSliderTextBox">
                                    <input class="sliderInput" id="scInsertsDiffRange" data-slider-class="scDifficultySlider" data-slider-id="scInsertsDifficultySlider" type="text" style="display: none;" data-value="1" value="1">
                                    <input id="scInsertsDiffMax" type="text" value="100" class="minWell text-center mhRangeSliderTextBox">
                                </div>
                            </div>
                        </div>
                        <div id="scExtraOptionsContainer">
                            <div id="scSpreadsheetContainer">
                                <div class="customCheckbox">
                                    <input id="scSendToSpreadsheet" type="checkbox" checked="">
                                    <label for="scSendToSpreadsheet"><i class="fa fa-check" aria-hidden="true"></i></label>
                                </div>
                                <span id="scSpreadsheetLabel">Send to spreadsheet</span>
                            </div>
                            <div id="scUsernameContainer" class="disabled">
                                <span>Username (required)</span>
                                <input id="scUsername" type="text" style="width: 100%;">
                            </div>
                            <select id="scWatchingType">
                                <option value="watched">Only Watched</option>
                                <option value="random">Random</option>
                            </select>
                            <div id="scAdvancedCountContainer">
                                <div class="customCheckbox">
                                    <input type="checkbox" checked="" id="scAdvancedCount">
                                    <label for="scAdvancedCount"><i class="fa fa-check" aria-hidden="true"></i></label>
                                </div>
                                <span id="scAdvancedCountLabel">Advanced counting</span>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-default" id="scCountinueCounter">Continue</button>
                        <a target="_blank" href="https://docs.google.com/spreadsheets/d/1mvwE_7CPN0jV5C76vHVX67ijo4VfhgIkkSxc5LOJLJE/edit?usp=sharing" id="scSpreadsheetLink">Spreadsheet</a>
                        <button type="button" class="btn btn-default" data-dismiss="modal">Exit</button>
                        <button type="button" class="btn btn-primary" id="scStartCounter">Start</button>
                    </div>
                </div>
            </div>
        </div>
    `);

    // create button
    $("#lobbyPage .menuBar").append(buttonHTML);
    $("#lbCounterButton").click(function () {
        openCounterModal();
    });

    // create window and sliders
    $("#gameContainer").append(counterModalHTML);
    openingsDiffSlider = new SliderTextCombo($("#scOpeningsDiffRange"), [$("#scOpeningsDiffMin"), $("#scOpeningsDiffMax")],
        {
            min: 1,
            max: 100,
            value: [1, 100],
            range: true,
            tooltip: "hide"
        });
    endingsDiffSlider = new SliderTextCombo($("#scEndingsDiffRange"), [$("#scEndingsDiffMin"), $("#scEndingsDiffMax")],
        {
            min: 1,
            max: 100,
            value: [1, 100],
            range: true,
            tooltip: "hide"
        });
    insertsDiffSlider = new SliderTextCombo($("#scInsertsDiffRange"), [$("#scInsertsDiffMin"), $("#scInsertsDiffMax")],
        {
            min: 1,
            max: 100,
            value: [1, 100],
            range: true,
            tooltip: "hide"
        });

    // enable/disable sliders
    $("#scTypeOpenings").click(function () {
        if ($(this).prop("checked")) {
            $(this).parent().parent().next().removeClass("disabled");
        }
        else {
            $(this).parent().parent().next().addClass("disabled")
        }
    });

    $("#scTypeEndings").click(function () {
        if ($(this).prop("checked")) {
            $(this).parent().parent().next().removeClass("disabled");
        }
        else {
            $(this).parent().parent().next().addClass("disabled")
        }
    });

    $("#scTypeInserts").click(function () {
        if ($(this).prop("checked")) {
            $(this).parent().parent().next().removeClass("disabled");
        }
        else {
            $(this).parent().parent().next().addClass("disabled")
        }
    });

    // popovers
    $("#scSpreadsheetLabel").popover({
        content: "Send data to a public spreadsheet",
        trigger: "hover",
        placement: "top",
        container: "body"
    });

    $("#scAdvancedCountLabel").popover({
        content: "Automatically splits difficulty by years if it finds more than 100 songs",
        trigger: "hover",
        placement: "top",
        container: "body"
    });

    // enable/disable username input and sync between tabs
    $("#scSendToSpreadsheet").click(function () {
        if ($(this).prop("checked")) {
            $("#scUsernameContainer").removeClass("disabled");
            sendToSpreadsheet = true;
        }
        else {
            $("#scUsernameContainer").addClass("disabled");
            sendToSpreadsheet = false;
        }
    });

    // start counter
    $("#scStartCounter").click(function () {
        if ($("#scSendToSpreadsheet").prop("checked")) {
            if ($("#scUsername").val().trim() === "") {
                displayMessage("Error", "You must enter a username to send data to the spreadsheet");
                return;
            }
            else {
                clearCountData();
                count.username = $("#scUsername").val().trim();
            }
        }
        else {
            clearCountData();
        }
        initializeRanges();
        $("#songCounterModal").modal("hide");
        startCounting(curDiffRange, curType);
    });

    // continue counter
    $("#scCountinueCounter").click(function () {
        if (!loadCounterData()) {
            displayMessage("Continue", "No saved data found");
        }
        else {
            let message = `Saved data found<br /><br />`;
            if (sendToSpreadsheet) {
                message += `Send to spreadsheet: Enabled<br />Username: ${count.username}<br />`;
            }
            else {
                message += `Send to spreadsheet: Disabled<br />`;
            }
            message += `Advanced counting: ${autoCountAdvanced ? "Enabled" : "Disabled"}<br />`;
            message += `Song Selection: ${$("#scWatchingType").val() === "watched" ? "Only Watched" : "Random"}<br /><br />`;
            message += `Current Difficulty range: ${curDiffRange[0]}-${curDiffRange[1]}%<br />`;
            message += `Current Type: ${types[curType] === "opening" ? "Openings" : types[curType] === "ending" ? "Endings" : "Inserts"}<br /><br />`;
            message += `Selected types:<br />`;
            for (let i = 0; i < types.length; i++) {
                if (types[i] === "opening") {
                    message += `Openings: ${typeRanges[i][0]}-${typeRanges[i][1]}%<br />`;
                }
                if (types[i] === "ending") {
                    message += `Endings: ${typeRanges[i][0]}-${typeRanges[i][1]}%<br />`;
                }
                if (types[i] === "insert") {
                    message += `Inserts: ${typeRanges[i][0]}-${typeRanges[i][1]}%<br />`;
                }
            }
            message += `<br />Would you like to continue?`;
            displayHtmlOption("Continue", message, "Yes", "No", () => {
                startCounting(curDiffRange, curType);
                $("#songCounterModal").modal("hide");
            }, () => {});
        }
    });

    // default auto count by years unchecked
    $("#scAdvancedCount").prop("checked", false);

    // change auto count by years on click
    $("#scAdvancedCount").click(function () {
        autoCountAdvanced = $(this).prop("checked");
    });

    // default send to spreadsheet unchecked
    $("#scSendToSpreadsheet").prop("checked", false);
}

// initialize difficulty ranges per type
function initializeRanges() {
    typeRanges = [];
    types = [];

    if ($("#scTypeOpenings").prop("checked")) {
        types.push("opening");
        typeRanges.push(openingsDiffSlider.getValue());
    }
    if ($("#scTypeEndings").prop("checked")) {
        types.push("ending");
        typeRanges.push(endingsDiffSlider.getValue());
    }
    if ($("#scTypeInserts").prop("checked")) {
        types.push("insert");
        typeRanges.push(insertsDiffSlider.getValue());
    }
    if (typeRanges.length === 0) {
        displayMessage("Error", "Must select at least one song type");
        return;
    }

    curDiffRange[0] = typeRanges[0][0] - 1;
    curDiffRange[1] = typeRanges[0][0];
    curType = 0;
}

function showCounterButton() {
    $("#lbCounterButton").show();
    if (buttonHidden) {
        let oldWidth = $("#qpOptionContainer").width();
        $("#qpOptionContainer").width(oldWidth + 35);
        $("#qpStopCounter").show();
        buttonHidden = false;
    }
}

function hideCounterButton() {
    $("#lbCounterButton").hide();
    if (!buttonHidden) {
        let oldWidth = $("#qpOptionContainer").width();
        $("#qpOptionContainer").width(oldWidth - 35);
        $("#qpStopCounter").hide();
        buttonHidden = true;
    }
}

// open the counter modal window
function openCounterModal() {
    if (!lobby.soloMode) {
        displayMessage("Error", "Must be in solo mode");
    }
    else {
        $("#songCounterModal").modal("show");
    }
}

// add an amount of songs to a difficulty
function addSongCounter(diffRange, type, amount) {
    if (countingAdvanced) {
        if (type === "opening") {
            count.openings[diffRange[1]] = !count.openings[diffRange[1]] ? amount : count.openings[diffRange[1]] + amount;
            gameChat.systemMessage(`Openings in ${diffRange[0]}-${diffRange[1]}% in ${curYearRange[0]}-${curYearRange[1]}: ${amount}`);
        }
        if (type === "ending") {
            count.endings[diffRange[1]] = !count.endings[diffRange[1]] ? amount : count.endings[diffRange[1]] + amount;
            gameChat.systemMessage(`Endings in ${diffRange[0]}-${diffRange[1]}% in ${curYearRange[0]}-${curYearRange[1]}: ${amount}`);
        }
        if (type === "insert") {
            count.inserts[diffRange[1]] = !count.inserts[diffRange[1]] ? amount : count.inserts[diffRange[1]] + amount;
            gameChat.systemMessage(`Inserts in ${diffRange[0]}-${diffRange[1]}% in ${curYearRange[0]}-${curYearRange[1]}: ${amount}`);
        }
    }
    else {
        if (type === "opening") {
            count.openings[diffRange[1]] = amount;
            gameChat.systemMessage(`Openings in ${diffRange[0]}-${diffRange[1]}%: ${amount}`);
        }
        if (type === "ending") {
            count.endings[diffRange[1]] = amount;
            gameChat.systemMessage(`Endings in ${diffRange[0]}-${diffRange[1]}%: ${amount}`);
        }
        if (type === "insert") {
            count.inserts[diffRange[1]] = amount;
            gameChat.systemMessage(`Inserts in ${diffRange[0]}-${diffRange[1]}%: ${amount}`);
        }
    }
}

// display total number of songs per difficulty per type (used for counting by years when there's more than 100 songs)
function displayTotal(diffRange, type) {
    if (type === "opening") {
        gameChat.systemMessage(`Total Openings in ${diffRange[0]}-${diffRange[1]}%: ${count.openings[diffRange[1]]}`);
    }
    if (type === "ending") {
        gameChat.systemMessage(`Total Endings in ${diffRange[0]}-${diffRange[1]}%: ${count.endings[diffRange[1]]}`);
    }
    if (type === "insert") {
        gameChat.systemMessage(`Total Inserts in ${diffRange[0]}-${diffRange[1]}%: ${count.inserts[diffRange[1]]}`);
    }
}

// set new difficulty
function setDifficulty(diffRange) {
    hostModal.songDiffRangeSliderCombo.setValue(diffRange);
}

// set new song type
function setSongType(type) {
    let openings = hostModal.$songTypeOpening;
    let endings = hostModal.$songTypeEnding;
    let inserts = hostModal.$songTypeInsert;
    if (type === "opening") {
        if (!openings.is(":checked")) {
            openings.click();
        }
        if (endings.is(":checked")) {
            endings.click();
        }
        if (inserts.is(":checked")) {
            inserts.click();
        }
    }
    if (type === "ending") {
        if (!endings.is(":checked")) {
            endings.click();
        }
        if (openings.is(":checked")) {
            openings.click();
        }
        if (inserts.is(":checked")) {
            inserts.click();
        }
    }
    if (type === "insert") {
        if (!inserts.is(":checked")) {
            inserts.click();
        }
        if (openings.is(":checked")) {
            openings.click();
        }
        if (endings.is(":checked")) {
            endings.click();
        }
    }
}

// set year setting
function setYears(yearRange) {
    hostModal.vintageRangeSliderCombo.setValue(yearRange);
}

// start the game from lobby
function startGame() {
    if (counting) {
        if ($("#lbStartButton").is(":visible")) {
            $("#lbStartButton").click();
        }
    }
}

// start counting songs
function startCounting(startDiffRange, startType) {
    if (lobby.soloMode && lobby.inLobby) {
        resetYears();
        counting = true;

        // unbind and remove old listeners (that spam the chat with "no songs found" and "game settings have been changed")
        lobby._settingListener.unbindListener();
        quiz._noSongsListner.unbindListener();
        quiz._quizOverListner.unbindListener();
        lobby._settingListener = new Listener("Room Settings Changed", payload => {});
        quiz._noSongsListner = new Listener("Quiz no songs", payload => {});
        quiz._quizOverListner = new Listener("quiz over", payload => {});

        quizReadyListener.bindListener();
        playNextSongListener.bindListener();
        quizNoSongsListener.bindListener();
        quizOverListener.bindListener();
        settingsChangeListener.bindListener();

        // set difficulty range
        curDiffRange = startDiffRange;
        curType = startType;

        setSettings(); // set default lobby settings

        setDifficulty(curDiffRange);
        setSongType(types[curType]);
        setYears(curYearRange);

        lobby.changeGameSettings();
    }
    else {
        displayMessage("Error", "You are not in a lobby");
    }
}

// stop counting songs
function stopCounting() {
    quizReadyListener.unbindListener();
    playNextSongListener.unbindListener();
    quizNoSongsListener.unbindListener();
    quizOverListener.unbindListener();
    settingsChangeListener.unbindListener();

    // set old listeners back
    lobby._settingListener = oldSettingsChangeListener;
    quiz._noSongsListner = oldQuizNoSongsListener;
    quiz._quizOverListner = oldQuizOverListener;
    lobby._settingListener.bindListener();
    quiz._noSongsListner.bindListener();
    quiz._quizOverListner.bindListener();

    counting = false;

    gameChat.systemMessage("Counter stopped");
    sendDataToSpreadsheet();
    console.log(count);
    clearCountData();
}

// reset counting data
function clearCountData() {
    count = {
        username: null,
        openings: {},
        endings: {},
        inserts: {}
    };

    localStorage.removeItem("countData");
}

// set default game settings
function setSettings() {
    hostModal.numberOfSongsSliderCombo.setValue(100); // set 100 songs
    hostModal.songDiffAdvancedSwitch.setOn(true); // set advanced difficulty sliders on
    hostModal.playLengthSliderCombo.setValue(5); // set 5 seconds guess time

    if ($("#scWatchingType").val() === "watched") {
        hostModal.watchedSliderCombo.setValue(100);
        hostModal.unwatchedSliderCombo.setValue(0)
        hostModal.randomWatchedSliderCombo.setValue(0);
    }
    else {
        hostModal.watchedSliderCombo.setValue(0);
        hostModal.unwatchedSliderCombo.setValue(0)
        hostModal.randomWatchedSliderCombo.setValue(100);
    }

    // enable auto skip during replay
    options.$AUTO_VOTE_REPLAY.prop("checked", true)
    options.updateAutoVoteSkipReplay();
}

// increment difficulty
function updateSongDifficulty() {
    // reset year ranges and yearIndex, if it reaches this point, counting by years has finished and can safely reset
    resetYears();
    curDiffRange[0]++;
    curDiffRange[1]++;
    // check if new difficulty is out of range, if it is, increment type by 1
    if (curDiffRange[1] > typeRanges[curType][1]) {
        curType++;
        // check if new type is out of range, if it is, the counter has reached the end and can stop
        if (curType >= types.length) {
            stopCounting();
            return;
        }
        // otherwise, set the new difficulty to be the beginning of the new range for the next type
        else {
            curDiffRange[0] = typeRanges[curType][0] - 1;
            curDiffRange[1] = typeRanges[curType][0];
        }
    }
    setDifficulty(curDiffRange);
    setSongType(types[curType]);
    setYears(curYearRange);

    lobby.changeGameSettings();
}

function updateYearRange() {
    curYearRange = yearRanges[yearIndex];
    // check that yearIndex is out of range and returns undefined, if it doesn't, set the years settings to the new range
    if (curYearRange !== undefined) {
        setYears(curYearRange);
        lobby.changeGameSettings();
    }
    // if yearIndex is out of range, then counting by years has concluded
    else {
        displayTotal(curDiffRange, types[curType]); // display total number of songs in the difficulty
        updateSongDifficulty();
    }
}

function splitYears() {
    // divide into 5 on the initial 1944, 2022 split
    if (curYearRange[0] === minYear && curYearRange[1] === maxYear) {
        let splits = [1995, 2005, 2010, 2015];
        for (let i = 0; i < splits.length; i++) {
            if (i === 0) {
                yearRanges.splice(yearIndex, 1, [curYearRange[0], splits[i]]);
            }
            if (i < splits.length - 1) {
                yearRanges.splice(yearIndex + i + 1, 0, [splits[i] + 1, splits[i+1]]);
            }
            if (i === splits.length - 1) {
                yearRanges.splice(yearIndex + i + 1, 0, [splits[i] + 1, curYearRange[1]])
            }
        }
    }
    // else, divide into halves
    else {
        let average = Math.floor((curYearRange[0] + curYearRange[1])/2);
        yearRanges.splice(yearIndex, 1, [curYearRange[0], average]);
        yearRanges.splice(yearIndex + 1, 0, [average + 1, curYearRange[1]]);
    }
}

// reset year ranges and yearIndex
function resetYears() {
    yearRanges = [[minYear, maxYear]];
    yearIndex = 0;
    curYearRange = [minYear, maxYear];
    countingAdvanced = false;
}

// save data to the localStorage
function saveCounterData() {
    let saveData = {
        countData: count,
        diffRangeData: curDiffRange,
        typeData: curType,
        typesData: types,
        typeRangesData: typeRanges,
        autoCountAdvancedEnabled: autoCountAdvanced,
        sendToSpreadsheetData: sendToSpreadsheet,
        watchingTypeData: $("#scWatchingType").val()
    };
    localStorage.setItem("countData", JSON.stringify(saveData));
}

// load data from localStorage
function loadCounterData() {
    let loadData = JSON.parse(localStorage.getItem("countData"));
    if (loadData !== null) {
        count = loadData.countData;
        curDiffRange = loadData.diffRangeData;
        curType = loadData.typeData;
        types = loadData.typesData;
        typeRanges = loadData.typeRangesData;
        autoCountAdvanced = loadData.autoCountAdvancedEnabled;
        sendToSpreadsheet = loadData.sendToSpreadsheetData;
        $("#scWatchingType").val(loadData.watchingTypeData);
        return true;
    }
    return false;
}

// send data to a public spreadsheet
function sendDataToSpreadsheet() {
    if (sendToSpreadsheet) {
        gameChat.systemMessage("Sending data to spreadsheet, might take a while if sending to a new list for the first time");
        GM_xmlhttpRequest({
            method: "POST",
            url: "https://script.google.com/macros/s/AKfycbxOTigCeni8hyoUk5o1G5VrjVDnWcVkb0hrWYzDxe2oj9BztIo/exec",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            data: "data=" + encodeURIComponent(JSON.stringify(count)),
            onload: function (response) {
                gameChat.systemMessage("Successfully sent data to the spreadsheet");
                gameChat.systemMessage("Done!");
            },
            onerror: function (response) {
                gameChat.systemMessage("Error sending data to the spreadsheet");
                gameChat.systemMessage("Done!");
            }
        });
    }
    else {
        gameChat.systemMessage("Skipped sending data to spreadsheet");
        gameChat.systemMessage("Done!");
    }
}

// modified displayOption to support HTML
function displayHtmlOption(title, msg, acceptMsg, declineMsg, callback, callbackCancel) {
    if (!callback) {
        callback = () => {};
    }
    if (!callbackCancel) {
        callbackCancel = () => {};
    }
    if (SWAL_ACTIVE) {
        return swal({
            title: title,
            html: msg,
            showCancelButton: true,
            confirmButtonColor: "#204d74",
            confirmButtonText: acceptMsg,
            cancelButtonText: declineMsg,
        }).then((result) => {
            if (result.dismiss) {
                callbackCancel();
            } else {
                callback(result.value);
            }
        });
    }
}

function setup() {
    // listen for if the quiz returns no songs
    quizNoSongsListener = new Listener("Quiz no songs", payload => {
        // check if counting years flag is active and increment yearIndex by 1
        if (countingAdvanced) {
            yearIndex += 1;
        }
        else {
            // set that song difficulty to 0 songs
            addSongCounter(curDiffRange, types[curType], 0);
        }
        saveCounterData();
    });

    // listen for if the quiz starts normally
    quizReadyListener = new Listener("quiz ready", payload => {
        // check if the user has advanced counting enabled
        if (countingAdvanced) {
            // first, check if there are less than 100 songs (there are more than 0 guaranteed if "quiz ready" listener fires) and increment yearIndex by 1;
            if (payload.numberOfSongs < 100) {
                yearIndex += 1;
                addSongCounter(curDiffRange, types[curType], payload.numberOfSongs);
            }
            // else, check if there are 100 songs and check that the year range can be split into halves then split years into halves
            else if (payload.numberOfSongs === 100 && curYearRange[0] !== curYearRange[1]) {
                gameChat.systemMessage(`100 songs found in ${curYearRange[0]}-${curYearRange[1]} in ${curDiffRange[0]}-${curDiffRange[1]}%, splitting years`);
                splitYears();
            }
            // else, check if the year range is 1 year, then increment yearIndex by 1
            else {
                yearIndex += 1;
                addSongCounter(currDiffRane, types[curType], payload.numberOfSongs);
            }
        }
        else {
            // if the user has "Advanced counting" option enabled and there are 100 songs, split the years and count again
            if (payload.numberOfSongs === 100 && autoCountAdvanced) {
                resetYears();
                splitYears();
                countingAdvanced = true;
                gameChat.systemMessage(`100 songs found in ${curYearRange[0]}-${curYearRange[1]} in ${curDiffRange[0]}-${curDiffRange[1]}%, splitting years`);
            }
            // else just add the number of songs to that difficulty range
            else {
                addSongCounter(curDiffRange, types[curType], payload.numberOfSongs);
            }
        }
        // return to lobby vote
        socket.sendCommand({
            type: "quiz",
            command: "start return lobby vote",
        });
        saveCounterData();
    });

    // skip song when playing next song
    playNextSongListener = new Listener("play next song", payload => {
        // 500 ms delay because race conditions
        setTimeout(function () {
            quiz.skipClicked();
        }, 500);
    });

    // listen for when the quiz ends
    quizOverListener = new Listener("quiz over", payload => {
        lobby.setupLobby(payload, quiz.isSpectator);
        viewChanger.changeView("lobby", {
            supressServerMsg: true,
            keepChatOpen: true
        });
        if (lobby.inLobby && lobby.soloMode) {
            // if advanced counting is active, increment the year
            if (countingAdvanced) {
                updateYearRange();
            }
            // otherwise, increment difficulty
            else {
                updateSongDifficulty();
            }
        }
        else {
            displayMessage("Error", "You must be in a solo lobby");
            stopCounting();
        }
    });

    // listen for when room settings change
    settingsChangeListener = new Listener("Room Settings Changed", payload => {
        console.log(payload);
        hostModal.changeSettings(payload);
        Object.keys(payload).forEach(key => {
            let newValue = payload[key];
            let oldValue = lobby.settings[key];
            lobby.settings[key] = newValue;
        });

        if (payload.roomSize) {
            lobby.settings.roomSize = payload.roomSize;
        }

        Object.values(lobby.players).forEach(player => {
            player.ready = true;
        });

        lobby.isReady = true;
        lobby.toggleRuleButton();
        lobby.updateMainButton();
        if (payload.roomName) {
            lobby.$roomName.text(payload.roomName);
        }

        lobby.updatePlayerCounter();

        startGame();
    });

    // show the counter button when hosting a solo game, otherwise hide it
    hostGameListener = new Listener("Host Game", payload => {
        if (payload.soloMode) {
            showCounterButton();
        }
        else {
            hideCounterButton();
        }
    });

    // hide the counter button when joining non-solo lobbies
    joinGameListener = new Listener("Join Game", payload => {
        hideCounterButton();
    });

    // hide the counter button when spectating non-solo lobbies
    spectateGameListener = new Listener("Spectate Game", payload => {
        hideCounterButton();
    });

    // set old listeners
    oldQuizOverListener = quiz._quizOverListner;
    oldSettingsChangeListener = lobby._settingListener;
    oldQuizNoSongsListener = quiz._noSongsListner;

    createSongCounterModal();

    // stop counting button
    let oldWidth = $("#qpOptionContainer").width();
    $("#qpOptionContainer").width(oldWidth + 35);
    $("#qpOptionContainer > div").append($("<div></div>")
        .attr("id", "qpStopCounter")
        .attr("class", "clickAble qpOption")
        .html(`<i aria-hidden="true" class="fa fa-ban qpMenuItem"></i>`)
        .click(() => {
            if (counting) {
                stopCounting();
            }
        })
        .popover({
            content: "Stop Counting",
            trigger: "hover",
            placement: "bottom"
        })
    );

    AMQ_addStyle(`
        #lbCounterButton {
            width: 100px;
            right: 30%;
        }
        #qpStopCounter {
            width: 30px;
            height: auto;
            margin-right: 5px;
        }
        #songCounterModal .modal-dialog {
            width: 650px;
        }
        #songCounterModal .modal-body {
            padding: 0px;
        }
        #scDifficultySliderContainer {
            width: 430px;
            height: 180px;
            border-right: 1px solid #6d6d6d;
            padding: 15px;
            float: left;
        }
        .scTypeContainer {
            height: 45px;
            width: 400px;
        }
        .scTypeCheckboxContainer {
            float: left;
            display: table;
        }
        .scTypeCheckboxContainer span {
            vertical-align: top;
        }
        .scTypeDifficultySlider {
            width: 300px;
            float: right;
        }
        .scTypeDifficultySlider .slider {
            width: 200px !important;
        }
        #scExtraOptionsContainer {
            width: 215px;
            height: 180px;
            padding: 15px;
            float: left;
        }
        #scSpreadsheetContainer {
            display: table;
        }
        #scAdvancedCountContainer {
            margin-top: 15px;
            display: table;
        }
        #scAdvancedCountLabel {
            vertical-align: top;
        }
        #scSpreadsheetContainer span {
            vertical-align: top;
        }
        #scUsernameContainer {
            margin-top: 10px;
        }
        #scUsername {
            width: 100%;
            border-radius: 4px;
            color: black;
        }
        #scWatchingType {
            color: black;
            border-radius: 4px;
            width: 100%;
            margin-top: 15px;
        }
        #scCountinueCounter {
            float: left;
        }
        #scSpreadsheetLink {
            float: left;
            margin-top: 5px;
            margin-left: 15px;
        }
    `)

    AMQ_addScriptData({
        name: "Song Difficulty Counter",
        author: "TheJoseph98",
        description: `
            <p>Adds a counting tool that automatically counts the number of songs on each difficulty</p>
            <p>Can be customized to count only certain difficulty ranges and certain song types and has an option to automatically split by years if you get 100 songs or more to get a more accurate result</p>
            <p>With a provided username, you can share your song breakdown by difficulty to a
            <a target="_blank" href="https://docs.google.com/spreadsheets/d/1mvwE_7CPN0jV5C76vHVX67ijo4VfhgIkkSxc5LOJLJE/edit?usp=sharing">public Spreadsheet</a>.
            The tool will automatically create a data sheet and a graph sheet with all of the data you collect and add it to the Index page</p>
            <p>You can update your data by inputting the same username as it is on the spreadsheet (NOTE: username is case-sensitive. For example "thejoseph98" and "THEJOSEPH98" are NOT the same)</p>
            <p>To use the tool, simply click "Counter" button while in lobby, next to the "Room settings" button. You must be in a solo lobby to use this tool. Usage of guest accounts is strongly recommended to not inflate your Songs Played and guess rate due to the nature of this tool.
            Simply select your preferred settings and click "Start", the tool will automatically set all other settings for you (100 songs, 5 seconds guess time, only watched/random depending on your tool settings and more)</p>
            <p>To stop counting, simply either wait for the tool to finish or you can click "Stop Counter" which can be found at the top right of your screen in the shape of the "ban" icon</p>
        `
    });

    hostGameListener.bindListener();
    joinGameListener.bindListener();
    spectateGameListener.bindListener();
}
