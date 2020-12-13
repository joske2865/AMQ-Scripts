// ==UserScript==
// @name         AMQ Dice Roller UI
// @namespace    https://github.com/TheJoseph98
// @version      1.1.4
// @description  Adds a window where you can roll dice
// @author       TheJoseph98
// @match        https://animemusicquiz.com/*
// @grant        none
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqScriptInfo.js
// @require      https://raw.githubusercontent.com/TheJoseph98/AMQ-Scripts/master/common/amqWindows.js
// @updateURL    https://github.com/TheJoseph98/AMQ-Scripts/raw/master/amqDiceRollerUI.user.js
// ==/UserScript==

// don't load on login page
if (document.getElementById("startPage")) return;

// Wait until the LOADING... screen is hidden and load script
let loadInterval = setInterval(() => {
    if (document.getElementById("loadingScreen").classList.contains("hidden")) {
        setup();
        clearInterval(loadInterval);
    }
}, 500);

let diceRolls = {};

let diceWindow;
let diceManagerWindow;

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
        $("#diceSelect").append($(`<option>${key}</option>`).attr("value", key));
    }

    diceWindow.panels[1].panel
        .append($(`<button class="btn btn-primary" type="button">Roll</button>`)
            .click(function () {
                rollDice($("#diceSelect").val());
            })
        )
        .append($(`<button class="btn btn-default" type="button">Edit</button>`)
            .click(function () {
                if (diceManagerWindow.isVisible()) {
                    diceManagerWindow.close();
                }
                else {
                    diceManagerWindow.open();
                }
            })
        )

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

function createDiceManagerWindow() {
    diceManagerWindow = new AMQWindow({
        id: "diceManagerWindow",
        title: "Dice Editor",
        width: 500,
        height: 350,
        minWidth: 500,
        minHeight: 350,
        draggable: true,
        resizable: true,
        zIndex: 1052
    });

    diceManagerWindow.addPanel({
        width: 200,
        height: 1.0,
        id: "diceKeysManager"
    });

    diceManagerWindow.addPanel({
        width: "calc(100% - 200px)",
        height: 50,
        position: {
            x: 200,
            y: 0
        },
        id: "diceValuesManager"
    });

    diceManagerWindow.addPanel({
        width: "calc(100% - 200px)",
        height: "calc(100% - 50px)",
        position: {
            x: 200,
            y: 50
        },
        scrollable: {
            x: false,
            y: true
        }
    });

    diceManagerWindow.panels[0].panel
        .append($(`<div class="diceManagerInputContainer"></div>`)
            .append($(`<select id="diceManagerSelect"></select>`)
                .change(function () {
                    displayValues($(this).val());
                })
            )
            .append($(`<button class="btn btn-default" type="button">Remove</button>`)
                .click(function () {
                    let selectedKey = $("#diceManagerSelect").val();
                    delete diceRolls[selectedKey];
                    $(`#diceManagerSelect > option`).filter((index, elem) => $(elem).attr("value") === selectedKey).remove();
                    $(`#diceSelect > option`).filter((index, elem) => $(elem).attr("value") === selectedKey).remove();
                    displayValues($("#diceManagerSelect").val());
                    saveDice();
                })
            )
        )
        .append($(`<div class="diceManagerInputContainer"></div>`)
            .append($(`<input id="diceManagerKeyInput" type="text">`))
            .append($(`<button type="button" class="btn btn-primary">Add</button>`)
                .click(function () {
                    let newKey = $("#diceManagerKeyInput").val();
                    diceRolls[newKey] = [];
                    $("#diceSelect").append($(`<option>${newKey}</option>`).attr("value", newKey));
                    $("#diceManagerSelect").append($(`<option>${newKey}</option>`).attr("value", newKey));
                    $("#diceManagerSelect").val(newKey);
                    displayValues(newKey);
                    saveDice();
                })
            )
            .append($(`<button type="button" class="btn btn-default">Rename</button>`)
                .click(function () {
                    let oldKey = $("#diceManagerSelect").val();
                    let newKey = $("#diceManagerKeyInput").val();
                    if (oldKey === newKey) {
                        return;
                    }
                    diceRolls[newKey] = diceRolls[oldKey];
                    delete diceRolls[oldKey];
                    $(`#diceManagerSelect > option`).filter((index, elem) => $(elem).attr("value") === oldKey).attr("value", newKey).text(newKey);
                    $(`#diceSelect > option`).filter((index, elem) => $(elem).attr("value") === oldKey).attr("value", newKey).text(newKey);
                    displayValues(newKey);
                    saveDice();
                })
            )
        )

    for (let key in diceRolls) {
        $("#diceManagerSelect").append($(`<option>${key}</option>`).attr("value", key));
    }

    diceManagerWindow.panels[1].panel
        .append($(`<div id="diceValueInputContainer"></div>`)
            .append($(`<input id="diceManagerValueInput" type="text">`))
            .append($(`<button type="button" class="btn btn-primary">Add</button>`)
                .click(function () {
                    let newValue = $("#diceManagerValueInput").val();
                    let selectedKey = $("#diceManagerSelect").val();
                    if (selectedKey !== null) {
                        diceRolls[selectedKey].push(newValue);
                        displayValue(newValue);
                        saveDice();
                    }
                })
            )
        )

    displayValues($("#diceManagerSelect").val());
}

