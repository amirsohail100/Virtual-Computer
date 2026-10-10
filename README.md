# Windows 11 Web (Educational Prototype)

Browser me chalne wala Windows 11 jaisa desktop — sirf **HTML, CSS aur JavaScript**. Koi install, build ya server zaroori nahi.

> Ye project sirf **education aur learning** ke liye hai. Microsoft se koi sambandh nahi hai. Details `LICENSE` me.

## Kaise chalayein
1. Zip extract karo.
2. `index.html` ko double-click karke browser me kholo.
3. (Optional) local server: `python -m http.server 8000` → http://localhost:8000
4. Online dalna ho to poora folder GitHub Pages / Netlify / Vercel pe upload karo. Jo bhi link kholega use ye desktop dikhega.

## Version history
**v0.3**
- **Naya wallpaper:** layered "silk" Bloom (dark + light) aur Glow — Windows 11 ke default wallpapers jaisa look
- **Apna wallpaper lagao:** Settings > Personalization > Browse photos se PC se image upload karo (Fill / Fit / Stretch / Tile / Center). Image desktop pe drag-drop karke bhi wallpaper ban jata hai. Custom wallpapers delete bhi kar sakte ho
- **File Explorer redesign:** Windows 11 toolbar (New, Cut, Copy, Paste, Rename, Share, Delete, Sort, View), back/forward/up, breadcrumb address bar, search box, sidebar tree, rangeen Desktop/Documents/Downloads/Music/Pictures/Videos folders, C: aur D: drives with usage bar ("25.6 GB free of 99.8 GB"), status bar. Real kaam: folder/file banana, copy-cut-paste, rename, delete (Recycle Bin me jata hai)
- **Start menu redesign:** wide layout, "Search for apps, settings, and documents", Pinned grid (6 columns) + "All apps" A–Z list, Recommended (recent files), user + power menu (Lock / Restart / Shut down). Search apps aur files dono dhoondhta hai
- **Naye apps:** Mail, Calendar (events), Microsoft Store (demo), Photos, Clock (world clock, stopwatch, timer), Camera, Weather (demo), Recycle Bin
- **Taskbar:** by default Explorer, Edge, Store, Mail, Notepad, Settings pinned. Right-click karke Pin / Unpin kar sakte ho (Start menu ke app pe bhi)
- Window buttons (minimize / maximize / close) ab SVG icons hain

**v0.2**
- Naya Windows 11 "Bloom" style wallpaper (dark + light), lock screen pe bhi wahi wallpaper
- Taskbar me asli Windows 11 Start logo (4 squares)
- Taskbar saaf: sirf Start button + jo apps user ne khole hain. Search icon aur extra pinned apps hata diye
- Tray panels (Windows 11 jaise):
  - **^ (hidden icons)** — chhote icons ka popup
  - **ENG IN** — Keyboard layout selector
  - **Wi-Fi / Volume** — Quick settings: Wi-Fi (network list ke saath), Airplane mode, Night light, Mobile hotspot, Focus assist, Accessibility, volume slider, edit aur settings buttons
  - **Date / Time** — Notifications (Clear all, dismiss, Focus assist) + Calendar (mahina badalna, collapse)
- Notification system: Notepad save, Wi-Fi connect jaise events pe toast + notification center + badge count
- Right-click menus: desktop aur taskbar pe Windows 11 style menu
- Default dark theme

**v0.1** — pehla prototype: lock screen, window manager, Start menu, 8 apps.

## Features
- Lock screen, desktop icons, wallpapers (4), dark / light mode, accent colour
- Window manager: drag, resize, minimize, maximize (titlebar double-click), close
- Apps: File Explorer (virtual files), Notepad (Ctrl+S), Calculator, Settings, Edge-style browser, Paint, Terminal, Task Manager
- Data (files, settings) browser ke `localStorage` me save hota hai

## Folder structure
```
index.html          page layout (lock, desktop, start, tray panels, taskbar)
css/style.css       sabhi styles (themes, windows, flyouts, apps)
js/apps.js          wallpapers (built-in + custom), virtual file system (FS), core apps (APPS)
js/explorer.js      File Explorer (Windows 11 style)
js/apps-extra.js    Mail, Calendar, Store, Photos, Clock, Camera, Weather, Recycle Bin
js/main.js          OS core: window manager, taskbar, Start, tray panels, notifications, menus
assets/             bloom-dark.svg, bloom-light.svg, glow.svg (wallpapers)
LICENSE             education / learning use only
```

## Customize kaise karein
- **Naya app:** `js/apps.js` me `APPS` object me ek entry add karo (`name, icon, w, h, render`). Start menu me apne aap aa jayega.
- **Taskbar pe app pin karna:** taskbar ya Start menu me app pe right-click → Pin to taskbar. (Default list `js/main.js` me `pinned` me hai.)
- **Naya built-in wallpaper:** `BUILTIN_WALLS` (`js/apps.js`) me add karo.
- **Notification bhejna:** `OS.notify('App name', 'Title', 'Message')`.

## Aage ke features (ideas)
Window snap layouts, Widgets panel, Task View + virtual desktops, real file upload/download in Explorer, multi-select, Microsoft Store jaisa app installer, multi-user login, taskbar app previews, drag-drop desktop icons.

## License
Sirf education aur learning ke liye. Details `LICENSE` file me.
