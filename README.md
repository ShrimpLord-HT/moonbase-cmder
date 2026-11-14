# 🌕 Moonbase commander: 
An interactive lunar survival game where young
astronauts learn about resource management,
decision-making, and space exploration.
Built for NASA Space Apps Challenge 2026.

## 👨‍🚀 Team
A two-person international student team.

## 🚧 Status
Currently in development.

## Project layout

| Area | Where to look |
| --- | --- |
| Intro and mission selection | [index.html](index.html), [launch/](launch/) |
| Playable 2D dashboard | [dashboard.html](dashboard.html) shares Mission 1 progress with 3D |
| Classic mission | [classic-mission.html](classic-mission.html) and [classic/](classic/) for its styles |
| 3D tutorial | [3d-test.html](3d-test.html) and [surface/](surface/) for scene, movement, cameras, and styles |
| Mission rules used by both pages | [shared/game.js](shared/game.js) |
| Guides and notes | [Classic mission](docs/classic-mission.md), [3D setup and controls](docs/surface-tutorial.md), [mission resources](docs/mission-resources.md) |

## Play locally

From this folder, run `python -m http.server 8127 --bind 127.0.0.1` and open
[Moonbase Commander](http://127.0.0.1:8127/). No install or build step.

The intro leads to mission selection. Mission 1 is playable in 3D or from the
2D dashboard; Missions 2–3 are coming soon. Switch views during a run to continue
the same shifts and resources. When a run ends, selection shows the result and
offers replay. Progress lasts in the current browser tab; closing it starts fresh.
The legacy classic page remains a separate standalone game.

Run the navigation and progress checks with `node tests/mission-flow.cjs`.
