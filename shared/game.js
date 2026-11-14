//mission 01
const SHIFTS = ["sunlight", "shadow", "shadow"];
const MAX_BATTERY = 9;
const MAX_OXYGEN = 3; //limits


function getSolarEnergy(shiftIdx) {
  if (SHIFTS[shiftIdx] === "sunlight") {
    return 4;
  } 
  else {
    return 0;
  }
}

function getBatteryCost(action) {
  if (action == "report") return 4;
  else if (action == "hold") return 2;
  else if (action == "save") return 1; //lower power usage
}

function getOxygenChange(action) {
  if (action==="save") return -1;
  else return 1; //cuz ur spending higher power consumption for such
}

function newMission() {
  return {shift: 0, battery: 3, oxygen: 3, reports: 0, finished: false };
}

let mission = newMission(); 

const ui = {
  battery: document.getElementById("battery"), //what players see
  batteryBar: document.getElementById("battery-bar"),
  oxygen: document.getElementById("oxygen"),
  oxygenBar: document.getElementById("oxygen-bar"),
  shiftLabel: document.getElementById("shift-label"),
  timeline: document.getElementById("timeline"),
  forecast: document.getElementById("forecast-note"),
  reportStatus: document.getElementById("report-status"),
  log: document.getElementById("log"),
  result: document.getElementById("result"),
  restart: document.getElementById("restart"),
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

  
  const solar = getSolarEnergy(mission.shift);
  const batteryCost = getBatteryCost(action);
  const oxygenChange = getOxygenChange(action);


  const nextBattery = Math.min(MAX_BATTERY, mission.battery + solar) - batteryCost;
  const nextOxygen = Math.min(MAX_OXYGEN, mission.oxygen + oxygenChange);

  const labels = { report: "Sent report", hold: "Held steady", save: "Saved power" };
  addLog(`${labels[action]}. Solar +${solar}, energy −${batteryCost}, oxygen ${oxygenChange > 0 ? "+" : ""}${oxygenChange}. Battery ${Math.max(0, nextBattery)}, oxygen ${nextOxygen}.`);
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
ui.restart?.addEventListener("click", () => {
  mission = newMission();
  ui.log.innerHTML = '<p class="log-entry"><span class="log-time">00:00</span> Systems reset. Ready for your first command.</p>';
  ui.result.hidden = true;
  render();
});

render();
