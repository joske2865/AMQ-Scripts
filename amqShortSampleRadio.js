// ==UserScript==
// @name         AMQ Short Sample Radio
// @namespace    https://github.com/FokjeM
// @version      0.1
// @description  Loops through your entire list to not answer songs. Pushes difficulty for them down as fast as possible.
// @author       Riven Skaye // FokjeM
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// ==/UserScript==
const SCRIPT_INFO = {
        name: "AMQ Short Sample Radio",
        author: "RivenSkaye",
        description: `
            <p>Plays all 5 second samples in your list between difficulty settings 10% - 100% until there is nothing left.</p>
            <p>Adds a button next to the settings gear to start and stop the script. Stops by itself if you've pushed your entire list to below 10% guess rate.</p>
            <p>If your entire list is in 0% - 15% you are a <b>BIG BOOLI</b> and you should feel bad.</p>
        `
    }
AMQ_addScriptData(SCRIPT_INFO);

function setup(){
    if(document.getElementById('startPage')) return;

}
