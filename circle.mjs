import { keyName, keySignature, tonicName, tonics } from './theory.mjs';

const labels = {
  en: {
    circle: 'Circle of fifths',
    key: 'Key',
    major: 'major',
    minor: 'minor',
    outer: 'Major keys on the outer ring',
    inner: 'Relative minor keys on the inner ring',
    step: 'step',
    steps: 'steps',
    root: 'root',
    hint: 'Distance counts the shortest path around the circle. Relative major and minor keys share a sector.',
    alternate: 'Switch to the enharmonic spelling',
    chord: 'Played chord',
    selected: 'Selected key',
  },
  de: {
    circle: 'Quintenzirkel',
    key: 'Tonart',
    major: 'Dur',
    minor: 'Moll',
    outer: 'Durtonarten im Außenring',
    inner: 'Parallele Molltonarten im Innenring',
    step: 'Schritt',
    steps: 'Schritte',
    root: 'Grundton',
    hint: 'Der Abstand zählt die Sektoren auf dem kürzesten Weg im Quintenzirkel. Paralleltonarten teilen sich einen Sektor.',
    alternate: 'Zur enharmonischen Schreibweise wechseln',
    chord: 'Gespielter Akkord',
    selected: 'Gewählte Tonart',
  },
  es: {
    circle: 'Círculo de quintas',
    key: 'Tonalidad',
    major: 'mayor',
    minor: 'menor',
    outer: 'Tonalidades mayores en el anillo exterior',
    inner: 'Relativas menores en el anillo interior',
    step: 'paso',
    steps: 'pasos',
    root: 'fundamental',
    hint: 'La distancia cuenta los sectores por el camino más corto. Las tonalidades relativas comparten un sector.',
    alternate: 'Cambiar a la grafía enarmónica',
    chord: 'Acorde tocado',
    selected: 'Tonalidad elegida',
  },
};

const modes = ['major', 'minor'];
const wrap = (n) => ((n % 12) + 12) % 12;
const signatures = Array.from({ length: 12 }, (_, sector) =>
  Array.from({ length: 15 }, (_, i) => i - 7).filter((sig) => wrap(sig) === sector),
);
const names = { major: tonics('major'), minor: tonics('minor') };

// Where a sector admits two conventional spellings, prefer the nearer written
// signature. Keeping the signed signature preserves choices such as C-flat and A-flat minor.
export function circleKey(sector, mode, selectedSignature) {
  const options = signatures[sector];
  const sig = options.reduce((best, other) =>
    Math.abs(other - selectedSignature) < Math.abs(best - selectedSignature) ? other : best,
  );
  return names[mode][sig + 7];
}

export function chordPosition(chord, tonic, mode) {
  if (!chord) return null;
  const members = chord.formula.split(' ');
  // Only chords containing a major/minor triad use the corresponding key family.
  // Suspended, diminished, augmented, and altered-fifth chords get a root marker.
  const family =
    members.includes('5') && (members.includes('3') ? 'major' : members.includes('♭3') && 'minor');
  const ring = family || mode;
  const sector = wrap((chord.rootPC - (ring === 'minor' ? 9 : 0)) * 7);
  const clockwise = wrap(sector - keySignature(tonic, mode));
  return { sector, ring, rootOnly: !family, distance: Math.min(clockwise, 12 - clockwise) };
}

const svgNS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attributes = {}) {
  const el = document.createElementNS(svgNS, tag);
  for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, value);
  return el;
}
function point(angle, radius) {
  const a = (angle * Math.PI) / 180;
  return [120 + radius * Math.sin(a), 120 - radius * Math.cos(a)];
}
function wedge(sector, inner, outer) {
  const start = 30 * sector - 15,
    end = start + 30;
  return `M${point(start, outer)} A${outer} ${outer} 0 0 1 ${point(end, outer)}
    L${point(end, inner)} A${inner} ${inner} 0 0 0 ${point(start, inner)} Z`;
}
function labelAt(x, y, className) {
  return svgEl('text', { x, y, class: className, 'text-anchor': 'middle', 'dominant-baseline': 'central' });
}

