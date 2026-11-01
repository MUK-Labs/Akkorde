import { analyze, tonics, keyName } from './theory.mjs';
import { renderScore } from './score.mjs';
import { MidiInput } from './midi.mjs';
import { strings } from './strings.mjs';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
let prefs = {};
try {
  prefs = JSON.parse(localStorage.getItem('akkorde.studio')) || {};
} catch {}
let lang = [params.get('lang'), prefs.lang, navigator.language?.slice(0, 2), 'en'].find((l) =>
  Object.hasOwn(strings, l),
);
let mode = (params.get('mode') || prefs.mode) === 'minor' ? 'minor' : 'major';
let tonic = params.get('tonic') || prefs.tonic;
if (!tonics(mode).includes(tonic)) tonic = 'C';
const views = { intervals: true, jazz: true, degree: true, function: true, ...prefs.views };
let hold = prefs.hold !== false;
const preset = [
  { notes: [53, 60, 69], tonic: 'C', mode: 'major' },
  { notes: [50, 57, 60, 66], tonic: 'C', mode: 'major' },
  { notes: [48, 55, 64, 74], tonic: 'C', mode: 'major' },
  { notes: [44, 51, 59], tonic: 'Ab', mode: 'minor' },
];
const loaded = params
  .get('notes')
  ?.split(',')
  .filter((n) => /^\d{1,3}$/.test(n))
  .map(Number)
  .filter((n) => n <= 127);
let sample = loaded?.length ? { notes: [...new Set(loaded)].sort((a, b) => a - b) } : preset[0];
const latched = new Set(),
  pressed = new Map();
let hardware = [],
  live = [],
  last = [],
  captureTimer,
  expanded = false,
  base = 48,
  analysis;
let midiStatus = { state: 'idle', ports: [], selected: '' };
let audio,
  soundOn = false;
