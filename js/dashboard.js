/* Dashboard — overview of productions and upcoming rehearsals */

(async function () {
  const [productions, rehearsals, active] = await Promise.all([
    StageSyncAPI.getProductions(),
    StageSyncAPI.getRehearsals(),
    StageSyncAPI.getActiveProduction(),
  ]);
  const cues = await StageSyncAPI.getCues(active.id);

  renderStats();
  renderProductions();
  renderRehearsals();

  function renderStats() {
    const days = UI.daysUntil(active.opening);
    const openingValue = days === null ? "—" : days > 0 ? days : days === 0 ? "Tonight" : "Open";

    const stats = [
      { value: productions.length, label: "Productions" },
      { value: rehearsals.length, label: "Upcoming rehearsals" },
      { value: cues.length, label: "Cues in " + active.title },
      { value: openingValue, label: days !== null && days > 0 ? "Days to opening" : "Opening night" },
    ];

    document.getElementById("stats").innerHTML = stats.map((stat) =>
      '<div class="stat"><div class="stat__value">' + UI.esc(stat.value) + "</div>" +
      '<div class="stat__label">' + UI.esc(stat.label) + "</div></div>"
    ).join("");
  }

  function renderProductions() {
    const html = productions.map((p) => {
      const byline = [p.playwright, p.venue].filter(Boolean).join(" · ");
      const opens = p.opening ? "Opens " + UI.formatDate(p.opening) : "Opening to be set";
      return '<a class="row" href="production-studio.html?id=' + encodeURIComponent(p.id) + '">' +
        "<div><h3>" + UI.esc(p.title) + '</h3><p class="muted">' + UI.esc(byline) + "</p></div>" +
        '<div class="row__meta">' + UI.statusPill(p.status) +
        '<span class="muted">' + UI.esc(opens) + "</span></div></a>";
    }).join("");

    document.getElementById("productions").innerHTML = html || UI.emptyState("No productions yet.");
  }

  function renderRehearsals() {
    const titleById = {};
    productions.forEach((p) => { titleById[p.id] = p.title; });

    const html = rehearsals.map((r) => {
      const parts = UI.dateParts(r.date);
      return '<div class="row row--rehearsal">' +
        '<div class="date"><div class="date__day">' + parts.day + "</div>" +
        '<div class="date__month">' + UI.esc(parts.month) + "</div></div>" +
        '<div class="row__body"><div class="row__title">' + UI.esc(r.title) + "</div>" +
        '<p class="muted">' + UI.esc(r.start + " – " + r.end + " · " + r.venue) + "</p></div>" +
        '<span class="muted" style="font-size:.8rem;text-align:right;">' + UI.esc(titleById[r.productionId] || "") + "</span>" +
        "</div>";
    }).join("");

    document.getElementById("rehearsals").innerHTML = html || UI.emptyState("No rehearsals scheduled.");
  }
})();
