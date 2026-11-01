import { analyze, keyName, tonics } from './theory.mjs';

const topics = ['guide', 'chord', 'intervals', 'degree', 'function', 'jazz'];
const text = {
  en: {
    ref: 'Reference',
    eyebrow: 'Akkorde / Reference',
    back: '← Instrument',
    language: 'Language',
    nav: 'In this guide',
    voicing: 'Voicing',
    notes: 'Played notes',
    root: 'Root',
    bass: 'Bass',
    formula: 'Chord formula',
    chordSymbol: 'Chord symbol',
    section: 'Chord member',
    tones: 'Played pitches',
    semitones: 'Semitones',
    between: 'Note pair',
    type: 'Interval',
    examples: 'Explore a voicing',
    more: 'Show more intervals',
    sources: 'Further reading',
    noChord: 'No chord identified',
    none: 'No notes',
    other: 'Another possible reading',
    indeterminate: 'Open',
    topic: [
      'Reading the harmony',
      'Chord construction',
      'Intervals',
      'Scale degrees',
      'Harmonic functions',
      'Jazz symbols',
    ],
    intro: [
      'Follow one voicing through the different ways musicians describe it.',
      'Read each note as a member of a chord built on its root.',
      'Compare the written distance and the sounding distance between two notes.',
      'Find the root of a chord within the scale of the selected key.',
      'Interpret the chord’s role in relation to a tonal centre.',
      'Read the root, quality, extensions and bass from a lead-sheet symbol.',
    ],
    guideHead: 'One voicing, several readings',
    guide: [
      'Begin with F, A and C in C major. F names the chord. IV locates its root on the fourth degree. S offers a functional reading as the subdominant.',
      'Keep the same three notes and change the key to F major. The chord still reads F, while IV becomes I and S becomes T. Open the examples below to compare.',
    ],
    roleHead: 'How to read the formula',
    chord: [
      '1 is the root. Each further number measures a chord member above that root. A flat or sharp changes that member by one semitone relative to the root’s major scale.',
      'The lowest played note is the bass. Moving the third or fifth into the bass gives an inversion. Doubling a chord member in another octave adds a played pitch while keeping the same chord member.',
    ],
    ambiguous: 'The same pitches also support',
    noHarmony: 'Try a triad or one of the examples below to see its construction.',
    intHead: 'Count letters, then semitones',
    intervals: [
      'Count both ends to find the interval number. C to E spans three letter names and four semitones, a major third. C to E♭ spans three letters and three semitones, a minor third.',
      'A compound interval keeps its full span. C4 to D5 is a major ninth, fourteen semitones. With several notes, each pair has its own interval.',
    ],
    intFew: 'Play two different pitches to measure an interval.',
    selected: 'Selected pair',
    degreeHead: 'Root and key',
    degree: [
      'Start on the tonic and count scale steps up to the chord root. In C major, C–D–E–F places F on IV. Uppercase and lowercase distinguish major and minor triads. A ° marks a diminished triad.',
      'An applied dominant names its destination after a slash. In C major, D7 → G reads V⁷/V → V. Inversions can be shown by figures, such as I⁶ for a tonic triad with the third in the bass.',
    ],
    fnHead: 'A function implies a context',
    fn: [
      'T stands for tonic, S for subdominant and D for dominant. Lowercase letters identify minor versions. In C major, F → G7 → C can be read as S → D⁷ → T.',
      'DD is the dominant of the dominant. In C major, D7 contains F♯, which leads to G. The same D7 in G major acts as the primary dominant. Hearing the resolution helps decide how to interpret an isolated chord.',
    ],
    fnOpen:
      'Akkorde assigns no function symbol to this voicing in the selected key. Try playing its resolution to hear how it behaves in context.',
    parallel:
      'p marks a relative minor, as in Tp for A minor in C major. P marks a relative major in a minor key. These symbols follow German functional notation in all three languages.',
    jazzHead: 'Read from left to right',
    jazz: [
      'The root comes first. A plain C stands for a major triad, Cm for a minor triad, C7 for a major triad with a minor seventh, and Cmaj7 for a major triad with a major seventh. After a slash, the note names the bass. C/E puts E below a C major chord.',
      '9, 11 and 13 name extensions. C9 includes a minor seventh and a ninth. Cadd9 adds the ninth directly to the triad. An accidental attached to an extension changes that note, as in G7(♭9).',
    ],
    naming: 'Note names',
    namingBody:
      'German H corresponds to English B and Spanish si. German B corresponds to B♭ and si♭. In Spanish, note names use do, re, mi, fa, sol, la, si. International lead-sheet symbols generally retain letter names.',
    ex: [
      'F in C major',
      'F in F major',
      'A in the bass of F',
      'D7 as V/V in C major',
      'G7 in C major',
      'C with an added ninth',
      'C dominant ninth',
      'Minor third',
      'Major ninth',
    ],
  },
  de: {
    ref: 'Nachschlagewerk',
    eyebrow: 'Akkorde / Nachschlagewerk',
    back: '← Instrument',
    language: 'Sprache',
    nav: 'Themen',
    voicing: 'Klangbeispiel',
    notes: 'Gespielte Töne',
    root: 'Grundton',
    bass: 'Basston',
    formula: 'Akkordformel',
    chordSymbol: 'Akkordsymbol',
    section: 'Akkordton',
    tones: 'Gespielte Töne',
    semitones: 'Halbtöne',
    between: 'Tonpaar',
    type: 'Intervall',
    examples: 'Klangbeispiele',
    more: 'Weitere Intervalle anzeigen',
    sources: 'Zum Weiterlesen',
    noChord: 'Kein Akkord erkannt',
    none: 'Keine Töne',
    other: 'Weitere mögliche Deutung',
    indeterminate: 'Offen',
    topic: ['Harmonik lesen', 'Akkordaufbau', 'Intervalle', 'Stufen', 'Funktionen', 'Jazzsymbole'],
    intro: [
      'Ein Klangbeispiel aus verschiedenen musiktheoretischen Blickwinkeln betrachten.',
      'Die Töne eines Akkords auf seinen Grundton beziehen.',
      'Tonabstand und Schreibweise eines Tonpaars miteinander vergleichen.',
      'Den Akkordgrundton auf die gewählte Tonart beziehen.',
      'Die Rolle eines Akkords im Verhältnis zur Tonika deuten.',
      'Grundton, Klanggeschlecht, Erweiterungen und Basston am Akkordsymbol ablesen.',
    ],
    guideHead: 'Ein Klang, mehrere Lesarten',
    guide: [
      'Spiele F, A und C in C-Dur. Das Symbol F bezeichnet den Akkord. IV ordnet seinen Grundton der vierten Stufe zu. S deutet ihn als Subdominante.',
      'Lass die drei Töne liegen und wechsle die Tonart zu F-Dur. Der Akkord heißt weiterhin F. Aus IV wird I und aus S wird T. Die Klangbeispiele unten zeigen beide Lesarten.',
    ],
    roleHead: 'Die Akkordformel lesen',
    chord: [
      '1 bezeichnet den Grundton. Jede weitere Zahl beschreibt das Intervall eines Akkordtons über dem Grundton. ♭ und ♯ erniedrigen bzw. erhöhen diesen Ton gegenüber der Durtonleiter über dem Grundton um einen Halbton.',
      'Der tiefste gespielte Ton ist der Basston. Liegt die Terz oder Quinte im Bass, entsteht eine Umkehrung. Wird ein Akkordton in einer weiteren Oktave gespielt, erscheint er als Verdopplung.',
    ],
    ambiguous: 'Dieselben Töne ermöglichen auch die Deutung als',
    noHarmony: 'Spiele einen Dreiklang oder öffne eines der Klangbeispiele, um den Akkordaufbau zu sehen.',
    intHead: 'Stammtöne und Halbtöne zählen',
    intervals: [
      'Für die Intervallzahl werden Anfangs- und Endton mitgezählt. C–E umfasst drei Stammtöne und vier Halbtöne, also eine große Terz. C–Es umfasst ebenfalls drei Stammtöne, aber drei Halbtöne und bildet eine kleine Terz.',
      'Intervalle über die Oktave hinaus behalten ihren vollen Umfang. C4–D5 ist eine große None mit vierzehn Halbtönen. Bei mehreren Tönen wird jedes Tonpaar einzeln ausgewertet.',
    ],
    intFew: 'Spiele zwei verschiedene Tonhöhen, um ein Intervall zu bestimmen.',
    selected: 'Gewähltes Tonpaar',
    degreeHead: 'Grundton und Tonart',
    degree: [
      'Zähle vom Grundton der Tonart bis zum Akkordgrundton. In C-Dur führt C–D–E–F zur IV. Stufe. Groß- und Kleinschreibung unterscheiden hier Dur- und Molldreiklänge. ° bezeichnet einen verminderten Dreiklang.',
      'Bei einer Zwischendominante nennt die Stufe nach dem Schrägstrich den Zielakkord. In C-Dur liest sich D7 → G als V⁷/V → V. Ziffern können die Umkehrung anzeigen, etwa I⁶ für die I. Stufe mit der Terz im Bass.',
    ],
    fnHead: 'Die Funktion im Zusammenhang hören',
    fn: [
      'T steht für Tonika, S für Subdominante und D für Dominante. Kleinbuchstaben bezeichnen Mollklänge. In C-Dur lässt sich F → G7 → C als S → D⁷ → T lesen.',
      'DD bezeichnet die Doppeldominante, also die Dominante der Dominante. In C-Dur enthält D7 den Leitton Fis zum Zielton G. Derselbe D7 ist in G-Dur selbst die Dominante. Wie sich der Akkord auflöst, hilft bei der Deutung.',
    ],
    fnOpen:
      'Akkorde vergibt für diesen Klang in der gewählten Tonart kein Funktionszeichen. Spiele seine Auflösung, um seine Wirkung im Zusammenhang zu hören.',
    parallel:
      'p bezeichnet eine Mollparallele, etwa Tp für a-Moll in C-Dur. P bezeichnet eine Durparallele in Moll. Die Funktionszeichen folgen in allen drei Sprachen der deutschsprachigen Schreibweise.',
    jazzHead: 'Das Symbol von links nach rechts lesen',
    jazz: [
      'Zuerst steht der Grundton. C bezeichnet einen Durdreiklang, Cm einen Molldreiklang, C7 einen Durdreiklang mit kleiner Septime und Cmaj7 einen Durdreiklang mit großer Septime. Nach dem Schrägstrich folgt der Basston. Bei C/E liegt E im Bass.',
      '9, 11 und 13 stehen für Erweiterungen. C9 enthält die kleine Septime und die große None. Bei Cadd9 kommt allein die None zum Dreiklang hinzu. Ein Versetzungszeichen vor einer Erweiterung verändert diesen Ton, etwa die None in G7(♭9).',
    ],
    naming: 'Tonnamen',
    namingBody:
      'Das deutsche H entspricht dem englischen B und dem spanischen si. Das deutsche B entspricht B♭ und si♭. Spanische Tonnamen lauten do, re, mi, fa, sol, la, si. Internationale Leadsheets verwenden meist die englischen Buchstabennamen.',
    ex: [
      'F in C-Dur',
      'F in F-Dur',
      'F-Dur mit A im Bass',
      'D7 als V/V in C-Dur',
      'G7 in C-Dur',
      'C-Dur mit hinzugefügter None',
      'C-Dominantnonakkord',
      'Kleine Terz',
      'Große None',
    ],
  },
  es: {
    ref: 'Guía de armonía',
    eyebrow: 'Akkorde / Guía de armonía',
    back: '← Instrumento',
    language: 'Idioma',
    nav: 'Temas',
    voicing: 'Ejemplo',
    notes: 'Notas tocadas',
    root: 'Fundamental',
    bass: 'Bajo',
    formula: 'Fórmula del acorde',
    chordSymbol: 'Símbolo del acorde',
    section: 'Factor del acorde',
    tones: 'Notas tocadas',
    semitones: 'Semitonos',
    between: 'Par de notas',
    type: 'Intervalo',
    examples: 'Explorar un ejemplo',
    more: 'Ver más intervalos',
    sources: 'Para profundizar',
    noChord: 'Acorde sin identificar',
    none: 'Sin notas',
    other: 'Otra interpretación posible',
    indeterminate: 'Indeterminada',
    topic: [
      'Cómo leer la armonía',
      'Estructura del acorde',
      'Intervalos',
      'Grados',
      'Funciones armónicas',
      'Cifrado de jazz',
    ],
    intro: [
      'Explora distintas maneras de describir una misma disposición de notas.',
      'Relaciona cada nota del acorde con su fundamental.',
      'Compara la distancia escrita y la distancia sonora entre dos notas.',
      'Sitúa la fundamental del acorde en la escala de la tonalidad elegida.',
      'Interpreta el papel del acorde con respecto a la tónica.',
      'Lee la fundamental, el tipo de acorde, las extensiones y el bajo en el cifrado americano.',
    ],
    guideHead: 'Un acorde, varias lecturas',
    guide: [
      'Toca fa, la y do en do mayor. F identifica el acorde de fa mayor. IV sitúa su fundamental en el cuarto grado y S indica su función de subdominante.',
      'Mantén esas tres notas y cambia la tonalidad a fa mayor. El acorde sigue siendo F. El grado pasa de IV a I y la función de S a T. Compara ambas lecturas en los ejemplos.',
    ],
    roleHead: 'Cómo leer la fórmula',
    chord: [
      '1 representa la fundamental. Los demás números indican intervalos medidos desde ella. Un bemol o un sostenido baja o sube un semitono el grado correspondiente de la escala mayor de la fundamental.',
      'La nota más grave es el bajo. Cuando la tercera o la quinta está en el bajo, el acorde está en inversión. Si una nota se repite en otra octava, se duplica un mismo factor del acorde.',
    ],
    ambiguous: 'Estas notas también admiten la lectura',
    noHarmony: 'Toca una tríada o abre uno de los ejemplos para ver cómo se construye el acorde.',
    intHead: 'Cuenta nombres de nota y semitonos',
    intervals: [
      'Cuenta las dos notas extremas para obtener el número del intervalo. De do a mi hay tres nombres de nota y cuatro semitonos, una tercera mayor. De do a mi♭ hay tres nombres y tres semitonos, una tercera menor.',
      'Los intervalos compuestos conservan toda su amplitud. De do4 a re5 hay una novena mayor, catorce semitonos. Cuando suenan varias notas, se mide el intervalo de cada par.',
    ],
    intFew: 'Toca dos alturas diferentes para medir un intervalo.',
    selected: 'Par seleccionado',
    degreeHead: 'La fundamental y la tonalidad',
    degree: [
      'Cuenta los grados de la escala desde la tónica hasta la fundamental del acorde. En do mayor, do–re–mi–fa sitúa fa en el IV grado. Las mayúsculas y minúsculas distinguen las tríadas mayores y menores. ° indica una tríada disminuida.',
      'En una dominante secundaria, el número tras la barra indica el grado de destino. En do mayor, D7 → G se lee V⁷/V → V. La inversión puede indicarse con cifras, como I⁶ para la tríada de tónica con la tercera en el bajo.',
    ],
    fnHead: 'Escuchar la función en su contexto',
    fn: [
      'T indica tónica, S subdominante y D dominante. Las minúsculas indican acordes menores. En do mayor, F → G7 → C puede leerse como S → D⁷ → T.',
      'DD es la dominante de la dominante. En do mayor, re7 contiene fa♯, sensible de sol. Ese mismo re7 es la dominante principal de sol mayor. Escuchar su resolución ayuda a interpretar el acorde.',
    ],
    fnOpen:
      'Akkorde no asigna un símbolo de función a esta disposición de notas en la tonalidad elegida. Toca su resolución para escuchar su efecto en contexto.',
    parallel:
      'p indica el relativo menor, como Tp para la menor en do mayor. P indica el relativo mayor en una tonalidad menor. Los símbolos funcionales siguen la convención alemana en los tres idiomas.',
    jazzHead: 'Leer de izquierda a derecha',
    jazz: [
      'La letra inicial indica la fundamental. C es una tríada mayor, Cm una tríada menor, C7 una tríada mayor con séptima menor y Cmaj7 una tríada mayor con séptima mayor. La nota tras la barra indica el bajo. C/E sitúa mi en el bajo del acorde de do mayor.',
      '9, 11 y 13 indican extensiones. C9 incluye la séptima menor y la novena mayor. Cadd9 añade la novena directamente a la tríada. Una alteración junto a la extensión modifica esa nota, como la novena en G7(♭9).',
    ],
    naming: 'Nombres de las notas',
    namingBody:
      'El si natural se escribe H en alemán y B en inglés. El si♭ se escribe B en alemán y B♭ en inglés. En español se usan do, re, mi, fa, sol, la y si. El cifrado americano suele conservar los nombres con letras.',
    ex: [
      'Fa mayor en do mayor',
      'Fa mayor en fa mayor',
      'Fa mayor con la en el bajo',
      'D7 como V/V en do mayor',
      'G7 en do mayor',
      'Do con novena añadida',
      'Novena de dominante sobre do',
      'Tercera menor',
      'Novena mayor',
    ],
  },
};

