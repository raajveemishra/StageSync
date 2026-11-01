/* Performance Console — selected production is passed to the Python FA. */
(async function () {
  const goBtn = document.getElementById("btn-go"), holdBtn = document.getElementById("btn-hold"), resumeBtn = document.getElementById("btn-resume"), resetBtn = document.getElementById("btn-reset");
  let production = null, snapshot = null, cues = [], log = [];

  const STATUS_LABELS = { standby: "Standing by", running: "Running", held: "Held", complete: "Show complete" };
  async function command(name) {
    if (!production) return;
    try { const result = await StageSyncAPI.performanceCommand(production.id, name); snapshot = result.snapshot;
      log.unshift({ time: new Date().toLocaleTimeString("en-GB"), action: name, cue: result.cue ? result.cue.id + " · " + result.cue.title : result.message }); render();
    } catch (error) { snapshot = await StageSyncAPI.getPerformanceState(production.id); log.unshift({ time: new Date().toLocaleTimeString("en-GB"), action: name + " · REJECTED", cue: error.message }); render(); }
  }

  await StageSyncAPI.mountProductionSelector(loadProduction);
  await loadProduction(StageSyncAPI.getSelectedProductionId());
  async function loadProduction(id) {
    const list = await StageSyncAPI.getProductions(); production = list.find((p) => p.id === id) || await StageSyncAPI.getSelectedProduction();
    if (!production) { document.getElementById("console-title").textContent = "No production selected"; return; }
    document.getElementById("console-title").textContent = production.title;
    cues = await StageSyncAPI.getCues(production.id); snapshot = await StageSyncAPI.getPerformanceState(production.id); log = []; render();
  }

  function render() {
    if (!snapshot) return; const status = snapshot.status;
    document.getElementById("status").textContent = STATUS_LABELS[status] || status;
    document.getElementById("status").className = "status" + (status === "running" ? " status--live" : "");
    document.getElementById("position").textContent = snapshot.position + " of " + snapshot.total_cues + " cues called";
    const current = snapshot.current_cue;
    document.getElementById("now").innerHTML = current ? '<div class="now"><p class="eyebrow">Now</p><div class="now__id">' + UI.esc(current.id) + '</div><div class="now__title">' + UI.esc(current.title || "") + '</div><p class="now__detail">' + UI.esc(current.detail || "") + '</p></div>' : '<div class="now now--idle"><p class="eyebrow">Now</p><div class="now__id">Awaiting the first cue</div></div>';
    const next = snapshot.next_cue; document.getElementById("next").innerHTML = next ? '<div class="next__cue"><strong>' + UI.esc(next.id) + '</strong><span>' + UI.esc(next.title || "") + '</span></div>' : '<p class="muted">No further cues.</p>';
    document.getElementById("stack").innerHTML = cues.map((cue, i) => '<li class="' + (i < snapshot.position ? 'is-done' : i === snapshot.position ? 'is-next' : '') + '"><span>' + UI.esc(cue.id) + '</span><span>' + UI.esc(cue.title) + '</span></li>').join("");
    document.getElementById("log").innerHTML = log.length ? log.map((entry) => '<li><span>' + UI.esc(entry.time) + '</span><span class="log__action">' + UI.esc(entry.action) + '</span><span>' + UI.esc(entry.cue) + '</span></li>').join("") : '<li>No actions yet.</li>';
    goBtn.disabled = status === "held" || status === "complete"; holdBtn.disabled = status !== "running"; resumeBtn.disabled = status !== "held";
  }
  goBtn.addEventListener("click", () => command("GO")); holdBtn.addEventListener("click", () => command("HOLD")); resumeBtn.addEventListener("click", () => command("RESUME"));
  resetBtn.addEventListener("click", async () => { await command("RESET"); log = []; render(); });
})();
