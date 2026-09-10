// Betriebsrat – App-Logik: Rad-Interaktion (Wisch/Swipe), Organigramm-Rendering
// mit FLIP-Animation für versetzte Personen, State-Persistenz.

(() => {
  const STORAGE_KEY = "betriebsrat_org_v2";

  const wheelWrap = document.getElementById("wheelWrap");
  const wheelEl = document.getElementById("wheel");
  const wheelHint = document.getElementById("wheelHint");
  const legendEl = document.getElementById("legend");
  const orgChartEl = document.getElementById("orgChart");
  const resetBtn = document.getElementById("resetBtn");
  const eventBanner = document.getElementById("eventBanner");
  const eventTier = document.getElementById("eventTier");
  const eventText = document.getElementById("eventText");

  let tree = loadTree() || freshTree();
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

  // ---------------- Rad ----------------

  function renderWheel() {
    const n = segments.length;
    const slice = 360 / n;
    const stops = segments
      .map((seg, i) => `${seg.color} ${i * slice}deg ${(i + 1) * slice}deg`)
      .join(", ");
    wheelEl.style.background = `conic-gradient(${stops})`;

    wheelEl.querySelectorAll(".wheel-segment-label").forEach((el) => el.remove());
    const radiusPercent = 32; // Abstand vom Mittelpunkt, in % der Rad-Breite/Höhe
    segments.forEach((seg, i) => {
      const angle = i * slice + slice / 2;
      const rad = (angle * Math.PI) / 180;
      const x = Math.sin(rad) * radiusPercent;
      const y = -Math.cos(rad) * radiusPercent;
      const readableAngle = angle > 90 && angle < 270 ? angle + 180 : angle;

      const label = document.createElement("span");
      label.className = "wheel-segment-label";
      label.style.color = seg.textColor || "#ffffff";
      label.style.left = `calc(50% + ${x}%)`;
      label.style.top = `calc(50% + ${y}%)`;
      label.style.transform = `translate(-50%, -50%) rotate(${readableAngle}deg)`;
      label.innerHTML = `<strong>${seg.level}</strong><span>${seg.name}</span>`;
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
  let history = [];

  wheelWrap.addEventListener("pointerdown", (e) => {
    if (isSpinning) return;
    wheelHint.hidden = true;
    dragging = true;
    wheelEl.classList.add("dragging");
    wheelEl.classList.remove("spinning");
    wheelWrap.setPointerCapture(e.pointerId);
    const rect = wheelEl.getBoundingClientRect();
    lastAngle = angleFromCenter(e.clientX, e.clientY, rect);
    history = [{ t: performance.now(), a: lastAngle }];
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
    history.push({ t: now, a: rotation });
    if (history.length > 6) history.shift();
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    wheelEl.classList.remove("dragging");

    let velocity = 0;
    if (history.length >= 2) {
      const first = history[0];
      const last = history[history.length - 1];
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
    showEvent(tier, result.text);
    flashUnits(result.changedUnitIds || []);
    flipMembers(result.changedMemberIds || [], oldRects);
  }

  function showEvent(tier, text) {
    eventBanner.hidden = false;
    eventTier.textContent = `Stufe ${tier.level} · ${tier.name}`;
    eventText.textContent = text;
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
    orgChartEl.appendChild(renderChildren(tree.children));
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
      const members = document.createElement("div");
      members.className = "org-members";
      unit.members.forEach((member) => {
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
    segments = Escalation.buildSegments();
    rotation = 0;
    isSpinning = false;
    wheelEl.classList.remove("spinning", "dragging");
    wheelEl.style.transform = "rotate(0deg)";
    saveTree();
    renderWheel();
    renderOrgTree();
    eventBanner.hidden = true;
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
})();