const params = new URLSearchParams(location.search);
const lang = Object.hasOwn(text, params.get('lang')) ? params.get('lang') : 'de';
const t = text[lang];
const topic = topics.includes(params.get('topic')) ? params.get('topic') : 'guide';
const mode = params.get('mode') === 'minor' ? 'minor' : 'major';
const tonic = tonics(mode).includes(params.get('tonic')) ? params.get('tonic') : 'C';
const notes = params.has('notes')
  ? [
      ...new Set(
        params
          .get('notes')
          .split(',')
          .filter((v) => /^\d{1,3}$/.test(v))
          .map(Number)
          .filter((n) => n <= 127),
      ),
    ].sort((a, b) => a - b)
  : topic === 'intervals'
    ? [60, 63]
    : [53, 57, 60];
const state = { lang, topic, tonic, mode, notes: notes.join(',') };
for (const flag of ['presentation', 'reveal']) {
  if (params.has(flag)) state[flag] = params.get(flag);
}
for (const side of ['from', 'to']) {
  if (params.has(side) && notes.includes(Number(params.get(side)))) state[side] = params.get(side);
}
const analysis = analyze(notes, tonic, mode, lang);
const chord = analysis.chord;
const pitch = (n) => n.name + n.octave;
const byMidi = new Map(analysis.notes.map((n) => [n.midi, pitch(n)]));

