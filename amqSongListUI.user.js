// ==UserScript==
// @name         AMQ Song List UI
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Adds a song list modal window, accessible with a button below song info while in quiz, each song in the list is clickable for extra information
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://gist.githubusercontent.com/arantius/3123124/raw/grant-none-shim.js

// ==/UserScript==

if (!window.setupDocumentDone) return;

let titlePreference = 1; // 0 for English anime names, 1 for Romaji anime names

let modalHistory;
let modalInfo;
let modalHistoryDialog;
let modalInfoDialog;
let modalHistoryContent;
let modalInfoContent;
let modalHistoryHeader;
let modalInfoHeader;
let modalHistoryBody;
let modalInfoBody;
let closeButtonHistory;
let closeButtonInfo;
let modalHistoryTitle;
let modalInfoTitle;
let historyButton;
let historyTable;
let songs = [];
let lastRoundSongs = [];
let player = {
    name: "N/A",
    isPlayer: false,
    id: 0
};


function createHistoryWindow() {
    // create modal window
    modalHistory = $("<div></div>")
        .attr("id", "songResultModal")
        .attr("class", "modal fade")
        .attr("tabindex", "-1")
        .attr("role", "dialog")

    // create modal dialog
    modalHistoryDialog = $("<div></div>")
        .attr("class", "modal-dialog")
        .attr("role", "document")
        .css("width", "640px")
        .css("position", "absolute")
        .css("overflow-y", "initial !important")
        .css("margin", "0px");

    // create modal content
    modalHistoryContent = $("<div></div>")
        .attr("class", "modal-content");

    // create modal header
    modalHistoryHeader = $("<div></div>")
        .attr("class", "modal-header")
        .attr("id", "modalHistoryHeader");

    // create modal body
    modalHistoryBody = $("<div></div>")
        .attr("class", "modal-body resizableList")
        .css("overflow-y", "auto")
        .css("height", "480px");

    // create close button
    closeButtonHistory = $("<div></div>")
        .attr("class", "close")
        .attr("type", "button")
        .attr("data-dismiss", "modal")
        .attr("aria-label", "Close")
        .html("<span aria-hidden=\"true\">×</span>");

    // create modal window title
    modalHistoryTitle = $("<h2></h2>")
        .attr("class", "modal-title")
        .text("Song List");

    // link nodes
    modalHistoryHeader.append(closeButtonHistory);
    modalHistoryHeader.append(modalHistoryTitle);
    modalHistoryContent.append(modalHistoryHeader);
    modalHistoryContent.append(modalHistoryBody);
    modalHistoryDialog.append(modalHistoryContent);
    modalHistory.append(modalHistoryDialog);
    $("#gameContainer").append(modalHistory);

    // button to access the song results
    historyButton = $("<div></div>")
        .attr("id", "qpResultsButton")
        .attr("class", "button floatingContainer")
        .attr("data-toggle", "modal")
        .attr("data-target", "#songResultModal")
        .html("<h1>Song List</h1>");

    $("#qpInfoHider").parent().parent().append(historyButton);

    // create results table
    historyTable = $("<table></table>")
        .attr("id", "resultsTable")
        .attr("class", "table floatingContainer");
    modalHistoryBody.append(historyTable);
    modalHistoryDialog.append($("<div></div>")
        .attr("class", "resizerList bottom-right")
        .css("width", "10px")
        .css("height", "10px")
        .css("background-color", "rgba(0, 0, 0, 0)")
        .css("position", "absolute")
        .css("right", "-5px")
        .css("bottom", "-5px")
        .css("cursor", "se-resize")
    );
    modalHistoryDialog.append($("<div></div>")
        .attr("class", "resizerList bottom-left")
        .css("width", "10px")
        .css("height", "10px")
        .css("background-color", "rgba(0, 0, 0, 0)")
        .css("position", "absolute")
        .css("right", "calc(100% - 5px)")
        .css("bottom", "-5px")
        .css("cursor", "ne-resize")
    );
    modalHistoryDialog.append($("<div></div>")
        .attr("class", "resizerList top-right")
        .css("width", "10px")
        .css("height", "10px")
        .css("background-color", "rgba(0, 0, 0, 0)")
        .css("position", "absolute")
        .css("right", "-5px")
        .css("bottom", "calc(100% - 5px)")
        .css("cursor", "ne-resize")
    );
    modalHistoryDialog.append($("<div></div>")
        .attr("class", "resizerList top-left")
        .css("width", "10px")
        .css("height", "10px")
        .css("background-color", "rgba(0, 0, 0, 0)")
        .css("position", "absolute")
        .css("right", "calc(100% - 5px)")
        .css("bottom", "calc(100% - 5px)")
        .css("cursor", "se-resize")
    );
    addTableHeader();
}

