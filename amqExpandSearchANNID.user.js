// ==UserScript==
// @name         AMQ Expand Search ANN ID
// @namespace    https://github.com/TheJoseph98
// @version      1.2
// @description  Allows the user to search anime by ANNID in Expand Library
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://github.com/joske2865/AMQ-Scripts/raw/master/common/amqScriptInfo.js
// @downloadURL  https://github.com/joske2865/AMQ-Scripts/raw/master/amqExpandSearchANNID.user.js
// @updateURL    https://github.com/joske2865/AMQ-Scripts/raw/master/amqExpandSearchANNID.user.js
// ==/UserScript==

// Wait until the LOADING... screen is hidden and load script
if (typeof Listener === "undefined") return;
let loadInterval = setInterval(() => {
    if ($("#loadingScreen").hasClass("hidden")) {
        clearInterval(loadInterval);
        setup();
    }
}, 500);

const version = "1.2";

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
        version: version,
        link: "https://github.com/joske2865/AMQ-Scripts/raw/master/amqExpandSearchANNID.user.js",
        description: `
            <p>Allows the user to search expand library by ANN ID in addition to searching by anime name, song name and artist</p>
        `
    });
}