function url(overrides = {}, page = 'reference.html') {
  const target = new URLSearchParams({ ...state, ...overrides });
  if (page === 'index.html') ['from', 'to', 'topic'].forEach((k) => target.delete(k));
  return './' + page + '?' + target;
}
function el(tag, str, cls) {
  const element = document.createElement(tag);
  if (str !== undefined) element.textContent = str;
  if (cls) element.className = cls;
  return element;
}
function link(label, href, cls) {
  const a = el('a', label, cls);
  a.href = href;
  return a;
}
function section(heading, paragraphs = []) {
  const container = el('section', undefined, 'entry-section');
  container.append(el('h2', heading), ...paragraphs.map((p) => el('p', p)));
  return container;
}
function field(label, value, next) {
  const wrap = el('div', undefined, 'field');
  const dd = el('dd');
  if (next) dd.append(link(value, url({ topic: next })));
  else dd.textContent = value;
  wrap.append(el('dt', label), dd);
  return wrap;
}
function table(headers) {
  const box = el('div', undefined, 'table-box');
  const tab = el('table'),
    head = tab.createTHead().insertRow();
  headers.forEach((h) => {
    const th = el('th', h);
    th.scope = 'col';
    head.append(th);
  });
  const rows = tab.createTBody();
  box.append(tab);
  return {
    box,
    add(values) {
      const tr = rows.insertRow();
      values.forEach((v) => tr.append(el('td', v)));
      return tr;
    },
  };
}

