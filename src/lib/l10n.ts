/*
 * Copyright (C) 2024 Katsute <https://github.com/Katsute>
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

import { env } from "vscode";

type LocaleSet = {[key: string]: string};

// https://code.visualstudio.com/docs/getstarted/locales
const Locales: {[key: string]: LocaleSet} = Object.freeze({
    "en": Object.freeze(require("../../package.nls.json"))
});

const getString: () => LocaleSet = () => Locales[env.language] ?? {};

export const format: (key: string, ...args: any[]) => string = (key: string, ...args: any[]): string => {
    const str: string = getString()[key] ?? getString()["en"] ?? key;
    return str.replace(/{(\d+)}/g, (m, i) => args[i] ?? m);
}