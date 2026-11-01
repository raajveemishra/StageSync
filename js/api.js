/* StageSync API adapter: Flask is the source of truth; selection is shared across pages. */
const StageSyncAPI = (() => {
  const API_BASE = "https://stagesync-backend.onrender.com/api";
  const SELECTION_KEY = "stagesync.selectedProductionId";

  async function request(path, options = {}) {
    const response = await fetch(API_BASE + path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "Request failed: " + response.status);
    return payload;
  }
  function post(path, body) {
    return request(path, { method: "POST", body: JSON.stringify(body) });
  }
  function getSelectedProductionId() {
    try { return localStorage.getItem(SELECTION_KEY); } catch (_) { return null; }
  }
  function setSelectedProductionId(id) {
    try { if (id) localStorage.setItem(SELECTION_KEY, id); else localStorage.removeItem(SELECTION_KEY); } catch (_) {}
    window.dispatchEvent(new CustomEvent("stagesync:productionchange", { detail: { productionId: id } }));
  }
  async function getSelectedProduction() {
    const list = await request("/productions");
    const savedId = getSelectedProductionId();
    const selected = list.find((p) => p.id === savedId) || list.find((p) => p.active) || list[0] || null;
    if (selected && selected.id !== savedId) {
      try { localStorage.setItem(SELECTION_KEY, selected.id); } catch (_) {}
    }
    return selected;
  }
  async function mountProductionSelector(onChange) {
    const select = document.getElementById("production-select");
    if (!select) return null;
    const list = await request("/productions");
    const savedId = getSelectedProductionId();
    const selected = list.find((p) => p.id === savedId) || list.find((p) => p.active) || list[0] || null;
    select.innerHTML = list.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.title)}</option>`).join("");
    if (selected) {
      select.value = selected.id;
      if (selected.id !== savedId) { try { localStorage.setItem(SELECTION_KEY, selected.id); } catch (_) {} }
    }
    select.disabled = list.length === 0;
    select.addEventListener("change", async () => {
      setSelectedProductionId(select.value);
      if (onChange) await onChange(select.value);
    });
    return selected;
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>\"]/g, (ch) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
  }

  return {
    getProductions: () => request("/productions"),
    getActiveProduction: () => getSelectedProduction(),
    getSelectedProductionId, setSelectedProductionId, getSelectedProduction, mountProductionSelector,
    getRehearsals: () => request("/rehearsals"),
    getCues: (id) => request("/productions/" + encodeURIComponent(id) + "/cues"),
    createProduction: (title) => post("/productions", { title }),
    addAct: (id, title) => post("/productions/" + encodeURIComponent(id) + "/acts", { title }),
    addScene: (productionId, actId, title) => post("/acts/" + encodeURIComponent(actId) + "/scenes", { title }),
    addCueGroup: (productionId, sceneId, name) => post("/scenes/" + encodeURIComponent(sceneId) + "/cue-groups", { name }),
    addCue: (sceneId, groupId, cue) => post("/scenes/" + encodeURIComponent(sceneId) + "/cue-groups/" + encodeURIComponent(groupId) + "/cues", cue),
    validateStructure: (id) => request("/productions/" + encodeURIComponent(id) + "/structure/validate"),
    getPerformanceState: (id) => request("/productions/" + encodeURIComponent(id) + "/performance"),
    performanceCommand: (id, command) => post("/productions/" + encodeURIComponent(id) + "/performance/command", { command }),

    runFATrace: (id, commands) => post("/productions/" + encodeURIComponent(id) + "/automata/fa-trace", { commands }),
    runPDATrace: (symbols) => post("/automata/pda-trace", { symbols }),
  };
})();
