// One keyboard or several can feed the same analyser. Each port/channel retains its
// own held keys and damper pedal so a note-off cannot silence another source.
export class MidiInput {
  constructor(onNotes, onStatus = () => {}, browser = globalThis.navigator) {
    this.onNotes = onNotes;
    this.onStatus = onStatus;
    this.browser = browser;
    this.access = null;
    this.request = null;
    this.ports = new Map();
    this.channels = new Map();
    this.selected = '';
    this.state = 'idle';
    this.lastNotes = '';
  }

  async connect() {
    if (this.access) return this.refresh();
    if (this.request) return this.request;
    if (!this.browser?.requestMIDIAccess) return this.status('unsupported');
    this.status('requesting');
    this.request = this.open();
    try {
      await this.request;
    } finally {
      this.request = null;
    }
  }

  async open() {
    try {
      this.access = await this.browser.requestMIDIAccess({ sysex: false });
      this.access.onstatechange = () => this.refresh();
      this.refresh();
    } catch (error) {
      this.status(['SecurityError', 'NotAllowedError'].includes(error.name) ? 'denied' : 'error');
    }
  }

  status(state) {
    this.state = state;
    const ports = [...this.ports.values()].map(({ id, name, manufacturer }) => ({
      id,
      name: name || manufacturer || id,
    }));
    this.onStatus({ state, ports, selected: this.selected });
  }

  refresh() {
    const inputs = new Map([...this.access.inputs].filter(([, port]) => port.state !== 'disconnected'));
    for (const [id, oldPort] of this.ports) {
      if (oldPort !== inputs.get(id)) {
        oldPort.onmidimessage = null;
        this.channels.delete(id);
      }
    }
    for (const [id, port] of inputs) {
      if (port !== this.ports.get(id)) {
        port.onmidimessage = (event) => {
          if (!this.selected || this.selected === id) this.message(id, event.data);
        };
      }
    }
    this.ports = inputs;
    if (this.selected && !inputs.has(this.selected)) this.selected = '';
    this.emitNotes();
    this.status(inputs.size ? 'ready' : 'no-inputs');
  }

  selectPort(id = '') {
    if (id && !this.ports.has(id)) return;
    if (this.selected !== id) {
      this.selected = id;
      this.clear();
      this.status(this.state);
    }
  }

  clear() {
    this.channels.clear();
    this.emitNotes();
  }

  emitNotes() {
    const sounding = new Set();
    for (const channels of this.channels.values()) {
      for (const { held, sustained } of channels.values()) {
        for (const note of held.keys()) sounding.add(note);
        for (const note of sustained) sounding.add(note);
      }
    }
    const notes = [...sounding].sort((a, b) => a - b);
    const signature = notes.join(',');
    if (signature !== this.lastNotes) {
      this.lastNotes = signature;
      this.onNotes(notes);
    }
  }

  message(id, bytes) {
    const [status, note, value] = bytes;
    if (status === 0xff) {
      this.channels.delete(id);
      this.emitNotes();
      return;
    }
    const type = status >> 4;
    if (bytes.length < 3 || ![8, 9, 11].includes(type)) return;
    if (type === 11 && ![64, 120, 121, 123].includes(note)) return;
    if (!this.channels.has(id)) this.channels.set(id, new Map());
    const channels = this.channels.get(id);
    const channel = status & 15;
    if (!channels.has(channel))
      channels.set(channel, { held: new Map(), sustained: new Set(), pedal: false });
    const voice = channels.get(channel);
    if (type === 11) {
      switch (note) {
        case 64: // Damper pedal
          voice.pedal = value >= 64;
          if (!voice.pedal) voice.sustained.clear();
          break;
        case 120: // All sound off
          voice.held.clear();
          voice.sustained.clear();
          break;
        case 121: // Reset all controllers
          voice.pedal = false;
          voice.sustained.clear();
          break;
        case 123: // All notes off respects the damper pedal
          if (voice.pedal) for (const pitch of voice.held.keys()) voice.sustained.add(pitch);
          voice.held.clear();
          break;
      }
    } else if (type === 9 && value > 0) {
      voice.held.set(note, (voice.held.get(note) || 0) + 1);
    } else if (voice.held.has(note)) {
      const count = voice.held.get(note) - 1;
      if (count) voice.held.set(note, count);
      else {
        voice.held.delete(note);
        if (voice.pedal) voice.sustained.add(note);
      }
    }
    this.emitNotes();
  }
}
