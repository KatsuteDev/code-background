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

import { glob } from "glob";

import * as fs from "fs";
import * as path from "path";

import { install } from "./command/install";
import { uninstall } from "./command/uninstall";
import { config, get } from "./command/config";

import * as align from "./command/config/align";
import * as file from "./command/config/file";
import * as loop from "./command/config/loop";
import * as opacity from "./command/config/opacity";
import * as repeat from "./command/config/repeat";
import * as size from "./command/config/size";

//

const identifier: string = "KatsuteDev/code-background";

export const activate: (context: vscode.ExtensionContext) => void = (context: vscode.ExtensionContext) => {

    if(require.main && require.main.filename){

        // %appdata%/Local/Programs/Microsoft VS Code/resources/app/out/bootstrap-window.js

        const file: string = path.join(path.dirname(require.main.filename), "bootstrap-window.js");
        if(fs.existsSync(file)){
            js = file;
            const backup: string = path.join(path.dirname(require.main.filename), "bootstrap-window-backup.js");
            fs.existsSync(backup) || fs.copyFileSync(file, backup);
        }else
            vscode.window.showWarningMessage(`Failed to find 'bootstrap-window.js'`);
    }else
        vscode.window.showErrorMessage("Failed to find main file");

    context.subscriptions.push(install);
    context.subscriptions.push(uninstall);

    context.subscriptions.push(config);

    context.subscriptions.push(align.command);
    context.subscriptions.push(file.command);
    context.subscriptions.push(loop.command);
    context.subscriptions.push(opacity.command);
    context.subscriptions.push(repeat.command);
    context.subscriptions.push(size.command);
};

//

let js: string | undefined;

export const installJS: () => void = () => {
    js && fs.writeFileSync(js, removeJS(fs.readFileSync(js, "utf-8")) + '\n' + getJS(), "utf-8")
}

export const uninstallJS: () => void = () => {
    js && fs.writeFileSync(js, removeJS(fs.readFileSync(js, "utf-8")), "utf-8");
}

export const restartVS: () => void = () => {
    vscode.commands.executeCommand("workbench.action.newWindow").then(() => {
        vscode.commands.executeCommand("workbench.action.closeWindow");
    });
}

//

const remove: RegExp = new RegExp(`\\/\\* ${identifier}-start \\*\\/` + `[\\s\\S]*?` + `\\/\\* ${identifier}-end \\*\\/`);

const unique = (v: string, i: number, self: string[]) => self.indexOf(v) === i;

const getJS: () => string = () => {
    const images: string[] = []; // image data url with quotes

    for(const g of (get("files") as string[]).filter(unique)){
        for(const f of glob.sync(g)){
            const ext: string = path.extname(f);
            // make sure this matches command/file/addFile$filters
            switch(ext){
                case ".png":
                case ".jpeg":
                case ".jpg":
                case ".webp":
                case ".gif":
                    images.push('"' + `data:image/${ext.substring(1)};base64,${fs.readFileSync(f, "base64")}` + '"');
            }
        }
    }

    const position: string = {
        "Top Left": "left top",
        "Top Center": "center top",
        "Top Right": "right top",
        "Center Left": "left center",
        "Center Center": "center center",
        "Center Right": "right center",
        "Bottom Left": "left bottom",
        "Bottom Center": "center bottom",
        "Bottom Right": "right bottom",
        "Manual": get("align-css") as string,
    }[get("align") as string] || "center center";

    const loop: number = get("loop") as number;

    const opacity: number = get("opacity") as number;

    const repeat: string = {
        "No Repeat": "no-repeat",
        "Repeat": "repeat",
        "Repeat X": "repeat-x",
        "Repeat Y": "repeat-y",
        "Repeat Space": "space",
        "Repeat Round": "round"
    }[get("repeat") as string] || "no-repeat";

    const size: string = {
        "Auto": "auto",
        "Contain": "contain",
        "Cover": "cover",
        "Manual": get("size-css") as string
    }[get("size") as string] || "auto";

    return `
/* ${identifier}-start */
const imgs = [${images.join(',')}];
const len = ${images.length};
const loop = ${loop};

let last = -1;

const reload = () => {
    let index;
    do index = Math.floor(Math.random() * len);
    while(len > 1 && last === index);
    document.body.style.backgroundImage = "url(\\"" + imgs[last = index] + "\\")";
};

window.onload = () => {
    document.body.style.backgroundPosition = "${position}";
    document.body.style.backgroundRepeat = "${repeat}";
    document.body.style.backgroundSize = "${size}";
    document.body.style.opacity = ${opacity};

    reload();
    if(len > 1 && loop > 0);
        setInterval(${loop * 1000}, reload);  // <== not supported
};
/* ${identifier}-end */
        `.trim();
}

const removeJS: (s: string) => string = (s: string) => {
    return s.replace(remove, "").replace(/\s+$/, "");
}