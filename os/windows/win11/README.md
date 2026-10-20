# Windows 11 (Virtual)

A Windows 11 style desktop that runs in your browser. For learning only — it is not affiliated with Microsoft.

## Open it
Open the root `index.html` and click **Windows 11**. Click the lock screen to enter. To go back: Start → power button → **Switch OS**.

## Features
- **Taskbar:** centered Start button, pinned and open apps (right-click to Pin or Unpin), tray with hidden icons, keyboard layout, quick settings and a notifications + calendar panel.
- **Start menu:** Pinned grid, All apps, Recommended files, search for apps and files, Lock / Restart / Shut down / Switch OS.
- **File Explorer:** toolbar, sidebar tree, drives with usage bars, details and large-icon views, search, copy / cut / paste, inline rename and the Recycle Bin.
- **Right-click menu** (desktop and every folder): View, Sort by, Group by, **New** (Folder, Shortcut, Access Database, Bitmap image, Word, PowerPoint, Publisher, Text Document, Excel Worksheet, Compressed folder), Properties, Open in Windows Terminal, Open with Code.
- **Run dialog:** open apps, drives or websites by name.
- **Task View, show desktop and window snap** (drag a title bar to a screen edge, or use the shortcuts).
- **Wallpapers:** Bloom (dark and light), Glow and Sunrise, or upload your own photo (drag and drop works too). Dark and light themes and accent colours.

## Apps (17)
Notepad, Calculator, Settings, Microsoft Edge, Paint, Terminal, Task Manager, File Explorer, Mail, Calendar, Microsoft Store, Photos, Clock, Camera, Weather, Recycle Bin, Keyboard Shortcuts.

## Keyboard shortcuts
`Ctrl+Alt+key` works like `Win+key` (browsers cannot capture the Windows key). For example `Ctrl+Alt+E` opens Explorer and `Ctrl+Alt+R` opens Run. The full list is in [`docs/SHORTCUTS.md`](../../docs/SHORTCUTS.md) and in the **Keyboard Shortcuts** app.

## Files
| File | Job |
|---|---|
| `index.html` | Page layout, panels, Task View and dialog containers |
| `css/style.css` | Themes, windows, taskbar, menus and app styles |
| `js/main.js` | Window manager, taskbar, Start, tray panels, menus, Run, Task View and shortcuts |
| `js/apps.js` | Wallpapers, virtual file system, "New" file types and core apps |
| `js/explorer.js` | File Explorer |
| `js/apps-extra.js` | Mail, Calendar, Store, Photos, Clock, Camera, Weather, Recycle Bin and Keyboard Shortcuts |
| `assets/` | `bloom-dark.svg`, `bloom-light.svg`, `glow.svg` |

## Add an app
Open `js/apps-extra.js` and add an entry:
```js
APPS.hello = { name: 'Hello', icon: '👋', w: 360, h: 240,
  render(body) { body.innerHTML = '<div style="padding:20px">Hello from my app!</div>'; } };
```
It shows up in Start → All apps automatically. To pin it by default, add its id to the `pinned` list in `js/main.js`.

## Data
Files, settings, pinned apps and wallpapers are saved in your browser (`localStorage`, keys start with `w11_`).
