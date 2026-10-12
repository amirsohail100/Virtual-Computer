# macOS (Virtual)

A macOS-style desktop that runs in your browser. For learning only — it is not affiliated with Apple.

## Open it

Open the root `index.html` and click **macOS**. The login screen accepts any password. To go back, use the Apple menu → **Switch OS…**.

## Features

- **Menu bar:** Apple menu, app menus (File, Edit, View, Window, Help), status icons and the date and time.
- **Dock:** icons grow when you hover, running apps get a dot, apps bounce when they open, right-click for Keep in Dock or Quit.
- **Launchpad:** all apps in a grid with search.
- **Spotlight:** search apps and files, calculate (`12*7`) or search the web.
- **Control Center:** Wi-Fi, Bluetooth, AirDrop, Do Not Disturb, Dark Mode, brightness, sound and Night Shift.
- **Notification Center:** click the clock for notifications, a calendar and weather.
- **Windows:** red, yellow and green buttons, drag, resize and double-click the title bar to zoom.
- **Wallpapers:** Waves, Dusk Hills and Ribbons, or upload your own photo (drag and drop works too).

## Apps (13)

Finder, TextEdit, Notes, Calculator, Safari-style browser, Calendar, Clock, Weather (demo data), Photos, Photo Booth (camera), Terminal, Activity Monitor and System Settings.

## Files

| File            | Job                                                             |
| --------------- | --------------------------------------------------------------- |
| `index.html`    | Page layout and overlays                                        |
| `css/style.css` | Light and dark themes, windows, Dock and panels                 |
| `js/apps.js`    | Wallpapers, virtual file system and all apps                    |
| `js/main.js`    | Window manager, menu bar, Dock, Launchpad, Spotlight and panels |
| `assets/`       | `waves.svg`, `hills.svg`, `ribbons.svg`                         |

## Add an app

Open `js/apps.js` and add an entry:

```js
mk("hello", {
  name: "Hello",
  cls: "i-settings",
  icon: "👋",
  w: 360,
  h: 240,
  render(body) {
    body.innerHTML = '<div style="padding:20px">Hello from my app!</div>';
  },
});
```

It appears in Launchpad and Spotlight automatically. Add its id to the Dock list in `js/main.js` to pin it.

## Data

Files, notes, events and settings are saved in your browser (`localStorage`, keys start with `m_`).
