import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeSet } from '../set-theory.mjs';

test('actual pitch classes retain C=0 through transposition while doublings and note order disappear', () => {
  assert.deepEqual(analyzeSet([69, 53, 60, 65, 53]), {
    pitchClasses: [0, 5, 9],
    primeForm: [0, 3, 7],
    intervalClasses: [3, 4, 5],
    intervalVector: [0, 0, 1, 1, 1, 0],
    forte: '3-11',
  });
  assert.equal(analyzeSet([0, 3, 7]).forte, '3-11');
  assert.equal(analyzeSet([]), null);
  assert.equal(analyzeSet([-1, 128, 1.5, NaN]), null);
  assert.equal(analyzeSet([0, 12, 24]).forte, '1-1');
  assert.equal(analyzeSet([60, 66]).forte, '2-6');
});

test('Z-related tetrachords retain distinct Forte identifiers', () => {
  const first = analyzeSet([0, 1, 4, 6]);
  const second = analyzeSet([0, 1, 3, 7]);
  assert.equal(first.forte, '4-Z15');
  assert.equal(second.forte, '4-Z29');
  assert.deepEqual(first.intervalVector, [1, 1, 1, 1, 1, 1]);
  assert.deepEqual(first.intervalVector, second.intervalVector);
});

test('uses the Forte prime-form spellings in the six Forte/Rahn exceptions', () => {
  for (const [prime, label] of [
    [[0, 1, 3, 7, 8], '5-20'],
    [[0, 1, 3, 6, 8, 9], '6-Z29'],
    [[0, 1, 3, 5, 8, 9], '6-31'],
    [[0, 1, 2, 3, 5, 8, 9], '7-Z18'],
    [[0, 1, 2, 4, 7, 8, 9], '7-20'],
    [[0, 1, 2, 4, 5, 7, 9, 10], '8-26'],
  ]) {
    const set = analyzeSet(prime.map((p) => 63 - p));
    assert.deepEqual(set.primeForm, prime);
    assert.equal(set.forte, label);
  }
});

test('every nonempty pitch-class subset has a class invariant under transposition and inversion', () => {
  const universe = Array.from({ length: 12 }, (_, pc) => pc);
  const classes = new Set();
  for (let mask = 1; mask < 4096; mask++) {
    const pcs = universe.filter((pc) => mask & (1 << pc));
    const { forte, intervalVector } = analyzeSet(pcs);
    classes.add(forte);
    assert.equal(analyzeSet(pcs.map((pc) => pc + 1)).forte, forte);
    assert.equal(analyzeSet(pcs.map((pc) => 12 - pc)).forte, forte);
    assert.equal(
      intervalVector.reduce((sum, n) => sum + n, 0),
      (pcs.length * (pcs.length - 1)) / 2,
    );
  }
  assert.equal(classes.size, 223);
  assert.deepEqual(analyzeSet(universe).intervalVector, [12, 12, 12, 12, 12, 6]);
  assert.equal(analyzeSet(universe).forte, '12-1');
});
