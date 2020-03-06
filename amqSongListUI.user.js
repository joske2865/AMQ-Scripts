// ==UserScript==
// @name         AMQ Song List UI
// @namespace    http://tampermonkey.net/
// @version      2.3
// @description  Adds a song list window, accessible with a button below song info while in quiz, each song in the list is clickable for extra information
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://gist.githubusercontent.com/arantius/3123124/raw/grant-none-shim.js
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js

// ==/UserScript==

if (!window.setupDocumentDone) return;

let listWindow;
let listWindowResizer;
let listWindowContent;
let listWindowHeader;
let listWindowOptions;
let listWindowBody;
let listWindowOpenButton;
let listWindowCloseButton;
let listWindowTable;

let infoWindow;
let infoWindowResizer
let infoWindowContent;
let infoWindowHeader;
let infoWindowBody;
let infoWindowCloseButton;

let settingsWindow;
let settingsWindowContent;
let settingsWindowHeader;
let settingsWindowBody;
let settingsWindowCloseButton;

let exportData = [];

// default settings
let savedSettings = {
    autoClearList: false,
    autoScroll: true,
    showCorrect: true,
    animeTitles: "romaji",
    songNumber: true,
    songName: true,
    artist: true,
    anime: true,
    type: true,
    answers: false,
    guesses: false,
    samplePoint: false
};

function createListWindow() {
    // create list window
    listWindow = $(`<div id="listWindow" class="slWindow" style="position: absolute; z-index: 1060; width: 650px; height: 480px; display: none;"></div>`);

    // create list header
    listWindowHeader = $(`<div class="modal-header" id="listWindowHeader"><h2 class="modal-title">Song List</h2></div>`);

    // create the options tab
    listWindowOptions = $(`<div class="slWindowOptions" id="listWindowOptions"></div>`)
        .append($(`<button id="slExport" class="btn btn-primary songListOptionsButton" type="button"><i aria-hidden="true" class="fa fa-file"></i></button`)
            .click(() => {
                exportSongData();
            })
            .popover({
                placement: "bottom",
                content: "Export",
                trigger: "hover",
                container: "body",
                animation: false
            })
        )
        .append($(`<button class="btn btn-default songListOptionsButton" type="button"><i aria-hidden="true" class="fa fa-trash-o"></i></button>`)
            .dblclick(() => {
                createNewTable();
            })
            .popover({
                placement: "bottom",
                content: "Clear List (double click)",
                trigger: "hover",
                container: "body",
                animation: false
            })
        )
        .append($(`<button class="btn btn-default songListOptionsButton" type="button"><i aria-hidden="true" class="fa fa-plus"></i></button>`)
            .click(() => {
                openInNewTab();
            })
            .popover({
                placement: "bottom",
                content: "Open in New Tab",
                trigger: "hover",
                container: "body",
                animation: false
            })
        )
        .append($(`<button class="btn btn-default songListOptionsButton" type="button"><i aria-hidden="true" class="fa fa-gear"></i></button>`)
            .click(() => {
                if (settingsWindow.is(":visible")) {
                    settingsWindow.hide()
                }
                else {
                    settingsWindow.show();
                }
            })
            .popover({
                placement: "bottom",
                content: "Settings",
                trigger: "hover",
                container: "body",
                animation: false
            })
        )
        .append($(`<input id="slSearch" type="text" placeholder="Search songs">`)
            .on("input", function (event) {
                applySearchAll();
            })
            .click(() => {
                quiz.setInputInFocus(false);
            })
        )

        .append($(`<div class="slCorrectFilter"></div>`)
            .append($(`<div class="slFilterContainer"></div>`)
                .append($(`<div class="customCheckbox"></div>`)
                    .append($(`<input id="slFilterCorrect" type="checkbox">`)
                        .click(function () {
                            updateCorrectAll();
                        })
                    )
                    .append(`<label for="slFilterCorrect"><i class="fa fa-check" aria-hidden="true"></i></label>`)
                )
                .append(`<div style="margin-left: 25px;">Correct</div>`)
            )
            .append($(`<div class="slFilterContainer"></div>`)
                .append($(`<div class="customCheckbox"></div>`)
                    .append($(`<input id="slFilterIncorrect" type="checkbox">`)
                        .click(function () {
                            updateCorrectAll();
                        })
                    )
                    .append(`<label for="slFilterIncorrect"><i class="fa fa-check" aria-hidden="true"></i></label>`)
                )
                .append(`<div style="margin-left: 25px;">Incorrect</div>`)
            )
        )

    // create list body
    listWindowBody = $(`<div class="modal-body resizableList slWindowBody" id="listWindowBody" style="height: 340px;"></div>`);

    listWindowContent = $(`<div id="listWindowContent" class="slWindowContent"></div>`);

    // create close button
    listWindowCloseButton = $(`<div class="close" type="button"><span aria-hidden="true">×</span></div>`)
        .click(() => {
            listWindow.hide();
            infoWindow.hide();
            settingsWindow.hide();
            $(".rowSelected").removeClass("rowSelected");
        });

    listWindowResizer = $(
        `<div class="listResizers">
            <div class="listResizer top-left"></div>
            <div class="listResizer top-right"></div>
            <div class="listResizer bottom-left"></div>
            <div class="listResizer bottom-right"></div>
        </div>`);

    // link nodes
    listWindowHeader.prepend(listWindowCloseButton);
    listWindowContent.append(listWindowHeader);
    listWindowContent.append(listWindowOptions);
    listWindowContent.append(listWindowBody);
    listWindow.append(listWindowContent);
    listWindow.prepend(listWindowResizer);
    $("#gameContainer").append(listWindow);

    // create results table
    listWindowTable = $(`<table id="listWindowTable" class="table floatingContainer"></table>`);
    listWindowBody.append(listWindowTable);

    // button to access the song results
    listWindowOpenButton = $(`<div id="qpSongListButton" class="clickAble qpOption"><i aria-hidden="true" class="fa fa-list-ol qpMenuItem"></i></div>`)
        .click(function () {
            if(listWindow.is(":visible")) {
                listWindow.hide();
                infoWindow.hide();
                settingsWindow.hide();
                $(".rowSelected").removeClass("rowSelected");
            }
            else {
                listWindow.show();
                autoScrollList();
            }
        })
        .popover({
            placement: "bottom",
            content: "Song List",
            trigger: "hover"
        });

    let oldWidth = $("#qpOptionContainer").width();
    $("#qpOptionContainer").width(oldWidth + 35);
    $("#qpOptionContainer > div").append(listWindowOpenButton);

    addTableHeader();
}

