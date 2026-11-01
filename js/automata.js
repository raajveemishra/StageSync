/* StageSync Automata Visualiser — isolated DFA and PDA traces. */
(() => {
  const $ = (id) => document.getElementById(id);
  const splitInput = (value) => value.trim() ? value.trim().split(/[,\s]+/).filter(Boolean) : [];
  const esc = (value) => UI.esc(value);

  document.querySelectorAll(".automata-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".automata-tab").forEach((item) => item.classList.toggle("is-active", item === tab));
      document.querySelectorAll(".automata-panel").forEach((panel) => panel.classList.toggle("is-active", panel.id === "panel-" + tab.dataset.tab));
    });
  });

  async function loadProductions() {
    const select = $("fa-production");
    try {
      const productions = await StageSyncAPI.getProductions();
      select.innerHTML = productions.map((p) => `<option value="${esc(p.id)}">${esc(p.title)}</option>`).join("");
      if (!productions.length) select.innerHTML = '<option value="">No productions available</option>';
    } catch (error) {
      select.innerHTML = '<option value="">Could not load productions</option>';
      $("fa-verdict").innerHTML = `<div class="automata-result__title">API unavailable</div><p>${esc(error.message)}</p>`;
    }
  }

  function showVerdict(target, accepted, title, message) {
    target.className = "automata-result " + (accepted ? "is-accepted" : "is-rejected");
    target.innerHTML = `<div class="automata-result__title">${accepted ? "✓ " : "× "}${esc(title)}</div><p>${esc(message)}</p>`;
  }

  $("fa-run").addEventListener("click", async () => {
    const commands = splitInput($("fa-input").value);
    if (!commands.length) return showVerdict($("fa-verdict"), false, "No input", "Enter at least one command.");
    const productionId = $("fa-production").value;
    if (!productionId) return showVerdict($("fa-verdict"), false, "No production", "Create a production in the Studio first.");
    $("fa-run").disabled = true;
    try {
      const result = await StageSyncAPI.runFATrace(productionId, commands);
      const accepted = result.trace.every((step) => step.accepted);
      const last = result.trace[result.trace.length - 1];
      showVerdict($("fa-verdict"), accepted, accepted ? "All commands accepted" : "Sequence contains rejected input",
        `${result.trace.filter((s) => s.accepted).length} of ${result.trace.length} commands accepted. Final state: ${result.final_snapshot.state} · ${result.final_snapshot.status}.`);
      $("fa-states").innerHTML = `<div class="automata-state"><small>Start</small><strong>${esc(result.trace[0]?.before_state || "q0")}</strong></div><div class="automata-state"><small>Final</small><strong>${esc(result.final_snapshot.state)}</strong></div><div class="automata-state"><small>Progress</small><strong>${result.final_snapshot.position}/${result.total_cues}</strong></div>`;
      $("fa-trace").innerHTML = result.trace.map((step, i) => `<div class="automata-step"><span class="automata-step__mark ${step.accepted ? "is-accepted" : "is-rejected"}">${step.accepted ? "✓" : "×"}</span><span class="automata-step__token">${esc(step.command)}</span><div class="automata-step__detail"><strong>${esc(step.before_state)} → ${esc(step.after_state)}</strong><br>${esc(step.message)}${step.cue ? `<br>Emitted cue: ${esc(step.cue.id)} · ${esc(step.cue.title || "")}` : ""}</div></div>`).join("");
    } catch (error) {
      showVerdict($("fa-verdict"), false, "Could not run trace", error.message);
    } finally {
      $("fa-run").disabled = false;
    }
  });

  $("fa-clear").addEventListener("click", () => {
    $("fa-input").value = "";
    $("fa-states").innerHTML = '<div class="automata-state"><small>Initial state</small><strong>q0</strong></div>';
    $("fa-trace").innerHTML = '<p class="automata-empty">Your DFA trace will appear here.</p>';
    $("fa-verdict").className = "automata-result";
    $("fa-verdict").innerHTML = '<div class="automata-result__title">Awaiting input</div><p>Run a command sequence to see each state transition.</p>';
  });

  $("pda-run").addEventListener("click", async () => {
    const symbols = splitInput($("pda-input").value);
    if (!symbols.length) return showVerdict($("pda-verdict"), false, "No input", "Enter at least one PDA symbol.");
    $("pda-run").disabled = true;
    try {
      const result = await StageSyncAPI.runPDATrace(symbols);
      showVerdict($("pda-verdict"), result.accepted, result.accepted ? "Structure accepted" : "Structure rejected", result.message);
      const finalStack = result.stack || ["$"];
      $("pda-stack").innerHTML = finalStack.map((token, i) => `<span class="stack-token ${i === 0 ? "is-bottom" : ""}">${esc(token)}</span>`).join("");
      $("pda-trace").innerHTML = result.steps.map((step) => `<div class="automata-step"><span class="automata-step__mark ${step.accepted ? "is-accepted" : "is-rejected"}">${step.accepted ? "✓" : "×"}</span><span class="automata-step__token">${esc(step.symbol)}</span><div class="automata-step__detail">${esc(step.message)}<br><strong>Stack:</strong> ${esc(step.stack.join(" → "))}</div></div>`).join("") || '<p class="automata-empty">No steps were generated.</p>';
    } catch (error) {
      showVerdict($("pda-verdict"), false, "Could not run trace", error.message);
    } finally {
      $("pda-run").disabled = false;
    }
  });

  $("pda-clear").addEventListener("click", () => {
    $("pda-input").value = "";
    $("pda-stack").innerHTML = '<span class="stack-token is-bottom">$</span>';
    $("pda-trace").innerHTML = '<p class="automata-empty">Your PDA trace will appear here.</p>';
    $("pda-verdict").className = "automata-result";
    $("pda-verdict").innerHTML = '<div class="automata-result__title">Awaiting input</div><p>Run a symbol sequence to watch the stack.</p>';
  });

  loadProductions();
})();
