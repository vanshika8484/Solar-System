import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { gsap } from "https://cdn.skypack.dev/gsap";

// === Scene Setup ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // deep space color

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);
camera.position.set(0, 150, 500);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// === Lighting ===
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 3.5, 5000);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

const lightHelper = new THREE.PointLightHelper(pointLight, 20);
scene.add(lightHelper);

// === Controls ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);
controls.update();

// === GLTF Loader ===
const loader = new GLTFLoader();

// === Planet Data ===
const planetData = [
  {
    name: "Mercury",
    file: "./models/mercury.glb",
    radius: 50,
    scale: 2,
    speed: 0.02,
  },
  {
    name: "Venus",
    file: "./models/venus.glb",
    radius: 95,
    scale: 4,
    speed: 0.016,
  },
  {
    name: "Earth",
    file: "./models/earth.glb",
    radius: 130,
    scale: 5,
    speed: 0.01,
  },
  {
    name: "Mars",
    file: "./models/mars.glb",
    radius: 195,
    scale: 3,
    speed: 0.01,
  },
  {
    name: "Jupiter",
    file: "./models/jupiter.glb",
    radius: 670,
    scale: 10,
    speed: 0.007,
  },
  {
    name: "Saturn",
    file: "./models/saturn.glb",
    radius: 1235,
    scale: 60,
    speed: 0.005,
  },
  {
    name: "Uranus",
    file: "./models/uranus.glb",
    radius: 2480,
    scale: 22,
    speed: 0.004,
  },
  {
    name: "Neptune",
    file: "./models/neptune.glb",
    radius: 3880,
    scale: 24,
    speed: 0.003,
  },
];

// === Store planets ===
const planets = [];

// === Load the Sun ===
let sun;
loader.load(
  "./models/sun.glb",
  (gltf) => {
    sun = gltf.scene;
    sun.scale.set(2, 2, 2);
    scene.add(sun);

    // Sun rotation
    gsap.to(sun.rotation, {
      y: Math.PI * 2,
      duration: 30,
      repeat: -1,
      ease: "none",
    });

    // Sun glow
    // const glowGeo = new THREE.SphereGeometry(20, 64, 64);
    // const glowMat = new THREE.MeshBasicMaterial({
    //   color: 0xffd27f,
    //   transparent: true,
    //   opacity: 0.4,
    //   blending: THREE.AdditiveBlending,
    // });
    // const glow = new THREE.Mesh(glowGeo, glowMat);
    // scene.add(glow);
  },
  undefined,
  (error) => console.error("Error loading sun.glb:", error)
);

