/* Rehearsal Sandbox — validates cue prerequisites/order for the selected production. */
(async function () {
  let production = null, cues = [];
  const sequenceEl = document.getElementById("sequence"), presetEl = document.getElementById("preset"), resultEl = document.getElementById("result");
  await StageSyncAPI.mountProductionSelector(loadProduction);
  await loadProduction(StageSyncAPI.getSelectedProductionId());
  async function loadProduction(id) {
    const list = await StageSyncAPI.getProductions(); production = list.find((p) => p.id === id) || await StageSyncAPI.getSelectedProduction();
    cues = production ? await StageSyncAPI.getCues(production.id) : [];
    sequenceEl.value = ""; buildPresets(); buildChips(); showPlaceholder();
  }
  function buildPresets() {
    const validPrefix = []; const called = new Set();
    for (const cue of cues) { if ((cue.requires || []).every((r) => called.has(r))) { validPrefix.push(cue.id); called.add(cue.id); } else break; }
    const opening = validPrefix.slice(0, Math.min(7, validPrefix.length)).join(", ");
    const invalid = cues.length > 1 ? cues[0].id + ", " + cues[cues.length - 1].id + ", " + cues[0].id : "";
    const presets = [{ label: "Choose a preset…", value: "" }];
    if (opening) presets.push({ label: "Opening sequence (valid)", value: opening });
    if (cues.length > 1) presets.push({ label: "Repeated cue (invalid)", value: cues[0].id + ", " + cues[0].id });
    if (invalid) presets.push({ label: "Repeated / out of order (invalid)", value: invalid });
    presetEl.innerHTML = presets.map((p) => '<option value="' + UI.esc(p.value) + '">' + UI.esc(p.label) + '</option>').join("");
  }
  function buildChips() { document.getElementById("chips").innerHTML = cues.map((cue) => '<button type="button" class="chip" data-id="' + UI.esc(cue.id) + '" title="' + UI.esc(cue.title) + '">' + UI.esc(cue.id) + '</button>').join(""); }
  function parseSequence(text) { const known = cues.map((c) => c.id).sort((a,b) => b.length-a.length); const tokens = text.toUpperCase().split(/[,,\s]+/).filter(Boolean); return tokens; }
  function validateSequence(ids) {
    const called = []; let lastIndex = -1;
    return ids.map((id) => { const position = cues.findIndex((c) => c.id === id);
      if (position === -1) return { id, ok: false, message: "This cue is not on this production's cue sheet." };
      if (called.includes(id)) return { id, ok: false, message: "Already called earlier in this sequence." };
      const missing = (cues[position].requires || []).filter((req) => !called.includes(req));
      if (missing.length) return { id, ok: false, message: "Needs " + missing.join(", ") + " to be called first." };
      if (position < lastIndex) return { id, ok: false, message: "Comes earlier in the script than the cue before it." };
      called.push(id); lastIndex = position; return { id, ok: true, message: cues[position].type + " · " + cues[position].title };
    });
  }
  function showPlaceholder() { resultEl.innerHTML = UI.emptyState(production ? "Choose a preset or build a sequence, then test it." : "Create a production and add cues first."); }
  function showResult(steps) {
    const problems = steps.filter((s) => !s.ok).length, valid = problems === 0;
    const verdict = '<div class="verdict ' + (valid ? 'verdict--valid' : 'verdict--invalid') + '"><span class="verdict__title">' + (valid ? 'Valid sequence' : 'Invalid sequence') + '</span><p>' + (valid ? 'All ' + steps.length + ' cues pass. This sequence is safe to run.' : problems + (problems === 1 ? ' cue needs' : ' cues need') + ' attention before this can run.') + '</p></div>';
    const list = '<ol class="steps">' + steps.map((s) => '<li class="step ' + (s.ok ? 'step--ok' : 'step--bad') + '"><span class="step__mark" aria-label="' + (s.ok ? 'Valid' : 'Invalid') + '">' + (s.ok ? '✓' : '✕') + '</span><span class="step__id">' + UI.esc(s.id) + '</span><span class="step__msg">' + UI.esc(s.message) + '</span></li>').join("") + '</ol>';
    resultEl.innerHTML = verdict + list;
  }
  document.getElementById("sandbox-form").addEventListener("submit", (event) => { event.preventDefault(); const ids = parseSequence(sequenceEl.value); if (!ids.length) { resultEl.innerHTML = UI.emptyState("Enter at least one cue, such as LX1."); return; } showResult(validateSequence(ids)); });
  presetEl.addEventListener("change", () => { sequenceEl.value = presetEl.value; if (presetEl.value) showResult(validateSequence(parseSequence(presetEl.value))); else showPlaceholder(); });
  document.getElementById("chips").addEventListener("click", (event) => { const chip = event.target.closest("button[data-id]"); if (!chip) return; const current = sequenceEl.value.trim().replace(/,\s*$/, ""); sequenceEl.value = current ? current + ", " + chip.dataset.id : chip.dataset.id; presetEl.value = ""; });
  document.getElementById("clear").addEventListener("click", () => { sequenceEl.value = ""; presetEl.value = ""; showPlaceholder(); });
})();
