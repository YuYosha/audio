// audio.js
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// === Scene / Camera / Renderer ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.getElementById("container").appendChild(renderer.domElement);

// === Controls ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// === Lighting ===
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const pointLight = new THREE.PointLight(0xffffff, 1.2);
pointLight.position.set(0, 20, 20);
scene.add(pointLight);

// === Audio setup ===
const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
audioLoader.load("./music/Way.mp3", (buffer) => {
  sound.setBuffer(buffer);
  sound.setLoop(true);
  sound.setVolume(0.8);
});

const bins = 256;
const analyser = new THREE.AudioAnalyser(sound, bins);

// === Outer circular bars ===
const bars = [];
const outerRadius = 6;
const outerCount = bins; // full 360°
for (let i = 0; i < outerCount; i++) {
  const geometry = new THREE.BoxGeometry(0.08, 0.3, 0.08);
  const material = new THREE.MeshStandardMaterial({ color: 0x00ffff });
  const bar = new THREE.Mesh(geometry, material);
  const angle = (i / outerCount) * Math.PI * 2;
  bar.position.x = Math.cos(angle) * outerRadius;
  bar.position.z = Math.sin(angle) * outerRadius;
  bar.rotation.y = -angle;
  scene.add(bar);
  bars.push(bar);
}

// === Inner circular "buildings" ===
const innerBuildings = [];
const radialCount = 128; // more directions for full circle
const layers = 14; // boxes per radial direction
const maxRadius = outerRadius * 0.85;
const minRadius = 0.3;

for (let i = 0; i < radialCount; i++) {
  const angle = (i / radialCount) * Math.PI * 2;
  const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));

  for (let j = 0; j < layers; j++) {
    const t = j / layers;
    const r = THREE.MathUtils.lerp(minRadius, maxRadius, t);
    const baseH = THREE.MathUtils.lerp(1.5, 0.1, t);
    const baseW = THREE.MathUtils.lerp(0.16, 0.05, t);

    const geometry = new THREE.BoxGeometry(baseW, baseH, baseW);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x0077ff),
      metalness: 0.4,
      roughness: 0.45,
    });
    const box = new THREE.Mesh(geometry, material);
    box.position.copy(dir.clone().multiplyScalar(r));
    box.position.y = baseH / 2;
    box.rotation.y = -angle;
    scene.add(box);
    innerBuildings.push({ mesh: box, t, i });
  }
}

// === Camera ===
camera.position.set(0, 8, 15);
controls.update();

// === Click to play/pause ===
document.body.addEventListener("click", () => {
  if (!sound.isPlaying) sound.play();
  else sound.pause();
});

// === Animation Loop ===
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  const data = analyser.getFrequencyData();

  // --- Outer Bars ---
  for (let i = 0; i < bars.length; i++) {
    const freq = data[i % data.length];
    const scale = (freq / 255) * 10 + 0.5; // raise more
    bars[i].scale.y = scale;
    bars[i].position.y = scale / 2;
    bars[i].material.color.setHSL(i / bars.length, 1.0, 0.5);
  }

  // --- Inner Buildings ---
  for (let k = 0; k < innerBuildings.length; k++) {
    const { mesh, t, i } = innerBuildings[k];
    const index = Math.floor((i / radialCount) * data.length);
    const freq = data[index];
    const intensity = freq / 255;

    const baseHeight = THREE.MathUtils.lerp(1.5, 0.1, t);
    mesh.scale.y = baseHeight + intensity * (5.0 - t * 2.5);
    mesh.position.y = mesh.scale.y / 2;

    const hue = 0.6 - intensity * 0.4;
    mesh.material.color.setHSL(hue, 1.0, 0.55);
  }

  renderer.render(scene, camera);
}

animate();

// === Resize ===
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
