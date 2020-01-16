// ==UserScript==
// @name         AMQ Song List
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Prints a copyable list to console at the end of each game
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// ==/UserScript==

if (!window.setupDocumentDone) return;

let songs = [];
let videoHosts = ["catbox", "animethemes", "openingsmoe"];
let audioHosts = ["catbox"];
let videoResolutions = [720, 480];

let quizReadyListener = new Listener("quiz ready", data => {
	songs = [];
});

let resultListener = new Listener("answer results", result => {
	let newSong = {
		anime: result.songInfo.animeNames.romaji,
		name: result.songInfo.songName,
		artist: result.songInfo.artist,
		type: result.songInfo.type === 3 ? "Insert Song" : (result.songInfo.type === 2 ? "Ending " + result.songInfo.typeNumber : "Opening " + result.songInfo.typeNumber),
		correctCount: result.players.filter(player => player.correct === true).length,
		video: getVideoURL(result.songInfo.urlMap),
		audio: getMP3URL(result.songInfo.urlMap)
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
	for (let host of audioHosts) {
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