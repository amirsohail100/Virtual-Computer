# Kali Linux (Virtual)
Kali Linux (Xfce, Kali-Dark) replica for the virtual computer. Open `index.html`. Same structure as the other OSes.

**Flow:** boot log → LightDM login (password: `kali`) → Xfce desktop. Power button (top-right) → Lock / Log Out / Suspend / Restart / Shut Down / **Switch OS**.

**Desktop:** 6 Kali-style wallpapers (`assets/`: dark, blue/purple cubes, red neon, circuit, ring — original artwork, not the official images), desktop icons (Home, File System, Trash + files from ~/Desktop), top panel with the Kali menu (🐉),
launchers, window buttons, 4 workspaces, tray (network, volume, battery, clock/calendar), draggable / resizable / maximisable windows, right-click menus.

**Kali menu (Whisker style):** Favorites, Recently Used, Usual Applications (Accessories / Graphics / Internet / Multimedia / System) and the real Kali categories 01–13 + 42 (Kali & OffSec Links). The security tools are *simulations only* — no real traffic is ever sent.

**Apps:** Terminal (zsh-style prompt, ls/cd/cat/touch/rm/echo > file, neofetch, ifconfig, ping, nmap (simulated) …), Thunar File Manager, Mousepad,
Firefox ESR (lite), Galculator, Ristretto image viewer, Parole media player, Notes, Application Finder, Wireshark (simulated), Zenmap (simulated), Burp Suite (simulated, Decoder works), msfconsole (simulated scanner modules only), Task Manager, Settings.

**Upload from PC / phone:** Thunar → Upload, right-click the desktop → Upload files, or drag & drop onto the page.
Images → Pictures, audio → Music, video → Videos, documents → Documents, everything else → Downloads (stored in the browser, IndexedDB).
**Wallpaper:** right-click desktop → Desktop Settings (6 built-in, or add your own image). **Appearance:** Kali-Dark / Kali-Light + accent colours.
**Add an app:** add an entry to `APPS` in `js/apps.js`: `{ name, icon, w, h, fixed?, single?, cat?, render(body, win, arg) }`.
