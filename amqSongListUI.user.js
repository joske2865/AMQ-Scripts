// ==UserScript==
// @name         AMQ Song List UI
// @namespace    https://github.com/TheJoseph98
// @version      3.3.2
// @description  Adds a song list window, accessible with a button below song info while in quiz, each song in the list is clickable for extra information
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqWindows.js
// @require      https://github.com/amq-script-project/AMQ-Scripts/raw/master/gameplay/amqAnswerTimesUtility.user.js
// @updateURL    https://github.com/TheJoseph98/AMQ-Scripts/raw/master/amqSongListUI.user.js

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

let listWindow;
let listWindowOpenButton;
let listWindowTable;

let infoWindow;

let settingsWindow;

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
    annId: true,
    type: true,
    answers: false,
    guesses: false,
    samplePoint: false,
    guessTime: true,
    difficulty: true
};

function createListWindow() {
    let listCloseHandler = function () {
        infoWindow.close();
        settingsWindow.close();
        $(".rowSelected").removeClass("rowSelected");
    }
    listWindow = new AMQWindow({
        title: "Song List",
        width: 650,
        height: 480,
        minWidth: 480,
        minHeight: 350,
        zIndex: 1060,
        closeHandler: listCloseHandler,
        resizable: true,
        draggable: true
    });

    listWindow.addPanel({
        id: "listWindowOptions",
        width: 1.0,
        height: 65
    });

    listWindow.addPanel({
        id: "listWindowTableContainer",
        width: 1.0,
        height: "calc(100% - 65px)",
        position: {
            x: 0,
            y: 65
        },
        scrollable: {
            x: true,
            y: true
        }
    });

    // create the options tab
    listWindow.panels[0].panel
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
                if (settingsWindow.isVisible()) {
                    settingsWindow.close();
                }
                else {
                    settingsWindow.open();
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
        );

    // create results table
    listWindowTable = $(`<table id="listWindowTable" class="table floatingContainer"></table>`);
    listWindow.panels[1].panel.append(listWindowTable);

    // button to access the song results
    listWindowOpenButton = $(`<div id="qpSongListButton" class="clickAble qpOption"><i aria-hidden="true" class="fa fa-list-ol qpMenuItem"></i></div>`)
        .click(function () {
            if(listWindow.isVisible()) {
                $(".rowSelected").removeClass("rowSelected");
                listWindow.close();
                infoWindow.close();
                settingsWindow.close();
            }
            else {
                listWindow.open();
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

    listWindow.body.attr("id", "listWindowBody");
    addTableHeader();
    applyListStyle();
}

function updateCorrect(elem) {
    let correctEnabled = $("#slFilterCorrect").prop("checked");
    let incorrectEnabled = $("#slFilterIncorrect").prop("checked");
    if (correctEnabled && incorrectEnabled) {
        if ($(elem).hasClass("correctGuess") || $(elem).hasClass("incorrectGuess")) {
            $(elem).removeClass("rowFiltered");
        }
        else {
            $(elem).addClass("rowFiltered");
        }
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
    let d = new Date();
    let fileName = "song_export_";
    fileName += d.getFullYear() + "-";
    fileName += (d.getMonth() + 1 < 10 ? "0" + (d.getMonth() + 1) : d.getMonth() + 1) + "-";
    fileName += (d.getDate() < 10 ? ("0" + d.getDate()) : d.getDate()) + "_";
    fileName += (d.getHours() < 10 ? ("0" + d.getHours()) : d.getHours()) + "-";
    fileName += (d.getMinutes() < 10 ? ("0" + d.getMinutes()) : d.getMinutes()) + "-";
    fileName += (d.getSeconds() < 10 ? ("0" + d.getSeconds()) : d.getSeconds()) + ".json";
    let JSONData = new Blob([JSON.stringify(exportData)], {type: "application/json"});
    let tmpLink = $(`<a href="${URL.createObjectURL(JSONData)}" download="${fileName}"></a>`);
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
    let annIdCol = $(`<td class="annId"><b>ANN ID</b></td>`);
    let typeCol = $(`<td class="songType"><b>Type<b></td>`);
    let answerCol = $(`<td class="selfAnswer"><b>Answer</b></td>`);
    let guessesCol = $(`<td class="guessesCounter"><b>Guesses</b></td>`);
    let sampleCol = $(`<td class="samplePoint"><b>Sample</b></td>`);
    let diffCol = $(`<td class="difficulty"><b>Difficulty</b></td>`);

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

    if ($("#slShowAnnId").prop("checked")) {
        annIdCol.show();
    }
    else {
        annIdCol.hide();
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

    if ($("#slShowDifficulty").prop("checked")) {
        diffCol.show();
    }
    else {
        diffCol.hide();
    }

    header.append(numberCol);
    header.append(nameCol);
    header.append(artistCol);
    header.append(animeEngCol);
    header.append(animeRomajiCol);
    header.append(annIdCol);
    header.append(typeCol);
    header.append(answerCol);
    header.append(guessesCol);
    header.append(sampleCol);
    header.append(diffCol);
    listWindowTable.append(header);
}

function addTableEntry(newSong) {
    let newRow = $(`<tr class="songData clickAble"></tr>`)
        .click(function () {
            if (!$(this).hasClass("rowSelected")) {
                $(".rowSelected").removeClass("rowSelected");
                $(this).addClass("rowSelected");
                infoWindow.open();
                updateInfo(newSong);
            }
            else {
                $(".rowSelected").removeClass("rowSelected");
                infoWindow.close();
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

    let songNumber = $(`<td class="songNumber"></td>`).text(newSong.songNumber);
    let songName = $(`<td class="songName"></td>`).text(newSong.name);
    let artist = $(`<td class="songArtist"></td>`).text(newSong.artist);
    let animeEng = $(`<td class="animeNameEnglish"></td>`).text(newSong.anime.english);
    let animeRomaji = $(`<td class="animeNameRomaji"></td>`).text(newSong.anime.romaji);
    let annId = $(`<td class="annId"></td>`).text(newSong.annId);
    let type = $(`<td class="songType"></td>`).text(newSong.type);
    let selfAnswer = $(`<td class="selfAnswer"></td>`).text(newSong.selfAnswer !== undefined ? newSong.selfAnswer : "...");
    // Add an if-else for if it shouldn't display guess time based on savedSettings.guessTime
    let guessesCounter = $(`<td class="guessesCounter"></td>`).text(guesses.length + "/" + newSong.activePlayers + " (" + parseFloat((guesses.length/newSong.activePlayers*100).toFixed(2)) + "%)");
    let samplePoint = $(`<td class="samplePoint"></td>`).text(formatSamplePoint(newSong.startSample, newSong.videoLength));
    let difficulty = $(`<td class="samplePoint"></td>`).text(newSong.difficulty + (Number.isInteger(newSong.difficulty) ? "%" : ""));

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

    if ($("#slShowAnnId").prop("checked")) {
        annId.show();
    }
    else {
        annId.hide();
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

    if ($("#slShowDifficulty").prop("checked")) {
        difficulty.show();
    }
    else {
        difficulty.hide();
    }

    newRow.append(songNumber);
    newRow.append(songName);
    newRow.append(artist);
    newRow.append(animeEng);
    newRow.append(animeRomaji);
    newRow.append(annId);
    newRow.append(type);
    newRow.append(selfAnswer);
    newRow.append(guessesCounter);
    newRow.append(samplePoint);
    newRow.append(difficulty);
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
            <div id="slContainer">` + $("#listWindowTableContainer").html() + `</div>
        </body>
    </html>`);
}

function createInfoWindow() {
    let closeInfoHandler = function () {
        $(".rowSelected").removeClass("rowSelected");
    }
    // create info window
    infoWindow = new AMQWindow({
        title: "Song Info",
        width: 450,
        height: 350,
        minWidth: 375,
        minHeight: 300,
        draggable: true,
        resizable: true,
        closeHandler: closeInfoHandler,
        zIndex: 1065,
        id: "infoWindow"
    });

    infoWindow.addPanel({
        height: 1.0,
        width: 1.0,
        scrollable: {
            x: false,
            y: true
        }
    });
}

function updateInfo(song) {
    clearInfo();
    let infoRow1 = $(`<div class="infoRow"></div>`);
    let infoRow2 = $(`<div class="infoRow"></div>`);
    let infoRow3 = $(`<div class="infoRow"></div>`);
    let infoRow4 = $(`<div class="infoRow"></div>`);
    let infoRow5 = $(`<div class="infoRow"></div>`);
    let infoRow6 = $(`<div class="infoRow"></div>`);
    let infoRow7 = $(`<div class="infoRow"></div>`);

    let guesses = song.players.filter((tmpPlayer) => tmpPlayer.correct === true);

    let songNameContainer = $(`<div id="songNameContainer"><h5>
        <b>Song Name</b> <i class="fa fa-files-o clickAble" id="songNameCopy"></i></h5><p>${song.name}</p></div>`);
    let artistContainer = $(`<div id="artistContainer"><h5>
        <b>Artist</b> <i class="fa fa-files-o clickAble" id="artistCopy"></i></h5><p>${song.artist}</p></div>`);
    let animeEnglishContainer = $(`<div id="animeEnglishContainer"><h5>
        <b>Anime English</b> <i class="fa fa-files-o clickAble" id="animeEnglishCopy"></i></h5><p>${song.anime.english}</p></div>`);
    let animeRomajiContainer = $(`<div id="animeRomajiContainer"><h5>
        <b>Anime Romaji</b> <i class="fa fa-files-o clickAble" id="animeRomajiCopy"></i></h5><p>${song.anime.romaji}</p></div>`);
    let altTitlesContainer = $(`<div id="altTitlesContainer"><h5>
        <b>All Working Titles</b></h5><p style="margin-bottom: 0;">${song.altAnswers.join(`</p><p style="margin-bottom: 0;">`)}</p></div>`);
    let difficultyContainer = $(`<div id="difficultyContainer"><h5><b>Song Difficulty</b></h5><p>${song.difficulty}%</p></div>`);
    let typeContainer = $(`<div id="typeContainer"><h5><b>Type</b></h5><p>${song.type}</p></div>`);
    let sampleContainer = $(`<div id="sampleContainer"><h5><b>Sample Point</b></h5><p>${formatSamplePoint(song.startSample, song.videoLength)}</p></div>`);
    let annIdContainer = $(`<div id="annIdContainer"><h5 style="margin-bottom: 0;"><b>ANN ID: </b>${song.annId} <i class="fa fa-files-o clickAble" id="annIdCopy"></i></h5>
            <a target="_blank" href="https://www.animenewsnetwork.com/encyclopedia/anime.php?id=${song.annId}">https://www.animenewsnetwork.com/encyclopedia/anime.php?id=${song.annId}</a>
        </div>`);
    let animeInfoLinksContainer = $(`<div id="animeInfoLinksContainer"><h5><b>MAL/Anilist/Kitsu IDs</b></h5><p style="margin-bottom: 0;">`
        .concat(Number.isInteger(song.siteIds.malId) ? `</p>MAL ID: <a href="https://www.myanimelist.net/anime/${song.siteIds.malId}">${song.siteIds.malId}</a><p style="margin-bottom: 0;"` : ``)
        .concat(Number.isInteger(song.siteIds.aniListId) ? `</p>Anilist ID: <a href="https://www.anilist.co/anime/${song.siteIds.aniListId}">${song.siteIds.aniListId}</a><p style="margin-bottom: 0;">` : ``)
        .concat(Number.isInteger(song.siteIds.kitsuId) ? `</p>Kitsu ID: <a href="https://kitsu.io/anime/${song.siteIds.kitsuId}">${song.siteIds.kitsuId}</a><p style="margin-bottom: 0;">` : ``)
        .concat(`</p>`))
    let guessedContainer = $(`<div id="guessedContainer"></div>`)
        .html(`<h5><b>Guessed<br>${guesses.length}/${song.activePlayers} (${parseFloat((guesses.length/song.activePlayers*100).toFixed(2))}%)</b></h5>`);
    let fromListContainer = $(`<div id="fromListContainer"></div>`)
        .html(`<h5><b>From Lists<br>${song.fromList.length}/${song.totalPlayers} (${parseFloat((song.fromList.length/song.totalPlayers*100).toFixed(2))}%)</b></h5>`);
    let urlContainer = $(`<div id="urlContainer"><h5><b>URLs</b></h5></div>`);

    // row 1: song name, artist, type
    infoRow1.append(songNameContainer);
    infoRow1.append(artistContainer);
    infoRow1.append(typeContainer);

    // row 2: anime english, romaji, sample point
    infoRow2.append(animeEnglishContainer);
    infoRow2.append(animeRomajiContainer);
    infoRow2.append(sampleContainer);

    // row 3: all alt titles
    infoRow3.append(altTitlesContainer);
    infoRow3.append(difficultyContainer);

    // row 4: URLs
    infoRow4.append(urlContainer);

    // row 5: ANN ID info and ANN URL
    infoRow5.append(annIdContainer);

    // row 6: other anime info site links
    infoRow6.append(animeInfoLinksContainer);

    // row 7: guessed and rig lists
    infoRow7.append(guessedContainer);
    infoRow7.append(fromListContainer);

    let listContainer;

    if (song.fromList.length === 0) {
        guessedContainer.css("width", "98%");
        fromListContainer.hide();
        if (guesses.length > 1) {
            let guessedListLeft = $(`<ul id="guessedListLeft"></ul>`);
            let guessedListRight = $(`<ul id="guessedListRight"></ul>`);
            let i = 0;
            for (let guessed of guesses) {
                let closing_bracket = savedSettings.guessTime ? ", " + guessed.guessTime + "ms" : "";
                if (i++ % 2 === 0) {
                    guessedListLeft.append($(`<li>${guessed.name} (${guessed.score}${closing_bracket})</li>`));
                }
                else {
                    guessedListRight.append($(`<li>${guessed.name} (${guessed.score}${closing_bracket})</li>`));
                }
            }
            guessedContainer.append(guessedListLeft);
            guessedContainer.append(guessedListRight);
        }
        else {
            listContainer = $(`<ul id="guessedListContainer"></ul>`);
            for (let guessed of guesses) {
                let closing_bracket = savedSettings.guessTime ? ", " + guessed.guessTime + "ms" : "";
                listContainer.append($(`<li>${guessed.name} (${guessed.score}${closing_bracket})</li>`));
            }
            guessedContainer.append(listContainer);
        }
    }
    else {
        guessedContainer.css("width", "");
        listContainer = $(`<ul id="guessedListContainer"></ul>`);
        fromListContainer.show();
        for (let guessed of guesses) {
            let closing_bracket = savedSettings.guessTime ? ", " + guessed.guessTime + "ms" : "";
            listContainer.append($(`<li>${guessed.name} (${guessed.score}${closing_bracket})</li>`));
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
        listContainer.append($(`<li>${fromList.name} (${listStatus[fromList.listStatus]}${((fromList.score !== null) ? (", " + fromList.score + ")") : ")")}</li>`));
    }
    fromListContainer.append(listContainer);

    listContainer = $("<ul></ul>");
    for (let host in song.urls) {
        for (let resolution in song.urls[host]) {
            let url = song.urls[host][resolution];
            let innerHTML = "";
            innerHTML += host === "catbox" ? "Catbox " : "OpeningsMoe ";
            innerHTML += resolution === "0" ? "MP3: " : (resolution === "480" ? "480p: " : "720p: ");
            innerHTML += `<a href="${url}" target="_blank">${url}</a>`;
            listContainer.append($(`<li>${innerHTML}</li>`));
        }
    }
    urlContainer.append(listContainer);

    infoWindow.panels[0].panel.append(infoRow1);
    infoWindow.panels[0].panel.append(infoRow2);
    infoWindow.panels[0].panel.append(infoRow3);
    infoWindow.panels[0].panel.append(infoRow4);
    infoWindow.panels[0].panel.append(infoRow5);
    infoWindow.panels[0].panel.append(infoRow6);
    infoWindow.panels[0].panel.append(infoRow7);

    $("#songNameCopy").click(function () {
        $("#copyBox").val(song.name).select();
        document.execCommand("copy");
        $("#copyBox").val("").blur();
    }).popover({
        content: "Copy Song Name",
        trigger: "hover",
        placement: "top",
        container: "#infoWindow",
        animation: false
    });

    $("#artistCopy").click(function () {
        $("#copyBox").val(song.artist).select();
        document.execCommand("copy");
        $("#copyBox").val("").blur();
    }).popover({
        content: "Copy Artist",
        trigger: "hover",
        placement: "top",
        container: "#infoWindow",
        animation: false
    });

    $("#animeEnglishCopy").click(function () {
        $("#copyBox").val(song.anime.english).select();
        document.execCommand("copy");
        $("#copyBox").val("").blur();
    }).popover({
        content: "Copy English Anime Name",
        trigger: "hover",
        placement: "top",
        container: "#infoWindow",
        animation: false
    });

    $("#animeRomajiCopy").click(function () {
        $("#copyBox").val(song.anime.romaji).select();
        document.execCommand("copy");
        $("#copyBox").val("").blur();
    }).popover({
        content: "Copy Romaji Anime Name",
        trigger: "hover",
        placement: "top",
        container: "#infoWindow",
        animation: false
    });

    $("#annIdCopy").click(function () {
        $("#copyBox").val(song.annId).select();
        document.execCommand("copy");
        $("#copyBox").val("").blur();
    }).popover({
        content: "Copy ANN ID",
        trigger: "hover",
        placement: "top",
        container: "#infoWindow",
        animation: false
    });
}

function clearInfo() {
    infoWindow.panels[0].clear();
}

function createSettingsWindow() {
    settingsWindow = new AMQWindow({
        width: 400,
        height: 320,
        title: "Settings",
        draggable: true,
        zIndex: 1070
    });
    settingsWindow.addPanel({
        width: 1.0,
        height: 130,
        id: "slListSettings"
    });
    settingsWindow.addPanel({
        width: 1.0,
        height: 160,
        position: {
            x: 0,
            y: 135
        },
        id: "slTableSettings"
    });
    settingsWindow.addPanel({
        width: 1.0,
        height: 50,
        position: {
            x: 0,
            y: 300 // 125 + 120
        },
        id: "slGuessTimeSettings"
    });

    settingsWindow.panels[0].panel
        .append($(`<div class="slListDisplaySettings"></div>`)
            .append($(`<span style="text-align: center;display: block;"><b>List Settings</b></span>`))
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

        .append($(`<div id="slAnimeTitleSettings"></div>`)
            .append($(`<span style="text-align: center;display: block;"><b>Anime Titles</b></span>`))
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

        .append($(`<div id="slListStyleSettings"></div>`)
            .append($(`<span style="text-align: center;display: block;"><b>List Style</b></span>`))
            .append($(`<select id="slListStyleSelect"></select>`)
                .append($(`<option value="compact">Compact</option>`))
                .append($(`<option value="standard" selected>Standard</option>`))
                .change(function () {
                    applyListStyle();
                    savedSettings.listStyle = $(this).val();
                    saveSettings();
                })
            )
        )

    settingsWindow.panels[1].panel
        .append($(`<span style="width: 100%; text-align: center;display: block;"><b>Table Display Settings</b></span>`))
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
        )
        .append($(`<div class="slTableSettingsContainer"></div>`)
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
            .append($(`<div class="slCheckbox"></div>`)
                .append($(`<div class="customCheckbox"></div>`)
                    .append($("<input id='slShowAnnId' type='checkbox'>")
                        .prop("checked", false)
                        .click(function () {
                            if ($(this).prop("checked")) {
                                $(".annId").show();
                            }
                            else {
                                $(".annId").hide();
                            }
                            savedSettings.annId = $(this).prop("checked");
                            saveSettings();
                        })
                    )
                    .append($("<label for='slShowAnnId'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                )
                .append($("<label>ANN ID</label>"))
            )
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

        )
        .append($(`<div class="slTableSettingsContainer"></div>`)
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
            .append($(`<div class="slCheckbox"></div>`)
                .append($(`<div class="customCheckbox"></div>`)
                    .append($("<input id='slShowDifficulty' type='checkbox'>")
                        .prop("checked", false)
                        .click(function () {
                            if ($(this).prop("checked")) {
                                $(".difficulty").show();
                            }
                            else {
                                $(".difficulty").hide();
                            }
                            savedSettings.samplePoint = $(this).prop("checked");
                            saveSettings();
                        })
                    )
                    .append($("<label for='slShowDifficulty'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                )
                .append($("<label>Difficulty</label>"))
            )
        )

        settingsWindow.panels[2].panel
        .append($(`<span style="width: 100%; text-align: center;display: block;"><b>Guess Time Display Settings</b></span>`))
        .append($(`<div class="slGuessTimeSettingsContainer"></div>`)
            .append($(`<div class="slCheckbox"></div>`)
                .append($(`<div class="customCheckbox"></div>`)
                    .append($("<input id='slShowGuessTime' type='checkbox'>")
                        .prop("checked", true)
                        .click(function () {
                            savedSettings.guessTime = $(this).prop("checked");
                            saveSettings();
                        })
                    )
                    .append($("<label for='slShowGuessTime'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                )
                .append($("<label>Guess Time</label>"))
            )
        )
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
        const oldSavedSettings = JSON.parse(loadedSettings); // replaces the object and deletes the key
        Object.keys(oldSavedSettings).forEach((key) => {savedSettings[key] = oldSavedSettings[key];});
        // If the key wasn't added yet, do so here
        if(Object.keys(savedSettings).length > Object.keys(oldSavedSettings).length){
            saveSettings();
        }
    updateSettings();
    }
}

// update settings after loading
function updateSettings() {
    $("#slAutoClear").prop("checked", savedSettings.autoClearList);
    $("#slAutoScroll").prop("checked", savedSettings.autoScroll);
    $("#slCorrectGuesses").prop("checked", savedSettings.showCorrect);
    $("#slAnimeTitleSelect").val(savedSettings.animeTitles === undefined ? "romaji" : savedSettings.animeTitles);
    $("#slListStyleSelect").val(savedSettings.listStyle === undefined ? "standard" : savedSettings.listStyle);
    $("#slShowSongNumber").prop("checked", savedSettings.songNumber);
    $("#slShowSongName").prop("checked", savedSettings.songName);
    $("#slShowArtist").prop("checked", savedSettings.artist);
    $("#slShowAnime").prop("checked", savedSettings.anime);
    $("#slShowAnnId").prop("checked", savedSettings.annId);
    $("#slShowType").prop("checked", savedSettings.type);
    $("#slShowSelfAnswer").prop("checked", savedSettings.answers);
    $("#slShowGuesses").prop("checked", savedSettings.guesses);
    $("#slShowSamplePoint").prop("checked", savedSettings.samplePoint);
    $("#slShowDifficulty").prop("checked", savedSettings.difficulty);
    $("#slShowGuessTime").prop("checked", savedSettings.guessTime);
}

function applyListStyle() {
    $("#listWindowTable").removeClass("compact");
    $("#listWindowTable").removeClass("standard");
    $("#listWindowTable").addClass($("#slListStyleSelect").val());
}

function autoScrollList() {
    if ($("#slAutoScroll").prop("checked")) {
        $("#listWindowTableContainer").scrollTop($("#listWindowTableContainer").get(0).scrollHeight);
    }
}

function setup() {
    // reset song list for the new round
    let quizReadyListener = new Listener("quiz ready", (data) => {
        if ($("#slAutoClear").prop("checked")) {
            createNewTable();
        }
    });

    // get song data on answer reveal
    let answerResultsListener = new Listener("answer results", (result) => {
    	setTimeout(() => {

	        let newSong = {
	            gameMode: quiz.gameMode,
	            name: result.songInfo.songName,
	            artist: result.songInfo.artist,
	            anime: result.songInfo.animeNames,
	            annId: result.songInfo.annId,
	            songNumber: parseInt($("#qpCurrentSongCount").text()),
	            activePlayers: Object.values(quiz.players).filter(player => player.avatarSlot._disabled === false).length,
	            totalPlayers: Object.values(quiz.players).length,
	            type: result.songInfo.type === 3 ? "Insert Song" : (result.songInfo.type === 2 ? "Ending " + result.songInfo.typeNumber : "Opening " + result.songInfo.typeNumber),
	            urls: result.songInfo.urlMap,
	            siteIds: result.songInfo.siteIds,
	            difficulty: typeof result.songInfo.animeDifficulty === "string" ? "Unrated" : result.songInfo.animeDifficulty.toFixed(1),
	            animeType: result.songInfo.animeType,
	            animeScore: result.songInfo.animeScore,
	            vintage: result.songInfo.vintage,
	            tags: result.songInfo.animeTags,
	            genre: result.songInfo.animeGenre,
	            altAnswers: [...new Set(result.songInfo.altAnimeNames.concat(result.songInfo.altAnimeNamesAnswers))],
	            startSample: quizVideoController.moePlayers[quizVideoController.currentMoePlayerId].startPoint,
	            videoLength: parseFloat(quizVideoController.moePlayers[quizVideoController.currentMoePlayerId].$player[0].duration.toFixed(2)),
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
	                        guessTime: amqAnswerTimesUtility.playerTimes[tmpPlayer.gamePlayerId],
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
	    },0);
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

    // lowers the z-index when a modal window is shown so it doesn't overlap
    $(".modal").on("show.bs.modal", () => {
        listWindow.setZIndex(1030);
        infoWindow.setZIndex(1035);
        settingsWindow.setZIndex(1040);
    });

    $(".modal").on("hidden.bs.modal", () => {
        listWindow.setZIndex(1060);
        infoWindow.setZIndex(1065);
        settingsWindow.setZIndex(1070);
    });

    // lowers the z-index when hovering over a label
    $(".slCheckbox label").hover(() => {
        listWindow.setZIndex(1030);
        infoWindow.setZIndex(1035);
        settingsWindow.setZIndex(1040);
    }, () => {
        listWindow.setZIndex(1060);
        infoWindow.setZIndex(1065);
        settingsWindow.setZIndex(1070);
    });

    // Auto scrolls the list on new entry added
    document.getElementById("listWindowTable").addEventListener("DOMNodeInserted", function() {
        autoScrollList();
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
    AMQ_addStyle(`
        #listWindowTableContainer {
            padding: 15px;
        }
        #slAnimeTitleSelect {
            color: black;
            font-weight: normal;
            width: 75%;
            margin-top: 5px;
            border: 1px;
            margin-right: 1px;
        }
        #listWindowOptions {
            border-bottom: 1px solid #6d6d6d;
        }
        #slListSettings {
            padding-left: 10px;
            padding-top: 5px;
        }
        #slAnimeTitleSettings {
            text-align: center;
            font-weight: bold;
        }
        .slTableSettingsContainer {
            padding-left: 10px;
            width: 33%;
            float: left;
        }
        .slGuessTimeSettingsContainer {
            padding-left: 10px;
            width: 33%;
            float: left;
        }
        .songListOptionsButton {
            float: right;
            margin-top: 15px;
            margin-right: 10px;
            padding: 6px 8px;
        }
        .slListDisplaySettings {
            width: 33%;
            float: left;
        }
        #slAnimeTitleSettings {
            width: 33%;
            float: left;
        }
        #slListStyleSelect {
            width: 75%;
            margin-top: 5px;
            color: black;
            border: 1px;
            margin-right: 1px;
        }
        #slListStyleSettings {
            width: 33%;
            float: left;
            text-align: center;
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
        .standard .songData {
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
        .standard .songNumber {
            min-width: 60px;
        }
        .standard .songName {
            min-width: 85px;
        }
        .standard .songType {
            min-width: 80px;
        }
        .standard .annId {
            min-width: 60px;
        }
        .standard .guessesCounter {
            min-width: 80px;
        }
        .standard .samplePoint {
            min-width: 75px;
        }
        .standard .header {
            height: 30px;
        }
        .compact .header {
            height: 20px;
        }
        .compact .songData {
            height: 20px;
        }
        .compact .songData > td {
            vertical-align: middle;
            border: 1px solid black;
            text-align: center;
            text-overflow: ellipsis;
            overflow: hidden;
            padding: 0px 5px;
            white-space: nowrap;
            font-size: 14px;
            line-height: 1;
        }
        .compact .songNumber {
            max-width: 35px;
        }
        .compact .songName {
            max-width: 85px;
        }
        .compact .songArtist {
            max-width: 85px;
        }
        .compact .animeNameEnglish {
            max-width: 85px;
        }
        .compact .animeNameRomaji {
            max-width: 85px;
        }
        .compact .annId {
            max-width: 65px;
        }
        .compact .songType {
            max-width: 85px;
        }
        .compact .selfAnswer {
            max-width: 85px;
        }
        .compact .guessesCounter {
            max-width: 75px;
        }
        .compact .samplePoint {
            max-width: 80px;
        }
        .header > td {
            border: 1px solid black;
            text-align: center;
            vertical-align: middle;
        }
        .compact .header > td {
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
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
        #altTitlesContainer {
            width: 78%;
            overflow-wrap: break-word;
        }
        #difficultyContainer {
            width: 18%;
        }
        #urlContainer {
            width: 100%;
        }
        #annIdContainer {
            width: 100%;
        }
        #animeInfoLinksContainer {
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
    `);

    // Open the song list with pause/break key
    $(document.documentElement).keydown(function (event) {
        if (event.which === 19) {
            if (listWindow.isVisible()) {
                $(".rowSelected").removeClass("rowSelected");
                listWindow.close();
                infoWindow.close();
                settingsWindow.close();
            }
            else {
                listWindow.open();
                autoScrollList();
            }
        }
    });
}