function updateCorrect(elem) {
    let correctEnabled = $("#slFilterCorrect").prop("checked");
    let incorrectEnabled = $("#slFilterIncorrect").prop("checked");
    if (correctEnabled && incorrectEnabled) {
        $(elem).removeClass("rowFiltered");
    }
    else if (!correctEnabled && !incorrectEnabled) {
        $(elem).removeClass("rowFiltered");
    }
    else if (correctEnabled && !incorrectEnabled) {
        if ($(elem).hasClass("correctGuess")) {
            $(elem).removeClass("rowFiltered");
        }
        else {
            $(elem).addClass("rowFiltered");
        }
    }
    else {
        if ($(elem).hasClass("incorrectGuess")) {
            $(elem).removeClass("rowFiltered");
        }
        else {
            $(elem).addClass("rowFiltered");
        }
    }
    applySearch(elem);
}

function updateCorrectAll() {
    $(".songData").each((index, elem) => {
        updateCorrect(elem);
    });
}

function exportSongData() {
    let JSONData = new Blob([JSON.stringify(exportData, null, 4)], {type: "application/json"});
    let tmpLink = $(`<a href=` + URL.createObjectURL(JSONData) + ` download="export.json"></a>`);
    $(document.body).append(tmpLink);
    tmpLink.get(0).click();
    tmpLink.remove();
}

function createNewTable() {
    exportData = [];
    clearTable();
    addTableHeader();
}

function clearTable() {
    listWindowTable.children().remove();
}

function addTableHeader() {
    let header = $(`<tr class="header"></tr>`)
    let numberCol = $(`<td class="songNumber"><b>Number</b></td>`);
    let nameCol = $(`<td class="songName"><b>Song Name</b></td>`);
    let artistCol = $(`<td class="songArtist"><b>Artist</b></td>`);
    let animeEngCol = $(`<td class="animeNameEnglish"><b>Anime</b></td>`);
    let animeRomajiCol = $(`<td class="animeNameRomaji"><b>Anime</b></td>`);
    let typeCol = $(`<td class="songType"><b>Type<b></td>`);
    let answerCol = $(`<td class="selfAnswer"><b>Answer</b></td>`);
    let guessesCol = $(`<td class="guessesCounter"><b>Guesses</b></td>`);
    let sampleCol = $(`<td class="samplePoint"><b>Sample</b></td>`);

    if ($("#slShowSongNumber").prop("checked")) {
        numberCol.show();
    }
    else {
        numberCol.hide();
    }

    if ($("#slShowSongName").prop("checked")) {
        nameCol.show();
    }
    else {
        nameCol.hide();
    }

    if ($("#slShowArtist").prop("checked")) {
        artistCol.show();
    }
    else {
        artistCol.hide();
    }

    if ($("#slShowAnime").prop("checked")) {
        if ($("#slAnimeTitleSelect").val() === "english") {
            animeRomajiCol.hide();
        }
        if ($("#slAnimeTitleSelect").val() === "romaji") {
            animeEngCol.hide();
        }
    }
    else {
        animeRomajiCol.hide();
        animeEngCol.hide();
    }

    if ($("#slShowType").prop("checked")) {
        typeCol.show();
    }
    else {
        typeCol.hide();
    }

    if ($("#slShowSelfAnswer").prop("checked")) {
        answerCol.show();
    }
    else {
        answerCol.hide();
    }

    if ($("#slShowGuesses").prop("checked")) {
        guessesCol.show();
    }
    else {
        guessesCol.hide();
    }

    if ($("#slShowSamplePoint").prop("checked")) {
        sampleCol.show();
    }
    else {
        sampleCol.hide();
    }

    header.append(numberCol);
    header.append(nameCol);
    header.append(artistCol);
    header.append(animeEngCol);
    header.append(animeRomajiCol);
    header.append(typeCol);
    header.append(answerCol);
    header.append(guessesCol);
    header.append(sampleCol);
    listWindowTable.append(header);
}

function addTableEntry(newSong) {
    let newRow = $(`<tr class="songData clickAble"></tr>`)
        .click(function () {
            if (!$(this).hasClass("rowSelected")) {
                $(".rowSelected").removeClass("rowSelected");
                $(this).addClass("rowSelected");
                infoWindow.show();
                updateInfo(newSong);
            }
            else {
                $(".rowSelected").removeClass("rowSelected");
                infoWindow.hide();
            }
        })
        .hover(function () {
            $(this).addClass("hover");
        }, function () {
            $(this).removeClass("hover");
        })

    let guesses = newSong.players.filter((tmpPlayer) => tmpPlayer.correct === true);

    // add a slight green or red tint for correct or incorrect answers
    if (newSong.correct !== undefined) {
        if (newSong.correct === true) {
            newRow.addClass("correctGuess");
        }
        if (newSong.correct === false) {
            newRow.addClass("incorrectGuess");
        }
        if ($("#slCorrectGuesses").prop("checked")) {
            newRow.removeClass("guessHidden");
        }
        else {
            newRow.addClass("guessHidden");
        }
    }

    let songNumber = $(`<td class="songNumber">` + newSong.songNumber + `</td>`);
    let songName = $(`<td class="songName">` + newSong.name + `</td>`);
    let artist = $(`<td class="songArtist">` + newSong.artist + `</td>`);
    let animeEng = $(`<td class="animeNameEnglish">` + newSong.anime.english + `</td>`);
    let animeRomaji = $(`<td class="animeNameRomaji">` + newSong.anime.romaji + `</td>`);
    let type = $(`<td class="songType">` + newSong.type + `</td>`);
    let selfAnswer = $(`<td class="selfAnswer">` + (newSong.selfAnswer !== undefined ? newSong.selfAnswer : "...") + `</td>`);
    let guessesCounter = $(`<td class="guessesCounter">` + guesses.length + "/" + newSong.activePlayers + " (" + parseFloat((guesses.length/newSong.activePlayers*100).toFixed(2)) + "%)" + `</td>`);
    let samplePoint = $(`<td class="samplePoint">` + formatSamplePoint(newSong.startSample, newSong.videoLength) + `</td>`);

    if ($("#slShowSongNumber").prop("checked")) {
        songNumber.show();
    }
    else {
        songNumber.hide();
    }

    if ($("#slShowSongName").prop("checked")) {
        songName.show();
    }
    else {
        songName.hide();
    }

    if ($("#slShowArtist").prop("checked")) {
        artist.show();
    }
    else {
        artist.hide();
    }

    if ($("#slShowAnime").prop("checked")) {
        if ($("#slAnimeTitleSelect").val() === "english") {
            animeRomaji.hide();
        }
        if ($("#slAnimeTitleSelect").val() === "romaji") {
            animeEng.hide();
        }
    }
    else {
        animeRomaji.hide();
        animeEng.hide();
    }

    if ($("#slShowType").prop("checked")) {
        type.show();
    }
    else {
        type.hide();
    }

    if ($("#slShowSelfAnswer").prop("checked")) {
        selfAnswer.show();
    }
    else {
        selfAnswer.hide();
    }

    if ($("#slShowGuesses").prop("checked")) {
        guessesCounter.show();
    }
    else {
        guessesCounter.hide();
    }

    if ($("#slShowSamplePoint").prop("checked")) {
        samplePoint.show();
    }
    else {
        samplePoint.hide();
    }

    newRow.append(songNumber);
    newRow.append(songName);
    newRow.append(artist);
    newRow.append(animeEng);
    newRow.append(animeRomaji);
    newRow.append(type);
    newRow.append(selfAnswer);
    newRow.append(guessesCounter);
    newRow.append(samplePoint);
    listWindowTable.append(newRow);
    updateCorrect(newRow);
}

