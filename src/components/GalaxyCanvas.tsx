import { useEffect, useRef } from "preact/hooks";
import * as THREE from "three";
import styles from "./GalaxyCanvas.module.css";

const nebulaVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const nebulaFragmentShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 9.4; a *= 0.5; }
    return v;
  }
  void main() {
    vec2 uv = vUv - 0.5;
    float drift = uTime * 0.012;
    float n1 = fbm(uv * 3.3 + vec2(drift, -drift * 0.4));
    float n2 = fbm((uv + n1 * 0.13) * 4.5 - vec2(drift * 0.6, drift));
    float plume = smoothstep(0.38, 0.78, n2) * (1.0 - smoothstep(0.22, 0.85, length(uv)));
    vec3 ink = vec3(0.035, 0.018, 0.09);
    vec3 violet = vec3(0.28, 0.08, 0.52);
    vec3 orange = vec3(0.75, 0.17, 0.05);
    vec3 galaxy = mix(violet, orange, smoothstep(-0.55, 0.65, uv.x + sin(uv.y * 4.0) * 0.16));
    float grain = hash(gl_FragCoord.xy + uTime) - 0.5;
    gl_FragColor = vec4(ink + galaxy * plume * 0.24 + grain * 0.018, 0.92);
  }
`;

const starVertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  varying float vTwinkle;
  varying vec3 vColor;
  void main() {
    vColor = aColor;
    vTwinkle = 0.62 + 0.38 * sin(uTime * (0.55 + aPhase * 0.3) + aPhase * 22.0);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * vTwinkle * (100.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = /* glsl */ `
  varying float vTwinkle;
  varying vec3 vColor;
  void main() {
    vec2 point = gl_PointCoord - vec2(0.5);
    float d = length(point);
    float soft = smoothstep(0.5, 0.0, d);
    float core = smoothstep(0.19, 0.0, d);
    gl_FragColor = vec4(vColor * (soft + core * 1.6) * vTwinkle, soft * vTwinkle);
  }
`;

const fuzzVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fuzzFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float rim = pow(1.0 - abs(dot(normalize(vNormal), viewDirection)), 2.1);
    float fleck = hash(floor(vWorldPosition * 24.0) + uTime * 0.05);
    float fuzz = step(0.36, fleck) * smoothstep(0.08, 0.7, rim);
    gl_FragColor = vec4(uColor * (0.45 + rim), fuzz * 0.32);
  }
`;

const mulberry32 = (seed: number) => () => {
  seed += 0x6d2b79f5;
  let value = seed;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
};

function createHeartShape() {
  const heart = new THREE.Shape();
  heart.moveTo(0, -1.05);
  heart.bezierCurveTo(-0.35, -0.68, -1.6, 0.05, -1.18, 0.95);
  heart.bezierCurveTo(-0.94, 1.46, -0.34, 1.5, 0, 1.05);
  heart.bezierCurveTo(0.34, 1.5, 0.94, 1.46, 1.18, 0.95);
  heart.bezierCurveTo(1.6, 0.05, 0.35, -0.68, 0, -1.05);
  return heart;
}

