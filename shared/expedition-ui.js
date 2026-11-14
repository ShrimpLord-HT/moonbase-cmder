// One controller keeps the 2D and 3D expedition experiences in step.
const ExpeditionUI = (() => {
  const $ = id => document.getElementById(id);
  function journalHTML(state) {
    return `<article class="discovery-journal">
      <p class="eyebrow">FIELD JOURNAL / MISSION 01</p>
      <h2>A clue in the cold.</h2><p class="journal-status">${state.reported ? "EXPEDITION COMPLETE · YOUR FIRST LUNAR FINDING" : "EXPEDITION IN PROGRESS"}</p>
      <figure><img src="launch/assets/mission-crater.jpg" alt="Reference mosaic of Shackleton Crater from LROC and ShadowCam" width="985" height="985" loading="lazy"><figcaption>Reference image: Shackleton Crater · NASA / KARI / ASU. Our expedition takes place in an imagined training outpost.</figcaption></figure>
      <div class="journal-findings">${Object.values(Mission1.sites).map(site => `<section><h3>${site.icon} ${site.name}</h3><p>${state.observations.includes(site.id) ? site.reading : "Waiting for your observation."}</p>${state.observations.includes(site.id) ? `<p class="science-fact">${site.fact}</p><a href="${site.source}" target="_blank" rel="noopener noreferrer">Explore the real science at NASA ↗</a>` : ""}</section>`).join("")}</div>
      <section class="journal-report"><h3>Your report to Earth</h3><p>${state.reported ? Mission1.report : "Collect both scans, then send your finding from Communications."}</p></section>
      <p class="training-note">Training scanner · simulated readings. These observations belong to our fictional expedition.</p>
    </article>`;
  }
  function renderJournal(container, state) { container.innerHTML = journalHTML(state); }
  if (!document.body.hasAttribute("data-expedition")) return { renderJournal };

  const fresh = new URLSearchParams(location.search).has("new");
  let run = fresh ? surfaceRun.begin() : surfaceRun.load() || surfaceRun.begin();
  if (fresh) history.replaceState(null, "", location.pathname);
  let state = run.state;
  const radio = document.createElement("dialog");
  radio.id = "pip-radio";
  radio.className = "pip-dialog";
  radio.setAttribute("aria-labelledby", "pip-title");
  radio.innerHTML = `<div class="pip-dialog-head"><span class="pip-avatar" aria-hidden="true"><i></i><i></i></span><div><small class="eyebrow">PIP / YOUR EXPLORATION BUDDY</small><h2 id="pip-title"></h2></div><button class="pip-x" aria-label="Close Pip radio" type="button">×</button></div>
    <p id="pip-message"></p><div id="pip-reading" class="scanner-reading" hidden></div><p id="pip-fact" class="science-fact" hidden></p><a id="pip-source" target="_blank" rel="noopener noreferrer" hidden>Explore the real science at NASA ↗</a>
    <div id="pip-journal" hidden></div><div class="pip-dialog-actions"><button type="button" id="pip-send" class="primary" hidden>Send report to Earth ↗</button><button type="button" id="pip-continue">Keep exploring</button></div>`;
  document.body.append(radio);
  let previousFocus = null;
  function showRadio(title, message, { site, report = false, journal = false } = {}) {
    $("pip-title").textContent = title;
    $("pip-message").textContent = message;
    $("pip-reading").hidden = !site;
    $("pip-fact").hidden = !site;
    $("pip-source").hidden = !site;
    if (site) {
      $("pip-reading").textContent = "SIMULATED SCAN · " + site.reading;
      $("pip-fact").textContent = site.fact;
      $("pip-source").href = site.source;
    }
    $("pip-send").hidden = !report;
    $("pip-send").disabled = state.observations.length !== 2 || state.reported;
    $("pip-journal").hidden = !journal;
    if (journal) renderJournal($("pip-journal"), state);
    $("pip-continue").textContent = journal ? "Close journal" : "Keep exploring";
    if (!radio.open) {
      previousFocus = document.activeElement;
      document.dispatchEvent(new CustomEvent("expeditiondialog", { detail: { open: true } }));
      radio.showModal();
    }
    radio.scrollTop = 0;
  }
  radio.querySelector(".pip-x").onclick = $("pip-continue").onclick = () => radio.close();
  radio.addEventListener("close", () => {
    document.dispatchEvent(new CustomEvent("expeditiondialog", { detail: { open: false } }));
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  });
  function render() {
    document.querySelectorAll("[data-expedition-progress]").forEach(container => {
      const count = state.observations.length;
      container.innerHTML = ["Investigate", "Compare", "Report"].map((label, index) => {
        const done = index < count || (index === 2 && state.reported);
        const current = !state.reported && index === count;
        return `<span class="expedition-step ${done ? "done" : current ? "current" : ""}"${current ? ' aria-current="step"' : ""}><b>${done ? "✓" : "0" + (index + 1)}</b>${label}</span>`;
      }).join("");
    });
    if ($("objective")) $("objective").textContent = Mission1.objective(state);
    if ($("observation-count")) $("observation-count").textContent = `${state.observations.length} / 2 observations`;
    document.querySelectorAll("[data-inspect]").forEach(button => {
      button.classList.toggle("collected", state.observations.includes(button.dataset.inspect));
      button.classList.toggle("next-stop", button.dataset.inspect === Mission1.next(state).id && !state.reported);
    });
    document.querySelectorAll("[data-observation]").forEach(container => {
      const site = Mission1.sites[container.dataset.observation];
      const collected = state.observations.includes(site.id);
      container.classList.toggle("collected", collected);
      container.querySelector("[data-reading]").textContent = collected ? site.reading : "Ready for your first scan";
      container.querySelector("[data-recorded]").textContent = collected ? "✓ Recorded in your journal" : "Not yet explored";
    });
    document.dispatchEvent(new CustomEvent("expeditionchange", { detail: { state } }));
  }
  function update(nextState) {
    state = nextState;
    surfaceRun.update(state);
    render();
  }
  function welcome() {
    if (state.welcomeSeen) return;
    update({ ...state, welcomeSeen: true });
    showRadio("Welcome to the Moon, Commander!", "I'm Pip, your exploration buddy. There's a curious signal near that crater—let's find out what it could be!");
  }
  function hint() {
    const site = Mission1.next(state);
    const message = state.reported ? "Your finding has reached Earth! You can read your journal or try another expedition." :
      site.id === "communications" ? "We have both readings! Follow the blue Communications sign and send our possible-ice finding to Earth." :
      `Follow the amber marker to the ${site.name.toLowerCase()}. ${site.id === "shadow" ? "Scan the dark patch inside the crater." : "Scan the bright ground beside the crater to collect a comparison."}`;
    showRadio("A little nudge from Pip", message);
    document.dispatchEvent(new CustomEvent("expeditionhint", { detail: { site } }));
  }
  function inspect(id) {
    const site = Mission1.sites[id];
    if (site) {
      const already = state.observations.includes(id);
      update(Mission1.observe(state, id));
      const message = state.observations.length === 2 ? "We found different light patterns in the two samples! Our shaded patch is a promising place to investigate for possible water ice." :
        id === "sunlit" ? "A rock-like light pattern! Let's scan the shaded patch too, so we have something to compare." : site.response;
      showRadio(already ? "Let's look at that finding again" : "Observation saved!", message, { site });
    } else if (id === "communications") {
      const ready = state.observations.length === 2;
      showRadio("A message for Earth", state.reported ? "Your report is already home!" : ready ? Mission1.report : "Let's finish both scans first. Then we can tell Mission Control what we observed.", { report: true });
    } else if (id === "habitat") {
      showRadio("Your outpost has you covered", "Power and life support are steady for this training expedition. Take your time—there's a whole new world to explore!");
    } else if (id === "pip") hint();
  }
  $("pip-send").onclick = () => {
    const nextState = Mission1.submit(state);
    if (!nextState.reported || state.reported) return;
    update(nextState);
    surfaceRun.saveJournal(state);
    if (surfaceRun.sessionSaved || surfaceRun.journalSaved) {
      location.assign("./index.html?completed=1#missions");
    } else {
      showRadio("Your first lunar discovery!", "You gathered two readings and shared a promising finding. Saving is unavailable in this browser, so your journal is here to read before you leave.", { journal: true });
    }
  };
  document.querySelectorAll("[data-inspect]").forEach(button => button.addEventListener("click", () => inspect(button.dataset.inspect)));
  document.querySelectorAll("[data-hint]").forEach(button => button.addEventListener("click", hint));
  document.querySelectorAll("[data-open-journal]").forEach(button => button.addEventListener("click", () => showRadio("Your discovery journal", "Every observation is a step into the unknown. Here's what you've found so far.", { journal: true })));
  render();
  if (document.body.dataset.expedition === "2d") welcome();
  addEventListener("pageshow", event => {
    if (event.persisted) { state = surfaceRun.load()?.state || state; render(); }
  });
  return { get state() { return state; }, welcome, inspect, hint, renderJournal };
})();
