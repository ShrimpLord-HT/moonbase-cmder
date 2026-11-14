import * as THREE from "three";
import { runTutorial } from "./tutorial.js";

const mount = document.querySelector("#scene");

// Scene holds the moonbase and uses near-black space as its background.
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05080d);

// Camera frames the habitat and panels from above, looking toward the base.
const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 150);
camera.position.set(12, 10, 16);
camera.lookAt(0, 0.7, 0);

// Renderer draws antialiased WebGL output and adjusts for high-DPI screens.
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
mount.append(renderer.domElement);

// Materials define the muted regolith, pale structure, and blue solar cells.
const regolith = new THREE.MeshStandardMaterial({ color: 0x777a7c, roughness: 1 });

const habitatMaterial = new THREE.MeshStandardMaterial({ color: 0xc6c9c9, roughness: 0.58, metalness: 0.12 });
const metal = new THREE.MeshStandardMaterial({ color: 0x747f89, roughness: 0.42, metalness: 0.68 });
const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x173957, roughness: 0.32, metalness: 0.48 });
const panelLine = new THREE.MeshStandardMaterial({ color: 0x6d9abd, roughness: 0.4, metalness: 0.35 });

// Hemisphere fill softens shadows; directional light acts as sunlight.
scene.add(new THREE.HemisphereLight(0xb8c9df, 0x25272b, 0.55));
const sunlight = new THREE.DirectionalLight(0xffedcf, 3.2);
sunlight.position.set(-24, 5, 18);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(1024, 1024);
sunlight.shadow.camera.left = -18;
sunlight.shadow.camera.right = 18;
sunlight.shadow.camera.top = 18;
sunlight.shadow.camera.bottom = -18;
sunlight.shadow.camera.far = 90;
sunlight.shadow.bias = -0.0002;
sunlight.shadow.normalBias = 0.035;
scene.add(sunlight);

// Shape a subdivided plane into shallow impact bowls and raised rims.
const land = new THREE.PlaneGeometry(144, 144, 160, 160);
land.rotateX(-Math.PI / 2);
const sites = [[-7,-5,2],[-8,3,1.7],[3,-10,2.3],[8,3,1.9],[2,9,1.6],[-13,-14,4],[13,12,3],[-2,-18,3]];
function groundHeight(x, z) {
  let y = -0.15 + 0.035 * Math.sin(x * 1.3) * Math.cos(z);
  for (const [cx, cz, radius] of sites) {
    const d = Math.hypot(x - cx, z - cz) / radius;
    if (d < 1.5) y += radius * (0.14 * Math.exp(-32 * (d - 1) ** 2) - 0.29 * Math.max(0, 1 - d * d));
  }
  const range = Math.hypot(x, z);
  const ridge = Math.exp(-((range - 35) ** 2) / 55);
  return y + ridge * (2.6 + 1.1 * Math.sin(x * 0.29) + 0.7 * Math.cos(z * 0.54));
}
const vertices = land.attributes.position;
const shades = [];
// Concentrate vertices near the outpost; the distant ridges need fewer triangles.
function terrainCoordinate(v) {
  return v * (0.55 + 0.45 * (v / 72) ** 2);
}
for (let i = 0; i < vertices.count; i++) {
  const x = terrainCoordinate(vertices.getX(i)), z = terrainCoordinate(vertices.getZ(i));
  vertices.setXYZ(i, x, groundHeight(x, z), z);
  const shade = 0.78 + 0.18 * Math.random();
  shades.push(shade, shade, shade);
}
land.setAttribute("color", new THREE.Float32BufferAttribute(shades, 3));
land.computeVertexNormals();
regolith.vertexColors = true;
const ground = new THREE.Mesh(land, regolith);
ground.receiveShadow = true;
ground.castShadow = true;
scene.add(ground);
// A small, credited Blue Marble gives the first walk a glimpse of home.
const earth = new THREE.Mesh(new THREE.CircleGeometry(1.05, 48), new THREE.MeshBasicMaterial({ color: 0xffffff }));
earth.position.set(-12, 13, -28);
earth.lookAt(camera.position);
earth.visible = false;
scene.add(earth);
new THREE.TextureLoader().load("./launch/assets/earth-blue-marble.jpg", texture => {
  texture.colorSpace = THREE.SRGBColorSpace;
  earth.material.map = texture;
  earth.material.needsUpdate = true;
  earth.visible = true;
  dispatchEvent(new Event("surfaceassetready"));
}, undefined, () => { /* The expedition remains playable if this image is unavailable. */ });
// Dome habitat uses a short cylinder base and an upper-half sphere shell.
const habitat = new THREE.Group();
const base = new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.38, 0.32, 32), metal);
base.position.y = 0.16;
base.castShadow = true;
base.receiveShadow = true;
habitat.add(base);
const dome = new THREE.Mesh(new THREE.SphereGeometry(1.22, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), habitatMaterial);
dome.position.y = 0.32;
dome.castShadow = true;
dome.receiveShadow = true;
habitat.add(dome);
const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.055, 20), metal);
hatch.rotation.x = Math.PI / 2;
hatch.position.set(0, 0.67, 1.18);
habitat.add(hatch);
habitat.scale.setScalar(1.8);
habitat.position.set(-3.4, -0.14, 2);
scene.add(habitat);

