# iOS (Virtual)
iPhone-style OS for the virtual computer. Open `index.html` (same structure as `os/android`).

**Features:** lock screen (drag up / click), home screen + dock, app open/close animation, app switcher
(double-click the home bar, or `S`), Control Center (swipe down on the top-right / click the status icons, or `C`),
Dynamic Island that randomly shows battery and notifications, rotate, full screen, power.

**Apps:** Phone, Messages, Safari, Notes, Calendar, Photos, Camera, Weather, Clock, Calculator, Settings, Maps.

**Gestures:** swipe up from the bottom bar = Home (slow & long = App Switcher). `Esc` = Back (app first, then Home).
**Shortcuts:** R rotate · H home · C Control Center · S App Switcher · Esc back.

**Add an app:** add an entry in `js/apps.js` → `{ name, icon, bg, dark?, render(body, task) }`.
Optional hooks on `task.api`: `back()`, `show()`, `hide()`, `close()`, `sync()`.
