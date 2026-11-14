// Run with node tests/mission-flow.cjs. No browser, framework, or packages needed.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const Mission1 = require("../shared/mission1.js");
const key = "moonbase.expedition.mission1.v2";
const journalKey = "moonbase.journal.mission1.v1";
const oldKey = "moonbase.surface.mission1.v1";
const storageAPI = map => ({ getItem: name => map.get(name) ?? null, setItem: (name, value) => map.set(name, value) });
function page(session, local) {
  const context = vm.createContext({ Mission1, sessionStorage: storageAPI(session), localStorage: storageAPI(local) });
  vm.runInContext(fs.readFileSync(path.join(root, "shared/surface-run.js"), "utf8"), context);
  return vm.runInContext("surfaceRun", context);
}

for (const order of [["shadow", "sunlit"], ["sunlit", "shadow"]]) {
  const session = new Map([[oldKey, '{"actions":["report"]}']]);
  const local = new Map();
  let current = page(session, local);
  let state = current.begin().state;
  assert.equal(state.reported, false);
  assert.equal(Mission1.submit(state).reported, false, "An empty report must not succeed");
  state = Mission1.observe(state, order[0]);
  current.update(state);
  assert.equal(Mission1.submit(state).reported, false, "One reading is insufficient");
  const first = state;
  state = Mission1.observe(state, order[0]);
  assert.equal(state, first, "Repeated inspections must not duplicate progress");
  assert.equal(Mission1.next(state).id, order[1]);
  const pose = { x: 4, z: 5, yaw: 0.4, pitch: 0, third: true, shiftLocked: false };
  current.checkpoint(pose);
  // A new page represents switching between the 2D and 3D views.
  current = page(session, local);
  const saved = current.load();
  assert.deepEqual(saved.state.observations, [order[0]]);
  assert.equal(saved.pose.x, 4);
  assert.equal(saved.pose.third, true);
  state = Mission1.observe(saved.state, order[1]);
  assert.equal(Mission1.next(state).id, "communications");
  state = Mission1.submit(state);
  current.update(state);
  current.saveJournal(state);
  assert.equal(current.load().state.reported, true);
  assert.equal(current.getJournal().state.reported, true);
  assert.equal(current.sessionSaved, true);
  assert.equal(current.journalSaved, true);
  assert.equal(Mission1.observe(state, "shadow"), state);
  current.begin();
  assert.equal(current.load().state.observations.length, 0, "Replay starts a fresh expedition");
  assert.equal(current.getJournal().state.reported, true, "Replay must keep the last keepsake");
  current = page(new Map(), local);
  assert.equal(current.load(), null, "Closing a tab starts a new active run");
  assert.equal(current.getJournal().state.reported, true, "The keepsake survives a closed tab");
  assert.equal(session.get(oldKey), '{"actions":["report"]}', "Leave old survival saves untouched");
  assert.ok(local.has(journalKey));
}
for (const invalid of [null, {}, { observations: ["unknown"], reported: false },
  { observations: ["shadow", "shadow"], reported: false }, { observations: [], reported: true },
  { observations: ["shadow"], reported: "true" }]) assert.equal(Mission1.restore(invalid), null);
assert.equal(Mission1.observe(Mission1.create(), "__proto__").observations.length, 0);
const corrupt = page(new Map([[key, '{"state":{"observations":["invalid"],"reported":false}}']]), new Map());
assert.equal(corrupt.load(), null);
assert.equal(corrupt.begin().state.reported, false);
const blockedContext = vm.createContext({ Mission1,
  sessionStorage: { getItem() { throw Error("blocked"); }, setItem() { throw Error("blocked"); } },
  localStorage: { getItem() { throw Error("blocked"); }, setItem() { throw Error("blocked"); } }
});
vm.runInContext(fs.readFileSync(path.join(root, "shared/surface-run.js"), "utf8"), blockedContext);
const blocked = vm.runInContext("surfaceRun", blockedContext);
let state = blocked.begin().state;
state = Mission1.submit(Mission1.observe(Mission1.observe(state, "shadow"), "sunlit"));
blocked.update(state); blocked.saveJournal(state);
assert.equal(blocked.load().state.reported, true);
assert.equal(blocked.getJournal().state.reported, true);
assert.equal(blocked.sessionSaved, false);
assert.equal(blocked.journalSaved, false);

// Keep a focused regression check for the original standalone survival game.
function classicRun(actions) {
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      textContent: "", innerHTML: "", style: {}, className: "", hidden: true,
      addEventListener() {}, append() {}, prepend() {}
    });
    return elements.get(id);
  }
  const context = vm.createContext({ document: {
    getElementById: element, querySelectorAll: () => [], createElement: () => element(Symbol()), createTextNode: value => value
  } });
  vm.runInContext(fs.readFileSync(path.join(root, "shared/game.js"), "utf8"), context);
  for (const action of actions) vm.runInContext(`takeAction(${JSON.stringify(action)})`, context);
  return { state: JSON.parse(vm.runInContext("JSON.stringify(mission)", context)), result: element("result").className };
}
assert.equal(classicRun(["report", "save", "save"]).result, "result win");
assert.equal(classicRun(["report", "hold", "hold"]).result, "result lose");
console.log("Passed: both scan orders, report gating, shared progress/pose, replay, persistent journal, invalid/blocked storage, and classic win/loss.");
