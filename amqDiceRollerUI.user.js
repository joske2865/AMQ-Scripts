// ==UserScript==
// @name         AMQ Dice Roller UI
// @namespace    https://github.com/TheJoseph98
// @version      1.0
// @description  Adds a window where you can roll dice
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqWindows.js

// ==/UserScript==

// Don't load the script unless the user is logged in
if (!window.setupDocumentDone) return;

// set your rolls here, a user interface which will allow you do this more visually coming soon™
let diceRolls = {
    "Symphogear": [
        "s1",
        "G",
        "GX",
        "AXZ",
        "XV"
    ],
    "Initial D": [
        "First Stage",
        "Second Stage",
        "Third Stage",
        "Fourth Stage",
        "Fifth Stage",
        "Final Stage",
        "Battle Stage",
        "Battle Stage 2",
        "Extra Stage",
        "Extra Stage 2"
    ]
};

let diceWindow;

function createDiceWindow() {
    diceWindow = new AMQWindow({
        id: "diceWindow",
        title: "Dice",
        width: 200,
        height: 225,
        zIndex: 1055,
        draggable: true
    });

    diceWindow.addPanel({
        width: 1.0,
        height: 50,
        id: "diceSelectContainer"
    });

    diceWindow.addPanel({
        width: 1.0,
        height: 50,
        position: {
            x: 0,
            y: 50
        },
        id: "diceRollButtonContainer"
    });

    diceWindow.addPanel({
        width: 1.0,
        height: 50,
        position: {
            x: 0,
            y: 100
        },
        id: "diceChoiceContainer"
    });

    diceWindow.panels[0].panel.append($(`<select id="diceSelect"></select>`));
    for (let key in diceRolls) {
        $("#diceSelect").append(`<option value='` + key + `'>${key}</option>`);
    }

    diceWindow.panels[1].panel.append($(`<button class="btn btn-primary" type="button">Roll</button>`)
        .click(function () {
            rollDice($("#diceSelect").val());
        })
    );

    diceWindow.panels[2].panel.append($(`<span id="diceChoice"></span>`));

    let oldWidth = $("#qpOptionContainer").width();
    $("#qpOptionContainer").width(oldWidth + 35);
    $("#qpOptionContainer > div").append($(`<div id="qpDiceRoll" class="clickAble qpOption"><i aria-hidden="true" class="fa fa-cube qpMenuItem"></i></div>`)
        .click(function () {
            if(diceWindow.isVisible()) {
                diceWindow.close();
            }
            else {
                diceWindow.open();
            }
        })
        .popover({
            placement: "bottom",
            content: "Dice Roller",
            trigger: "hover"
        })
    );
}

function rollDice(key) {
    let randomIdx = Math.floor(Math.random() * diceRolls[key].length);
    let randomChoice = diceRolls[key][randomIdx];
    $("#diceChoice").text(randomChoice);
}

createDiceWindow();

$(".modal").on("show.bs.modal", () => {
    diceWindow.setZIndex(1025);
});

$(".modal").on("hidden.bs.modal", () => {
    diceWindow.setZIndex(1055);
});

$(".slCheckbox label").hover(() => {
    diceWindow.setZIndex(1025);
}, () => {
    diceWindow.setZIndex(1055);
});

AMQ_addScriptData({
    name: "Dice Roller UI",
    author: "TheJoseph98",
    description: `
        <p>Adds a window where you can select a dice and roll a random value associated with that dice</p>
        <p>This window can be opened by clicking the cube icon at the top right while in quiz (there is no dice icon available, blame Egerod)</p>
        <a href="https://i.imgur.com/e0ZmrQY.png" target="_blank"><img src="https://i.imgur.com/e0ZmrQY.png" /></a>
        <a href="https://i.imgur.com/xElzT2s.png" target="_blank"><img src="https://i.imgur.com/xElzT2s.png" /></a>
    `
});

AMQ_addStyle(`
    #qpDiceRoll {
        width: 30px;
        margin-right: 5px;
    }
    #diceWindow .customWindowPanel {
        border-bottom: 1px solid #6d6d6d;
    }
    #diceSelectContainer {
        line-height: 50px;
        text-align: center;
    }
    #diceSelect {
        color: black;
    }
    #diceRollButtonContainer {
        line-height: 50px;
        text-align: center;
    }
    #diceChoiceContainer {
        display: table;
        text-align: center;
    }
    #diceChoice {
        display: table-cell;
        vertical-align: middle;
    }
`);