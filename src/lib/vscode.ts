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

import { InputBoxOptions, QuickPick, QuickPickItem, QuickPickItemKind, QuickPickOptions, commands, window } from "vscode";

import { UI } from "../extension/config";
import { format } from "./l10n";

// reload

export const reload: () => void = () => commands.executeCommand("workbench.action.reloadWindow");

// input

export const showInputBox:
    (options?: InputBoxOptions & {handle?: (value: string) => void}) => void =
    (options: InputBoxOptions & {handle?: (value: string) => void} = {}) => {
    options.handle && window.showInputBox(options)
        .then((value?: string) => {
            // run in a promise
            value !== undefined && new Promise(() => options.handle!(value));
        });
}

// quick pick

export interface CommandQuickPickItem extends QuickPickItem {
    handle?: (item: CommandQuickPickItem) => void,
    value?: string,
    ui?: UI
}

export const quickPickItem:
    (item: CommandQuickPickItem, current?: string) => CommandQuickPickItem =
    (item: CommandQuickPickItem, current?: string) => ({
    ...item,
    description: ((item.description ?? "") + (item.label === current ? ` (${format("background.lib.vscode.quickpickSelected")})` : "")).trim()
});

export const showQuickPick:
    (items: CommandQuickPickItem[], options?: QuickPickOptions, reference?: () => void, selected?: number) => void =
    (items: CommandQuickPickItem[], options: QuickPickOptions = {}, reference?: () => void, selected?: number) => {
    const quickPick: QuickPick<QuickPickItem> = window.createQuickPick();

    quickPick.items = [
        ... // add back button only if reference menu exists
        reference
            ? [quickPickItem({
                alwaysShow: true,
                label: `$(arrow-left) ${format("background.lib.vscode.quickpickBack")}`,
                handle: reference
            }), separator()]
            : [],
        ...items
    ];

    // options
    for(const [k, v] of Object.entries(options)){
        // @ts-ignore
        quickPick[k] = v;
    }

    // action
    quickPick.onDidAccept(() => {
        const item: CommandQuickPickItem = quickPick.selectedItems[0];
        // run in a promise
        item?.handle && new Promise(() => item.handle!(item));
    });

    // selected
    selected !== undefined && (quickPick.activeItems = [quickPick.items[selected + (reference ? 2 : 0)]]);

    quickPick.show();
}

// separator

export const separator: () => QuickPickItem = () => ({
    label: "",
    kind: QuickPickItemKind.Separator
});