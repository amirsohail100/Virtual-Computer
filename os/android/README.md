# Android (Virtual)

An Android-style phone that runs in your browser. For learning only — it is not affiliated with Google.

## Open it
Open the root `index.html` and click **Android**. Click the lock screen to unlock. The buttons on the left of the phone control the phone:

| Button | What it does |
|---|---|
| Switch OS | Go back to the home page |
| Rotate | Turn the phone to landscape and back (also the `R` key) |
| Full screen | Make the browser full screen |
| Power | Turn the screen off and on |

## Landscape and videos
Rotate the phone, open **YouTube**, start a video and press **⛶** for the immersive full-screen player. `Esc` (Back) leaves full screen. Online videos need internet and work best when the site is opened from GitHub Pages or `localhost`. The **My PC** button plays a video file from your computer and works anywhere.

## Features
- Lock screen, home screen with a date widget, search bar and dock, app drawer with search, recents (clear one or all).
- Notification shade with quick settings: Internet, Bluetooth, Flashlight (demo), Do Not Disturb, Airplane mode, Dark theme, Battery Saver, Landscape, plus a brightness slider.
- Heads-up notifications, light and dark theme, status bar with the real battery level when the browser allows it.
- Wallpapers: Bloom, Aurora and Dunes, or upload your own photo (Fill / Fit / Stretch / Center / Tile).
- Keyboard: `R` rotate, `Esc` Back, `H` Home, `N` notification shade.

## Apps (11)
Phone, Messages, Chrome, YouTube, Camera, Gallery, Settings, Clock, Calculator, Calendar, Notes.

Messages replies are automatic. Camera needs permission and `https` or `localhost`. Photos taken with the camera appear in Gallery.

## Files
| File | Job |
|---|---|
| `index.html` | The phone frame, screen layers and the buttons on the left |
| `css/style.css` | Phone body, light and dark theme, portrait and landscape layouts, apps |
| `js/apps.js` | Wallpapers and all apps |
| `js/main.js` | Rotation and scaling, home screen, tasks, recents, shade, lock screen and keys |
| `assets/` | `bloom.svg`, `aurora.svg`, `dunes.svg` |

## Add an app
Open `js/apps.js` and add an entry:
```js
mk('hello', { name: 'Hello', icon: '👋', bg: 'linear-gradient(135deg,#8ab4f8,#1a73e8)',
  render(body, task) {
    body.innerHTML = '<div class="ab"><b>Hello</b></div><div style="padding:20px">Hello from my app!</div>';
    task.api = { back: () => false }; // return true when the app handled Back itself
  } });
```
It shows up in the app drawer. Add its id to `HOME_APPS` or `DOCK` in `js/main.js` to put it on the home screen.

## Data
Notes, events, messages, photos, wallpapers and settings are saved in your browser (`localStorage`, keys start with `a_`).