document.documentElement.lang = lang;
const title = t.topic[topics.indexOf(topic)];
document.title = title + ' · Akkorde';
document.querySelector('#eyebrow').textContent = t.eyebrow;
document.querySelector('#page-title').textContent = title;
document.querySelector('#intro').textContent = t.intro[topics.indexOf(topic)];
const language = document.querySelector('#language');
language.value = lang;
language.setAttribute('aria-label', t.language);
language.addEventListener('change', () => location.assign(url({ lang: language.value })));
document.querySelector('#home').href = url({}, 'index.html');
const back = document.querySelector('#back');
back.textContent = t.back;
back.href = url({}, 'index.html');
const nav = document.querySelector('#contents');
nav.setAttribute('aria-label', t.nav);
const items = el('div', undefined, 'nav-items');
topics.forEach((id, i) => {
  const a = link(t.topic[i], url({ topic: id }));
  if (id === topic) a.setAttribute('aria-current', 'page');
  items.append(a);
});
nav.append(el('h2', t.nav), items);
const entry = document.querySelector('#entry');
const snapshot = el('section', undefined, 'voicing');
const caption = el('div', undefined, 'voicing-top');
caption.append(el('h2', t.voicing, 'section-key'), el('span', keyName(tonic, mode, lang), 'key'));
const fields = el('dl', undefined, 'fields');
fields.append(field(t.notes, analysis.notes.map(pitch).join(' · ') || t.none));
if (chord) {
  fields.append(
    field(t.chordSymbol, chord.jazz, 'jazz'),
    field(t.topic[3], chord.degree || '—', 'degree'),
    field(t.topic[4], chord.fn || '—', 'function'),
  );
}
snapshot.append(caption, fields);
entry.append(snapshot);

