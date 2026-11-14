// Shared expedition rules and authored science content. No DOM or storage here.
const Mission1 = (() => {
  const report = "Our scans suggest possible water ice in the shaded area. More measurements would help us check.";
  const sites = {
    shadow: {
      id: "shadow", name: "Shaded crater", x: 8, z: 3, icon: "☾",
      reading: "Ice-like light pattern detected",
      response: "An ice-like pattern! Let's compare it with the sunlit sample before we send our finding home.",
      fact: "Near the Moon's poles, some crater floors never receive direct sunlight. Their deep cold can preserve water ice.",
      source: "https://science.nasa.gov/moon/moon-water-and-ices/"
    },
    sunlit: {
      id: "sunlit", name: "Sunlit reference", x: 5, z: 6, icon: "☀",
      reading: "Rock-like light pattern detected",
      response: "This sample has a different light pattern. Comparing the two readings helps us check our idea about ice.",
      fact: "Scientists can identify water ice from the way it absorbs certain kinds of light. Instruments help us see patterns our eyes can't.",
      source: "https://www.jpl.nasa.gov/news/ice-confirmed-at-the-moons-poles/"
    }
  };
  function create() { return { observations: [], reported: false, welcomeSeen: false }; }
  function restore(value) {
    if (!value || !Array.isArray(value.observations) || value.observations.length > 2 ||
        !value.observations.every(id => Object.hasOwn(sites, id)) ||
        new Set(value.observations).size !== value.observations.length ||
        typeof value.reported !== "boolean" || (value.reported && value.observations.length !== 2)) return null;
    return { observations: [...value.observations], reported: value.reported, welcomeSeen: value.welcomeSeen === true };
  }
  function observe(state, id) {
    if (!Object.hasOwn(sites, id) || state.reported || state.observations.includes(id)) return state;
    return { ...state, observations: [...state.observations, id] };
  }
  function submit(state) {
    return state.observations.length === 2 ? { ...state, reported: true } : state;
  }
  function next(state) {
    return Object.values(sites).find(site => !state.observations.includes(site.id)) ||
      { id: "communications", name: "Communications", x: 0, z: -4 };
  }
  function objective(state) {
    if (state.reported) return "Your finding is home. Open your discovery journal!";
    if (state.observations.length === 2) return "Both scans collected! Send your finding from Communications.";
    return `${state.observations.length ? "Compare your finding" : "Your first discovery awaits"}: scan the ${next(state).name.toLowerCase()}.`;
  }
  return { sites, report, create, restore, observe, submit, next, objective };
})();
if (typeof module !== "undefined") module.exports = Mission1;