// Two framed, gridded panel arrays sit on simple metal support legs.
function addSolarPanel(x) {
  const panel = new THREE.Group();
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.09, 1.45), panelMaterial);
  deck.position.y = 0.82;
  deck.castShadow = true;
  deck.receiveShadow = true;
  panel.add(deck);
  for (let i = 1; i < 5; i++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.018, 1.43), panelLine);
    line.position.set(-1.05 + i * 0.42, 0.875, 0);
    panel.add(line);
  }
  const cross = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.018, 0.025), panelLine);
  cross.position.set(0, 0.875, 0);
  panel.add(cross);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.055, 1.57), metal);
  frame.position.y = 0.77;
  panel.add(frame);
  for (const z of [-0.55, 0.55]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.74, 8), metal);
    leg.position.set(0, 0.39, z);
    leg.castShadow = true;
    panel.add(leg);
  }
  panel.position.set(x, -0.15, -4.5);
  panel.scale.setScalar(1.5);
  panel.rotation.z = x < 0 ? -0.12 : 0.12;
  scene.add(panel);
}
addSolarPanel(-3.2);
addSolarPanel(3.2);

// Small point cloud gives the dark background a sparse star field.
const starPositions = new Float32Array(240 * 3);
for (let i = 0; i < 240; i++) {
  starPositions[i * 3] = (Math.random() - 0.5) * 100;
  starPositions[i * 3 + 1] = 10 + Math.random() * 45;
  starPositions[i * 3 + 2] = (Math.random() - 0.5) * 100;
}
const starsGeometry = new THREE.BufferGeometry();
starsGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
scene.add(new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0xb8c8df, size: 0.12, sizeAttenuation: true })));


