// Run with: node tests/mission-flow.cjs (no packages needed).
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.join(__dirname, "..");
const key = "moonbase.surface.mission1.v1";

function page(storage, { dashboard = false, search = "", hash = "", surface = false } = {}) {
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      textContent: "", innerHTML: "", hidden: false, style: {}, dataset: {}, listeners: {},
      classList: { contains(name) { return elements.get(id).className?.split(" ").includes(name); }, toggle() {} },
      addEventListener(name, listener) { (this.listeners[name] ||= []).push(listener); },
      replaceChildren() { this.textContent = ""; }, prepend() {}, append() {}, focus() {},
      querySelector() { return { textContent: this.innerHTML.match(/<p>(.*?)<\/p>/)?.[1] }; },
      click() { if (!this.disabled) this.listeners.click?.forEach(listener => listener()); }
    });
    return elements.get(id);
  }
  const choices = ["report", "hold", "save"].map(action => {
    const button = element(action);
    button.dataset.action = action;
    return button;
  });
  const context = vm.createContext({
    document: {
      body: { hasAttribute: name => dashboard && name === "data-dashboard" },
      getElementById: id => id === "scene" ? (surface ? element(id) : null) : element(id),
      querySelectorAll: () => choices, createElement: () => element(Symbol()), createTextNode: text => text
    },
    sessionStorage: { getItem: name => storage.get(name) ?? null, setItem: (name, value) => storage.set(name, value) },
    location: { search, hash, pathname: dashboard ? "/dashboard.html" : "/index.html", assign(url) { this.destination = url; } },
    history: { replaceState() { context.location.search = ""; } },
    URLSearchParams, addEventListener() {}, scrollTo() {}
  });
  const script = file => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
  const state = () => JSON.parse(vm.runInContext("JSON.stringify(mission)", context));
  return { context, element, script, state };
}
function game(storage, options) {
  const current = page(storage, options);
  current.script("shared/game.js");
  current.script("shared/surface-run.js");
  return current;
}

const storage = new Map();
let current = game(storage, { dashboard: true });
current.element("report").click();
assert.equal(current.state().shift, 1);
assert.equal(JSON.parse(storage.get(key)).actions.length, 1);
// Reopening the 2D dashboard replays, rather than duplicates, the saved commands.
current = game(storage, { dashboard: true });
assert.equal(current.state().reports, 1);
assert.equal(JSON.parse(storage.get(key)).actions.length, 1);
// The 3D view resumes that same state and records its terminal command.
current = game(storage, { surface: true });
vm.runInContext('surfaceRun.replay(); takeAction("save"); surfaceRun.record("save");', current.context);
assert.equal(current.state().battery, 2);
current = game(storage, { dashboard: true });
assert.equal(current.state().oxygen, 2);
current.element("save").click();
assert.equal(current.context.location.destination, "./index.html#missions");
assert.equal(JSON.parse(storage.get(key)).outcome, "success");
current = page(storage, { hash: "#missions" });
current.script("shared/surface-run.js");
current.script("launch/menu.js");
assert.equal(current.element("play-2d").href, "./dashboard.html?new=1");
assert.equal(current.element("mission-result").hidden, false);
assert.match(current.element("result-title").textContent, /Welcome home/);
// Replay clears the previous result and restores starting resources.
current = game(storage, { dashboard: true, search: "?new=1" });
assert.equal(current.state().shift, 0);
assert.equal(current.state().battery, 3);
["report", "hold", "hold"].forEach(action => current.element(action).click());
assert.equal(JSON.parse(storage.get(key)).outcome, "failed");
assert.equal(current.context.location.destination, "./index.html#missions");
current = game(storage, { surface: true, search: "?new=1" });
assert.deepEqual(JSON.parse(storage.get(key)).actions, []);
// Invalid and unavailable storage must not prevent starting a mission.
storage.set(key, '{"actions":["invalid"]}');
current = game(storage, { dashboard: true });
assert.equal(current.state().shift, 0);
current.context.sessionStorage.getItem = current.context.sessionStorage.setItem = () => { throw Error("blocked"); };
vm.runInContext('surfaceRun.begin(); takeAction("report"); surfaceRun.record("report");', current.context);
assert.equal(current.state().reports, 1);
console.log("Passed: shared 2D/3D progress, completion, replay, failure, and unavailable storage.");
