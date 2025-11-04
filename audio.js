import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
// === Setup scene, camera, renderer ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById("container").appendChild(renderer.domElement);

// === Camera controls ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// === Lighting ===
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const point = new THREE.PointLight(0xffffff, 1);
point.position.set(0, 50, 50);
scene.add(point);

// === Create circular bars ===
const bins = 64;
const barsCount = bins / 2;
const radius = 5;
const bars = [];

for (let i = 0; i < barsCount; i++) {
  const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const material = new THREE.MeshStandardMaterial({ color: 0x00ffff });
  const bar = new THREE.Mesh(geometry, material);

  const angle = (i / barsCount) * Math.PI * 2;
  bar.position.x = Math.cos(angle) * radius;
  bar.position.z = Math.sin(angle) * radius;
  bar.rotation.y = angle;
  scene.add(bar);
  bars.push(bar);
}

camera.position.set(0, 5, 12);

// === Audio setup ===
const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
audioLoader.load("./music/Way.mp3", (buffer) => {
  sound.setBuffer(buffer);
  sound.setLoop(true);
  // sound.setVolume(0.7);
});

const analyser = new THREE.AudioAnalyser(sound, bins);

// === Play when user clicks play ===
document.body.addEventListener("click", () => {
  if (!sound.isPlaying) {
    sound.play();
  } else {
    sound.pause();
  }
});

// === Animate ===
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  const data = analyser.getFrequencyData();

  bars.forEach((bar, i) => {
    const scale = (data[i] / 255) * 5 + 0.1;
    bar.scale.y = scale;
    bar.material.color.setHSL(i / barsCount, 1.0, 0.5);
  });

  renderer.render(scene, camera);
}

animate();

// === Resize handling ===
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
