// ==UserScript==
// @name         AMQ Song List UI
// @namespace    http://tampermonkey.net/
// @version      1.7.1
// @description  Adds a song list window, accessible with a button below song info while in quiz, each song in the list is clickable for extra information
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://gist.githubusercontent.com/arantius/3123124/raw/grant-none-shim.js

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

let songListJSON = [];

function createListWindow() {
    // create list window
    listWindow = $("<div></div>")
        .attr("id", "listWindow")
        .addClass("slWindow")
        .css("position", "absolute")
        .css("z-index", "1060")
        .css("width", "640px")
        .css("height", "480px")
        .css("display", "none");

    // create list header
    listWindowHeader = $("<div></div>")
        .addClass("modal-header")
        .attr("id", "listWindowHeader")
        .append($("<h2></h2>")
            .attr("class", "modal-title")
            .text("Song List")
        )

    // create the options tab
    listWindowOptions = $("<div></div>")
        .addClass("slWindowOptions")
        .attr("id", "listWindowOptions")
        .append($("<textarea></textarea>")
            .attr("id", "copyBoxJSON")
            .css("position", "absolute")
            .css("top", "9999px")
        )
        .append($("<button></button>")
            .attr("id", "slCopyJSON")
            .attr("class", "btn btn-primary songListOptionsButton")
            .attr("type", "button")
            .text("Copy JSON")
            .click(() => {
                $("#copyBoxJSON").val(JSON.stringify(songListJSON, null, 4)).select();
                document.execCommand("copy");
                $("#copyBoxJSON").val("").blur()
            })
        )
        .append($("<button></button>")
            .attr("class", "btn btn-default songListOptionsButton")
            .attr("type", "button")
            .text("Clear List")
            .click(() => {
                createNewTable();
            })
        )
        .append($("<button></button>")
            .attr("class", "btn btn-default songListOptionsButton")
            .attr("type", "button")
            .text("New Tab")
            .click(() => {
                openInNewTab();
            })
        )
        .append($("<button></button>")
            .attr("class", "btn btn-default songListOptionsButton")
            .attr("type", "button")
            .text("Settings")
            .click(() => {
                if (settingsWindow.is(":visible")) {
                    settingsWindow.hide()
                }
                else {
                    settingsWindow.show();
                }
            })
        )
        .append($("<input>")
            .attr("id", "slSearch")
            .attr("type", "text")
            .attr("placeholder", "Search songs")
            .on("input", function (event) {
                let searchQuery = $(this).val();
                let regexQuery = createAnimeSearchRegexQuery(searchQuery);
                let searchRegex = new RegExp(regexQuery, "i");
                $("tr.songData").each((index, elem) => {
                    applyRegex(elem, searchRegex);
                });
            })
            .click(() => {
                quiz.setInputInFocus(false);
            })
        )

    // create list body
    listWindowBody = $("<div></div>")
        .attr("class", "modal-body resizableList")
        .attr("id", "listWindowBody")
        .addClass("slWindowBody")
        .css("height", "340px");

    listWindowContent = $("<div></div>")
        .attr("id", "listWindowContent")
        .addClass("slWindowContent");

    // create close button
    listWindowCloseButton = $("<div></div>")
        .attr("class", "close")
        .attr("type", "button")
        .html("<span aria-hidden=\"true\">×</span>")
        .click(() => {
            listWindow.hide();
            infoWindow.hide();
            settingsWindow.hide();
        });

    listWindowResizer = $("<div></div>")
        .attr("class", "listResizers")
        .append($("<div></div>")
            .attr("class", "listResizer top-left")
        )
        .append($("<div></div>")
            .attr("class", "listResizer top-right")
        )
        .append($("<div></div>")
            .attr("class", "listResizer bottom-left")
        )
        .append($("<div></div>")
            .attr("class", "listResizer bottom-right")
        );

    // link nodes
    listWindowHeader.prepend(listWindowCloseButton);
    listWindowContent.append(listWindowHeader);
    listWindowContent.append(listWindowOptions);
    listWindowContent.append(listWindowBody);
    listWindow.append(listWindowContent);
    listWindow.prepend(listWindowResizer);
    $("#gameContainer").append(listWindow);

    // create results table
    listWindowTable = $("<table></table>")
        .attr("id", "listWindowTable")
        .attr("class", "table floatingContainer");
    listWindowBody.append(listWindowTable);

    // button to access the song results
    listWindowOpenButton = $("<div></div>")
        .attr("id", "qpSongListButton")
        .attr("class", "button floatingContainer")
        .html("<h1>Song List</h1>")
        .click(() => {
            if(listWindow.is(":visible")) {
                listWindow.hide();
                infoWindow.hide();
                settingsWindow.hide();
            }
            else {
                listWindow.show();
                autoScrollList();
            }
        });

    $("#qpInfoHider").parent().parent().append(listWindowOpenButton);

    addTableHeader();
}