function applySearch(elem) {
    let searchQuery = $("#slSearch").val();
    let regexQuery = createAnimeSearchRegexQuery(searchQuery);
    let searchRegex = new RegExp(regexQuery, "i");
    applyRegex(elem, searchRegex);
}

function applySearchAll() {
    $("tr.songData").each((index, elem) => {
        applySearch(elem);
    });
}

function applyRegex(elem, searchRegex) {
    if (searchRegex.test($(elem).text())) {
        $(elem).show();
    }
    else {
        $(elem).hide();
    }
}

function formatSamplePoint(start, length) {
    if (isNaN(start) || isNaN(length)) {
        return "Video not loaded";
    }
    let startPoint = Math.floor(start / 60) + ":" + (start % 60 < 10 ? "0" + (start % 60) : start % 60);
    let videoLength = Math.round(length);
    let totalLength = Math.floor(videoLength / 60) + ":" + (videoLength % 60 < 10 ? "0" + (videoLength % 60) : videoLength % 60);
    return startPoint + "/" + totalLength;
}

function openInNewTab() {
    window.open("", "_blank").document.write(`
    <html>
        <head>
            <link rel="stylesheet" type="text/css" href="https://animemusicquiz.com/css/main.css">
            <link rel="stylesheet" type="text/css" href="https://animemusicquiz.com/css/libraries/bootstrap.min.css">
            <title>Song List</title>
            <style type="text/css">
                body {
                    background-image: url('https://animemusicquiz.com/img/backgrounds/normal/bg-x1.jpg');
                    background-repeat: no-repeat;
                    background-attachment: fixed;
                    background-position: center;
                    background-size: auto;
                }
                #slContainer {
                    width: 98%;
                    margin: auto;
                }
                #slContainer * {
                    color: #d9d9d9;
                }
                #slContainer tr {
                    background-color: #424242;
                }
                #slContainer .songData {
                    height: 50px;
                    cursor: auto;
                    user-select: text;
                }
                #slContainer .songData td {
                    vertical-align: middle;
                    border: 1px solid black;
                    text-align: center
                }
                #slContainer .header > td {
                    vertical-align: middle;
                    border: 1px solid black;
                    text-align: center;
                    height: 30px;
                }
                #slContainer .songNumber {
                    min-width: 60px;
                }
                #slContainer .songType {
                    min-width: 90px;
                }
                #slContainer .correctGuess {
                    background-color: rgba(0, 200, 0, 0.07);
                }
                #slContainer .incorrectGuess {
                    background-color: rgba(255, 0, 0, 0.07);
                }
            </style>
        </head>
        <body>
            <div id="slContainer">` + $("#listWindowBody").html() + `</div>
        </body>
    </html>`);
}

function createInfoWindow() {
    // create info window
    infoWindow = $(`<div id="infoWindow" class="slWindow" style="position: absolute; z-index: 1065; width: 450px; height: 350px; display: none;"></div>`);

    // create info header
    infoWindowHeader = $(`<div class="modal-header" id="infoWindowHeader"><h2 class="modal-title">Song Info</h2></div>`);

    // create info body
    infoWindowBody = $(`<div class="modal-body resizableInfo slWindowBody" id="infoWindowBody" style="height: 275px;"></div>`);

    // create info content
    infoWindowContent = $(`<div id="infoWindowContent" class="slWindowContent"></div>`);

    // create info window close button
    infoWindowCloseButton = $(`<button class="close" type="button"><span aria-hidden="true">×</span></button>`)
        .click(function () {
            infoWindow.hide();
            $(".rowSelected").removeClass("rowSelected");
        })

    infoWindowResizer = $(
        `<div class="infoResizers">
            <div class="infoResizer top-left"></div>
            <div class="infoResizer top-right"></div>
            <div class="infoResizer bottom-left"></div>
            <div class="infoResizer bottom-right"></div>
        </div>`);

    // link nodes
    infoWindowHeader.prepend(infoWindowCloseButton);
    infoWindowContent.append(infoWindowHeader);
    infoWindowContent.append(infoWindowBody);
    infoWindow.append(infoWindowContent);
    infoWindow.prepend(infoWindowResizer);
    $("#gameContainer").append(infoWindow);
}

