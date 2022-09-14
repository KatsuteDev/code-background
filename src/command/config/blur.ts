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

import { getUI, UI, updateUI } from "../../vs/vsconfig";
import { CommandQuickPickItem, CommandQuickPickItemPromise } from "../../vs/quickpick";

import { options } from "../config";

//

export const menu: CommandQuickPickItemPromise = (item?: CommandQuickPickItem) => new Promise(() => {
    if(!item) return;

    const ui: UI = item.ui!;
    const current: string = getUI(ui, "backgroundBlur") as string ?? "";

    vscode.window.showInputBox({
        title: `${ui} ${options.title} - Blur`,
        placeHolder: "Background blur",
        value: current,
        prompt: `Background blur (${current})`,
        validateInput: (value: string) => value.match(/[^\w.%+-]/gmi) ? "Invalid CSS" : null
    }).then((value?: string) => {
        if(value && !value.match(/[^\w.%+-]/gmi))
            updateUI(ui, "backgroundBlur", value, "0");
    });
});