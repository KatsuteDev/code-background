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

import { fileSync } from "tmp";
import { window } from "vscode";
import { platform, release } from "os";
import { exec } from "@vscode/sudo-prompt";

import { PathLike, readFileSync, writeFileSync } from "fs";

import { reload } from "../lib/vscode";
import { copyCommand, generateChecksum } from "../lib/file";

import { clean, inject } from "./inject"
import { installDelay, setActive } from "../extension";
import { format } from "../lib/l10n";

export const install: (workbench: PathLike, product: PathLike, force?: boolean) => void = (workbench: PathLike, product: PathLike, force: boolean = false) => {
    write(workbench, product, inject(readFileSync(workbench, "utf-8")), force);
}

export const uninstall: (workbench: PathLike, product: PathLike, force?: boolean) => void = (workbench: PathLike, product: PathLike, force: boolean = false) => {
    write(workbench, product, clean(readFileSync(workbench, "utf-8")), force);
}

// write

const workbenchChecksum: RegExp = /(?<=^\s*"vs\/workbench\/workbench\.desktop\.main\.js\": \").*(?=\",\s*$)/gm;

const write: (workbench: PathLike, product: PathLike, content: string, force?: boolean) => void = (workbench: PathLike, product: PathLike, content: string, force: boolean = false) => {
    const pJson: string = readFileSync(product, "utf-8").replace(workbenchChecksum, generateChecksum(content));

    try{ // write changes
        setActive(true);

        let changed: boolean = force;
        if(readFileSync(workbench, "utf-8") !== content){
            writeFileSync(workbench, content, "utf-8");
            changed = true;
        }
        if(readFileSync(product, "utf-8") !== pJson){
            writeFileSync(product, pJson, "utf-8");
            changed = true;
        }

        if(changed)
            setTimeout(reload, installDelay); // artificial delay because VSCode is not updating the background for no reason
        else
            setActive(false);
    }catch(error: any){
        const snap: boolean = platform() === "linux" &&
        /* also in         */ workbench.toString().replace(/\\/g, '/').includes("/snap/") &&
        /* extension.ts    */ product.toString().replace(/\\/g, '/').includes("/snap/");

        if(snap){
            window.showErrorMessage(format("background.extension.writer.snapError"));
        }else{
            window.showWarningMessage(
                format("background.extension.writer.adminAsk"),
                {
                    detail: `${format("background.extension.writer.adminPrompt")}\n\n${error.message}`,
                    modal: true
                },
                "Yes"
            ).then((value?: string) => {
                if(value === "Yes"){
                    // use temp files
                    const workbenchTemp = fileSync().name;
                    writeFileSync(workbenchTemp, content, "utf-8");
                    const productTemp = fileSync().name;
                    writeFileSync(productTemp, pJson, "utf-8");

                    // sudo copy
                    const command: string = copyCommand([
                        [workbenchTemp, workbench],
                        [productTemp, product]
                    ]);
                    exec(command, { name: "VSCode Extension Host" }, (err: any) => {
                        if(err){
                            window.showErrorMessage(
                                format("background.extension.writer.failedWrite"),
                                {
                                    detail: `OS: ${platform()} ${release()}\nCMD: ${command}\n\n${err.name}\n${err.message}`.trim(),
                                    modal: true
                                }
                            );
                            setActive(false);
                        }else{
                            reload();
                        }
                    });
                }else{
                    setActive(false);
                }
            });
        }
    }
}