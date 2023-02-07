/*
 * Copyright (C) 2022 Katsute <https://github.com/Katsute>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

import * as vscode from "vscode";

import { css, cssValue, get } from "./vs/vsconfig";

import * as os from "os";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

import * as fse from "./lib/file";
import * as glob from "./lib/glob";
import { round } from "./lib/round";

import * as reload from "./command/reload";
import * as install from "./command/install";
import * as uninstall from "./command/uninstall";
import * as changelog from "./command/changelog";

import { config } from "./command/config";
import * as file from "./command/config/file";

import { statusbar } from "./statusbar";

import * as sudo from "@vscode/sudo-prompt";

//

const identifier: string = "KatsuteDev/Background";

export let clog: vscode.Uri;

export const activate: (context: vscode.ExtensionContext) => void = (context: vscode.ExtensionContext) => {

    // backend

    if(require.main && require.main.filename){

        // %appdata%/Local/Programs/Microsoft VS Code/resources/app/out/vs/workbench/workbench.desktop.main.js

        {
            const base: string = path.join(path.dirname(require.main.filename), "vs", "workbench");

            const file: string = js = path.join(base, "workbench.desktop.main.js");
            const name: string = path.basename(file);

            if(fs.existsSync(file)){
                const backup: string = path.join(base, `${path.parse(name).name}-backup.js`);
                if(!fs.existsSync(backup)){
                    fse.copy(file, backup);
                    vscode.window.showInformationMessage(`A backup was created for '${name}'`);
                }
            }else
                vscode.window.showErrorMessage(`Failed to find '${name}'`);
        }

        // %appdata%/Local/Programs/Microsoft VS Code/resources/app/product.json

        {
            const base: string = path.join(path.dirname(require.main.filename), "../");

            const file: string = json = path.join(base, "product.json");
            const name: string = path.basename(file);

            if(fs.existsSync(file)){
                const backup: string = path.join(base, `${path.parse(name).name}-backup.json`);
                if(!fs.existsSync(backup)){
                    fse.copy(file, backup);
                    vscode.window.showInformationMessage(`A backup was created for '${name}'`);
                }
            }else
                vscode.window.showErrorMessage(`Failed to find '${name}'`);
        }

    }else
        vscode.window.showErrorMessage("Failed to find main file");

    // extension

    clog = vscode.Uri.file(path.join(context.extensionPath, "CHANGELOG.md"));

    context.subscriptions.push(reload.command);
    context.subscriptions.push(install.command);
    context.subscriptions.push(uninstall.command);
    context.subscriptions.push(changelog.command);

    context.subscriptions.push(config);

    context.subscriptions.push(statusbar);
    statusbar.show();
};

//

const win: boolean = process.platform === "win32";

const getChecksum: (raw: string) => string = (raw: string) =>
    crypto
        .createHash("md5")
        .update(raw)
        .digest("base64")
        .replace(/=+$/gm, '');

const replace: RegExp = /(?<=^\s*"vs\/workbench\/workbench\.desktop\.main\.js\": \").*(?=\",\s*$)/gm;

let js: string, json: string;

export const installJS: () => void = () => {
    if(js && json){
        const content: string = removeJS(fse.read(js)) + '\n' + getJS();
        const checksum: string = getChecksum(content);

        if(fse.canWrite(js) && fse.canWrite(json)){
            fse.write(js, content);
            fse.write(json, fse.read(json).replace(replace, checksum).trim());
            restartVS();
        }else{
            vscode.window.showWarningMessage("Failed to write CSS, run command as administrator?", {detail: "todo", modal: true}, "Yes", "No").then((value?: string) => {
                if(value === "Yes"){
                    const jst = path.join(os.tmpdir(), "workbench.desktop.main.js");
                    fse.write(jst, content);
                    const jnt = path.join(os.tmpdir(), "product.json");
                    fse.write(jnt, fse.read(json).replace(replace, checksum).trim());

                    const mv: string = win ? "move /Y" : "mv -f";

                    const cmd: string = win
                        ? `move /Y ${jst} ${js}; move /Y ${jnt} ${json}` // todo: test
                        : `-- sh -c '${mv} ${jst} ${js}; ${mv} ${jnt} ${json}'`; // todo: test on codespaces

                    sudo.exec(cmd, {name: "VSCode Extension Host"}, (ERR, OUT, IN) => {
                        if(ERR){
                            // todo: err
                        }else{
                            restartVS();
                        }
                    });
                }
            });
        }
    }
}

export const uninstallJS: () => void = () => {
    if(js && json){
        const content: string = removeJS(fse.read(js));
        const checksum: string = getChecksum(content);

        if(fse.canWrite(js) && fse.canWrite(json)){
            fse.write(js, content);
            fse.write(json, fse.read(json).replace(replace, checksum).trim());
        }else{
            vscode.window.showWarningMessage("Failed to write CSS, run command as administrator?", {detail: "todo", modal: true}, "Yes", "No").then((value?: string) => {
                if(value === "Yes"){
                    const jst = path.join(os.tmpdir(), "workbench.desktop.main.js");
                    fse.write(jst, content);
                    const jnt = path.join(os.tmpdir(), "product.json");
                    fse.write(jnt, fse.read(json).replace(replace, checksum).trim());

                    const mv: string = win ? "move /Y" : "mv -f";

                    const cmd: string = win
                        ? `move /Y ${jst} ${js}; move /Y ${jnt} ${json}` // todo: test
                        : `-- sh -c '${mv} ${jst} ${js}; ${mv} ${jnt} ${json}'`; // todo: test on codespaces

                    sudo.exec(cmd, {name: "VSCode Extension Host"}, (ERR, OUT, IN) => {
                        if(ERR){
                            // todo: err
                        }else{
                            restartVS();
                        }
                    });
                }
            });
        }
    }
}

export const restartVS: () => void = () => {
    vscode.commands.executeCommand("workbench.action.reloadWindow");
}

//

const remove: RegExp = new RegExp(`^\\/\\* ${identifier}-start \\*\\/$` + `[\\s\\S]*?` + `^\\/\\* ${identifier}-end \\*\\/$`, "gmi");

export const extensions = (v: string, i: number, self: string[]) => { // images only
    const ext: string = path.extname(v);
    for(const m of file.extensions())
        if(`.${m}` === ext)
            return true;
    return false;
}

const getJS: () => string = () => {
    // populate images

    const images: {[key: string]: string[]} = { // include start and end quotes
        window:  glob.resolve(get(`windowBackgrounds`)),
        editor:  glob.resolve(get(`editorBackgrounds`)),
        sidebar: glob.resolve(get(`sidebarBackgrounds`)),
        panel:   glob.resolve(get(`panelBackgrounds`))
    };

    const after: boolean = get(`renderContentAboveBackground`);

    return `/* ${identifier}-start */` + '\n' + `(() => {` +
// shared background css
(`
const bk_global = document.createElement("style");
bk_global.id = "${identifier}-global";
bk_global.setAttribute("type", "text/css");

bk_global.appendChild(document.createTextNode(\`

    body[windowTransition="true"]${!after ? `::before` : ` > div[role=application] > div.monaco-grid-view::after`},
    body[editorTransition="true"] .split-view-view > .editor-group-container::after,
    body[sidebarTransition="true"] .split-view-view > #workbench\\\\.parts\\\\.sidebar::after,
    body[sidebarTransition="true"] .split-view-view > #workbench\\\\.parts\\\\.auxiliarybar::after,
    body[panelTransition="true"] .split-view-view > #workbench\\\\.parts\\\\.panel::after {

        opacity: 0;

    }

    body${!after ? `::before` : ` > div[role=application] > div.monaco-grid-view::after`},
    .split-view-view > .editor-group-container::after,
    .split-view-view > #workbench\\\\.parts\\\\.sidebar::after,
    .split-view-view > #workbench\\\\.parts\\\\.auxiliarybar::after,
    .split-view-view > #workbench\\\\.parts\\\\.panel::after {

        content: "";

        top: 0;

        width: 100%;
        height: 100%;

        ${!after ? `z-index: 1000;` : ''}

        position: absolute;

        pointer-events: none;

        transition: opacity 1s ease-in-out;

        image-rendering: ${get("smoothImageRendering") ? "auto" : "pixelated"};

    }
\`));
`
+ // background image cache
`
const windowBackgrounds = [${images.window.join(',')}];
const editorBackgrounds = [${images.editor.join(',')}];
const sidebarBackgrounds = [${images.sidebar.join(',')}];
const panelBackgrounds = [${images.panel.join(',')}];

const iWindowBackgrounds = [...Array(${images.window.length}).keys()];
const iEditorBackgrounds = [...Array(${images.editor.length}).keys()];
const iSidebarBackgrounds = [...Array(${images.sidebar.length}).keys()];
const iPanelBackgrounds = [...Array(${images.panel.length}).keys()];

const windowTime = ${get("backgroundChangeTime", "window", true) == 0 ? 0 : Math.max(round(get("backgroundChangeTime", "window", true), 2), 5)};
const editorTime = ${get("backgroundChangeTime", "editor", true) == 0 ? 0 : Math.max(round(get("backgroundChangeTime", "editor", true), 2), 5)};
const sidebarTime = ${get("backgroundChangeTime", "sidebar", true) == 0 ? 0 : Math.max(round(get("backgroundChangeTime", "sidebar", true), 2), 5)};
const panelTime = ${get("backgroundChangeTime", "panel", true) == 0 ? 0 : Math.max(round(get("backgroundChangeTime", "panel", true), 2), 5)};
`
+ // individual background css - window
`
if(windowBackgrounds.length > 0){
    bk_global.appendChild(document.createTextNode(\`
        body${!after ? `::before` : ` > div[role=application] > div.monaco-grid-view::after`} {

            background-position: ${css("backgroundAlignment", "window")};
            background-repeat: ${css("backgroundRepeat", "window")};
            background-size: ${css("backgroundSize", "window")};

            opacity: ${round(1 - +css("backgroundOpacity", "window"), 2)};

            filter: blur(${css("backgroundBlur", "window")});

        }
    \`));
};
`
+ // individual background css - editor
`
if(editorBackgrounds.length > 0){
    bk_global.appendChild(document.createTextNode(\`
        .split-view-view > .editor-group-container::after {

            background-position: ${css("backgroundAlignment", "editor")};
            background-repeat: ${css("backgroundRepeat", "editor")};
            background-size: ${css("backgroundSize", "editor")};

            opacity: ${round(1 - +css("backgroundOpacity", "editor"), 2)};

            filter: blur(${css("backgroundBlur", "editor")});

        }
    \`));
};
`
+ // individual background css - sidebar
`
if(sidebarBackgrounds.length > 0){
    bk_global.appendChild(document.createTextNode(\`
        .split-view-view > #workbench\\\\.parts\\\\.sidebar::after,
        .split-view-view > #workbench\\\\.parts\\\\.auxiliarybar::after {

            background-position: ${css("backgroundAlignment", "sidebar")};
            background-repeat: ${css("backgroundRepeat", "sidebar")};
            background-size: ${css("backgroundSize", "sidebar")};

            opacity: ${round(1 - +css("backgroundOpacity", "sidebar"), 2)};

            filter: blur(${css("backgroundBlur", "sidebar")});

        }
    \`));
};
`
+ // individual background css - panel
`
if(panelBackgrounds.length > 0){
    bk_global.appendChild(document.createTextNode(\`
        .split-view-view > #workbench\\\\.parts\\\\.panel::after {

            background-position: ${css("backgroundAlignment", "panel")};
            background-repeat: ${css("backgroundRepeat", "panel")};
            background-size: ${css("backgroundSize", "panel")};

            opacity: ${round(1 - +css("backgroundOpacity", "panel"), 2)};

            filter: blur(${css("backgroundBlur", "panel")});

        }
    \`));
};
`
+ // notification overrides
`
bk_global.appendChild(document.createTextNode(\`
    div.notifications-toasts div.monaco-list[aria-label="Your Code installation appears to be corrupt. Please reinstall., notification"],
    div.notifications-toasts div.monaco-list[aria-label="Your Code - Insiders installation appears to be corrupt. Please reinstall., notification"] {

        display: none;

    }

    div.monaco-list-row[aria-label$=", source: Background (Extension), notification"],
    div.monaco-list-row[aria-label$=", source: Background (Extension), notification"]:hover {

        background-color: #0098FF !important;
        color: white !important;

    }

    div.monaco-list-row[aria-label$=", source: Background (Extension), notification"] ::before {

        color: white;

    }
\`));
`
+ // custom user css
`
bk_global.appendChild(document.createTextNode("${cssValue(get("CSS"))}"));
`
+ // background image - window
`
const bk_window_image = document.createElement("style");
bk_window_image.id = "${identifier}-window-images";
bk_window_image.setAttribute("type", "text/css");

const setWindowBackground = () => {
    while(bk_window_image.firstChild){
        bk_window_image.removeChild(bk_window_image.firstChild);
    };

    if(windowBackgrounds.length > 0){
        shuffle(iWindowBackgrounds);

        bk_window_image.appendChild(document.createTextNode(\`
            body${!after ? `::before` : ` > div[role=application] > div.monaco-grid-view::after`} {

                background-image: url("\${windowBackgrounds[iWindowBackgrounds[0]]}");

            }
        \`));
    };
};
`
+ // background image - editor
`
const bk_editor_image = document.createElement("style");
bk_editor_image.id = "${identifier}-editor-images";
bk_editor_image.setAttribute("type", "text/css");

const setEditorBackground = () => {
    while(bk_editor_image.firstChild){
        bk_editor_image.removeChild(bk_editor_image.firstChild);
    };

    if(editorBackgrounds.length > 0){
        const len = Math.min(editorBackgrounds.length, 10);

        shuffle(iEditorBackgrounds);

        for(let i = 0; i < len; i++){
            bk_editor_image.appendChild(document.createTextNode(\`
                #workbench\\\\.parts\\\\.editor :not(.split-view-container) .split-view-container > .split-view-view:nth-child(\${len}n+\${i+1}) > .editor-group-container::after {
                    background-image: url("\${editorBackgrounds[iEditorBackgrounds[i]]}");
                }
            \`));
        };
    };
};
`
+ // background image - sidebar
`
const bk_sidebar_image = document.createElement("style");
bk_sidebar_image.id = "${identifier}-sidebar-images";
bk_sidebar_image.setAttribute("type", "text/css");

const setSidebarBackground = () => {
    while(bk_sidebar_image.firstChild){
        bk_sidebar_image.removeChild(bk_sidebar_image.firstChild);
    };

    if(sidebarBackgrounds.length > 0){
        shuffle(iSidebarBackgrounds);

        bk_sidebar_image.appendChild(document.createTextNode(\`
            .split-view-view > #workbench\\\\.parts\\\\.sidebar::after {

                background-image: url("\${sidebarBackgrounds[iSidebarBackgrounds[0]]}");

            }
            .split-view-view > #workbench\\\\.parts\\\\.auxiliarybar::after {

                background-image: url("\${sidebarBackgrounds[iSidebarBackgrounds[1]] ?? sidebarBackgrounds[iSidebarBackgrounds[0]]}");

            }
        \`));
    };
};
`
+ // background image - panel
`
const bk_panel_image = document.createElement("style");
bk_panel_image.id = "${identifier}-panel-images";
bk_panel_image.setAttribute("type", "text/css");

const setPanelBackground = () => {
    while(bk_panel_image.firstChild){
        bk_panel_image.removeChild(bk_panel_image.firstChild);
    };

    if(panelBackgrounds.length > 0){
        shuffle(iPanelBackgrounds);

        bk_panel_image.appendChild(document.createTextNode(\`
            .split-view-view > #workbench\\\\.parts\\\\.panel::after {

                background-image: url("\${panelBackgrounds[iPanelBackgrounds[0]]}");

            }
        \`));
    };
};
`
+ // random
`
const shuffle = (arr) => {
    for(let i = arr.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * i);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    };
};
`
+ // install
`
window.onload = () => {
    document.getElementsByTagName("head")[0].appendChild(bk_global);
    document.getElementsByTagName("head")[0].appendChild(bk_window_image);
    document.getElementsByTagName("head")[0].appendChild(bk_editor_image);
    document.getElementsByTagName("head")[0].appendChild(bk_sidebar_image);
    document.getElementsByTagName("head")[0].appendChild(bk_panel_image);

    for(const arr of [iWindowBackgrounds, iEditorBackgrounds, iSidebarBackgrounds, iPanelBackgrounds]){
        for(let i = arr.length - 1; i > 0; i--){
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        };
    };

    setWindowBackground();
    setEditorBackground();
    setSidebarBackground();
    setPanelBackground();

    if(windowTime > 0 && iWindowBackgrounds.length > 1){
        setInterval(() => {
            document.body.setAttribute("windowTransition", true);
            setTimeout(() => {
                setWindowBackground();
                document.body.setAttribute("windowTransition", false);
            }, 1 * 1000);
        }, windowTime * 1000);
    };
    if(editorTime > 0 && iEditorBackgrounds.length > 1){
        setInterval(() => {
            document.body.setAttribute("editorTransition", true);
            setTimeout(() => {
                setEditorBackground();
                document.body.setAttribute("editorTransition", false);
            }, 1 * 1000);
        }, editorTime * 1000);
    };
    if(sidebarTime > 0 && iSidebarBackgrounds.length > 1){
        setInterval(() => {
            document.body.setAttribute("sidebarTransition", true);
            setTimeout(() => {
                setSidebarBackground();
                document.body.setAttribute("sidebarTransition", false);
            }, 1 * 1000);
        }, sidebarTime * 1000);
    };
    if(panelTime > 0 && iPanelBackgrounds.length > 1){
        setInterval(() => {
            document.body.setAttribute("panelTransition", true);
            setTimeout(() => {
                setPanelBackground();
                document.body.setAttribute("panelTransition", false);
            }, 1 * 1000);
        }, panelTime * 1000);
    };
};
`
+
`})();`)
// minify
    .trim()
    .replace(/^ +/gm, '') // spaces
    .replace(/\r?\n/gm, '') + // newlines
    '\n' + `/* ${identifier}-end */`; // EOF
}

const removeJS: (s: string) => string = (s: string) => {
    return s.replace(remove, "").trim();
}