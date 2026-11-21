/* Nokia 3310 – Apps: phone book, messages, calls, tones, settings, games, tools */
window.NokiaApps = function (OS) {
  'use strict';
  const { cfg, save, store, esc, pad } = OS;
  const A = {};
  const fmtT = ms => { const d = new Date(ms); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const fmtD = s => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

  /* ================= PHONE BOOK ================= */
  const getContacts = () => store.get('contacts', [{ n: 'Emergency', p: '112' }, { n: 'Voicemail', p: '121' }]);
  const setContacts = c => store.set('contacts', c.sort((a, b) => a.n.localeCompare(b.n)));
  OS.nameOf = num => { const c = getContacts().find(x => x.p === num); return c ? c.n : ''; };

  function addContact(num) {
    OS.push(OS.editor({ title: 'Name', max: 12, onOk: n => OS.push(OS.editor({
      title: 'Number', numeric: true, max: 20, value: num || '',
      onOk: p => { const l = getContacts(); l.push({ n, p }); setContacts(l); OS.note('Saved'); }
    })) }));
  }
  function contactMenu(c) {
    const same = x => x.n === c.n && x.p === c.p;
    OS.push(OS.menu({ title: c.n, items: [
      { label: 'Call', run: () => { OS.pop(); OS.call(c.p); } },
      { label: 'Details', run: () => OS.push(OS.msg({ title: c.n, text: c.p })) },
      { label: 'Edit', run: () => OS.push(OS.editor({ title: 'Name', max: 12, value: c.n, onOk: n => OS.push(OS.editor({
        title: 'Number', numeric: true, max: 20, value: c.p,
        onOk: p => { setContacts(getContacts().map(x => (same(x) ? { n, p } : x))); OS.pop(); OS.note('Saved'); }
      })) })) },
      { label: 'Delete', run: () => OS.confirm('Delete ' + c.n + '?', () => { setContacts(getContacts().filter(x => !same(x))); OS.pop(); OS.note('Deleted'); }) }
    ] }));
  }
  // pick(contact) selects instead of opening options
  A.phonebookList = pick => OS.menu({
    title: 'Phone book', jump: false, empty: 'Empty', soft: pick ? 'Select' : 'Options',
    items: () => getContacts().map(c => ({ label: c.n, run: () => (pick ? (OS.pop(), pick(c)) : contactMenu(c)) }))
  });
  A.phonebook = () => OS.menu({ title: 'Phone book', items: [
    { label: 'Search', run: () => OS.push(A.phonebookList()) },
    { label: 'Add name', run: () => addContact() },
    { label: 'Erase all', run: () => OS.confirm('Erase all names?', () => { setContacts([]); OS.note('Erased'); }) }
  ] });

  /* ================= CALLS ================= */
  const log = (kind, n, d) => { const l = store.get('log-' + kind, []); l.unshift({ n, t: Date.now(), d: d || 0 }); store.set('log-' + kind, l.slice(0, 10)); };
  OS.missed = () => store.get('missed-new', 0);

  // mode: 'out' (we dial) or 'in' (incoming)
  function callScreen(num, mode) {
    let st = mode === 'in' ? 'ringing' : 'calling', t1 = 0, iv, tm, lastSec = -1;
    const nm = OS.nameOf(num);
    const dur = () => (t1 ? Math.floor((Date.now() - t1) / 1000) : 0);
    const finish = () => {
      clearInterval(iv); clearTimeout(tm);
      const d = dur(), talked = st === 'talk';
      if (mode === 'out') log('dialled', num, d); else if (talked) log('received', num, d);
      st = 'ended'; OS.pop(); OS.note('Call ended\n' + (talked ? fmtD(d) : ''), 1300);
    };
    const connect = () => { st = 'talk'; t1 = Date.now(); clearTimeout(tm); OS.tone(880, .12, .03); OS.draw(); };
    const s = {
      title: mode === 'in' ? 'Incoming call' : 'Call',
      soft: () => (st === 'ringing' ? 'Answer' : 'End'),
      render() {
        const line = st === 'calling' ? 'Calling...' : st === 'ringing' ? 'Calling you' : fmtD(dur());
        return `<div class="call"><div class="nm">${esc(nm)}</div><div class="num">${esc(num)}</div><div class="st">${line}</div></div>`;
      },
      enter() {
        if (st === 'calling') { tm = setTimeout(connect, 2800); iv = setInterval(() => OS.soundOn() && OS.tone(425, .45, .02), 1300); }
        else {
          OS.ring(); iv = setInterval(() => OS.ring(), 4000);
          tm = setTimeout(() => { if (st === 'ringing') { clearInterval(iv); store.set('missed-new', OS.missed() + 1); log('missed', num); OS.pop(); } }, 14000);
        }
      },
      exit() { clearInterval(iv); clearTimeout(tm); },
      tick() { if (st === 'talk' && dur() !== lastSec) { lastSec = dur(); OS.draw(); } },
      key(k) {
        if (k === 'ok' && st === 'ringing') { clearInterval(iv); connect(); return true; }
        if (k === 'c' || k === 'ok') {
          if (st === 'ringing') { clearInterval(iv); clearTimeout(tm); store.set('missed-new', OS.missed() + 1); log('missed', num); OS.pop(); return true; }
          finish(); return true;
        }
        return true;
      }
    };
    return s;
  }
  OS.call = num => OS.push(callScreen(num, 'out'));
  A.incoming = num => OS.push(callScreen(num, 'in'));

  const callList = (kind, title) => OS.menu({
    title, jump: false, empty: 'Empty', soft: 'Options',
    start: 0,
    items: () => store.get('log-' + kind, []).map(e => ({
      label: OS.nameOf(e.n) || e.n,
      run: () => OS.push(OS.menu({ title: OS.nameOf(e.n) || e.n, items: [
        { label: 'Call', run: () => { OS.pop(); OS.call(e.n); } },
        { label: 'Time', run: () => OS.push(OS.msg({ title, text: fmtT(e.t) + (e.d ? '\nDuration ' + fmtD(e.d) : '') })) },
        { label: 'Save number', run: () => addContact(e.n) }
      ] }))
    }))
  });
  A.callRegister = () => OS.menu({ title: 'Call register', items: [
    { label: 'Missed calls', run: () => { store.set('missed-new', 0); OS.push(callList('missed', 'Missed calls')); } },
    { label: 'Received calls', run: () => OS.push(callList('received', 'Received calls')) },
    { label: 'Dialled numbers', run: () => OS.push(callList('dialled', 'Dialled numbers')) },
    { label: 'Erase recent lists', run: () => OS.confirm('Erase all lists?', () => { ['missed', 'received', 'dialled'].forEach(k => store.set('log-' + k, [])); store.set('missed-new', 0); OS.note('Erased'); }) }
  ] });

  /* ================= MESSAGES ================= */
  if (!store.get('seeded', false)) {
    store.set('sms-in', [{ f: 'Nokia', n: '', x: 'Welcome to your Nokia 3310! Press Menu, then Games to play Snake II. Connecting People.', t: Date.now(), r: false }]);
    store.set('seeded', true);
  }
  OS.unread = () => store.get('sms-in', []).filter(m => !m.r).length;
  OS.receiveSms = (from, text, num) => {
    const l = store.get('sms-in', []); l.unshift({ f: from, n: num || '', x: text, t: Date.now(), r: false });
    store.set('sms-in', l.slice(0, 30));
    if (OS.on) { OS.ring(); OS.draw(); }
  };
  const REPLIES = ['Ok, got it!', 'Call me later.', 'Haha nice :)', 'On my way.', 'Thanks! See you soon.', 'Snake II high score? Beat mine!'];

  function doSend(text, to) {
    const l = store.get('sms-out', []); l.unshift({ f: to, x: text, t: Date.now() }); store.set('sms-out', l.slice(0, 30));
    OS.pop(); OS.note('Message sent', 1400);
    setTimeout(() => OS.receiveSms(OS.nameOf(to) || to, REPLIES[(Math.random() * REPLIES.length) | 0], to), 6000 + Math.random() * 4000);
  }
  function sendMenu(text, to) {
    OS.push(OS.menu({ title: 'Options', items: [
      { label: 'Send', run: () => (to ? doSend(text, to) : OS.push(OS.editor({ title: 'Number', numeric: true, max: 20, onOk: n => doSend(text, n) }))) },
      { label: 'Send to contact', run: () => OS.push(A.phonebookList(c => doSend(text, c.p))) },
      { label: 'Edit', run: () => { OS.pop(); compose(text, to); } }
    ] }));
  }
  function compose(prefill, to) { OS.push(OS.editor({ title: 'Write message', max: 160, value: prefill || '', onOk: t => sendMenu(t, to) })); }

  function openMsg(box, idx) {
    const key = box === 'in' ? 'sms-in' : 'sms-out', l = store.get(key, []), m = l[idx];
    if (!m) return;
    if (box === 'in' && !m.r) { m.r = true; store.set(key, l); }
    OS.push({
      title: (box === 'in' ? '' : 'To ') + m.f, soft: box === 'in' ? 'Reply' : '',
      render: () => `<div class="wrap">${esc(m.x)}</div>`,
      key(k) {
        if (k === 'up' || k === 'down') { OS.scroll(k); return true; }
        if (k === 'ok' && box === 'in') { compose('', m.n || undefined); return true; }
        return false;
      }
    });
  }
  const boxList = (box, title) => OS.menu({
    title, jump: false, empty: 'Empty', soft: 'Read',
    items: () => store.get(box === 'in' ? 'sms-in' : 'sms-out', []).map((m, i) => ({ label: (box === 'in' && !m.r ? '* ' : '') + m.f, run: () => openMsg(box, i) }))
  });
  A.messages = () => OS.menu({ title: 'Messages', items: [
    { label: 'Write messages', run: () => compose('') },
    { label: 'Inbox', run: () => OS.push(boxList('in', 'Inbox')) },
    { label: 'Outbox', run: () => OS.push(boxList('out', 'Outbox')) },
    { label: 'Erase messages', run: () => OS.confirm('Erase all messages?', () => { store.set('sms-in', []); store.set('sms-out', []); OS.note('Erased'); }) }
  ] });

  /* ================= TONES / SETTINGS / PROFILES ================= */
  const toggle = (title, key, after) => OS.menu({
    title, start: cfg[key] ? 0 : 1,
    items: [true, false].map(v => ({ label: v ? 'On' : 'Off', run: () => { cfg[key] = v; save(); if (after) after(); OS.pop(); OS.note('Saved', 900); } }))
  });
  A.tones = () => OS.menu({ title: 'Tones', items: [
    { label: 'Ringing tone', run: () => OS.push(OS.menu({ title: 'Ringing tone', start: cfg.ringtone, items: OS.TUNES.map((t, i) => ({
      label: (cfg.ringtone === i ? '*' : '') + t.name, run: () => { cfg.ringtone = i; save(); OS.ring(i); OS.pop(); OS.note('Tone selected', 1000); } })) })) },
    { label: 'Ringing volume', run: () => OS.push(OS.slider({ title: 'Ring volume', min: 1, max: 5, value: cfg.volume, onChange: v => { cfg.volume = v; OS.tone(660, .1, .02 + v * .016); }, onOk: v => { cfg.volume = v; save(); OS.note('Saved', 900); } })) },
    { label: 'Keypad tones', run: () => OS.push(toggle('Keypad tones', 'keyTones')) }
  ] });

  const PROFILES = ['General', 'Silent', 'Meeting', 'Outdoor'];
  A.profiles = () => OS.menu({ title: 'Profiles', start: PROFILES.indexOf(cfg.profile), items: () => PROFILES.map(p => ({
    label: (cfg.profile === p ? '*' : '') + p, run: () => { cfg.profile = p; save(); OS.pop(); OS.note(p + '\nactivated'); } })) });

  A.settings = () => OS.menu({ title: 'Settings', items: [
    { label: 'Contrast', run: () => OS.push(OS.slider({ title: 'Contrast', min: 1, max: 5, value: cfg.contrast, onChange: v => { cfg.contrast = v; OS.applyCfg(); }, onOk: v => { cfg.contrast = v; save(); OS.applyCfg(); OS.note('Saved', 900); } })) },
    { label: 'Backlight', run: () => OS.push(toggle('Backlight', 'light', OS.applyCfg)) },
    { label: 'Welcome note', run: () => OS.push(OS.editor({ title: 'Welcome note', max: 40, value: cfg.welcome, allowEmpty: true, onOk: t => { cfg.welcome = t; save(); OS.note('Saved'); } })) },
    { label: 'Test incoming call', run: () => { OS.home(); OS.note('Call in 3 sec', 1000); setTimeout(() => OS.on && A.incoming('9876543210'), 3000); } },
    { label: 'Factory reset', run: () => OS.confirm('Erase all data?', () => { store.clear(); location.reload(); }) }
  ] });

  /* ================= CALCULATOR ================= */
  A.calc = () => {
    const OPS = ['+', '-', '×', '÷']; let acc = null, op = 0, cur = '0', fresh = true;
    const run = (a, o, b) => (o === 0 ? a + b : o === 1 ? a - b : o === 2 ? a * b : b === 0 ? NaN : a / b);
    const fmt = n => (isFinite(n) ? String(+n.toPrecision(9)) : 'Error');
    return {
      title: 'Calculator', soft: '=',
      render: () => `<div class="calc"><div class="l1">${acc === null ? '' : esc(fmt(acc) + ' ' + OPS[op])}</div><div class="l2">${esc(cur)}</div></div>`,
      key(k) {
        if (/^[0-9]$/.test(k)) { if (cur === 'Error') { cur = '0'; fresh = true; } if (fresh) { cur = k; fresh = false; } else if (cur.replace(/[-.]/g, '').length < 9) cur = cur === '0' ? k : cur + k; OS.draw(); return true; }
        if (k === '*') { if (fresh) { cur = '0.'; fresh = false; } else if (!cur.includes('.') && cur !== 'Error') cur += '.'; OS.draw(); return true; }
        if (k === '#') { if (cur !== '0' && cur !== 'Error') cur = cur[0] === '-' ? cur.slice(1) : '-' + cur; OS.draw(); return true; }
        if (k === 'up' || k === 'down') {
          if (cur === 'Error') return true;
          if (acc === null) { acc = parseFloat(cur); op = 0; }
          else if (fresh) op = (op + (k === 'up' ? 1 : 3)) % 4;
          else acc = run(acc, op, parseFloat(cur));
          if (!isFinite(acc)) { cur = 'Error'; acc = null; }
          fresh = true; OS.draw(); return true;
        }
        if (k === 'ok') { if (acc !== null && cur !== 'Error') { cur = fmt(run(acc, op, parseFloat(cur))); acc = null; fresh = true; OS.draw(); } return true; }
        if (k === 'c') {
          if (!fresh && cur.length > 1) { cur = cur.slice(0, -1); if (cur === '-') cur = '0'; }
          else if (acc !== null) acc = null;
          else if (cur !== '0') { cur = '0'; fresh = true; }
          else return false;
          OS.draw(); return true;
        }
        return true;
      }
    };
  };

  /* ================= REMINDERS ================= */
  A.reminders = () => OS.menu({ title: 'Reminders', items: [
    { label: 'Add note', run: () => OS.push(OS.editor({ title: 'Note', max: 100, onOk: t => { const l = store.get('notes', []); l.unshift(t); store.set('notes', l); OS.note('Saved'); } })) },
    { label: 'My notes', run: () => OS.push(OS.menu({ title: 'My notes', jump: false, empty: 'Empty', soft: 'Open', items: () => store.get('notes', []).map((t, i) => ({ label: t, run: () => OS.push(OS.menu({ title: 'Note', items: [
      { label: 'View', run: () => OS.push(OS.msg({ title: 'Note', text: t })) },
      { label: 'Delete', run: () => { const l = store.get('notes', []); l.splice(i, 1); store.set('notes', l); OS.pop(); OS.note('Deleted'); } }
    ] })) })) })) }
  ] });

  /* ================= CLOCK ================= */
  A.stopwatch = () => {
    let run = false, t0 = 0, el = 0, lastT = -1;
    const now = () => (run ? el + Date.now() - t0 : el);
    const fmt = ms => `${pad(Math.floor(ms / 60000))}:${pad(Math.floor(ms / 1000) % 60)}.${Math.floor(ms / 100) % 10}`;
    return {
      title: 'Stopwatch', soft: () => (run ? 'Stop' : 'Start'),
      render: () => `<div class="sw"><div class="t">${fmt(now())}</div></div>`,
      tick() { const t = Math.floor(now() / 100); if (run && t !== lastT) { lastT = t; OS.draw(); } },
      key(k) {
        if (k === 'ok') { if (run) { el = now(); run = false; } else { t0 = Date.now(); run = true; } OS.draw(); return true; }
        if (k === 'c') { if (run) { el = now(); run = false; OS.draw(); return true; } if (el) { el = 0; OS.draw(); return true; } return false; }
        return true;
      }
    };
  };
  A.clock = () => OS.menu({ title: 'Clock', items: () => [
    { label: 'Alarm ' + (cfg.alarm.on ? pad(cfg.alarm.h) + ':' + pad(cfg.alarm.m) : 'off'), run: () => OS.push(OS.menu({ title: 'Alarm clock', items: () => [
      { label: cfg.alarm.on ? 'Turn off' : 'Turn on', run: () => { cfg.alarm.on = !cfg.alarm.on; save(); OS.draw(); } },
      { label: 'Set time', run: () => OS.push(OS.editor({ title: 'Time HHMM', numeric: true, max: 4, onOk: v => {
        const h = +v.slice(0, 2), m = +v.slice(2, 4);
        if (v.length !== 4 || h > 23 || m > 59) return OS.note('Invalid time');
        cfg.alarm = { on: true, h, m }; save(); OS.note('Alarm set\n' + pad(h) + ':' + pad(m));
      } })) }
    ] })) },
    { label: 'Stopwatch', run: () => OS.push(A.stopwatch()) },
    { label: OS.timerEnd ? 'Timer running' : 'Countdown timer', run: () => (OS.timerEnd
      ? OS.confirm('Stop timer?', () => { OS.timerEnd = 0; OS.note('Timer stopped'); })
      : OS.push(OS.editor({ title: 'Minutes', numeric: true, max: 3, onOk: v => { if (!+v) return OS.note('Invalid'); OS.timerEnd = Date.now() + v * 60000; OS.note('Timer started\n' + +v + ' min'); } }))) }
  ] });

  /* ================= GAMES ================= */
  const hiScore = k => store.get(k, 0);

  A.snake = () => {
    const C = 6, GW = 28, GH = 14, OY = 12;
    let snake, dir, nd, food, score, over, paused, last, x, best = hiScore('snake-best');
    const place = () => { do { food = { x: (Math.random() * GW) | 0, y: (Math.random() * GH) | 0 }; } while (snake.some(p => p.x === food.x && p.y === food.y)); };
    const reset = () => { snake = [{ x: 8, y: 7 }, { x: 7, y: 7 }, { x: 6, y: 7 }]; dir = nd = { x: 1, y: 0 }; score = 0; over = paused = false; last = Date.now(); place(); };
    const box = t => { x.clearRect(26, 28, 116, 40); x.strokeRect(26.5, 28.5, 115, 39); x.textAlign = 'center'; x.fillText(t[0], 84, 34); x.fillText(t[1], 84, 50); x.textAlign = 'left'; };
    const draw = () => {
      if (!x) return;
      x.clearRect(0, 0, 168, 96); x.fillStyle = x.strokeStyle = OS.ink(); x.font = 'bold 10px monospace'; x.textBaseline = 'top';
      x.fillText('Score ' + score, 2, 1); x.textAlign = 'right'; x.fillText('Hi ' + best, 166, 1); x.textAlign = 'left';
      x.fillRect(0, 11, 168, 1);
      snake.forEach((p, i) => x.fillRect(p.x * C + (i ? 1 : 0), OY + p.y * C + (i ? 1 : 0), i ? C - 2 : C, i ? C - 2 : C));
      x.fillRect(food.x * C + 2, OY + food.y * C, 2, C); x.fillRect(food.x * C, OY + food.y * C + 2, C, 2);
      if (over) box(['GAME OVER', 'OK = retry']); else if (paused) box(['PAUSED', 'OK = resume']);
    };
    const step = () => {
      dir = nd; const h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y }, eat = h.x === food.x && h.y === food.y;
      if (h.x < 0 || h.y < 0 || h.x >= GW || h.y >= GH || snake.slice(0, eat ? undefined : -1).some(p => p.x === h.x && p.y === h.y)) {
        over = true; if (score > best) { best = score; store.set('snake-best', best); } OS.play([[300, .15], [220, .15], [150, .3]], .04); return;
      }
      snake.unshift(h);
      if (eat) { score += 7; OS.tone(900, .06, .03); place(); } else snake.pop();
    };
    const turn = (dx, dy) => { if (dir.x !== -dx || dir.y !== -dy) nd = { x: dx, y: dy }; };
    return {
      full: true,
      enter: reset,
      mount(el) { el.innerHTML = '<canvas class="gc" width="168" height="96"></canvas>'; x = el.firstChild.getContext('2d'); draw(); },
      tick() { if (over || paused) return; const sp = Math.max(55, 130 - Math.floor(score / 35) * 10); if (Date.now() - last >= sp) { last = Date.now(); step(); draw(); } },
      key(k) {
        if (k === '2' || k === 'up') turn(0, -1); else if (k === '8' || k === 'down') turn(0, 1);
        else if (k === '4') turn(-1, 0); else if (k === '6') turn(1, 0);
        else if (k === 'ok') { if (over) reset(); else paused = !paused; draw(); }
        else return false;
        return true;
      }
    };
  };

  A.space = () => {
    const W = 168; let ship, bullets, foes, score, lives, over, f, x, cool, best = hiScore('space-best');
    const reset = () => { ship = 50; bullets = []; foes = []; score = 0; lives = 3; over = false; f = 0; cool = 0; };
    const draw = () => {
      if (!x) return;
      x.clearRect(0, 0, W, 96); x.fillStyle = x.strokeStyle = OS.ink(); x.font = 'bold 10px monospace'; x.textBaseline = 'top';
      x.fillText('Score ' + score, 2, 1); x.textAlign = 'right'; x.fillText('Lives ' + lives, 166, 1); x.textAlign = 'left'; x.fillRect(0, 11, W, 1);
      x.fillRect(6, ship - 3, 12, 6); x.fillRect(18, ship - 1, 6, 2); x.fillRect(6, ship - 7, 5, 3); x.fillRect(6, ship + 4, 5, 3);
      bullets.forEach(b => x.fillRect(b.x, b.y, 5, 2));
      foes.forEach(e => { x.strokeRect(e.x + .5, e.yy - 3.5, 9, 7); x.fillRect(e.x + 3, e.yy - 1, 3, 3); });
      if (over) { x.clearRect(26, 28, 116, 40); x.strokeRect(26.5, 28.5, 115, 39); x.textAlign = 'center'; x.fillText('GAME OVER', 84, 34); x.fillText('Best ' + best + ' OK=retry', 84, 50); x.textAlign = 'left'; }
    };
    return {
      full: true, enter: reset,
      mount(el) { el.innerHTML = '<canvas class="gc" width="168" height="96"></canvas>'; x = el.firstChild.getContext('2d'); draw(); },
      tick() {
        if (over) return; f++; if (cool) cool--;
        bullets.forEach(b => (b.x += 5)); bullets = bullets.filter(b => b.x < W);
        if (f % Math.max(12, 32 - Math.floor(score / 40)) === 0) foes.push({ x: W, y: 20 + Math.random() * 66, p: Math.random() * 6, yy: 0 });
        foes.forEach(e => { e.x -= 1.5; e.yy = e.y + Math.sin(e.x / 12 + e.p) * 8; });
        foes = foes.filter(e => {
          const hit = bullets.findIndex(b => b.x + 5 > e.x && b.x < e.x + 9 && Math.abs(b.y - e.yy) < 5);
          if (hit >= 0) { bullets.splice(hit, 1); score += 10; OS.tone(700, .05, .03); return false; }
          if (e.x < 24 && Math.abs(e.yy - ship) < 8) { lives--; OS.vibrate(); OS.tone(150, .2, .05); return false; }
          return e.x > -10;
        });
        if (lives <= 0) { over = true; if (score > best) { best = score; store.set('space-best', best); } }
        draw();
      },
      key(k) {
        if (k === 'up' || k === '2') ship = Math.max(20, ship - 6);
        else if (k === 'down' || k === '8') ship = Math.min(88, ship + 6);
        else if (k === 'ok' || k === '5') { if (over) reset(); else if (!cool && bullets.length < 5) { bullets.push({ x: 24, y: ship - 1 }); cool = 3; OS.tone(1200, .03, .02); } }
        else return false;
        draw(); return true;
      }
    };
  };

  A.games = () => OS.menu({ title: 'Games', items: [
    { label: 'Snake II', run: () => OS.push(A.snake()) },
    { label: 'Space Impact', run: () => OS.push(A.space()) }
  ] });

  /* ================= MAIN MENU ================= */
  A.mainMenu = () => OS.menu({ title: 'Menu', items: [
    { label: 'Phone book', run: () => OS.push(A.phonebook()) },
    { label: 'Messages', run: () => OS.push(A.messages()) },
    { label: 'Call register', run: () => OS.push(A.callRegister()) },
    { label: 'Tones', run: () => OS.push(A.tones()) },
    { label: 'Settings', run: () => OS.push(A.settings()) },
    { label: 'Games', run: () => OS.push(A.games()) },
    { label: 'Calculator', run: () => OS.push(A.calc()) },
    { label: 'Reminders', run: () => OS.push(A.reminders()) },
    { label: 'Clock', run: () => OS.push(A.clock()) },
    { label: 'Profiles', run: () => OS.push(A.profiles()) }
  ] });

  return A;
};
