import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const container = document.getElementById("container");
const audioElement = document.getElementById("audio");

// Create bars
const bars = [];
const barCount = 64;
const radius = 20;

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

const geometry = new THREE.BoxGeometry(0.5, 1, 0.5);
const material = new THREE.MeshStandardMaterial({ color: 0x44aa88 });

for (let i = 0; i < barCount; i++) {
  const bar = new THREE.Mesh(geometry, material);
  const angle = (i / barCount) * Math.PI * 2;
  bar.position.x = Math.cos(angle) * radius;
  bar.position.z = Math.sin(angle) * radius;
  scene.add(bar);
  bars.push(bar);
}

// Lighting
const light = new THREE.PointLight(0xffffff, 1);
light.position.set(0, 50, 50);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// Audio setup
const listener = new THREE.AudioListener();
camera.add(listener);

const audio = new THREE.Audio(listener);
audio.setMediaElementSource(audioElement);

const analyser = new THREE.AudioAnalyser(audio, 128);
function init() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    
    camera.position.z = 50;
    
}
// Animate
function animate() {
  requestAnimationFrame(animate);

  const data = analyser.getFrequencyData();

  bars.forEach((bar, i) => {
    const scale = Math.max(data[i] / 20, 0.5);
    bar.scale.y = scale;
    bar.material.color.setHSL(i / barCount, 1, 0.5);
  });

  scene.rotation.y += 0.003;

  renderer.render(scene, camera);
}

init();
animate();

// Handle resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Ensure audio context is resumed on user gesture and avoid creating new listeners
const playButton = document.getElementById("playButton");
if (playButton) {
  playButton.addEventListener("click", async () => {
    if (listener.context.state === "suspended") {
      await listener.context.resume();
    }
    try {
      await audioElement.play();
    } catch (err) {
      // Intentionally swallow errors here; UI has controls as fallback
    }
    playButton.disabled = true;
    playButton.textContent = "Playing";
  });
}

// Also handle when the native audio controls are used
audioElement.addEventListener("play", async () => {
  if (listener.context.state === "suspended") {
    await listener.context.resume();
  }
});