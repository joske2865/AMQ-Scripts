class AMQWindow {
    constructor(data) {
        this.title = data.title === undefined ? "Window" : data.title;
        this.resizable = data.resizable === undefined ? false : data.resizable;
        this.draggable = data.draggable === undefined ? false : data.draggable;
        this.width = data.width === undefined ? 200 : data.width;
        this.height = data.height === undefined ? 300 : data.height;
        this.minWidth = data.minWidth === undefined ? 200 : data.minWidth;
        this.minHeight = data.minHeight === undefined ? 300: data.minHeight;
        this.position = data.position === undefined ? {x: 0, y: 0} : data.position;
        this.closeHandler = data.closeHandler === undefined ? function () {} : data.closeHandler;
        this.zIndex = data.zIndex === undefined ? 1060 : data.zIndex;
        this.bodyOffset = data.bodyOffset === undefined ? 75 : data.bodyOffset;
        this.resizers = null;

        this.window = $("<div></div>")
            .addClass("customWindow")
            .css("position", "absolute")
            .css("z-index", this.zIndex.toString())
            .offset({
                top: this.position.y !== undefined ? this.position.y : 0,
                left: this.position.x !== undefined ? this.position.x : 0
            })
            .height(this.height)
            .width(this.width)

        this.content = $(`<div class="customWindowContent"></div>`);

        this.header = $("<div></div>")
            .addClass("modal-header")
            .addClass(this.draggable === true ? "draggableWindow" : "")
            .append($(`<div class="close" type="button"><span aria-hidden="true">×</span></div>`)
                .click(() => {
                    this.close(this.closeHandler);
                })
            )
            .append($("<h2></h2>")
                .addClass("modal-title")
                .text(this.title)
            )

        this.body = $(`<div class="modal-body customWindowBody"></div>`)
            .addClass(this.resizable === true ? "resizableWindow" : "")
            .height(this.height - 75)

        if (this.resizable === true) {
            this.resizers = $(
                `<div class="windowResizers">
                    <div class="windowResizer top-left"></div>
                    <div class="windowResizer top-right"></div>
                    <div class="windowResizer bottom-left"></div>
                    <div class="windowResizer bottom-right"></div>
                </div>`
            );
        }

        this.content.append(this.header);
        this.content.append(this.body);
        if (this.resizers !== null) {
            this.window.append(this.resizers);
            let tmp = this;
            let startWidth = 0;
            let startHeight = 0;
            let startX = 0;
            let startY = 0;
            let startMouseX = 0;
            let startMouseY = 0;
            this.resizers.find(".windowResizer").each(function (index, resizer) {
                $(resizer).mousedown(function (event) {
                    tmp.window.css("user-select", "none");
                    startWidth = tmp.window.width();
                    startHeight = tmp.window.height();
                    startX = tmp.window.position().left;
                    startY = tmp.window.position().top;
                    startMouseX = event.originalEvent.clientX;
                    startMouseY = event.originalEvent.clientY;
                    let curResizer = $(this);
                    $(document.documentElement).mousemove(function (event) {
                        if (curResizer.hasClass("bottom-right")) {
                            let newWidth = startWidth + (event.originalEvent.clientX - startMouseX);
                            let newHeight = startHeight + (event.originalEvent.clientY - startMouseY);
                            if (newWidth > tmp.minWidth) {
                                tmp.window.width(newWidth);
                            }
                            if (newHeight > tmp.minHeight) {
                                tmp.body.height(newHeight - tmp.bodyOffset - 33);
                                tmp.window.height(newHeight);
                            }
                        }
                        if (curResizer.hasClass("bottom-left")) {
                            let newWidth = startWidth - (event.originalEvent.clientX - startMouseX);
                            let newHeight = startHeight + (event.originalEvent.clientY - startMouseY);
                            let newLeft = startX + (event.originalEvent.clientX - startMouseX);
                            if (newWidth > tmp.minWidth) {
                                tmp.window.width(newWidth);
                                tmp.window.css("left", newLeft + "px");
                            }
                            if (newHeight > tmp.minHeight) {
                                tmp.body.height(newHeight - tmp.bodyOffset - 33);
                                tmp.window.height(newHeight);
                            }
                        }
                        if (curResizer.hasClass("top-right")) {
                            let newWidth = startWidth + (event.originalEvent.clientX - startMouseX);
                            let newHeight = startHeight - (event.originalEvent.clientY - startMouseY);
                            let newTop = startY + (event.originalEvent.clientY - startMouseY);
                            if (newWidth > tmp.minWidth) {
                                tmp.window.width(newWidth);
                            }
                            if (newHeight > tmp.minHeight) {
                                tmp.window.css("top", newTop + "px");
                                tmp.body.height(newHeight - tmp.bodyOffset - 33);
                                tmp.window.height(newHeight);
                            }
                        }
                        if (curResizer.hasClass("top-left")) {
                            let newWidth = startWidth - (event.originalEvent.clientX - startMouseX);
                            let newHeight = startHeight - (event.originalEvent.clientY - startMouseY);
                            let newLeft = startX + (event.originalEvent.clientX - startMouseX);
                            let newTop = startY + (event.originalEvent.clientY - startMouseY);
                            if (newWidth > tmp.minWidth) {
                                tmp.window.width(newWidth);
                                tmp.window.css("left", newLeft + "px");
                            }
                            if (newHeight > tmp.minHeight) {
                                tmp.window.css("top", newTop + "px");
                                tmp.body.height(newHeight - tmp.bodyOffset - 33);
                                tmp.window.height(newHeight);
                            }
                        }
                    });
                    $(document.documentElement).mouseup(function (event) {
                        $(document.documentElement).off("mousemove");
                        $(document.documentElement).off("mouseup");
                        tmp.window.css("user-select", "text");
                    });
                });
            });
        }
        if (this.draggable === true) {
            this.window.draggable({
                handle: this.header,
                containment: "#gameContainer"
            });
        }

        this.window.append(this.content);
        $("#gameContainer").append(this.window);
    }

    setTitle(newTitle) {
        this.title = newTitle;
        this.header.find("modal-title").text(newTitle);
    }
    getTitle() {
        return this.title;
    }

    setZIndex(newZIndex) {
        this.zIndex = newZIndex;
        this.window.css("z-index", this.zIndex.toString());
    }
    getZIndex() {
        return this.zIndex;
    }

    setBodyOffset(newBodyOffset) {
        this.bodyOffset = newBodyOffset;
        this.body.height(this.height - this.bodyOffset - 33);
    }
    getBodyOffset() {
        return this.bodyOffset;
    }
    
    isVisible() {
        return this.window.is(":visible");
    }

    clear() {
        this.body.children().remove();
    }

    open() {
        this.window.show();
    }

    open(handler) {
        this.window.show();
        if (handler !== undefined) {
            handler();
        }
    }

    close() {
        this.window.hide();
    }

    close(handler) {
        this.window.hide();
        if (handler !== undefined) {
            handler();
        }
    }
}