function createNewTable() {
    songs = [];
    clearTable();
    addTableHeader();
}

function clearTable() {
    historyTable.children().remove();
}

function addTableHeader() {
    let header = $("<tr></tr>")
        .attr("class", "header")
    let numberCol = $("<td></td>")
        .html("<b>Number</b>");
    let nameCol = $("<td></td>")
        .html("<b>Song Name</b>");
    let artistCol = $("<td></td>")
        .html("<b>Artist</b>");
    let animeCol = $("<td></td>")
        .html("<b>Anime</b>");
    let typeCol = $("<td></td>")
        .html("<b>Type</b>");
    header.append(numberCol);
    header.append(nameCol);
    header.append(artistCol);
    header.append(animeCol);
    header.append(typeCol);
    historyTable.append(header);
}

function addTableEntry(newSong) {
    let newRow = $("<tr></tr>")
        .attr("class", "songData clickAble")
        .attr("data-toggle", "modal")
        .attr("data-target", "#songInfoModal")
        .click(function () {
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
        .text(newSong.songNumber);
    let songName = $("<td></td>")
        .text(newSong.name);
    let artist = $("<td></td>")
        .text(newSong.artist);
    let anime = $("<td></td>")
        .text(newSong.anime);
    let type = $("<td></td>")
        .text(newSong.type);
    newRow.append(songNumber);
    newRow.append(songName);
    newRow.append(artist);
    newRow.append(anime);
    newRow.append(type);
    historyTable.append(newRow);
}

function createInfoWindow() {
    // create modal window
    modalInfo = $("<div></div>")
        .attr("id", "songInfoModal")
        .attr("class", "modal fade")
        .attr("tabindex", "-1")
        .attr("role", "dialog")

    // create modal dialog
    modalInfoDialog = $("<div></div>")
        .attr("class", "modal-dialog")
        .attr("role", "document")
        .css("width", "400px")
        .css("position", "absolute")
        .css("overflow-y", "initial !auto")
        .css("margin", "0px");

    // create modal content
    modalInfoContent = $("<div><div>")
        .attr("class", "modal-content");

    // create modal header
    modalInfoHeader = $("<div></div>")
        .attr("class", "modal-header")
        .attr("id", "modalInfoHeader");

    // create modal body
    modalInfoBody = $("<div></div>")
        .attr("class", "modal-body resizableInfo")
        .css("overflow-y", "auto")
        .css("height", "300px");

    // create close button
    closeButtonInfo = $("<button></button>")
        .attr("class", "close")
        .attr("type", "button")
        .attr("data-dismiss", "modal")
        .attr("aria-label", "Close")
        .html("<span aria-hidden=\"true\">×</span>");

    // create modal window title
    modalInfoTitle = $("<h2></h2>")
        .attr("class", "modal-title")
        .text("Song Info");

    // link nodes
    modalInfoHeader.append(closeButtonInfo);
    modalInfoHeader.append(modalInfoTitle);
    modalInfoContent.append(modalInfoHeader);
    modalInfoContent.append(modalInfoBody);
    modalInfoDialog.append(modalInfoContent);
    modalInfo.append(modalInfoDialog);
    modalInfoDialog.append($("<div></div>")
        .attr("class", "resizerInfo bottom-right")
        .css("width", "10px")
        .css("height", "10px")
        .css("background-color", "rgba(0, 0, 0, 0)")
        .css("position", "absolute")
        .css("right", "-5px")
        .css("bottom", "-5px")
        .css("cursor", "se-resize")
    );
    modalInfoDialog.append($("<div></div>")
        .attr("class", "resizerInfo bottom-left")
        .css("width", "10px")
        .css("height", "10px")
        .css("background-color", "rgba(0, 0, 0, 0)")
        .css("position", "absolute")
        .css("right", "calc(100% - 5px)")
        .css("bottom", "-5px")
        .css("cursor", "ne-resize")
    );
    modalInfoDialog.append($("<div></div>")
        .attr("class", "resizerInfo top-right")
        .css("width", "10px")
        .css("height", "10px")
        .css("background-color", "rgba(0, 0, 0, 0)")
        .css("position", "absolute")
        .css("right", "-5px")
        .css("bottom", "calc(100% - 5px)")
        .css("cursor", "ne-resize")
    );
    modalInfoDialog.append($("<div></div>")
        .attr("class", "resizerInfo top-left")
        .css("width", "10px")
        .css("height", "10px")
        .css("background-color", "rgba(0, 0, 0, 0)")
        .css("position", "absolute")
        .css("right", "calc(100% - 5px)")
        .css("bottom", "calc(100% - 5px)")
        .css("cursor", "se-resize")
    );
    $("#gameContainer").append(modalInfo);
}

function updateInfo(song) {
    clearInfo();
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
        .html("<h5><b>Anime</b></h5><p>" + song.anime + "</p>");
    let typeContainer = $("<div></div>")
        .attr("id", "typeContainer")
        .attr("class", "topRow")
        .html("<h5><b>Type</b></h5><p>" + song.type + "</p>");
    let guessedContainer = $("<div></div>")
        .attr("id", "guessedContainer")
        .attr("class", "bottomRow")
        .html("<h5><b>Guessed (" + song.guessed.length + ")</b></h5>");
    let fromListContainer = $("<div></div>")
        .attr("id", "fromListContainer")
        .attr("class", "bottomRow")
        .html("<h5><b>From Lists (" + song.fromList.length + ")</b></h5>");
    let urlContainer = $("<div></div>")
        .attr("id", "urlContainer")
        .attr("class", "bottomRow")
        .html("<h5><b>URLs</b></h5>");

    let topRow = $("<div></div>")
        .attr("class", "row")
        .append(songNameContainer)
        .append(artistContainer)
        .append(animeContainer)
        .append(typeContainer);

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

    modalInfoBody.append(topRow);
    modalInfoBody.append(bottomRow);
}

function clearInfo() {
    modalInfoBody.children().remove();
}

// get player's id and playing status (player or spectator) at the start of the quiz
let quizReadyListener = new Listener("quiz ready", (data) => {
    // reset song list for the new round
    player.name = selfName;
    player.isPlayer = false;
    player.id = 0;
    let findPlayer = Object.values(quiz.players).find((tmpPlayer) => {
        return tmpPlayer._name === player.name
    });
    if (findPlayer !== undefined) {
        player.isPlayer = true;
        player.id = findPlayer.gamePlayerId;
    }
    else {
        player.isPlayer = false;
    }
    createNewTable();
});

// get song info and info on who guessed the song and from whose lists is it
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
        anime: Object.values(result.songInfo.animeNames)[titlePreference],
        songNumber: parseInt(document.getElementById("qpCurrentSongCount").innerText),
        type: (result.songInfo.type === 1) ? ("Opening " + result.songInfo.typeNumber) :
        ((result.songInfo.type === 2) ? ("Ending " + result.songInfo.typeNumber) : ("Insert Song")),
        urls: result.songInfo.urlMap,
        guessed: Object.values(result.players).filter((tmpPlayer) => tmpPlayer.correct === true).map((tmpPlayer) => quiz.players[tmpPlayer.gamePlayerId]._name),
        fromList: Object.values(result.players).filter((tmpPlayer) => tmpPlayer.listStatus !== undefined && tmpPlayer.listStatus !== false && tmpPlayer.listStatus !== 0)
                                               .map((tmpPlayer) => quiz.players[tmpPlayer.gamePlayerId]._name + " (" + listStatus[tmpPlayer.listStatus] +
                                                   ((tmpPlayer.showScore !== 0 && tmpPlayer.showScore !== null) ? (", " + tmpPlayer.showScore + ")") : ")" ))
    };
    let findPlayer = Object.values(quiz.players).find((tmpPlayer) => {
        return tmpPlayer._name === player.name
    });
    if (findPlayer !== undefined) {
        player.isPlayer = true;
        player.id = findPlayer.gamePlayerId;
    }
    else {
        player.isPlayer = false;
    }
    if (player.isPlayer) {
        let playerIdx = Object.values(result.players).findIndex(tmpPlayer => {
            return player.id === tmpPlayer.gamePlayerId
        });
        newSong.correct = result.players[playerIdx].correct;
    }
    addTableEntry(newSong);
    songs.push(newSong);
});

