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
