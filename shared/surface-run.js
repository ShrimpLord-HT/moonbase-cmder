// Commands are the source of truth for both views, stored in this browser tab.
const surfaceRun = (() => {
  const key = "moonbase.surface.mission1.v1";
  let run = null;
  function load() {
    try { run = JSON.parse(sessionStorage.getItem(key)); } catch { run = null; }
    // ponytail: only Mission 1 is playable; add per-mission storage with Mission 2.
    if (!Array.isArray(run?.actions) || run.actions.length > 3 ||
        !run.actions.every(action => ["report", "hold", "save"].includes(action))) run = null;
    return run;
  }
  function save() {
    try { sessionStorage.setItem(key, JSON.stringify(run)); } catch { /* Storage can be unavailable. */ }
  }
  function begin() { run = { actions: [] }; save(); return run; }
  function replay() {
    if (load()) run.actions.forEach(takeAction);
    return run;
  }
  function record(action) {
    if (!run || run.actions.length >= mission.shift) return;
    run.actions.push(action);
    run.outcome = mission.finished ? (ui.result.classList.contains("win") ? "success" : "failed") : "active";
    run.message = mission.finished ? ui.result.querySelector("p").textContent : "";
    save();
  }
  if (document.getElementById("scene") && new URLSearchParams(location.search).has("new")) {
    begin();
    history.replaceState(null, "", location.pathname);
  }
  if (document.body.hasAttribute("data-dashboard")) {
    function showDashboard() {
      mission = newMission();
      ui.result.hidden = true;
      ui.log.replaceChildren();
      render();
      if (new URLSearchParams(location.search).has("new")) {
        begin();
        history.replaceState(null, "", location.pathname);
      } else if (!replay()) begin();
      updateDashboard();
      if (!mission.shift) ui.log.textContent = "Systems online. Awaiting your first command.";
    }
    function updateDashboard() {
      const link = document.getElementById("surface-link");
      link.href = mission.finished ? "./3d-test.html?new=1" : "./3d-test.html#resume";
      link.textContent = (mission.finished ? "Replay" : "Continue") + " in 3D ↗";
      document.getElementById("summary-status").textContent = mission.finished ?
        "Mission ended. Return to selection or replay with a different strategy." :
        "Transmit a science report and survive three lunar shifts. Switch between 2D and 3D at any time.";
    }
    ui.choices.forEach(button => button.addEventListener("click", () => {
      record(button.dataset.action);
      updateDashboard();
      if (mission.finished) location.assign("./index.html#missions");
    }));
    showDashboard();
    addEventListener("pageshow", event => { if (event.persisted) showDashboard(); });
  }
  return { load, begin, replay, record,
    checkpoint(pose) { if (run) { run.pose = pose; save(); } } };
})();
