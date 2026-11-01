/* ==========================================================
   StageSync — components.js
   Shared interface pieces: navigation, footer and small helpers.
   ========================================================== */

const UI = (() => {
  const NAV_ITEMS = [
    { key: "dashboard", label: "Dashboard", href: "dashboard.html" },
    { key: "studio",    label: "Studio",    href: "production-studio.html" },
    { key: "cues",      label: "Cue Sheet", href: "cue-sheet.html" },
    { key: "console",   label: "Console",   href: "performance-console.html" },
    { key: "sandbox",   label: "Sandbox",   href: "rehearsal-sandbox.html" },
    { key: "automata",  label: "Automata Lab", href: "automata-visualiser.html" },
  ];

  function esc(value) {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return String(value == null ? "" : value).replace(/[&<>"']/g, (c) => map[c]);
  }

  function toDate(iso) { return new Date(iso + "T00:00:00"); }

  function formatDate(iso) {
    if (!iso) return "Date to be set";
    return toDate(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  }

  function dateParts(iso) {
    const d = toDate(iso);
    return { day: d.getDate(), month: d.toLocaleDateString("en-GB", { month: "short" }) };
  }

  function daysUntil(iso) {
    if (!iso) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((toDate(iso) - today) / 86400000);
  }

  function typeTag(type) {
    return '<span class="tag tag--' + esc(type.toLowerCase()) + '">' + esc(type) + "</span>";
  }

  function statusPill(status) {
    const live = status === "In rehearsal" ? " status--live" : "";
    return '<span class="status' + live + '">' + esc(status) + "</span>";
  }

  function emptyState(message) {
    return '<p class="empty">' + esc(message) + "</p>";
  }

  function navHtml(active) {
    const links = NAV_ITEMS.map((item) => {
      const current = item.key === active;
      return '<a class="nav__link' + (current ? " is-active" : "") + '" href="' + item.href + '"' +
             (current ? ' aria-current="page"' : "") + ">" + item.label + "</a>";
    }).join("");

    return '<header class="nav"><div class="container nav__inner">' +
           '<a class="nav__brand" href="index.html">Stage<span>Sync</span></a>' +
           '<nav class="nav__links" aria-label="Main">' + links + "</nav>" +
           "</div></header>";
  }

  function footerHtml() {
    return '<footer class="footer"><div class="container footer__inner">' +
           "<span>StageSync &mdash; where the show meets the system</span>" +
           "<span>Clear cues. Steady hands. Curtain up.</span></div></footer>";
  }

  function mount() {
    const page = document.body.dataset.page;
    const nav = document.getElementById("site-nav");
    const footer = document.getElementById("site-footer");
    if (nav) nav.innerHTML = navHtml(page);
    if (footer) footer.innerHTML = footerHtml();
  }

  mount();

  return { esc, formatDate, dateParts, daysUntil, typeTag, statusPill, emptyState };
})();
