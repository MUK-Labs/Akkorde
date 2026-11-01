// Capture the notes that were down together at the most recent attack. Lifting
// fingers, however slowly, cannot replace that voicing with its release tail.
export class ReleaseVoicing {
  held = [];
  notes = [];

  update(keys) {
    const held = [...new Set(keys)].sort((a, b) => a - b);
    if (held.some((note) => !this.held.includes(note))) this.notes = held;
    this.held = held;
  }

  clear() {
    this.held = [];
    this.notes = [];
  }
}