function createStars(count: number) {
  const random = mulberry32(22);
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const violet = new THREE.Color("#b7a2ff");
  const orange = new THREE.Color("#ffc093");
  const white = new THREE.Color("#fff7e6");

  for (let index = 0; index < count; index += 1) {
    const arm = index % 2;
    const radius = 1.5 + random() ** 0.54 * 9;
    const angle = radius * 0.74 + arm * Math.PI + (random() - 0.5) * 1.35;
    const spread = (random() - 0.5) * (0.25 + radius * 0.19);
    const offset = index * 3;
    positions[offset] = Math.cos(angle) * radius + spread;
    positions[offset + 1] =
      Math.sin(angle) * radius * 0.47 + (random() - 0.5) * 2.8;
    positions[offset + 2] = -4 - random() * 10;
    sizes[index] = 1.2 + random() * random() * 4.6;
    phases[index] = random();
    const color = index % 5 === 0 ? orange : index % 3 === 0 ? violet : white;
    colors.set([color.r, color.g, color.b], offset);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  return geometry;
}

export function GalaxyCanvas({ ambient = false }: { ambient?: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let animationFrame = 0;
    let active = true;
    let disposed = false;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0.1, 10.4);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    host.appendChild(renderer.domElement);

    const time = { value: 0 };
    let nebula: THREE.Mesh | undefined;
    let stars: THREE.Points | undefined;

    if (ambient) {
      nebula = new THREE.Mesh(
        new THREE.PlaneGeometry(34, 24),
        new THREE.ShaderMaterial({
          uniforms: { uTime: time },
          vertexShader: nebulaVertexShader,
          fragmentShader: nebulaFragmentShader,
          transparent: true,
          depthWrite: false,
        }),
      );
      nebula.position.z = -14;
      scene.add(nebula);

      stars = new THREE.Points(
        createStars(window.innerWidth < 700 ? 340 : 980),
        new THREE.ShaderMaterial({
          uniforms: { uTime: time },
          vertexShader: starVertexShader,
          fragmentShader: starFragmentShader,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      );
      scene.add(stars);
    }

    let heartGeometry: THREE.ExtrudeGeometry | undefined;
    let camila: THREE.Group | undefined;
    let felipe: THREE.Group | undefined;

    if (!ambient) {
      heartGeometry = new THREE.ExtrudeGeometry(createHeartShape(), {
        depth: 0.48,
        bevelEnabled: true,
        bevelSegments: 5,
        bevelSize: 0.16,
        bevelThickness: 0.16,
        curveSegments: 48,
      });
      heartGeometry.center();

      const buildHeart = (color: string, x: number, rotation: number) => {
        const group = new THREE.Group();
        const core = new THREE.Mesh(
          heartGeometry,
          new THREE.MeshPhysicalMaterial({
            color,
            roughness: 0.23,
            metalness: 0.08,
            clearcoat: 1,
            clearcoatRoughness: 0.1,
            iridescence: 0.25,
            sheen: 0.4,
            sheenColor: new THREE.Color(color).lerp(
              new THREE.Color("#ffffff"),
              0.28,
            ),
            transmission: 0.07,
            thickness: 1.2,
          }),
        );
        const fuzz = new THREE.Mesh(
          heartGeometry,
          new THREE.ShaderMaterial({
            uniforms: {
              uColor: { value: new THREE.Color(color) },
              uTime: time,
            },
            vertexShader: fuzzVertexShader,
            fragmentShader: fuzzFragmentShader,
            transparent: true,
            depthWrite: false,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
          }),
        );
        fuzz.scale.setScalar(1.055);
        group.add(core, fuzz);
        group.position.set(x, -1.25, 0);
        group.rotation.set(0.12, rotation, rotation * 0.28);
        return group;
      };

      camila = buildHeart("#7C3AED", -1.22, 0.37);
      felipe = buildHeart("#FF7A1A", 1.22, -0.37);
      scene.add(camila, felipe);
      scene.add(new THREE.AmbientLight("#ffffff", 1.1));
      const purpleLight = new THREE.PointLight("#8951ff", 26, 9);
      purpleLight.position.set(-3.4, 1.6, 3.8);
      const orangeLight = new THREE.PointLight("#ff8134", 25, 9);
      orangeLight.position.set(3.4, -0.5, 3.8);
      scene.add(purpleLight, orangeLight);
    }

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      if (nebula) {
        const distance = camera.position.z - nebula.position.z;
        const visibleHeight =
          2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
        const visibleWidth = visibleHeight * camera.aspect;
        const scale = Math.max(visibleWidth / 34, visibleHeight / 24) * 1.08;
        nebula.scale.setScalar(scale);
      }
    };
    resize();
    const observer = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting;
      if (active && !reducedMotion && !animationFrame) animate();
    });
    observer.observe(host);
    window.addEventListener("resize", resize);

    const clock = new THREE.Clock();
    const animate = () => {
      if (disposed || !active) {
        animationFrame = 0;
        return;
      }
      const elapsed = reducedMotion ? 4.2 : clock.getElapsedTime();
      time.value = elapsed;
      if (camila && felipe) {
        const embrace = Math.sin(elapsed * 0.35) * 0.12;
        camila.position.x = -1.22 + embrace;
        felipe.position.x = 1.22 - embrace;
        camila.position.y = -1.25 + Math.sin(elapsed * 0.48) * 0.09;
        felipe.position.y = -1.25 + Math.cos(elapsed * 0.44) * 0.09;
        camila.rotation.y = 0.37 + Math.sin(elapsed * 0.35) * 0.1;
        felipe.rotation.y = -0.37 - Math.sin(elapsed * 0.35) * 0.1;
      }
      if (stars) stars.rotation.z = elapsed * 0.012;
      renderer.render(scene, camera);
      animationFrame = reducedMotion ? 0 : requestAnimationFrame(animate);
    };
    animate();
    host.dataset.ready = "true";

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      heartGeometry?.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => {
            material.dispose();
          });
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      className={`${styles.canvas} ${ambient ? styles.ambient : ""}`}
      ref={hostRef}
      aria-hidden="true"
    />
  );
}
