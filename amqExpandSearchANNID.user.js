// ==UserScript==
// @name         AMQ Expand Search ANN ID
// @namespace    https://github.com/TheJoseph98
// @version      1.0
// @description  Allows the user to search anime by ANNID in Expand Library
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @updateURL    https://github.com/TheJoseph98/AMQ-Scripts/raw/master/amqExpandSearchANNID.user.js
// @grant        none

// ==/UserScript==

// don't run on login page
if (!window.setupDocumentDone) return;

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