import { keySignature } from './theory.mjs';

// The octave shifts in displayPosition keep every MIDI pitch within this frame,
// including ledger lines, accidentals and octave brackets.
const STAFF_WIDTH = 420;
const FRAME_TOP = -54;
const FRAME_BOTTOM = 200;

// One staff space is 10 logical pixels, or 250 units in the engraving outlines.
const SPACE = 10;
const STEP = SPACE / 2;
const LETTERS = 'CDEFGAB';
const staff = {
  treble: { top: 36, topPitch: 5 * 7 + 3, anchor: 66 },
  bass: { top: 106, topPitch: 3 * 7 + 5, anchor: 116 },
};
const glyphForAlter = ['doubleFlat', 'flat', 'natural', 'sharp', 'doubleSharp'];
const ink = 'var(--score-ink, #273934)';
const rules = 'var(--score-rule, #8e9b94)';
const noteColor = 'var(--score-note, #36594d)';
const labels = { de: 'Klaviersystem', en: 'Grand staff', es: 'Gran pentagrama' };

function element(parent, tag, attributes) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  parent.append(node);
  return node;
}

function glyph(parent, shape, x, y, color = ink, scaleX = 0.04, scaleY = scaleX) {
  return element(parent, 'path', {
    d: outlines[shape],
    fill: color,
    transform: `translate(${x} ${y}) scale(${scaleX} ${-scaleY})`,
  });
}

function line(parent, x1, x2, y1, y2, color, width) {
  return element(parent, 'line', { x1, x2, y1, y2, stroke: color, 'stroke-width': width });
}

function makeSignature(count) {
  const sharp = count >= 0;
  // Top to bottom displacements in diatonic steps from the top line of each staff.
  const steps = sharp ? [0, 3, -1, 2, 5, 1, 4] : [4, 1, 5, 2, 6, 3, 7];
  const letters = (sharp ? 'FCGDAEB' : 'BEADGCF').slice(0, Math.abs(count));
  return {
    steps: steps.slice(0, letters.length),
    glyph: sharp ? 'sharp' : 'flat',
    alterations: Object.fromEntries([...letters].map((letter) => [letter, sharp ? 1 : -1])),
  };
}

function displayPosition(note) {
  const position = note.octave * 7 + LETTERS.indexOf(note.letter);
  const clef = position >= 4 * 7 ? 'treble' : 'bass';
  // Keep the entire MIDI range legible; bracket only the notes moved into another octave.
  const shift =
    Math.max(0, Math.floor((position - 6 * 7) / 7)) - Math.max(0, Math.ceil((2 * 7 - position) / 7));
  const y = staff[clef].top + (staff[clef].topPitch - position + shift * 7) * STEP;
  return { ...note, clef, shift, y };
}

function layoutVoice(notes, signature, alteredUnisons) {
  const heads = [];
  const accidentals = [];
  const headRows = [];
  const accidentalBottoms = [];
  let left = -8.5;
  let right = 8.5;
  const gap = notes.some((n) => n.alter === -2) ? 18 : 12;
  for (const note of notes) {
    let col = headRows.findIndex((y) => note.y - y >= SPACE);
    if (col < 0) col = headRows.length;
    headRows[col] = note.y;
    const x = col * 16;
    right = Math.max(right, x + 8.5);
    heads.push({ ...note, x });
    if ((signature.alterations[note.letter] || 0) === note.alter && !alteredUnisons.has(note.y)) continue;
    const shape = glyphForAlter[note.alter + 2];
    if (!shape) continue;
    const top = note.y - (note.alter < 0 ? 18 : 14);
    const bottom = note.y + (note.alter < 0 ? 7 : 14);
    let slot = accidentalBottoms.findIndex((end) => end + 2 <= top);
    if (slot < 0) slot = accidentalBottoms.length;
    accidentalBottoms[slot] = bottom;
    const accidentalX = -12 - gap * (slot + 1);
    accidentals.push({ shape, x: accidentalX, y: note.y });
    left = Math.min(left, accidentalX);
  }
  return { heads, accidentals, left, right };
}