function updateInfo(song) {
    clearInfo();
    let infoRow1 = $(`<div class="infoRow"></div>`);
    let infoRow2 = $(`<div class="infoRow"></div>`);
    let infoRow3 = $(`<div class="infoRow"></div>`);
    let infoRow4 = $(`<div class="infoRow"></div>`);

    let guesses = song.players.filter((tmpPlayer) => tmpPlayer.correct === true);

    let songNameContainer = $(`<div id="songNameContainer"><h5><b>Artist</b></h5><p>` + song.name + `</p></div>`)
    let artistContainer = $(`<div id="artistContainer"><h5><b>Artist</b></h5><p>` + song.artist + `</p></div>`)
    let animeEnglishContainer = $(`<div id="animeEnglishContainer"><h5><b>Anime English</b></h5><p>` + song.anime.english + `</p></div>`);
    let animeRomajiContainer = $(`<div id="animeRomajiContainer"><h5><b>Anime Romaji</b></h5><p>` + song.anime.romaji + `</p></div>`);
    let typeContainer = $(`<div id="typeContainer"><h5><b>Type</b></h5><p>` + song.type + `</p></div>`);
    let sampleContainer = $(`<div id="sampleContainer"></div>`)
        .html("<h5><b>Sample Point</b></h5><p>" + formatSamplePoint(song.startSample, song.videoLength) + "</p>");
    let guessedContainer = $(`<div id="guessedContainer"></div>`)
        .html("<h5><b>Guessed<br>" + guesses.length + "/" + song.activePlayers + " (" + parseFloat((guesses.length/song.activePlayers*100).toFixed(2)) + "%)</b></h5>");
    let fromListContainer = $(`<div id="fromListContainer"></div>`)
        .html("<h5><b>From Lists<br>" + song.fromList.length + "/" + song.totalPlayers + " (" + parseFloat((song.fromList.length/song.totalPlayers*100).toFixed(2)) + "%)</b></h5>");
    let urlContainer = $(`<div id="urlContainer"><h5><b>URLs</b></h5></div>`);

    // row 1: song name, artist, type
    infoRow1.append(songNameContainer);
    infoRow1.append(artistContainer);
    infoRow1.append(typeContainer);

    // row 2: anime english, romaji, sample point
    infoRow2.append(animeEnglishContainer);
    infoRow2.append(animeRomajiContainer);
    infoRow2.append(sampleContainer);

    // row 3: URLs
    infoRow3.append(urlContainer);

    // row 4: guessed and rig lists
    infoRow4.append(guessedContainer);
    infoRow4.append(fromListContainer);

    if (song.fromList.length === 0) {
        guessedContainer.css("width", "98%");
        fromListContainer.hide();
        if (guesses.length > 1) {
            let guessedListLeft = $(`<ul id="guessedListLeft"></ul>`);
            let guessedListRight = $(`<ul id="guessedListRight"></ul>`);
            let i = 0;
            for (let guessed of guesses) {
                if (i++ % 2 === 0) {
                    guessedListLeft.append($(`<li>` + guessed.name + " (" + guessed.score + ")" + `</li>`));
                }
                else {
                    guessedListRight.append($(`<li>` + guessed.name + " (" + guessed.score + ")" + `</li>`));
                }
            }
            guessedContainer.append(guessedListLeft);
            guessedContainer.append(guessedListRight);
        }
        else {
            $(`<ul id="guessedListContainer"></ul>`);
            for (let guessed of guesses) {
                listContainer.append($(`<li>` + guessed.name + " (" + guessed.score + ")" + `</li>`));
            }
            guessedContainer.append(listContainer);
        }
    }
    else {
        guessedContainer.css("width", "");
        let listContainer = $(`<ul id="guessedListContainer"></ul>`);
        fromListContainer.show();
        for (let guessed of guesses) {
            listContainer.append($(`<li>` + guessed.name + " (" + guessed.score + ")" + `</li>`));
        }
        guessedContainer.append(listContainer);
    }
    let listStatus = {
        1: "Watching",
        2: "Completed",
        3: "On-Hold",
        4: "Dropped",
        5: "Plan to Watch",
        6: "Looted"
    };

    listContainer = $("<ul></ul>");
    for (let fromList of song.fromList) {
        listContainer.append($(`<li>` + fromList.name + " (" + listStatus[fromList.listStatus] + ((fromList.score !== null) ? ", " + fromList.score + ")" : ")") + `</li>`));
    }
    fromListContainer.append(listContainer);

    listContainer = $("<ul></ul>");
    for (let host in song.urls) {
        for (let resolution in song.urls[host]) {
            let url = song.urls[host][resolution];
            let innerHTML = "";
            innerHTML += (host === "catbox" ? "Catbox " : (host === "animethemes" ? "AnimeThemes " : "OpeningsMoe "));
            innerHTML += (resolution === "0") ? "MP3: " : (resolution === "480") ? "480p: " : "720p: ";
            innerHTML += "<a href=\"" + url + "\" target=\"_blank\">" + url + "</a>";
            listContainer.append($(`<li>` + innerHTML + `</li>`));
        }
    }
    urlContainer.append(listContainer);

    infoWindowBody.append(infoRow1);
    infoWindowBody.append(infoRow2);
    infoWindowBody.append(infoRow3);
    infoWindowBody.append(infoRow4);
}

function clearInfo() {
    infoWindowBody.children().remove();
}

