# Windows 11 Web (Educational Prototype)

Browser me chalne wala Windows 11 jaisa desktop — sirf **HTML, CSS aur JavaScript**. Koi install, build ya server zaroori nahi.

> Ye project sirf **education aur learning** ke liye hai. Microsoft se koi sambandh nahi hai. Details `LICENSE` me.

## Kaise chalayein
1. Zip extract karo.
2. `index.html` ko double-click karke browser me kholo.
3. (Optional) local server: `python -m http.server 8000` → http://localhost:8000
4. Online dalna ho to poora folder GitHub Pages / Netlify / Vercel pe upload karo. Jo bhi link kholega use ye desktop dikhega.

## Version history
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
js/apps.js          wallpapers (WALLS), virtual file system (FS) aur sabhi apps (APPS)
js/main.js          OS core: window manager, taskbar, Start, tray panels, notifications, menus
assets/             bloom-dark.svg, bloom-light.svg (wallpapers)
LICENSE             education / learning use only
```

## Customize kaise karein
- **Naya app:** `js/apps.js` me `APPS` object me ek entry add karo (`name, icon, w, h, render`). Start menu me apne aap aa jayega.
- **Taskbar pe app pin karna:** `js/main.js` me `const pinned = [];` me app id daalo, jaise `['explorer']`.
- **Naya wallpaper:** `WALLS` object (`js/apps.js`) me add karo.
- **Notification bhejna:** `OS.notify('App name', 'Title', 'Message')`.

## Aage ke features (ideas)
Window snap layouts, Widgets panel, Task View + virtual desktops, real file upload/download, Microsoft Store jaisa app installer, multi-user login, taskbar app previews, drag-drop desktop icons.

## License
Sirf education aur learning ke liye. Details `LICENSE` file me.
