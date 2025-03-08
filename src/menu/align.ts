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

import { Properties, getConfigurationProperty } from "../extension/package";
import { UI, get, notify, update, updateFromLabel } from "../extension/config";

import { isValidCSS } from "../lib/css";
import { CommandQuickPickItem, quickPickItem, separator, showInputBox, showQuickPick } from "../lib/vscode";

import { backgroundMenu, title } from "./menu";
import { format } from "../lib/l10n";

const prop: Properties = getConfigurationProperty("backgroundAlignment");

const handle: (item: CommandQuickPickItem) => void = (item: CommandQuickPickItem) =>
    updateFromLabel("backgroundAlignment", item, item.ui!)
        .then(() => backgroundMenu(item.ui!)); // reopen menu

export const show: (ui: UI) => void = (ui: UI) => {
    const current: string = get("backgroundAlignment", {ui});

    showQuickPick([
        // top
        quickPickItem({ label: prop.items!.enum![0], handle, ui }, current),
        quickPickItem({ label: prop.items!.enum![1], handle, ui }, current),
        quickPickItem({ label: prop.items!.enum![2], handle, ui }, current),
        // center
        separator(),
        quickPickItem({ label: prop.items!.enum![3], handle, ui }, current),
        quickPickItem({ label: prop.items!.enum![4], handle, ui }, current),
        quickPickItem({ label: prop.items!.enum![5], handle, ui }, current),
        // bottom
        separator(),
        quickPickItem({ label: prop.items!.enum![6], handle, ui }, current),
        quickPickItem({ label: prop.items!.enum![7], handle, ui }, current),
        quickPickItem({ label: prop.items!.enum![8], handle, ui }, current),
        // manual
        separator(),
        quickPickItem({ label: prop.items!.enum![9],
            description: `(${get("backgroundAlignmentValue", {ui})})`,
            ui,
            handle: (item: CommandQuickPickItem) => {
                const currentValue: string = get("backgroundAlignmentValue", {ui});
                showInputBox({
                    title: title(format("background.menu.align.title"), ui),
                    placeHolder: format("background.menu.align.detail"),
                    value: currentValue,
                    prompt: `${format("background.menu.align.detail")} (${currentValue}). ${format("background.menu.align.description")}`,
                    validateInput: (value: string) => !isValidCSS(value) ? format("background.menu.cssError") : null,
                    handle: (value: string) => {
                        if(isValidCSS(value)){
                            let changed: boolean = get("backgroundAlignment", {ui}) !== prop.items!.enum![9] || currentValue !== value;

                            update("backgroundAlignment", prop.items!.enum![9], ui, true)
                                .then(() => update("backgroundAlignmentValue", value, ui, true))
                                .then(() => {
                                    changed && notify();
                                    backgroundMenu(ui); // reopen menu
                                });
                        }
                    }
                });
            }
        }, current)
    ], {
        title: title(format("background.menu.align.title"), ui),
        matchOnDescription: true,
        placeHolder: format("background.menu.align.detail")
    });
}