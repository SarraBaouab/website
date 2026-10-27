// Every word the 3D room shows, in one place. Research, Neuro Workbench, experience and skills copy is
// the live site's wording, word for word (tests/content.test.mjs checks this); tools/strings.mjs lists
// the rest for Sarra's approval.

export const ATTRIBUTION = "Reconstruction n419: Pyapali et al. (1998), NeuroMorpho.Org, CC BY 4.0; Tecuatl, Ljungquist & Ascoli (2024).";

// Stations in keyboard order. kind: what activating it does (open a card, the main screen, a camera view,
// a small effect, or Oura's chat). label: the hover tooltip. nav: the keyboard-bar button.
export const STATIONS = [
  { id: "screen", kind: "screen", label: "Main screen: open my files", nav: "Main screen" },
  { id: "brain", kind: "card", label: "Neuro Workbench", nav: "Neuro Workbench" },
  { id: "forensic", kind: "card", label: "Interview console", nav: "Interview console" },
  { id: "clinical", kind: "card", label: "Training bay", nav: "Training bay" },
  { id: "globe", kind: "card", label: "Holographic globe", nav: "Globe" },
  { id: "log", kind: "card", label: "Mission log", nav: "Mission log" },
  { id: "cv", kind: "card", label: "CV dock", nav: "CV dock" },
  { id: "lounge", kind: "view", label: "Lounge: sit down", nav: "Lounge" },
  { id: "tea", kind: "effect", label: "Mint tea", nav: "Mint tea" },
  { id: "jasmine", kind: "effect", label: "Tunisian jasmine", nav: "Jasmine" },
  { id: "window", kind: "effect", label: "Window: Frankfurt, live time", nav: "Window" },
  { id: "ivy", kind: "effect", label: "Ivy tube", nav: "Ivy tube" },
  { id: "bot", kind: "chat", label: "Oura: tap to chat", nav: "Chat with Oura" },
];

// Places she has lived (her account, 27 Oct 2026) and her languages (levels as on her approved CV).
export const PLACES = [
  { id: "tn", big: "15", unit: "years", where: "Tunisia", lon: 10.2, lat: 36.8 },
  { id: "de", big: "10", unit: "years", where: "Germany", lon: 8.7, lat: 50.1 },
  { id: "sh", big: "1", unit: "semester", where: "Shanghai", lon: 121.5, lat: 31.2 },
];
export const LANGS = [
  { name: "Arabic", native: "العربية", lang: "ar", lvl: "Native", ctx: "Tunisian Arabic, and Modern Standard Arabic at B2.", place: "tn" },
  { name: "French", native: "Français", lang: "fr", lvl: "Native", ctx: "French Baccalauréat." },
  { name: "English", native: "", lang: "en", lvl: "Fluent", ctx: "My B.Sc. in Psychology was taught in English. The rest comes from being chronically online." },
  { name: "Spanish", native: "Español", lang: "es", lvl: "B2", ctx: "Translated a child-interview training from Spanish into French and Arabic." },
  { name: "German", native: "Deutsch", lang: "de", lvl: "B1", ctx: "Ten years in Germany.", place: "de" },
  { name: "Mandarin", native: "中文", lang: "zh", lvl: "HSK 3", ctx: "A semester in Shanghai.", place: "sh" },
];
export const HELLO = [["عسلامة", "ar"], ["Bonjour", "fr"], ["Hello", "en"], ["Hola", "es"], ["Hallo", "de"], ["你好", "zh"]];
export const LOG_ROWS = [["2024", ["B.Sc.", "Psychology"]], ["Sep 2025", ["Research", "Assistant"]], ["Sep 2025", ["Independent", "Expert"]], ["Fall 2025", ["Teaching", "Assistant"]], ["Dec 2025", ["Research", "Developer"]], ["Oct 2026", ["Neuro", "Workbench"]]];

// From her approved CV; she still has to confirm them for the public site.
export const LATEST_UPDATES = [
  "Prototyped a 3D human brain explorer on the Allen Human Reference Atlas, with linked slices and a guided tour of the memory circuit.",
  "Built a passive cable model of a reconstructed rat CA1 neuron in NEURON and cross-checked it against Jaxley; checks against cable theory are ongoing.",
  "Ran a published spike-timing-dependent plasticity model in Brian2 under a fixed, replayable protocol, and implemented six plasticity rules for a study of whether standard experiments can tell them apart.",
];

