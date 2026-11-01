import test from 'node:test';
import assert from 'node:assert/strict';
import { MidiInput } from '../midi.mjs';
import { ReleaseVoicing } from '../release-voicing.mjs';

function rig() {
  const port = (id) => ({ id, name: id, state: 'connected' });
  const a = port('a'),
    b = port('b');
  const access = {
    inputs: new Map([
      ['a', a],
      ['b', b],
    ]),
  };
  const events = [],
    statuses = [];
  const midi = new MidiInput(
    (notes) => events.push(notes),
    (status) => statuses.push(status),
    { requestMIDIAccess: async () => access },
  );
  const send = (device, ...bytes) => device.onmidimessage({ data: Uint8Array.from(bytes) });
  return { a, b, access, midi, events, statuses, send };
}

test('same pitch on separate ports and channels survives unrelated note offs', async () => {
  const { a, b, midi, events, send } = rig();
  await midi.connect();
  send(a, 0x90, 60, 93);
  send(b, 0x90, 60, 81);
  send(a, 0x93, 60, 72);
  send(a, 0x90, 60, 0);
  send(b, 0x80, 60, 52);
  assert.deepEqual(events, [[60]]);
  send(a, 0x83, 60, 0);
  assert.deepEqual(events.at(-1), []);
});

test('repeated note-ons, damper, reset controllers, all notes/sound off', async () => {
  const { a, midi, events, send } = rig();
  await midi.connect();
  send(a, 0x90, 67, 101);
  send(a, 0x90, 67, 55);
  send(a, 0x80, 67, 0);
  assert.deepEqual(events.at(-1), [67]);
  send(a, 0xb0, 64, 127);
  send(a, 0x80, 67, 0);
  send(a, 0x90, 64, 80);
  send(a, 0xb0, 121, 0);
  assert.deepEqual(events.at(-1), [64]);
  send(a, 0xb0, 64, 127);
  send(a, 0xb0, 123, 0);
  assert.deepEqual(events.at(-1), [64]);
  send(a, 0xb0, 64, 0);
  assert.deepEqual(events.at(-1), []);
  send(a, 0xb0, 64, 127);
  send(a, 0x90, 68, 84);
  send(a, 0xb0, 120, 0);
  assert.deepEqual(events.at(-1), []);
});

test('device switching, removal and reconnection clear stuck pitches', async () => {
  const { a, b, access, midi, events, statuses, send } = rig();
  await midi.connect();
  assert.deepEqual(statuses.at(-1), {
    state: 'ready',
    selected: '',
    ports: [
      { id: 'a', name: 'a' },
      { id: 'b', name: 'b' },
    ],
  });
  send(b, 0x90, 64, 99);
  midi.selectPort('a');
  assert.deepEqual(events.at(-1), []);
  send(b, 0x90, 64, 89);
  assert.deepEqual(events.at(-1), []);
  send(a, 0x93, 71, 120);
  a.state = 'disconnected';
  access.onstatechange();
  assert.equal(a.onmidimessage, null);
  assert.deepEqual(events.at(-1), []);
  assert.equal(statuses.at(-1).selected, '');
  b.state = 'disconnected';
  access.onstatechange();
  assert.equal(statuses.at(-1).state, 'no-inputs');
  b.state = 'connected';
  access.onstatechange();
  assert.equal(statuses.at(-1).state, 'ready');
  send(b, 0x90, 62, 91);
  assert.deepEqual(events.at(-1), [62]);
  midi.clear();
  assert.deepEqual(events.at(-1), []);
});

test('click can retry after denial, and missing Web MIDI reports unsupported', async () => {
  const statuses = [];
  const browser = {};
  const midi = new MidiInput(
    () => {},
    (s) => statuses.push(s.state),
    browser,
  );
  await midi.connect();
  assert.equal(statuses.at(-1), 'unsupported');
  browser.requestMIDIAccess = async () => {
    throw Object.assign(new Error(), { name: 'NotAllowedError' });
  };
  await midi.connect();
  assert.equal(statuses.at(-1), 'denied');
  browser.requestMIDIAccess = async () => ({ inputs: new Map() });
  await midi.connect();
  assert.equal(statuses.at(-1), 'no-inputs');
});

test('the last finger releases a complete voicing even with the damper down', async () => {
  const { a, b, midi, send } = rig();
  const reveal = new ReleaseVoicing();
  let sounding;
  midi.onNotes = (notes, held) => {
    sounding = notes;
    reveal.update(held);
  };
  await midi.connect();
  send(a, 0xb0, 64, 127);
  for (const note of [53, 57, 60]) send(a, 0x90, note, 90);
  send(b, 0x92, 60, 90); // Another performer still holds middle C.
  for (const note of [60, 53, 57]) send(a, 0x80, note, 0);
  assert.deepEqual(reveal.held, [60]);
  send(b, 0x92, 60, 0); // Zero velocity counts as note-off.
  assert.deepEqual(reveal.held, []);
  assert.deepEqual(reveal.notes, [53, 57, 60]);
  assert.deepEqual(sounding, [53, 57, 60]);

  // Reattacking already sustained A starts a new question even though the
  // sounding pitch collection has not changed yet.
  for (const note of [57, 61, 64]) send(a, 0x90, note, 100);
  assert.deepEqual(sounding, [53, 57, 60, 61, 64]);
  for (const note of [61, 64, 57]) send(a, 0x80, note, 0);
  assert.deepEqual(reveal.held, []);
  assert.deepEqual(reveal.notes, [57, 61, 64]);
  send(a, 0xb0, 64, 0);
  assert.deepEqual(sounding, []);
  assert.deepEqual(reveal.notes, [57, 61, 64]);
});

test('release tails preserve the last attacked voicing across changes of fingers', () => {
  const reveal = new ReleaseVoicing();
  for (const keys of [[60], [60, 64], [60, 64, 67], [60, 64], [60, 64, 69], [60], []]) {
    reveal.update(keys);
  }
  assert.deepEqual(reveal.notes, [60, 64, 69]);
  assert.deepEqual(reveal.held, []);
  reveal.clear();
  assert.deepEqual(reveal.notes, []);
});