// reset songs on returning to lobby
let quizOverListener = new Listener("quiz over", (roomSettings) => {
    createNewTable();
});

// triggers when loading rooms in the lobby, but this is to detect when a player leaves the lobby to reset the song list table
let quizLeaveListener = new Listener("New Rooms", (rooms) => {
    createNewTable();
});

quizReadyListener.bindListener();
answerResultsListener.bindListener();
quizOverListener.bindListener();
quizLeaveListener.bindListener();

createHistoryWindow();
createInfoWindow();

// Code for resizing the modal windows, this is horrible, don't look at it, don't touch it, don't question how it works
let resizableList = $(".resizableList");
let resizerList = $(".resizerList");

resizerList.mousedown(function (event) {
    modalHistory.css("user-select", "none");
    let startX = event.originalEvent.clientX;
    let startY = event.originalEvent.clientY;
    let startWidth = resizableList.width();
    let startHeight = resizableList.height();
    let newWidth = startWidth;
    let newHeight = startHeight;
    let newLeft = startX;
    let newTop = startY;
    if ($(this).hasClass("bottom-right")) {
        $(document.documentElement).mousemove(function (event) {
            newWidth = startWidth + event.originalEvent.clientX - startX;
            if (newWidth < 400) {
                newWidth = 400;
            }
            resizableList.width(newWidth);
            modalHistoryContent.width(newWidth+30);
            modalHistoryDialog.width(newWidth+32);
            newHeight = startHeight + event.originalEvent.clientY - startY;
            if (newHeight < 300) {
                newHeight = 300;
            }
            resizableList.height(newHeight);
        });
    }
    if ($(this).hasClass("bottom-left")) {
        $(document.documentElement).mousemove(function (event) {
            newWidth = startWidth - event.originalEvent.clientX + startX;
            newLeft = event.originalEvent.clientX;
            if (newWidth < 400) {
                newWidth = 400;
                newLeft = startWidth - newWidth + startX;
            }
            modalHistoryDialog.css("left", newLeft + "px");
            resizableList.width(newWidth);
            modalHistoryContent.width(newWidth+30);
            modalHistoryDialog.width(newWidth+32);
            newHeight = startHeight + event.originalEvent.clientY - startY;
            if (newHeight < 300) {
                newHeight = 300;
            }
            resizableList.height(newHeight);
        });
    }
    if ($(this).hasClass("top-right")) {
        $(document.documentElement).mousemove(function (event) {
            newWidth = startWidth + event.originalEvent.clientX - startX;
            if (newWidth < 400) {
                newWidth = 400;
            }
            resizableList.width(newWidth);
            modalHistoryContent.width(newWidth+30);
            modalHistoryDialog.width(newWidth+32);
            newHeight = startHeight - event.originalEvent.clientY + startY;
            newTop = event.originalEvent.clientY - 32;
            if (newHeight < 300) {
                newHeight = 300;
                newTop = startHeight - newHeight + startY;
            }
            modalHistoryDialog.css("top", newTop + "px");
            resizableList.height(newHeight);
        });
    }
    if ($(this).hasClass("top-left")) {
        $(document.documentElement).mousemove(function (event) {
            newWidth = startWidth - event.originalEvent.clientX + startX;
            newLeft = event.originalEvent.clientX;
            if (newWidth < 400) {
                newWidth = 400;
                newLeft = startWidth - newWidth + startX;
            }
            modalHistoryDialog.css("left", newLeft + "px");
            resizableList.width(newWidth);
            modalHistoryContent.width(newWidth+30);
            modalHistoryDialog.width(newWidth+32);
            newHeight = startHeight - event.originalEvent.clientY + startY;
            newTop = event.originalEvent.clientY - 32;
            if (newHeight < 300) {
                newHeight = 300;
                newTop = startHeight - newHeight + startY;
            }
            modalHistoryDialog.css("top", newTop + "px");
            resizableList.height(newHeight);
        });
    }
    $(document.documentElement).mouseup(function (event) {
        $(document.documentElement).off("mousemove");
        $(document.documentElement).off("mouseup");
        modalInfo.css("user-select", "text");
    });
});

