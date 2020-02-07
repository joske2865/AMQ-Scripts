// ==UserScript==
// @name         AMQ Song List UI
// @namespace    http://tampermonkey.net/
// @version      1.5.1
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
        .css("z-index", "1060")
        .css("overflow-y", "hidden")
        .css("width", "640px")
        .css("height", "480px")
        .css("position", "absolute")
        .css("top", "0px")
        .css("left", "0px")
        .css("overflow-y", "initial !important")
        .css("margin", "0px")
        .css("background-color", "#424242")
        .css("border", "1px solid rgba(27, 27, 27, 0.2)")
        .css("box-shadow", "0 5px 15px rgba(0,0,0,.5)")
        .css("user-select", "text")
        .css("display", "none");

    // create list header
    listWindowHeader = $("<div></div>")
        .attr("class", "modal-header")
        .attr("id", "listWindowHeader")
        .css("width", "100%")
        .css("cursor", "move")
        .append($("<h2></h2>")
            .attr("class", "modal-title")
            .text("Song List")
        )

    // create the options tab
    listWindowOptions = $("<div></div>")
        .attr("class", "songListOptions")
        .css("width", "100%")
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
        .css("overflow-y", "auto")
        .css("height", "340px")
        .css("width", "100%");

    listWindowContent = $("<div></div>")
        .attr("id", "listWindowContent")
        .css("width", "100%")
        .css("position", "absolute")
        .css("top", "0px");

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
        .hide();
    let animeRomajiCol = $("<td></td>")
        .attr("class", "animeNameRomaji")
        .html("<b>Anime</b>");
    let typeCol = $("<td></td>")
        .attr("class", "songType")
        .html("<b>Type</b>");
    header.append(numberCol);
    header.append(nameCol);
    header.append(artistCol);
    header.append(animeEngCol);
    header.append(animeRomajiCol);
    header.append(typeCol);
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

    // add a slight green or red tint for correct or incorrect answers
    if (newSong.correct === true) {
        newRow.css("background", "rgba(0, 200, 0, 0.07)");
    }
    if (newSong.correct === false) {
        newRow.css("background", "rgba(255, 0, 0, 0.07)");
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

    if ($("#slAnimeTitleSelect").val() === "english") {
        animeRomaji.hide();
    }
    if ($("#slAnimeTitleSelect").val() === "romaji") {
        animeEng.hide();
    }
    newRow.append(songNumber);
    newRow.append(songName);
    newRow.append(artist);
    newRow.append(animeEng);
    newRow.append(animeRomaji);
    newRow.append(type);
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
        .css("z-index", "1065")
        .css("overflow-y", "hidden")
        .css("width", "720px")
        .css("height", "480px")
        .css("position", "absolute")
        .css("top", "0px")
        .css("left", "0px")
        .css("overflow-y", "initial !important")
        .css("margin", "0px")
        .css("background-color", "#424242")
        .css("border", "1px solid rgba(27, 27, 27, 0.2)")
        .css("box-shadow", "0 5px 15px rgba(0,0,0,.5)")
        .css("user-select", "text")
        .css("display", "none");

    // create info header
    infoWindowHeader = $("<div></div>")
        .attr("class", "modal-header")
        .attr("id", "infoWindowHeader")
        .css("width", "100%")
        .css("cursor", "move")
        .append($("<h2></h2>")
            .attr("class", "modal-title")
            .text("Song Info")
        )

    // create info body
    infoWindowBody = $("<div></div>")
        .attr("class", "modal-body resizableInfo")
        .attr("id", "infoWindowBody")
        .css("overflow-y", "auto")
        .css("height", "405px")
        .css("width", "100%");

    // create info content
    infoWindowContent = $("<div></div>")
        .attr("id", "infoWindowContent")
        .css("width", "100%")
        .css("position", "absolute")
        .css("top", "0px");

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
    let startPoint = Math.floor(song.startSample / 60) + ":" + (song.startSample % 60 < 10 ? "0" + (song.startSample % 60) : song.startSample % 60);
    let videoLength = Math.round(song.videoLength);
    let totalLength = Math.floor(videoLength / 60) + ":" + (videoLength % 60 < 10 ? "0" + (videoLength % 60) : videoLength % 60);
    let songNameContainer = $("<div></div>")
        .attr("id", "songNameContainer")
        .attr("class", "topRow")
        .html("<h5><b>Song Name</b></h5><p>" + song.name + "</p>");
    let artistContainer = $("<div></div>")
        .attr("id", "artistContainer")
        .attr("class", "topRow")
        .html("<h5><b>Artist</b></h5><p>" + song.artist + "</p>");
    let animeContainer = $("<div></div>")
        .attr("id", "animeContainer")
        .attr("class", "topRow")
        .html("<h5><b>Anime</b></h5><p><b>English: </b>" + song.anime.english + "<br><b>Romaji: </b>" + song.anime.romaji + "</p>");
    let typeContainer = $("<div></div>")
        .attr("id", "typeContainer")
        .attr("class", "topRow")
        .html("<h5><b>Type</b></h5><p>" + song.type + "</p>");
    let sampleContainer = $("<div></div>")
        .attr("id", "sampleContainer")
        .attr("class", "topRow")
        .html("<h5><b>Sample Point</b></h5><p>" + startPoint + "/" + totalLength + "</p>");
    let guessedContainer = $("<div></div>")
        .attr("id", "guessedContainer")
        .attr("class", "bottomRow")
        .html("<h5><b>Guessed (" + song.guessed.length + "/" + song.totalPlayers + ")</b></h5>");
    let fromListContainer = $("<div></div>")
        .attr("id", "fromListContainer")
        .attr("class", "bottomRow")
        .html("<h5><b>From Lists (" + song.fromList.length + "/" + song.totalPlayers + ")</b></h5>");
    let urlContainer = $("<div></div>")
        .attr("id", "urlContainer")
        .attr("class", "bottomRow")
        .html("<h5><b>URLs</b></h5>");

    let topRow = $("<div></div>")
        .attr("class", "row")
        .append(songNameContainer)
        .append(artistContainer)
        .append(animeContainer)
        .append(typeContainer)
        .append(sampleContainer);

    let bottomRow = $("<div></div>")
        .attr("class", "row")
        .append(guessedContainer)
        .append(fromListContainer)
        .append(urlContainer);
    let listContainer = $("<ul></ul>");
    for (let guessed of song.guessed) {
        listContainer.append($("<li></li>")
            .text(guessed)
        );
    }
    guessedContainer.append(listContainer);

    listContainer = $("<ul></ul>");
    for (let fromList of song.fromList) {
        listContainer.append($("<li></li>")
            .text(fromList)
        );
    }
    fromListContainer.append(listContainer);

    listContainer = $("<ul></ul>");
    for (let host in song.urls) {
        for (let resolution in song.urls[host]) {
            let url = song.urls[host][resolution];
            let innerHTML = "";
            innerHTML += (host === "catbox" ? "Catbox " : (host === "animethemes" ? "AnimeThemes " : "OpeningsMoe "));
            innerHTML += (resolution === "0") ? "MP3: " : (resolution === "480") ? "480p: " : (resolution === "720") ? "720p: " : "1080p: ";
            innerHTML += "<a href=\"" + url + "\" target=\"_blank\">" + url + "</a>";
            listContainer.append($("<li></li>")
                .html(innerHTML)
            );
        }
    }
    urlContainer.append(listContainer);

    infoWindowBody.append(topRow);
    infoWindowBody.append(bottomRow);
}

