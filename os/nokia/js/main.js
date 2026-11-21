/* Nokia 3310 – Web OS core: boot, keys, screen stack, UI widgets */
(function () {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');

  /* ---------- storage ---------- */
  const PFX = 'nokia3310:';
  const store = {
    get(k, d) { try { const v = localStorage.getItem(PFX + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(PFX + k, JSON.stringify(v)); } catch (e) {} },
    clear() { try { Object.keys(localStorage).filter(k => k.startsWith(PFX)).forEach(k => localStorage.removeItem(k)); } catch (e) {} }
  };
  const cfg = Object.assign({ profile: 'General', ringtone: 0, volume: 3, keyTones: true, light: true, contrast: 3, welcome: '', alarm: { on: false, h: 7, m: 0 } }, store.get('cfg', {}));
  const save = () => store.set('cfg', cfg);

  /* ---------- DOM ---------- */
  const phone = $('#phone'), lcd = $('#lcd'), elStatus = $('#status'), elContent = $('#content'), elSoft = $('#soft');

  /* ---------- sound ---------- */
  let ac = null;
  const soundOn = () => cfg.profile !== 'Silent' && cfg.profile !== 'Meeting';
  function tone(f, d = .08, vol = .05, at = 0) {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + at;
      o.type = 'square'; o.frequency.value = f;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d + .02);
    } catch (e) {}
  }
  const TUNES = [
    { name: 'Nokia tune', n: [[659, .14], [587, .14], [370, .28], [415, .28], [554, .14], [494, .14], [294, .28], [330, .28], [494, .14], [440, .14], [277, .28], [330, .28], [440, .6]] },
    { name: 'Ring ring', n: [[880, .12], [0, .06], [880, .12], [0, .06], [880, .12], [0, .4], [880, .12], [0, .06], [880, .12], [0, .06], [880, .12]] },
    { name: 'Low beep', n: [[330, .2], [0, .1], [330, .2], [0, .1], [330, .2]] },
    { name: 'Rise', n: [[262, .12], [330, .12], [392, .12], [523, .3]] },
    { name: 'Alert', n: [[1000, .1], [700, .1], [1000, .1], [700, .1], [1000, .1], [700, .1]] },
    { name: 'Waltz', n: [[523, .2], [659, .2], [784, .2], [659, .2], [523, .4]] }
  ];
  const play = (n, vol) => { let t = 0; n.forEach(([f, d]) => { if (f) tone(f, d, vol, t); t += d; }); };
  const ringVol = () => cfg.profile === 'Outdoor' ? .12 : .02 + cfg.volume * .016;
  function vibrate() {
    phone.classList.remove('shake'); void phone.offsetWidth; phone.classList.add('shake');
    setTimeout(() => phone.classList.remove('shake'), 650);
  }
  function ring(i) { if (soundOn()) play(TUNES[i == null ? cfg.ringtone : i].n, ringVol()); else vibrate(); }

  /* ---------- OS object & screen stack ---------- */
  const OS = { cfg, save, store, esc, pad, tone, play, ring, vibrate, soundOn, TUNES, stack: [], on: false, booting: false, timerEnd: 0 };
  const top = () => OS.stack[OS.stack.length - 1];

  OS.ink = () => lcd.style.getPropertyValue('--px') || '#101c0c';
  OS.applyCfg = () => {
    lcd.classList.toggle('lit', !!cfg.light);
    lcd.style.setProperty('--px', `rgba(14,28,10,${(.5 + cfg.contrast * .1).toFixed(2)})`);
  };

  OS.draw = function () {
    const s = top();
    if (!s || !OS.on || OS.booting) return;
    lcd.classList.toggle('full', !!s.full);
    elStatus.innerHTML = s.status ? s.status() : `<span class="title">${esc(s.title || '')}</span>`;
    if (s.mount) { if (!s._m) { elContent.innerHTML = ''; s.mount(elContent); s._m = true; } }
    else elContent.innerHTML = s.render ? s.render() : '';
    const sf = typeof s.soft === 'function' ? s.soft() : s.soft;
    elSoft.innerHTML = sf ? `<span>${esc(sf)}</span>` : '';
  };
  OS.push = s => { OS.stack.push(s); s._m = false; if (s.enter) s.enter(); OS.draw(); return s; };
  OS.pop = () => {
    if (OS.stack.length < 2) return;
    const s = OS.stack.pop(); if (s.exit) s.exit();
    const t = top(); t._m = false; if (t.resume) t.resume();
    OS.draw();
  };
  OS.home = () => {
    while (OS.stack.length > 1) { const s = OS.stack.pop(); if (s.exit) s.exit(); }
    top()._m = false; OS.draw();
  };
  OS.scroll = k => { const w = elContent.querySelector('.wrap'); if (w) w.scrollBy(0, (k === 'down' ? 1 : -1) * w.clientHeight / 2); };

  /* ---------- widgets ---------- */
  // Scrollable list menu. items: array or function returning [{label, run}]
  OS.menu = function (o) {
    let i = o.start || 0, off = 0;
    const items = () => (typeof o.items === 'function' ? o.items() : o.items);
    return {
      title: o.title,
      soft: () => (items().length ? (o.soft || 'Select') : ''),
      render() {
        const it = items();
        if (!it.length) return `<div class="wrap c"><span>${esc(o.empty || 'Empty')}</span></div>`;
        if (i >= it.length) i = it.length - 1;
        if (i < off) off = i;
        if (i > off + 3) off = i - 3;
        const rows = it.slice(off, off + 4).map((x, k) =>
          `<div class="row${off + k === i ? ' sel' : ''}">${o.numbered === false || o.jump === false ? '' : `<span class="n">${off + k + 1}</span>`}<span class="t">${esc(x.label)}</span></div>`).join('');
        const h = 400 / it.length, t = (100 - h) * off / (it.length - 4);
        return `<div class="list">${rows}${it.length > 4 ? `<div class="sb"><i style="top:${t}%;height:${h}%"></i></div>` : ''}</div>`;
      },
      key(k) {
        const it = items(), n = it.length;
        if (k === 'up') { if (n) { i = (i - 1 + n) % n; OS.draw(); } return true; }
        if (k === 'down') { if (n) { i = (i + 1) % n; OS.draw(); } return true; }
        if (k === 'ok') { if (n && it[i].run) it[i].run(i); return true; }
        if (/^[1-9]$/.test(k) && o.jump !== false) { const j = +k - 1; if (j < n) { i = j; OS.draw(); if (it[j].run) it[j].run(j); } return true; }
        return false;
      }
    };
  };

  // Text screen (scrollable with up/down)
  OS.msg = o => ({
    title: o.title, soft: o.soft === undefined ? 'OK' : o.soft,
    render: () => `<div class="wrap">${esc(o.text).replace(/\n/g, '<br>')}</div>`,
    key(k) {
      if (k === 'up' || k === 'down') { OS.scroll(k); return true; }
      if (k === 'ok') { OS.pop(); if (o.onOk) o.onOk(); return true; }
      return false;
    }
  });

  // Auto-dismissing note
  OS.note = (text, ms = 1500, cb) => {
    let tm; const s = {
      soft: '',
      render: () => `<div class="wrap c"><span>${esc(text).replace(/\n/g, '<br>')}</span></div>`,
      enter() { tm = setTimeout(() => { if (top() === s) { OS.pop(); if (cb) cb(); } }, ms); },
      exit() { clearTimeout(tm); },
      key(k) { if (k === 'ok' || k === 'c') { OS.pop(); if (cb) cb(); } return true; }
    };
    OS.push(s);
  };

  OS.confirm = (text, yes) => OS.push({
    soft: 'Yes',
    render: () => `<div class="wrap c"><span>${esc(text)}<br><small>C = No</small></span></div>`,
    key(k) { if (k === 'ok') { OS.pop(); yes(); } else if (k === 'c') OS.pop(); return true; }
  });

  OS.slider = o => {
    let v = o.value;
    return {
      title: o.title, soft: 'OK',
      render: () => `<div class="slider"><div class="bar">${Array.from({ length: o.max - o.min + 1 }, (_, i) => `<b class="${i + o.min <= v ? 'on' : ''}"></b>`).join('')}</div></div>`,
      key(k) {
        if (k === 'up' || k === '6') { v = Math.min(o.max, v + 1); if (o.onChange) o.onChange(v); OS.draw(); return true; }
        if (k === 'down' || k === '4') { v = Math.max(o.min, v - 1); if (o.onChange) o.onChange(v); OS.draw(); return true; }
        if (k === 'ok') { OS.pop(); o.onOk(v); return true; }
        return k !== 'c';
      }
    };
  };

  // Multitap text editor (just like the real phone: press a key repeatedly)
  const MT = { 1: ".,'?!-1", 2: 'abc2', 3: 'def3', 4: 'ghi4', 5: 'jkl5', 6: 'mno6', 7: 'pqrs7', 8: 'tuv8', 9: 'wxyz9', 0: ' 0', '*': '*+#@:;()/&%$_' };
  OS.editor = function (o) {
    const modes = ['Abc', 'abc', 'ABC', '123'], max = o.max || 160;
    let text = o.value || '', mode = o.numeric ? '123' : 'Abc', last = null, tm = null;
    const commit = () => { last = null; clearTimeout(tm); };
    const cap = () => mode === 'ABC' || (mode === 'Abc' && (!text || /[.!?]\s+$/.test(text)));
    return {
      title: o.title, soft: o.soft || 'OK',
      status: () => `<span class="title">${esc(o.title || '')}</span><span class="mode">${o.numeric ? '' : mode + ' '}${max - text.length}</span>`,
      render: () => `<div class="ed"><div class="txt">${esc(text).replace(/ /g, '&nbsp;')}<span class="cur">_</span></div></div>`,
      key(k) {
        if (/^[0-9*#]$/.test(k)) {
          if (k === '#' && !o.numeric) { mode = modes[(modes.indexOf(mode) + 1) % 4]; commit(); OS.draw(); return true; }
          if (text.length >= max && !(last && last.k === k)) return true;
          if (o.numeric || (mode === '123' && k !== '*')) { commit(); text += k; OS.draw(); return true; }
          const set = MT[k];
          if (last && last.k === k) { last.i = (last.i + 1) % set.length; text = text.slice(0, -1); }
          else { commit(); last = { k, i: 0 }; }
          let ch = set[last.i];
          if (/[a-z]/.test(ch) && cap()) ch = ch.toUpperCase();
          text += ch; clearTimeout(tm); tm = setTimeout(() => { last = null; }, 1000);
          OS.draw(); return true;
        }
        if (k === 'c') { if (!text) return false; commit(); text = text.slice(0, -1); OS.draw(); return true; }
        if (k === 'ok') { commit(); if (!text && !o.allowEmpty) return true; OS.pop(); o.onOk(text); return true; }
        return true;
      },
      exit: () => clearTimeout(tm)
    };
  };

  // Alarm / timer alert
  OS.alert = (title, text) => {
    if (top().isAlert) return;
    let iv; const beep = () => (soundOn() ? play(TUNES[4].n, .06) : vibrate());
    OS.push({
      isAlert: true, title, soft: 'Stop',
      render: () => `<div class="wrap c"><span>${esc(text)}</span></div>`,
      enter() { beep(); iv = setInterval(beep, 1000); },
      exit() { clearInterval(iv); },
      key() { OS.pop(); return true; }
    });
  };

  /* ---------- apps (defined in apps.js) ---------- */
  OS.apps = window.NokiaApps(OS);

  /* ---------- home screen ---------- */
  const OPERATOR = 'Nokia Net';
  const home = {
    home: true, dial: '', _k: '',
    status: () => `<i class="sig"><b></b><b></b><b></b><b></b></i>${OS.unread() ? '<i class="env"></i>' : ''}<i class="bat"><b></b><b></b><b></b></i>`,
    soft() { return this.dial ? 'Call' : 'Menu'; },
    render() {
      if (this.dial) return `<div class="dial"><div class="nm">${esc(OS.nameOf(this.dial))}</div><div class="num">${esc(this.dial.slice(-11))}</div></div>`;
      const d = new Date(), u = OS.unread(), m = OS.missed();
      const note = u ? `${u} new message${u > 1 ? 's' : ''}` : m ? `${m} missed call${m > 1 ? 's' : ''}` : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
      return `<div class="home"><div class="op">${OPERATOR}</div><div class="clock">${pad(d.getHours())}:${pad(d.getMinutes())}</div><div class="note">${esc(note)}</div></div>`;
    },
    tick() {
      const k = new Date().getMinutes() + '|' + OS.unread() + '|' + OS.missed();
      if (k !== this._k) { this._k = k; OS.draw(); }
    },
    key(k) {
      if (/^[0-9*#]$/.test(k)) { if (this.dial.length < 20) this.dial += k; OS.draw(); return true; }
      if (k === 'c') { if (this.dial) { this.dial = this.dial.slice(0, -1); OS.draw(); } return true; }
      if (k === 'ok') { if (this.dial) { const n = this.dial; this.dial = ''; OS.call(n); } else OS.push(OS.apps.mainMenu()); return true; }
      if (k === 'up') { OS.push(OS.apps.phonebookList()); return true; }
      if (k === 'down') { OS.push(OS.apps.phonebookList()); return true; }
      return true;
    }
  };
  OS.stack.push(home);

  /* ---------- keys ---------- */
  OS.key = function (k) {
    if (k === 'pwr') return OS.power();
    if (!OS.on || OS.booting) return;
    if (cfg.keyTones && soundOn()) tone({ up: 520, down: 480, ok: 620, c: 420 }[k] || 700 + (k === '*' ? 0 : k === '#' ? 600 : +k * 70), .05, .03);
    const s = top();
    if (!(s.key && s.key(k) === true) && k === 'c') OS.pop();
  };

  OS.power = function () {
    if (OS.booting) return;
    if (OS.on) {
      OS.home(); home.dial = ''; OS.on = false; lcd.classList.add('off');
      if (soundOn()) play([[659, .12], [523, .12], [392, .2]], .04);
      return;
    }
    OS.booting = true; OS.on = true;
    lcd.classList.remove('off'); lcd.classList.add('full');
    elStatus.innerHTML = ''; elSoft.innerHTML = '';
    elContent.innerHTML = '<div class="boot"><img src="assets/hands.svg" alt=""><b>NOKIA</b><small>Connecting People</small></div>';
    if (soundOn()) play([[392, .12], [523, .12], [659, .2]], .04);
    const done = () => { OS.booting = false; if (OS.on) OS.draw(); };
    setTimeout(() => {
      if (!OS.on) return done();
      if (cfg.welcome) { elContent.innerHTML = `<div class="wrap c"><span>${esc(cfg.welcome)}</span></div>`; setTimeout(done, 1500); }
      else done();
    }, 2000);
  };

  /* physical buttons: C is short = back, long = home */
  let cTimer = null, cLong = false;
  const cDown = () => { if (cTimer) return; cLong = false; cTimer = setTimeout(() => { cLong = true; if (OS.on && !OS.booting) { OS.home(); home.dial = ''; OS.draw(); } }, 750); };
  const cUp = () => { if (!cTimer) return; clearTimeout(cTimer); cTimer = null; if (!cLong) OS.key('c'); };
  const cCancel = () => { clearTimeout(cTimer); cTimer = null; };

  document.querySelectorAll('[data-key]').forEach(b => {
    const k = b.dataset.key;
    b.addEventListener('pointerdown', e => { e.preventDefault(); b.classList.add('down'); if (k === 'c') cDown(); else OS.key(k); });
    b.addEventListener('pointerup', () => { b.classList.remove('down'); if (k === 'c') cUp(); });
    b.addEventListener('pointerleave', () => { b.classList.remove('down'); if (k === 'c') cCancel(); });
  });
  ['#btnPower', '#pwrKnob'].forEach(s => $(s).addEventListener('click', () => OS.key('pwr')));
  const toggleFull = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {});
  $('#btnFull').addEventListener('click', toggleFull);

  /* physical keyboard */
  const KM = { Enter: 'ok', ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: '4', ArrowRight: '6', Backspace: 'c', Escape: 'c', Delete: 'c' };
  const btnFor = k => document.querySelector(`[data-key="${k}"]`);
  addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'p' || e.key === 'P') { if (!e.repeat) OS.key('pwr'); return; }
    if (e.key === 'f' || e.key === 'F') { if (!e.repeat) toggleFull(); return; }
    const k = KM[e.key] || (/^[0-9*#]$/.test(e.key) ? e.key : null);
    if (!k) return;
    e.preventDefault();
    const b = btnFor(k); if (b) b.classList.add('down');
    if (k === 'c') { if (!e.repeat) cDown(); return; }
    if (e.repeat && k !== 'up' && k !== 'down') return;
    OS.key(k);
  });
  addEventListener('keyup', e => {
    const k = KM[e.key] || e.key, b = btnFor(k);
    if (b) b.classList.remove('down');
    if (KM[e.key] === 'c') cUp();
  });

  /* ---------- background ticker ---------- */
  let lastMin = -1;
  setInterval(() => {
    if (!OS.on || OS.booting) return;
    const s = top(); if (s.tick) s.tick();
    const d = new Date(), key = d.getHours() * 60 + d.getMinutes();
    if (key !== lastMin) {
      lastMin = key;
      if (cfg.alarm.on && cfg.alarm.h === d.getHours() && cfg.alarm.m === d.getMinutes()) OS.alert('Alarm clock', pad(cfg.alarm.h) + ':' + pad(cfg.alarm.m));
    }
    if (OS.timerEnd && Date.now() >= OS.timerEnd) { OS.timerEnd = 0; OS.alert('Timer', "Time's up!"); }
  }, 50);

  OS.applyCfg();
  window.NokiaOS = OS;
  OS.power(); // auto power-on
})();