let resizableInfo = $(".resizableInfo");
let resizerInfo = $(".resizerInfo");

resizerInfo.mousedown(function (event) {
    modalInfo.css("user-select", "none");
    let startX = event.originalEvent.clientX;
    let startY = event.originalEvent.clientY;
    let startWidth = resizableInfo.width();
    let startHeight = resizableInfo.height();
    let newWidth = startWidth;
    let newHeight = startHeight;
    let newLeft = startX;
    let newTop = startY;
    if ($(this).hasClass("bottom-right")) {
        $(document.documentElement).mousemove(function (event) {
            newWidth = startWidth + event.originalEvent.clientX - startX;
            if (newWidth < 400) {
                newWidth = 400;
            }
            resizableInfo.width(newWidth);
            modalInfoContent.width(newWidth+30);
            modalInfoDialog.width(newWidth+32);
            newHeight = startHeight + event.originalEvent.clientY - startY;
            if (newHeight < 300) {
                newHeight = 300;
            }
            resizableInfo.height(newHeight);
        });
    }
    if ($(this).hasClass("bottom-left")) {
        $(document.documentElement).mousemove(function (event) {
            newWidth = startWidth - event.originalEvent.clientX + startX;
            newLeft = event.originalEvent.clientX;
            if (newWidth < 400) {
                newWidth = 400;
                newLeft = startWidth - newWidth + startX;
            }
            modalInfoDialog.css("left", newLeft + "px");
            resizableInfo.width(newWidth);
            modalInfoContent.width(newWidth+30);
            modalInfoDialog.width(newWidth+32);
            newHeight = startHeight + event.originalEvent.clientY - startY;
            if (newHeight < 300) {
                newHeight = 300;
            }
            resizableInfo.height(newHeight);
        });
    }
    if ($(this).hasClass("top-right")) {
        $(document.documentElement).mousemove(function (event) {
            newWidth = startWidth + event.originalEvent.clientX - startX;
            if (newWidth < 300) {
                newWidth = 300;
            }
            resizableInfo.width(newWidth);
            modalInfoContent.width(newWidth+30);
            modalInfoDialog.width(newWidth+32);
            newHeight = startHeight - event.originalEvent.clientY + startY;
            newTop = event.originalEvent.clientY - 32;
            if (newHeight < 200) {
                newHeight = 200;
                newTop = startHeight - newHeight + startY;
            }
            modalInfoDialog.css("top", newTop + "px");
            resizableInfo.height(newHeight);
        });
    }
    if ($(this).hasClass("top-left")) {
        $(document.documentElement).mousemove(function (event) {
            newWidth = startWidth - event.originalEvent.clientX + startX;
            newLeft = event.originalEvent.clientX;
            if (newWidth < 300) {
                newWidth = 300;
                newLeft = startWidth - newWidth + startX;
            }
            modalInfoDialog.css("left", newLeft + "px");
            resizableInfo.width(newWidth);
            modalInfoContent.width(newWidth+30);
            modalInfoDialog.width(newWidth+32);
            newHeight = startHeight - event.originalEvent.clientY + startY;
            newTop = event.originalEvent.clientY - 32;
            if (newHeight < 200) {
                newHeight = 200;
                newTop = startHeight - newHeight + startY;
            }
            modalInfoDialog.css("top", newTop + "px");
            resizableInfo.height(newHeight);
        });
    }
    $(document.documentElement).mouseup(function (event) {
        $(document.documentElement).off("mousemove");
        $(document.documentElement).off("mouseup");
        modalInfo.css("user-select", "text");
    });
});

//
$("#songResultModal").find(".modal-dialog").draggable({
    handle: "#modalHistoryHeader",
    containment: "#gameContainer"
});

$("#songInfoModal").find(".modal-dialog").draggable({
    handle: "#modalInfoHeader",
    containment: "#gameContainer"
});

// CSS
GM_addStyle(`
.songData {
    height: 50px;
}
.songData > td {
    vertical-align: middle;
    border: 1px solid black;
    text-align: center;
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
    width: 23%;
    float: inline-start;
    margin: 1%;
    min-width: 140px;
    text-align: center;
    height: 200px;
}
#guessedContainer {
    width: 16%;
    float: inline-start;
    min-width: 110px;
    margin: 1%;
    text-align: center;
}
#fromListContainer {
    width: 25%;
    float: inline-start;
    min-width: 130px;
    margin: 1%;
    text-align: center;
}
#urlContainer {
    width: 50%;
    float: inline-start;
    margin: 1%;
    text-align: center;
}
#qpResultsButton {
    width: 240px;
    margin: auto;
    margin-bottom: 10px;
    margin-top: -5px;
}
#qpResultsButton > h1 {
    padding: 5px;
}
`);