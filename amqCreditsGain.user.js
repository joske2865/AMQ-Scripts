// ==UserScript==
// @name         AMQ Notes and XP Gain Display
// @namespace    http://tampermonkey.net/
// @version      1.3.1
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
    displayGain(data, data.credit);
});

let expandCreditsGainListener = new Listener("expandLibrary answer", (result) => {
    if (result.succ) {
        displayGain(result, result.credits);
    }
});

function calculateXPGain(data) {
    if (xpBar.level < 20 && data.level > xpBar.level) {
        return data.xpInfo.xpIntoLevel + 500 * xpBar.level - Math.round(xpBar._xpPercent * (500 * xpBar.level));
    }
    if (xpBar.level < 20 && data.level === xpBar.level) {
        return data.xpInfo.xpIntoLevel - Math.round(xpBar._xpPercent * (500 * xpBar.level));
    }
    if (xpBar.level >= 20 && data.level > xpBar.level) {
        return data.xpInfo.xpIntoLevel + 10000 - Math.round(xpBar._xpPercent * 10000);
    }
    return data.xpInfo.xpIntoLevel - Math.round(xpBar._xpPercent * 10000)
}

function displayGain(data, credits) {
    let creditsGain = credits - xpBar.currentCreditCount;
    let expGain = calculateXPGain(data);
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