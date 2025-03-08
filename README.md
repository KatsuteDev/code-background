<div id="top" align="center">
    <br>
    <a href="https://github.com/KatsuteDev/Background#readme">
        <img alt="logo" width="100" height="100" src="https://raw.githubusercontent.com/KatsuteDev/Background/main/assets/icon.png">
    </a>
    <h3>Background</h3>
    <h4>The most advanced background image extension for VSCode</h4>
    <h5>Windows + Mac + Linux</h5>
    <a href="https://marketplace.visualstudio.com/items?itemName=katsute.code-background"><img alt="rating" src="https://img.shields.io/visual-studio-marketplace/stars/katsute.code-background?style=for-the-badge&logo=visualstudiocode&labelColor=252526&color=0098FF&label=Rating"></a>
    <a href="https://marketplace.visualstudio.com/items?itemName=katsute.code-background"><img alt="installs" src="https://img.shields.io/visual-studio-marketplace/i/katsute.code-background?style=for-the-badge&logo=visualstudiocode&labelColor=252526&color=0098FF&label=Installs"></a>
    <a href="https://marketplace.visualstudio.com/items?itemName=katsute.code-background"><img alt="downloads" src="https://img.shields.io/visual-studio-marketplace/d/katsute.code-background?style=for-the-badge&logo=visualstudiocode&labelColor=252526&color=0098FF&label=Downloads"></a>
</div>

<br>

Add multiple background images for the window, editors, sidebars, or the panel. Load backgrounds from file, [glob](https://github.com/isaacs/node-glob#glob-primer), or URL. Transition between multiple background images.

<div align="center">
    <img alt="editor background" src="https://raw.githubusercontent.com/KatsuteDev/Background/main/assets/editor.gif">
</div>

## Installation

 - Install from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=katsute.code-background).
 - Install directly from VSCode using the id [`katsute.code-background`](https://marketplace.visualstudio.com/items?itemName=katsute.code-background).

Customize using the <kbd>Background: Configuration</kbd> command or press the **Background** button in the bottom right to access the configuration menu.

Install using the <kbd>Background: Install</kbd> command or press the **Install** button in the configuration menu to install the background.

## Features

#### Multiple Backgrounds

Add background images for the whole window, editors, sidebars, or the panel. Transition between multiple background images.

<div align="center">
    <h6>Full Window</h6>
    <img src="https://raw.githubusercontent.com/KatsuteDev/Background/main/assets/window.gif">
</div>
<br>
<div align="center">
    <h6>Editor, Sidebar, and Terminal</h6>
    <img src="https://raw.githubusercontent.com/KatsuteDev/Background/main/assets/editor.gif">
</div>
<br>
<div align="center">
    <h6>Slideshow</h6>
    <img src="https://raw.githubusercontent.com/KatsuteDev/Background/main/assets/transition.gif">
</div>

#### Configuration Menu

Use the <kbd>Background: Configuration</kbd> command or press the **Background** button in the bottom right to access the configuration menu.

<div align="center">
    <img src="https://raw.githubusercontent.com/KatsuteDev/Background/main/assets/configuration.gif">
</div>

#### Glob, URL, and Environment Variable Support

Add background images by file, folder, or URL. Supports [glob](https://github.com/isaacs/node-glob#glob-primer) and [environment variables](#environment-variables).

<div align="center">
    <img src="https://raw.githubusercontent.com/KatsuteDev/Background/main/assets/glob.gif">
</div>

<div align="right"><a href="#top"><code>▲</code></a></div>

## Commands

| Command | Description |
|:--|:--|
|<kbd>Background: Install</kbd>|Installs and enables the background|
|<kbd>Background: Uninstall</kbd>|Uninstalls and disables the background|
|<kbd>Background: Reload</kbd>|Randomizes the current background|
|<kbd>Background: Configuration</kbd>|Opens the configuration menu|
|<kbd>Background: Changelog</kbd>|Opens the changelog|

<div align="right"><a href="#top"><code>▲</code></a></div>

## Configuration

Use the <kbd>Background: Configuration</kbd> command or press the **Background** button in the bottom right to access the configuration menu.

|Background|Description|
|:--|:--|
|Window Backgrounds|The list of files or globs to use for the window background image|
|Editor Backgrounds|The list of files or globs to use for editor background images|
|Sidebar Backgrounds|The list of files or globs to use for the sidebar background images|
|Panel Backgrounds|The list of files or globs to use for the panel background image|
|||
|**Style Option**|**Description**|
|Alignment|Background alignment|
|Alignment Value|Background alignment (CSS)|
|Blur|Background blur (CSS)|
|Opacity|Background opacity, 1 is fully visible and 0 is invisible|
|Repeat|Background repeat|
|Size|Background size|
|Size Value|Background size (CSS)|
|Change Time|How often to change the background image in seconds, set to 0 to never change|
|||
|**Advanced Option**|**Description**|
|Auto Install|Automatically install backgrounds on startup|
|Render Content Above Background|Show images, PDFs, and markdown previews on top of the background|
|Use Inverted Opacity|Use an inverted opacity, so 0 is visible and 1 is invisible|
|Smooth Image Rendering|Use smooth image rendering when resizing images instead of pixelated|
|Setting Scope|Where to save background settings - Global or Workspace|
|CSS|Custom CSS|

<div align="right"><a href="#top"><code>▲</code></a></div>

## Environment Variables

If the path is not working, add an additional `/` after the variable.

|Variable|Description|
|:--|:--|
|`${vscode:workspace}`|Current VSCode project folder|
|`${vscode:user}`|VSCode user directory, either `Code/User` or `data/user-data/User`|
|`${user:home}`|Current user's home directory|
|`${...}`|System environment variable|

<div align="right"><a href="#top"><code>▲</code></a></div>

## &nbsp;

### Contributing Locale Updates

Translations from online translators not accepted.

Locale files must use the language name in <https://code.visualstudio.com/docs/getstarted/locales>.

Copy `package.nls.json` to `package.nls.{language}.json` and replace only the values, `{#}` is automatically replaced in the extension.

### API

Add this extension to your `package.json`.

```json
{
    ...
    "extensionDependencies": [
        "katsute.code-background"
    ]
    ...
}
```

Access the api by using:

```js
const background = vscode.extensions.getExtension("katsute.code-background").exports;
```

 * `install(): void`

   Runs the `Background: Install` command.
 * `uninstall(): void`

   Runs the `Background: Uninstall` command.
 * `reload(): void`

   Runs the `Background: Reload` command.
 * `get(ui): string[]?`
   * `ui` : Background to get from; either `window`, `editor`, `sidebar`, `panel`.

   Returns an array of globs for the specified background.
 * `add(ui, glob): Promise<boolean>`
   * `ui` : Background to add to; either `window`, `editor`, `sidebar`, `panel`.
   * `glob`: Glob to add.

   Returns true if successful.
 * `replace(ui, old, glob): Promise<boolean>`
   * `ui` : Background to replace from; either `window`, `editor`, `sidebar`, `panel`.
   * `old`: Glob to replace.
   * `glob`: Updated glob.

   Returns true if successful.
 * `remove(ui, glob): Promise<boolean>`
   * `ui` : Background to remove from; either `window`, `editor`, `sidebar`, `panel`.
   * `glob`: Glob to remove.

   Returns true if successful.

<div align="right"><a href="#top"><code>▲</code></a></div>

## &nbsp;

This extension is released under the [GNU General Public License (GPL) v2.0](https://github.com/KatsuteDev/Background/blob/main/LICENSE).