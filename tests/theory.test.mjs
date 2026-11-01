import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, keyName, keySignature, qualityIds, qualityInfo, tonics } from '../theory.mjs';

test('direct functions, applied dominants and function changes with the selected key', () => {
  const triad = [53, 57, 60];
  assert.equal(analyze(triad).chord.degree, 'IV');
  assert.equal(analyze(triad).chord.fn, 'S');
  assert.equal(analyze(triad, 'F').chord.fn, 'T');
  assert.equal(analyze([55, 59, 62, 65]).chord.fn, 'D⁷');
  const applied = analyze([50, 54, 57, 60]).chord;
  assert.equal(applied.jazz, 'D7');
  assert.equal(applied.degree, 'V⁷/V');
  assert.equal(applied.rootDegree, 'II');
  assert.equal(applied.fn, 'DD⁷');
  assert.equal(analyze([50, 54, 57]).chord.fn, 'DD');
  assert.equal(analyze([57, 61, 64, 67]).chord.degree, 'V⁷/ii');
  assert.equal(analyze([60, 64, 67, 70]).chord.degree, 'V⁷/IV');
  assert.equal(analyze([60, 64, 67, 70]).chord.fn, '');
  assert.equal(analyze([55, 59, 62, 66]).chord.degree, 'V(maj7)');
});

test('scale-degree positions follow the written root in the selected key', () => {
  const triads = [
    [60, 64, 67],
    [62, 65, 69],
    [64, 67, 71],
    [65, 69, 72],
    [67, 71, 74],
    [69, 72, 76],
    [71, 74, 77],
  ];
  assert.deepEqual(
    triads.map((notes) => analyze(notes).chord.scaleDegree),
    [1, 2, 3, 4, 5, 6, 7],
  );
  assert.equal(analyze([52, 55, 60]).chord.scaleDegree, 1); // C/E, bass on III
  assert.equal(analyze([54, 57, 60, 62]).chord.scaleDegree, 2); // D7/F♯ as V⁶₅/V
  assert.equal(analyze([61, 65, 68]).chord.scaleDegree, 2); // ♭II
  assert.equal(analyze([54, 57, 60]).chord.scaleDegree, 4); // ♯iv°
  assert.equal(analyze([53, 57, 60], 'F').chord.scaleDegree, 1);
  assert.equal(analyze([51, 55, 58, 61], 'Ab', 'minor', 'es').chord.scaleDegree, 5);
});

test('flat minor key, localized names, standard scientific octave and English jazz in Spanish', () => {
  assert.equal(keySignature('Ab', 'minor'), -7);
  assert.equal(keyName('Ab', 'minor', 'de'), 'as-Moll');
  assert.equal(keyName('Ab', 'minor', 'es'), 'La♭ menor');
  const tonic = analyze([56, 59, 63], 'Ab', 'minor', 'es');
  assert.deepEqual(
    tonic.notes.map((n) => [n.name, n.octave]),
    [
      ['La♭', 3],
      ['Do♭', 4],
      ['Mi♭', 4],
    ],
  );
  assert.equal(tonic.chord.jazz, 'A♭m');
  assert.equal(tonic.chord.fn, 't');
  const dominant = analyze([51, 55, 58, 61], 'Ab', 'minor', 'de');
  assert.deepEqual(
    dominant.notes.map((n) => n.name),
    ['Es', 'G', 'B', 'Des'],
  );
  assert.equal(dominant.chord.degree, 'V⁷');
  assert.equal(dominant.chord.jazz, 'Es7');
  assert.equal(analyze([59], 'C', 'major', 'de').notes[0].name, 'H');
  assert.equal(analyze([60], 'C#', 'major').notes[0].octave, 3); // B♯3
});

