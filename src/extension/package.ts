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

export const pkg = Object.freeze(require("../../package.json")); // do not convert to import

export type ConfigurationKey =
    "windowBackgrounds" |
    "editorBackgrounds" |
    "sidebarBackgrounds" |
    "panelBackgrounds" |
    "backgroundAlignment" |
    "backgroundAlignmentValue" |
    "backgroundBlur" |
    "backgroundOpacity" |
    "backgroundRepeat" |
    "backgroundSize" |
    "backgroundSizeValue" |
    "backgroundChangeTime" |
    "autoInstall" |
    "renderContentAboveBackground" |
    "useInvertedOpacity" |
    "settingScope" |
    "smoothImageRendering" |
    "CSS";

export type Contributes = {
    commands: [{
        command: string,
        title: string,
        category: string
    }],
    configuration: {
        title: string,
        order: number,
        properties: {
            [key: string]: {
                markdownDescription: string,
                type: string,
                order: number
                default: any | any[],
                minItems?: number,
                maxItems: number,
                items?: {
                    type: string,
                    editPresentation?: string,
                    enum?: string[],
                    enumDescriptions?: string[]
                    minimum?: number,
                    maximum?: number,
                    pattern?: string,
                }
            }
        }
    }
}

export type Properties = Contributes["configuration"]["properties"][0];

export const getConfigurationProperty: (key: ConfigurationKey) => Properties = (key: ConfigurationKey) => pkg.contributes.configuration.properties[`background.${key}`];