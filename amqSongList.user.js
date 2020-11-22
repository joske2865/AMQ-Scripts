// ==UserScript==
// @name         AMQ Song List
// @namespace    https://github.com/TheJoseph98
// @version      1.3.1
// @description  Prints a copyable list to console at the end of each game
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// @updateURL    https://github.com/TheJoseph98/AMQ-Scripts/raw/master/amqSongList.user.js
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

let songs = [];
let videoHosts = ["catbox", "openingsmoe"];
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

function setup() {
    let oldWidth = $("#qpOptionContainer").width();
    $("#qpOptionContainer").width(oldWidth + 35);
    $("#qpOptionContainer > div").append($("<div></div>")
        .attr("id", "qpCopyJSON")
        .attr("class", "clickAble qpOption")
        .html("<i aria-hidden=\"true\" class=\"fa fa-clipboard qpMenuItem\"></i>")
        .click(() => {
            $("#copyBox").val(JSON.stringify(songs, null, 4)).select();
            document.execCommand("copy");
            $("#copyBox").val("").blur();
        })
        .popover({
            content: "Copy JSON to Clipboard",
            trigger: "hover",
            placement: "bottom"
        })
    );

    // clear list on quiz ready
    let quizReadyListener = new Listener("quiz ready", data => {
        songs = [];
    });

    let resultListener = new Listener("answer results", result => {
        let newSong = {
            songNumber: parseInt($("#qpCurrentSongCount").text()),
            animeEnglish: result.songInfo.animeNames.english,
            animeRomaji: result.songInfo.animeNames.romaji,
            annId: result.songInfo.annId,
            songName: result.songInfo.songName,
            artist: result.songInfo.artist,
            type: result.songInfo.type === 3 ? "Insert Song" : (result.songInfo.type === 2 ? "Ending " + result.songInfo.typeNumber : "Opening " + result.songInfo.typeNumber),
            correctCount: result.players.filter(player => player.correct === true).length,
            activePlayers: Object.values(quiz.players).filter(player => player.avatarSlot._disabled === false).length,
            startSample: quizVideoController.moePlayers[quizVideoController.currentMoePlayerId].startPoint,
            videoLength: parseFloat(quizVideoController.moePlayers[quizVideoController.currentMoePlayerId].$player.find("video")[0].duration.toFixed(2)),
            linkWebm: getVideoURL(result.songInfo.urlMap),
            linkMP3: getMP3URL(result.songInfo.urlMap)
        };
        //console.log(newSong);
        songs.push(newSong);
    });

    // print list to console on quiz end
    let quizEndListener = new Listener("quiz end result", result => {
        console.log(songs);
    });

    // clear list on quiz over (returning to lobby)
    let quizOverListener = new Listener("quiz over", roomSettings => {
        songs = [];
    });

    // clear list on joining lobby
    let quizJoinListener = new Listener("Join Game", payload => {
        if (!payload.error) {
            songs = [];
        }
    });

    // clear list on spectating lobby
    let quizSpectateListener = new Listener("Spectate Game", payload => {
        if (!payload.error) {
            songs = [];
        }
    });

    resultListener.bindListener();
    quizEndListener.bindListener();
    quizReadyListener.bindListener();
    quizOverListener.bindListener();
    quizJoinListener.bindListener();
    quizSpectateListener.bindListener();

    AMQ_addScriptData({
        name: "Song List",
        author: "TheJoseph98",
        description: `
            <p>Tracks the songs that played during the round and outputs them to your browser's console including song name, artist, anime, number of players, video URLs and more</p>
            <p>Currently stored data can be copied to clipboard by clicking the clipboard icon in the top right while in a quiz</p>
            <a href="https://i.imgur.com/yGjMle9.png" target="_blank"><img src="https://i.imgur.com/yGjMle9.png" /></a>
            <p>An example output can be found <a href="https://pastebin.com/1gS9n4xa" target="_blank">here</a></p>
            <p>The list resets when the quiz ends (returning to back to lobby), when the quiz starts or when you leave the lobby</p>
        `
    })

    AMQ_addStyle(`
        #qpCopyJSON {
            width: 30px;
            height: auto;
            margin-right: 5px;
        }
        #qpOptionContainer {
            z-index: 10;
        }
    `);
}
