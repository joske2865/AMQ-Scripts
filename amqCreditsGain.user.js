// ==UserScript==
// @name         AMQ Notes Gain Display
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Adds a display above your notes count to display how many notes you gained (or lost), disappears after 5 seconds
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// ==/UserScript==

if (!window.setupDocumentDone) return;

$("#currencyText")
    .after($("<div></div>")
        .attr("id", "currencyGain")
        .css("position", "relative")
        .css("bottom", "75px")
        .css("left", "20px")
        .css("font-size", "30px")
        .css("display", "none")
        .text("0")
    )

let $creditsGain = $("#currencyGain");

let creditsGainListener = new Listener("quiz xp credit gain", (data) => {
    let creditsGain = data.credit - xpBar.currentCreditCount;
    if (creditsGain > 0) {
        $creditsGain.text("+" + creditsGain);
        $creditsGain.show();
    }
    else if (creditsGain < 0){
        $creditsGain.text(creditsGain);
        $creditsGain.show();
    }
    else {
        $creditsGain.hide();
    }
    setTimeout(function () {
        $creditsGain.hide();
    }, 5000);
});

creditsGainListener.bindListener();