// Betriebsrat – Glücksrad der Führungsebene
// Alles läuft client-seitig, kein Backend nötig.

const STORAGE_KEY = "betriebsrat_state_v1";

const DEFAULT_ROSTER = [
  { id: "p1", name: "Martin", position: "Geschäftsführer" },
  { id: "p2", name: "Marco", position: "Teamleiter" },
  { id: "p3", name: "Moni", position: "Assistenz der Geschäftsführung" },
];

// Titel-Pools nach Absurditäts-Stufe. Je höher das Chaos-Level,
// desto wahrscheinlicher werden Titel aus höheren Stufen gezogen.
const TITLE_POOLS = {
  0: [
    "Geschäftsführer:in",
    "Prokurist:in",
    "Abteilungsleiter:in",
    "Teamleiter:in",
    "Aufsichtsrat",
    "Berater:in der Geschäftsführung",
    "Assistenz der Geschäftsführung",
    "Projektleitung",
  ],
  1: [
    "Head of Assistance of Administration",
    "Senior Vice President für Büroklammern",
    "Chief Motivation Officer",
    "Interimistische Teamleitung Kantine",
    "Beauftragte:r für Homeoffice-Pantoffeln",
    "Prokurist:in für Sonderaufgaben",
    "Head of Strategic Coffee Breaks",
    "Ehrenmitglied des Vorstands (inoffiziell)",
  ],
  2: [
    "Oberste Instanz für Bürostuhl-Angelegenheiten",
    "Minister:in für Mittagspause",
    "Hüter:in der geheimen Excel-Formel",
    "Chef:in vom Kaffeeautomaten",
    "Vorsitzende:r des Post-it-Komitees",
    "Sprecher:in der stillen Etage",
    "Zuständig für das Gerücht der Woche",
    "Schattenkanzler:in der Buchhaltung",
  ],
  3: [
    "Oberste:r Wächter:in der Büropflanzen",
    "Geheime:r Strippenzieher:in im Serverraum",
    "Erbe/Erbin des Locher-Imperiums",
    "Prophet:in der nächsten Umstrukturierung",
    "Kaiser:in der Kantine",
    "Mysteriöse Randnotiz im Organigramm",
    "Unantastbare Legende der Kaffeeecke",
    "Kanzler:in im Exil (Büro im 2. Stock)",
  ],
};

const CONNECTORS = [
  "um dann",
  "während",
  "nur um kurz darauf",
  "woraufhin",
  "und gleichzeitig",
  "während zeitgleich",
];

const OPENERS = [
  "wurde von {old} zu {new}",
  "stieg von {old} zu {new} auf",
  "wechselte überraschend von {old} zu {new}",
  "wurde von {old} zu {new} befördert",
  "rutschte von {old} in die Rolle {new}",
];

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function freshState() {
  return {
    roster: DEFAULT_ROSTER.map((p) => ({ ...p })),
    currentRoles: DEFAULT_ROSTER.map((p) => ({ id: p.id, name: p.name, role: p.position })),
    chaosLevel: 0,
  };
}

let state = load() || freshState();
// Falls die Roster-Struktur aus einer älteren Version stammt, absichern.
if (!state.roster || !state.currentRoles) state = freshState();

const wheelEl = document.getElementById("wheel");
const spinBtn = document.getElementById("spinBtn");
const resetBtn = document.getElementById("resetBtn");
const chaosBadge = document.getElementById("chaosBadge");
const storyText = document.getElementById("storyText");
const storyPlaceholder = document.getElementById("storyPlaceholder");
const rosterPreview = document.getElementById("rosterPreview");
const rosterEditor = document.getElementById("rosterEditor");
const rosterList = document.getElementById("rosterList");
const toggleRosterBtn = document.getElementById("toggleRoster");
const addPersonBtn = document.getElementById("addPersonBtn");

const SEGMENT_COLORS = [
  "#ff6b4a",
  "#ffcf4a",
  "#4ade80",
  "#38bdf8",
  "#c084fc",
  "#f472b6",
  "#fb923c",
  "#2dd4bf",
];

function renderWheel() {
  const people = state.roster;
  const n = Math.max(people.length, 1);
  const slice = 360 / n;
  const gradientStops = people
    .map((p, i) => {
      const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
      return `${color} ${i * slice}deg ${(i + 1) * slice}deg`;
    })
    .join(", ");
  wheelEl.style.background = `conic-gradient(${gradientStops})`;

  wheelEl.querySelectorAll(".wheel-segment-label").forEach((el) => el.remove());
  people.forEach((p, i) => {
    const angle = slice * i + slice / 2;
    const label = document.createElement("span");
    label.className = "wheel-segment-label";
    label.textContent = p.name;
    label.style.transform = `rotate(${angle}deg) translate(46%, -50%)`;
    wheelEl.appendChild(label);
  });
}

function renderRosterPreview() {
  rosterPreview.innerHTML = "";
  const roles = new Map(state.currentRoles.map((r) => [r.id, r.role]));
  state.roster.forEach((p) => {
    const li = document.createElement("li");
    const nameEl = document.createElement("span");
    nameEl.className = "name";
    nameEl.textContent = p.name;
    const roleEl = document.createElement("span");
    roleEl.className = "role";
    roleEl.textContent = roles.get(p.id) || p.position;
    li.appendChild(nameEl);
    li.appendChild(roleEl);
    rosterPreview.appendChild(li);
  });
}

