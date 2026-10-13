# Virtual Computer

Browser ke andar poora operating system chalane wala project — sirf **HTML, CSS aur JavaScript**. Koi install, build ya server zaroori nahi.

Home page pe user apna OS chunta hai, aur wahi khul jata hai.

| OS | Status |
|---|---|
| Windows 11 | ✅ Available |
| macOS | ✅ Available |
| Windows XP | 🕒 Coming soon |
| Ubuntu Linux | 🕒 Coming soon |
| Kali Linux | 🕒 Coming soon |
| Android | 🕒 Coming soon |
| iPhone (iOS) | 🕒 Coming soon |

> Ye project sirf **education aur learning** ke liye hai. Microsoft, Apple ya Google se koi sambandh nahi hai. Details `LICENSE` me.

## Kaise chalayein
1. Zip extract karo.
2. Root ke `index.html` ko browser me kholo (home page).
3. **Windows 11** ya **macOS** card pe click karo.
4. Wapas aane ke liye: Windows me Start menu → power button → **Switch OS**. macOS me Apple menu (menu bar ka sabse left icon) → **Switch OS…**.

Local server (optional): `python -m http.server 8000` → http://localhost:8000
Online dalna ho to poora folder GitHub Pages / Netlify / Vercel pe upload karo.

## Folder structure
```
index.html              home page (OS chunne wala)
css/home.css            home page styles
js/home.js              OS list (SYSTEMS) + launch logic
LICENSE                 education / learning use only
CHANGELOG.md            version history
docs/                   ARCHITECTURE, ADDING-AN-OS, SHORTCUTS, ROADMAP
os/
  windows/              Windows 11 (ready)
    index.html, css/style.css
    js/main.js          OS core: windows, taskbar, Start, tray panels
    js/apps.js          wallpapers, file system, core apps
    js/explorer.js      File Explorer
    js/apps-extra.js    Mail, Calendar, Store, Photos, Clock, Camera, Weather, Recycle Bin
    assets/             bloom-dark, bloom-light, glow (wallpapers)
  mac/                  macOS (ready)
    index.html, css/style.css
    js/main.js          OS core: windows, menu bar, Dock, Launchpad, Spotlight, Control Center, Notification Center
    js/apps.js          wallpapers, file system, sab apps
    assets/             waves, hills, ribbons (wallpapers)
  winxp/ ubuntu/ kali/ android/ iphone/   (aage banenge)
```

## Naya OS kaise add karein
1. `os/<naam>/` folder banao aur usme `index.html` rakho (har OS apne folder me poora self-contained rahe).
2. `js/home.js` ke `SYSTEMS` me us OS ki entry me `ready: true` aur `path: 'os/<naam>/index.html'` likho.
3. Us OS me ek "Switch OS" option do jo `../../index.html` pe le jaye.

## Windows 11 — features
- Lock screen, desktop icons, 4 wallpapers + apna wallpaper upload (drag-drop bhi), dark/light mode, accent colour
- Taskbar (pinned + khule apps, right-click Pin/Unpin), Start menu (Pinned, All apps, Recommended, search), tray panels (hidden icons, keyboard layout, quick settings, notifications + calendar)
- Window manager: drag, resize, minimize, maximize, close
- Apps: File Explorer, Notepad, Calculator, Settings, Edge-style browser, Paint, Terminal, Task Manager, Mail, Calendar, Store (demo), Photos, Clock, Camera, Weather (demo), Recycle Bin, Keyboard Shortcuts
- Explorer / desktop right-click: View, Sort by, Group by, **New** (Folder, Shortcut, Access, Bitmap, Word, PowerPoint, Publisher, Text, Excel, Zip), Properties, Open in Terminal, Open with Code; naya item banate hi naam edit hota hai (inline rename)
- Run dialog, Task View, Show desktop, window snap (title bar ko screen ke kinare le jao)

## macOS — features
- Login screen (koi bhi password chalega), menu bar (Apple menu, app menus File/Edit/View/Window/Help, status icons, date-time), Light / Dark mode, accent colour
- **Dock:** magnification (hover pe icons bade hote hain), running dots, bounce animation, minimized windows, right-click → Keep in Dock / Quit, size aur auto-hide settings
- **Launchpad** (Dock ka rocket icon ya `F4`), **Spotlight** (menu bar ka search icon ya `Ctrl + Space`: apps, files, calculator, web search), **Control Center** (Wi-Fi, Bluetooth, AirDrop, Do Not Disturb, Dark Mode, brightness, sound, Night Shift), **Notification Center** (clock pe click: notifications + calendar + weather)
- Window traffic lights (close / minimize / zoom), drag, resize, double-click titlebar zoom
- Wallpapers: Waves, Dusk Hills, Ribbons + apna photo upload (Fill / Fit / Stretch / Center / Tile), image desktop pe drag-drop bhi
- Apps (23): Finder (sidebar, icon/list view, New Folder, Duplicate, Quick Look, Trash, Applications, Recents, search), TextEdit, Notes, Calculator, Safari-style browser, Calendar (events), Clock (world clock, stopwatch, timer), Weather (demo), Photos, Photo Booth (camera), Terminal, Activity Monitor, System Settings, **Music** (generated tunes), **Messages** (chat with auto-replies), **Mail**, **Maps** (OpenStreetMap, internet chahiye), **Contacts**, **Reminders**, **Stickies**, **Preview** (PC se image kholo), **App Store** (demo), **Keyboard Shortcuts**
- Mission Control, app switcher, Quick Look, window snap (Window menu ya shortcuts), Dock me Messages/Mail/Maps/Music/Reminders/App Store pinned
- Desktop pe right-click: New Folder, Change Desktop Background, Dark/Light mode
- Files, notes, events aur settings browser ke `localStorage` me save hote hain