function createNewTable() {
    songListJSON = [];
    clearTable();
    addTableHeader();
}

function clearTable() {
    listWindowTable.children().remove();
}

function addTableHeader() {
    let header = $("<tr></tr>")
        .attr("class", "header")
    let numberCol = $("<td></td>")
        .attr("class", "songNumber")
        .html("<b>Number</b>");
    let nameCol = $("<td></td>")
        .attr("class", "songName")
        .html("<b>Song Name</b>");
    let artistCol = $("<td></td>")
        .attr("class", "songArtist")
        .html("<b>Artist</b>");
    let animeEngCol = $("<td></td>")
        .attr("class", "animeNameEnglish")
        .html("<b>Anime</b>")
    let animeRomajiCol = $("<td></td>")
        .attr("class", "animeNameRomaji")
        .html("<b>Anime</b>");
    let typeCol = $("<td></td>")
        .attr("class", "songType")
        .html("<b>Type</b>");
    let guessesCol = $("<td></td>")
        .attr("class", "guessesCounter")
        .html("<b>Guesses</b>");
    let sampleCol = $("<td></td>")
        .attr("class", "samplePoint")
        .html("<b>Sample</b>");

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
    header.append(guessesCol);
    header.append(sampleCol);
    listWindowTable.append(header);
}

