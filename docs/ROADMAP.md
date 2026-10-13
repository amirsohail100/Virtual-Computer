# Roadmap

| System | Status | Plan |
|---|---|---|
| Windows 11 | Ready | Snap layouts picker, Widgets panel, real file upload and download, taskbar previews |
| macOS | Ready | Stage Manager, hot corners, screenshot tool, Finder tags and multi-select |
| Windows XP | Coming soon | Bliss desktop, green Start button, My Computer, classic Notepad and Paint, Minesweeper |
| Ubuntu Linux | Coming soon | GNOME-style top bar and dock, Activities overview, Files, Terminal, Software, Settings |
| Kali Linux | Coming soon | Dark desktop, terminal-first workflow, a menu of learning tools (simulated, for study only) |
| Android | Coming soon | Phone-shaped screen, home screen, app drawer, notification shade, quick settings, recents |
| iPhone (iOS) | Coming soon | Phone-shaped screen, home screen, App Library, Control Center, lock screen |

## Order of work
1. Windows XP, Ubuntu and Kali: reuse the desktop ideas from `os/windows`, with a new look for each.
2. Android and iPhone: touch-friendly layout with a fixed phone frame.
3. Shared polish: more wallpapers and an accessibility pass.

Each system lives in its own folder under `os/` (see `docs/ADDING-AN-OS.md`). When one is ready, set `ready: true` and its `path` in `js/home.js`.