function rollDice(key) {
    if (key === null) {
        $("#diceChoice").text("");
        return;
    }
    if (diceRolls[key].length === 0) {
        $("#diceChoice").text("");
        return;
    }
    let randomIdx = Math.floor(Math.random() * diceRolls[key].length);
    let randomChoice = diceRolls[key][randomIdx];
    $("#diceChoice").text(randomChoice);
}

function clearValues() {
    diceManagerWindow.panels[2].panel.children().remove();
}

function displayValues(key) {
    clearValues();
    if (key === null) {
        return;
    }
    for (let value of diceRolls[key]) {
        displayValue(value);
    }
}

function displayValue(newValue) {
    diceManagerWindow.panels[2].panel
        .append($(`<div class="diceManagerValueContainer"></div>`)
            .append($(`<span></span>`)
                .text(newValue)
            )
            .append($(`<button type="button" class="btn btn-default">Remove</button>`)
                .click(function () {
                    let selectedKey = $("#diceManagerSelect").val();
                    let index = diceRolls[selectedKey].indexOf(newValue);
                    if (index !== -1) diceRolls[selectedKey].splice(index, 1);
                    $(this).parent().remove();
                    saveDice();
                })
            )
        )
}

function saveDice() {
    localStorage.setItem("amqDice", JSON.stringify(diceRolls));
}

function loadDice() {
    let savedDice = localStorage.getItem("amqDice");
    if (savedDice !== null) {
        diceRolls = JSON.parse(savedDice);
    }
}

function setup() {
    loadDice();
    createDiceManagerWindow();
    createDiceWindow();

    $(".modal").on("show.bs.modal", () => {
        diceWindow.setZIndex(1025);
        diceManagerWindow.setZIndex(1022);
    });

    $(".modal").on("hidden.bs.modal", () => {
        diceWindow.setZIndex(1055);
        diceManagerWindow.setZIndex(1052);
    });

    $(".slCheckbox label").hover(() => {
        diceWindow.setZIndex(1025);
        diceManagerWindow.setZIndex(1022);
    }, () => {
        diceWindow.setZIndex(1055);
        diceManagerWindow.setZIndex(1052);
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
        #diceRollButtonContainer > button {
            margin: 0px 5px;
        }
        #diceChoiceContainer {
            display: table;
            text-align: center;
        }
        #diceChoice {
            display: table-cell;
            vertical-align: middle;
            font-size: 16px;
        }
        #diceKeysManager {
            border-right: 1px solid #6d6d6d;
        }
        #diceValuesManager {
            border-bottom: 1px solid #6d6d6d;
        }
        .diceManagerInputContainer {
            margin: 10px 0px 20px 0px;
            text-align: center;
        }
        .diceManagerInputContainer > button {
            width: 66px;
            padding: 6px;
            margin: 5px 5px;
        }
        #diceManagerSelect {
            color: black;
            width: 170px;
            margin: 5px 0px;
        }
        #diceManagerKeyInput {
            color: black;
            width: 170px;
            margin: 5px;
        }
        #diceValueInputContainer {
            text-align: center;
            padding: 8px;
        }
        #diceManagerValueInput {
            color: black;
        }
        #diceValueInputContainer > * {
            margin: 0px 6px;
        }
        .diceManagerValueContainer {
            height: 31px;
            margin: 10px 10px 0px 10px;
        }
        .diceManagerValueContainer > span {
            font-size: 22px;
        }
        .diceManagerValueContainer > button {
            float: right;
            padding: 6px;
        }
    `);
}