## Keyboard shortcuts
Browsers khud kuch shortcuts rakh lete hain (Ctrl+W, Ctrl+N, Ctrl+Q, Windows key, Alt+Tab, Alt+F4), isliye virtual OS me ye alag combos hain. Poori list OS ke andar bhi milti hai: Windows me Start → All apps → **Keyboard Shortcuts**, macOS me Help menu → **Keyboard Shortcuts** (Launchpad / Spotlight me bhi).

**Windows** (`Ctrl+Alt+key` = `Win+key`)

| Keys | Kaam |
|---|---|
| `Ctrl+Alt+S` | Start menu + search |
| `Ctrl+Alt+E` | File Explorer |
| `Ctrl+Alt+R` | Run dialog (notepad, calc, cmd, `C:\Users`, website...) |
| `Ctrl+Alt+D` | Desktop dikhao / wapas |
| `Ctrl+Alt+L` | Lock screen |
| `Ctrl+Alt+I` | Settings |
| `Ctrl+Alt+A` | Quick settings |
| `Ctrl+Alt+N` | Notifications + calendar |
| `Ctrl+Alt+T` | Task View |
| `Ctrl+Alt+K` | Task Manager |
| `Ctrl+Alt+M` / `W` | Sab minimize / active window band |
| `Ctrl+Alt+↑ ↓ ← →` | Maximize, restore/minimize, snap left, snap right |
| Explorer: `F2` `Del` `Enter` `F5` `Backspace` `Alt+N` `Alt+Enter` `Ctrl+C/X/V` | Rename, delete, open, refresh, back, new folder, properties, copy/cut/paste |

**macOS** (⌘ = `Alt` Windows keyboard pe, ya asli ⌘ key Mac keyboard pe)

| Keys | Kaam |
|---|---|
| `Ctrl+Space` | Spotlight |
| `F4` | Launchpad |
| `F3` ya `Ctrl+↑` | Mission Control |
| `Alt+J` (Alt pakdo, J dabao) ya `⌘Tab` | App switcher |
| `Alt+Q` `W` `M` `H` `N` `,` | Quit, close window, minimize, hide, new window, Settings |
| `Alt+Shift+M` | Sab minimize |
| `Ctrl+Alt+F` `←` `→` `C` | Zoom, left half, right half, center |
| `Ctrl+Alt+Esc` / `L` / `D` | Force Quit, lock, Dock hide |
| Finder: `Alt+Shift+N` `Alt+Backspace` `Space` `Alt+1/2` `Alt+[ ]` `Alt+↑` `Alt+O` `Alt+Shift+D` `Alt+Shift+F` | New folder, Trash, Quick Look, view, back/forward, up, open, duplicate, search |
| Safari: `Alt+L` `Alt+R` | Address bar, reload |

## Aur padho
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — code ka dhancha
- [`docs/ADDING-AN-OS.md`](docs/ADDING-AN-OS.md) — naya OS kaise jodein
- [`docs/SHORTCUTS.md`](docs/SHORTCUTS.md) — Windows aur macOS ke saare shortcuts
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — aage kya banega
- [`CHANGELOG.md`](CHANGELOG.md) — version history

## Version history
**v0.5.1** — Home page pe Windows XP, Ubuntu Linux aur Kali Linux ke "Coming soon" cards, live "ready / coming soon" counter.
**v0.6** — Windows: Explorer / desktop right-click menu (View, Sort by, Group by, **New** → Folder, Shortcut, Word, Excel, PowerPoint, Access, Publisher, Bitmap, Text, Zip, Properties, Terminal, Code), inline rename, Run dialog, Task View, window snap (drag to edge ya shortcuts), keyboard shortcuts, Keyboard Shortcuts app. macOS: asli apple jaisa menu bar icon, 10 naye apps (Music, Messages, Mail, Maps, Contacts, Reminders, Stickies, Preview, App Store, Keyboard Shortcuts), Mission Control, app switcher, Quick Look, window snap, keyboard shortcuts. LICENSE me macOS ke liye bhi education-only note.
**v0.5** — macOS add hua (`os/mac/`): menu bar, Dock, Launchpad, Spotlight, Control Center, Notification Center, 13 apps, 3 naye wallpapers, custom wallpaper upload. Home page pe macOS card ab "Available".
**v0.4** — Project ka naam Virtual Computer. Home page, Windows `os/windows/` me shift, "Switch OS".
**v0.3** — Win11 Start menu aur File Explorer redesign, custom wallpaper upload, 8 naye apps.
**v0.2** — Bloom wallpaper, tray panels, notifications + calendar.
**v0.1** — Pehla Windows 11 prototype.

## License
Sirf education aur learning ke liye. Details `LICENSE` file me.