function createSettingsWindow() {
    // create settings window
    settingsWindow = $(`<div id="settingsWindow" class="slWindow" style="position: absolute; z-index: 1070; width: 300px; height: 365px; display: none;"></div>`);

    // create settings header
    settingsWindowHeader = $(`<div class="modal-header" id="settingsWindowHeader"></div>`)
        .append($(`<h2 class="modal-title">Settings</h2>`));

    // create settings body
    settingsWindowBody = $(`<div class="modal-body slWindowBody" id="settingsWindowBody" style="height: 290px"></div>`)
        .append($(`<div id="slListSettings">List Settings</div>`)
            .append($(`<div class="slCheckbox"></div>`)
                .append($(`<div class="customCheckbox"></div>`)
                    .append($("<input id='slAutoClear' type='checkbox'>")
                        .prop("checked", false)
                        .click(function () {
                            savedSettings.autoClearList = $(this).prop("checked");
                            saveSettings();
                        })
                    )
                    .append($("<label for='slAutoClear'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                )
                .append($("<label>Auto Clear List</label>")
                    .popover({
                        content: "Automatically clears the list on quiz start, quiz end or when leaving the lobby",
                        placement: "top",
                        trigger: "hover",
                        container: "body",
                        animation: false
                    })
                )
            )
            .append($(`<div class="slCheckbox"></div>`)
                .append($(`<div class="customCheckbox"></div>`)
                    .append($("<input id='slAutoScroll' type='checkbox'>")
                        .prop("checked", true)
                        .click(function () {
                            savedSettings.autoScroll = $(this).prop("checked");
                            saveSettings();
                        })
                    )
                    .append($("<label for='slAutoScroll'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                )
                .append($("<label>Auto Scroll</label>")
                    .popover({
                        content: "Automatically scrolls to the bottom of the list on each new entry added",
                        placement: "top",
                        trigger: "hover",
                        container: "body",
                        animation: false
                    })
                )
            )
            .append($(`<div class="slCheckbox"></div>`)
                .append($(`<div class="customCheckbox"></div>`)
                    .append($("<input id='slCorrectGuesses' type='checkbox'>")
                        .prop("checked", true)
                        .click(function () {
                            if ($(this).prop("checked")) {
                                $(".correctGuess").removeClass("guessHidden");
                                $(".incorrectGuess").removeClass("guessHidden");
                            }
                            else {
                                $(".correctGuess").addClass("guessHidden");
                                $(".incorrectGuess").addClass("guessHidden");
                            }
                            savedSettings.showCorrect = $(this).prop("checked");
                            saveSettings();
                        })
                    )
                    .append($("<label for='slCorrectGuesses'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                )
                .append($("<label>Show Correct</label>")
                    .popover({
                        content: "Enable or disable the green or red tint for correct or incorrect guesses",
                        placement: "top",
                        trigger: "hover",
                        container: "body",
                        animation: false
                    })
                )
            )
        )

        .append($(`<div id="slAnimeTitleSettings">Anime Titles</div>`)
            .append($(`<select id="slAnimeTitleSelect"></select>`)
                .append($(`<option value="english">English</option>`))
                .append($(`<option value="romaji" selected>Romaji</option>`))
                .change(function () {
                    if ($("#slShowAnime").prop("checked")) {
                        if ($(this).val() === "romaji") {
                            $(".animeNameRomaji").show();
                            $(".animeNameEnglish").hide();
                        }
                        if ($(this).val() === "english") {
                            $(".animeNameRomaji").hide();
                            $(".animeNameEnglish").show();
                        }
                    }
                    else {
                        $(".animeNameRomaji").hide();
                        $(".animeNameEnglish").hide();
                    }
                    savedSettings.animeTitles = $(this).val();
                    saveSettings();
                })
            )
        )

        .append($(`<div id="slTableSettings"></div>`)
            .append($(`<div style="width: 100%">Table Display Settings</div>`))
            .append($(`<div class="slTableSettingsContainer"></div>`)
                .append($(`<div class="slCheckbox"></div>`)
                    .append($(`<div class="customCheckbox"></div>`)
                        .append($("<input id='slShowSongNumber' type='checkbox'>")
                            .prop("checked", true)
                            .click(function () {
                                if ($(this).prop("checked")) {
                                    $(".songNumber").show();
                                }
                                else {
                                    $(".songNumber").hide();
                                }
                                savedSettings.songNumber = $(this).prop("checked");
                                saveSettings();
                            })
                        )
                        .append($("<label for='slShowSongNumber'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                    )
                    .append($("<label>Song Number</label>"))
                )
                .append($(`<div class="slCheckbox"></div>`)
                    .append($(`<div class="customCheckbox"></div>`)
                        .append($("<input id='slShowSongName' type='checkbox'>")
                            .prop("checked", true)
                            .click(function () {
                                if ($(this).prop("checked")) {
                                    $(".songName").show();
                                }
                                else {
                                    $(".songName").hide();
                                }
                                savedSettings.songName = $(this).prop("checked");
                                saveSettings();
                            })
                        )
                        .append($("<label for='slShowSongName'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                    )
                    .append($("<label>Song Name</label>"))
                )
                .append($(`<div class="slCheckbox"></div>`)
                    .append($(`<div class="customCheckbox"></div>`)
                        .append($("<input id='slShowArtist' type='checkbox'>")
                            .prop("checked", true)
                            .click(function () {
                                if ($(this).prop("checked")) {
                                    $(".songArtist").show();
                                }
                                else {
                                    $(".songArtist").hide();
                                }
                                savedSettings.artist = $(this).prop("checked");
                                saveSettings();
                            })
                        )
                        .append($("<label for='slShowArtist'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                    )
                    .append($("<label>Artist</label>"))
                )
                .append($(`<div class="slCheckbox"></div>`)
                    .append($(`<div class="customCheckbox"></div>`)
                        .append($("<input id='slShowAnime' type='checkbox'>")
                            .prop("checked", true)
                            .click(function () {
                                if ($(this).prop("checked")) {
                                    if ($("#slAnimeTitleSelect").val() === "romaji") {
                                        $(".animeNameEnglish").hide();
                                        $(".animeNameRomaji").show();
                                    }
                                    if ($("#slAnimeTitleSelect").val() === "english") {
                                        $(".animeNameEnglish").show();
                                        $(".animeNameRomaji").hide();
                                    }
                                }
                                else {
                                    $(".animeNameEnglish").hide();
                                    $(".animeNameRomaji").hide();
                                }
                                savedSettings.anime = $(this).prop("checked");
                                saveSettings();
                            })
                        )
                        .append($("<label for='slShowAnime'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                    )
                    .append($("<label>Anime</label>"))
                )
            )
            .append($(`<div class="slTableSettingsContainer"></div>`)
                .append($(`<div class="slCheckbox"></div>`)
                    .append($(`<div class="customCheckbox"></div>`)
                        .append($("<input id='slShowType' type='checkbox'>")
                            .prop("checked", true)
                            .click(function () {
                                if ($(this).prop("checked")) {
                                    $(".songType").show();
                                }
                                else {
                                    $(".songType").hide();
                                }
                                savedSettings.type = $(this).prop("checked");
                                saveSettings();
                            })
                        )
                        .append($("<label for='slShowType'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                    )
                    .append($("<label>Type</label>"))
                )
                .append($(`<div class="slCheckbox"></div>`)
                    .append($(`<div class="customCheckbox"></div>`)
                        .append($("<input id='slShowSelfAnswer' type='checkbox'>")
                            .prop("checked", false)
                            .click(function () {
                                if ($(this).prop("checked")) {
                                    $(".selfAnswer").show();
                                }
                                else {
                                    $(".selfAnswer").hide();
                                }
                                savedSettings.answers = $(this).prop("checked");
                                saveSettings();
                            })
                        )
                        .append($("<label for='slShowSelfAnswer'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                    )
                    .append($("<label>Answer</label>"))
                )
                .append($(`<div class="slCheckbox"></div>`)
                    .append($(`<div class="customCheckbox"></div>`)
                        .append($("<input id='slShowGuesses' type='checkbox'>")
                            .prop("checked", false)
                            .click(function () {
                                if ($(this).prop("checked")) {
                                    $(".guessesCounter").show();
                                }
                                else {
                                    $(".guessesCounter").hide();
                                }
                                savedSettings.guesses = $(this).prop("checked");
                                saveSettings();
                            })
                        )
                        .append($("<label for='slShowGuesses'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                    )
                    .append($("<label>Guesses</label>"))
                )
                .append($(`<div class="slCheckbox"></div>`)
                    .append($(`<div class="customCheckbox"></div>`)
                        .append($("<input id='slShowSamplePoint' type='checkbox'>")
                            .prop("checked", false)
                            .click(function () {
                                if ($(this).prop("checked")) {
                                    $(".samplePoint").show();
                                }
                                else {
                                    $(".samplePoint").hide();
                                }
                                savedSettings.samplePoint = $(this).prop("checked");
                                saveSettings();
                            })
                        )
                        .append($("<label for='slShowSamplePoint'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                    )
                    .append($("<label>Sample Point</label>"))
                )
            )  
        )

    // create settings content
    settingsWindowContent = $(`<div id="settingsWindowContent" class="slWindowContent"></div>`)

    // create settings window close button
    settingsWindowCloseButton = $(`<button class="close" type="button"><span aria-hidden="true">×</span></button>`)
        .click(() => {
            settingsWindow.hide();
        });

    // link nodes
    settingsWindowHeader.prepend(settingsWindowCloseButton);
    settingsWindowContent.append(settingsWindowHeader);
    settingsWindowContent.append(settingsWindowBody);
    settingsWindow.append(settingsWindowContent);
    $("#gameContainer").append(settingsWindow);
}

// save settings to local storage
function saveSettings() {
    localStorage.setItem("songListSettings", JSON.stringify(savedSettings));
}

// load settings from local storage
function loadSettings() {
    // load settings, if nothing is loaded, use default settings
    let loadedSettings = localStorage.getItem("songListSettings");
    if (loadedSettings !== null) {
        savedSettings = JSON.parse(loadedSettings);
    }
    updateSettings();
}

// update settings after loading
function updateSettings() {
    $("#slAutoClear").prop("checked", savedSettings.autoClearList);
    $("#slAutoScroll").prop("checked", savedSettings.autoScroll);
    $("#slCorrectGuesses").prop("checked", savedSettings.showCorrect);
    $("#slAnimeTitleSelect").val(savedSettings.animeTitles);
    $("#slShowSongNumber").prop("checked", savedSettings.songNumber);
    $("#slShowSongName").prop("checked", savedSettings.songName);
    $("#slShowArtist").prop("checked", savedSettings.artist);
    $("#slShowAnime").prop("checked", savedSettings.anime);
    $("#slShowType").prop("checked", savedSettings.type);
    $("#slShowSelfAnswer").prop("checked", savedSettings.answers);
    $("#slShowGuesses").prop("checked", savedSettings.guesses);
    $("#slShowSamplePoint").prop("checked", savedSettings.samplePoint);
}

// reset song list for the new round
let quizReadyListener = new Listener("quiz ready", (data) => {
    if ($("#slAutoClear").prop("checked")) {
        createNewTable();
    }
});

// get song data on answer reveal
let answerResultsListener = new Listener("answer results", (result) => {
    let newSong = {
        gameMode: quiz.gameMode,
        name: result.songInfo.songName,
        artist: result.songInfo.artist,
        anime: result.songInfo.animeNames,
        songNumber: parseInt($("#qpCurrentSongCount").text()),
        activePlayers: Object.values(quiz.players).filter(player => player.avatarSlot._disabled === false).length,
        totalPlayers: Object.values(quiz.players).length,
        type: result.songInfo.type === 3 ? "Insert Song" : (result.songInfo.type === 2 ? "Ending " + result.songInfo.typeNumber : "Opening " + result.songInfo.typeNumber),
        urls: result.songInfo.urlMap,
        startSample: quizVideoController.moePlayers[quizVideoController.currentMoePlayerId].startPoint,
        videoLength: parseFloat(quizVideoController.moePlayers[quizVideoController.currentMoePlayerId].$player.find("video")[0].duration.toFixed(2)),
        players: Object.values(result.players)
            .sort((a, b) => {
                if (a.answerNumber !== undefined) {
                    return a.answerNumber - b.answerNumber;
                }
                let p1name = quiz.players[a.gamePlayerId]._name;
                let p2name = quiz.players[b.gamePlayerId]._name;
                return p1name.localeCompare(p2name);
            })
            .map((tmpPlayer) => {
                let tmpObj = {
                    name: quiz.players[tmpPlayer.gamePlayerId]._name,
                    score: tmpPlayer.score,
                    correctGuesses: (quiz.gameMode !== "Standard" && quiz.gameMode !== "Ranked") ? tmpPlayer.correctGuesses : tmpPlayer.score,
                    correct: tmpPlayer.correct,
                    answer: quiz.players[tmpPlayer.gamePlayerId].avatarSlot.$answerContainerText.text(),
                    active: !quiz.players[tmpPlayer.gamePlayerId].avatarSlot._disabled,
                    position: tmpPlayer.position,
                    positionSlot: tmpPlayer.positionSlot
                };
                return tmpObj;
            }),
        fromList: Object.values(result.players)
            .filter((tmpPlayer) => tmpPlayer.listStatus !== undefined && tmpPlayer.listStatus !== false && tmpPlayer.listStatus !== 0 && tmpPlayer.listStatus !== null)
            .sort((a, b) => {
                let p1name = quiz.players[a.gamePlayerId]._name;
                let p2name = quiz.players[b.gamePlayerId]._name;
                return p1name.localeCompare(p2name);
            })
            .map((tmpPlayer) => {
                let tmpObj = {
                    name: quiz.players[tmpPlayer.gamePlayerId]._name,
                    listStatus: tmpPlayer.listStatus,
                    score: (tmpPlayer.showScore !== 0 && tmpPlayer.showScore !== null) ? tmpPlayer.showScore : null
                };
                return tmpObj;
            })
    };
    let findPlayer = Object.values(quiz.players).find((tmpPlayer) => {
        return tmpPlayer._name === selfName && tmpPlayer.avatarSlot._disabled === false
    });
    if (findPlayer !== undefined) {
        let playerIdx = Object.values(result.players).findIndex(tmpPlayer => {
            return findPlayer.gamePlayerId === tmpPlayer.gamePlayerId
        });
        newSong.correct = result.players[playerIdx].correct;
        newSong.selfAnswer = quiz.players[findPlayer.gamePlayerId].avatarSlot.$answerContainerText.text();
    }
    addTableEntry(newSong);
    exportData.push(newSong);
});


// reset songs on returning to lobby
let quizOverListener = new Listener("quiz over", (roomSettings) => {
    if ($("#slAutoClear").prop("checked")) {
        createNewTable();
    }
});

// triggers when loading rooms in the lobby, this is to detect when a player leaves the lobby to reset the song list table
let quizLeaveListener = new Listener("New Rooms", (rooms) => {
    if ($("#slAutoClear").prop("checked")) {
        createNewTable();
    }
});

quizReadyListener.bindListener();
answerResultsListener.bindListener();
quizOverListener.bindListener();
quizLeaveListener.bindListener();

createSettingsWindow();
loadSettings();
createInfoWindow();
createListWindow();

// Code for resizing the windows, this is horrible, don't look at it, don't touch it, don't question how it works
let listResizers = $(".listResizers");
let infoResizers = $(".infoResizers");
const MIN_LIST_WIDTH = 480;
const MIN_LIST_HEIGHT = 350;
const MIN_INFO_WIDTH = 375;
const MIN_INFO_HEIGHT = 300;
let startWidth = 0;
let startHeight = 0;
let startX = 0;
let startY = 0;
let startMouseX = 0;
let startMouseY = 0;

listResizers.find(".listResizer").each(function (index, resizer) {
    $(resizer).mousedown(function (event) {
        listWindow.css("user-select", "none");
        startWidth = listWindow.width();
        startHeight = listWindow.height();
        startX = listWindow.position().left;
        startY = listWindow.position().top;
        startMouseX = event.originalEvent.clientX;
        startMouseY = event.originalEvent.clientY;
        let curResizer = $(this);
        $(document.documentElement).mousemove(function (event) {
            if (curResizer.hasClass("bottom-right")) {
                let newWidth = startWidth + (event.originalEvent.clientX - startMouseX);
                let newHeight = startHeight + (event.originalEvent.clientY - startMouseY);
                if (newWidth > MIN_LIST_WIDTH) {
                    listWindow.width(newWidth);
                }
                if (newHeight > MIN_LIST_HEIGHT) {
                    listWindowBody.height(newHeight-168);
                    listWindow.height(newHeight);
                }
            }
            if (curResizer.hasClass("bottom-left")) {
                let newWidth = startWidth - (event.originalEvent.clientX - startMouseX);
                let newHeight = startHeight + (event.originalEvent.clientY - startMouseY);
                let newLeft = startX + (event.originalEvent.clientX - startMouseX);
                if (newWidth > MIN_LIST_WIDTH) {
                    listWindow.width(newWidth);
                    listWindow.css("left", newLeft + "px");
                }
                if (newHeight > MIN_LIST_HEIGHT) {
                    listWindowBody.height(newHeight-168);
                    listWindow.height(newHeight);
                }
            }
            if (curResizer.hasClass("top-right")) {
                let newWidth = startWidth + (event.originalEvent.clientX - startMouseX);
                let newHeight = startHeight - (event.originalEvent.clientY - startMouseY);
                let newTop = startY + (event.originalEvent.clientY - startMouseY);
                if (newWidth > MIN_LIST_WIDTH) {
                    listWindow.width(newWidth);
                }
                if (newHeight > MIN_LIST_HEIGHT) {
                    listWindow.css("top", newTop + "px");
                    listWindowBody.height(newHeight-168);
                    listWindow.height(newHeight);
                }
            }
            if (curResizer.hasClass("top-left")) {
                let newWidth = startWidth - (event.originalEvent.clientX - startMouseX);
                let newHeight = startHeight - (event.originalEvent.clientY - startMouseY);
                let newLeft = startX + (event.originalEvent.clientX - startMouseX);
                let newTop = startY + (event.originalEvent.clientY - startMouseY);
                if (newWidth > MIN_LIST_WIDTH) {
                    listWindow.width(newWidth);
                    listWindow.css("left", newLeft + "px");
                }
                if (newHeight > MIN_LIST_HEIGHT) {
                    listWindow.css("top", newTop + "px");
                    listWindowBody.height(newHeight-168);
                    listWindow.height(newHeight);
                }
            }
        });
        $(document.documentElement).mouseup(function (event) {
            $(document.documentElement).off("mousemove");
            $(document.documentElement).off("mouseup");
            listWindow.css("user-select", "text");
        });
    });
});

infoResizers.find(".infoResizer").each(function (index, resizer) {
    $(resizer).mousedown(function (event) {
        infoWindow.css("user-select", "none");
        startWidth = infoWindow.width();
        startHeight = infoWindow.height();
        startX = infoWindow.position().left;
        startY = infoWindow.position().top;
        startMouseX = event.originalEvent.clientX;
        startMouseY = event.originalEvent.clientY;
        let curResizer = $(this);
        $(document.documentElement).mousemove(function (event) {
            if (curResizer.hasClass("bottom-right")) {
                let newWidth = startWidth + (event.originalEvent.clientX - startMouseX);
                let newHeight = startHeight + (event.originalEvent.clientY - startMouseY);
                if (newWidth > MIN_INFO_WIDTH) {
                    infoWindow.width(newWidth);
                }
                if (newHeight > MIN_INFO_HEIGHT) {
                    infoWindowBody.height(newHeight-103);
                    infoWindow.height(newHeight);
                }
            }
            if (curResizer.hasClass("bottom-left")) {
                let newWidth = startWidth - (event.originalEvent.clientX - startMouseX);
                let newHeight = startHeight + (event.originalEvent.clientY - startMouseY);
                let newLeft = startX + (event.originalEvent.clientX - startMouseX);
                if (newWidth > MIN_INFO_WIDTH) {
                    infoWindow.width(newWidth);
                    infoWindow.css("left", newLeft + "px");
                }
                if (newHeight > MIN_INFO_HEIGHT) {
                    infoWindowBody.height(newHeight-103);
                    infoWindow.height(newHeight);
                }
            }
            if (curResizer.hasClass("top-right")) {
                let newWidth = startWidth + (event.originalEvent.clientX - startMouseX);
                let newHeight = startHeight - (event.originalEvent.clientY - startMouseY);
                let newTop = startY + (event.originalEvent.clientY - startMouseY);
                if (newWidth > MIN_INFO_WIDTH) {
                    infoWindow.width(newWidth);
                }
                if (newHeight > MIN_INFO_HEIGHT) {
                    infoWindow.css("top", newTop + "px");
                    infoWindowBody.height(newHeight-103);
                    infoWindow.height(newHeight);
                }
            }
            if (curResizer.hasClass("top-left")) {
                let newWidth = startWidth - (event.originalEvent.clientX - startMouseX);
                let newHeight = startHeight - (event.originalEvent.clientY - startMouseY);
                let newLeft = startX + (event.originalEvent.clientX - startMouseX);
                let newTop = startY + (event.originalEvent.clientY - startMouseY);
                if (newWidth > MIN_INFO_WIDTH) {
                    infoWindow.width(newWidth);
                    infoWindow.css("left", newLeft + "px");
                }
                if (newHeight > MIN_INFO_HEIGHT) {
                    infoWindow.css("top", newTop + "px");
                    infoWindowBody.height(newHeight-103);
                    infoWindow.height(newHeight);
                }
            }
        });
        $(document.documentElement).mouseup(function (event) {
            $(document.documentElement).off("mousemove");
            $(document.documentElement).off("mouseup");
            infoWindow.css("user-select", "text");
        });
    });
});

// draggable windows
$("#listWindow").draggable({
    handle: "#listWindowHeader",
    containment: "#gameContainer"
});

$("#infoWindow").draggable({
    handle: "#infoWindowHeader",
    containment: "#gameContainer"
});

$("#settingsWindow").draggable({
    handle: "#settingsWindowHeader",
    containment: "#gameContainer"
});

// lowers the z-index when a modal window is shown so it doesn't overlap
$(".modal").on("show.bs.modal", () => {
    listWindow.css("z-index", "1030");
    infoWindow.css("z-index", "1035");
    settingsWindow.css("z-index", "1040");
});

$(".modal").on("hidden.bs.modal", () => {
    listWindow.css("z-index", "1060");
    infoWindow.css("z-index", "1065");
    settingsWindow.css("z-index", "1070");
});

// lowers the z-index when hovering over a label
$(".slCheckbox label").hover(() => {
    listWindow.css("z-index", "1030");
    infoWindow.css("z-index", "1035");
    settingsWindow.css("z-index", "1040");
}, () => {
    listWindow.css("z-index", "1060");
    infoWindow.css("z-index", "1065");
    settingsWindow.css("z-index", "1070");
});

// Auto scrolls the list on new entry added
document.getElementById("listWindowTable").addEventListener("DOMNodeInserted", function() {
    autoScrollList();
});

function autoScrollList() {
    if ($("#slAutoScroll").prop("checked")) {
        $("#listWindowBody").scrollTop($("#listWindowBody").get(0).scrollHeight);
    }
}


// Open the song list with pause/break key
$(document.documentElement).keydown(function (event) {
    if (event.which === 19) {
        if (listWindow.is(":visible")) {
            listWindow.hide();
            infoWindow.hide();
            settingsWindow.hide();
            $(".rowSelected").removeClass("rowSelected");
        }
        else {
            listWindow.show();
            autoScrollList();
        }
    }
});

// Add metadata
AMQ_addScriptData({
    name: "Song List UI",
    author: "TheJoseph98",
    description: `
        <p>Creates a window which includes the song list table with song info such as song name, artist and the anime it's from</p>
        </p>The list can be accessed by clicking the list icon in the top right while in quiz or by pressing the pause/break key on the keyboard</p>
        <a href="https://i.imgur.com/YFEvFh2.png" target="_blank"><img src="https://i.imgur.com/YFEvFh2.png" /></a>
        <p>In the table, you can click on individual entries to get more info about the song, including video URLs, who guessed the song and from which lists the song was pulled (including watching status and score)</p>
        <p>The song list has customisable options which you can change by clicking the "Settings" button in the song list window, these settings are automatically saved</p>
        <a href="https://i.imgur.com/BKWygGP.png" target="_blank"><img src="https://i.imgur.com/BKWygGP.png" /></a>
        <a href="https://i.imgur.com/X5RMnV1.png?1" target="_blank"><img src="https://i.imgur.com/X5RMnV1.png?1" /></a>
        <p>You can also download the list in JSON format by clicking the "Export" button, this file can then be imported to <a href="https://thejoseph98.github.io/AMQ-Song-List-Viewer/" target="_blank">AMQ Song List Viewer</a> which displays the scoreboard status for each song and has individual player search so you can see what each player answered on each individual song
        <a href="https://i.imgur.com/2BhNNb4.png" target="_blank"><img src="https://i.imgur.com/2BhNNb4.png" /></a>
        <p>the windows are draggable and resizable so they fit each user's personal experience</p>
        <a href="https://i.imgur.com/hZxRJ5M.png" target="_blank"><img src="https://i.imgur.com/hZxRJ5M.png" /></a>
    `
});

// CSS
GM_addStyle(`
.slWindow {
    overflow-y: hidden;
    top: 0px;
    left: 0px;
    margin: 0px;
    background-color: #424242;
    border: 1px solid rgba(27, 27, 27, 0.2);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
    user-select: text;
}
.slWindowOptions {
    width: 100%;
    height: 65px;
    border-bottom: 1px solid #6d6d6d;
}
.slWindowBody {
    width: 100%;
    overflow-y: auto;
}
.slWindowContent {
    width: 100%;
    position: absolute;
    top: 0px;
}
.slWindow .modal-header {
    cursor: move;
}
#listWindow .close {
    font-size: 32px;
}
#infoWindow .close {
    font-size: 32px;
}
#settingsWindow .close {
    font-size: 32px;
}
#slAnimeTitleSelect {
    color: black;
    font-weight: normal;
    width: 75%;
    margin-top: 5px;
    border: 1px;
    margin-right: 1px;
}
.songListOptions {
    border-bottom: 1px solid #6d6d6d;
    height: 65px;
}
.songListOptionsButton {
    float: right;
    margin-top: 15px;
    margin-right: 10px;
    padding: 6px 8px;
}
#slSearch {
    width: 200px;
    color: black;
    margin: 15px 15px 0px 15px;
    height: 35px;
    border-radius: 4px;
    border: 0;
    text-overflow: ellipsis;
    padding: 5px;
    float: left;
}
.slCorrectFilter {
    width: 80px;
    float: left;
    margin-top: 4px;
}
.slFilterContainer {
    padding-top: 4px;
    padding-bottom: 4px;
}
.rowFiltered {
    display: none !important;
}
#slTableSettings {
    float: left;
    width: 100%;
    text-align: center;
    font-weight: bold;
}
.slTableSettingsContainer {
    float: left;
    width: 50%;
}
.songData {
    height: 50px;
}
.songData > td {
    vertical-align: middle;
    border: 1px solid black;
    text-align: center;
}
.songData.guessHidden {
    background-color: rgba(0, 0, 0, 0);
}
.songData.hover {
    box-shadow: 0px 0px 10px cyan;
}
.songData.rowSelected {
    box-shadow: 0px 0px 10px lime;
}
.correctGuess {
    background-color: rgba(0, 200, 0, 0.07);
}
.incorrectGuess {
    background-color: rgba(255, 0, 0, 0.07);
}
.songNumber {
    min-width: 60px;
}
.songName {
    min-width: 85px;
}
.songType {
    min-width: 80px;
}
.guessesCounter {
    min-width: 80px;
}
.samplePoint {
    min-width: 75px;
}
.header {
    height: 30px;
}
.header > td {
    border: 1px solid black;
    text-align: center;
    vertical-align: middle;
}
.infoRow {
    width: 98%;
    height: auto;
    text-align: center;
    clear: both;
}
.infoRow > div {
    margin: 1%;
    text-align: center;
    float: left;
}
#songNameContainer {
    width: 38%;
    overflow-wrap: break-word;
}
#artistContainer {
    width: 38%;
    overflow-wrap: break-word;
}
#typeContainer {
    width: 18%;
}
#animeEnglishContainer {
    width: 38%;
    overflow-wrap: break-word;
}
#animeRomajiContainer {
    width: 38%;
    overflow-wrap: break-word;
}
#sampleContainer {
    width: 18%;
}
#urlContainer {
    width: 100%;
}
#guessedListLeft {
    width: 50%;
    float: left;
}
#guessedListRight {
    width: 50%;
    float: right;
}
#guessedContainer {
    width: 48%;
    float: left;
}
#fromListContainer {
    width: 48%;
    float: right;
}
.fromListHidden {
    width: 100%;
}
#qpOptionContainer {
    z-index: 10;
}
#qpSongListButton {
    width: 30px;
    height: 100%;
    margin-right: 5px;
}
.slCheckboxContainer {
    width: 130px;
    float: right;
    user-select: none;
}
.slCheckbox {
    display: flex;
    margin: 5px;
}
.slCheckbox > label {
    font-weight: normal;
    margin-left: 5px;
}
.slFilterContainer > .customCheckbox {
    float: left;
}
#slListSettings {
    width: 50%;
    float: left;
    text-align: center;
    font-weight: bold;
}
#slAnimeTitleSettings {
    width: 50%;
    float: left;
    text-align: center;
    font-weight: bold;
}
.listResizers {
    width: 100%;
    height: 100%;
}
.listResizer {
    width: 10px;
    height: 10px;
    position: absolute;
    z-index: 100;
}
.listResizer.top-left {
    top: 0px;
    left: 0px;
    cursor: nwse-resize;
}
.listResizer.top-right {
    top: 0px;
    right: 0px;
    cursor: nesw-resize;
}
.listResizer.bottom-left {
    bottom: 0px;
    left: 0px;
    cursor: nesw-resize;
}
.listResizer.bottom-right {
    bottom: 0px;
    right: 0px;
    cursor: nwse-resize;
}
.infoResizers {
    width: 100%;
    height: 100%;
}
.infoResizer {
    width: 10px;
    height: 10px;
    position: absolute;
    z-index: 100;
}
.infoResizer.top-left {
    top: 0px;
    left: 0px;
    cursor: nwse-resize;
}
.infoResizer.top-right {
    top: 0px;
    right: 0px;
    cursor: nesw-resize;
}
.infoResizer.bottom-left {
    bottom: 0px;
    left: 0px;
    cursor: nesw-resize;
}
.infoResizer.bottom-right {
    bottom: 0px;
    right: 0px;
    cursor: nwse-resize;
}
`);