function addTableEntry(newSong) {
    let newRow = $("<tr></tr>")
        .attr("class", "songData clickAble")
        .click(function () {
            if (!infoWindow.is(":visible")) {
                infoWindow.show();
            }
            updateInfo(newSong);
        });

    let guesses = newSong.players.filter((tmpPlayer) => tmpPlayer.correct === true);

    // add a slight green or red tint for correct or incorrect answers
    if (newSong.correct === true) {
        newRow.addClass("correctGuess");
    }
    if (newSong.correct === false) {
        newRow.addClass("incorrectGuess");
    }
    let songNumber = $("<td></td>")
        .attr("class", "songNumber")
        .text(newSong.songNumber);
    let songName = $("<td></td>")
        .attr("class", "songName")
        .text(newSong.name);
    let artist = $("<td></td>")
        .attr("class", "songArtist")
        .text(newSong.artist);
    let animeEng = $("<td></td>")
        .attr("class", "animeNameEnglish")
        .text(newSong.anime.english)
    let animeRomaji = $("<td></td>")
        .attr("class", "animeNameRomaji")
        .text(newSong.anime.romaji);
    let type = $("<td></td>")
        .attr("class", "songType")
        .text(newSong.type);
    let guessesCounter = $("<td></td>")
        .attr("class", "guessesCounter")
        .text(guesses.length + "/" + newSong.activePlayers + " (" + parseFloat((guesses.length/newSong.activePlayers*100).toFixed(2)) + "%)")
    let samplePoint = $("<td></td>")
        .attr("class", "samplePoint")
        .text(formatSamplePoint(newSong.startSample, newSong.videoLength));

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
    newRow.append(guessesCounter);
    newRow.append(samplePoint);
    listWindowTable.append(newRow);
    applyRegex(newRow, new RegExp(createAnimeSearchRegexQuery($("#slSearch").val()), "i"));
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
    infoWindow = $("<div></div>")
        .attr("id", "infoWindow")
        .addClass("slWindow")
        .css("position", "absolute")
        .css("z-index", "1065")
        .css("width", "450px")
        .css("height", "350px")
        .css("display", "none");

    // create info header
    infoWindowHeader = $("<div></div>")
        .addClass("modal-header")
        .attr("id", "infoWindowHeader")
        .append($("<h2></h2>")
            .attr("class", "modal-title")
            .text("Song Info")
        )

    // create info body
    infoWindowBody = $("<div></div>")
        .attr("class", "modal-body resizableInfo")
        .attr("id", "infoWindowBody")
        .addClass("slWindowBody")
        .css("height", "275px");

    // create info content
    infoWindowContent = $("<div></div>")
        .attr("id", "infoWindowContent")
        .addClass("slWindowContent");

    // create info window close button
    infoWindowCloseButton = $("<button></button>")
        .attr("class", "close")
        .attr("type", "button")
        .html("<span aria-hidden=\"true\">×</span>")
        .click(() => {
            infoWindow.hide();
        })

    infoWindowResizer = $("<div></div>")
        .attr("class", "infoResizers")
        .append($("<div></div>")
            .attr("class", "infoResizer top-left")
        )
        .append($("<div></div>")
            .attr("class", "infoResizer top-right")
        )
        .append($("<div></div>")
            .attr("class", "infoResizer bottom-left")
        )
        .append($("<div></div>")
            .attr("class", "infoResizer bottom-right")
        );

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
    let infoRow1 = $("<div></div>")
        .attr("class", "infoRow");
    let infoRow2 = $("<div></div>")
        .attr("class", "infoRow");
    let infoRow3 = $("<div></div>")
        .attr("class", "infoRow");
    let infoRow4 = $("<div></div>")
        .attr("class", "infoRow");
    
    let guesses = song.players.filter((tmpPlayer) => tmpPlayer.correct === true);

    let songNameContainer = $("<div></div>")
        .attr("id", "songNameContainer")
        .html("<h5><b>Song Name</b></h5><p>" + song.name + "</p>");
    let artistContainer = $("<div></div>")
        .attr("id", "artistContainer")
        .html("<h5><b>Artist</b></h5><p>" + song.artist + "</p>");
    let animeEnglishContainer = $("<div></div>")
        .attr("id", "animeEnglishContainer")
        .html("<h5><b>Anime English</b></h5><p>" + song.anime.english + "</p>");
    let animeRomajiContainer = $("<div></div>")
        .attr("id", "animeRomajiContainer")
        .html("<h5><b>Anime Romaji</b></h5><p>" + song.anime.romaji + "</p>");
    let typeContainer = $("<div></div>")
        .attr("id", "typeContainer")
        .html("<h5><b>Type</b></h5><p>" + song.type + "</p>");
    let sampleContainer = $("<div></div>")
        .attr("id", "sampleContainer")
        .html("<h5><b>Sample Point</b></h5><p>" + formatSamplePoint(song.startSample, song.videoLength) + "</p>");
    let guessedContainer = $("<div></div>")
        .attr("id", "guessedContainer")
        .html("<h5><b>Guessed<br>(" + guesses.length + "/" + song.activePlayers + ", " + parseFloat((guesses.length/song.activePlayers*100).toFixed(2)) + "%)</b></h5>");
    let fromListContainer = $("<div></div>")
        .attr("id", "fromListContainer")
        .html("<h5><b>From Lists<br>(" + guesses.length + "/" + song.totalPlayers + ", " + parseFloat((song.fromList.length/song.totalPlayers*100).toFixed(2)) + "%)</b></h5>");
    let urlContainer = $("<div></div>")
        .attr("id", "urlContainer")
        .html("<h5><b>URLs</b></h5>");

    infoRow1.append(songNameContainer);
    infoRow1.append(artistContainer);
    infoRow1.append(typeContainer);

    infoRow2.append(animeEnglishContainer);
    infoRow2.append(animeRomajiContainer);
    infoRow2.append(sampleContainer);

    infoRow3.append(urlContainer);

    infoRow4.append(guessedContainer);
    infoRow4.append(fromListContainer);

    if (song.fromList.length === 0) {
        guessedContainer.css("width", "98%");
        fromListContainer.hide();
        if (guesses.length > 1) {
            let guessedListLeft = $("<ul></ul>")
                .attr("id", "guessedListLeft");
            let guessedListRight = $("<ul></ul>")
                .attr("id", "guessedListRight");
            let i = 0;
            for (let guessed of guesses) {
                if (i++ % 2 === 0) {
                    guessedListLeft.append($("<li></li>")
                        .text(guessed.name + " (" + guessed.score + ")")
                    );
                }
                else {
                    guessedListRight.append($("<li></li>")
                        .text(guessed.name + " (" + guessed.score + ")")
                    );
                }
            }
            guessedContainer.append(guessedListLeft);
            guessedContainer.append(guessedListRight);
        }
        else {
            let listContainer = $("<ul></ul>")
                .attr("id", "guessedListContainer");
            for (let guessed of guesses) {
                listContainer.append($("<li></li>")
                    .text(guessed.name + " (" + guessed.score + ")")
                );
            }
            guessedContainer.append(listContainer);
        }
    }
    else {
        guessedContainer.css("width", "");
        let listContainer = $("<ul></ul>")
            .attr("id", "guessedListContainer");
        fromListContainer.show();
        for (let guessed of guesses) {
            listContainer.append($("<li></li>")
                .text(guessed.name + " (" + guessed.score + ")")
            );
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
        listContainer.append($("<li></li>")
            .text(fromList.name + " (" + listStatus[fromList.listStatus] + ((fromList.score !== null) ? ", " + fromList.score + ")" : ")"))
        );
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
            listContainer.append($("<li></li>")
                .html(innerHTML)
            );
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

function createsettingsWindow() {
    // create settings window
    settingsWindow = $("<div></div>")
        .attr("id", "settingsWindow")
        .addClass("slWindow")
        .css("position", "absolute")
        .css("z-index", "1070")
        .css("width", "300px")
        .css("height", "325px")
        .css("display", "none");

    // create settings header
    settingsWindowHeader = $("<div></div>")
        .addClass("modal-header")
        .attr("id", "settingsWindowHeader")
        .append($("<h2></h2>")
            .attr("class", "modal-title")
            .text("Settings")
        );

    // create settings body
    settingsWindowBody = $("<div></div>")
        .attr("class", "modal-body")
        .attr("id", "settingsWindowBody")
        .addClass("slWindowBody")
        .css("height", "250px")
        .append($("<div></div>")
            .attr("id", "slListSettings")
            .text("List Settings")
            .append($("<div></div>")
                .attr("class", "slCheckbox")
                .append($("<div></div>")
                    .attr("class", "customCheckbox")
                    .append($("<input id='slAutoClear' type='checkbox'>")
                        .prop("checked", false)
                    )
                    .append($("<label for='slAutoClear'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                )
                .append($("<label></label>")
                    .text("Auto clear list")
                    .popover({
                        content: "Automatically clears the list on quiz start, quiz end or when leaving the lobby",
                        placement: "top",
                        trigger: "hover",
                        container: "body",
                        animation: false
                    })
                )
            )
            .append($("<div></div>")
                .attr("class", "slCheckbox")
                .append($("<div></div>")
                    .attr("class", "customCheckbox")
                    .append($("<input id='slAutoScroll' type='checkbox'>")
                        .prop("checked", true)
                    )
                    .append($("<label for='slAutoScroll'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                )
                .append($("<label></label>")
                    .text("Auto scroll")
                    .popover({
                        content: "Automatically scrolls to the bottom of the list on each new entry added",
                        placement: "top",
                        trigger: "hover",
                        container: "body",
                        animation: false
                    })
                )
            )
        )

        .append($("<div></div>")
            .attr("id", "slAnimeTitleSettings")
            .text("Anime Titles")
            .append($("<select></select>")
                .attr("id", "slAnimeTitleSelect")
                .append($("<option></option>")
                    .text("English")
                    .attr("value", "english")
                )
                .append($("<option></option>")
                    .text("Romaji")
                    .attr("value", "romaji")
                    .attr("selected", "selected")
                )
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
                })
            )
        )

        .append($("<div></div>")
            .attr("id", "slTableSettings")
            .append($("<div></div>")
                .text("Table Display Settings")
                .css("width", "100%")
            )
            .append($("<div></div>")
                .attr("class", "slTableSettingsContainer")
                .append($("<div></div>")
                    .attr("class", "slCheckbox")
                    .append($("<div></div>")
                        .attr("class", "customCheckbox")
                        .append($("<input id='slShowSongNumber' type='checkbox'>")
                            .prop("checked", true)
                            .click(function () {
                                if ($(this).prop("checked")) {
                                    $(".songNumber").show();
                                }
                                else {
                                    $(".songNumber").hide();
                                }
                            })
                        )
                        .append($("<label for='slShowSongNumber'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                    )
                    .append($("<label></label>")
                        .text("Song Number")
                    )
                )
                .append($("<div></div>")
                    .attr("class", "slCheckbox")
                    .append($("<div></div>")
                        .attr("class", "customCheckbox")
                        .append($("<input id='slShowSongName' type='checkbox'>")
                            .prop("checked", true)
                            .click(function () {
                                if ($(this).prop("checked")) {
                                    $(".songName").show();
                                }
                                else {
                                    $(".songName").hide();
                                }
                            })
                        )
                        .append($("<label for='slShowSongName'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                    )
                    .append($("<label></label>")
                        .text("Song Name")
                    )
                )
                .append($("<div></div>")
                    .attr("class", "slCheckbox")
                    .append($("<div></div>")
                        .attr("class", "customCheckbox")
                        .append($("<input id='slShowArtist' type='checkbox'>")
                            .prop("checked", true)
                            .click(function () {
                                if ($(this).prop("checked")) {
                                    $(".songArtist").show();
                                }
                                else {
                                    $(".songArtist").hide();
                                }
                            })
                        )
                        .append($("<label for='slShowArtist'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                    )
                    .append($("<label></label>")
                        .text("Artist")
                    )
                )
                .append($("<div></div>")
                    .attr("class", "slCheckbox")
                    .append($("<div></div>")
                        .attr("class", "customCheckbox")
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
                            })
                        )
                        .append($("<label for='slShowAnime'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                    )
                    .append($("<label></label>")
                        .text("Anime")
                    )
                )
            )
            .append($("<div></div>")
                .attr("class", "slTableSettingsContainer")
                .append($("<div></div>")
                    .attr("class", "slCheckbox")
                    .append($("<div></div>")
                        .attr("class", "customCheckbox")
                        .append($("<input id='slShowType' type='checkbox'>")
                            .prop("checked", true)
                            .click(function () {
                                if ($(this).prop("checked")) {
                                    $(".songType").show();
                                }
                                else {
                                    $(".songType").hide();
                                }
                            })
                        )
                        .append($("<label for='slShowType'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                    )
                    .append($("<label></label>")
                        .text("Type")
                    )
                )
                .append($("<div></div>")
                    .attr("class", "slCheckbox")
                    .append($("<div></div>")
                        .attr("class", "customCheckbox")
                        .append($("<input id='slShowGuesses' type='checkbox'>")
                            .prop("checked", false)
                            .click(function () {
                                if ($(this).prop("checked")) {
                                    $(".guessesCounter").show();
                                }
                                else {
                                    $(".guessesCounter").hide();
                                }
                            })
                        )
                        .append($("<label for='slShowGuesses'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                    )
                    .append($("<label></label>")
                        .text("Guesses")
                    )
                )
                .append($("<div></div>")
                    .attr("class", "slCheckbox")
                    .append($("<div></div>")
                        .attr("class", "customCheckbox")
                        .append($("<input id='slShowSamplePoint' type='checkbox'>")
                            .prop("checked", false)
                            .click(function () {
                                if ($(this).prop("checked")) {
                                    $(".samplePoint").show();
                                }
                                else {
                                    $(".samplePoint").hide();
                                }
                            })
                        )
                        .append($("<label for='slShowSamplePoint'><i class='fa fa-check' aria-hidden='true'></i></label>"))
                    )
                    .append($("<label></label>")
                        .text("Sample Point")
                    )
                )
            )
        )

    // create settings content
    settingsWindowContent = $("<div></div>")
        .attr("id", "settingsWindowContent")
        .addClass("slWindowContent");

    // create settings window close button
    settingsWindowCloseButton = $("<button></button>")
        .attr("class", "close")
        .attr("type", "button")
        .html("<span aria-hidden=\"true\">×</span>")
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

// reset song list for the new round
let quizReadyListener = new Listener("quiz ready", (data) => {
    if ($("#slAutoClear").prop("checked")) {
        createNewTable();
    }
});

// get song data on answer reveal
let answerResultsListener = new Listener("answer results", (result) => {
    let newSong = {
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
                    score: (quiz.gameMode === "Standard") ? tmpPlayer.score : tmpPlayer.correctGuesses,
                    correct: tmpPlayer.correct,
                    active: !quiz.players[tmpPlayer.gamePlayerId].avatarSlot._disabled
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
    let newSongJSON = {
        songNumber: newSong.songNumber,
        animeEnglish: newSong.anime.english,
        animeRomaji: newSong.anime.romaji,
        songName: newSong.name,
        artist: newSong.artist,
        type: newSong.type,
        correctCount: newSong.players.filter((tmpPlayer) => tmpPlayer.correct === true).length,
        activePlayers: newSong.activePlayers,
        startSample: newSong.startSample,
        videoLength: newSong.videoLength,
        linkWebm: getVideoURL(newSong.urls),
        linkMP3: getMP3URL(newSong.urls)
    };
    let findPlayer = Object.values(quiz.players).find((tmpPlayer) => {
        return tmpPlayer._name === selfName && tmpPlayer.avatarSlot._disabled === false
    });
    if (findPlayer !== undefined) {
        let playerIdx = Object.values(result.players).findIndex(tmpPlayer => {
            return findPlayer.gamePlayerId === tmpPlayer.gamePlayerId
        });
        newSong.correct = result.players[playerIdx].correct;
    }
    addTableEntry(newSong, newSongJSON);
    songListJSON.push(newSongJSON);
});


// Grab the video and mp3 links
// Host priority: catbox > animethemes > openingsmoe
// Video resolution priority: 720 (or 1080 if it's the only resolution available) > 480
let videoHosts = ["catbox", "animethemes", "openingsmoe"];
let mp3Hosts = ["catbox"];
let videoResolutions = [720, 480];

function getVideoURL(URLMap) {
    for (let host of videoHosts) {
        if (URLMap[host] !== undefined) {
            for (let resolution of videoResolutions) {
                if (URLMap[host][resolution] !== undefined) {
                    return URLMap[host][resolution];
                }
            }
        }
    }
    return null;
}

function getMP3URL(URLMap) {
    for (let host of mp3Hosts) {
        if (URLMap[host] !== undefined) {
            if (URLMap[host][0] !== undefined) {
                return URLMap[host][0];
            }
        }
    }
    return null;
}

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

createsettingsWindow();
createInfoWindow();
createListWindow();

// Code for resizing the windows, this is horrible, don't look at it, don't touch it, don't question how it works
let listResizers = $(".listResizers");
let infoResizers = $(".infoResizers");
const MIN_LIST_WIDTH = 580;
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
        }
        else {
            listWindow.show();
            autoScrollList();
        }
    }
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
#qpSongListButton {
    width: 150px;
    margin: auto;
    margin-bottom: 10px;
    margin-top: -5px;
}
#qpSongListButton > h1 {
    padding: 5px;
    font-size: 28px;
    user-select: none;
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