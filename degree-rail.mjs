// The display text may name an applied dominant (V/V); its marker always follows
// the chord's written root degree in the selected key (II in this example).
export function degreeRail(chord) {
  const rail = document.createElement('span');
  rail.className = 'degree-rail';
  const label = chord?.degree || '—';
  const step = chord?.scaleDegree;
  rail.setAttribute('role', 'img');
  rail.setAttribute('aria-label', chord?.target ? `${label} (${chord.rootDegree})` : label);
  rail.style.setProperty('--degree-position', step ?? 4);
  rail.style.setProperty('--degree-characters', label.length);

  const symbol = document.createElement('span');
  symbol.className = 'value degree-symbol';
  symbol.textContent = label;
  const markers = document.createElement('span');
  markers.className = 'degree-markers';
  markers.setAttribute('aria-hidden', 'true');
  for (let i = 1; i <= 7; i++) {
    const marker = document.createElement('span');
    if (i === step) marker.className = 'degree-active';
    markers.append(marker);
  }
  rail.append(symbol, markers);
  return rail;
}
