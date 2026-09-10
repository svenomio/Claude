// Betriebsrat – Eskalations-Engine.
// Definiert die 9 Eskalationsstufen des Glücksrads, wendet sie auf den
// (materialisierten) Organigramm-Baum an und liefert Text für das
// Ereignis-Banner. Reine Logik, kein DOM-Zugriff.

const Escalation = (() => {
  const DEPARTMENT_NAME_POOL = [
    "Stabsstelle Bürostuhl-Angelegenheiten",
    "Kompetenzzentrum für Montagsmotivation",
    "Amt für Umstrukturierungsgerüchte",
    "Referat Gerüchteküche",
    "Taskforce Kaffeeautomat 2.0",
    "Zentrale für interne Verwirrung",
    "Kompetenzcluster Home-Office-Pantoffeln",
    "Direktion Kantinenangelegenheiten",
    "Fachbereich Unmögliches",
    "Kompetenzteam Post-it-Strategie",
    "Einheit für kreative Buchhaltung",
    "Stabsstelle Wanderpokal",
    "Abteilung Sonstiges",
    "Ressort Sonderlocken & Sonderaufgaben",
    "Kompetenzcenter Bildschirm-Hintergründe",
    "Fachgruppe Mittagspausen-Optimierung",
    "Stabsstelle Strategische Bedenkzeit",
    "Referat für spontane Meetings",
    "Kompetenzzentrum Newsletter-Poesie",
    "Abteilung für ungelesene E-Mails",
    "Taskforce Teeküchen-Diplomatie",
    "Zentrum für organisatorische Achtsamkeit",
    "Stabsstelle Kabelsalat-Management",
    "Referat Kaffeekapsel-Nachschub",
  ];

  const DEPARTMENT_CLAIM_POOL = [
    "Wir liefern, wenn wir Zeit haben.",
    "Exzellenz. Manchmal.",
    "Näher am Chaos als jeder andere.",
    "Wir sind an allem schuld – offiziell.",
    "Von hier kommt der Flurfunk.",
    "Wir denken quer. Meistens versehentlich.",
    "Synergie ist unser zweiter Vorname.",
    "Wir machen aus jedem Meeting ein Erlebnis.",
    "Verantwortlich für: irgendwas.",
    "Wenn nicht wir, wer dann? (Niemand weiß es.)",
    "Wir liefern Ergebnisse. Und Ausreden.",
    "100% Buzzwords, 0% Budget.",
  ];

  const PERSON_TITLE_POOL = [
    "Oberste Instanz für Bürostuhl-Angelegenheiten",
    "Minister:in für Mittagspause",
    "Hüter:in der geheimen Excel-Formel",
    "Chef:in vom Kaffeeautomaten",
    "Vorsitzende:r des Post-it-Komitees",
    "Sprecher:in der stillen Etage",
    "Zuständig für das Gerücht der Woche",
    "Schattenkanzler:in der Buchhaltung",
    "Oberste:r Wächter:in der Büropflanzen",
    "Geheime:r Strippenzieher:in im Serverraum",
    "Kaiser:in der Kantine",
    "Mysteriöse Randnotiz im Organigramm",
    "Head of Strategic Coffee Breaks",
    "Chief Motivation Officer",
    "Beauftragte:r für Homeoffice-Pantoffeln",
    "Senior Vice President für Büroklammern",
  ];

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function pickOtherThan(arr, exclude) {
    const filtered = arr.filter((x) => x !== exclude);
    return filtered.length ? pick(filtered) : pick(arr);
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  let idCounter = 0;

  function materialize(node) {
    idCounter += 1;
    const id = `u${idCounter}`;
    return {
      id,
      name: node.name,
      claim: null,
      members: (node.members || []).map((name) => {
        idCounter += 1;
        return { id: `m${idCounter}`, name, title: null };
      }),
      children: (node.children || []).map((child) => materialize(child)),
    };
  }

  // Alle Einheiten des Baums (inkl. Root), Vor-Order.
  function flattenUnits(tree) {
    const out = [];
    (function walk(node) {
      out.push(node);
      node.children.forEach(walk);
    })(tree);
    return out;
  }

  // Alle {member, unit}-Paare des Baums.
  function flattenMembers(tree) {
    const out = [];
    flattenUnits(tree).forEach((unit) => {
      unit.members.forEach((member) => out.push({ member, unit }));
    });
    return out;
  }

  function renameUnit(unit) {
    const oldName = unit.name;
    unit.name = pickOtherThan(DEPARTMENT_NAME_POOL, oldName);
    return oldName;
  }

  function moveMember(member, fromUnit, toUnit) {
    fromUnit.members = fromUnit.members.filter((m) => m.id !== member.id);
    toUnit.members.push(member);
  }

  // ---- Einzel-Effekte (Bausteine, auch für Stufe 6 "Doppelschlag") ----

  function effectRename(tree) {
    const units = flattenUnits(tree).filter((u) => u !== tree);
    const unit = pick(units);
    const oldName = renameUnit(unit);
    return {
      changedUnitIds: [unit.id],
      changedMemberIds: [],
      text: `"${oldName}" heißt ab sofort "${unit.name}".`,
    };
  }

  function effectSwapNames(tree) {
    const units = flattenUnits(tree).filter((u) => u !== tree);
    const a = pick(units);
    const b = pickOtherThan(units, a);
    const nameA = a.name;
    a.name = b.name;
    b.name = nameA;
    return {
      changedUnitIds: [a.id, b.id],
      changedMemberIds: [],
      text: `"${nameA}" und "${b.name}" tauschen die Namen.`,
    };
  }

  function effectClaim(tree) {
    const units = flattenUnits(tree).filter((u) => u !== tree);
    const unit = pick(units);
    const oldName = renameUnit(unit);
    unit.claim = pick(DEPARTMENT_CLAIM_POOL);
    return {
      changedUnitIds: [unit.id],
      changedMemberIds: [],
      text: `"${oldName}" wird zu "${unit.name}" – neuer Claim: „${unit.claim}“`,
    };
  }

  function effectRotate(tree) {
    const pairs = flattenMembers(tree);
    if (pairs.length < 1) return { changedUnitIds: [], changedMemberIds: [], text: "" };
    const { member, unit: fromUnit } = pick(pairs);
    const units = flattenUnits(tree).filter((u) => u !== tree && u.id !== fromUnit.id);
    const toUnit = pick(units.length ? units : [fromUnit]);
    moveMember(member, fromUnit, toUnit);
    return {
      changedUnitIds: [fromUnit.id, toUnit.id],
      changedMemberIds: [member.id],
      text: `${member.name} wechselt von "${fromUnit.name}" zu "${toUnit.name}".`,
    };
  }

  function effectTitle(tree) {
    const pairs = flattenMembers(tree);
    if (pairs.length < 1) return { changedUnitIds: [], changedMemberIds: [], text: "" };
    const { member, unit } = pick(pairs);
    member.title = pick(PERSON_TITLE_POOL);
    return {
      changedUnitIds: [unit.id],
      changedMemberIds: [member.id],
      text: `${member.name} ist jetzt „${member.title}“.`,
    };
  }

  function effectLeadershipSwap(tree) {
    const units = flattenUnits(tree).filter((u) => u !== tree);
    const gf = units.find((u) => u.name === "Geschäftsführung" && u.members.length > 0) ||
      units.find((u) => u.name === "Geschäftsführung");
    if (!gf) return effectRotate(tree);

    const candidates = units.filter(
      (u) => u.id !== gf.id && u.members.length === 1 && u.children.length === 0
    );
    const swapUnit = candidates.length
      ? pick(candidates)
      : pick(units.filter((u) => u.id !== gf.id && u.members.length > 0));
    if (!swapUnit) return effectRotate(tree);

    const gfMember = gf.members.length ? pick(gf.members) : null;
    const otherMember = pick(swapUnit.members);

    if (gfMember) {
      gf.members = gf.members.filter((m) => m.id !== gfMember.id);
      swapUnit.members = swapUnit.members.filter((m) => m.id !== otherMember.id);
      gf.members.push(otherMember);
      swapUnit.members.push(gfMember);
      return {
        changedUnitIds: [gf.id, swapUnit.id],
        changedMemberIds: [gfMember.id, otherMember.id],
        text: `${otherMember.name} wird neue Geschäftsführung, während ${gfMember.name} künftig "${swapUnit.name}" leitet.`,
      };
    }

    swapUnit.members = swapUnit.members.filter((m) => m.id !== otherMember.id);
    gf.members.push(otherMember);
    return {
      changedUnitIds: [gf.id, swapUnit.id],
      changedMemberIds: [otherMember.id],
      text: `${otherMember.name} übernimmt kurzerhand die Geschäftsführung.`,
    };
  }

  function redistributeAllMembers(tree) {
    const units = flattenUnits(tree);
    const counts = units.map((u) => u.members.length);
    const allMembers = shuffle(units.flatMap((u) => u.members));
    let cursor = 0;
    const changedUnitIds = [];
    const changedMemberIds = allMembers.map((m) => m.id);
    units.forEach((unit, i) => {
      const count = counts[i];
      const newMembers = allMembers.slice(cursor, cursor + count);
      cursor += count;
      unit.members = newMembers;
      changedUnitIds.push(unit.id);
    });
    return { changedUnitIds, changedMemberIds };
  }

  function effectJoker(tree) {
    const { changedUnitIds, changedMemberIds } = redistributeAllMembers(tree);
    return {
      changedUnitIds,
      changedMemberIds,
      text: "Alle schließen die Augen, drehen sich dreimal – und haben plötzlich neue Vorgesetzte. Die komplette Mannschaft wurde neu gewürfelt.",
    };
  }

  function effectUltimate(tree) {
    const units = flattenUnits(tree).filter((u) => u !== tree);
    const shuffledNames = shuffle(DEPARTMENT_NAME_POOL);
    units.forEach((u, i) => {
      u.name = shuffledNames[i % shuffledNames.length];
    });
    const { changedMemberIds } = redistributeAllMembers(tree);
    return {
      changedUnitIds: units.map((u) => u.id),
      changedMemberIds,
      text: "Der Vorstand lädt zur Mitarbeiter-Veranstaltung – und baut danach die gesamte Organisation neu auf. Alle Positionen und alle Bereiche sind neu.",
    };
  }

  // ---- Die 9 Stufen ----
  // weight = Anzahl Segmente auf dem Rad (je höher die Stufe, desto seltener).
  const TIERS = [
    { level: 1, weight: 8, name: "Umbenennungswelle", color: "#4ade80", apply: effectRename },
    { level: 2, weight: 6, name: "Namenstausch", color: "#38bdf8", apply: effectSwapNames },
    { level: 3, weight: 5, name: "Claim-Update", color: "#a3e635", apply: effectClaim },
    { level: 4, weight: 4, name: "Job-Rotation", color: "#ffcf4a", apply: effectRotate },
    { level: 5, weight: 3, name: "Titel-Upgrade", color: "#fb923c", apply: effectTitle },
    {
      level: 6,
      weight: 2,
      name: "Doppelschlag",
      color: "#f472b6",
      apply: (tree) => {
        const effects = [effectRename, effectSwapNames, effectRotate, effectTitle, effectClaim];
        const [fx1, fx2] = shuffle(effects).slice(0, 2);
        const r1 = fx1(tree);
        const r2 = fx2(tree);
        return {
          changedUnitIds: [...r1.changedUnitIds, ...r2.changedUnitIds],
          changedMemberIds: [...r1.changedMemberIds, ...r2.changedMemberIds],
          text: `${r1.text} Und gleichzeitig: ${r2.text}`,
        };
      },
    },
    { level: 7, weight: 2, name: "Führungswechsel", color: "#c084fc", apply: effectLeadershipSwap },
    { level: 8, weight: 1, name: "Mitarbeiter-Joker", color: "#fb7185", apply: effectJoker },
    { level: 9, weight: 1, name: "Vorstands-Veranstaltung", color: "#ffd54a", apply: effectUltimate, unique: true },
  ];

  function buildSegments() {
    const segments = [];
    TIERS.forEach((tier) => {
      for (let i = 0; i < tier.weight; i++) segments.push(tier);
    });
    return shuffle(segments);
  }

  function pickWeightedTier() {
    const totalWeight = TIERS.reduce((sum, t) => sum + t.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const tier of TIERS) {
      roll -= tier.weight;
      if (roll <= 0) return tier;
    }
    return TIERS[0];
  }

  return {
    TIERS,
    materialize,
    flattenUnits,
    flattenMembers,
    buildSegments,
    pickWeightedTier,
  };
})();
