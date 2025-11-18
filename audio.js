import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";

// === Scene / Camera / Renderer ===
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000010, 20, 45);

const camera = new THREE.PerspectiveCamera(
  65,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000010);
document.getElementById("container").appendChild(renderer.domElement);

// === Controls ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// === Lighting ===
scene.add(new THREE.AmbientLight(0x99ccff, 0.7));
const pointLight = new THREE.PointLight(0x66ccff, 1.5, 100);
pointLight.position.set(0, 15, 10);
scene.add(pointLight);

// === Audio setup ===
const listener = new THREE.AudioListener();
camera.add(listener);
const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
audioLoader.load("./music/Metal.mp3", (buffer) => {
  sound.setBuffer(buffer);
  sound.setLoop(true);
  sound.setVolume(2.8);
  //sound.setVolume(0.5);
});

const analyser = new THREE.AudioAnalyser(sound, 256);

// === Shader Skybox ===
const skyUniforms = {
  uTime: { value: 0 },
  uAudio: { value: 0.0 },
};

const skyShader = {
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vWorldPosition;
    uniform float uTime;
    uniform float uAudio;

    float hash(vec3 p) {
      p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
      p *= 17.0;
      return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
    }

    void main() {
      vec3 dir = normalize(vWorldPosition);
      float t = uTime * 0.05;

      float stripes = abs(sin(dir.y * 100.0 + t * 30.0)) * 0.18;
      float grid = abs(sin(dir.x * 50.0 + t * 40.0) * sin(dir.z * 50.0 - t * 40.0)) * 0.18;
      float n = hash(dir * 100.0 + t * 10.0) * 0.03;

      vec3 baseColor = mix(vec3(0.0, 0.02, 0.05), vec3(0.0, 0.05, 0.09), dir.y * 0.5 + 0.5);

      float pulse = smoothstep(0.0, 1.0, uAudio) * 0.5;
      vec3 pulseTint = mix(vec3(0.0, 0.2, 0.5), vec3(0.0, 0.5, 0.9), pulse);
      baseColor += pulseTint * pulse;

      float glow = pow(stripes + grid, 2.0) * (0.4 + pulse * 1.6);
      vec3 color = baseColor + vec3(glow + n) * 1.1;

      color = mix(color, color * vec3(0.6, 0.8, 1.5), pulse * 0.6);

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

const skyGeo = new THREE.BoxGeometry(200, 200, 200);
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: skyUniforms,
  vertexShader: skyShader.vertexShader,
  fragmentShader: skyShader.fragmentShader,
});
const skyBox = new THREE.Mesh(skyGeo, skyMat);
scene.add(skyBox);

// === Outer Rings ===
const bars = [];
const outerRadius = 6;
const outerCount = 256;

for (let i = 0; i < outerCount; i++) {
  const geometry = new THREE.BoxGeometry(0.08, 0.3, 0.08);
  const material = new THREE.MeshStandardMaterial({
    color: 0xff00cc,
    emissive: 0xff00cc,
    emissiveIntensity: 0.4,
    metalness: 0.9,
    roughness: 0.2,
  });
  const bar = new THREE.Mesh(geometry, material);
  const angle = (i / outerCount) * Math.PI * 2;
  bar.position.x = Math.cos(angle) * outerRadius;
  bar.position.z = Math.sin(angle) * outerRadius;
  bar.rotation.y = -angle;
  scene.add(bar);
  bars.push(bar);
}

// === Second Ring (orange) ===
const bars2 = [];
const outerRadius2 = outerRadius + 1.2;
const rotationOffset = Math.PI / outerCount;
for (let i = 0; i < outerCount; i++) {
  const geometry = new THREE.BoxGeometry(0.08, 0.3, 0.08);
  const material = new THREE.MeshStandardMaterial({
    color: 0xff9900,
    emissive: 0xff5500,
    emissiveIntensity: 0.4,
    metalness: 0.8,
    roughness: 0.25,
  });
  const bar = new THREE.Mesh(geometry, material);
  const angle = (i / outerCount) * Math.PI * 2 + rotationOffset;
  bar.position.x = Math.cos(angle) * outerRadius2;
  bar.position.z = Math.sin(angle) * outerRadius2;
  bar.rotation.y = -angle;
  scene.add(bar);
  bars2.push(bar);
}