// Signs stay attached to the equipment in both camera views.
const obstacles = [habitat];
const stations = [];
function makeConsole(id, name, x, z, color) {
  const terminal = new THREE.Group();
  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.05, 0.55), metal);
  housing.position.y = 0.525;
  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.38, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x14222b, emissive: color, emissiveIntensity: 0.42 }));
  screen.position.set(0, 0.8, 0.285);
  terminal.add(housing, screen);
  terminal.position.set(x, groundHeight(x, z), z);
  scene.add(terminal);
  obstacles.push(terminal);

  addLabel(name, x, groundHeight(x, z) + 1.5, z, color);
  const lamp = new THREE.PointLight(color, 1.8, 5);
  lamp.position.set(x, groundHeight(x, z) + 1.1, z + 0.55);
  scene.add(lamp);
  stations.push({ id, name, x, z });
}
function addLabel(name, x, y, z, color) {
  const label = document.createElement("canvas");
  label.width = 512; label.height = 88;
  const ctx = label.getContext("2d");
  ctx.fillStyle = "#101820"; ctx.fillRect(0, 0, 512, 88);
  ctx.fillStyle = color; ctx.fillRect(0, 0, 10, 88);
  ctx.fillStyle = "#ffffff"; ctx.font = "bold 36px sans-serif";
  ctx.textAlign = "center"; ctx.fillText(name.toUpperCase(), 256, 57);
  const texture = new THREE.CanvasTexture(label);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, sizeAttenuation: false }));
  sign.scale.set(0.23, 0.04, 1); sign.position.set(x, y, z);
  scene.add(sign);
}
makeConsole("communications", "Communications", 0, -4, "#8ae5f1");
makeConsole("habitat", "Habitat", -0.9, 4.6, "#a6cdb9");
for (const site of Object.values(Mission1.sites)) {
  makeConsole(site.id, site.name, site.x, site.z, site.id === "shadow" ? "#b5d6f2" : "#ffc267");
}
// Pip stays at the landing point and guides the player by radio. No pathfinding needed.
const pip = new THREE.Group();
const pipShell = new THREE.MeshStandardMaterial({ color: 0xd4dbce, roughness: 0.65 });
const pipDark = new THREE.MeshStandardMaterial({ color: 0x203540 });
function pipPart(geometry, material, x, y, z, parent = pip) {
  const part = new THREE.Mesh(geometry, material);
  part.position.set(x, y, z); part.castShadow = true; parent.add(part); return part;
}
pipPart(new THREE.BoxGeometry(0.7, 0.3, 0.64), pipShell, 0, 0.36, 0);
for (const x of [-0.38, 0.38]) for (const z of [-0.23, 0.23]) {
  pipPart(new THREE.CylinderGeometry(0.16, 0.16, 0.13, 12), pipDark, x, 0.2, z).rotation.z = Math.PI / 2;
}
const pipHead = new THREE.Group(); pipHead.position.y = 0.75; pip.add(pipHead);
pipPart(new THREE.BoxGeometry(0.65, 0.38, 0.4), pipShell, 0, 0, 0, pipHead);
pipPart(new THREE.BoxGeometry(0.55, 0.25, 0.03), pipDark, 0, 0, 0.22, pipHead);
const eyes = new THREE.MeshBasicMaterial({ color: 0x8ae5f1 });
for (const x of [-0.14, 0.14]) pipPart(new THREE.SphereGeometry(0.055, 12, 8), eyes, x, 0.01, 0.25, pipHead);
pipPart(new THREE.CylinderGeometry(0.015, 0.015, 0.26, 8), pipShell, 0.15, 0.3, 0, pipHead);
pipPart(new THREE.SphereGeometry(0.045, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffc267 }), 0.15, 0.46, 0, pipHead);
pip.position.set(1.6, groundHeight(1.6, 6), 6);
scene.add(pip); obstacles.push(pip);
stations.push({ id: "pip", name: "Pip", x: 1.6, z: 6 });
addLabel("Pip / your buddy", 1.6, pip.position.y + 1.55, 6, "#ffc267");
const marker = new THREE.Group();
const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffc267, transparent: true, opacity: 0.5, depthWrite: false });
const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.5, 8), markerMaterial);
beacon.position.y = 1.25;
const beaconTop = new THREE.Mesh(new THREE.OctahedronGeometry(0.13), new THREE.MeshBasicMaterial({ color: 0xffc267 }));
beaconTop.position.y = 2.65;
marker.add(beacon, beaconTop); scene.add(marker);
const panelBounds = [-3.2, 3.2].map(x => new THREE.Box3(
  new THREE.Vector3(x - 1.68, -0.16, -5.7), new THREE.Vector3(x + 1.68, 1.45, -3.3)
));
const solids = obstacles.map(object => new THREE.Box3().setFromObject(object)).concat(panelBounds);

runTutorial({ THREE, scene, camera, renderer, groundHeight, stations, solids, marker, pipHead });



