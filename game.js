// Mission 01: intentionally small, readable rules for the hackathon MVP.
const SHIFTS = ["sunlight", "shadow", "shadow"];
const MAX_BATTERY = 9;
const MAX_OXYGEN = 3;

function newMission() {
  return { shift: 0, battery: 3, oxygen: 3, reports: 0, finished: false };
}

let mission = newMission();

const ui = {
  battery: document.querySelector("#battery"),
  batteryBar: document.querySelector("#battery-bar"),
  oxygen: document.querySelector("#oxygen"),
  oxygenBar: document.querySelector("#oxygen-bar"),
  shiftLabel: document.querySelector("#shift-label"),
  timeline: document.querySelector("#timeline"),
  forecast: document.querySelector("#forecast-note"),
  reportStatus: document.querySelector("#report-status"),
  log: document.querySelector("#log"),
  result: document.querySelector("#result"),
  restart: document.querySelector("#restart"),
  choices: [...document.querySelectorAll("[data-action]")]
};

function render() {
  ui.battery.textContent = mission.battery;
  ui.oxygen.textContent = mission.oxygen;
  ui.batteryBar.style.width = `${100 * mission.battery / MAX_BATTERY}%`;
  ui.oxygenBar.style.width = `${100 * mission.oxygen / MAX_OXYGEN}%`;
  ui.shiftLabel.textContent = mission.finished ? "MISSION COMPLETE" : `SHIFT ${mission.shift + 1} OF ${SHIFTS.length}`;
  ui.reportStatus.textContent = `REPORTS SENT: ${mission.reports} / 1`;
  ui.forecast.textContent = mission.finished ? "The mission has ended. Restart to try another strategy." :
    SHIFTS[mission.shift] === "sunlight" ? "Solar panels generate +4 energy this shift." :
    "No solar charging in shadow. Plan your energy carefully.";

  ui.timeline.innerHTML = SHIFTS.map((type, index) => {
    const status = index < mission.shift ? "done" : index === mission.shift && !mission.finished ? "current" : "future";
    const icon = type === "sunlight" ? "☀" : "☾";
    return `<div class="shift ${status}"><span class="shift-icon">${icon}</span><span>SHIFT 0${index + 1}</span><b>${type === "sunlight" ? "Sunlight" : "Shadow"}</b></div>`;
  }).join("");
  ui.choices.forEach(button => {
    button.disabled = mission.finished || (button.dataset.action === "report" && mission.reports > 0);
  });
}

function addLog(message) {
  const item = document.createElement("p");
  item.className = "log-entry";
  const time = document.createElement("span");
  time.className = "log-time";
  time.textContent = `S${mission.shift + 1}`;
  item.append(time, document.createTextNode(` ${message}`));
  ui.log.prepend(item);
}

function finish(won, explanation) {
  mission.finished = true;
  ui.result.hidden = false;
  ui.result.className = `result ${won ? "win" : "lose"}`;
  ui.result.innerHTML = `<b>${won ? "✓ MISSION SUCCESS" : "✕ MISSION FAILED"}</b><p>${explanation}</p>`;
  render();
}

function takeAction(action) {
  if (mission.finished || (action === "report" && mission.reports > 0)) return;

  const weather = SHIFTS[mission.shift];
  const solar = weather === "sunlight" ? 4 : 0;
  const habitat = action === "save" ? 1 : 2;
  const transmission = action === "report" ? 2 : 0;
  const nextBattery = Math.min(MAX_BATTERY, mission.battery + solar) - habitat - transmission;
  const nextOxygen = Math.min(MAX_OXYGEN, mission.oxygen + (action === "save" ? -1 : 1));

  const labels = { report: "Sent report", hold: "Held steady", save: "Saved power" };
  addLog(`${labels[action]}. Solar +${solar}, habitat −${habitat}, transmission −${transmission}. Battery ${Math.max(0, nextBattery)}, oxygen ${nextOxygen}.`);
  mission.battery = Math.max(0, nextBattery);
  mission.oxygen = Math.max(0, nextOxygen);
  if (action === "report") mission.reports++;
  mission.shift++;

  if (nextBattery <= 0) {
    finish(false, "Power reserves ran out. Try saving energy before the dark shifts.");
  } else if (nextOxygen <= 0) {
    finish(false, "Life support fell too low. Saving power has a human cost.");
  } else if (mission.shift === SHIFTS.length) {
    finish(mission.reports >= 1, mission.reports >= 1 ?
      "Your crew survived all three shifts and transmitted its science report. Great command decisions!" :
      "Your crew survived, but you never transmitted a science report. Try again!");
  } else {
    render();
  }
}

ui.choices.forEach(button => button.addEventListener("click", () => takeAction(button.dataset.action)));
ui.restart.addEventListener("click", () => {
  mission = newMission();
  ui.log.innerHTML = '<p class="log-entry"><span class="log-time">00:00</span> Systems reset. Ready for your first command.</p>';
  ui.result.hidden = true;
  render();
});

render();