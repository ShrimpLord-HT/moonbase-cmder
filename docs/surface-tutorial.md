# Moonbase Commander · Surface tutorial

In PowerShell, run:

```powershell
cd "$env:USERPROFILE\moonbase-cmder"
python -m http.server 8127 --bind 127.0.0.1
```

Open [the intro and mission menu](http://127.0.0.1:8127/). Choose Mission 1 in 3D or open its 2D dashboard. The header lets you switch views without losing progress in this tab. A finished run returns to mission selection with its result and replay options. Stop the server with Ctrl+C. The 3D tutorial requires WebGL 2 and internet access to load Three.js 0.187.0. No build step or npm install is needed.

Choose **Deploy to surface**. Walk with **WASD**, click the scene for mouse look (Esc releases it), or drag to look. Press **V** to switch between helmet and third-person views. On touchscreens, use the arrow pad, drag the scene to look, and tap the view button.

In third person, press **Shift** or tap **Shift lock** for an over-the-shoulder view. The astronaut faces your aim while **A/D** strafe and **S** backs up. Toggle it again for free orbit.

Approach the blue **Communications** terminal to send your science report. Use **E** or the on-screen **Use** button. The amber **Habitat** console handles power and life support. Only confirming a command spends a shift. Survive all three with at least one report to finish the tutorial.

The 3D page uses the same `shared/game.js` actions, instruments, flight log, and outcomes as the classic mission. The scene and movement code live in `surface/scene3d.js` and `surface/tutorial.js`.