const voices = new Map();
const keyMap = new Map();
const qwerty = [
  'KeyA',
  'KeyW',
  'KeyS',
  'KeyE',
  'KeyD',
  'KeyF',
  'KeyT',
  'KeyG',
  'KeyY',
  'KeyH',
  'KeyU',
  'KeyJ',
  'KeyK',
];
const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#ico-${id}"/></svg>`;
const t = (key) => strings[lang][key];
function save() {
  try {
    localStorage.setItem('akkorde.studio', JSON.stringify({ lang, mode, tonic, views, hold }));
  } catch {}
}
function refUrl(topic, pair) {
  const query = new URLSearchParams({
    lang,
    topic,
    tonic,
    mode,
    notes: analysis.notes.map((n) => n.midi).join(','),
  });
  if (pair) {
    query.set('from', pair.from);
    query.set('to', pair.to);
  }
  return `./reference.html?${query}`;
}
function referenceLink(label, topic, pair) {
  const a = document.createElement('a');
  a.textContent = label;
  a.href = refUrl(topic, pair);
  return a;
}
function pitchLabel(note) {
  return note.name + note.octave;
}
function redraw() {
  const current = sample?.notes || (live.length ? live : last);
  analysis = analyze(current, tonic, mode, lang);
  const { notes, intervals, chord } = analysis;
  renderScore($('score'), notes, { tonic, mode, lang });
  $('guide-link').href = refUrl('guide');
  const badge = sample
    ? preset.includes(sample)
      ? 'example'
      : 'loaded'
    : live.length
      ? 'live'
      : last.length
        ? 'last'
        : 'waiting';
  $('source').textContent = t(badge);
  $('source').dataset.example = String(Boolean(sample));
  $('note-list').textContent = notes.map(pitchLabel).join('  ·  ');
  const hero = $('chord-name');
  const chordTitle = chord && (['major', 'minor'].includes(chord.id) ? chord.name : chord.jazz);
  hero.textContent =
    chordTitle ||
    (notes.length === 2
      ? intervals[0].label
      : notes.length === 1
        ? pitchLabel(notes[0])
        : notes.length
          ? t('noChord')
          : t('empty'));
  if (notes.length >= 2) hero.href = refUrl(chord ? 'chord' : notes.length === 2 ? 'intervals' : 'chord');
  else hero.removeAttribute('href');
  $('quality').textContent = chord
    ? [
        chord.quality,
        chord.inversion === 0 ? t('root') : t('inversions')[chord.inversion] || t('inversion'),
      ].join(' · ')
    : notes.length > 2
      ? t('noMatch')
      : notes.length === 2
        ? `${intervals[0].semitones} ${t('steps')}`
        : notes.length === 1
          ? t('single')
          : '';
  $('readings').replaceChildren();
  for (const [topic, value] of [
    ['jazz', chord?.jazz],
    ['degree', chord?.degree],
    ['function', chord?.fn],
  ]) {
    if (!views[topic]) continue;
    const row = document.createElement('a');
    row.className = 'reading';
    row.href = refUrl(topic);
    const label = document.createElement('span');
    label.textContent = t(topic);
    const symbol = document.createElement('span');
    symbol.className = 'value';
    symbol.textContent = value || '—';
    if (chord && !value && topic === 'function') row.title = t('noFunction');
    symbol.insertAdjacentHTML('beforeend', icon('up-right'));
    row.append(label, symbol);
    $('readings').append(row);
  }
  $('alternate').hidden = !chord?.alternatives.length;
  $('alternate').textContent = chord?.alternatives.length
    ? `${t('other')} · ${chord.alternatives.join(', ')}`
    : '';
  $('interval-strip').hidden = !views.intervals;
  if (views.intervals) {
    $('interval-count').textContent = intervals.length ? `(${intervals.length})` : '';
    const target = $('intervals');
    target.replaceChildren();
    if (!intervals.length) {
      const span = document.createElement('span');
      span.className = 'no-interval';
      span.textContent = t('noIntervals');
      target.append(span);
    }
    for (const pair of expanded ? intervals : intervals.slice(0, 3)) {
      const link = referenceLink(pair.label, 'intervals', pair);
      const pairNames = [pair.from, pair.to]
        .map((p) => pitchLabel(notes.find((n) => n.midi === p)))
        .join(' – ');
      link.title = `${pairNames} · ${pair.label}`;
      link.setAttribute('aria-label', link.title);
      target.append(link);
    }
    if (intervals.length > 3) {
      const show = document.createElement('button');
      show.textContent = expanded ? t('less') : `+${intervals.length - 3}`;
      show.title = t(expanded ? 'less' : 'more');
      show.setAttribute('aria-expanded', String(expanded));
      show.onclick = () => {
        expanded = !expanded;
        redraw();
      };
      target.append(show);
    }
  }
  const lit = new Map((sample || live.length ? notes : []).map((n) => [n.midi, pitchLabel(n)]));
  for (const [n, button] of keyMap) {
    const label = button.dataset.label;
    button.setAttribute('aria-pressed', String(lit.has(n)));
    button.firstElementChild.textContent = lit.get(n) || (n % 12 === 0 ? label : '');
  }
  $('clear').disabled = !sample && !live.length && !last.length;
  [...$('examples').children].forEach((b, i) =>
    b.setAttribute(
      'aria-pressed',
      String(sample === preset[i] && mode === preset[i].mode && tonic === preset[i].tonic),
    ),
  );
}
function midiUI() {
  const { state, ports, selected } = midiStatus;
  $('connect-label').textContent = t(state === 'ready' || state === 'no-inputs' ? 'refresh' : 'connect');
  $('connect').disabled = state === 'requesting';
  $('midi-state').textContent = t(state);
  $('midi-state').dataset.state = state;
  $('port-row').hidden = !ports.length;
  $('ports').replaceChildren(new Option(t('allPorts'), ''), ...ports.map((p) => new Option(p.name, p.id)));
  $('ports').value = selected;
}
function piano() {
  const board = $('piano');
  board.replaceChildren();
  keyMap.clear();
  const end = Math.min(base + 36, 127),
    whites = [],
    blacks = [];
  for (let n = base; n <= end; n++) ([1, 3, 6, 8, 10].includes(n % 12) ? blacks : whites).push(n);
  for (const n of [...whites, ...blacks]) {
    const b = document.createElement('button'),
      black = blacks.includes(n),
      label = pitchLabel(analyze([n], tonic, mode, lang).notes[0]);
    b.className = `key ${black ? 'black' : 'white'}`;
    b.dataset.note = n;
    b.dataset.label = label;
    b.setAttribute('aria-label', label);
    if (black) {
      const width = 62 / whites.length,
        left = whites.indexOf(n - 1) + 1;
      b.style.width = width + '%';
      b.style.left = `${(left / whites.length) * 100 - width / 2}%`;
    }
    b.append(document.createElement('span'));
    board.append(b);
    keyMap.set(n, b);
  }
  $('range').textContent = [base, end]
    .map((n) => pitchLabel(analyze([n], tonic, mode, lang).notes[0]))
    .join(' – ');
  $('octave-down').disabled = base <= 0;
  $('octave-up').disabled = base >= 96;
}
function updateUI() {
  document.documentElement.lang = lang;
  document.title = `Akkorde · ${t('title')}`;
  for (const el of document.querySelectorAll('[data-i]')) el.textContent = t(el.dataset.i);
  for (const el of document.querySelectorAll('[data-lang]'))
    el.setAttribute('aria-pressed', String(el.dataset.lang === lang));
  for (const el of document.querySelectorAll('[data-view]')) el.checked = views[el.dataset.view];
  for (const [id, key] of [
    ['languages', 'language'],
    ['key', 'key'],
    ['display-summary', 'display'],
    ['octave-down', 'lower'],
    ['octave-up', 'higher'],
    ['piano', 'keyboard'],
  ]) {
    $(id).setAttribute('aria-label', t(key));
    $(id).title = t(key);
  }
  $('key').replaceChildren();
  for (const m of ['major', 'minor']) {
    const group = document.createElement('optgroup');
    group.label = t(m);
    for (const k of tonics(m)) {
      group.append(new Option(keyName(k, m, lang), `${k}:${m}`));
    }
    $('key').append(group);
  }
  $('key').value = `${tonic}:${mode}`;
  $('hold').setAttribute('aria-pressed', String(hold));
  $('piano-hint').textContent = t(hold ? 'latchHint' : 'playHint');
  $('sound').setAttribute('aria-pressed', String(soundOn));
  $('sound')
    .querySelector('use')
    .setAttribute('href', soundOn ? '#ico-sound' : '#ico-mute');
  $('examples').replaceChildren();
  preset.forEach((p, i) => {
    const b = document.createElement('button');
    b.textContent = t('samples')[i];
    b.title = keyName(p.tonic, p.mode, lang);
    b.onclick = () => {
      clearNotes();
      sample = p;
      mode = p.mode;
      tonic = p.tonic;
      fitPitches(p.notes);
      updateUI();
      save();
    };
    $('examples').append(b);
  });
  midiUI();
  piano();
  redraw();
}
function playSound() {
  const desired = new Set(soundOn ? live : []);
  for (const [n, { osc, gain }] of voices) {
    if (desired.has(n)) continue;
    const now = audio.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setTargetAtTime(0.0001, now, 0.013);
    osc.stop(now + 0.1);
    voices.delete(n);
  }
  if (!audio || audio.state !== 'running') return;
  for (const n of desired) {
    if (voices.has(n)) continue;
    const osc = audio.createOscillator(),
      gain = audio.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 440 * 2 ** ((n - 69) / 12);
    gain.gain.value = 0.0001;
    gain.gain.setTargetAtTime(0.042, audio.currentTime, 0.015);
    osc.connect(gain).connect(audio.destination);
    osc.start();
    voices.set(n, { osc, gain });
  }
}
function fitPitches(notes) {
  if (!notes.length || notes.every((n) => n >= base && n <= base + 36)) return;
  base = Math.max(0, Math.min(96, Math.floor(notes[0] / 12) * 12));
  piano();
}
function sync(remember = true) {
  clearTimeout(captureTimer);
  const next = [...new Set([...latched, ...pressed.values(), ...hardware])].sort((a, b) => a - b);
  if (next.length) {
    sample = null;
    if (next.some((n) => !live.includes(n))) last = next;
    else
      captureTimer = setTimeout(() => {
        last = next;
      }, 180);
  } else if (!remember) last = [];
  expanded = false;
  live = next;
  playSound();
  redraw();
}
const midi = new MidiInput(
  (notes) => {
    hardware = notes;
    fitPitches(notes);
    sync();
  },
  (status) => {
    midiStatus = status;
    midiUI();
  },
);
function clearNotes() {
  clearTimeout(captureTimer);
  latched.clear();
  pressed.clear();
  hardware = [];
  sample = null;
  last = [];
  midi.clear();
  sync(false);
}
$('connect').onclick = () => midi.connect();
$('ports').onchange = (e) => midi.selectPort(e.target.value);
$('clear').onclick = clearNotes;
$('key').onchange = (e) => {
  [tonic, mode] = e.target.value.split(':');
  save();
  piano();
  redraw();
};
$('languages').onclick = (e) => {
  const l = e.target.closest('button')?.dataset.lang;
  if (!l) return;
  lang = l;
  save();
  updateUI();
};
for (const el of document.querySelectorAll('[data-view]'))
  el.onchange = () => {
    views[el.dataset.view] = el.checked;
    save();
    redraw();
  };
