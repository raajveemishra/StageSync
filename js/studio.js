/* Production Studio — organise productions and create cues inside cue groups. */
(async function () {
  const listEl = document.getElementById("production-list");
  const mainEl = document.getElementById("studio-main");
  let productions = [];
  let selectedId = new URLSearchParams(location.search).get("id") || StageSyncAPI.getSelectedProductionId();

  await load();
  await StageSyncAPI.mountProductionSelector(async (id) => { selectedId = id; await load(); });

  async function load() {
    productions = await StageSyncAPI.getProductions();
    if (!productions.some((p) => p.id === selectedId)) selectedId = productions[0]?.id || null;
    if (selectedId) StageSyncAPI.setSelectedProductionId(selectedId);
    const selector = document.getElementById("production-select");
    if (selector && selectedId) selector.value = selectedId;
    render();
  }
  function render() { renderList(); renderProduction(); updatePDAStatus(); }
  function renderList() {
    listEl.innerHTML = productions.map((p) =>
      '<button type="button" data-id="' + UI.esc(p.id) + '" class="' + (p.id === selectedId ? 'is-active' : '') + '">' + UI.esc(p.title) + '</button>'
    ).join("");
  }
  function renderProduction() {
    const p = productions.find((item) => item.id === selectedId);
    if (!p) { mainEl.innerHTML = UI.emptyState("Add your first production to begin."); return; }
    const meta = [p.playwright, p.venue, p.opening ? "Opens " + UI.formatDate(p.opening) : ""].filter(Boolean);
    mainEl.innerHTML = '<div class="studio__head"><p class="eyebrow">Production</p><h2>' + UI.esc(p.title) + '</h2>' +
      '<div class="studio__meta">' + UI.statusPill(p.status) + meta.map((m) => '<span>' + UI.esc(m) + '</span>').join("") + '</div></div>' +
      (p.acts.map(renderAct).join("") || UI.emptyState("No acts yet. Add the first one below.")) +
      '<div id="pda-validation" class="muted" style="margin-top:18px;font-size:.85rem;">Checking production structure…</div>' +
      '<form class="add-form studio__add-act" data-action="act" autocomplete="off"><input class="input" name="entry" placeholder="Add an act, e.g. Act V" aria-label="New act title"><button class="link-btn" type="submit">Add act</button></form>';
  }
  async function updatePDAStatus() {
    const el = document.getElementById("pda-validation"); if (!el || !selectedId) return;
    try { const result = await StageSyncAPI.validateStructure(selectedId); el.textContent = result.accepted ? "Structure validated by PDA · Properly nested" : "PDA rejected structure · " + result.message; el.style.color = result.accepted ? "#b9af9d" : "#cf7886"; }
    catch (error) { el.textContent = "PDA validation unavailable: " + error.message; }
  }
  function renderAct(act) {
    return '<div class="act"><div class="act__head"><h2>' + UI.esc(act.title) + '</h2><span class="muted">' + act.scenes.length + (act.scenes.length === 1 ? ' scene' : ' scenes') + '</span></div>' +
      act.scenes.map((scene, i) => renderScene(scene, i)).join("") +
      '<form class="add-form" data-action="scene" data-act-id="' + UI.esc(act.id) + '" autocomplete="off"><input class="input" name="entry" placeholder="Add a scene" aria-label="New scene title"><button class="link-btn" type="submit">Add scene</button></form></div>';
  }
  function renderScene(scene, index) {
    const groups = (scene.cueGroups || []).map((g) => {
      const cueIds = (g.cues || []).map((id) => '<span class="studio-cue-id">' + UI.esc(id) + '</span>').join(" ");
      return '<div class="group studio-group"><div class="studio-group__head"><span>' + UI.esc(g.name) + '</span><span>' + (g.cues || []).length + ((g.cues || []).length === 1 ? ' cue' : ' cues') + '</span></div>' +
        (cueIds ? '<div class="studio-group__cues">' + cueIds + '</div>' : '') +
        '<form class="studio-cue-form" data-action="cue" data-scene-id="' + UI.esc(scene.id) + '" data-group-id="' + UI.esc(g.id) + '">' +
        '<select class="input" name="type" aria-label="Cue type"><option>Lighting</option><option>Sound</option><option>Props</option><option>Actor</option></select>' +
        '<input class="input" name="title" placeholder="Cue title" required>' +
        '<input class="input" name="detail" placeholder="Description / details">' +
        '<input class="input" name="trigger" placeholder="Trigger">' +
        '<button class="link-btn" type="submit">Add cue</button></form></div>';
    }).join("");
    return '<div class="scene"><div class="scene__title"><span class="eyebrow">Scene ' + (index + 1) + '</span>' + UI.esc(scene.title) + '</div>' + groups +
      '<form class="add-form" data-action="group" data-scene-id="' + UI.esc(scene.id) + '" autocomplete="off"><input class="input" name="entry" placeholder="Add a cue group" aria-label="New cue group name"><button class="link-btn" type="submit">Add group</button></form></div>';
  }

  listEl.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-id]"); if (!button) return;
    selectedId = button.dataset.id; StageSyncAPI.setSelectedProductionId(selectedId);
    const selector = document.getElementById("production-select"); if (selector) selector.value = selectedId;
    await load();
  });
  document.getElementById("new-production").addEventListener("submit", async (event) => {
    event.preventDefault(); const input = event.target.elements.entry; const title = input.value.trim(); if (!title) return;
    const created = await StageSyncAPI.createProduction(title); selectedId = created.id; StageSyncAPI.setSelectedProductionId(selectedId); input.value = ""; await load();
  });
  mainEl.addEventListener("submit", async (event) => {
    const form = event.target.closest("form[data-action]"); if (!form) return;
    event.preventDefault(); const { action, actId, sceneId, groupId } = form.dataset;
    try {
      if (action === "act") { const value = form.elements.entry.value.trim(); if (value) await StageSyncAPI.addAct(selectedId, value); }
      if (action === "scene") { const value = form.elements.entry.value.trim(); if (value) await StageSyncAPI.addScene(selectedId, actId, value); }
      if (action === "group") { const value = form.elements.entry.value.trim(); if (value) await StageSyncAPI.addCueGroup(selectedId, sceneId, value); }
      if (action === "cue") {
        const title = form.elements.title.value.trim(); if (!title) return;
        await StageSyncAPI.addCue(sceneId, groupId, { type: form.elements.type.value, title, detail: form.elements.detail.value.trim(), trigger: form.elements.trigger.value.trim(), requires: [] });
      }
      await load();
    } catch (error) { alert(error.message); }
  });
})();
