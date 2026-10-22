# Windows XP (Virtual)
Windows XP (Luna) replica for the virtual computer. Open `index.html`. Same structure as the other OSes.

**Flow:** boot screen → Welcome/login (click the user) → desktop. Start → Turn Off Computer has Stand By / Turn Off / Restart / **Switch OS**.

**Desktop:** Bliss-style wallpaper, icons, taskbar (Start, Quick Launch, task buttons, tray clock), Start menu with All Programs,
draggable / resizable / minimise / maximise windows (double-click the title bar), right-click menus.

**Apps:** My Computer / Explorer (My Documents, My Pictures, My Music, Desktop, Recycle Bin), Notepad, Calculator, Minesweeper,
Paint, Solitaire, WordPad, Task Manager (taskbar right-click or Ctrl+Shift+Esc), Sound Recorder, Command Prompt, Internet Explorer (lite), Picture viewer, Media player, Display Properties (wallpaper + theme), Control Panel, System Properties, Date and Time, Run.

**Upload from PC / phone:** Explorer → Upload, right-click the desktop → Upload files, or drag & drop files onto the page.
Images go to My Pictures, audio/video to My Music, everything else to My Documents (stored in the browser, IndexedDB).

**Wallpaper:** right-click desktop → Properties → Desktop. Built-ins live in `assets/` (`WALLS` in `js/apps.js`); Browse… uploads your own.
**Themes:** Appearance tab → Blue / Olive Green / Silver.

**Add an app:** add an entry to `APPS` in `js/apps.js`: `{ name, icon, w, h, fixed?, single?, prog?, render(body, win, arg) }`.