$('hold').onclick = () => {
  hold = !hold;
  latched.clear();
  sync(false);
  save();
  updateUI();
};
$('sound').onclick = async () => {
  try {
    if (!audio) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      audio = new Audio();
    }
    await audio.resume();
    soundOn = !soundOn;
    playSound();
    updateUI();
  } catch {
    $('piano-hint').textContent = t('unavailableAudio');
  }
};
for (const [id, delta] of [
  ['octave-down', -12],
  ['octave-up', 12],
])
  $(id).onclick = () => {
    base += delta;
    piano();
    redraw();
  };
// In hold mode a normal click toggles a key. In touch/momentary mode each pointer
// owns a voice, so lifting one finger never releases another finger's note.
$('piano').onpointerdown = (e) => {
  const key = e.target.closest('[data-note]');
  if (!key || e.button !== 0 || hold) return;
  $('piano').setPointerCapture(e.pointerId);
  pressed.set(e.pointerId, Number(key.dataset.note));
  sync();
};
function releasePointer(e) {
  if (pressed.delete(e.pointerId)) sync();
}
$('piano').addEventListener('pointerup', releasePointer);
$('piano').addEventListener('lostpointercapture', releasePointer);
$('piano').addEventListener('pointercancel', releasePointer);
$('piano').onclick = (e) => {
  const b = e.target.closest('[data-note]');
  if (!b || (!hold && e.detail !== 0)) return;
  const n = Number(b.dataset.note);
  if (latched.has(n)) latched.delete(n);
  else latched.add(n);
  sync(false);
};
window.addEventListener('keydown', (e) => {
  if (
    e.metaKey ||
    e.ctrlKey ||
    e.altKey ||
    e.repeat ||
    e.target.closest('select,input,textarea,[contenteditable=true]')
  )
    return;
  const i = qwerty.indexOf(e.code);
  if (i < 0 || pressed.has(e.code)) return;
  e.preventDefault();
  pressed.set(e.code, Math.min(base + 12 + i, 127));
  sync();
});
window.addEventListener('keyup', (e) => {
  if (pressed.delete(e.code)) sync();
});
window.addEventListener('blur', () => {
  pressed.clear();
  if (hardware.length) midi.clear();
  sync();
});
window.addEventListener('pagehide', () => {
  if (audio) audio.suspend();
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.display')) document.querySelector('.display').open = false;
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.querySelector('.display').open) {
    document.querySelector('.display').open = false;
    $('display-summary').focus();
  }
});
fitPitches(sample.notes);
updateUI();
