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