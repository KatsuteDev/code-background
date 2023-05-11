/*
 * Copyright (C) 2023 Katsute <https://github.com/Katsute>
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

import { showInputBox } from "../../vs/inputbox";
import { get, UI, update } from "../../vs/vsconfig";
import { CommandQuickPickItem, quickPickItem, separator, showQuickPick } from "../../vs/quickpick";

import * as str from "../../lib/str";
import * as glob from "../../lib/glob";
import { unique } from "../../lib/unique";

import { menu as cm, options, title as t } from "../config";
import { notify } from "../install";

// config

const add: (ui: UI, glob: string, skipWarning?: boolean) => Promise<void> = async (ui: UI, glob: string, skipWarning: boolean = false) => {
    const files: string[] = get(`${ui}Backgrounds`) as string[];
    files.push(glob);
    await update(`${ui}Backgrounds`, files.filter(unique), undefined, skipWarning);
    skipWarning || cm({label: '␀', ui}); // reopen menu
};

const replace: (ui: UI, old: string, glob: string, remove?: boolean) => Promise<void> = async (ui: UI, old: string, glob: string) => {
    const files: string[] = get(`${ui}Backgrounds`) as string[];
    for(let i = 0, l = files.length; i < l; i++)
        if(files[i] === old)
            files[i] = glob;
    await update(`${ui}Backgrounds`, files.filter(unique), undefined, old === glob);
    cm({label: '␀', ui}); // reopen menu
};

const remove: (ui: UI, glob: string) => Promise<void> = async (ui: UI, glob: string) => {
    await update(`${ui}Backgrounds`, (get(`${ui}Backgrounds`) as string[]).filter((f) => f !== glob).filter(unique));
    cm({label: '␀', ui}); // reopen files
};

// exts

export const extensions: () => string[] = () => ["png", "jpg", "jpeg", "webp", "gif", "bmp", "svg"];

// update

const updateItem: (ui: UI, item: CommandQuickPickItem) => void = (ui: UI, item: CommandQuickPickItem) => {
    showInputBox({
        title: `Update ${item!.value}`,
        placeHolder: "File path, glob, or URL, leave blank to remove",
        value: item!.value ?? "",
        prompt: "Use only '/' for directories, '\\' is reserved for escape characters. Leave this field blank to remove.",
        validateInput: (value: string) => {
            if(value.startsWith("file://"))
                return "Do not include 'file://' as part of the file path";
            else if(value.startsWith("http://"))
                return "Images must be served over HTTPS";
            else
                return null;
        },
        handle: (value: string) => {
            if(value.trim().length === 0)
                remove(ui, item.value!);
            else
                replace(ui, item.value!, value);
        }
    });
};

// files

export const menu: (item: CommandQuickPickItem) => void = (item: CommandQuickPickItem) => {
    // existing items
    const items: CommandQuickPickItem[] = (get(`${item.ui!}Backgrounds`) as string[])
        .filter(unique)
        .map(file => quickPickItem({
            label: file.replace(/(\${\w+})/g, "\\$1"),
            value: file,
            ui: item.ui,
            description: `${str.s(glob.count(file), "matching file")}`,
            handle: (item: CommandQuickPickItem) => updateItem(item.ui!, item)
        }));

    // show menu
    showQuickPick([
        // existing items
        ...items,
        separator(),
        // add
        quickPickItem({
            label: "$(file-add) Add a File",
            ui: item.ui!,
            handle: (item: CommandQuickPickItem) => {
                vscode.window.showOpenDialog({
                    canSelectFiles: true,
                    canSelectFolders: false,
                    canSelectMany: true,
                    openLabel: "Select Image",
                    filters: {"Images": extensions()}
                }).then((files?: vscode.Uri[]) => {
                    if(files){
                        let promise: Promise<void> = Promise.resolve();
                        for(const file of files)
                            promise = promise.then(() => add(item.ui!, file.fsPath.replace(/\\/g, '/'), true)); // append promise to chain
                        promise = promise
                            .then(() => files.length > 0 && notify())
                            .then(() => cm({label: '␀', ui: item.ui!})) // reopen menu
                    }
                });
            }
        }),
        quickPickItem({
            label: "$(file-directory-create) Add a Folder",
            ui: item.ui!,
            handle: (item: CommandQuickPickItem) => {
                vscode.window.showOpenDialog({
                    canSelectFiles: false,
                    canSelectFolders: true,
                    canSelectMany: true,
                    openLabel: "Select Folder"
                }).then((files?: vscode.Uri[]) => {
                    if(files){
                        let promise: Promise<void> = Promise.resolve();
                        for(const file of files)
                            promise = promise.then(() => add(item.ui!, `${file.fsPath.replace(/\\/g, '/')}/**`, true)); // append promise to chain
                        promise = promise
                            .then(() => files.length > 0 && notify())
                            .then(() => cm({label: '␀', ui: item.ui!})) // reopen menu
                    }
                });
            }
        }),
        quickPickItem({
            label: "$(kebab-horizontal) Add a Glob",
            ui: item.ui!,
            handle: (item: CommandQuickPickItem) => {
                vscode.window.showInputBox({
                    title: "Add File",
                    placeHolder: "File path or glob",
                    prompt: "Add a file or a glob. Use only '/' for directories, '\\' is reserved for escape characters.",
                    validateInput: (value: string) => {
                        if(value.startsWith("file://"))
                            return "Do not include 'file://' as part of the file path";
                        else if(value.startsWith("http://") || value.startsWith("https://"))
                            return "Image URLs do not support glob, use Add URL option"
                        else
                            return null;
                    }
                }).then((glob?: string) => {
                    if(glob)
                        add(item.ui!, glob);
                });
            }
        }),
        quickPickItem({
            label: "$(ports-open-browser-icon) Add a URL",
            ui: item.ui!,
            handle: (item: CommandQuickPickItem) => {
                vscode.window.showInputBox({
                    title: "Add URL",
                    placeHolder: "Image URL",
                    prompt: "Add a image URL. Must be served over HTTPS",
                    validateInput: (value: string) => {
                        if(value.startsWith("file://"))
                            return "File URLs not accepted, use Add File option";
                        else if(value.startsWith("http://"))
                            return "Images must be served over HTTPS";
                        else if(value.startsWith("https://"))
                            return null;
                        else
                            return "Invalid URL";
                    }
                }).then((url?: string) => {
                    if(url)
                        add(item.ui!, url);
                });
            }
        }),
        ... items.length > 0 ? [
            separator(),
            quickPickItem({
                label: "$(lightbulb) To modify or remove an image, select the row and press enter",
                ui: item.ui!,
                handle: (item: CommandQuickPickItem) => menu(item)
            })
        ] : []
    ],
    {
        ...options,
        title: t("Files", item.ui!),
        placeHolder: "Files"
    });
};