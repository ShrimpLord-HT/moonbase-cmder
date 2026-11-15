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
    <p id="pip-message" aria-hidden="true"></p><p id="pip-accessible-message" class="sr-only" aria-live="polite"></p>
    <button type="button" id="pip-reveal" hidden>Show full text</button>
    <div id="scan-panel" hidden>
      <div id="scan-preview" tabindex="0" role="group" aria-label="Scanner aiming area. Use arrow keys or drag to center the target.">
        <span class="scan-crosshair" aria-hidden="true"></span><span id="scan-target" aria-hidden="true"></span><span class="scan-sweep" aria-hidden="true"></span>
      </div>
      <p id="scan-instruction" role="status"></p><progress id="scan-progress" max="1" value="0" aria-label="Scan progress"></progress>
      <button type="button" id="scan-start">Start scan</button>
    </div>
    <div id="evidence-review" hidden></div><div id="uplink" hidden><span aria-hidden="true">◉ · · · ◉</span><progress id="uplink-progress" max="1" value="0" aria-label="Transmission progress"></progress></div><div id="pip-reading" class="scanner-reading" hidden></div><p id="pip-fact" class="science-fact" hidden></p><a id="pip-source" target="_blank" rel="noopener noreferrer" hidden>Explore the real science at NASA ↗</a>
    <div id="pip-journal" hidden></div><div class="pip-dialog-actions"><button type="button" id="pip-send" class="primary" hidden>Send report to Earth ↗</button><button type="button" id="pip-continue">Keep exploring</button></div>`;
  document.body.append(radio);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let previousFocus = null, fullMessage = "", revealed = 0, animation = null;
  let scanSite = null, aim = { x: 45, y: -30 }, dragging = null, scanning = false;
  let continueAction = () => radio.close();
  function signal(name, detail) { document.dispatchEvent(new CustomEvent(name, { detail })); }
  function setMessage(message) {
    fullMessage = message;
    revealed = reducedMotion.matches ? message.length : 0;
    $("pip-message").textContent = reducedMotion.matches ? message : "";
    $("pip-accessible-message").textContent = message;
    $("pip-reveal").hidden = reducedMotion.matches;
  }
  function revealText() {
    revealed = fullMessage.length;
    $("pip-message").textContent = fullMessage;
    $("pip-reveal").hidden = true;
  }
  $("pip-reveal").onclick = revealText;
  reducedMotion.addEventListener("change", () => { if (reducedMotion.matches) revealText(); });
  // Pause dialogue and instrument progress while the tab is hidden.
  let lastTick = performance.now();
  setInterval(() => {
    const now = performance.now();
    const dt = Math.min(100, now - lastTick);
    lastTick = now;
    if (document.hidden || !radio.open) return;
    if (revealed < fullMessage.length) {
      revealed = Math.min(fullMessage.length, revealed + dt * 0.035);
      $("pip-message").textContent = fullMessage.slice(0, Math.floor(revealed));
      $("pip-reveal").hidden = revealed >= fullMessage.length;
    }
    if (animation) {
      animation.elapsed += dt;
      const progress = Math.min(1, animation.elapsed / animation.duration);
      animation.paint(progress);
      if (progress === 1) { const done = animation.done; animation = null; done(); }
    }
  }, 30);
  function cancelInstrument() {
    animation = null;
    scanning = false;
    scanSite = null;
    radio.classList.remove("is-scanning");
    signal("expeditionscan", { active: false });
    signal("expeditiontransmit", { active: false });
  }
  function showRadio(title, message, { site, report = false, journal = false } = {}) {
    cancelInstrument();
    $("pip-title").textContent = title;
    setMessage(message);
    $("scan-panel").hidden = $("evidence-review").hidden = $("uplink").hidden = true;
    continueAction = () => radio.close();
    signal("expeditionpip", { speaking: true });
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
  radio.querySelector(".pip-x").onclick = () => radio.close();
  $("pip-continue").onclick = () => {
    if (revealed < fullMessage.length) { revealText(); return; }
    continueAction();
  };
  radio.addEventListener("close", () => {
    cancelInstrument();
    signal("expeditionpip", { speaking: false });
    document.dispatchEvent(new CustomEvent("expeditiondialog", { detail: { open: false } }));
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  });
  function render() {
    document.querySelectorAll("[data-expedition-progress]").forEach(container => {
      const count = state.observations.length;
      container.innerHTML = ["Investigate", "Compare", "Review & send"].map((label, index) => {
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
    showRadio("Something caught my eye…", "I'm Pip! Before you landed, my scanner spotted an unusual light pattern near that dark crater. I saved it for us to investigate together.");
    $("pip-continue").textContent = "What could it be?";
    continueAction = () => {
      showRadio("Let's follow the evidence", "It might be a clue to ice. First, scan the shaded patch and the sunlit rock nearby. Comparing them will help us decide what to tell Earth.");
      $("pip-continue").textContent = "How do I scan?";
      continueAction = () => {
        showRadio("Your scanner is ready", "Find a sample, line up the target, and start your scan. Watch its light pattern appear. You can explore either site first, and ask me for a hint anytime.");
        $("pip-continue").textContent = "Let's explore";
      };
    };
  }
  function hint() {
    const site = Mission1.next(state);
    const message = state.reported ? "Your finding has reached Earth! You can read your journal or try another expedition." :
      site.id === "communications" ? "We have both readings! Follow the blue Communications sign and send our possible-ice finding to Earth." :
      `Follow the amber marker to the ${site.name.toLowerCase()}. ${site.id === "shadow" ? "Scan the dark patch inside the crater." : "Scan the bright ground beside the crater to collect a comparison."}`;
    showRadio("A little nudge from Pip", message);
    document.dispatchEvent(new CustomEvent("expeditionhint", { detail: { site } }));
  }
  function showFinding(site) {
    const both = state.observations.length === 2;
    const message = both ? "Two places, two different patterns! Let's bring both readings to Communications and look at the evidence together." :
      site.id === "shadow" ? "An ice-like pattern! That's exciting, but one reading is only a clue. Let's find out how the sunlit sample compares." :
      "This sample has a rock-like pattern. Now we have a reference! Let's see whether the shaded sample looks the same.";
    showRadio("A new piece of the mystery", message, { site });
    $("pip-continue").textContent = both ? "Let's review our findings" : "Find the other sample";
  }
  function updateAim() {
    const aligned = Math.hypot(aim.x, aim.y) <= 15;
    $("scan-target").style.transform = `translate(calc(-50% + ${aim.x}px), calc(-50% + ${aim.y}px))`;
    $("scan-preview").classList.toggle("aligned", aligned);
    $("scan-start").disabled = !aligned || scanning;
    $("scan-instruction").textContent = aligned ? "Target aligned. Ready to scan." : "Drag the target into the center, or use the arrow keys.";
  }
  function beginScan(site) {
    showRadio("Let's take a closer look", "Line up the sample in your scanner. We'll collect its light pattern and see what it tells us.");
    scanSite = site;
    $("scan-preview").dataset.site = site.id;
    aim = { x: 45, y: -30 };
    $("scan-panel").hidden = false;
    $("scan-progress").value = 0;
    $("pip-continue").textContent = "Cancel scan";
    updateAim();
    $("scan-preview").focus();
  }
  const preview = $("scan-preview");
  preview.addEventListener("pointerdown", event => {
    if (scanning) return;
    dragging = { x: event.clientX, y: event.clientY };
    preview.setPointerCapture(event.pointerId);
  });
  preview.addEventListener("pointermove", event => {
    if (!dragging || scanning) return;
    aim.x = Math.max(-90, Math.min(90, aim.x + event.clientX - dragging.x));
    aim.y = Math.max(-60, Math.min(60, aim.y + event.clientY - dragging.y));
    dragging = { x: event.clientX, y: event.clientY };
    updateAim();
  });
  preview.addEventListener("lostpointercapture", () => { dragging = null; });
  preview.addEventListener("keydown", event => {
    if (scanning || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    aim.x = Math.max(-90, Math.min(90, aim.x + (event.key === "ArrowRight" ? 10 : event.key === "ArrowLeft" ? -10 : 0)));
    aim.y = Math.max(-60, Math.min(60, aim.y + (event.key === "ArrowDown" ? 10 : event.key === "ArrowUp" ? -10 : 0)));
    updateAim();
  });
  function collect(site) {
    setMessage("Target locked. I'm collecting the sample's light pattern. Let's see what appears!");
    scanning = true;
    $("scan-start").disabled = true;
    $("scan-instruction").textContent = "Collecting light pattern…";
    radio.classList.add("is-scanning");
    signal("expeditionscan", { active: true, id: site.id, progress: 0 });
    animation = { elapsed: 0, duration: 3000,
      paint(progress) {
        $("scan-progress").value = progress;
        signal("expeditionscan", { active: true, id: site.id, progress });
      },
      done() { update(Mission1.observe(state, site.id)); showFinding(site); }
    };
  }
  $("scan-start").onclick = () => { if (scanSite && !scanning && Math.hypot(aim.x, aim.y) <= 15) collect(scanSite); };
  function inspect(id, options = {}) {
    const site = Object.hasOwn(Mission1.sites, id) ? Mission1.sites[id] : null;
    if (site) {
      if (state.observations.includes(id)) { showFinding(site); return; }
      beginScan(site);
      if (options.aligned) { aim = { x: 0, y: 0 }; updateAim(); collect(site); }
    } else if (id === "communications") {
      if (state.reported) { celebration(); return; }
      const ready = state.observations.length === 2;
      showRadio("What do our clues suggest?", ready ? "The shaded sample has an ice-like pattern. The sunlit sample looks more like rock. Together, they suggest possible ice. More measurements would help us check." : "Earth will want to see both readings. Let's scan the shaded patch and the sunlit reference before we send our finding.", { report: ready });
      if (ready) {
        $("evidence-review").hidden = false;
        $("evidence-review").innerHTML = Object.values(Mission1.sites).map(site => `<article><span aria-hidden="true">${site.icon}</span><h3>${site.name}</h3><p>${site.reading}</p></article>`).join("") + `<p class="review-conclusion">${Mission1.report}</p>`;
        $("pip-send").textContent = "Ready to send";
      }
    } else if (id === "habitat") {
      showRadio("A home a long way from home", "This habitat gives our crew a place to rest and study their findings. Our solar panels keep the instruments running while we explore. What would you pack for a stay on the Moon?");
    } else if (id === "pip") hint();
  }
  function celebration() {
    showRadio("Earth received our finding!", "Mission Control says: Great observing, team! You've found a promising place to investigate. Pip: You checked the clues before deciding. That's how discoveries begin.");
    $("pip-continue").textContent = "View discovery journal";
    continueAction = () => {
      if (surfaceRun.sessionSaved || surfaceRun.journalSaved) location.assign("./index.html?completed=1#missions");
      else showRadio("Your discovery journal", "Here's your finding to keep exploring. Browser saving is unavailable, so read your journal here before leaving.", { journal: true });
    };
  }
  $("pip-send").onclick = () => {
    if (state.observations.length !== 2 || state.reported) return;
    update(Mission1.review(state));
    update(Mission1.submit(state));
    surfaceRun.saveJournal(state);
    showRadio("Sending our finding home", "Our two readings and your careful conclusion are on their way to Earth. Let's listen for a reply.");
    $("uplink").hidden = false;
    $("uplink-progress").value = 0;
    $("pip-continue").textContent = "View acknowledgement";
    continueAction = celebration;
    animation = { elapsed: 0, duration: 3500,
      paint(progress) { $("uplink-progress").value = progress; signal("expeditiontransmit", { active: true, progress }); },
      done: celebration
    };
  };
  addEventListener("pagehide", () => { cancelInstrument(); radio.close(); });
  document.querySelectorAll("[data-inspect]").forEach(button => button.addEventListener("click", () => inspect(button.dataset.inspect)));
  document.querySelectorAll("[data-hint]").forEach(button => button.addEventListener("click", hint));
  document.querySelectorAll("[data-open-journal]").forEach(button => button.addEventListener("click", () => showRadio("Your discovery journal", "Every observation is a step into the unknown. Here's what you've found so far.", { journal: true })));
  render();
  if (document.body.dataset.expedition === "2d") { if (state.reported) celebration(); else welcome(); }
  addEventListener("pageshow", event => {
    if (event.persisted) { state = surfaceRun.load()?.state || state; render(); }
  });
  return { get state() { return state; }, welcome, inspect, hint, celebration, renderJournal };
})();
