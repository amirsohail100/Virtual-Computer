# Ubuntu (Virtual)
Ubuntu 24.04 (GNOME / Yaru) replica for the virtual computer. Open `index.html`. Same structure as the other OSes.

**Flow:** Plymouth boot → GDM login (password: `ubuntu`) → GNOME desktop. Quick Settings (top-right) → ⏻ → Lock / Log Out / Suspend / Restart / Power Off / **Switch OS**.

**Desktop:** top bar (Activities, app name, clock + calendar/notifications, Quick Settings), left Ubuntu Dock with running-app dots, Activities overview
(window cards, search, **Show Applications** grid), desktop icons (Home, Trash + ~/Desktop files), draggable / resizable windows, right-click menus.

**Apps:** Files, Terminal (bash-style, simulated commands, `sudo apt install vlc` etc.), Firefox (lite), Text Editor, Calculator, Image Viewer,
Videos & Music, System Monitor, Settings (Network, Background, Appearance, Displays, Sound, Power, Date & Time, Users, About), Ubuntu Software (simulated installs),
Calendar, Clocks.

**Upload from PC / phone:** Files → Upload, right-click the desktop → Upload Files, or drag & drop onto the page.
Images → Pictures, audio → Music, video → Videos, documents → Documents, everything else → Downloads (stored in the browser, IndexedDB).
**Background:** Settings → Background (6 built-in, or add your own picture; Style: zoom/center/tile/stretch). **Appearance:** Light/Dark + 9 accent colours.
**Add an app:** add an entry to `APPS` in `js/apps.js`: `{ name, icon, w, h, fixed?, single?, render(body, win, arg) }`.
