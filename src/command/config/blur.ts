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

import { showInputBox } from "../../vs/inputbox";
import { get, update } from "../../vs/vsconfig";
import { CommandQuickPickItem } from "../../vs/quickpick";

import { menu as cm, options } from "../config";
import { capitalize } from "../../lib/str";

//

const invalidCSS: RegExp = /[^\w.% +-]/gmi;

export const menu: (item: CommandQuickPickItem) => void = (item: CommandQuickPickItem) => {
    const current: string = get("backgroundBlur", item.ui!) as string;

    showInputBox({
        title: `${capitalize(item.ui!)} ${options.title} - Blur`,
        placeHolder: "Background blur",
        value: current,
        prompt: `Background blur (${current})`,
        validateInput: (value: string) => value.match(invalidCSS) ? "Invalid CSS" : null,
        handle: (value: string) => {
            if(!value.match(invalidCSS)){
                update("backgroundBlur", value, item.ui!);
                cm(item); // reopen menu
            }
        }
    });
};