/* Cue Sheet — production-specific cue table with shared production selection. */
(async function () {
  const TYPES = ["All", "Lighting", "Sound", "Props", "Actor"];
  let production = null, cues = [], activeType = "All";
  const filters = document.getElementById("filters"), rows = document.getElementById("cue-rows");
  await StageSyncAPI.mountProductionSelector(loadProduction);
  await loadProduction(StageSyncAPI.getSelectedProductionId());
  async function loadProduction(id) {
    const list = await StageSyncAPI.getProductions();
    production = list.find((p) => p.id === id) || await StageSyncAPI.getSelectedProduction();
    if (!production) { document.getElementById("cue-title").textContent = "No productions yet"; rows.innerHTML = '<tr><td colspan="6">Create a production in Production Studio first.</td></tr>'; return; }
    cues = await StageSyncAPI.getCues(production.id);
    document.getElementById("cue-title").textContent = production.title;
    document.getElementById("cue-subtitle").textContent = cues.length + " cues across lighting, sound, props and actors, listed in script order.";
    activeType = "All"; renderFilters(); renderRows();
  }
  function renderFilters() {
    filters.innerHTML = TYPES.map((type) => { const count = type === "All" ? cues.length : cues.filter((c) => c.type === type).length;
      return '<button type="button" role="tab" class="filter' + (type === activeType ? ' is-active' : '') + '" data-type="' + type + '" aria-selected="' + (type === activeType) + '">' + type + '<small>' + count + '</small></button>'; }).join("");
  }
  function renderRows() {
    const sceneInfo = {};
    (production.acts || []).forEach((act) => (act.scenes || []).forEach((scene) => { sceneInfo[scene.id] = { act: act.title, scene: scene.title }; }));
    const visible = cues.filter((c) => activeType === "All" || c.type === activeType);
    if (!visible.length) { rows.innerHTML = '<tr><td colspan="6">' + UI.emptyState("No cues of this type in this production.") + '</td></tr>'; return; }
    let currentAct = "", html = "";
    visible.forEach((cue) => { const info = sceneInfo[cue.sceneId] || { act: "Unassigned", scene: "" };
      if (info.act !== currentAct) { currentAct = info.act; html += '<tr class="table__group"><td colspan="6">' + UI.esc(currentAct) + '</td></tr>'; }
      html += '<tr><td class="cue-id">' + UI.esc(cue.id) + '</td><td>' + UI.typeTag(cue.type) + '</td><td class="muted">' + UI.esc(info.scene) + '</td><td><div class="cue-title">' + UI.esc(cue.title) + '</div><div class="cue-detail">' + UI.esc(cue.detail || "") + '</div></td><td>' + UI.esc(cue.trigger || "") + '</td><td class="muted">' + ((cue.requires || []).length ? UI.esc(cue.requires.join(", ")) : "—") + '</td></tr>';
    }); rows.innerHTML = html;
  }
  filters.addEventListener("click", (event) => { const button = event.target.closest("button[data-type]"); if (!button) return; activeType = button.dataset.type; renderFilters(); renderRows(); });
})();
