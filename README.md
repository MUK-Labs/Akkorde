# [Akkorde](https://muk-labs.github.io/Akkorde/)

A live harmony studio for MIDI and on-screen piano by MUK Labs, conceived by Adrián Artacho. The interface and chord guide are available in German, English and Spanish.

[Open the instrument](https://muk-labs.github.io/Akkorde/) · [Read the chord guide](https://muk-labs.github.io/Akkorde/reference.html)

## Playing

Choose a key on the circle of fifths beside the grand staff. Click piano keys to build a voicing, or turn off **Hold notes** to play momentarily. The computer keys **A W S E D F T G Y H U J K** cover a chromatic octave. The arrows below the piano move the keyboard range. **Sound** enables optional local playback.

For a hardware keyboard, open the HTTPS site in a browser with Web MIDI support, choose **Connect MIDI**, and allow access. The input selector accepts all available ports or a specific device. The analyser listens on all channels and follows the sustain pedal. Where the browser lacks Web MIDI, the on-screen piano and computer keyboard remain available. [Web MIDI compatibility](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/requestMIDIAccess#browser_compatibility)

## The circle of fifths

Click an outer sector for a major key or an inner sector for its relative minor. The selected key stays green and appears in the centre. The amber marker follows the chord you play, including in inversion. The number underneath counts the shortest path between their sectors. In C major, F major is one step away and D7 is two. A minor shares the C major sector, so their distance on this diagram is zero. For a chord without a major or minor triad, a dotted marker shows its root on the ring of the selected mode.

Focus the wheel with **Tab**. Left and right move by fifths, and up and down choose the major or minor ring. Where two conventional key signatures coincide, the **≈** button switches spelling, for instance between G♯ minor and A♭ minor.

## In class

[Open presentation mode](https://muk-labs.github.io/Akkorde/?presentation=1) · [Präsentation mit Auflösung beim Loslassen](https://muk-labs.github.io/Akkorde/?lang=de&presentation=1&reveal=1)

| URL parameter | Classroom behaviour |
| --- | --- |
| `presentation=1` | Expands the grand staff, harmonic analysis and keyboard to fill the page. The presentation button in the analysis panel switches layouts during play. Omit the parameter or set it to `0` for the usual interface. |
| `reveal=1` or `reveal=2` | Both values enable the same release exercise. The notes and keyboard respond immediately. The analysis and chord marker appear when the last key is released. Omit the parameter or set it to `0` for live answers. |

The **Full screen** button in the analysis panel enters or leaves browser fullscreen. Presentation and fullscreen can be used independently. In presentation mode, the MIDI socket button in the same panel opens the connection and device controls.

In a release exercise, lift the fingers in any order. The answer retains the voicing from the last attack even if individual fingers lift slowly. A held sustain pedal keeps the notes sounding while you discuss the answer. A new attack hides it again. For a two-note exercise, the interval name also waits for release. With three or more notes, the staff can still show interval clues. Turn **Intervals** off in the display menu for an exercise without clues.

## Reading a voicing

The grand staff shows sounding pitches with the selected key signature. Two notes produce one interval. Larger voicings give every pitch pair, including compound intervals. Click an interval to see its two notes and semitone span. The score keeps the last played voicing visible when you release the keys. **Clear** resets the instrument.

| What you play | Selected key | Jazz symbol | Scale degree | Function |
| --- | --- | --- | --- | --- |
| F–A–C | C major | F | IV | S |
| F–A–C | F major | F | I | T |
| D–F♯–A–C | C major | D7 | V⁷/V | DD⁷ |
| E♭–G–B♭–D♭ | A♭ minor | E♭7 | V⁷ | D⁷ |

The **scale-degree row** has seven positions from I on the left to VII on the right. Its marker follows the spelled root in the selected key, including chromatically altered roots. In C major, F/A stays in position 4 and shows IV⁶. D7 occupies position 2 and shows V⁷/V.

**Set analysis** below the function shows the sounding pitch classes (C = 0), Forte prime form, distinct interval classes, six-entry interval-class vector and Forte number. It also works on collections with no tonal chord name. For example, F–A–C gives {0, 5, 9}, prime form [0, 3, 7], interval classes {3, 4, 5}, vector ⟨0, 0, 1, 1, 1, 0⟩ and Forte **3-11**. It uses transposition and inversion equivalence, with octave doublings counted once. Click the reading to examine the current set. [Open the worked set example](https://muk-labs.github.io/Akkorde/reference.html?lang=en&topic=sets&notes=53,57,60)

The display menu lets you toggle intervals, jazz symbols, scale degrees, functional symbols and set analysis independently. Click any reading to open its explanation with the current key and voicing. The guide retains that context when switching languages, so students can compare the nomenclature for the same example.

The catalogue covers 41 chord structures, including suspended chords, sevenths, added notes, extended and altered chords. The analyser compares pitch classes, bass and key to select a reading. Equally complete alternatives are listed when present. Common omissions are allowed in some extended chords. Rootless voicings and progressions require further musical context. A dash in the function row means that the analyser has no functional label for the current reading.

## Development

The site consists of static HTML, CSS, SVG and native JavaScript modules. There is no build step or external runtime asset. The repository root is the GitHub Pages entry point.

- Serve locally with `python3 -m http.server 8000`, then open `http://localhost:8000`.
- Run the regression tests with `node --test tests/*.test.mjs`.
- The recognition vocabulary and spelling rules live in `theory.mjs`. Staff engraving lives in `score.mjs` and device handling in `midi.mjs`.

MIDI chord identification was inspired by [Chordcat](https://github.com/shriramters/chordcat). The notation renderer embeds a small set of [Bravura](https://github.com/steinbergmedia/bravura) glyph outlines. Their SIL Open Font License and copyright notice are included in `score.mjs`.
