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

import { Uri, window } from "vscode";

import { extensions } from "../extension/inject";
import { UI, get as getConfig, update } from "../extension/config";

import { count, escapePath } from "../lib/glob";
import { unique } from "../lib/array";
import { CommandQuickPickItem, quickPickItem, separator, showInputBox, showQuickPick } from "../lib/vscode";

import { backgroundMenu, title } from "./menu";
import { format } from "../lib/l10n";

// config

export const get: (ui: UI) => string[] = (ui: UI) => getConfig(`${ui}Backgrounds`);

export const add: (ui: UI, glob: string | string[], skipNotification?: boolean) => Promise<void> = async (ui: UI, glob: string | string[], skipNotification: boolean = false) => {
    // add
    const globs: string[] = get(ui);
    globs.push(...(!Array.isArray(glob) ? [glob] : glob));

    // update
    await update(`${ui}Backgrounds`, globs.filter(unique), undefined, skipNotification);
    skipNotification || show(ui); // reopen menu
}

export const replace: (ui: UI, replace: string, glob: string, skipNotification?: boolean) => Promise<void> = async (ui: UI, replace: string, glob: string, skipNotification: boolean = false) => {
    // replace matching
    const files: string[] = get(ui).filter(unique);
    for(let i = 0, len = files.length; i < len; i++)
        if(files[i] === replace){
            files[i] = glob;
            break;
        }

    // updates
    await update(`${ui}Backgrounds`, files.filter(unique), undefined, skipNotification || replace === glob);
    skipNotification || show(ui); // reopen menu
}

export const remove: (ui: UI, glob: string | string[], skipNotification?: boolean) => Promise<void> = async (ui: UI, glob: string | string[], skipNotification: boolean = false) => {
    // remove matching
    const match: string[] = !Array.isArray(glob) ? [glob] : glob;
    await update(
        `${ui}Backgrounds`,
        get(ui)
            .filter(item => !match.includes(item))
            .filter(unique),
        undefined,
        skipNotification
    );
    skipNotification || show(ui); // reopen menu
}

// menu

export const show: (ui: UI) => void = (ui: UI) =>{
    // existing items
    const items: CommandQuickPickItem[] = get(ui)
        .filter(unique)
        .map(glob => quickPickItem({
            label: glob.replace(/(\$\(\w+\))/g, "\\$1"),
            value: glob,
            ui,
            description: format("background.menu.file.delete.count", count(glob)),
            // update input
            handle: (item: CommandQuickPickItem) =>
                showInputBox({
                    title: format("background.menu.file.update.title", item.value),
                    placeHolder: format("background.menu.file.update.detail"),
                    value: item.value ?? "",
                    prompt: format("background.menu.file.update.description"),
                    // validation
                    validateInput: (value: string) => {
                        if(value.startsWith("file://"))
                            return format("background.menu.file.update.file");
                        else if(value.startsWith("http://"))
                            return format("background.menu.file.update.http");
                        else
                            return null;
                    },
                    // update
                    handle: (value: string) => {
                        if(value.trim().length === 0)
                            remove(ui, item.value!);
                        else
                            replace(ui, item.value!, value);
                    }
                })
        }));

    // menu
    showQuickPick([
        // existing items
        ...items,
        // add
        separator(),
        quickPickItem({ // file
            alwaysShow: true,
            label: `$(file-add) ${format("background.menu.file.addFile.title")}`,
            ui,
            handle: (item: CommandQuickPickItem) =>
                window.showOpenDialog({
                    canSelectFiles: true,
                    canSelectFolders: false,
                    canSelectMany: true,
                    openLabel: format("background.menu.file.addFile.label"),
                    filters: {Images: extensions()}
                }).then((files?: Uri[]) =>
                    files && add(ui, files.map(file => escapePath(file)))
                )
        }),
        quickPickItem({ // folder
            alwaysShow: true,
            label: `$(file-directory-create) ${format("background.menu.file.addFolder.title")}`,
            ui,
            handle: (item: CommandQuickPickItem) =>
                window.showOpenDialog({
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: true,
                    openLabel: format("background.menu.file.addFolder.label")
                }).then((files?: Uri[]) =>
                    files && add(ui, files.map(file => `${escapePath(file)}/**`))
                )
        }),
        quickPickItem({ // glob
            alwaysShow: true,
            label: `$(kebab-horizontal) ${format("background.menu.file.addGlob.title")}`,
            ui,
            handle: (item: CommandQuickPickItem) =>
                window.showInputBox({
                    title: format("background.menu.file.addGlob.title"),
                    placeHolder: format("background.menu.file.addGlob.detail"),
                    prompt: format("background.menu.file.addGlob.description"),
                    validateInput: (value: string) => {
                        if(value.startsWith("file://"))
                            return format("background.menu.file.addGlob.file");
                        else if(value.startsWith("http://") || value.startsWith("https://"))
                            return format("background.menu.file.addGlob.http");
                        else
                            return null;
                    }
                }).then((glob?: string) => {
                    glob && add(ui, glob!);
                })
        }),
        quickPickItem({ // url
            alwaysShow: true,
            label: `$(ports-open-browser-icon) ${format("background.menu.file.addURL.title")}`,
            ui,
            handle: (item: CommandQuickPickItem) =>
                window.showInputBox({
                    title: format("background.menu.file.addURL.title"),
                    placeHolder: format("background.menu.file.addURL.detail"),
                    prompt: format("background.menu.file.addURL.description"),
                    validateInput: (value: string) => {
                        if(value.startsWith("file://"))
                            return format("background.menu.file.addURL.file");
                        else if(value.startsWith("http://"))
                            return format("background.menu.file.addURL.http");
                        else if(value.startsWith("https://"))
                            return null;
                        else
                            return format("background.menu.file.addURL.invalid");
                    }
                }).then((url?: string) => {
                    url && add(ui, url);
                })
        }),
        // delete
        ... items.length > 0 ? [
            separator(),
            quickPickItem({
                alwaysShow: true,
                label: `$(trash) ${format("background.menu.file.delete.title")}`,
                ui,
                handle: (item: CommandQuickPickItem) => {
                    const items: CommandQuickPickItem[] = get(ui)
                        .filter(unique)
                        .map(glob => {
                            const matches: number = count(glob);
                            return quickPickItem({
                                label: glob.replace(/(\$\(\w+\))/g, "\\$1"),
                                value: glob,
                                ui: item.ui,
                                description: format("background.menu.file.delete.count", matches)
                            });
                        });

                        window.showQuickPick(
                            items,
                            {
                                title: title(format("background.menu.file.delete.action"), ui),
                                placeHolder: format("background.menu.file.detail.actionDetail"),
                                canPickMany: true
                            }
                        ).then((selected?: CommandQuickPickItem[]) =>
                            selected && remove(ui, selected.map(item => item.value!))
                        );
                }
            })
        ] : []
    ], {
        title: title(format("background.menu.file.title"), ui),
        placeHolder: format("background.menu.file.title")
    },
    () => backgroundMenu(ui));
}