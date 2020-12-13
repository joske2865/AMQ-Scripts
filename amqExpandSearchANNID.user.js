// ==UserScript==
// @name         AMQ Expand Search ANN ID
// @namespace    https://github.com/TheJoseph98
// @version      1.0.2
// @description  Allows the user to search anime by ANNID in Expand Library
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @updateURL    https://github.com/TheJoseph98/AMQ-Scripts/raw/master/amqExpandSearchANNID.user.js
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// @grant        none

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

function setup() {
    $("#elQuestionFilterInput").attr("placeholder", "Search anime, song, artist or ANN ID");

    ExpandQuestionListEntry.prototype.applySearchFilter = function (regexFilter, stricter) {
        if (this.annId === parseInt($("#elQuestionFilterInput").val())) {
            this.resetSearchFilter();
            return true;
        }

        if (stricter && !this.active) {
            return false;
        }

        if (regexFilter.test(this.name)) {
            this.resetSearchFilter();
        } else {
            this.songList.forEach(entry => {
                entry.applySearchFilter(regexFilter, stricter);
            });
            this.updateDisplay();
        }
    };

    AMQ_addScriptData({
        name: "Expand Search by ANN ID",
        author: "TheJoseph98",
        description: `
            <p>Allows the user to search expand library by ANN ID in addition to searching by anime name, song name and artist</p>
        `
    });
}