const UNPUB = `<p class="note">Work with university research groups is unpublished. Details in my CV or on request.</p>`;
const FORENSIC_ITEMS = `
  <div class="entry"><p class="kind">Research Assistant, since September 2025</p><h3>Forensic interviewing across languages</h3><p>With Prof. Pekka Santtila's forensic psychology research group: AI support for interviewing children in Tunisian Arabic.</p></div>
  <div class="entry"><p class="kind">Independent Expert (Adaptation), since September 2025</p><h3>Child-friendly justice training, Tunisia</h3><p>Adapted a training on interviewing child victims for professionals in Tunisia, for an EU and Council of Europe project.</p></div>
  <div class="entry"><p class="kind">Course project, continued independently since 2025</p><h3>Racial disparities in wrongful convictions</h3><p>A data pipeline on the U.S. National Registry of Exonerations and a draft preregistration.</p></div>`;
const CLINICAL_ITEM = `<div class="entry"><p class="kind">Research Developer, since December 2025</p><h3>Clinical training technology</h3><p>With Prof. Katie Aafjes-van Doorn's psychotherapy research lab: AI simulated patients for training therapists' interpersonal skills.</p></div>`;
const NEURO_DESC = `<p class="kind">Neuroscience and neurotechnology, independent project, since October 2026</p>
  <p class="status">Working prototype; scientific validation in progress</p>
  <p>A desktop lab for looking inside computational models of neurons, with every number on screen tied to a recorded run. The current demonstration links a real 3D reconstruction of a hippocampal neuron to stored voltage traces from a passive model.</p>`;
const TIMELINE = `<ol class="tl">
  <li><span class="when">Oct 2026 to present</span><span><b>Neuro Workbench</b>, independent research software</span></li>
  <li><span class="when">Dec 2025 to present</span><span><b>Research Developer</b>, Prof. Katie Aafjes-van Doorn's psychotherapy research lab</span></li>
  <li><span class="when">Sep 2025 to present</span><span><b>Research Assistant</b>, Prof. Pekka Santtila's forensic psychology research group</span></li>
  <li><span class="when">Sep 2025 to present</span><span><b>Independent Expert (Adaptation)</b>, EU and Council of Europe project on child-friendly justice, Tunisia</span></li>
  <li><span class="when">Fall 2025</span><span><b>Teaching Assistant</b>, undergraduate psychology course</span></li>
  <li><span class="when">2024 to 2026</span><span><b>B.Sc. Psychology</b>, University of Europe for Applied Sciences, Berlin</span></li></ol>`;
const MAIL = `<p class="mail">contact@sarrabaouab.com</p><button class="btn small" type="button" data-act="copy">Copy address</button>`;
const CV_LINK = `<a class="btn primary" href="cv/Sarra_Baouab_CV.pdf" target="_blank" rel="noopener">Open my CV (PDF)</a>`;

export const CARDS = {
  brain: {
    html: `<p class="obj">Brain hologram</p><h2>Neuro Workbench</h2>${NEURO_DESC}
      <section class="updates" aria-labelledby="upd-h"><h3 id="upd-h">Latest updates</h3><p class="kind">October 2026</p><ul class="upd">
        ${LATEST_UPDATES.map((u) => `<li>${u}</li>`).join("\n        ")}
      </ul></section>`,
    actions: `<button class="btn primary" type="button" data-act="preview">Preview</button><button class="btn soon" type="button" data-act="get" aria-disabled="true">Get now <span class="tag">Coming soon</span></button>`,
  },
  forensic: { html: `<p class="obj">Interview console</p><h2>Forensic psychology</h2>${FORENSIC_ITEMS}${UNPUB}` },
  clinical: { html: `<p class="obj">Training bay</p><h2>Clinical training technology</h2>${CLINICAL_ITEM}${UNPUB}` },
  globe: {
    html: `<p class="obj">Holographic globe</p><h2>Languages and places</h2>
      <section aria-labelledby="pl-h"><div class="lp-head"><h3 id="pl-h" class="sec-label">Where I've lived</h3><span class="scribble" aria-hidden="true">tap one, the globe turns</span></div>
        <div class="places">${PLACES.map((p) => `<button class="place" type="button" data-act="place" data-id="${p.id}" aria-pressed="false"><span class="big">${p.big}</span><span class="unit">${p.unit}</span><span class="where">${p.where}</span></button>`).join("")}</div></section>
      <section aria-labelledby="lg-h"><h3 id="lg-h" class="sec-label">Languages</h3><ul class="langs2">${LANGS.map((L, i) => `<li><button class="lang" type="button" data-act="lang" data-i="${i}"><span class="nm">${L.name}${L.native ? `<span class="native" lang="${L.lang}">${L.native}</span>` : ""}</span><span class="lvl">${L.lvl}</span>${L.ctx ? `<span class="ctx">${L.ctx}</span>` : ""}</button></li>`).join("")}</ul></section>
      <p class="quote">“I want to make international research accessible.”</p>`,
  },
  log: { html: `<p class="obj">Mission log</p><h2>Experience</h2>${TIMELINE}` },
  cv: { html: `<p class="obj">CV dock</p><h2>My CV</h2><p>My full CV is a PDF on my website.</p>${CV_LINK}<div class="entry"><h3>Email</h3>${MAIL}</div>` },
};