// === Third Ring (white) ===
const bars3 = [];
const outerRadius3 = outerRadius2 + 1.2;
const rotationOffset2 = rotationOffset * 1.5;
for (let i = 0; i < outerCount; i++) {
  const geometry = new THREE.BoxGeometry(0.08, 0.3, 0.08);
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.35,
    metalness: 1.0,
    roughness: 0.15,
  });
  const bar = new THREE.Mesh(geometry, material);
  const angle = (i / outerCount) * Math.PI * 2 + rotationOffset2;
  bar.position.x = Math.cos(angle) * outerRadius3;
  bar.position.z = Math.sin(angle) * outerRadius3;
  bar.rotation.y = -angle;
  scene.add(bar);
  bars3.push(bar);
}

// === Inner "city" ===
const innerBuildings = [];
const radialCount = 128;
const layers = 14;
const maxRadius = outerRadius * 0.85;
const minRadius = 0.3;

for (let i = 0; i < radialCount; i++) {
  const angle = (i / radialCount) * Math.PI * 2;
  const dir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
  for (let j = 0; j < layers; j++) {
    const t = j / layers;
    const r = THREE.MathUtils.lerp(minRadius, maxRadius, t);
    const h = THREE.MathUtils.lerp(1.5, 0.1, t);
    const w = THREE.MathUtils.lerp(0.16, 0.05, t);

    const geometry = new THREE.BoxGeometry(w, h, w);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00aaff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.4,
      metalness: 0.7,
      roughness: 0.3,
    });

    const box = new THREE.Mesh(geometry, material);
    box.position.copy(dir.clone().multiplyScalar(r));
    box.position.y = h / 2;
    box.rotation.y = -angle;
    scene.add(box);
    innerBuildings.push({ mesh: box, t, i });
  }
}

// === Camera ===
camera.position.set(0, 8, 15);
controls.update();

// === Postprocessing ===
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.35,
  0.8,
  0.1
);
composer.addPass(bloomPass);

const outlinePass = new OutlinePass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  scene,
  camera
);
outlinePass.edgeStrength = 8.0;
outlinePass.edgeGlow = 1.2;
outlinePass.edgeThickness = 2.5;
outlinePass.visibleEdgeColor.set("#00ffff");
outlinePass.hiddenEdgeColor.set("#ff0088");
composer.addPass(outlinePass);

// === Play / Pause ===
document.body.addEventListener("click", () => {
  if (!sound.isPlaying) sound.play();
  else sound.pause();
});

