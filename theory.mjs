// Pitches are spelled as a letter plus an alteration. MIDI alone carries neither.
const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const natural = [0, 2, 4, 5, 7, 9, 11];
const keys = {
  major: ['Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'],
  minor: ['Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#'],
};
const minorSteps = [0, 2, 3, 5, 7, 8, 10];
const mod = (value, n = 12) => ((value % n) + n) % n;
const difference = (a, b) => mod(a - b + 6) - 6;
const accidental = (alter) => (alter < 0 ? '♭' : '♯').repeat(Math.abs(alter));
const localized = (lang, en, de, es) => ({ en, de, es })[lang] ?? en;

export const tonics = (mode = 'major') => [...keys[mode]];
export const keySignature = (tonic, mode = 'major') => keys[mode].indexOf(tonic) - 7;

function parseTonic(tonic) {
  const index = letters.indexOf(tonic[0]);
  const alter = (tonic.slice(1).match(/#/g) || []).length - (tonic.slice(1).match(/b/g) || []).length;
  return { index, alter, pc: mod(natural[index] + alter) };
}

function noteName(index, alter, lang) {
  if (lang === 'de') {
    const base = ['C', 'D', 'E', 'F', 'G', 'A', 'H'][index];
    if (alter >= 0) return base + 'is'.repeat(alter);
    const firstFlat = ['Ces', 'Des', 'Es', 'Fes', 'Ges', 'As', 'B'][index];
    if (alter === -1) return firstFlat;
    return (index === 6 ? 'Hes' : firstFlat) + 'es'.repeat(-alter - 1);
  }
  const base = lang === 'es' ? ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'][index] : letters[index];
  return base + accidental(alter);
}

export function tonicName(tonic, lang = 'en') {
  const { index, alter } = parseTonic(tonic);
  return noteName(index, alter, lang);
}

export function keyName(tonic, mode = 'major', lang = 'en') {
  return tonalName(tonicName(tonic, lang), mode, lang);
}

function tonalName(root, mode, lang) {
  if (lang === 'de') return mode === 'major' ? root + '-Dur' : root.toLowerCase() + '-Moll';
  return (
    root +
    ' ' +
    (mode === 'major' ? localized(lang, 'major', '', 'mayor') : localized(lang, 'minor', '', 'menor'))
  );
}

function spelling(pc, index) {
  index = mod(index, 7);
  return { pc, index, alter: difference(pc, natural[index]) };
}

function keySpelling(pc, key, mode) {
  const offset = mod(pc - key.pc);
  const scale = mode === 'minor' ? minorSteps : natural;
  let degree = scale.indexOf(offset);
  // Chromatic neighbours when the chord does not imply a more specific letter.
  if (degree === -1) degree = [0, 1, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6][offset];
  return spelling(pc, key.index + degree);
}

// Formula degrees supply both the pitch-class set and its letter spelling.
// Omittable members are accepted only when every other member is played.
const rows = [
  ['major', '', '1 3 5', 'major triad', 'Dur-Dreiklang', 'tríada mayor'],
  ['minor', 'm', '1 b3 5', 'minor triad', 'Moll-Dreiklang', 'tríada menor'],
  ['diminished', 'dim', '1 b3 b5', 'diminished triad', 'verminderter Dreiklang', 'tríada disminuida'],
  ['augmented', 'aug', '1 3 #5', 'augmented triad', 'übermäßiger Dreiklang', 'tríada aumentada'],
  ['sus2', 'sus2', '1 2 5', 'suspended second', 'Sus2-Akkord', 'acorde de segunda suspendida'],
  ['sus4', 'sus4', '1 4 5', 'suspended fourth', 'Quartvorhalt (sus4)', 'acorde de cuarta suspendida'],
  [
    'maj7',
    'maj7',
    '1 3 5 7',
    'major seventh chord',
    'Dur-Akkord mit großer Septime',
    'acorde mayor con séptima mayor',
    '5',
  ],
  [
    'dom7',
    '7',
    '1 3 5 b7',
    'dominant seventh chord',
    'Dominantseptakkord',
    'acorde de séptima de dominante',
    '5',
  ],
  ['min7', 'm7', '1 b3 5 b7', 'minor seventh chord', 'Mollseptakkord', 'acorde menor con séptima menor', '5'],
  [
    'halfdim7',
    'm7♭5',
    '1 b3 b5 b7',
    'half-diminished seventh chord',
    'halbverminderter Septakkord',
    'acorde de séptima semidisminuida',
  ],
  [
    'dim7',
    'dim7',
    '1 b3 b5 bb7',
    'diminished seventh chord',
    'verminderter Septakkord',
    'acorde de séptima disminuida',
  ],
  [
    'minmaj7',
    'm(maj7)',
    '1 b3 5 7',
    'minor-major seventh chord',
    'Moll-Akkord mit großer Septime',
    'acorde menor con séptima mayor',
    '5',
  ],
  [
    'augmaj7',
    'aug(maj7)',
    '1 3 #5 7',
    'augmented major seventh chord',
    'übermäßiger Dreiklang mit großer Septime',
    'tríada aumentada con séptima mayor',
  ],
  [
    '6',
    '6',
    '1 3 5 6',
    'major sixth chord',
    'Dur-Akkord mit hinzugefügter Sexte',
    'acorde mayor con sexta añadida',
  ],
  [
    'min6',
    'm6',
    '1 b3 5 6',
    'minor sixth chord',
    'Moll-Akkord mit hinzugefügter Sexte',
    'acorde menor con sexta añadida',
  ],
  [
    'add9',
    'add9',
    '1 3 5 9',
    'major triad with added ninth',
    'Dur-Akkord mit hinzugefügter None',
    'tríada mayor con novena añadida',
  ],
  [
    'minadd9',
    'm(add9)',
    '1 b3 5 9',
    'minor triad with added ninth',
    'Moll-Akkord mit hinzugefügter None',
    'tríada menor con novena añadida',
  ],
  [
    'add11',
    'add11',
    '1 3 5 11',
    'major triad with added eleventh',
    'Dur-Akkord mit hinzugefügter Undezime',
    'tríada mayor con oncena añadida',
  ],
  [
    'minadd11',
    'm(add11)',
    '1 b3 5 11',
    'minor triad with added eleventh',
    'Moll-Akkord mit hinzugefügter Undezime',
    'tríada menor con oncena añadida',
  ],
  [
    '69',
    '6/9',
    '1 3 5 6 9',
    'sixth–ninth chord',
    'Dur-Sextnonenakkord',
    'acorde mayor con sexta y novena añadidas',
    '5',
  ],
  [
    'min69',
    'm6/9',
    '1 b3 5 6 9',
    'minor sixth–ninth chord',
    'Moll-Sextnonenakkord',
    'acorde menor con sexta y novena añadidas',
    '5',
  ],
  [
    '7sus4',
    '7sus4',
    '1 4 5 b7',
    'suspended dominant seventh',
    'Dominantseptakkord mit Quartvorhalt',
    'séptima de dominante con cuarta suspendida',
  ],
  [
    '9sus4',
    '9sus4',
    '1 4 5 b7 9',
    'suspended dominant ninth',
    'Dominantnonenakkord mit Quartvorhalt',
    'novena de dominante con cuarta suspendida',
    '5',
  ],
  [
    '9',
    '9',
    '1 3 5 b7 9',
    'dominant ninth chord',
    'Dominantnonenakkord',
    'acorde de novena de dominante',
    '5',
  ],
  [
    'maj9',
    'maj9',
    '1 3 5 7 9',
    'major ninth chord',
    'Dur-Nonenakkord mit großer Septime',
    'acorde mayor con séptima mayor y novena',
    '5',
  ],
  [
    'min9',
    'm9',
    '1 b3 5 b7 9',
    'minor ninth chord',
    'Mollnonenakkord',
    'acorde menor con séptima menor y novena',
    '5',
  ],
  [
    '11',
    '11',
    '1 3 5 b7 9 11',
    'dominant eleventh chord',
    'Dominantundezimenakkord',
    'acorde de oncena de dominante',
    '5 9',
  ],
  [
    'maj11',
    'maj11',
    '1 3 5 7 9 11',
    'major eleventh chord',
    'Dur-Undezimenakkord mit großer Septime',
    'acorde mayor con séptima mayor y oncena',
    '5 9',
  ],
  [
    'min11',
    'm11',
    '1 b3 5 b7 9 11',
    'minor eleventh chord',
    'Mollundezimenakkord',
    'acorde menor con oncena',
    '5 9',
  ],
  [
    '13',
    '13',
    '1 3 5 b7 9 11 13',
    'dominant thirteenth chord',
    'Dominanttredezimenakkord',
    'acorde de trecena de dominante',
    '5 9 11',
  ],
  [
    'maj13',
    'maj13',
    '1 3 5 7 9 11 13',
    'major thirteenth chord',
    'Dur-Tredezimenakkord mit großer Septime',
    'acorde mayor con séptima mayor y trecena',
    '5 9 11',
  ],
  [
    'min13',
    'm13',
    '1 b3 5 b7 9 11 13',
    'minor thirteenth chord',
    'Molltredezimenakkord',
    'acorde menor con trecena',
    '5 9 11',
  ],
  [
    '7b5',
    '7♭5',
    '1 3 b5 b7',
    'dominant seventh with flat fifth',
    'Dominantseptakkord mit tiefalterierter Quinte',
    'séptima de dominante con quinta disminuida',
  ],
  [
    '7s5',
    '7♯5',
    '1 3 #5 b7',
    'dominant seventh with sharp fifth',
    'Dominantseptakkord mit hochalterierter Quinte',
    'séptima de dominante con quinta aumentada',
  ],
  [
    '7b9',
    '7♭9',
    '1 3 5 b7 b9',
    'dominant seventh with flat ninth',
    'Dominantseptakkord mit kleiner None',
    'séptima de dominante con novena menor',
    '5',
  ],
  [
    '7s9',
    '7♯9',
    '1 3 5 b7 #9',
    'dominant seventh with sharp ninth',
    'Dominantseptakkord mit übermäßiger None',
    'séptima de dominante con novena aumentada',
    '5',
  ],
  [
    '7s11',
    '7♯11',
    '1 3 5 b7 #11',
    'dominant seventh with sharp eleventh',
    'Dominantseptakkord mit übermäßiger Undezime',
    'séptima de dominante con oncena aumentada',
    '5',
  ],
  [
    '7b13',
    '7♭13',
    '1 3 5 b7 b13',
    'dominant seventh with flat thirteenth',
    'Dominantseptakkord mit kleiner Tredezime',
    'séptima de dominante con trecena menor',
    '5',
  ],
  [
    'maj7s11',
    'maj7♯11',
    '1 3 5 7 #11',
    'major seventh with sharp eleventh',
    'Dur-Major-Septakkord mit übermäßiger Undezime',
    'séptima mayor con oncena aumentada',
    '5',
  ],
  [
    '9s11',
    '9♯11',
    '1 3 5 b7 9 #11',
    'dominant ninth with sharp eleventh',
    'Dominantnonenakkord mit übermäßiger Undezime',
    'novena de dominante con oncena aumentada',
    '5',
  ],
  [
    '13s11',
    '13♯11',
    '1 3 5 b7 9 #11 13',
    'dominant thirteenth with sharp eleventh',
    'Dominanttredezimenakkord mit übermäßiger Undezime',
    'trecena de dominante con oncena aumentada',
    '5 9',
  ],
];

function degreeMember(token) {
  const degree = Number(token.match(/\d+/)[0]);
  const alter = token.includes('#') ? 1 : -(token.match(/b/g) || []).length;
  return { token, degree, step: (degree - 1) % 7, pc: mod(natural[(degree - 1) % 7] + alter) };
}
const unicodeFormula = (s) => s.replaceAll('b', '♭').replaceAll('#', '♯');
const qualities = rows.map(([id, suffix, formula, en, de, es, optional = '']) => ({
  id,
  suffix,
  formula: unicodeFormula(formula),
  en,
  de,
  es,
  members: formula.split(' ').map(degreeMember),
  optional: optional.split(' '),
}));
export const qualityIds = qualities.map((q) => q.id);
const byId = new Map(qualities.map((q) => [q.id, q]));
export function qualityInfo(id, lang = 'en') {
  const q = byId.get(id);
  return q ? { id, quality: q[lang] ?? q.en, formula: q.formula, suffix: q.suffix } : null;
}

// Index relative pitch masks once, including permitted omissions.
const shapes = new Map();
for (const q of qualities) {
  let masks = [{ bits: 0, omitted: [] }];
  for (const member of q.members) {
    const included = masks.map(({ bits, omitted }) => ({ bits: bits | (1 << member.pc), omitted }));
    if (q.optional.includes(member.token)) {
      included.push(...masks.map(({ bits, omitted }) => ({ bits, omitted: [...omitted, member.token] })));
    }
    masks = included;
  }
  for (const { bits, omitted } of masks) {
    if (!shapes.has(bits)) shapes.set(bits, []);
    shapes.get(bits).push({ q, omitted });
  }
}

function matches(pcs, bass, key, mode) {
  const hits = [];
  const scale = mode === 'minor' ? minorSteps : natural;
  for (const root of pcs) {
    const mask = pcs.reduce((bits, pc) => bits | (1 << mod(pc - root)), 0);
    for (const hit of shapes.get(mask) || []) {
      // Complete readings take precedence over inferred omissions. Among equal
      // readings prefer a root-position chord, then a root in the chosen key.
      const offset = mod(root - key.pc);
      // All four inversions of a diminished seventh have the same MIDI shape.
      // In a selected key, favour its leading-tone reading over a respelt bass root.
      const leadingTone = hit.q.id === 'dim7' && offset === 11;
      const score =
        100 * hit.omitted.length +
        (bass === root ? 0 : 10) +
        (scale.includes(offset) ? 0 : 1) -
        (leadingTone ? 15 : 0);
      hits.push({ ...hit, root, score });
    }
  }
  return hits.sort((a, b) => a.score - b.score);
}

const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
function romanBase(hit, rootSpell, key, mode) {
  const step = mod(rootSpell.index - key.index, 7);
  const offset = mod(hit.root - key.pc);
  const scale = mode === 'minor' ? minorSteps : natural;
  const minorThird = hit.q.members.some((m) => m.token === 'b3');
  const diminished = ['dim7', 'diminished', 'halfdim7'].includes(hit.q.id);
  const suffix = diminished
    ? hit.q.id === 'halfdim7'
      ? 'ø'
      : '°'
    : ['augmented', 'augmaj7'].includes(hit.q.id)
      ? '+'
      : '';
  return (
    accidental(difference(offset, scale[step])) +
    (minorThird ? romans[step].toLowerCase() : romans[step]) +
    suffix
  );
}

function tonalReading(hit, rootSpell, key, mode, bass) {
  const { q, root } = hit,
    offset = mod(root - key.pc);
  const rootDegree = romanBase(hit, rootSpell, key, mode);
  const inversion = q.members.findIndex((m) => m.pc === mod(bass - root));
  const inv = q.members[inversion]?.token;
  let roman = rootDegree,
    target = '',
    fn = '';
  const minor = mode === 'minor';
  if (q.id === 'major' || q.id === 'minor') {
    const map = minor
      ? { '0:minor': 't', '3:major': 'tP', '5:minor': 's', '7:major': 'D', '7:minor': 'd', '8:major': 'sP' }
      : { '0:major': 'T', '2:minor': 'Sp', '4:minor': 'Dp', '5:major': 'S', '7:major': 'D', '9:minor': 'Tp' };
    fn = map[offset + ':' + q.id] || '';
  }
  if (offset === 7 && q.id === 'dom7') fn = 'D⁷';
  // A non-diatonic major triad or dominant seventh can point to a diatonic
  // major/minor target a fifth below. A snapshot cannot verify its resolution.
  const scale = minor ? minorSteps : natural;
  const targetStep = scale.indexOf(mod(offset + 5));
  const diatonicMajor = (minor ? [3, 8, 10] : [0, 5, 7]).includes(offset);
  if (
    offset !== 7 &&
    targetStep > 0 &&
    targetStep !== (minor ? 1 : 6) &&
    (q.id === 'dom7' || (q.id === 'major' && !diatonicMajor))
  ) {
    const targetMinor = (minor ? [0, 3, 4] : [1, 2, 5]).includes(targetStep);
    // The tonal dominant in minor is normally major.
    target = '/' + (targetMinor && targetStep !== 4 ? romans[targetStep].toLowerCase() : romans[targetStep]);
    roman = 'V';
    if (targetStep === 4) fn = q.id === 'dom7' ? 'DD⁷' : 'DD';
  }
  const triad = ['major', 'minor', 'diminished', 'augmented'].includes(q.id);
  const seventh = ['dom7', 'maj7', 'min7', 'dim7', 'halfdim7', 'minmaj7', 'augmaj7'].includes(q.id);
  let figure = '';
  if (triad) figure = ['', '⁶', '⁶₄'][inversion];
  else if (seventh) {
    figure = ['⁷', '⁶₅', '⁴₃', '⁴₂'][inversion];
    if (['maj7', 'minmaj7', 'augmaj7'].includes(q.id)) figure = '(maj7)' + (inversion ? figure : '');
  } else {
    const suffix = q.suffix.replace(/^m(?!aj)/, '').replace(/^\((.*)\)$/, '$1');
    figure = '(' + (suffix === '6' ? 'add6' : suffix) + ')';
    if (inversion > 0 && inv) figure += '/' + unicodeFormula(inv);
  }
  return { degree: roman + figure + target, rootDegree, fn, inversion, target: target.slice(1) };
}

function spellHit(hit, key, mode) {
  let root = keySpelling(hit.root, key, mode);
  const scale = mode === 'minor' ? minorSteps : natural;
  const tonesFor = (r) =>
    new Map(
      hit.q.members.map((m) => {
        const pc = mod(hit.root + m.pc);
        return [pc, spelling(pc, r.index + m.step)];
      }),
    );
  let tones = tonesFor(root);
  if (!scale.includes(mod(hit.root - key.pc))) {
    // A chromatic root has no unique letter. Compare how its whole chord
    // departs from the signature: C♯–E–G is more legible in C than D♭–F♭–A𝄫.
    const keyAlters = scale.map((offset, i) => spelling(mod(key.pc + offset), key.index + i).alter);
    const cost = (map) =>
      [...map.values()].reduce((sum, tone) => {
        const keyAlter = keyAlters[mod(tone.index - key.index, 7)];
        return sum + (tone.alter - keyAlter) ** 2;
      }, 0);
    let best = cost(tones);
    for (const index of [root.index - 1, root.index + 1]) {
      const candidate = spelling(hit.root, index);
      const map = tonesFor(candidate),
        score = cost(map);
      if (score < best) {
        root = candidate;
        tones = map;
        best = score;
      }
    }
  }
  return { root, tones };
}

function jazzSymbol(hit, bass, key, mode, lang) {
  const { root, tones } = spellHit(hit, key, mode);
  const name = (s) => noteName(s.index, s.alter, lang === 'de' ? 'de' : 'en');
  return name(root) + hit.q.suffix + (bass !== hit.root ? '/' + name(tones.get(bass)) : '');
}

function chordDescription(hit, hits, bass, key, mode, lang, spelt) {
  const { q } = hit;
  const rootName = noteName(spelt.root.index, spelt.root.alter, lang);
  const bassSpelling = spelt.tones.get(bass);
  const bassName = noteName(bassSpelling.index, bassSpelling.alter, lang);
  const info = qualityInfo(q.id, lang);
  const name = ['major', 'minor'].includes(q.id)
    ? tonalName(rootName, q.id, lang)
    : rootName + ' · ' + info.quality;
  // Show equally complete enharmonic readings; broader omission-based matches
  // would obscure familiar labels with speculative extensions.
  const equallyComplete = hits.filter((h) => h !== hit && h.omitted.length === hit.omitted.length);
  const alternatives = [...new Set(equallyComplete.map((h) => jazzSymbol(h, bass, key, mode, lang)))];
  return {
    ...info,
    ...tonalReading(hit, spelt.root, key, mode, bass),
    name,
    root: rootName,
    bass: bassName,
    rootPC: hit.root,
    jazz: jazzSymbol(hit, bass, key, mode, lang),
    alternatives,
    omitted: hit.omitted.map(unicodeFormula),
  };
}

const intervalOrdinals = {
  en: [
    'unison',
    'second',
    'third',
    'fourth',
    'fifth',
    'sixth',
    'seventh',
    'octave',
    'ninth',
    'tenth',
    'eleventh',
    'twelfth',
    'thirteenth',
    'fourteenth',
    'fifteenth',
  ],
  de: [
    'Prime',
    'Sekunde',
    'Terz',
    'Quarte',
    'Quinte',
    'Sexte',
    'Septime',
    'Oktave',
    'None',
    'Dezime',
    'Undezime',
    'Duodezime',
    'Tredezime',
    'Quartdezime',
    'Doppeloktave',
  ],
  es: [
    'unísono',
    'segunda',
    'tercera',
    'cuarta',
    'quinta',
    'sexta',
    'séptima',
    'octava',
    'novena',
    'décima',
    'undécima',
    'duodécima',
    'decimotercera',
    'decimocuarta',
    'decimoquinta',
  ],
};
function englishOrdinal(n) {
  const ending = n % 100 >= 11 && n % 100 <= 13 ? 'th' : { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th';
  return n + ending;
}
function intervalBetween(low, high, lang) {
  const writtenSteps =
    (high.octave - low.octave) * 7 + letters.indexOf(high.letter) - letters.indexOf(low.letter);
  const number = Math.abs(writtenSteps) + 1,
    simple = (number - 1) % 7;
  const semitones = high.midi - low.midi;
  // Even an ascending MIDI pair can be spelt as a descending written interval
  // (e.g. D♯ immediately below E♭♭). Measure the chromatic span in its written direction.
  const delta =
    (writtenSteps < 0 ? -semitones : semitones) - natural[simple] - 12 * Math.floor((number - 1) / 7);
  const perfect = [0, 3, 4].includes(simple);
  let code = perfect ? 'P' : 'M',
    repetitions = 1;
  if (!perfect && delta === -1) code = 'm';
  else if (delta > 0) {
    code = 'A';
    repetitions = delta;
  } else if (delta < 0) {
    code = 'd';
    repetitions = perfect ? -delta : -delta - 1;
  }
  const words = {
    P: ['perfect', 'reine', 'justa'],
    M: ['major', 'große', 'mayor'],
    m: ['minor', 'kleine', 'menor'],
    A: ['augmented', 'übermäßige', 'aumentada'],
    d: ['diminished', 'verminderte', 'disminuida'],
  };
  let [en, de, es] = words[code];
  if (repetitions > 1) {
    en = (repetitions === 2 ? 'doubly ' : repetitions + '× ') + en;
    de = (repetitions === 2 ? 'doppelt ' : repetitions + '× ') + de;
    es = (repetitions === 2 ? 'doblemente ' : repetitions + '× ') + es;
  }
  const ordinal =
    intervalOrdinals[lang]?.[number - 1] ||
    localized(lang, englishOrdinal(number), number + '.', number + '.ª');
  if (number === 1 && es.endsWith('a')) es = es.slice(0, -1) + 'o';
  const label = localized(lang, en + ' ' + ordinal, de + ' ' + ordinal, ordinal + ' ' + es);
  return {
    from: low.midi,
    to: high.midi,
    label,
    short: code.repeat(repetitions) + number,
    number,
    semitones,
  };
}

export function analyze(midiNotes, tonic = 'C', mode = 'major', lang = 'en') {
  const midi = [...new Set(midiNotes)]
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 127)
    .sort((a, b) => a - b);
  const pcs = [...new Set(midi.map((n) => n % 12))];
  const key = parseTonic(tonic);
  const bass = pcs[0];
  const hits = pcs.length >= 3 && pcs.length <= 7 ? matches(pcs, bass, key, mode) : [];
  const hit = hits[0];
  const spelt = hit && spellHit(hit, key, mode);
  const notes = midi.map((n) => {
    const { index, alter } = spelt?.tones.get(n % 12) || keySpelling(n % 12, key, mode);
    const octave = (n - natural[index] - alter) / 12 - 1;
    return { midi: n, letter: letters[index], alter, octave, name: noteName(index, alter, lang) };
  });
  const intervals = notes.flatMap((n, i) =>
    notes.slice(i + 1).map((other) => intervalBetween(n, other, lang)),
  );
  return { notes, intervals, chord: hit ? chordDescription(hit, hits, bass, key, mode, lang, spelt) : null };
}