const ICON = (body) => `<svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="#0f1f2b" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${body}</svg>`;
export const ICONS = {
  doc: ICON(`<path d="M11 4h18l9 9v31H11z" fill="#ffffff"/><path d="M29 4v9h9" fill="#bfeefe"/><path d="M16 22h16M16 28h16M16 34h11"/>`),
  folder: ICON(`<path d="M4 12h15l4 5h21v25H4z" fill="#bfeefe"/><path d="M4 20h40"/>`),
  app: ICON(`<rect x="5" y="5" width="38" height="38" rx="11" fill="#0f1f2b"/><circle cx="24" cy="25" r="5" fill="#7fe3ff" stroke="#7fe3ff"/><path d="M24 20V10M24 30l-8 9M24 30l8 9M19 25H9M29 25h10" stroke="#7fe3ff"/>`),
  pdf: ICON(`<path d="M11 4h18l9 9v31H11z" fill="#ffffff"/><rect x="8" y="24" width="26" height="12" rx="2" fill="#7fe3ff"/><text x="21" y="33.5" font-size="9" font-family="sans-serif" font-weight="700" text-anchor="middle" fill="#0f1f2b" stroke="none">PDF</text>`),
  mail: ICON(`<rect x="5" y="11" width="38" height="27" rx="3" fill="#ffffff"/><path d="M5 13l19 15 19-15"/>`),
};

// The main screen's windows.
export const WINS = {
  about: { icon: "doc", name: "About me", html: `<h3>Sarra Baouab</h3><p class="kind">Frankfurt am Main</p>
    <p>I studied psychology and build software for research: AI simulated patients for training therapists, AI support for forensic interviews across languages, and a workbench for computational models of neurons.</p>
    <h4>What I want to work on</h4><ul><li>Forensic and legal psychology</li><li>Neuropsychology</li><li>Neurotechnology</li><li>AI tools for psychology</li></ul>` },
  research: { icon: "folder", name: "Research", html: FORENSIC_ITEMS + CLINICAL_ITEM + UNPUB },
  neuro: { icon: "app", name: "Neuro Workbench", html: `<h3>Neuro Workbench</h3>${NEURO_DESC}<button class="btn primary small" type="button" data-act="preview">Preview</button>` },
  experience: { icon: "doc", name: "Experience", html: TIMELINE },
  skills: { icon: "doc", name: "Skills", html: `<dl>
    <dt>Research</dt><dd>Study design, questionnaires, preregistration, NICHD interview protocol</dd>
    <dt>Data</dt><dd>Python, R, SPSS, SQL</dd>
    <dt>AI</dt><dd>Language-model evaluation; Unreal Engine, MetaHuman, NVIDIA Audio2Face</dd>
    <dt>Modelling</dt><dd>NEURON, Jaxley, Brian2</dd>
    <dt>Languages</dt><dd>Arabic, French, English, Spanish, German, Mandarin</dd></dl>` },
  cv: { icon: "pdf", name: "CV", html: `<p>My full CV is a PDF on my website.</p>${CV_LINK}` },
  contact: { icon: "mail", name: "Contact", html: `<p>Email me at</p>${MAIL}` },
};

