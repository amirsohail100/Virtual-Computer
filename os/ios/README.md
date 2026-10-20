# iOS (Virtual)
iPhone-style OS for the virtual computer. Open `index.html` (same structure as `os/android`).

**Features:** lock screen, home screen + dock, app switcher (double-click the home bar, or `S`),
Control Center (swipe down top-right, or `C`), Dynamic Island with random battery/notification events, rotate, full screen, power.

**Upload from your PC or phone:** tap ＋ in Photos or Files (or drag & drop files anywhere on the page).
Images go to **Photos**, every other file goes to **Files**. Stored in the browser (IndexedDB), so they stay after a reload.

**Wallpapers:** Settings → Wallpaper. 8 built-in wallpapers (`assets/*.svg`), your own photos, or
“Upload from device”. In Photos open a picture → “Wallpaper”. Add a default wallpaper: drop an SVG/JPG in
`assets/` and add one line to `WALLS` in `js/apps.js`.

**Apps:** Phone, Messages, Safari, Notes, Calendar, Photos, Files, Camera, Weather, Clock, Calculator, Settings, Maps, Mail, Music, Contacts, Reminders, Voice Memos .
**Wallpapers:** 4 iPhone-Pro style ones (`assets/p1-p4.svg`) + 8 colourful ones; pick in Settings → Wallpaper.
**Shortcuts:** R rotate · H home · C Control Center · S App Switcher · Esc back.
