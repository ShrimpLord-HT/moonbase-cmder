(() => {
  const intro = document.getElementById("intro");
  const missions = document.getElementById("missions");
  const arrivedWithReport = new URLSearchParams(location.search).has("completed");
  document.getElementById("review-journal").addEventListener("click", () => {
    const panel = document.getElementById("saved-journal");
    panel.open = true;
    panel.scrollIntoView({ block: "start" });
    panel.querySelector("summary").focus({ preventScroll: true });
  });
  function showScreen() {
    const selecting = location.hash === "#missions";
    intro.hidden = selecting;
    missions.hidden = !selecting;
    document.title = "Moonbase Commander | " + (selecting ? "Mission selection" : "Welcome, Commander");
    if (selecting) {
      const run = surfaceRun.load();
      const journal = surfaceRun.getJournal();
      const ended = run?.state.reported || (!run && Boolean(journal));
      const active = run && !ended;
      document.getElementById("mission-status").textContent = ended ? "FIRST DISCOVERY COMPLETE" : active ? "EXPEDITION IN PROGRESS" : "READY TO EXPLORE";
      document.getElementById("play-3d").href = active ? "./3d-test.html#resume" : "./3d-test.html?new=1";
      document.getElementById("play-3d-label").textContent = ended ? "Replay in 3D" : active ? "Continue in 3D" : "Start mission in 3D";
      document.getElementById("play-2d").href = ended ? "./dashboard.html?new=1" : "./dashboard.html";
      document.getElementById("play-2d-label").textContent = ended ? "Replay in 2D" : active ? "Continue in 2D" : "Open 2D dashboard";
      document.getElementById("restart-options").hidden = !active;
      const banner = document.getElementById("mission-result");
      banner.hidden = !ended;
      if (ended) {
        document.getElementById("result-title").textContent = "Your first lunar discovery!";
        document.getElementById("result-message").textContent = "Pip: We gathered two readings and sent a promising finding home. I wonder what we'll discover next!";
      }
      const journalState = run?.state.reported ? run.state : journal?.state;
      const journalPanel = document.getElementById("saved-journal");
      journalPanel.hidden = !journalState;
      if (journalState) {
        ExpeditionUI.renderJournal(document.getElementById("journal-content"), journalState);
        document.getElementById("journal-save-note").textContent = journal ? "Your journal is saved in this browser, ready for your next visit." : "Your journal is available in this tab. Browser journal saving is unavailable.";
        journalPanel.open = ended;
      }
      if (new URLSearchParams(location.search).has("completed")) {
        history.replaceState(null, "", location.pathname + "#missions");
        document.getElementById("result-title").setAttribute("tabindex", "-1");
        document.getElementById("result-title").focus({ preventScroll: true });
      }
    }
  }
  addEventListener("hashchange", () => {
    showScreen();
    document.getElementById(location.hash === "#missions" ? "selection-title" : "intro-title").focus();
    scrollTo(0, 0);
  });
  addEventListener("pageshow", () => {
    showScreen();
    if (arrivedWithReport && !document.getElementById("mission-result").hidden) document.getElementById("result-title").focus({ preventScroll: true });
  });
  showScreen();
})();
