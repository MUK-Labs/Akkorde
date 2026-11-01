import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, keySignature, tonics } from '../theory.mjs';
import { circleKey, chordPosition } from '../circle.mjs';

const pos = (notes, tonic = 'C', mode = 'major') =>
  chordPosition(analyze(notes, tonic, mode).chord, tonic, mode);

test('the twelve paired sectors retain all thirty written major and minor signatures', () => {
  for (const mode of ['major', 'minor']) {
    for (const key of tonics(mode)) {
      const sig = keySignature(key, mode);
      assert.equal(circleKey((sig + 12) % 12, mode, sig), key);
    }
  }
  assert.equal(circleKey(5, 'major', -7), 'Cb');
  assert.equal(circleKey(5, 'major', 5), 'B');
  assert.equal(circleKey(5, 'minor', -7), 'Ab');
  assert.equal(circleKey(5, 'minor', 5), 'G#');
});

test('major and minor chord families use their own rings, including mixed inversions and major/minor sevenths', () => {
  assert.deepEqual(pos([53, 57, 60]), { sector: 11, ring: 'major', rootOnly: false, distance: 1 });
  assert.deepEqual(pos([54, 57, 60, 62]), { sector: 2, ring: 'major', rootOnly: false, distance: 2 });
  assert.deepEqual(pos([57, 60, 64, 67]), { sector: 0, ring: 'minor', rootOnly: false, distance: 0 });
  assert.equal(pos([52, 55, 59], 'A', 'minor').distance, 1);
  assert.equal(pos([56, 59, 63], 'Ab', 'minor').distance, 0);
});

test('other chord qualities show a root marker in the selected mode and unknown chords have no marker', () => {
  assert.deepEqual(pos([59, 62, 65], 'A', 'minor'), {
    sector: 2,
    ring: 'minor',
    rootOnly: true,
    distance: 2,
  });
  assert.deepEqual(pos([48, 53, 55]), { sector: 0, ring: 'major', rootOnly: true, distance: 0 });
  assert.equal(pos([60, 62]), null);
});
