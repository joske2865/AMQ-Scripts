// ==UserScript==
// @name         AMQ Performance Improvements
// @namespace    https://github.com/TheJoseph98
// @version      1.0
// @description  Disables a bunch of animations, transition effects and CPU heavy tasks
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// ==/UserScript==

// don't load the script on login page
if (!window.setupDocumentDone) return;

function setup() {
    /*
    $("#quizScoreboardEntryTemplate").html(`
        <div class="qpStandingItem notransition">
            <div class="qpScoreBoardNumber">
                {1}
            </div>
            <div class="qpScoreBoardEntry">
                <p><b class="qpsPlayerScore" data-toggle="popover" data-content="{3}"
                     data-trigger="hover" data-html="true" data-placement="top">{2}</b> <span class="qpsPlayerGuessCount hide" data-toggle="popover" data-content="Correct Guesses"
                     data-trigger="hover" data-html="true" data-placement="top"></span> <span class="qpsPlayerName">{0}</span></p>
            </div>
        </div>
    `);

    $("#xpBarInner").addClass("notransition");*/

    quiz._playerAnswerListener.unbindListener();
}

// load the default pose
QuizAvatarSlot.prototype.updatePose = function () {
    if (!this.displayed) {
        return;
    }
    if (this.$avatarImage.attr("src") === undefined) {
        let img = this.poseImages.BASE.image;
        this.$avatarImage.attr("srcset", img.srcset).attr("src", img.src);
    }
}

// don't load new poses
Object.defineProperty(QuizAvatarSlot.prototype, "pose", {
    set: function pose(poseId) {
        this._pose = poseId;
    }
});

// load only base pose
QuizAvatarSlot.prototype.loadPoses = function () {
    this.poseImages.BASE.load(
        function () {
            this.updatePose();
        }.bind(this)
    );
}

// disable avatar glow when they change groups
Object.defineProperty(QuizPlayer.prototype, "groupNumber", {
    set: function groupNumber(newValue) {
        let value = parseInt(newValue);
        this._groupNumber = value;
    }
});

// disable note counter animations
XpBar.prototype.setCredits = function (credits, noAnimation) {
    this.$creditText.text(credits);
    this.currentCreditCount = credits;
}

// disable XP bar animations and glow
XpBar.prototype.xpGain = function (newXpP, newLevel) {
    this.setXpPercent(newXpP);
    this.setLevel(newLevel);
}

// disable ticket counter animations
XpBar.prototype.setTickets = function(tickets, noAnimation) {
    this.$ticketText.text(tickets);
    this.currentTicketCount = tickets;
};

setup();

AMQ_addStyle(`
    :not(.swal2-hide) {
        transition: none !important;
        -moz-transition: none !important;
        -webkit-transition: none !important;
        animation: none !important;
        -moz-animation: none !important;
        -webkit-animation: none !important;
    }
    /* special case for sweetalert windows, can't be closed if they have no animations, so I just set them to 0s */
    .swal2-hide {
        -webkit-animation: hideSweetAlert 0s forwards;
        animation: hideSweetAlert 0s forwards
    }
`)