function renderRosterEditor() {
  rosterList.innerHTML = "";
  state.roster.forEach((p) => {
    const row = document.createElement("div");
    row.className = "roster-row";

    const nameInput = document.createElement("input");
    nameInput.value = p.name;
    nameInput.placeholder = "Vorname";
    nameInput.addEventListener("input", () => {
      p.name = nameInput.value;
      const cr = state.currentRoles.find((r) => r.id === p.id);
      if (cr) cr.name = nameInput.value;
      save(state);
      renderWheel();
      renderRosterPreview();
    });

    const positionInput = document.createElement("input");
    positionInput.value = p.position;
    positionInput.placeholder = "Position";
    positionInput.addEventListener("input", () => {
      p.position = positionInput.value;
      save(state);
    });

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "✕";
    removeBtn.addEventListener("click", () => {
      state.roster = state.roster.filter((x) => x.id !== p.id);
      state.currentRoles = state.currentRoles.filter((x) => x.id !== p.id);
      save(state);
      renderAll();
    });

    row.appendChild(nameInput);
    row.appendChild(positionInput);
    row.appendChild(removeBtn);
    rosterList.appendChild(row);
  });
}

function renderChaosBadge() {
  chaosBadge.textContent = `Chaos-Level: ${state.chaosLevel}`;
}

function renderAll() {
  renderWheel();
  renderRosterPreview();
  renderRosterEditor();
  renderChaosBadge();
}

function pickTitlePool(chaosLevel) {
  // Je höher das Chaos-Level, desto mehr Gewicht auf höheren Stufen.
  const maxTier = Math.min(3, Math.floor(chaosLevel / 2));
  const pool = [];
  for (let tier = 0; tier <= maxTier; tier++) {
    const weight = tier === maxTier ? 3 : 1;
    for (let w = 0; w < weight; w++) {
      pool.push(...TITLE_POOLS[tier]);
    }
  }
  return pool;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function spin() {
  if (state.roster.length === 0) return;
  spinBtn.disabled = true;

  const extraSpins = 4 + Math.floor(Math.random() * 3); // volle Umdrehungen
  const randomOffset = Math.random() * 360;
  const currentRotation = wheelEl._rotation || 0;
  const newRotation = currentRotation + extraSpins * 360 + randomOffset;
  wheelEl._rotation = newRotation;
  wheelEl.style.transform = `rotate(${newRotation}deg)`;

  window.setTimeout(() => {
    resolveSpin();
    spinBtn.disabled = false;
  }, 3300);
}

function resolveSpin() {
  const previous = state.currentRoles;
  const pool = pickTitlePool(state.chaosLevel);
  const basePositions = state.roster.map((p) => p.position);
  const candidatePool = shuffle([...basePositions, ...pool]);

  const newRoles = state.roster.map((p, i) => {
    const prevRole = previous.find((r) => r.id === p.id)?.role || p.position;
    let newRole = candidatePool[i % candidatePool.length];
    // Kleine Chance, dass die Rolle absichtlich gleich bleibt, wirkt sonst zu hektisch.
    if (newRole === prevRole && Math.random() > 0.3) {
      newRole = pick(pool.length ? pool : basePositions);
    }
    return { id: p.id, name: p.name, role: newRole, prevRole };
  });

  state.currentRoles = newRoles.map(({ id, name, role }) => ({ id, name, role }));
  state.chaosLevel += 1;
  save(state);

  renderStory(newRoles);
  renderRosterPreview();
  renderChaosBadge();
}

function renderStory(newRoles) {
  const clauses = newRoles.map((r) => {
    const opener = pick(OPENERS).replace("{old}", r.prevRole).replace("{new}", r.role);
    return `${r.name} ${opener}`;
  });

  let story = "";
  clauses.forEach((clause, i) => {
    if (i === 0) {
      story += clause;
    } else {
      story += `, ${pick(CONNECTORS)} ${clause}`;
    }
  });
  story += ".";

  storyPlaceholder.hidden = true;
  storyText.hidden = false;
  storyText.textContent = story;
  storyText.classList.remove("fade-in");
  void storyText.offsetWidth; // reflow, damit die Animation neu startet
  storyText.classList.add("fade-in");
}

function resetAll() {
  state = freshState();
  save(state);
  wheelEl._rotation = 0;
  wheelEl.style.transform = "rotate(0deg)";
  storyText.hidden = true;
  storyPlaceholder.hidden = false;
  renderAll();
}

spinBtn.addEventListener("click", spin);
resetBtn.addEventListener("click", () => {
  if (confirm("Chaos-Level und Rollen wirklich zurücksetzen?")) resetAll();
});

toggleRosterBtn.addEventListener("click", () => {
  rosterEditor.hidden = !rosterEditor.hidden;
  toggleRosterBtn.textContent = rosterEditor.hidden ? "Bearbeiten" : "Fertig";
});

addPersonBtn.addEventListener("click", () => {
  const id = `p${Date.now()}`;
  state.roster.push({ id, name: "Neue Person", position: "Position" });
  state.currentRoles.push({ id, name: "Neue Person", role: "Position" });
  save(state);
  renderAll();
});

renderAll();