// === Animate ===
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  const data = analyser.getFrequencyData();
  const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;

  skyUniforms.uTime.value = clock.getElapsedTime();
  skyUniforms.uAudio.value = avg;

  for (let i = 0; i < bars.length; i++) {
    const freq = data[i % data.length];
    const scale = (freq / 255) * 8 + 0.5;
    bars[i].scale.y = scale;
    bars[i].position.y = scale / 2;
    bars[i].material.emissiveIntensity = 0.3 + (freq / 255) * 0.7;
  }

  for (let i = 0; i < bars2.length; i++) {
    const freq = data[(i * 2) % data.length];
    const inverted = 1.0 - freq / 255;
    const scale = inverted * 8 + 0.5;
    bars2[i].scale.y = scale;
    bars2[i].position.y = scale / 2;
    bars2[i].material.emissiveIntensity = 0.3 + inverted * 0.7;
  }

  for (let i = 0; i < bars3.length; i++) {
    const freq = data[(i * 3) % data.length];
    const smooth = (Math.sin(Date.now() * 0.002 + i * 0.1) + 1) / 2;
    const scale = ((freq / 255) * 6 + 0.5) * (0.8 + 0.2 * smooth);
    bars3[i].scale.y = scale;
    bars3[i].position.y = scale / 2;
    bars3[i].material.emissiveIntensity = 0.3 + (freq / 255) * 0.5;
  }

  for (let k = 0; k < innerBuildings.length; k++) {
    const { mesh, t, i } = innerBuildings[k];
    const index = Math.floor((i / radialCount) * data.length);
    const freq = data[index];
    const intensity = freq / 255;
    const baseHeight = THREE.MathUtils.lerp(1.5, 0.1, t);
    mesh.scale.y = baseHeight + intensity * (4.0 - t * 2.0);
    mesh.position.y = mesh.scale.y / 2;
    mesh.material.emissiveIntensity = 0.3 + intensity * 0.9;
  }

  const avg2 = data.reduce((a, b) => a + b, 0) / data.length;
  outlinePass.edgeStrength = 6 + (avg2 / 255) * 3;
  outlinePass.pulsePeriod = 2 + (avg2 / 255) * 2;

  composer.render();
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// === Matrix Boxes Text Animation (Looping Forever) ===
const sampleTexts = [
 `Entry 1: Central District 
 Authority Leak 
 (Extreme Corruption)
MEMORANDUM REF:
 44-B/CD-ENF (AMENDMENT)
TO: Director [REDACTED] 
| FROM: Chief Auditor V. Rix
SUBJECT: Q3 Zoning Permit Review - 
'The Spire' Project (Update)

The Archon Group's structural
 variance is approved. 
 The mandatory 
 "Municipal Safety Contribution" 
 has been confirmed: $5M in direct
  cash deposited into accounts
  88-X-1 and 88-X-2. 
  The remaining 75% 
   of the contribution has
 been paid in Grade-C
  Human Labor Vouchers 
(10-year term) sourced 
from the displaced residents
   of Section 7. These 
 individuals will now service 
 'The Spire' 
 complex in perpetuity.
   Officially, 
   the displacement 
   is logged as 
  "Voluntary 
  Economic Migration."
STATUS: DEBT 
SERVICING COMMENCED.`,

`Entry 2: 
Black Market Acquisition Log
 (Human Trafficking 
 / Organ Trade)
UNIT: T-37 
ITEM: Bio-Synthetic
 Organ Vials 
 (Batch 9) 
 & Source Assets
SELLERS: 
'The Scalpel Guild' 
(via Proxy 'Whisper')
ACQUISITION POINT:
 Old Rail-Yard Docks,
  Sector 12
VOLUME: 14 Grade-A
 Organ Vials + 3
  Living Donors 
  (Designations:
   F-22, M-45, F-09).
PRICE PAID: 
$2,800,000 (Crypto)
 + Guarantee of Immunity
  for Guild Leadership 
  during the next
   Enforcement Sweep.
NOTES: 
Demand from Archon-class
 clients necessitates 
 securing live-harvest
  options. The life 
  expectancy of the three 
  assets must be maintained 
  until transplant preparation
   is complete. Dispose of 
   the bodies in the 
   Slag-Pits afterward. 
   Waste nothing.`,

`Entry 3: 
Internal Security Incident
Report
(Massacre/Cover-up)
INCIDENT ID: 
MA-01-98-3
(REVISED NARRATIVE)
CLASSIFICATION:
 CODE: PURPLE 
 (MASS CASUALTY EVENT)
LOCATION: Factory 7-A,
 Industrial Zone Delta.

REVISED SUMMARY:
 The official cause
  of the blast remains
 "Accidental Industrial Spill." 
The 100+ fatalities are 
now designated as 
"Unregistered Vagrants"
 who succumbed to exposure
 prior to the incident, 
 whose bodies were later 
 caught in the resulting 
 structural collapse.
  A substantial
  'settlement' has been
  paid to the Chief
   Medical Examiner's 
   office for accelerated,
  non-invasive 
  cremation of all remains.
 The public must believe 
  this tragedy solved itself.`,

`Entry 4: PROJECT 01/JADE - 
Security Breach Notification
ALERT LEVEL: CRITICAL (ALPHA)
ASSET NAME: PROJECT 01/JADE 
(Aerosolized Synthetic Pathogen)
STATUS: STOLEN/COMPROMISED 
from secure Level 5 Cryo-Vaults.
SUSPECT: Obsidian 
(Known Bounty Hunter/Ex-Syndicate Asset). 
Last confirmed location: 
Sector 4 perimeter wall breach (03:10:00).
Security forces deployed 
were neutralized with non-lethal, 
high-grade neurotoxin—suggesting
 inside knowledge.
WARNING: The subject knows 
the pathogen’s capabilities.
Containment protocol is now
 "Eliminate and Incinerate." 
Recovery of JADE is secondary to
 the elimination of the carrier.`,

`Entry 5: 
BOUNTY PLACEMENT ORDER:
 OBSIDIAN
TARGET NAME: Obsidian 
(Aliases: N/A, 
known only by handle 
and signature cyber-implants)
CRIMES: High-Treason against
the Corporate Council,
Theft of Classified
Bioweapon (P-01/JADE), 
Murder of Enforcers (x14).
REWARD: $$500,000,000$$ 
(The single largest bounty
 ever issued by the Consortium).
TERMS: DEAD ONLY.
 No quarter. Any agent
 attempting to bring 
 the subject in alive
 for interrogation will
 be considered complicit.
Bring proof of kill
(head/hand scan confirmed).
Archon Group has personally
authorized the deployment 
of H-7 'Hunter' Drones 
into the general population 
zones for this retrieval.
Collateral damage 
authorization is 
Level Omega.`,

`Entry 6:
Financial Audit -
Discreet Findings 
(Tax Evasion & 
Wealth Disparity)
SUBJECT:
Archon Family Holdings
Tax Status Review
Total taxable income 
reported for the year: 
$45,000.
Total reported charitable 
contribution to their
own trust: $500M.
The actual value of Archon’s
hidden assets now exceeds
the combined net worth 
of the city's entire 
Lower Wards population
by a factor of 
10,000 to 1.
The tax rate paid 
by the Archon CEO
is effectively 
0.0001% due to exploiting 
five separate Municipal
Loopholes we designed 
 for them.
ACTION: No change required.
File under 
'Citizenry Compliance Documentation.'`,

`Entry 7:
 Communications Intercept
Obsidian's Message
TARGET: Global City 
Network Broadcast
 (Brief Signal Hijack)
DATE/TIME: [REDACTED] 
04:30:11 (Post-Theft)
TRANSCRIPT: 
(Distorted voice, overlaid 
with static)
"...You built JADE to 
empty the slums for new 
Spire foundations. 
You meant to kill the 
sick and the poor, 
and sell their space. 
I know. I have your plague. 
Now, every breath you take 
is my decision. 
The fight isn't 
over when you die, 
only when I say so."
(Signal terminated by
Enforcement Override).
ANALYST NOTE: 
This public declaration 
confirms the bioweapon's 
intended purpose.
Increase all internal 
security clearance to 
Epsilon-Level Isolation.`,

`Entry 8: 
Police Data Wipe Order 
(Moral Obliteration)
SYSTEM ALERT: 
LEVEL 5 OVERRIDE 
(HIGH PRIORITY)
COMMAND: EXECUTE 
PURGE 'ALL PUBLIC-FACING 
CRIMES DATASET'
TARGET FILES:
- The Rape and Trafficking 
charges against Councilman
Kael's son 
(Dismissed 5 years ago).
- The identities of all
witnesses in the Factory 
7-A Massacre (Mark them as 
"Deceased/Self-Inflicted").
- Any case where the victim's 
socio-economic status was below
Level 4/Middle-Class 
(Designate these crimes as
"Petty Vandalism" or 
"Civil Disruption").
JUSTIFICATION: Maintaining public
faith and preserving social
order through selective memory 
erasure.
The people only see
what the Archon Group 
allows them to see.`
];

function initMatrixBoxes() {
  const containers = document.querySelectorAll(".matrix-text");
  containers.forEach((el, i) => {
    const text = sampleTexts[i % sampleTexts.length];
    el.innerHTML = `<div class="scroll-content">${text}</div><div class="scroll-content">${text}</div>`;
  });
}

const style = document.createElement("style");
style.textContent = `
.scroll-content {
  display: block;
  width: 100%;
  height: 100%;
}
.matrix-text {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  animation: scrollMatrixLoop 14s linear infinite;
}
@keyframes scrollMatrixLoop {
  0% { transform: translateY(0); }
  100% { transform: translateY(-50%); }
}
`;
document.head.appendChild(style);

initMatrixBoxes();
