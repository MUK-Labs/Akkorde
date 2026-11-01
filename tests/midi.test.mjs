import test from 'node:test';
import assert from 'node:assert/strict';
import { MidiInput } from '../midi.mjs';

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