const exampleData = [
  ['C', [53, 57, 60]],
  ['F', [53, 57, 60]],
  ['C', [57, 60, 65]],
  ['C', [50, 54, 57, 60]],
  ['C', [55, 59, 62, 65]],
  ['C', [48, 52, 55, 62]],
  ['C', [48, 52, 55, 58, 62]],
  ['C', [60, 63]],
  ['C', [60, 74]],
];
function examples(ids) {
  const group = el('section', undefined, 'examples');
  group.append(el('h3', t.examples));
  const list = el('div', undefined, 'example-list');
  ids.forEach((i) => {
    const [key, midis] = exampleData[i];
    const nextTopic = topic === 'guide' ? (i < 2 ? 'degree' : 'function') : topic;
    const q = new URLSearchParams({
      lang,
      topic: nextTopic,
      tonic: key,
      mode: 'major',
      notes: midis.join(','),
    });
    const a = link('', './reference.html?' + q, 'example-link');
    const arrow = el('span', '↗');
    arrow.setAttribute('aria-hidden', 'true');
    a.append(el('span', t.ex[i]), arrow);
    list.append(a);
  });
  group.append(list);
  return group;
}
const memberLabels = {
  1: ['root', 'Grundton', 'fundamental'],
  2: ['major second', 'große Sekunde', 'segunda mayor'],
  '♭3': ['minor third', 'kleine Terz', 'tercera menor'],
  3: ['major third', 'große Terz', 'tercera mayor'],
  4: ['perfect fourth', 'reine Quarte', 'cuarta justa'],
  '♭5': ['diminished fifth', 'verminderte Quinte', 'quinta disminuida'],
  5: ['perfect fifth', 'reine Quinte', 'quinta justa'],
  '♯5': ['augmented fifth', 'übermäßige Quinte', 'quinta aumentada'],
  6: ['major sixth', 'große Sexte', 'sexta mayor'],
  '♭♭7': ['diminished seventh', 'verminderte Septime', 'séptima disminuida'],
  '♭7': ['minor seventh', 'kleine Septime', 'séptima menor'],
  7: ['major seventh', 'große Septime', 'séptima mayor'],
  '♭9': ['minor ninth', 'kleine None', 'novena menor'],
  9: ['major ninth', 'große None', 'novena mayor'],
  '♯9': ['augmented ninth', 'übermäßige None', 'novena aumentada'],
  11: ['perfect eleventh', 'reine Undezime', 'undécima justa'],
  '♯11': ['augmented eleventh', 'übermäßige Undezime', 'undécima aumentada'],
  '♭13': ['minor thirteenth', 'kleine Tredezime', 'decimotercera menor'],
  13: ['major thirteenth', 'große Tredezime', 'decimotercera mayor'],
};
function chordSection() {
  const part = section(chord ? chord.name : t.noChord);
  if (!chord) {
    part.append(el('p', t.noHarmony));
    return part;
  }
  const details = el('dl', undefined, 'fields');
  details.append(field(t.root, chord.root), field(t.bass, chord.bass), field(t.formula, chord.formula));
  part.append(details);
  if (Number.isInteger(chord.rootPC)) {
    const majorScale = [0, 2, 4, 5, 7, 9, 11];
    const members = table([t.section, t.type, t.tones]);
    for (const token of chord.formula.split(/\s+/)) {
      const degree = token.match(/^(.*?)(\d+)$/u);
      if (!degree) continue;
      const accidental = [...degree[1]].reduce(
        (n, char) => n + ({ '♭': -1, b: -1, '♯': 1, '#': 1, '𝄫': -2, '𝄪': 2 }[char] || 0),
        0,
      );
      const pc = (chord.rootPC + majorScale[(Number(degree[2]) - 1) % 7] + accidental + 12) % 12;
      const played = analysis.notes.filter((n) => n.midi % 12 === pc);
      const name = memberLabels[token] ? inLang(...memberLabels[token]) : token;
      members.add([token, name, played.map(pitch).join(' · ') || '—']);
    }
    part.append(members.box);
  }
  if (chord.alternatives.length)
    part.append(el('p', t.ambiguous + ' ' + chord.alternatives.join(' / ') + '.'));
  return part;
}
function intervalSection() {
  const active = Number(state.from),
    end = Number(state.to);
  const selected = analysis.intervals.find((i) => i.from === active && i.to === end);
  const part = section(selected ? selected.label : t.topic[2]);
  if (!analysis.intervals.length) {
    part.append(el('p', t.intFew));
    return part;
  }
  const list = selected
    ? [selected, ...analysis.intervals.filter((i) => i !== selected)]
    : analysis.intervals;
  const grid = table([t.between, t.type, t.semitones]);
  const more = el('button', t.more, 'more');
  more.type = 'button';
  let shown = 0;
  function showBatch() {
    const stop = Math.min(shown + 36, list.length);
    for (; shown < stop; shown++) {
      const i = list[shown];
      const row = grid.add([byMidi.get(i.from) + ' – ' + byMidi.get(i.to), i.label, i.semitones]);
      if (i === selected) {
        row.className = 'selected';
        row.cells[0].append(' · ' + t.selected);
      }
    }
    more.hidden = shown >= list.length;
    if (more.hidden) more.remove();
  }
  part.append(grid.box, more);
  more.addEventListener('click', showBatch);
  showBatch();
  return part;
}
const functionNames = {
  T: ['major tonic', 'Durtonika', 'tónica mayor'],
  t: ['minor tonic', 'Molltonika', 'tónica menor'],
  S: ['major subdominant', 'Dursubdominante', 'subdominante mayor'],
  s: ['minor subdominant', 'Mollsubdominante', 'subdominante menor'],
  D: ['major dominant', 'Durdominante', 'dominante mayor'],
  d: ['minor dominant', 'Molldominante', 'dominante menor'],
  DD: ['dominant of the dominant', 'Doppeldominante', 'dominante de la dominante'],
  Tp: ['relative minor of the tonic', 'Tonikaparallele in Dur', 'relativo menor de la tónica'],
  Sp: [
    'relative minor of the subdominant',
    'Subdominantparallele in Dur',
    'relativo menor de la subdominante',
  ],
  Dp: ['relative minor of the dominant', 'Dominantparallele in Dur', 'relativo menor de la dominante'],
  tP: ['relative major of the tonic', 'Tonikaparallele in Moll', 'relativo mayor de la tónica'],
  sP: [
    'relative major of the subdominant',
    'Subdominantparallele in Moll',
    'relativo mayor de la subdominante',
  ],
};
const inLang = (en, de, es) => ({ en, de, es })[lang];
function contextual(kind) {
  const asFunction = kind === 'function';
  const node = section(asFunction ? t.fnHead : t.degreeHead);
  if (chord) {
    const key = keyName(tonic, mode, lang);
    let reading;
    if (asFunction) {
      const symbol = chord.fn.replace('⁷', '');
      const names = functionNames[symbol];
      if (names) {
        const full =
          inLang(...names) +
          (chord.fn.endsWith('⁷') ? inLang(' with seventh', ' mit Septime', ' con séptima') : '');
        reading =
          inLang('In ' + key + ', ', 'In ' + key + ' ', 'En ' + key + ', ') +
          inLang(
            chord.jazz + ' can be heard as the ',
            'lässt sich ' + chord.jazz + ' deuten als ',
            chord.jazz + ' puede oírse como ',
          ) +
          full +
          ' (' +
          chord.fn +
          ').';
      } else {
        reading = t.fnOpen;
      }
    } else {
      reading = inLang(
        'In ' + key + ', root ' + chord.root + ' lies on degree ' + chord.rootDegree + '.',
        'In ' + key + ' liegt der Akkordgrundton ' + chord.root + ' auf Stufe ' + chord.rootDegree + '.',
        'En ' +
          key +
          ', la fundamental ' +
          chord.root +
          ' se encuentra en el grado ' +
          chord.rootDegree +
          '.',
      );
      if (chord.target) {
        reading +=
          ' ' +
          inLang('As an applied dominant, ', 'Als Zwischendominante führt ', 'Como dominante secundaria, ') +
          chord.degree +
          inLang(' points to ', ' zur Stufe ', ' se dirige al grado ') +
          chord.target +
          '.';
      }
    }
    node.append(el('p', reading, 'analysis-line'));
  }
  (asFunction ? [...t.fn, t.parallel] : t.degree).forEach((p) => node.append(el('p', p)));
  return node;
}

