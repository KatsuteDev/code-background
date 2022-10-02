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

import { config, Props } from "../../vs/package";
import { showInputBox } from "../../vs/inputbox";
import { get, update, updateFromLabel } from "../../vs/vsconfig";
import { CommandQuickPickItem, quickPickItem, separator, showQuickPick } from "../../vs/quickpick";

import { menu as cm, options, title } from "../config";
import { notify } from "../install";

//

const prop: Props = config("backgroundAlignment");

const handle: (item: CommandQuickPickItem) => void = (item: CommandQuickPickItem) => {
    updateFromLabel("backgroundAlignment", item, item.ui!)
        .then(() => cm(item)); // reopen menu
};

export const menu: (item: CommandQuickPickItem) => void = (item: CommandQuickPickItem) => {
    const current: string = get("backgroundAlignment", item.ui!) as string;

    showQuickPick([
        // top
        quickPickItem({ label: prop.items!.enum![0], handle, ui: item.ui! }, current),
        quickPickItem({ label: prop.items!.enum![1], handle, ui: item.ui! }, current),
        quickPickItem({ label: prop.items!.enum![2], handle, ui: item.ui! }, current),
        separator(),
        // center
        quickPickItem({ label: prop.items!.enum![3], handle, ui: item.ui! }, current),
        quickPickItem({ label: prop.items!.enum![4], handle, ui: item.ui! }, current),
        quickPickItem({ label: prop.items!.enum![5], handle, ui: item.ui! }, current),
        separator(),
        // bottom
        quickPickItem({ label: prop.items!.enum![6], handle, ui: item.ui! }, current),
        quickPickItem({ label: prop.items!.enum![7], handle, ui: item.ui! }, current),
        quickPickItem({ label: prop.items!.enum![8], handle, ui: item.ui! }, current),
        separator(),
        // manual
        quickPickItem({ label: prop.items!.enum![9], description: "Manual position", ui: item.ui!, handle: (item: CommandQuickPickItem) => {
            const value: string = get("backgroundAlignmentValue", item.ui!);
            showInputBox({
                title: title("Alignment", item.ui!),
                placeHolder: "Background position",
                value,
                prompt: `Background position (${value}). The literal value for the 'background-position' css property.`,
                handle: (value: string) => {
                    let changed: boolean = get("backgroundAlignment", item.ui!) !== prop.items!.enum![9] || current !== value;

                    update("backgroundAlignment", prop.items!.enum![9], item.ui!, true)
                        .then(() => update("backgroundAlignmentValue", value, item.ui!, true))
                        .then(() => {
                            changed && notify();
                            cm(item); // reopen menu
                        });
                }
            });
        }}, current)
    ],
    {
        ...options,
        title: title("Alignment", item.ui!),
        placeHolder: "Background alignment"
    });
};