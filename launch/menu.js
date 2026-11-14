(() => {
  const intro = document.getElementById("intro");
  const missions = document.getElementById("missions");
  function showScreen() {
    const selecting = location.hash === "#missions";
    intro.hidden = selecting;
    missions.hidden = !selecting;
    document.title = "Moonbase Commander | " + (selecting ? "Mission selection" : "Welcome, Commander");
    if (selecting) {
      const run = surfaceRun.load();
      const ended = run?.outcome === "success" || run?.outcome === "failed";
      const active = run && !ended;
      document.getElementById("mission-status").textContent = ended ? (run.outcome === "success" ? "MISSION COMPLETE" : "TRY AGAIN") : active ? "IN PROGRESS" : "READY TO DEPLOY";
      document.getElementById("play-3d").href = active ? "./3d-test.html#resume" : "./3d-test.html?new=1";
      document.getElementById("play-3d-label").textContent = ended ? "Replay in 3D" : active ? "Continue in 3D" : "Start mission in 3D";
      document.getElementById("play-2d").href = ended ? "./dashboard.html?new=1" : "./dashboard.html";
      document.getElementById("play-2d-label").textContent = ended ? "Replay in 2D" : active ? "Continue in 2D" : "Open 2D dashboard";
      document.getElementById("restart-options").hidden = !active;
      const banner = document.getElementById("mission-result");
      banner.hidden = !ended;
      if (ended) {
        banner.classList.toggle("failed", run.outcome === "failed");
        document.getElementById("result-title").textContent = run.outcome === "success" ? "Welcome home, Commander." : "Mission ended. A new strategy awaits.";
        document.getElementById("result-message").textContent = run.message;
      }
    }
  }
  addEventListener("hashchange", () => {
    showScreen();
    document.getElementById(location.hash === "#missions" ? "selection-title" : "intro-title").focus();
    scrollTo(0, 0);
  });
  addEventListener("pageshow", showScreen);
  showScreen();
})();
