# Virtual Computer

Browser ke andar poora operating system chalane wala project — sirf **HTML, CSS aur JavaScript**. Koi install, build ya server zaroori nahi.

Home page pe user apna OS chunta hai, aur wahi khul jata hai.

| OS | Status |
|---|---|
| Windows 11 | ✅ Available |
| macOS | 🕒 Coming soon |
| Android | 🕒 Coming soon |
| iPhone (iOS) | 🕒 Coming soon |

> Ye project sirf **education aur learning** ke liye hai. Microsoft, Apple ya Google se koi sambandh nahi hai. Details `LICENSE` me.

## Kaise chalayein
1. Zip extract karo.
2. Root ke `index.html` ko browser me kholo (home page).
3. **Windows 11** card pe click karo.
4. Wapas aane ke liye Windows me Start menu → power button → **Switch OS**.

Local server (optional): `python -m http.server 8000` → http://localhost:8000
Online dalna ho to poora folder GitHub Pages / Netlify / Vercel pe upload karo.

## Folder structure
```
index.html              home page (OS chunne wala)
css/home.css            home page styles
js/home.js              OS list (SYSTEMS) + launch logic
LICENSE                 education / learning use only
os/
  windows/              Windows 11 (ready)
    index.html
    css/style.css
    js/main.js          OS core: windows, taskbar, Start, tray panels
    js/apps.js          wallpapers, file system, core apps
    js/explorer.js      File Explorer
    js/apps-extra.js    Mail, Calendar, Store, Photos, Clock, Camera, Weather, Recycle Bin
    assets/             wallpapers (bloom-dark, bloom-light, glow)
  mac/ android/ iphone/ (aage banenge)
```

## Naya OS kaise add karein
1. `os/<naam>/` folder banao aur usme `index.html` rakho (har OS apne folder me poora self-contained rahe).
2. `js/home.js` ke `SYSTEMS` me us OS ki entry me `ready: true` aur `path: 'os/<naam>/index.html'` likho.
3. Us OS me ek "Switch OS" button do jo `../../index.html` pe le jaye (Windows me power menu me hai).

## Windows 11 — features
- Lock screen, desktop icons, 4 wallpapers + apna wallpaper upload (drag-drop bhi), dark/light mode, accent colour
- Taskbar (pinned + khule apps, right-click Pin/Unpin), Start menu (Pinned, All apps, Recommended, search), tray panels (hidden icons, keyboard layout, quick settings, notifications + calendar)
- Window manager: drag, resize, minimize, maximize, close
- Apps: File Explorer, Notepad, Calculator, Settings, Edge-style browser, Paint, Terminal, Task Manager, Mail, Calendar, Store (demo), Photos, Clock, Camera, Weather (demo), Recycle Bin
- Files aur settings browser ke `localStorage` me save hote hain

## Version history
**v0.4** — Project ka naam Virtual Computer. Home page (Windows / macOS / Android / iPhone cards), Windows `os/windows/` me shift, "Switch OS" button.
**v0.3** — Win11 Start menu aur File Explorer redesign, custom wallpaper upload, 8 naye apps, default pinned taskbar apps.
**v0.2** — Bloom wallpaper, Win11 Start logo, tray panels, notifications + calendar, right-click menus.
**v0.1** — Pehla Windows 11 prototype.

## License
Sirf education aur learning ke liye. Details `LICENSE` file me.
