# Moonbase Commander — Stage 1 playable prototype

A small browser game for the **2026 NASA Space Apps Challenge / Junior Astronaut Mission Trainer**. It is an educational simplification, **not** a physics-accurate simulation and does not yet incorporate NASA data.

## Play locally

Open `classic-mission.html` in Firefox or Chrome. No installation, server, or npm required.

## Rules

- Three shifts: **sunlight → shadow → shadow**.
- Start with **3 battery** (maximum 9), **3 oxygen safety**, **0 reports**.
- Sunlight adds **4 energy** at the start of its shift; shadows add zero.
- The habitat consumes **2 energy** per shift; **Save power** cuts that to **1**, but reduces oxygen safety by **1**.
- **Send report** costs **2 additional energy** and completes the science objective. It can only be sent once.
- **Hold steady** has no extra energy cost. Normal operations restore 1 oxygen safety (up to 3).
- If battery or oxygen safety falls to **0**, the mission fails.
- Win if you survive all three shifts and have transmitted the report.

**Winning example:** Send report → Save power → Save power. Battery: 3 → 3 → 2 → 1; oxygen: 3 → 3 → 2 → 1.

**Losing example:** Send report → Hold steady → Hold steady. Battery: 3 → 3 → 1 → 0; power runs out on shift 3.

## File roles

- `classic-mission.html`: screen content and layout elements (good for UI teammate).
- `classic/style.css`: colors, layout, responsive design (good for UI teammate).
- `shared/game.js`: mission state, rules, decisions, outcomes (good for game-logic teammate).

## Next steps, in priority order

1. Play through one win and one loss together. Agree on the rules.
2. Replace the instructional numbers with well-referenced NASA-related learning explanations, and cite the sources.
3. Add one meaningful extra constraint (e.g. radiation protection) **only after** the core loop works.
4. Capture a 30–60 second demo; deploy the static app to GitHub Pages; submit according to the registered event's deadline and checklist.

The event runs Nov 14–15, 2026. Verify your registered event's exact submission cutoff and timezone; the global event dates do not by themselves establish your local cutoff.