function layoutGroup(notes, signature) {
  // Separate chromatic unisons (e.g. F and F♯ on the same staff position)
  // into neighbouring columns so each accidental belongs to one head.
  const voices = [];
  const counts = new Map();
  for (const note of notes.sort((a, b) => a.y - b.y || a.midi - b.midi)) {
    const index = counts.get(note.y) || 0;
    (voices[index] ||= []).push(note);
    counts.set(note.y, index + 1);
  }
  const unisons = new Set([...counts].filter(([, count]) => count > 1).map(([y]) => y));
  let right = 0;
  const layouts = voices.map((members, index) => {
    const voice = layoutVoice(members, signature, unisons);
    voice.offset = index === 0 ? 0 : right + 8 - voice.left;
    right = voice.offset + voice.right;
    return voice;
  });
  return { voices: layouts, left: layouts[0].left, right, notes };
}

function drawGroup(svg, group, anchor, clef, shift) {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const { heads, accidentals, offset } of group.voices) {
    const left = anchor + offset;
    const ledgers = new Map();
    const top = staff[clef].top;
    const bottom = top + SPACE * 4;
    for (const note of heads) {
      const x = left + note.x;
      minY = Math.min(minY, note.y - 7);
      maxY = Math.max(maxY, note.y + 7);
      const step = note.y < top ? -SPACE : SPACE;
      const first = step < 0 ? top - SPACE : bottom + SPACE;
      for (let y = first; step < 0 ? y >= note.y : y <= note.y; y += step) {
        const span = ledgers.get(y) || [x, x];
        ledgers.set(y, [Math.min(span[0], x - 12), Math.max(span[1], x + 12)]);
      }
    }
    for (const [y, [x1, x2]] of ledgers) line(svg, x1, x2, y, y, ink, 1.2);
    for (const accidental of accidentals) {
      glyph(svg, accidental.shape, left + accidental.x, accidental.y, noteColor);
      minY = Math.min(minY, accidental.y - 18);
      maxY = Math.max(maxY, accidental.y + 14);
    }
    for (const note of heads) glyph(svg, 'head', left + note.x - 8.44, note.y, noteColor);
  }
  if (shift) {
    const up = shift > 0;
    const y = up
      ? Math.min(minY - 5, staff[clef].top - 7)
      : Math.max(maxY + 13, staff[clef].top + SPACE * 4 + 18);
    const number = Math.abs(shift) * 7 + 1;
    const suffix = up ? (number === 8 ? 'va' : 'ma') : number === 8 ? 'vb' : 'mb';
    const width = group.right - group.left;
    const textWidth = number === 8 ? 18 : 25;
    const bracket = width > textWidth + 8;
    const x = anchor + (bracket ? group.left : (group.left + group.right) / 2);
    const indicator = element(svg, 'text', {
      x,
      y,
      fill: ink,
      'font-size': 11,
      'font-style': 'italic',
      'font-family': 'Georgia, serif',
      'text-anchor': bracket ? 'start' : 'middle',
    });
    indicator.textContent = number + suffix;
    if (bracket) {
      const end = anchor + group.right;
      const bracketY = up ? y - 7 : y;
      line(svg, x + textWidth + 2, end, bracketY, bracketY, ink, 0.8).setAttribute('stroke-dasharray', '2 2');
      line(svg, end, end, bracketY, bracketY + (up ? 4 : -4), ink, 0.8);
    }
  }
}

