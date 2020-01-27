// ==UserScript==
// @name         AMQ Notes and XP Gain Display
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Adds 2 displays above your xp bar and note count to indicated how much you gained of each after guessing a song, at the end of the round or after submitting a song in expand library, disappears after 5 seconds
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// ==/UserScript==

if (!window.setupDocumentDone) return;

$("#currencyText")
    .after($("<div></div>")
        .attr("id", "expGain")
        .css("position", "relative")
        .css("bottom", "115px")
        .css("left", "-175px")
        .css("font-size", "28px")
        .css("display", "none")
        .text("0")
    )
    .after($("<div></div>")
        .attr("id", "currencyGain")
        .css("position", "relative")
        .css("bottom", "75px")
        .css("left", "20px")
        .css("font-size", "28px")
        .css("display", "none")
        .text("0")
    )

let $creditsGain = $("#currencyGain");
let $expGain = $("#expGain");

let quizCreditsGainListener = new Listener("quiz xp credit gain", (data) => {
    displayGain(data.xpInfo.xpIntoLevel, data.credit);
});

let expandCreditsGainListener = new Listener("expandLibrary answer", (result) => {
    if (result.succ) {
        displayGain(result.xpInfo.xpIntoLevel, result.credits);
    }
});

function getCurrentXP() {
    if (xpBar.level < 20) {
        return Math.round(xpBar._xpPercent*(500 * xpBar.level));
    }
    return Math.round(xpBar._xpPercent*10000);
}

function displayGain(xp, credits) {
    let creditsGain = credits - xpBar.currentCreditCount;
    let expGain = xp - getCurrentXP();
    $creditsGain.text("+" + creditsGain);
    $creditsGain.show();
    $expGain.text("+" + expGain);
    $expGain.show();
    setTimeout(function () {
        $creditsGain.hide();
        $expGain.hide();
    }, 5000);
}

quizCreditsGainListener.bindListener();
expandCreditsGainListener.bindListener();