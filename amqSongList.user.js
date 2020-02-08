// ==UserScript==
// @name         AMQ Song List
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Prints a copyable list to console at the end of each game
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// ==/UserScript==

if (!window.setupDocumentDone) return;

let songs = [];
let videoHosts = ["catbox", "animethemes", "openingsmoe"];
let mp3Hosts = ["catbox"];
let videoResolutions = [720, 480];

let quizReadyListener = new Listener("quiz ready", data => {
    songs = [];
});

let resultListener = new Listener("answer results", result => {
    let newSong = {
        songNumber: parseInt($("#qpCurrentSongCount").text()),
        animeEnglish: result.songInfo.animeNames.english,
        animeRomaji: result.songInfo.animeNames.romaji,
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
    console.log(newSong);
    songs.push(newSong);
});

let quizEndListener = new Listener("quiz end result", result => {
    console.log(songs);
    songs = [];
});

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

resultListener.bindListener();
quizEndListener.bindListener();
quizReadyListener.bindListener();