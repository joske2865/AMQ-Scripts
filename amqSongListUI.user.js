// ==UserScript==
// @name         AMQ Song List UI
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Adds a song list modal window, accessible with a button below song info while in quiz, each song in the list is clickable for extra information
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://gist.githubusercontent.com/arantius/3123124/raw/grant-none-shim.js

// ==/UserScript==

if (!window.setupDocumentDone) return;

let titlePreference = 1; // 0 for English anime names, 1 for Romaji anime names

let modalList;
let modalInfo;
let modalListDialog;
let modalInfoDialog;
let modalListContent;
let modalInfoContent;
let modalListHeader;
let modalInfoHeader;
let modalListOptions;
let modalInfoOptions;
let modalListBody;
let modalInfoBody;
let closeButtonList;
let closeButtonInfo;
let modalListTitle;
let modalInfoTitle;
let listButton;
let listTable;
let songListJSON = [];
let player = {
    name: "N/A",
    isPlayer: false,
    id: 0
};


function createListWindow() {
    // create modal window
    modalList = $("<div></div>")
        .attr("id", "songListModal")
        .attr("class", "modal fade")
        .attr("tabindex", "-1")
        .attr("role", "dialog")
        .css("overflow-y", "hidden");

    // create modal dialog
    modalListDialog = $("<div></div>")
        .attr("class", "modal-dialog")
        .attr("role", "document")
        .css("width", "640px")
        .css("position", "absolute")
        .css("overflow-y", "initial !important")
        .css("margin", "0px");

    // create modal content
    modalListContent = $("<div></div>")
        .attr("class", "modal-content");

    // create modal header
    modalListHeader = $("<div></div>")
        .attr("class", "modal-header")
        .attr("id", "modalListHeader");

    // create the options tab
    modalListOptions = $("<div></div>")
        .attr("class", "songListOptions")
        .append($("<textarea></textarea>")
            .attr("id", "copyBoxJSON")
            .css("position", "absolute")
            .css("top", "9999px")
        )
        .append($("<button></button>")
            .attr("id", "copySongListJSON")
            .attr("class", "btn btn-primary songListOptionsButton")
            .attr("type", "button")
            .text("Copy JSON Data")
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

    // create modal body
    modalListBody = $("<div></div>")
        .attr("class", "modal-body resizableList")
        .css("overflow-y", "auto")
        .css("height", "480px");

    // create close button
    closeButtonList = $("<div></div>")
        .attr("class", "close")
        .attr("type", "button")
        .attr("data-dismiss", "modal")
        .attr("aria-label", "Close")
        .html("<span aria-hidden=\"true\">×</span>");

    // create modal window title
    modalListTitle = $("<h2></h2>")
        .attr("class", "modal-title")
        .text("Song List");

    // link nodes
    modalListHeader.append(closeButtonList);
    modalListHeader.append(modalListTitle);
    modalListContent.append(modalListHeader);
    modalListContent.append(modalListOptions);
    modalListContent.append(modalListBody);
    modalListDialog.append(modalListContent);
    modalList.append(modalListDialog);
    $("#gameContainer").append(modalList);

    // button to access the song results
    listButton = $("<div></div>")
        .attr("id", "qpResultsButton")
        .attr("class", "button floatingContainer")
        .attr("data-toggle", "modal")
        .attr("data-target", "#songListModal")
        .html("<h1>Song List</h1>");

    $("#qpInfoHider").parent().parent().append(listButton);

    // create results table
    listTable = $("<table></table>")
        .attr("id", "resultsTable")
        .attr("class", "table floatingContainer");
    modalListBody.append(listTable);
    modalListDialog.append($("<div></div>")
        .attr("class", "resizerList bottom-right")
        .css("width", "10px")
        .css("height", "10px")
        .css("background-color", "rgba(0, 0, 0, 0)")
        .css("position", "absolute")
        .css("right", "-5px")
        .css("bottom", "-5px")
        .css("cursor", "se-resize")
    );
    modalListDialog.append($("<div></div>")
        .attr("class", "resizerList bottom-left")
        .css("width", "10px")
        .css("height", "10px")
        .css("background-color", "rgba(0, 0, 0, 0)")
        .css("position", "absolute")
        .css("right", "calc(100% - 5px)")
        .css("bottom", "-5px")
        .css("cursor", "ne-resize")
    );
    modalListDialog.append($("<div></div>")
        .attr("class", "resizerList top-right")
        .css("width", "10px")
        .css("height", "10px")
        .css("background-color", "rgba(0, 0, 0, 0)")
        .css("position", "absolute")
        .css("right", "-5px")
        .css("bottom", "calc(100% - 5px)")
        .css("cursor", "ne-resize")
    );
    modalListDialog.append($("<div></div>")
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
    songListJSON = [];
    clearTable();
    addTableHeader();
}

function clearTable() {
    listTable.children().remove();
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
    let animeCol = $("<td></td>")
        .attr("class", "animeName")
        .html("<b>Anime</b>");
    let typeCol = $("<td></td>")
        .attr("class", "songType")
        .html("<b>Type</b>");
    header.append(numberCol);
    header.append(nameCol);
    header.append(artistCol);
    header.append(animeCol);
    header.append(typeCol);
    listTable.append(header);
}

function addTableEntry(newSong, newSongJSON) {
    let newRow = $("<tr></tr>")
        .attr("class", "songData clickAble")
        .attr("data-toggle", "modal")
        .attr("data-target", "#songInfoModal")
        .click(function () {
            updateInfo(newSong, newSongJSON);
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
    let anime = $("<td></td>")
        .attr("class", "animeName")
        .text(Object.values(newSong.anime)[titlePreference]);
    let type = $("<td></td>")
        .attr("class", "songType")
        .text(newSong.type);
    newRow.append(songNumber);
    newRow.append(songName);
    newRow.append(artist);
    newRow.append(anime);
    newRow.append(type);
    listTable.append(newRow);
}

function createInfoWindow() {
    // create modal window
    modalInfo = $("<div></div>")
        .attr("id", "songInfoModal")
        .attr("class", "modal fade")
        .attr("tabindex", "-1")
        .attr("role", "dialog")
        .css("overflow-y", "hidden");

    // create modal dialog
    modalInfoDialog = $("<div></div>")
        .attr("class", "modal-dialog")
        .attr("role", "document")
        .css("width", "640px")
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
        .css("height", "480px");

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

function updateInfo(song, songJSON) {
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

createListWindow();
createInfoWindow();

// Code for resizing the modal windows, this is horrible, don't look at it, don't touch it, don't question how it works
let resizableList = $(".resizableList");
let resizerList = $(".resizerList");
const MIN_LIST_WIDTH = 450;
const MIN_LIST_HEIGHT = 300;

resizerList.mousedown(function (event) {
    modalList.css("user-select", "none");
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
            if (newWidth < MIN_LIST_WIDTH) {
                newWidth = MIN_LIST_WIDTH;
            }
            resizableList.width(newWidth);
            modalListContent.width(newWidth+30);
            modalListDialog.width(newWidth+32);
            newHeight = startHeight + event.originalEvent.clientY - startY;
            if (newHeight < MIN_LIST_HEIGHT) {
                newHeight = MIN_LIST_HEIGHT;
            }
            resizableList.height(newHeight);
        });
    }
    if ($(this).hasClass("bottom-left")) {
        $(document.documentElement).mousemove(function (event) {
            newWidth = startWidth - event.originalEvent.clientX + startX;
            newLeft = event.originalEvent.clientX;
            if (newWidth < MIN_LIST_WIDTH) {
                newWidth = MIN_LIST_WIDTH;
                newLeft = startWidth - newWidth + startX;
            }
            modalListDialog.css("left", newLeft + "px");
            resizableList.width(newWidth);
            modalListContent.width(newWidth+30);
            modalListDialog.width(newWidth+32);
            newHeight = startHeight + event.originalEvent.clientY - startY;
            if (newHeight < MIN_LIST_HEIGHT) {
                newHeight = MIN_LIST_HEIGHT;
            }
            resizableList.height(newHeight);
        });
    }
    if ($(this).hasClass("top-right")) {
        $(document.documentElement).mousemove(function (event) {
            newWidth = startWidth + event.originalEvent.clientX - startX;
            if (newWidth < MIN_LIST_WIDTH) {
                newWidth = MIN_LIST_WIDTH;
            }
            resizableList.width(newWidth);
            modalListContent.width(newWidth+30);
            modalListDialog.width(newWidth+32);
            newHeight = startHeight - event.originalEvent.clientY + startY;
            newTop = event.originalEvent.clientY - 32;
            if (newHeight < MIN_LIST_HEIGHT) {
                newHeight = MIN_LIST_HEIGHT;
                newTop = startHeight - newHeight + startY;
            }
            modalListDialog.css("top", newTop + "px");
            resizableList.height(newHeight);
        });
    }
    if ($(this).hasClass("top-left")) {
        $(document.documentElement).mousemove(function (event) {
            newWidth = startWidth - event.originalEvent.clientX + startX;
            newLeft = event.originalEvent.clientX;
            if (newWidth < MIN_LIST_WIDTH) {
                newWidth = MIN_LIST_WIDTH;
                newLeft = startWidth - newWidth + startX;
            }
            modalListDialog.css("left", newLeft + "px");
            resizableList.width(newWidth);
            modalListContent.width(newWidth+30);
            modalListDialog.width(newWidth+32);
            newHeight = startHeight - event.originalEvent.clientY + startY;
            newTop = event.originalEvent.clientY - 32;
            if (newHeight < MIN_LIST_HEIGHT) {
                newHeight = MIN_LIST_HEIGHT;
                newTop = startHeight - newHeight + startY;
            }
            modalListDialog.css("top", newTop + "px");
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
const MIN_INFO_WIDTH = 450;
const MIN_INFO_HEIGHT = 300;

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
            if (newWidth < MIN_INFO_WIDTH) {
                newWidth = MIN_INFO_WIDTH;
            }
            resizableInfo.width(newWidth);
            modalInfoContent.width(newWidth+30);
            modalInfoDialog.width(newWidth+32);
            newHeight = startHeight + event.originalEvent.clientY - startY;
            if (newHeight < MIN_INFO_HEIGHT) {
                newHeight = MIN_INFO_HEIGHT;
            }
            resizableInfo.height(newHeight);
        });
    }
    if ($(this).hasClass("bottom-left")) {
        $(document.documentElement).mousemove(function (event) {
            newWidth = startWidth - event.originalEvent.clientX + startX;
            newLeft = event.originalEvent.clientX;
            if (newWidth < MIN_INFO_WIDTH) {
                newWidth = MIN_INFO_WIDTH;
                newLeft = startWidth - newWidth + startX;
            }
            modalInfoDialog.css("left", newLeft + "px");
            resizableInfo.width(newWidth);
            modalInfoContent.width(newWidth+30);
            modalInfoDialog.width(newWidth+32);
            newHeight = startHeight + event.originalEvent.clientY - startY;
            if (newHeight < MIN_INFO_HEIGHT) {
                newHeight = MIN_INFO_HEIGHT;
            }
            resizableInfo.height(newHeight);
        });
    }
    if ($(this).hasClass("top-right")) {
        $(document.documentElement).mousemove(function (event) {
            newWidth = startWidth + event.originalEvent.clientX - startX;
            if (newWidth < MIN_INFO_WIDTH) {
                newWidth = MIN_INFO_WIDTH;
            }
            resizableInfo.width(newWidth);
            modalInfoContent.width(newWidth+30);
            modalInfoDialog.width(newWidth+32);
            newHeight = startHeight - event.originalEvent.clientY + startY;
            newTop = event.originalEvent.clientY - 32;
            if (newHeight < MIN_INFO_HEIGHT) {
                newHeight = MIN_INFO_HEIGHT;
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
            if (newWidth < MIN_INFO_WIDTH) {
                newWidth = MIN_INFO_WIDTH;
                newLeft = startWidth - newWidth + startX;
            }
            modalInfoDialog.css("left", newLeft + "px");
            resizableInfo.width(newWidth);
            modalInfoContent.width(newWidth+30);
            modalInfoDialog.width(newWidth+32);
            newHeight = startHeight - event.originalEvent.clientY + startY;
            newTop = event.originalEvent.clientY - 32;
            if (newHeight < MIN_INFO_HEIGHT) {
                newHeight = MIN_INFO_HEIGHT;
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

// draggable windows
$("#songListModal").find(".modal-dialog").draggable({
    handle: "#modalListHeader",
    containment: "#gameContainer"
});

$("#songInfoModal").find(".modal-dialog").draggable({
    handle: "#modalInfoHeader",
    containment: "#gameContainer"
});

// CSS
GM_addStyle(`
.songListOptions {
    border-bottom: 1px solid #6d6d6d;
    height: 65px;
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
    width: 16%;
    float: inline-start;
    min-width: 125px;
    margin: 1%;
    text-align: center;
}
#fromListContainer {
    width: 25%;
    float: inline-start;
    min-width: 145px;
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
    width: 150px;
    margin: auto;
    margin-bottom: 10px;
    margin-top: -5px;
}
#qpResultsButton > h1 {
    padding: 5px;
    font-size: 28px;
}
.songListOptionsButton {
    float: right;
    margin-top: 15px;
    margin-right: 10px;
}
`);