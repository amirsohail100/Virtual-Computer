# Adding a new OS

Example: adding Android as `os/android`.

1. **Create the folder**
   ```
   os/android/
     index.html
     css/style.css
     js/apps.js
     js/main.js
     assets/
   ```
2. **Write `index.html`** with the containers your OS needs (lock screen, home screen, status bar, app windows). Load `js/apps.js` first and `js/main.js` last.
3. **Put data and apps in `js/apps.js`**: a wallpaper list, the virtual file system and an `APPS` registry (see `ARCHITECTURE.md` for the app contract).
4. **Write the core in `js/main.js`**: open and close apps, the launcher, settings, notifications. Expose an `OS` object with `open`, `notify` and `set`.
5. **Add a "Switch OS" option** that goes back to the home page:
   ```js
   location.href = '../../index.html';
   ```
6. **Enable the card** in `js/home.js`:
   ```js
   { id: 'android', name: 'Android', ready: true, path: 'os/android/index.html', ... }
   ```
7. **Test** by opening the root `index.html`, launching the OS, using a few apps and switching back.
8. **Document it**: add a section to `README.md` and an entry to `CHANGELOG.md`.

Tips
- Prefix `localStorage` keys with a short name for your OS (for example `a_`) so systems never overwrite each other.
- Use relative paths for assets so the project works from any folder or from GitHub Pages.
- Phone systems (Android, iPhone) need touch-friendly sizes and a fixed phone-shaped screen instead of free windows.
