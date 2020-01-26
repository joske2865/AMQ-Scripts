// ==UserScript==
// @name         AMQ Notes and XP Gain Display
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Adds 2 displays above your xp bar and note count to indicated how much you gained of each after guessing a song or at the end of the round, disappears after 5 seconds
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

let creditsGainListener = new Listener("quiz xp credit gain", (data) => {
    let creditsGain = data.credit - xpBar.currentCreditCount;
    let expGain = data.xpInfo.xpIntoLevel - Math.round(xpBar._xpPercent*10000);
    $creditsGain.text("+" + creditsGain);
    $creditsGain.show();
    $expGain.text("+" + expGain);
    $expGain.show();
    setTimeout(function () {
        $creditsGain.hide();
        $expGain.hide();
    }, 5000);
});

creditsGainListener.bindListener();