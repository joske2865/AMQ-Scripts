// Creates the installed scripts window if it doesn't exist and adds "Installed Userscripts" button to the main page and settings
// This code is fetched automatically
// Do not attempt to add it to tampermonkey

function AMQ_createInstalledWindow() {
    if (!window.setupDocumentDone) return;
    if ($("#installedModal").length === 0) {
        $("#gameContainer").append($(`
            <div class="modal fade" id="installedModal" tabindex="-1" role="dialog">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">×</span>
                            </button>
                            <h2 class="modal-title">Installed Userscripts</h2>
                        </div>
                        <div class="modal-body" style="overflow-y: auto;max-height: calc(100vh - 150px);">
                            <div id="installedContainer">
                                You have the following scripts installed (click on each of them to learn more)<br>
                                This window can also be opened by going to AMQ settings (the gear icon on bottom right) and clicking "Installed Userscripts"
                                <div id="installedListContainer"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `));

        $("#mainMenu").prepend($(`
            <div class="button floatingContainer mainMenuButton" id="mpInstalled" data-toggle="modal" data-target="#installedModal">
                <h1>Installed Userscripts</h1>
            </div>
        `))
        .css("margin-top", "20vh");

        $("#optionsContainer > ul").prepend($(`
            <li class="clickAble" data-toggle="modal" data-target="#installedModal">Installed Userscripts</li>
        `));

        AMQ_addStyle(`
            #installedListContainer h4 {
                font-weight: bold;
                cursor: pointer;
            }
            #installedListContainer h4 .version {
                opacity: .5;
                margin-left: 10px;
            }
            #installedListContainer .descriptionContainer {
                width: 95%;
                margin: auto;
            }
            #installedListContainer .descriptionContainer img {
                width: 80%;
                margin: 10px 10%;
            }
        `);
    }
}


/*
Adds a new section to the installed scripts window containing the script info, such as name, author and description (HTML enabled)
Example metadata object
metadataObj = {
    name: "AMQ Song List",
    author: "TheJoseph98",
    version: "1.0"
    description: "Adds a song list to the game which can be accessed mid-quiz by clicking the list icon in the top right corner"
}
*/
function AMQ_addScriptData(metadata) {
    AMQ_createInstalledWindow();
    $("#installedListContainer").append($("<div></div>")
        .append($("<h4></h4>")
            .append($(`<i class="fa fa-caret-right"></i>`))
            .append($(`<span></span>`).text(`${metadata.name || "Unknown"} by ${metadata.author || "Unknown"}`))
            .append($(`<span class="version"></span>`).text(metadata.version || ""))
            .click(function () {
                let selector = $(this).next();
                if (selector.is(":visible")) {
                    selector.slideUp();
                    $(this).find(".fa-caret-down").addClass("fa-caret-right").removeClass("fa-caret-down");
                }
                else {
                    selector.slideDown();
                    $(this).find(".fa-caret-right").addClass("fa-caret-down").removeClass("fa-caret-right");
                }
            })
        )
        .append($("<div></div>")
            .addClass("descriptionContainer")
            .html(metadata.description || "No description provided")
            .hide()
        )
    )
}

function AMQ_addStyle(css) {
    let style = document.createElement("style");
    style.type = "text/css";
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
}