export function renderScore(svg, notes, { tonic = 'C', mode = 'major', lang = 'en' } = {}) {
  svg.replaceChildren();
  const title =
    (labels[lang] || labels.en) +
    (notes.length ? ' · ' + notes.map((n) => n.name + n.octave).join(', ') : '');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', title);
  element(svg, 'title', {}).textContent = title;
  const signature = makeSignature(keySignature(tonic, mode));
  const groups = new Map();
  for (const n of notes) {
    const note = displayPosition(n);
    const octave = Math.abs(note.shift);
    if (!groups.has(octave)) groups.set(octave, new Map());
    const column = groups.get(octave);
    if (!column.has(note.clef)) column.set(note.clef, []);
    column.get(note.clef).push(note);
  }
  const columns = [...groups]
    .sort(([a], [b]) => a - b)
    .map(([, clefs]) => {
      const groups = [...clefs].map(([clef, notes]) => [clef, layoutGroup(notes, signature)]);
      return {
        groups,
        left: Math.min(...groups.map(([, g]) => g.left)),
        right: Math.max(...groups.map(([, g]) => g.right)),
      };
    });
  const start = 78 + signature.steps.length * 11;
  const widths = columns.map((c) => c.right - c.left);
  const needed = widths.reduce((sum, w) => sum + w, 0);
  const width = Math.max(STAFF_WIDTH, start + needed + 32 * (columns.length + 1) + 10);
  for (const [name, s] of Object.entries(staff)) {
    for (let row = 0; row < 5; row++) {
      const y = s.top + row * SPACE;
      line(svg, 22, width - 8, y, y, rules, 0.9);
    }
    glyph(svg, name, 30, s.anchor);
    for (const [i, steps] of signature.steps.entries()) {
      // Relative to its top line, the bass signature sits two diatonic steps lower.
      glyph(svg, signature.glyph, 65 + i * 11, s.top + (steps + (name === 'bass' ? 2 : 0)) * STEP);
    }
  }
  line(svg, 22, 22, staff.treble.top, staff.bass.top + 40, ink, 1.2);
  glyph(svg, 'brace', 9, staff.bass.top + 40, ink, 0.145, 0.11);

  const gap = (width - 10 - start - needed) / (columns.length + 1);
  let cursor = start + gap;
  for (const col of columns) {
    for (const [clef, group] of col.groups) {
      drawGroup(svg, group, cursor - col.left, clef, group.notes[0].shift);
    }
    cursor += col.right - col.left + gap;
  }
  // Unusually wide voicings extend horizontally at the same staff spacing.
  svg.style.setProperty('--score-span', width / STAFF_WIDTH);
  svg.setAttribute('viewBox', `0 ${FRAME_TOP} ${width} ${FRAME_BOTTOM - FRAME_TOP}`);
}
// Outlines from Steinberg's Bravura (SMuFL), OTF blob a6952f92d2d04de6e5ed961251b228fd25f56d93.
// https://github.com/steinbergmedia/bravura — license for the following outlines below.
const outlines = {
  treble:
    'M376 415C374 427 376 428 382 434C398 449 419 470 438 491C522 583 572 702 572 815C572 902 548 988 507 1048C492 1070 466 1098 455 1098C441 1098 410 1072 390 1050C316 968 292 843 292 739C292 681 299 616 306 575C308 563 309 561 297 551C233 498 164 437 112 373C43 287 0 194 0 87C0 -87 119 -252 364 -252C387 -252 413 -250 433 -246C444 -244 446 -243 448 -255C460 -322 475 -409 475 -456C475 -604 375 -622 316 -622C262 -622 236 -606 236 -593C236 -586 245 -583 268 -576C299 -567 335 -540 335 -482C335 -427 300 -380 239 -380C172 -380 132 -433 132 -495C132 -560 171 -658 322 -658C389 -658 519 -628 519 -458C519 -401 501 -306 490 -244C488 -232 489 -233 503 -227C604 -187 671 -102 671 11C671 139 577 252 430 252C404 252 404 252 401 270ZM470 943C503 943 530 916 530 861C530 792 497 728 419 650C403 634 379 611 356 591C349 585 345 586 343 599C339 625 337 659 337 691C337 847 409 943 470 943ZM361 262C364 243 364 244 346 238C258 208 201 129 201 44C201 -46 248 -110 316 -133C324 -136 336 -139 343 -139C351 -139 355 -134 355 -128C355 -121 347 -118 340 -115C298 -97 268 -54 268 -8C268 49 307 92 368 109C384 113 386 112 388 101L438 -197C440 -208 439 -208 424 -211C408 -214 388 -216 368 -216C193 -216 80 -119 80 20C80 79 90 158 173 252C233 319 279 356 326 394C336 402 338 401 340 390ZM430 103C428 115 429 118 441 117C522 110 589 42 589 -46C589 -109 551 -160 495 -188C483 -194 481 -194 479 -182Z',
  bass: 'M252 262C78 262 0 135 0 39C0 -41 42 -110 123 -110C186 -110 229 -66 229 -4C229 60 182 100 133 100C106 100 96 93 83 93C70 93 67 101 67 111C67 151 127 224 229 224C335 224 381 120 381 -37C381 -140 359 -260 297 -356C237 -449 134 -534 10 -605C1 -610 -5 -615 -5 -623C-5 -629 -1 -635 8 -635C13 -635 19 -633 25 -630C158 -565 286 -489 392 -375C479 -281 531 -159 531 -28C531 146 425 262 252 262ZM629 180C598 180 574 156 574 125C574 94 598 70 629 70C660 70 684 94 684 125C684 156 660 180 629 180ZM630 -71C599 -71 576 -94 576 -125C576 -156 599 -179 630 -179C661 -179 684 -156 684 -125C684 -94 661 -71 630 -71Z',
  brace:
    'M0 500C24 463 37 435 37 397C37 330 2 251 2 175C2 121 20 48 61 1C64 -3 71 1 69 6C45 45 37 91 37 131C37 212 69 285 69 354C69 404 56 452 16 500C55 547 69 595 69 645C69 714 37 788 37 868C37 909 44 954 68 993C71 999 63 1003 60 999C19 951 2 879 2 824C2 748 37 669 37 602C37 564 24 537 0 500Z',
  flat: 'M12 -170C15 -174 18 -175 21 -175C24 -175 27 -173 27 -173C57 -156 81 -129 106 -112C195 -50 226 11 226 57C226 114 182 150 136 153C129 153 122 152 115 150C104 147 92 143 81 136C75 131 64 122 59 122C57 122 56 122 54 123C47 126 43 133 43 140C44 162 50 402 50 422C50 433 41 439 31 439C17 439 1 429 0 411C0 411 4 -160 12 -170ZM47 -81C47 -81 44 -21 44 19C44 35 45 47 46 51C50 63 76 85 90 93C99 98 108 100 116 100C126 100 135 96 141 89C151 78 157 61 157 42C157 24 152 3 140 -18C127 -42 98 -74 68 -93C64 -95 61 -96 58 -96C49 -96 47 -86 47 -81Z',
  natural:
    'M141 181C139 181 138 180 137 180C137 180 73 157 47 157C41 157 37 158 37 162V329C37 336 31 341 25 341H12C5 341 0 336 0 329V-186C0 -192 3 -195 8 -195C9 -195 11 -194 12 -194C12 -194 14 -194 15 -193C29 -187 85 -163 114 -163C124 -163 131 -166 131 -174V-323C131 -330 136 -335 143 -335H156C162 -335 168 -330 168 -323V179C168 184 164 187 160 187C159 187 157 187 156 186ZM37 39C37 53 98 79 122 79C128 79 131 78 131 74V-29C131 -47 74 -70 49 -70C42 -70 37 -68 37 -64Z',
  sharp:
    'M237 118C244 121 249 129 249 135V206C249 211 246 214 242 214C240 214 239 214 237 213C237 213 217 205 212 204C205 204 198 209 198 217V339C198 345 192 350 184 350C174 350 168 345 168 339V209C167 199 164 186 155 180C143 173 109 159 92 155C83 155 80 167 80 175V295C80 301 73 306 66 306C56 306 50 301 50 295V160C50 146 44 136 38 133C32 130 12 122 12 122C5 120 0 112 0 106V35C0 29 3 26 8 26C9 26 11 27 12 27C12 27 27 33 34 37C35 37 36 38 37 38C44 38 50 28 50 20V-79C50 -90 45 -99 39 -102C33 -104 12 -113 12 -113C5 -115 0 -123 0 -129V-200C0 -206 3 -209 8 -209C9 -209 11 -208 12 -208C12 -208 26 -202 35 -199C36 -198 37 -198 38 -198C45 -198 50 -209 50 -214V-337C50 -343 56 -348 63 -348C73 -348 80 -343 80 -337V-198C80 -185 85 -178 90 -176L151 -151C152 -151 154 -150 155 -150C163 -150 168 -162 168 -168V-293C168 -299 174 -304 181 -304C192 -304 198 -299 198 -293V-151C198 -143 202 -131 209 -128C216 -125 237 -117 237 -117C244 -114 249 -106 249 -100V-29C249 -24 246 -21 242 -21C240 -21 239 -21 237 -22L211 -32C205 -32 198 -26 198 -14V79C198 86 203 105 211 108ZM168 -45C162 -65 115 -85 92 -85C86 -85 81 -83 80 -80C78 -76 77 -54 77 -30C77 1 78 36 80 44C82 61 128 82 153 82C160 82 166 80 168 76C170 71 172 46 172 19C172 -8 170 -36 168 -45Z',
  doubleSharp:
    'M190 -32C179 -26 143 -6 143 1C143 15 176 30 190 35C194 35 198 34 202 34C218 34 233 38 240 44C245 49 247 64 247 80C247 97 244 115 240 120C236 125 220 127 203 127C185 127 167 125 162 120C158 117 157 99 157 81C152 70 136 34 124 34C110 34 94 67 90 81C90 98 87 116 82 120C78 125 62 127 46 127C29 127 11 125 5 120C2 118 0 101 0 83C0 65 2 47 5 44C12 38 30 34 47 34C51 34 54 35 57 35C68 29 104 9 104 2C104 -11 72 -27 58 -32H48C30 -32 11 -34 5 -39C2 -42 0 -59 0 -77C0 -95 2 -113 5 -115C12 -121 28 -125 45 -125C60 -125 76 -122 82 -115C88 -110 90 -93 90 -77C90 -76 91 -74 92 -73C98 -59 110 -31 123 -31C136 -31 153 -63 157 -77C157 -95 158 -112 162 -115C169 -121 185 -125 202 -125C218 -125 233 -122 240 -115C245 -110 247 -95 247 -79C247 -62 244 -44 240 -39C235 -34 217 -32 200 -32Z',
  doubleFlat:
    'M314 151C309 151 305 151 300 150C288 147 277 141 267 135C260 131 252 122 243 122C241 122 239 122 238 123C231 125 228 132 228 140C228 161 234 402 234 421C234 432 225 437 215 437C202 437 186 428 184 411C184 411 185 274 187 135C172 145 155 151 136 151H130C125 151 120 151 116 150C104 147 93 141 83 135C75 131 68 122 59 122C57 122 56 122 54 123C47 125 43 132 43 140C43 161 50 402 50 421C50 432 41 437 31 437C17 437 1 428 0 411C0 411 5 -161 12 -170C15 -174 18 -175 21 -175C24 -175 27 -173 27 -173C58 -157 83 -129 106 -112C143 -86 171 -59 190 -35C192 -110 194 -167 197 -170C200 -174 203 -175 205 -175C208 -175 211 -173 211 -173C242 -157 266 -129 289 -113C379 -50 411 11 411 57C411 113 367 150 320 151ZM141 -18C128 -42 99 -73 67 -93C64 -95 60 -96 58 -96C50 -96 47 -86 47 -80C47 -80 44 -21 44 18C44 34 45 46 46 50C50 63 77 85 91 93C100 98 109 100 117 100C127 100 135 97 141 90C151 78 157 61 157 41C157 23 152 2 141 -18ZM324 -18C312 -42 283 -73 251 -93C247 -95 244 -96 242 -96C234 -96 231 -86 231 -80C231 -80 228 -11 228 27C228 38 228 47 229 50C233 63 260 85 275 93C284 98 293 100 301 100C311 100 319 97 325 90C334 78 340 61 340 41C340 23 335 3 324 -18Z',
  head: 'M216 125C83 125 0 70 0 2C0 -65 57 -125 206 -125C370 -125 422 -68 422 2C422 73 309 125 216 125ZM111 63C122 98 159 103 190 103C259 103 314 29 314 -31C314 -38 313 -44 312 -50C307 -75 293 -92 268 -98C258 -101 247 -102 237 -102C228 -102 220 -101 211 -98C194 -93 178 -84 164 -72C156 -65 149 -58 143 -50C123 -27 108 7 108 39C108 47 109 55 111 63Z',
};

/*
Copyright © 2026, Steinberg Media Technologies GmbH (http://www.steinberg.net/),
with Reserved Font Name "Bravura".

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
http://scripts.sil.org/OFL

-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded,
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION AND CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
*/