switch (topic) {
  case 'guide':
    entry.append(section(t.guideHead, t.guide), section(t.naming, [t.namingBody]), examples([0, 1, 3]));
    break;
  case 'chord':
    entry.append(chordSection(), section(t.roleHead, t.chord), examples([0, 2, 5]));
    break;
  case 'intervals':
    entry.append(intervalSection(), section(t.intHead, t.intervals), examples([7, 8, 0]));
    break;
  case 'degree':
    entry.append(contextual('degree'), examples([0, 1, 2, 3]));
    break;
  case 'function':
    entry.append(contextual('function'), examples([0, 3, 4]));
    break;
  case 'jazz':
    entry.append(chordSection(), section(t.jazzHead, t.jazz), examples([2, 5, 6]));
    break;
}

const readings = {
  de: [
    'Open Music Academy · Perspektiven auf Harmonik',
    'https://openmusic.academy/docs/U4ebkK3nBPKDYzHBBDuqGH/kurzanleitung-perspektiven-auf-harmonik',
  ],
  en: ['Puget Sound · Jazz Chord Basics', 'https://musictheory.pugetsound.edu/mt21c/JazzChordBasics.html'],
  es: ['teoría · Dominantes secundarias', 'https://www.teoria.com/es/referencia/s/secundarias.php'],
};
const further = el('section', undefined, 'further');
further.append(el('h3', t.sources));
const sourceList = el('ul', undefined, 'sources');
[lang, ...Object.keys(readings).filter((k) => k !== lang)].forEach((code) => {
  const li = el('li');
  const [description, href] = readings[code];
  const a = link(description + ' (' + code.toUpperCase() + ')', href);
  a.hreflang = code;
  li.append(a);
  sourceList.append(li);
});
further.append(sourceList);
entry.append(further);
