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

import { window } from "vscode";

import { UI, get, update } from "../extension/config";

import { round } from "../lib/math";
import { showInputBox } from "../lib/vscode";

import { backgroundMenu, title } from "./menu";
import { format } from "../lib/l10n";

export const show: (ui: UI) => void = (ui: UI) => {
    const current: number = round(get("backgroundOpacity", {ui}) as number, 2);

    showInputBox({
        title: title(format("background.menu.opacity.title"), ui),
        placeHolder: format("background.menu.opacity.detail"),
        value: current.toString(),
        prompt: `Background opacity (${current}). ${format("background.menu.opacity.description", get("useInvertedOpacity") ? 0 : 1, get("useInvertedOpacity") ? 1 : 0)})`,
        validateInput: (value: string) => {
            if(isNaN(+value))
                return format("background.menu.opacity.nan");
            else if(+value < 0 || +value > 1)
                return format("background.menu.opacity.range");
            else
                return null;
        },
        handle: (value: string) => {
            if(!isNaN(+value)){
                const o: number = Math.min(Math.max(round(+value, 2), 0), 1);
                if(get("useInvertedOpacity") ? o > .1 : o < .9){
                    update("backgroundOpacity", o, ui)
                        .then(() => backgroundMenu(ui)); // reopen menu
                }else{
                    window.showWarningMessage(
                        format("background.menu.opacity.low", o),
                        { modal: true },
                        format("background.menu.opacity.y")
                    ).then((c?: string) => {
                        if(c === format("background.menu.opacity.y"))
                            update("backgroundOpacity", o, ui)
                                .then(() => backgroundMenu(ui)); // reopen menu
                    });
                }
            }
        }
    });
}