// === Load Planets ===
planetData.forEach((data, index) => {
  loader.load(
    data.file,
    (gltf) => {
      const planet = gltf.scene;

      // Normalize scale
      const box = new THREE.Box3().setFromObject(planet);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const scaleFactor = (data.scale / maxDim) * 5;
      planet.scale.setScalar(scaleFactor);

      planet.position.x = data.radius;
      scene.add(planet);

      // Fix materials
      planet.traverse((child) => {
        if (child.isMesh) {
          child.material.side = THREE.DoubleSide;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // === Gradient Orbit Ring ===
      const orbitGeo = new THREE.RingGeometry(
        data.radius - 0.8,
        data.radius + 0.8,
        256,
        1
      );

      // Define planet-specific colors
      const orbitColors = [
        {
          color1: new THREE.Color(0x800080),
          color2: new THREE.Color(0x4b0082),
        }, // Mercury: Purple to Dark Indigo
        {
          color1: new THREE.Color(0xffff00),
          color2: new THREE.Color(0x8b8b00),
        }, // Venus: Yellow to Dark Yellow
        {
          color1: new THREE.Color(0x0000ff),
          color2: new THREE.Color(0x00008b),
        }, // Earth: Blue to Dark Blue
        {
          color1: new THREE.Color(0xff4500),
          color2: new THREE.Color(0x8b2500),
        }, // Mars: Orange to Dark Orange
        {
          color1: new THREE.Color(0xff4040),
          color2: new THREE.Color(0x8b1c1c),
        }, // Jupiter: Pinkish-Red to Dark Red
        {
          color1: new THREE.Color(0xffff00),
          color2: new THREE.Color(0x8b8b00),
        }, // Saturn: Yellow to Dark Yellow
        {
          color1: new THREE.Color(0x00ffff),
          color2: new THREE.Color(0x008b8b),
        }, // Uranus: Aqua to Dark Cyan
        {
          color1: new THREE.Color(0x000080),
          color2: new THREE.Color(0x00004b),
        }, // Neptune: Navy Blue to Darker Navy
      ];

      const orbitMat = new THREE.ShaderMaterial({
        uniforms: {
          color1: { value: orbitColors[index].color1 },
          color2: { value: orbitColors[index].color2 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color1;
          uniform vec3 color2;
          varying vec2 vUv;
          void main() {
            float glow = smoothstep(0.0, 1.0, 1.0 - abs(vUv.y - 0.5) * 2.0);
            vec3 color = mix(color2, color1, glow);
            gl_FragColor = vec4(color, glow * 0.3);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });

      const orbit = new THREE.Mesh(orbitGeo, orbitMat);
      orbit.rotation.x = Math.PI / 2;

      scene.add(orbit);

      planets.push({
        mesh: planet,
        radius: data.radius,
        speed: data.speed,
        angle: Math.random() * Math.PI * 2,
      });

      // Self-rotation
      gsap.to(planet.rotation, {
        y: Math.PI * 2,
        duration: 10 + Math.random() * 10,
        repeat: -1,
        ease: "none",
      });
    },
    undefined,
    (error) => console.error(`Error loading ${data.name}:`, error)
  );
});

// === Background Stars ===

function createStarLayer(count, size, spread, opacity, color = 0xffffff) {
  const positions = [];
  const colors = [];
  const colorObj = new THREE.Color(color);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = 32;
  canvas.height = 32;

  // Enhanced gradient for brighter stars
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, "rgba(255,255,255,1)"); // Strong central intensity
  gradient.addColorStop(0.3, "rgba(255,255,255,0.8)"); // Slower falloff
  gradient.addColorStop(0.7, "rgba(255,255,255,0.2)"); // Gradual fade
  gradient.addColorStop(1, "rgba(255,255,255,0)"); // Transparent edge
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(16, 16, 16, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);

  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * spread * 2;
    const y = (Math.random() - 0.5) * spread * 2;
    const z = (Math.random() - 0.5) * spread * 2;
    positions.push(x, y, z);

    // Minimal color variation for maximum brightness
    const colorVariation = 0.95 + Math.random() * 0.05; // Very tight range
    colors.push(
      colorObj.r * colorVariation,
      colorObj.g * colorVariation,
      colorObj.b * colorVariation
    );
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: size * 0.6, // Keep stars small
    map: texture,
    transparent: true,
    opacity: opacity * 4.0, // Further increase opacity for brighter stars
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const stars = new THREE.Points(geometry, material);
  scene.add(stars);
  return stars;
}

// === 5-Layer Starfield ===
createStarLayer(1200, 5.5, 1200, 0.3, 0xffffff); // Close bright stars
createStarLayer(2000, 4.5, 1600, 0.3, 0xffff00); // Yellowish layer
createStarLayer(3000, 3.5, 2200, 0.3, 0x99b0ff); // Bluish stars
createStarLayer(5000, 2.8, 2800, 0.4, 0xff93ff); // Purple haze
createStarLayer(8000, 3.2, 3500, 0.6, 0xaadfff); // Distant cold blue
// === Resize Handling ===
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// === Animation Loop ===
function animate() {
  requestAnimationFrame(animate);

  planets.forEach((planet) => {
    planet.angle += planet.speed;
    planet.mesh.position.x = Math.cos(planet.angle) * planet.radius;
    planet.mesh.position.z = Math.sin(planet.angle) * planet.radius;
  });

  controls.update();
  renderer.render(scene, camera);
}

animate();
