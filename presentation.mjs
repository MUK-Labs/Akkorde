const labels = {
  de: {
    presentation: 'Präsentationsmodus',
    full: 'Vollbild',
    midi: 'MIDI-Eingang',
    unavailable: 'Vollbild ist in diesem Browserfenster nicht verfügbar.',
    denied: 'Der Browser konnte den Vollbildmodus nicht umschalten.',
  },
  en: {
    presentation: 'Presentation mode',
    full: 'Full screen',
    midi: 'MIDI input',
    unavailable: 'Full screen is unavailable in this browser window.',
    denied: 'The browser could not switch full-screen mode.',
  },
  es: {
    presentation: 'Modo de presentación',
    full: 'Pantalla completa',
    midi: 'Entrada MIDI',
    unavailable: 'La pantalla completa no está disponible en esta ventana.',
    denied: 'El navegador no ha podido cambiar el modo de pantalla completa.',
  },
};

// Keep the existing MIDI controls (and their listeners and permission state) in
// one place at a time. In class they fit behind a single button in the analysis panel.
export function initPresentation(getLang, onChange = () => {}) {
  const root = document.documentElement;
  const present = document.getElementById('presentation-toggle');
  const fullscreen = document.getElementById('fullscreen-toggle');
  const message = document.getElementById('fullscreen-message');
  const device = document.querySelector('.device');
  const deviceHome = document.createComment('MIDI controls');
  device.before(deviceHome);

  const menu = document.createElement('details');
  menu.className = 'class-midi-menu';
  const summary = document.createElement('summary');
  summary.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#ico-midi"/></svg>';
  const panel = document.createElement('div');
  panel.className = 'class-device-panel';
  menu.append(summary, panel);
  document.getElementById('class-midi').append(menu);

  let pending = false;
  let failed = false;
  const inFullscreen = () => Boolean(document.fullscreenElement || document.webkitFullscreenElement);
  const request = root.requestFullscreen || root.webkitRequestFullscreen;
  const leave = document.exitFullscreen || document.webkitExitFullscreen;
  const available =
    !!request && !!leave && (document.fullscreenEnabled ?? document.webkitFullscreenEnabled ?? true);
  const inPresentation = () => new URL(location.href).searchParams.get('presentation') === '1';

  function refresh() {
    const t = labels[getLang()] || labels.en;
    const presenting = inPresentation();
    root.classList.toggle('presenting', presenting);
    if (presenting && device.parentNode !== panel) panel.append(device);
    if (!presenting && device.parentNode === panel) {
      menu.open = false;
      deviceHome.after(device);
    }
    present.setAttribute('aria-pressed', String(presenting));
    present.setAttribute('aria-label', t.presentation);
    present.title = t.presentation;
    fullscreen.setAttribute('aria-pressed', String(inFullscreen()));
    fullscreen.setAttribute('aria-label', t.full);
    fullscreen.title = available ? t.full : t.unavailable;
    fullscreen.disabled = !available || pending;
    summary.title = t.midi;
    summary.setAttribute('aria-label', t.midi);
    message.textContent = failed ? t.denied : '';
    message.classList.toggle('class-feedback', failed);
  }

  function layoutChanged() {
    refresh();
    onChange();
  }
  present.addEventListener('click', () => {
    const url = new URL(location.href);
    if (inPresentation()) url.searchParams.delete('presentation');
    else url.searchParams.set('presentation', '1');
    history.pushState(history.state, '', url);
    layoutChanged();
  });
  window.addEventListener('popstate', layoutChanged);
  fullscreen.addEventListener('click', async () => {
    if (pending || !available) return;
    pending = true;
    failed = false;
    try {
      if (inFullscreen()) await leave.call(document);
      else await request.call(root);
    } catch {
      failed = true;
    } finally {
      pending = false;
      refresh();
    }
  });
  function fullChanged() {
    failed = false;
    refresh();
  }
  document.addEventListener('fullscreenchange', fullChanged);
  document.addEventListener('webkitfullscreenchange', fullChanged);
  document.addEventListener('click', (event) => {
    if (!menu.contains(event.target)) menu.open = false;
    if (failed && !fullscreen.contains(event.target)) {
      failed = false;
      refresh();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (menu.open && event.key === 'Escape') {
      menu.open = false;
      summary.focus();
    }
  });
  refresh();
  return refresh;
}