test('all note pairs, dyads, compound and enharmonic intervals', () => {
  const result = analyze([74, 60, 60], 'C', 'major', 'es');
  assert.equal(result.chord, null);
  assert.deepEqual(result.intervals[0], {
    from: 60,
    to: 74,
    semitones: 14,
    number: 9,
    short: 'M9',
    label: 'novena mayor',
  });
  assert.equal(analyze([60, 72]).intervals[0].short, 'P8');
  assert.equal(analyze([48, 72]).intervals[0].short, 'P15');
  assert.equal(analyze([60, 66], 'C').intervals[0].short, 'A4');
  assert.equal(analyze([60, 66], 'Db').intervals[0].short, 'd5');
  const double = analyze([48, 60, 64, 67]);
  assert.equal(double.intervals.length, 6);
  assert.equal(double.chord.jazz, 'C');
  assert.equal(analyze([60, 61, 62]).chord, null);
  assert.equal(analyze([]).intervals.length, 0);
});

test('distinguishes inversion figures, slash bass and a sixth added to a root-position chord', () => {
  assert.equal(analyze([52, 55, 60]).chord.jazz, 'C/E');
  assert.equal(analyze([52, 55, 60]).chord.degree, 'I⁶');
  assert.equal(analyze([55, 60, 64]).chord.degree, 'I⁶₄');
  assert.equal(analyze([53, 55, 59, 62]).chord.degree, 'V⁴₂');
  assert.equal(analyze([54, 57, 60, 62]).chord.degree, 'V⁶₅/V');
  const sixth = analyze([60, 64, 67, 69]).chord;
  assert.equal(sixth.degree, 'I(add6)');
  assert.ok(sixth.alternatives.includes('Am7/C'));
});

test('recognized tensions preserve their characteristic spelling and expose omitted chord members', () => {
  const add9 = analyze([60, 64, 67, 74]).chord;
  assert.equal(add9.id, 'add9');
  assert.equal(add9.formula, '1 3 5 9');
  assert.equal(analyze([60, 64, 67, 70, 74]).chord.id, '9');
  const sharpNine = analyze([60, 64, 67, 70, 75]);
  assert.equal(sharpNine.chord.jazz, 'C7♯9');
  assert.equal(sharpNine.notes.at(-1).name, 'D♯');
  assert.equal(sharpNine.intervals.find((iv) => iv.from === 60 && iv.to === 75).short, 'A9');
  assert.equal(analyze([60, 64, 67, 70, 73]).chord.id, '7b9');
  const thirteenth = analyze([60, 64, 67, 70, 74, 81]).chord;
  assert.equal(thirteenth.jazz, 'C13');
  assert.deepEqual(thirteenth.omitted, ['11']);
  assert.deepEqual(analyze([60, 64, 70]).chord.omitted, ['5']);
});

test('chromatic diminished chords have tertian spellings and symmetric readings', () => {
  assert.deepEqual(
    analyze([61, 64, 67]).notes.map((n) => n.name),
    ['C♯', 'E', 'G'],
  );
  const leading = analyze([50, 53, 56, 59]);
  assert.deepEqual(
    leading.notes.map((n) => n.name),
    ['D', 'F', 'A♭', 'B'],
  );
  assert.equal(leading.chord.jazz, 'Bdim7/D');
  assert.equal(leading.chord.alternatives.length, 3);
});

test('all standard major/minor signatures transpose their tonic and double dominant', () => {
  for (const mode of ['major', 'minor']) {
    assert.equal(tonics(mode).length, 15);
    for (const [index, tonic] of tonics(mode).entries()) {
      const pc = (120 + 7 * (index - 7) + (mode === 'minor' ? 9 : 0)) % 12;
      const root = 48 + pc;
      const names = analyze([root, root + (mode === 'minor' ? 3 : 4), root + 7], tonic, mode);
      assert.equal(names.chord.rootPC, pc);
      assert.equal(names.chord.degree, mode === 'minor' ? 'i' : 'I');
      assert.equal(keySignature(tonic, mode), index - 7);
      assert.equal(analyze([root + 2, root + 6, root + 9, root + 12], tonic, mode).chord.fn, 'DD⁷');
    }
  }
  for (const id of qualityIds) {
    for (const lang of ['de', 'en', 'es']) {
      assert.ok(qualityInfo(id, lang).quality);
      assert.ok(qualityInfo(id, lang).formula.startsWith('1 '));
    }
  }
});
