# [Akkorde](https://muk-labs.github.io/Akkorde/)

A live harmony studio for MIDI and on-screen piano by MUK Labs, conceived by Adrián Artacho. The interface and chord guide are available in German, English and Spanish.

[Open the instrument](https://muk-labs.github.io/Akkorde/) · [Read the chord guide](https://muk-labs.github.io/Akkorde/reference.html)

## Playing

Choose a key above the grand staff. Click piano keys to build a voicing, or turn off **Hold notes** to play momentarily. The computer keys **A W S E D F T G Y H U J K** cover a chromatic octave. The arrows below the piano move the keyboard range. **Sound** enables optional local playback.

For a hardware keyboard, open the HTTPS site in a browser with Web MIDI support, choose **Connect MIDI**, and allow access. The input selector accepts all available ports or a specific device. The analyser listens on all channels and follows the sustain pedal. Where the browser lacks Web MIDI, the on-screen piano and computer keyboard remain available. [Web MIDI compatibility](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/requestMIDIAccess#browser_compatibility)

## Reading a voicing

The grand staff shows sounding pitches with the selected key signature. Two notes produce one interval. Larger voicings give every pitch pair, including compound intervals. Click an interval to see its two notes and semitone span. The score keeps the last played voicing visible when you release the keys. **Clear** resets the instrument.

| What you play | Selected key | Jazz symbol | Scale degree | Function |
| --- | --- | --- | --- | --- |
| F–A–C | C major | F | IV | S |
| F–A–C | F major | F | I | T |
| D–F♯–A–C | C major | D7 | V⁷/V | DD⁷ |
| E♭–G–B♭–D♭ | A♭ minor | E♭7 | V⁷ | D⁷ |

The display menu lets you toggle intervals, jazz symbols, scale degrees and functional symbols independently. Click any reading to open its explanation with the current key and voicing. The guide retains that context when switching languages, so students can compare the nomenclature for the same example.

The catalogue covers 41 chord structures, including suspended chords, sevenths, added notes, extended and altered chords. The analyser compares pitch classes, bass and key to select a reading. Equally complete alternatives are listed when present. Common omissions are allowed in some extended chords. Rootless voicings and progressions require further musical context. A dash in the function row means that the analyser has no functional label for the current reading.

## Development

The site consists of static HTML, CSS, SVG and native JavaScript modules. There is no build step or external runtime asset. The repository root is the GitHub Pages entry point.

- Serve locally with `python3 -m http.server 8000`, then open `http://localhost:8000`.
- Run the regression tests with `node --test tests/*.test.mjs`.
- The recognition vocabulary and spelling rules live in `theory.mjs`. Staff engraving lives in `score.mjs` and device handling in `midi.mjs`.

MIDI chord identification was inspired by [Chordcat](https://github.com/shriramters/chordcat). The notation renderer embeds a small set of [Bravura](https://github.com/steinbergmedia/bravura) glyph outlines. Their SIL Open Font License and copyright notice are included in `score.mjs`.