export function createCircle(host, onSelect) {
  host.classList.add('fifths');
  const dial = svgEl('svg', { viewBox: '0 0 240 240', class: 'fifths-dial', role: 'radiogroup' });
  const cells = [];
  for (const ring of modes) {
    const major = ring === 'major',
      inner = major ? 87 : 53,
      outer = major ? 116 : 86;
    for (let sector = 0; sector < 12; sector++) {
      const node = svgEl('g', {
        class: 'fifths-cell',
        role: 'radio',
        tabindex: '-1',
        'data-sector': sector,
        'data-ring': ring,
      });
      const title = svgEl('title');
      const face = svgEl('path', { class: 'fifths-face', d: wedge(sector, inner, outer) });
      const label = labelAt(...point(30 * sector, (inner + outer) / 2), 'fifths-note');
      const [x, y] = point(30 * sector, outer - 5);
      const dot = svgEl('circle', { class: 'fifths-dot', cx: x, cy: y, r: 2.4 });
      node.append(title, face, label, dot);
      dial.append(node);
      cells.push({ node, ring, sector, title, label });
    }
  }
  const hub = svgEl('g', { 'aria-hidden': 'true', class: 'fifths-hub' });
  const keyLabel = labelAt(120, 96, 'fifths-eyebrow'),
    rootLabel = labelAt(120, 119, 'fifths-tonic'),
    modeLabel = labelAt(120, 140, 'fifths-mode');
  hub.append(svgEl('circle', { cx: 120, cy: 120, r: 51.7 }), keyLabel, rootLabel, modeLabel);
  dial.append(hub);

  const caption = document.createElement('div');
  caption.className = 'fifths-caption';
  const marker = document.createElement('span');
  marker.className = 'fifths-swatch';
  marker.setAttribute('aria-hidden', 'true');
  const reading = document.createElement('span');
  caption.append(marker, reading);
  const alternate = document.createElement('button');
  alternate.type = 'button';
  alternate.className = 'fifths-enharmonic';
  alternate.hidden = true;
  host.append(dial, caption, alternate);

  let selected;
  function choose(node) {
    onSelect(node.dataset.tonic, node.dataset.ring);
  }
  dial.addEventListener('click', (event) => {
    const cell = event.target.closest('.fifths-cell');
    if (cell) choose(cell);
  });
  dial.addEventListener('keydown', (event) => {
    const node = event.target.closest('.fifths-cell');
    if (!node) return;
    const { ring } = node.dataset;
    let sector = Number(node.dataset.sector),
      targetRing = ring;
    switch (event.key) {
      case 'ArrowRight':
        sector = wrap(sector + 1);
        break;
      case 'ArrowLeft':
        sector = wrap(sector - 1);
        break;
      case 'ArrowUp':
        targetRing = 'major';
        break;
      case 'ArrowDown':
        targetRing = 'minor';
        break;
      case 'Enter':
      case ' ':
        break;
      default:
        return;
    }
    event.preventDefault();
    const target = cells[(targetRing === 'major' ? 0 : 12) + sector].node;
    choose(target);
    target.focus();
  });
  alternate.addEventListener('click', () => onSelect(alternate.dataset.tonic, selected.mode));

  return ({ tonic, mode, lang, chord }) => {
    const t = labels[lang];
    const sig = keySignature(tonic, mode),
      homeSector = wrap(sig);
    if (!selected || selected.tonic !== tonic || selected.mode !== mode || selected.lang !== lang) {
      selected = { tonic, mode, lang };
      dial.setAttribute('aria-label', [t.circle, t.outer, t.inner].join('. '));
      keyLabel.textContent = t.key;
      rootLabel.textContent = tonicName(tonic, lang);
      if (mode === 'minor' && lang === 'de') rootLabel.textContent = rootLabel.textContent.toLowerCase();
      modeLabel.textContent = t[mode];
      for (const { node, ring, sector, label, title } of cells) {
        const k = circleKey(sector, ring, sig);
        const checked = sector === homeSector && ring === mode;
        const key = keyName(k, ring, lang);
        node.dataset.tonic = k;
        node.setAttribute('aria-checked', String(checked));
        node.setAttribute('tabindex', checked ? '0' : '-1');
        node.setAttribute('aria-label', key);
        title.textContent = key;
        const name = tonicName(k, lang);
        label.textContent = ring === 'major' ? name : lang === 'de' ? name.toLowerCase() : name + 'm';
      }
      const otherSig = signatures[homeSector].find((s) => s !== sig);
      alternate.hidden = otherSig === undefined;
      if (!alternate.hidden) {
        const otherKey = names[mode][otherSig + 7],
          display = keyName(otherKey, mode, lang);
        alternate.dataset.tonic = otherKey;
        alternate.textContent = '≈ ' + display;
        alternate.title = t.alternate + ' · ' + display;
        alternate.setAttribute('aria-label', alternate.title);
      }
    }
    const pos = chordPosition(chord, tonic, mode);
    for (const { node, ring, sector } of cells) {
      const marked = pos?.ring === ring && pos.sector === sector;
      node.classList.toggle('fifths-played', marked && !pos.rootOnly);
      node.classList.toggle('fifths-root-only', marked && pos.rootOnly);
    }
    caption.classList.toggle('fifths-has-chord', Boolean(pos));
    if (pos) {
      const description = pos.rootOnly ? `${t.root} ${chord.root}` : chord.jazz;
      reading.textContent = `${description} · ${pos.distance} ${pos.distance === 1 ? t.step : t.steps}`;
      caption.title = [t.chord + ' · ' + chord.jazz, t.hint].join('. ');
    } else {
      reading.textContent = t.circle;
      caption.title = [t.selected + ' · ' + keyName(tonic, mode, lang), t.outer, t.inner].join('. ');
    }
  };
}
