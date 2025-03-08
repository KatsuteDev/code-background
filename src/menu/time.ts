/*
 * Copyright (C) 2025 Katsute <https://github.com/Katsute>
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

import { UI, get, update } from "../extension/config";
import { format } from "../lib/l10n";

import { round } from "../lib/math";
import { showInputBox } from "../lib/vscode";

import { backgroundMenu, title } from "./menu";

export const show: (ui: UI) => void = (ui: UI) => {
    const current: number = round(get("backgroundChangeTime", {ui}) as number, 2);

    showInputBox({
        title: title(format("background.menu.time.title"), ui),
        placeHolder: format("background.menu.time.detail"),
        value: current.toString(),
        prompt: `${format("background.menu.time.detail")} (${current}). ${format("background.menu.time.description")}`,
        validateInput: (value: string) => {
            if(isNaN(+value))
                return format("background.menu.time.nan");
            else if(+value < 0)
                return format("background.menu.time.range");
            else
                return null;
        },
        handle: (value: string) => {
            if(!isNaN(+value)){
                const o: number = Math.max(round(+value, 2), 0);
                update("backgroundChangeTime", o, ui)
                    .then(() => backgroundMenu(ui)); // reopen menu
            }
        }
    });
}