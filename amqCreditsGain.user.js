// ==UserScript==
// @name         AMQ Notes Gain Display
// @namespace    http://tampermonkey.net/
// @version      1.0
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
        .css("bottom", "80px")
        .css("left", "100px")
        .css("font-size", "30px")
        .css("display", "none")
        .text("0")
    )

let $creditsGain = $("#currencyGain");
XpBar.prototype.creditsGain = function(creditsGain) {
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
}

let oldSetCredits = XpBar.prototype.setCredits.bind(xpBar);
XpBar.prototype.setCredits = function (credits, noAnimation) {
    let creditsGain = credits - this.currentCreditCount;
    this.creditsGain(creditsGain);
    oldSetCredits(credits, noAnimation);
}