// The Neuro Workbench preview: the project page's screenshots and captions.
export const SLIDES = [
  { img: "assets/img/nw-n419-neuron.webp", h: "Open a reconstruction", t: "Rat CA1 pyramidal neuron n419 from NeuroMorpho.Org, drawn at its true radii. Three sites are pinned: the soma, P (102 µm along the apical dendrite) and D (400 µm).",
    alt: "The reconstructed neuron in 3D, blue basal dendrites below the soma and orange apical dendrites above, with pins at the soma, P and D." },
  { img: "assets/img/nw-step-select.webp", h: "Select a site", t: "The pin, its branch, the inspector and the traces share one selection. The inspector gives the site's position in the reconstruction and in the NEURON model.",
    alt: "The 3D view with the selected branch highlighted and the inspector showing site D at 400.093 micrometres path distance, both in the reconstruction and in the NEURON placement." },
  { img: "assets/img/nw-step-readout.webp", h: "Read the stored output", t: "Voltage at all three sites after a 20 pA current step at D. Hovering names the exact stored sample and the run it came from; the table is computed from the stored traces.",
    alt: "Site traces panel: three voltage traces after a current step at D, a hover readout giving time and voltage of a stored sample, and a table of voltage change and resistance per site." },
  { img: "assets/img/nw-n419-traces-crop.webp", h: "Compare two simulators", t: "An EPSC-shaped current at P, with Jaxley's solution of the same model drawn over NEURON's.",
    alt: "Site traces panel with an EPSC-shaped response at three sites, NEURON and Jaxley traces overlaid, and a readout giving both simulators' values at the same time point." },
  { img: "assets/img/nw-n419-inspector.webp", h: "The full workspace", t: "Dataset metadata, the 3D view, site traces and the inspector, with a status bar reporting 8 of 8 measurements matching the archive.",
    alt: "Full application window: dataset panel, 3D view, site traces for a current step at D, and the inspector at site P." },
];

// Buttons Oura offers under an answer, by station.
export const GO_LABEL = { brain: "Show me Neuro Workbench", forensic: "Show me the forensic work", clinical: "Show me the training bay", globe: "Show me the globe", log: "Show me the mission log", cv: "Take me to the CV dock", screen: "Open the main screen" };

export const TEXT = {
  start_who: "Sarra Baouab",
  start_title: "Step into the command room.",
  start_sub: "Tap the glowing things. Some of them make sounds.",
  enter_sound: "Enter with sound",
  enter_quiet: "Enter quietly",
  plain_link: "Prefer the plain page? Show it instead.",
  fallback_title: "The 3D room didn't load.",
  fallback_body: "This browser may not support 3D graphics. The plain version has everything.",
  loading: ["Calibrating the hologram", "Watering the ivy", "Waking up the main screen", "Charging the globe", "Loading the CV dock"],
  boot: ["Main screen", "Linking stations ... ok", "Loading research ... ok", "Watering the ivy ... ok", "", "Welcome aboard."],
  hint_touch: "Swipe to look around. Tap the glowing things, or the robot to chat.",
  hint_mouse: "Drag to look around. Click the glowing things, or the robot to chat.",
  toast_get: "Neuro Workbench isn't released yet. Coming soon.",
  toast_tea: "Mint tea break. Back to work in five minutes.",
  toast_jasmine: "Tunisian jasmine. Smells like summer.",
  toast_ivy: "Hydroponic ivy. It grows toward the light.",
  toast_lounge: "Make yourself comfortable. Tap anywhere to stand up.",
  toast_preview: "Frankfurt at {name}, as a preview. Tap the window again for the next one.",
  toast_real_time: "Back to Frankfurt's real time, {time}.",
  ios_silent: "No sound? Check that your phone isn't on silent.",
  oura_hello: "Hi, I'm Oura! Tap me to chat about Sarra, or tap anything glowing.",
  oura_chat_hello: "Hi! I'm Oura, the guide of this room. Ask me anything about Sarra's work, languages or CV.",
  chat_note: "An AI guide to this site. She only knows what's here and can make mistakes.",
  chat_placeholder: "Ask about Sarra",
  chips: ["What does Sarra work on?", "Tell me about Neuro Workbench", "Which languages does she speak?", "Can I see her CV?", "How can I contact her?"],
  plain_note: "Your browser can't show the 3D room, so here is the plain version.",
  mode_to_plain: "Plain version",
  mode_to_room: "Enter the 3D room",
  sound_on: "Sound on",
  sound_off: "Sound off",
  copied: "Copied",
  copy_selected: "Selected. Copy it from here.",
  os_clock: "Frankfurt {time}",
  slide_count: "{n} of {total}",
  win_close: "Close {name}",
};
