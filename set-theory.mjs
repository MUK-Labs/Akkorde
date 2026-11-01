// Prime forms in Forte-number order, using T = 10 and E = 11. A leading Z marks
// classes that share an interval-class vector with a different set class.
// Allen Forte, The Structure of Atonal Music (1973), Appendix 1. The table below
// uses the Forte spellings given in the University of Puget Sound tables:
// https://musictheory.pugetsound.edu/mt21c/ListsOfSetClasses.html
// The conventional extension to sizes 1, 2, 10, 11 and 12 follows music21:
// https://github.com/cuthbertLab/music21/blob/v9.1.0/music21/chord/tables.py
const catalogue = [
  '0',
  '01 02 03 04 05 06',
  '012 013 014 015 016 024 025 026 027 036 037 048',
  `0123 0124 0134 0125 0126 0127 0145 0156 0167 0235 0135 0236 0136 0237 Z0146 0157 0347
   0147 0148 0158 0246 0247 0257 0248 0268 0358 0258 0369 Z0137`,
  `01234 01235 01245 01236 01237 01256 01267 02346 01246 01346 02347 Z01356 01248 01257
   01268 01347 Z01348 Z01457 01367 01378 01458 01478 02357 01357 02358 02458 01358 02368
   01368 01468 01369 01469 02468 02469 02479 Z01247 Z03458 Z01258`,
  `012345 012346 Z012356 Z012456 012367 Z012567 012678 023457 012357 Z013457 Z012457
   Z012467 Z013467 013458 012458 014568 Z012478 012578 Z013478 014589 023468 012468
   Z023568 Z013468 Z013568 Z013578 013469 Z013569 Z013689 013679 013589 024579 023579
   013579 02468T Z012347 Z012348 Z012378 Z023458 Z012358 Z012368 Z012369 Z012568 Z012569
   Z023469 Z012469 Z012479 Z012579 Z013479 Z014679`,
  `0123456 0123457 0123458 0123467 0123567 0123478 0123678 0234568 0123468 0123469 0134568
   Z0123479 0124568 0123578 0124678 0123569 Z0124569 Z0123589 0123679 0124789 0124589
   0125689 0234579 0123579 0234679 0134579 0124579 0135679 0124679 0124689 0134679 0134689
   012468T 013468T 013568T Z0123568 Z0134578 Z0124578`,
  `01234567 01234568 01234569 01234578 01234678 01235678 01234589 01234789 01236789
   02345679 01234579 01345679 01234679 01245679 Z01234689 01235789 01345689 01235689
   01245689 01245789 0123468T 0123568T 0123578T 0124568T 0124678T 0124579T 0124578T
   0134679T Z01235679`,
  `012345678 012345679 012345689 012345789 012346789 01234568T 01234578T 01234678T
   01235678T 01234679T 01235679T 01245689T`,
  '0123456789 012345678T 012345679T 012345689T 012345789T 012346789T',
  '0123456789T',
  '0123456789TE',
];

// Index all transpositions and inversions once. Matching the pitch classes
// themselves distinguishes Z-related sets even when their vectors coincide.
const classByMask = new Map();
for (const row of catalogue) {
  for (const [index, spelling] of row.split(/\s+/).entries()) {
    const z = spelling.startsWith('Z');
    const primeForm = Array.from(spelling.replace('Z', ''), (digit) => '0123456789TE'.indexOf(digit));
    const entry = { primeForm, forte: `${primeForm.length}-${z ? 'Z' : ''}${index + 1}` };
    for (let tonic = 0; tonic < 12; tonic++) {
      let direct = 0;
      let inverted = 0;
      for (const pc of primeForm) {
        direct |= 1 << ((tonic + pc) % 12);
        inverted |= 1 << ((tonic - pc + 12) % 12);
      }
      classByMask.set(direct, entry);
      classByMask.set(inverted, entry);
    }
  }
}

export function analyzeSet(midiNotes) {
  let mask = 0;
  for (const midi of midiNotes) {
    if (Number.isInteger(midi) && midi >= 0 && midi <= 127) mask |= 1 << (midi % 12);
  }
  if (!mask) return null;

  const pitchClasses = [];
  const intervalVector = [0, 0, 0, 0, 0, 0];
  for (let pc = 0; pc < 12; pc++) {
    if (!(mask & (1 << pc))) continue;
    for (const previous of pitchClasses) {
      const distance = pc - previous;
      const intervalClass = Math.min(distance, 12 - distance);
      intervalVector[intervalClass - 1]++;
    }
    pitchClasses.push(pc);
  }
  const { primeForm, forte } = classByMask.get(mask);
  const intervalClasses = intervalVector.flatMap((count, i) => (count ? [i + 1] : []));
  return { pitchClasses, primeForm: [...primeForm], intervalClasses, intervalVector, forte };
}
