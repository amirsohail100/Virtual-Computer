# Windows 11 Web (Educational Prototype)

Browser me chalne wala Windows 11 jaisa desktop — sirf HTML, CSS aur JavaScript. Koi install ya server zaroori nahi.

## Kaise chalayein

- `index.html` ko double-click karke browser me kholo.
- (Optional) local server: `python -m http.server 8000` → http://localhost:8000
- Online dalna ho to poore folder ko GitHub Pages / Netlify / Vercel pe upload karo — jo bhi link kholega use ye desktop dikhega.

## Features (v0.1)

- Lock screen, desktop icons, wallpapers, right-click menu
- Centered taskbar, Start menu (search + pinned apps), Quick settings, Calendar, clock
- Window manager: drag, resize, minimize, maximize (double-click titlebar), close
- Apps: File Explorer (virtual files), Notepad (Ctrl+S), Calculator, Settings (theme/wallpaper/accent),
  Edge-style browser, Paint, Terminal, Task Manager
- Dark / Light mode, brightness, night light, data localStorage me save

## Structure

```
index.html        -> page layout
css/style.css     -> sabhi styles (themes, windows, apps)
js/apps.js        -> sabhi apps (naya app = APPS me ek entry)
js/main.js        -> OS core: windows, taskbar, start menu, settings
LICENSE           -> education/learning only
```

## Aage kya improve kar sakte hain

Window snap layouts, Widgets panel, Task View + virtual desktops, real file upload/download, notifications, Microsoft Store-style app installer, multi-user login.

## License

Sirf education aur learning ke liye. Details `LICENSE` file me.
