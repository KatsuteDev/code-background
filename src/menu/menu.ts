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

import { platform, release } from "os";
import { ConfigurationTarget, Uri, commands, env, version } from "vscode";

import { ConfigurationKey, pkg } from "../extension/package";
import { UI, configuration, get, target, update } from "../extension/config";

import { count } from "../lib/glob";
import { appendIf, capitalize } from "../lib/string";
import { CommandQuickPickItem, quickPickItem, separator, showQuickPick } from "../lib/vscode"

import { show as fileMenu } from "./file";
import { show as alignMenu } from "./align";
import { show as blurMenu } from "./blur";
import { show as opacityMenu } from "./opacity";
import { show as repeatMenu } from "./repeat";
import { show as sizeMenu } from "./size";
import { show as timeMenu } from "./time";
import { format } from "../lib/l10n";

const issueUrl: string = `https://github.com/KatsuteDev/Background/issues/new?template=bug.yml&os=${encodeURIComponent(`${platform()} ${release()}`)}&vs=${encodeURIComponent(version)}&version=${encodeURIComponent(pkg.version)}`;
const featureUrl: string = "https://github.com/KatsuteDev/Background/issues/new?template=feature.yml";

// main menu

export const optionMenu: () => void = () =>
    showQuickPick([
        // backgrounds
        getQuickPick("window", "window"),
        getQuickPick("editor", "multiple-windows"),
        getQuickPick("sidebar", "layout-sidebar-left"),
        getQuickPick("panel", "layout-panel"),
        // commands
        separator(),
        quickPickItem({
            alwaysShow: true,
            label: `$(check) ${format("background.menu.install")}`,
            handle: () => commands.executeCommand("background.install")
        }),
        quickPickItem({
            alwaysShow: true,
            label: `$(close) ${format("background.menu.uninstall")}`,
            handle: () => commands.executeCommand("background.uninstall")
        }),
        quickPickItem({
            alwaysShow: true,
            label: `$(refresh) ${format("background.menu.reload")}`,
            handle: () => commands.executeCommand("background.reload")
        }),
        quickPickItem({
            label: `$(settings-gear) ${format("background.menu.more")}`,
            handle: () => moreMenu()
        }),
        separator(),
        quickPickItem({
            label: `$(question) ${format("background.menu.help")}`,
            handle: () => commands.executeCommand("background.help")
        }),
    ], {
        title: "Background" + (target() === ConfigurationTarget.Workspace ? ` (${format("background.configuration.settingScopeWorkspace")})`: ""),
        matchOnDescription: true
    });

// more options

const moreMenu: (selected?: number) => void = (selected?: number) => {
    const descriptionBool: (key: ConfigurationKey) => string = (key: ConfigurationKey) => `[$(${get(key) ? "check" : "close"})]`;
    const handleBool: (key: ConfigurationKey, index: number, skipNotification?: boolean) => (item: CommandQuickPickItem) => void = (key: ConfigurationKey, index: number, skipNotification?: boolean) => () => update(key, !get(key), undefined, skipNotification).then(() => moreMenu(index));

    let i = 0;

    showQuickPick([
        quickPickItem({
            label: format("background.configuration.autoInstall"),
            description: descriptionBool("autoInstall"),
            detail: format("background.configuration.autoInstallDescription"),
            handle: handleBool("autoInstall", i++, true)
        }),
        quickPickItem({
            label: format("background.configuration.renderContentAboveBackground"),
            description: descriptionBool("renderContentAboveBackground"),
            detail: format("background.configuration.renderContentAboveBackgroundDescription"),
            handle: handleBool("renderContentAboveBackground", i++)
        }),
        quickPickItem({
            label: format("background.configuration.useInvertedOpacity"),
            description: descriptionBool("useInvertedOpacity"),
            detail: format("background.configuration.useInvertedOpacityDescription"),
            handle: handleBool("useInvertedOpacity", i++)
        }),
        quickPickItem({
            label: format("background.configuration.smoothImageRendering"),
            description: descriptionBool("smoothImageRendering"),
            detail: format("background.configuration.smoothImageRenderingDescription"),
            handle: handleBool("smoothImageRendering", i++)
        }),
        quickPickItem({
            label: format("background.configuration.settingScope"),
            description: `[${get("settingScope")}]`,
            detail: format("background.configuration.settingScopeDescription"),
            handle: () => update("settingScope", get("settingScope") === "Global" ? "Workspace" : "Global").then(() => moreMenu(i++))
        }),
        separator(),
        quickPickItem({
            label: `$(output) ${format("background.command.changelog")}`,
            handle: () => commands.executeCommand("background.changelog")
        }),
        quickPickItem({
            label: `$(bug) ${format("background.menu.more.report")}`,
            // unfixed bug in vscode https://github.com/microsoft/vscode/issues/85930
            // @ts-ignore
            handle: () => env.openExternal(`${issueUrl}&settings=${encodeURIComponent("```json\n" + JSON.stringify(configuration(), null, 4) + "\n```")}`)
        }),
        quickPickItem({
            label: `$(add) ${format("background.menu.more.feature")}`,
            handle: () => env.openExternal(Uri.parse(featureUrl))
        }),
    ],
    {
        title: format("background.menu.more"),
        matchOnDescription: true,
        matchOnDetail: true
    },
     () => optionMenu(),
    selected);
}

