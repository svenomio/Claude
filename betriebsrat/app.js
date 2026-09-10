// Betriebsrat – App-Logik: Rad-Interaktion (Wisch/Swipe), Organigramm-Rendering
// mit FLIP-Animation für versetzte Personen, State-Persistenz.

(() => {
  const STORAGE_KEY = "betriebsrat_org_v2";
  const HISTORY_KEY = "betriebsrat_history_v1";

  const wheelWrap = document.getElementById("wheelWrap");
  const wheelEl = document.getElementById("wheel");
  const wheelHint = document.getElementById("wheelHint");
  const legendEl = document.getElementById("legend");
  const orgChartEl = document.getElementById("orgChart");
  const resetBtn = document.getElementById("resetBtn");
  const historyEl = document.getElementById("history");
  const historyPlaceholder = document.getElementById("historyPlaceholder");

  let tree = loadTree() || freshTree();
  let eventHistory = loadHistory();
  let segments = Escalation.buildSegments();
  let rotation = 0;
  let isSpinning = false;

  function freshTree() {
    return Escalation.materialize(VEC_ORG_CHART);
  }

  function loadTree() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveTree() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tree));
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveHistory() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(eventHistory));
  }

  // ---------------- Rad ----------------

  function renderWheel() {
    const n = segments.length;
    const slice = 360 / n;
    const stops = segments
      .map((seg, i) => `${seg.color} ${i * slice}deg ${(i + 1) * slice}deg`)
      .join(", ");
    wheelEl.style.background = `conic-gradient(${stops})`;

    // Trennlinien zwischen JEDEM Einzelfeld (nicht nur zwischen Stufen),
    // damit gleichfarbige Nachbarfelder nicht optisch zu einem großen
    // Bereich verschmelzen – alle Felder sind gleich groß, nur die Anzahl
    // pro Stufe unterscheidet sich.
    wheelEl.querySelectorAll(".wheel-divider").forEach((el) => el.remove());
    for (let i = 0; i < n; i++) {
      const divider = document.createElement("div");
      divider.className = "wheel-divider";
      divider.style.transform = `translateX(-50%) rotate(${i * slice}deg)`;
      wheelEl.appendChild(divider);
    }

    wheelEl.querySelectorAll(".wheel-segment-label").forEach((el) => el.remove());
    // Segmente sind jetzt durchmischt (siehe buildSegments), liegen also nicht
    // mehr als ein zusammenhängender Block pro Stufe vor. Damit trotzdem nicht
    // 10x "Umbau" auf dem Rad steht, gibt's pro Stufe genau ein Label – auf
    // ihrem ersten Vorkommen im gemischten Rad.
    const radiusPercent = 32; // Abstand vom Mittelpunkt, in % der Rad-Breite/Höhe
    Escalation.TIERS.forEach((tier) => {
      const idx = segments.findIndex((s) => s === tier);
      if (idx === -1) return;
      const angle = idx * slice + slice / 2;
      const rad = (angle * Math.PI) / 180;
      const x = Math.sin(rad) * radiusPercent;
      const y = -Math.cos(rad) * radiusPercent;
      const readableAngle = angle > 90 && angle < 270 ? angle + 180 : angle;

      const label = document.createElement("span");
      label.className = "wheel-segment-label";
      label.style.color = tier.textColor || "#ffffff";
      label.style.left = `calc(50% + ${x}%)`;
      label.style.top = `calc(50% + ${y}%)`;
      label.style.transform = `translate(-50%, -50%) rotate(${readableAngle}deg)`;
      label.innerHTML = `<strong>${tier.level}</strong><span>${tier.name}</span>`;
      wheelEl.appendChild(label);
    });
  }

  function renderLegend() {
    legendEl.innerHTML = "";
    const total = Escalation.TIERS.reduce((s, t) => s + t.weight, 0);
    Escalation.TIERS.forEach((tier) => {
      const li = document.createElement("li");
      if (tier.unique) li.classList.add("unique");
      const dot = document.createElement("span");
      dot.className = "legend-dot";
      dot.style.background = tier.color;
      const name = document.createElement("span");
      name.className = "legend-name";
      name.textContent = `${tier.level}. ${tier.name}`;
      const rarity = document.createElement("span");
      rarity.className = "legend-rarity";
      rarity.textContent = tier.unique
        ? "Unikat"
        : `${Math.round((tier.weight / total) * 100)}%`;
      li.appendChild(dot);
      li.appendChild(name);
      li.appendChild(rarity);
      legendEl.appendChild(li);
    });
  }

  function angleFromCenter(clientX, clientY, rect) {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    return (Math.atan2(dx, -dy) * 180) / Math.PI;
  }

  function shortestDelta(a, b) {
    return (((b - a + 540) % 360) + 360) % 360 - 180;
  }

  let dragging = false;
  let lastAngle = 0;
  let dragHistory = [];

  wheelWrap.addEventListener("pointerdown", (e) => {
    if (isSpinning) return;
    wheelHint.hidden = true;
    dragging = true;
    wheelEl.classList.add("dragging");
    wheelEl.classList.remove("spinning");
    wheelWrap.setPointerCapture(e.pointerId);
    const rect = wheelEl.getBoundingClientRect();
    lastAngle = angleFromCenter(e.clientX, e.clientY, rect);
    dragHistory = [{ t: performance.now(), a: lastAngle }];
  });

  wheelWrap.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const rect = wheelEl.getBoundingClientRect();
    const angle = angleFromCenter(e.clientX, e.clientY, rect);
    const delta = shortestDelta(lastAngle, angle);
    rotation += delta;
    lastAngle = angle;
    wheelEl.style.transform = `rotate(${rotation}deg)`;
    const now = performance.now();
    dragHistory.push({ t: now, a: rotation });
    if (dragHistory.length > 6) dragHistory.shift();
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    wheelEl.classList.remove("dragging");

    let velocity = 0;
    if (dragHistory.length >= 2) {
      const first = dragHistory[0];
      const last = dragHistory[dragHistory.length - 1];
      const dt = last.t - first.t;
      if (dt > 0) velocity = (last.a - first.a) / dt; // deg/ms, unwrapped rotation values
    }

    resolveSpin(velocity);
  }

  wheelWrap.addEventListener("pointerup", endDrag);
  wheelWrap.addEventListener("pointercancel", endDrag);

  function resolveSpin(velocity) {
    if (isSpinning) return;

    const dir = velocity < 0 ? -1 : 1;
    const speed = Math.min(Math.abs(velocity), 1.5);
    const extraSpins = 3 + Math.floor(Math.random() * 3);
    const duration = 2.6 + speed * 1.4;

    const tier = Escalation.pickWeightedTier();
    const candidateIdx = segments
      .map((s, i) => (s.level === tier.level ? i : -1))
      .filter((i) => i !== -1);
    const segIndex = candidateIdx[Math.floor(Math.random() * candidateIdx.length)];
    const slice = 360 / segments.length;
    const centerAngle = segIndex * slice + slice / 2;

    const currentMod = ((rotation % 360) + 360) % 360;
    const desiredMod = (((360 - centerAngle) % 360) + 360) % 360;

    let finalRotation;
    if (dir === 1) {
      const deltaMod = ((desiredMod - currentMod) % 360 + 360) % 360;
      finalRotation = rotation + extraSpins * 360 + deltaMod;
    } else {
      const deltaMod = ((currentMod - desiredMod) % 360 + 360) % 360;
      finalRotation = rotation - extraSpins * 360 - deltaMod;
    }

    isSpinning = true;
    wheelEl.classList.add("spinning");
    wheelEl.style.setProperty("--spin-duration", `${duration}s`);
    wheelEl.style.transform = `rotate(${finalRotation}deg)`;
    rotation = finalRotation;

    wheelEl.addEventListener(
      "transitionend",
      () => {
        wheelEl.classList.remove("spinning");
        isSpinning = false;
        applyTier(tier);
      },
      { once: true }
    );
  }

  // ---------------- Organigramm ----------------

  function applyTier(tier) {
    const oldRects = new Map();
    orgChartEl.querySelectorAll("[data-member-id]").forEach((el) => {
      oldRects.set(el.dataset.memberId, el.getBoundingClientRect());
    });

    const result = tier.apply(tree);
    saveTree();

    renderOrgTree();
    addHistoryEntry(tier, result.text);
    flashUnits(result.changedUnitIds || []);
    flipMembers(result.changedMemberIds || [], oldRects);
  }

  function addHistoryEntry(tier, text) {
    const entry = { level: tier.level, name: tier.name, text };
    eventHistory.push(entry);
    saveHistory();
    renderHistoryEntry(entry, eventHistory.length);
    historyPlaceholder.hidden = true;
    historyEl.scrollTop = historyEl.scrollHeight;
  }

  function renderHistoryEntry(entry, index) {
    const el = document.createElement("div");
    el.className = "history-entry";
    const meta = document.createElement("span");
    meta.className = "history-meta";
    meta.textContent = `#${index} · Stufe ${entry.level} · ${entry.name}`;
    const text = document.createElement("p");
    text.className = "history-text";
    text.textContent = entry.text;
    el.appendChild(meta);
    el.appendChild(text);
    historyEl.appendChild(el);
    return el;
  }

  function renderHistory() {
    historyEl.innerHTML = "";
    eventHistory.forEach((entry, i) => renderHistoryEntry(entry, i + 1));
    historyPlaceholder.hidden = eventHistory.length > 0;
    historyEl.scrollTop = historyEl.scrollHeight;
  }

  function flashUnits(unitIds) {
    unitIds.forEach((id) => {
      const el = orgChartEl.querySelector(`[data-unit-id="${id}"] > .org-unit-name`);
      if (!el) return;
      el.classList.remove("flash");
      void el.offsetWidth;
      el.classList.add("flash");
    });
  }

  function flipMembers(memberIds, oldRects) {
    memberIds.forEach((id) => {
      const el = orgChartEl.querySelector(`[data-member-id="${id}"]`);
      if (!el) return;
      const oldRect = oldRects.get(id);
      if (oldRect) {
        const newRect = el.getBoundingClientRect();
        const dx = oldRect.left - newRect.left;
        const dy = oldRect.top - newRect.top;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          el.classList.add("flying");
          el.style.transition = "none";
          el.style.transform = `translate(${dx}px, ${dy}px)`;
          requestAnimationFrame(() => {
            el.style.transition = "transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)";
            el.style.transform = "";
            el.addEventListener(
              "transitionend",
              () => {
                el.classList.remove("flying");
                el.classList.add("member-flash");
                setTimeout(() => el.classList.remove("member-flash"), 1100);
              },
              { once: true }
            );
          });
          return;
        }
      }
      el.classList.add("member-flash");
      setTimeout(() => el.classList.remove("member-flash"), 1100);
    });
  }

  function renderOrgTree() {
    orgChartEl.innerHTML = "";
    const root = document.createElement("div");
    root.className = "org-root";
    root.textContent = tree.name;
    orgChartEl.appendChild(root);

    const leadership = tree.children.filter((u) => u.category === "leadership");
    const chapters = tree.children.filter((u) => u.category === "chapter");
    const teams = tree.children.filter(
      (u) => u.category !== "leadership" && u.category !== "chapter"
    );

    if (leadership.length) {
      orgChartEl.appendChild(renderLevel("Geschäftsführung", leadership, "org-level-leadership"));
    }
    if (chapters.length) {
      orgChartEl.appendChild(renderLevel("Chapters", chapters, "org-level-chapters"));
    }
    if (teams.length) {
      orgChartEl.appendChild(renderLevel("Bereiche & Teams", teams, "org-level-teams"));
    }
  }

  function renderLevel(label, units, extraClass) {
    const section = document.createElement("div");
    section.className = `org-level ${extraClass}`;
    const heading = document.createElement("p");
    heading.className = "org-level-label";
    heading.textContent = label;
    section.appendChild(heading);
    section.appendChild(renderChildren(units));
    return section;
  }

  function renderChildren(children) {
    const wrap = document.createElement("div");
    wrap.className = "org-tree";
    children.forEach((unit) => wrap.appendChild(renderUnit(unit)));
    return wrap;
  }

  function renderUnit(unit) {
    const box = document.createElement("div");
    box.className = "org-unit";
    box.dataset.unitId = unit.id;

    const name = document.createElement("p");
    name.className = "org-unit-name";
    name.textContent = unit.name;
    box.appendChild(name);

    if (unit.claim) {
      const claim = document.createElement("p");
      claim.className = "org-unit-claim";
      claim.textContent = `„${unit.claim}“`;
      box.appendChild(claim);
    }

    if (unit.members.length) {
      const [lead, ...team] = unit.members;

      const leadRow = document.createElement("div");
      leadRow.className = "org-lead";
      leadRow.dataset.memberId = lead.id;
      const leadTag = document.createElement("span");
      leadTag.className = "org-lead-tag";
      leadTag.textContent = "Lead";
      const leadName = document.createElement("span");
      leadName.className = "org-lead-name";
      leadName.textContent = lead.name;
      leadRow.appendChild(leadTag);
      leadRow.appendChild(leadName);
      if (lead.title) {
        const titleSpan = document.createElement("span");
        titleSpan.className = "org-member-title";
        titleSpan.textContent = lead.title;
        leadRow.appendChild(titleSpan);
      }
      box.appendChild(leadRow);

      if (team.length) {
        const members = document.createElement("div");
        members.className = "org-members";
        team.forEach((member) => {
          const chip = document.createElement("span");
          chip.className = "org-member";
          chip.dataset.memberId = member.id;
          const nameSpan = document.createElement("span");
          nameSpan.textContent = member.name;
          chip.appendChild(nameSpan);
          if (member.title) {
            const titleSpan = document.createElement("span");
            titleSpan.className = "org-member-title";
            titleSpan.textContent = member.title;
            chip.appendChild(titleSpan);
          }
          members.appendChild(chip);
        });
        box.appendChild(members);
      }
    } else if (!unit.children.length) {
      const empty = document.createElement("p");
      empty.className = "org-unit-empty";
      empty.textContent = "vakant";
      box.appendChild(empty);
    }

    if (unit.children.length) {
      const childrenWrap = document.createElement("div");
      childrenWrap.className = "org-unit-children";
      unit.children.forEach((child) => childrenWrap.appendChild(renderUnit(child)));
      box.appendChild(childrenWrap);
    }

    return box;
  }

  // ---------------- Reset ----------------
  // Kein window.confirm(): das wird in gesandboxten Umgebungen (z.B.
  // Artifact-Vorschau-iFrames) oft blockiert, wodurch der Klick wirkungslos
  // bliebe. Stattdessen bestätigt ein zweiter Klick auf den Button selbst.

  let resetArmed = false;
  let resetArmTimeout = null;

  function armReset() {
    resetArmed = true;
    resetBtn.textContent = "Wirklich? Nochmal klicken";
    resetBtn.classList.add("confirming");
    clearTimeout(resetArmTimeout);
    resetArmTimeout = setTimeout(disarmReset, 3000);
  }

  function disarmReset() {
    resetArmed = false;
    resetBtn.textContent = "Zurücksetzen";
    resetBtn.classList.remove("confirming");
    clearTimeout(resetArmTimeout);
  }

  function performReset() {
    tree = freshTree();
    eventHistory = [];
    segments = Escalation.buildSegments();
    rotation = 0;
    isSpinning = false;
    wheelEl.classList.remove("spinning", "dragging");
    wheelEl.style.transform = "rotate(0deg)";
    saveTree();
    saveHistory();
    renderWheel();
    renderOrgTree();
    renderHistory();
    wheelHint.hidden = false;
    disarmReset();
  }

  resetBtn.addEventListener("click", () => {
    if (resetArmed) {
      performReset();
    } else {
      armReset();
    }
  });

  // ---------------- Init ----------------

  renderWheel();
  renderLegend();
  renderOrgTree();
  renderHistory();
})();
