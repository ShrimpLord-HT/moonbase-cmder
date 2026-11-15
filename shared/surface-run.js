// One active expedition per tab; one completed keepsake per browser.
const surfaceRun = (() => {
  const key = "moonbase.expedition.mission1.v2";
  const journalKey = "moonbase.journal.mission1.v1";
  let run = null, journal = null, sessionSaved = false, journalSaved = false;
  function load() {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw === null) return run;
      const saved = JSON.parse(raw);
      const state = Mission1.restore(saved?.state);
      run = state ? { state, pose: saved.pose || null } : null;
      sessionSaved = Boolean(state);
    } catch { /* Keep this page's in-memory run when storage is blocked. */ }
    return run;
  }
  function save() {
    sessionSaved = false;
    try { sessionStorage.setItem(key, JSON.stringify(run)); sessionSaved = true; } catch { /* In-memory play remains available. */ }
  }
  function begin() { run = { state: Mission1.create(), pose: null }; save(); return run; }
  function update(state) {
    const restored = Mission1.restore(state);
    if (!restored) return;
    if (!run) begin();
    run.state = restored;
    save();
  }
  function getJournal() {
    try {
      const saved = JSON.parse(localStorage.getItem(journalKey));
      const state = Mission1.restore(saved?.state);
      if (state?.reported) { journal = { state }; journalSaved = true; }
    } catch { /* The current entry is still readable without storage. */ }
    return journal;
  }
  function saveJournal(state) {
    const restored = Mission1.restore(state);
    if (!restored?.reported) return;
    journal = { state: restored };
    journalSaved = false;
    try { localStorage.setItem(journalKey, JSON.stringify(journal)); journalSaved = true; } catch { /* Do not interrupt the celebration. */ }
  }
  return { load, begin, update, getJournal, saveJournal,
    get sessionSaved() { return sessionSaved; }, get journalSaved() { return journalSaved; },
    checkpoint(pose) { if (run) { run.pose = pose; save(); } } };
})();