// quick pick

const getQuickPick: (ui: UI, icon: string) => CommandQuickPickItem = (ui: UI, icon: string) => {
    // description
    const backgrounds: string[] = get(`${ui}Backgrounds`);
    const description: string = `${backgrounds.length} Globs (${count(backgrounds)} Backgrounds)`;

    // detail
    let detail: string =
        `${get("backgroundAlignment", {ui})} ${format("background.menu.align.title")}`  + " • " +
        `${get("backgroundBlur",      {ui})} ${format("background.menu.blur.title")}`   + " • " +
        `${get("backgroundOpacity",   {ui})} ${format("background.menu.opacity.title")}`+ " • " +
        `${get("backgroundRepeat",    {ui})} ${format("background.menu.repeat.title")}` + " • " +
        `${get("backgroundSize",      {ui})} ${format("background.menu.size.title")}`;

    // only include time if nonzero (enabled)
    const time: number = +get("backgroundChangeTime", {ui});

    if(time > 0)
        detail += ` • ${format("background.menu.second", time)}`;

    // quick pick
    return quickPickItem({
        label: `$(${icon}) ${capitalize(ui)}`,
        description,
        detail,
        ui,
        handle: () => backgroundMenu(ui)
    });
}

// ui menu

export const backgroundMenu: (ui: UI) => void = (ui: UI) =>
    showQuickPick([
        quickPickItem({
            label: `$(file-media) ${format("background.menu.file")}`,
            description: `${get(`${ui}Backgrounds`).length} Globs (${count(get(`${ui}Backgrounds`))} Backgrounds)`,
            detail: format("background.menu.fileDetail"),
            ui,
            handle: () => fileMenu(ui)
        }),
        // options
        separator(),
        quickPickItem({
            label: `$(arrow-both) ${format("background.configuration.alignment")}`,
            description: `${appendIf(get("backgroundAlignment", {ui}), s => s === "Manual", ` (${get("backgroundAlignmentValue", {ui})})`)}`,
            detail: format("background.menu.alignmentDetail"),
            ui,
            handle: () => alignMenu(ui)
        }),
        quickPickItem({
            label: `$(eye) ${format("background.configuration.blur")}`,
            description: `${get("backgroundBlur", {ui})}`,
            detail: format("background.menu.blurDetail"),
            ui,
            handle: () => blurMenu(ui)
        }),
        quickPickItem({
            label: `$(color-mode) ${format("background.configuration.opacity")}`,
            description: `${get("backgroundOpacity", {ui})}`,
            detail: format("background.menu.opacityDetail"),
            ui,
            handle: () => opacityMenu(ui)
        }),
        quickPickItem({
            label: `$(multiple-windows) ${format("background.configuration.repeat")}`,
            description: `${get("backgroundRepeat", {ui})}`,
            detail: format("background.menu.repeatDetail"),
            ui,
            handle: () => repeatMenu(ui)
        }),
        quickPickItem({
            label: `$(screen-full) ${format("background.configuration.size")}`,
            description: `${appendIf(get("backgroundSize", {ui}), s => s === "Manual", ` (${get("backgroundSizeValue", {ui})})`)}`,
            detail: format("background.menu.sizeDetail"),
            ui,
            handle: () => sizeMenu(ui)
        }),
        quickPickItem({
            label: `$(clock) ${format("background.configuration.time")}`,
            description: format("background.menu.second", +get("backgroundChangeTime", {ui})),
            detail: format("background.menu.timeDetail"),
            ui,
            handle: () => timeMenu(ui)
        })
    ], {
        title: `${capitalize(ui)} Background` + (target() === ConfigurationTarget.Workspace ? ` (${"background.configuration.settingScopeWorkspace"})` : ""),
        matchOnDescription: true,
        matchOnDetail: true
    }, optionMenu);

// title

export const title: (title: string, ui?: UI) => string = (title: string, ui?: UI) =>
    (ui ? `${capitalize(ui)} ` : '') + `Background - ${title}`;