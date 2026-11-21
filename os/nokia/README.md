# Nokia 3310 – Web OS

A browser-based Nokia 3310 (2000) with a monochrome green LCD, working hardware keys and a Series 20-style OS. Part of **win11-web** (`os/nokia3310`).

## Run
Open `index.html` (or serve the repo root). No build step, no dependencies.

## Keys
| Phone key | Keyboard |
|---|---|
| Navi (centre) | `Enter` |
| C (back, hold = home) | `Backspace` / `Esc` |
| Up / Down | `↑` / `↓` |
| 0-9, `*`, `#` | `0-9`, `*`, `#` (`←` `→` = 4 / 6) |
| Power | `P` or the power button |
| Full screen | `F` |

## Features
- Boot animation (hands + welcome note), clock, signal and battery icons, backlight, contrast
- Dial numbers from the start screen, outgoing and incoming calls with call logs
- Phone book (add / edit / delete / call), SMS with real multitap input (`#` = Abc/abc/ABC/123), auto-reply
- Tones (6 ringtones, volume, keypad tones), Profiles (General, Silent, Meeting = vibrate, Outdoor)
- Games: **Snake II**, **Space Impact**
- Calculator, Reminders, Alarm clock, Stopwatch, Countdown timer
- Data is stored in `localStorage` (`nokia3310:*`); Settings → Factory reset clears it

## Structure
```
nokia3310/
├── assets/   logo.svg · hands.svg · bg.svg
├── css/      style.css
├── js/       main.js (OS core, keys, widgets) · apps.js (apps and games)
├── index.html
└── README.md
```