function addStyle(css) {
    let head = document.head;
    let style = document.createElement("style");
    head.appendChild(style);
    style.type = "text/css";
    style.id = "customWindowStyle";
    style.appendChild(document.createTextNode(css));
}

if (window.setupDocumentDone) {
    if ($("#customWindowStyle").length === 0) {
        addStyle(`
            .customWindow {
                overflow-y: hidden;
                top: 0px;
                left: 0px;
                margin: 0px;
                background-color: #424242;
                border: 1px solid rgba(27, 27, 27, 0.2);
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
                user-select: text;
                display: none;
            }
            .draggableWindow {
                cursor: move;
            }
            .customWindowBody {
                width: 100%;
                overflow-y: auto;
            }
            .customWindowContent {
                width: 100%;
                position: absolute;
                top: 0px;
            }
            .customWindow .close {
                font-size: 32px;
            }
            .windowResizers {
                width: 100%;
                height: 100%;
            }
            .windowResizer {
                width: 10px;
                height: 10px;
                position: absolute;
                z-index: 100;
            }
            .windowResizer.top-left {
                top: 0px;
                left: 0px;
                cursor: nwse-resize;
            }
            .windowResizer.top-right {
                top: 0px;
                right: 0px;
                cursor: nesw-resize;
            }
            .windowResizer.bottom-left {
                bottom: 0px;
                left: 0px;
                cursor: nesw-resize;
            }
            .windowResizer.bottom-right {
                bottom: 0px;
                right: 0px;
                cursor: nwse-resize;
            }
        `);
    } 
}