function clearInfo() {
    infoWindowBody.children().remove();
}

function createsettingsWindow() {
    // create info window
    settingsWindow = $("<div></div>")
        .attr("id", "settingsWindow")
        .css("z-index", "1070")
        .css("overflow-y", "hidden")
        .css("width", "300px")
        .css("height", "200px")
        .css("position", "absolute")
        .css("top", "0px")
        .css("left", "0px")
        .css("overflow-y", "initial !important")
        .css("margin", "0px")
        .css("background-color", "#424242")
        .css("border", "1px solid rgba(27, 27, 27, 0.2)")
        .css("box-shadow", "0 5px 15px rgba(0,0,0,.5)")
        .css("user-select", "text")
        .css("display", "none");

    // create options header
    settingsWindowHeader = $("<div></div>")
        .attr("class", "modal-header")
        .attr("id", "settingsWindowHeader")
        .css("width", "100%")
        .css("cursor", "move")
        .append($("<h2></h2>")
            .attr("class", "modal-title")
            .text("Settings")
        );

    // create options body
    settingsWindowBody = $("<div></div>")
        .attr("class", "modal-body")
        .attr("id", "settingsWindowBody")
        .css("overflow-y", "auto")
        .css("height", "125px")
        .css("width", "100%")
        .append($("<div></div>")
            .attr("id", "slListSettings")
            .text("List Settings")
            .append($("<div></div>")
                .attr("class", "slCheckbox")
                .append($("<div></div>")
                    .attr("class", "customCheckbox")
                    .append($("<input id='slAutoClear' type='checkbox'>")
                        .prop("checked", true)
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
                    if ($(this).val() === "romaji") {
                        $(".animeNameRomaji").show();
                        $(".animeNameEnglish").hide();
                    }
                    if ($(this).val() === "english") {
                        $(".animeNameRomaji").hide();
                        $(".animeNameEnglish").show();
                    }
                })
            )
        )

    // create options content
    settingsWindowContent = $("<div></div>")
        .attr("id", "settingsWindowContent")
        .css("width", "100%")
        .css("position", "absolute")
        .css("top", "0px");

    // create options window close button
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
    let listStatus = {
        1: "Watching",
        2: "Completed",
        3: "On Hold",
        4: "Dropped",
        5: "Planning",
        6: "Looted"
    };
    let newSong = {
        name: result.songInfo.songName,
        artist: result.songInfo.artist,
        anime: result.songInfo.animeNames,
        songNumber: parseInt($("#qpCurrentSongCount").text()),
        totalPlayers: Object.values(quiz.players).filter(player => player.avatarSlot._disabled === false).length,
        type: result.songInfo.type === 3 ? "Insert Song" : (result.songInfo.type === 2 ? "Ending " + result.songInfo.typeNumber : "Opening " + result.songInfo.typeNumber),
        urls: result.songInfo.urlMap,
        startSample: quizVideoController.moePlayers[quizVideoController.currentMoePlayerId].startPoint,
        videoLength: parseFloat(quizVideoController.moePlayers[quizVideoController.currentMoePlayerId].$player.find("video")[0].duration.toFixed(2)),
        guessed: Object.values(result.players).filter((tmpPlayer) => tmpPlayer.correct === true).map((tmpPlayer) => quiz.players[tmpPlayer.gamePlayerId]._name),
        fromList: Object.values(result.players).filter((tmpPlayer) => tmpPlayer.listStatus !== undefined && tmpPlayer.listStatus !== false && tmpPlayer.listStatus !== 0)
                                               .map((tmpPlayer) => quiz.players[tmpPlayer.gamePlayerId]._name + " (" + listStatus[tmpPlayer.listStatus] +
                                                   ((tmpPlayer.showScore !== 0 && tmpPlayer.showScore !== null) ? (", " + tmpPlayer.showScore + ")") : ")" ))
    };
    let newSongJSON = {
        songNumber: newSong.songNumber,
        animeEnglish: newSong.anime.english,
        animeRomaji: newSong.anime.romaji,
        songName: newSong.name,
        artist: newSong.artist,
        type: newSong.type,
        correctCount: newSong.guessed.length,
        totalPlayers: newSong.totalPlayers,
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

// triggers when loading rooms in the lobby, but this is to detect when a player leaves the lobby to reset the song list table
let quizLeaveListener = new Listener("New Rooms", (rooms) => {
    if ($("#slAutoClear").prop("checked")) {
        createNewTable();
    }
});

quizReadyListener.bindListener();
answerResultsListener.bindListener();
quizOverListener.bindListener();
quizLeaveListener.bindListener();

createListWindow();
createInfoWindow();
createsettingsWindow();

// Code for resizing the modal windows, this is horrible, don't look at it, don't touch it, don't question how it works
let listResizers = $(".listResizers");
let infoResizers = $(".infoResizers");
const MIN_LIST_WIDTH = 580;
const MIN_LIST_HEIGHT = 350;
const MIN_INFO_WIDTH = 450;
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
                if (newWidth > MIN_LIST_WIDTH) {
                    infoWindow.width(newWidth);
                }
                if (newHeight > MIN_LIST_HEIGHT) {
                    infoWindowBody.height(newHeight-103);
                    infoWindow.height(newHeight);
                }
            }
            if (curResizer.hasClass("bottom-left")) {
                let newWidth = startWidth - (event.originalEvent.clientX - startMouseX);
                let newHeight = startHeight + (event.originalEvent.clientY - startMouseY);
                let newLeft = startX + (event.originalEvent.clientX - startMouseX);
                if (newWidth > MIN_LIST_WIDTH) {
                    infoWindow.width(newWidth);
                    infoWindow.css("left", newLeft + "px");
                }
                if (newHeight > MIN_LIST_HEIGHT) {
                    infoWindowBody.height(newHeight-103);
                    infoWindow.height(newHeight);
                }
            }
            if (curResizer.hasClass("top-right")) {
                let newWidth = startWidth + (event.originalEvent.clientX - startMouseX);
                let newHeight = startHeight - (event.originalEvent.clientY - startMouseY);
                let newTop = startY + (event.originalEvent.clientY - startMouseY);
                if (newWidth > MIN_LIST_WIDTH) {
                    infoWindow.width(newWidth);
                }
                if (newHeight > MIN_LIST_HEIGHT) {
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
                if (newWidth > MIN_LIST_WIDTH) {
                    infoWindow.width(newWidth);
                    infoWindow.css("left", newLeft + "px");
                }
                if (newHeight > MIN_LIST_HEIGHT) {
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
    if ($("#slAutoScroll").prop("checked")) {
        $("#listWindowBody").scrollTop($("#listWindowBody").get(0).scrollHeight);
    }
});

// CSS
GM_addStyle(`
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
.songData {
    height: 50px;
}
.songData > td {
    vertical-align: middle;
    border: 1px solid black;
    text-align: center;
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
.header {
    height: 30px;
}
.header > td {
    border: 1px solid black;
    text-align: center;
    vertical-align: middle;
}
.topRow {
    width: 18%;
    float: inline-start;
    margin: 1%;
    min-width: 125px;
    text-align: center;
    height: 200px;
}
#guessedContainer {
    width: 20%;
    float: inline-start;
    min-width: 130px;
    margin: 1%;
    text-align: center;
}
#fromListContainer {
    width: 30%;
    float: inline-start;
    min-width: 150px;
    margin: 1%;
    text-align: center;
}
#urlContainer {
    width: 44%;
    float: inline-start;
    margin: 1%;
    text-align: center;
    min-width: 350px;
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