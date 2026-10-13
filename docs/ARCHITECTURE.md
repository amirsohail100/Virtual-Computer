# Architecture

Virtual Computer is plain HTML, CSS and JavaScript. There is no build step and no server.

## Layout
```
index.html, css/home.css, js/home.js   home page (OS picker)
os/<name>/                             one folder per operating system
```
Each OS is **self-contained**: it does not import code from another OS. This keeps one system from breaking another.

## Inside an OS folder
| File | Job |
|---|---|
| `index.html` | Page layout: lock screen, desktop, windows area, panels and overlays |
| `css/style.css` | Theme variables (light / dark), windows, panels and app styles |
| `js/apps.js` | Data and apps: wallpapers, the virtual file system (`FS`) and the `APPS` registry |
| `js/main.js` | OS core: window manager, taskbar or Dock, menus, settings. Exposes one global object, `OS` |

Windows also splits big apps into `explorer.js` and `apps-extra.js`.

## The app contract
An app is an object in the `APPS` registry:
```js
{ name: 'Notes', icon: '📝', w: 720, h: 460, single: false,
  render(body, win, arg) { /* fill `body` with HTML */ } }
```
- `body` is the window content element, `win` has `setTitle()` and `onclose`, and `arg` is optional data (for example a file to open).
- Apps talk to the system through `OS.open()`, `OS.notify()`, `OS.set()` and similar calls. These are looked up when the app runs, so `apps.js` can be loaded before `main.js`.

## Data
- The file system is a nested object: an object is a folder, a string is a file.
- Everything is saved in the browser with `localStorage`. Windows keys start with `w11_`, macOS keys start with `m_`.
- Wallpapers: built-in SVG files plus user uploads. Uploads are scaled down and stored as JPEG data so they fit in `localStorage`.

## Home page
`js/home.js` holds the `SYSTEMS` list. An entry with `ready: true` and a `path` becomes a launchable card.

## Menus, dialogs and overlays
- **Windows:** `OS.menu(x, y, items)` shows a context menu. An item is `{ icon, label, key, fn, disabled, sub }`; `sub` holds a sub-menu. `OS.modal({ title, html, buttons })` shows a dialog (Properties, Run). Task View is an overlay that lists open windows.
- **macOS:** `OS.showCtx(x, y, [[label, fn], ...])` is the context menu. Spotlight, Launchpad, Control Center, Notification Center, Mission Control, the app switcher and Quick Look are overlays that `closeOverlays()` can hide together.
- The shared **New** menu (Folder, Shortcut, Word, Excel, Text, Zip ...) is built by `newMenuItems(path, after)` in `os/windows/js/apps.js` and is used by both the Explorer and the desktop.

## Keyboard shortcuts
Each OS keeps one table, `SC`, in `js/main.js`. A single `keydown` listener finds the matching row and runs it, and the Keyboard Shortcuts app reads the same table through `OS.shortcuts`, so the help screen cannot drift from the real keys. See `SHORTCUTS.md` for the list.

