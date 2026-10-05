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
    for (int i = 0; i < 3; i++) { v += a * noise(p); p = p * 2.03 + 9.4; a *= 0.5; }
    return v;
  }
  void main() {
    vec2 uv = vUv - 0.5;
    float drift = uTime * 0.005;
    vec2 warp = vec2(
      fbm(uv * 3.0 + vec2(drift, 2.4)),
      noise(uv * 3.0 + vec2(5.7, -drift))
    ) - 0.5;
    vec2 p = uv + warp * 0.17;
    float cloud = smoothstep(0.4, 0.72, fbm(p * 4.2));
    float detail = fbm(p * 11.0 + vec2(3.1, 8.7));
    float filaments = pow(max(0.0, 1.0 - abs(detail - 0.62) * 8.0), 2.0);
    float dust = smoothstep(0.55, 0.75, noise(p * 6.0 + 14.2));
    float shape = max(0.0, cloud * 0.35 + filaments * 0.65 - dust * 0.3);
    float darkCenter = smoothstep(0.1, 0.34, length(uv * vec2(1.1, 0.85)));
    float violet = (1.0 - smoothstep(0.18, 0.68, length(uv - vec2(-0.43, 0.06)))) * darkCenter;
    float amber = (1.0 - smoothstep(0.14, 0.64, length(uv - vec2(0.44, -0.13)))) * darkCenter;
    vec3 ink = vec3(0.004, 0.004, 0.009);
    vec3 color = ink + shape * (
      vec3(0.23, 0.09, 0.42) * violet * 0.22 +
      vec3(0.5, 0.16, 0.06) * amber * 0.17
    );
    gl_FragColor = vec4(color, 1.0);
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
    vTwinkle = 0.9 + 0.1 * sin(uTime * (0.35 + aPhase * 0.25) + aPhase * 22.0);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = max(1.0, aSize * (18.0 / -mvPosition.z));
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = /* glsl */ `
  varying float vTwinkle;
  varying vec3 vColor;
  void main() {
    vec2 point = gl_PointCoord - vec2(0.5);
    float d = length(point);
    float soft = 1.0 - smoothstep(0.08, 0.5, d);
    float core = 1.0 - smoothstep(0.0, 0.16, d);
    gl_FragColor = vec4(vColor, soft * (0.28 + core * 0.32) * vTwinkle);
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
  uniform float uGlow;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float rim = pow(1.0 - abs(dot(normalize(vNormal), viewDirection)), 2.1);
    float halo = smoothstep(0.08, 0.85, rim);
    gl_FragColor = vec4(
      uColor,
      halo * (0.07 + uGlow * 0.04)
    );
  }
`;

type Heart = {
  core: THREE.Mesh;
  coreMaterial: THREE.MeshPhysicalMaterial;
  fuzzMaterial: THREE.ShaderMaterial;
  group: THREE.Group;
  hovered: boolean;
  hoverAmount: number;
};

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

function createPuffyHeartGeometry() {
  const outline = createHeartShape().getPoints(48);
  if (outline[0].equals(outline[outline.length - 1])) outline.pop();
  if (THREE.ShapeUtils.isClockWise(outline)) outline.reverse();

  const bounds = new THREE.Box2().setFromPoints(outline);
  const center = bounds.getCenter(new THREE.Vector2());
  const size = bounds.getSize(new THREE.Vector2());
  const perimeter = outline.reduce(
    (length, point, index) =>
      length + point.distanceTo(outline[(index + 1) % outline.length]),
    0,
  );
  const startAngle = Math.atan2(
    outline[0].y - center.y,
    outline[0].x - center.x,
  );
  let distance = 0;
  const roundedOutline = outline.map((point, index) => {
    const angle = startAngle + (Math.PI * 2 * distance) / perimeter;
    distance += point.distanceTo(outline[(index + 1) % outline.length]);
    return new THREE.Vector2(
      Math.cos(angle) * size.x * 0.5,
      Math.sin(angle) * size.y * 0.5,
    );
  });
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const rings = 32;
  const depth = 0.72;

  for (let ring = 1; ring < rings; ring += 1) {
    const angle = -Math.PI / 2 + (Math.PI * ring) / rings;
    const width = Math.cos(angle);
    const heartShape = width ** 4;
    const z = depth * Math.sin(angle);
    for (let index = 0; index < outline.length; index += 1) {
      const point = outline[index];
      const rounded = roundedOutline[index];
      const x =
        THREE.MathUtils.lerp(rounded.x, point.x - center.x, heartShape) * width;
      const y =
        THREE.MathUtils.lerp(rounded.y, point.y - center.y, heartShape) * width;
      positions.push(x, y, z);
      uvs.push(x / size.x + 0.5, y / size.y + 0.5);
    }
  }

  const count = outline.length;
  for (let ring = 0; ring < rings - 2; ring += 1) {
    for (let point = 0; point < count; point += 1) {
      const next = (point + 1) % count;
      const a = ring * count + point;
      const b = ring * count + next;
      const c = a + count;
      const d = b + count;
      indices.push(a, b, c, b, d, c);
    }
  }

  const back = positions.length / 3;
  positions.push(0, 0, -depth, 0, 0, depth);
  uvs.push(0.5, 0.5, 0.5, 0.5);
  const front = back + 1;
  const lastRing = (rings - 2) * count;
  for (let point = 0; point < count; point += 1) {
    const next = (point + 1) % count;
    indices.push(back, next, point);
    indices.push(lastRing + point, lastRing + next, front);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createVelvetTexture() {
  const random = mulberry32(41);
  const noise = Float32Array.from({ length: 32 * 32 }, random);
  const pixels = new Uint8Array(128 * 128 * 4);
  for (let y = 0; y < 128; y += 1) {
    for (let x = 0; x < 128; x += 1) {
      const cellX = Math.floor(x / 4);
      const cellY = Math.floor(y / 4);
      const blendX = THREE.MathUtils.smoothstep((x % 4) / 4, 0, 1);
      const blendY = THREE.MathUtils.smoothstep((y % 4) / 4, 0, 1);
      const sample = (dx: number, dy: number) =>
        noise[((cellY + dy) % 32) * 32 + ((cellX + dx) % 32)];
      const top = THREE.MathUtils.lerp(sample(0, 0), sample(1, 0), blendX);
      const bottom = THREE.MathUtils.lerp(sample(0, 1), sample(1, 1), blendX);
      const shade =
        237 + Math.round(18 * THREE.MathUtils.lerp(top, bottom, blendY));
      pixels.set([shade, shade, shade, 255], (y * 128 + x) * 4);
    }
  }
  const texture = new THREE.DataTexture(pixels, 128, 128);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

function createStars(count: number) {
  const random = mulberry32(22);
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const phases = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const cool = new THREE.Color("#dce5ff");
  const warm = new THREE.Color("#ffe9d2");
  const white = new THREE.Color("#f4f3f8");

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    positions[offset] = (random() - 0.5) * 20;
    positions[offset + 1] = (random() - 0.5) * 13;
    positions[offset + 2] = -4 - random() * 10;
    sizes[index] = 1 + random() ** 5 * 2.8;
    phases[index] = random();
    const color = index % 12 === 0 ? warm : index % 9 === 0 ? cool : white;
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
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, ambient ? 1.6 : 2),
    );
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
        createStars(window.innerWidth < 700 ? 360 : 720),
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

    let heartGeometry: THREE.BufferGeometry | undefined;
    let velvetTexture: THREE.DataTexture | undefined;
    let heartLayoutScale = 1;
    let camila: THREE.Group | undefined;
    let felipe: THREE.Group | undefined;
    const hearts: Heart[] = [];
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    if (!ambient) {
      heartGeometry = createPuffyHeartGeometry();
      velvetTexture = createVelvetTexture();

      const buildHeart = (color: string, x: number, rotation: number) => {
        const group = new THREE.Group();
        const coreMaterial = new THREE.MeshPhysicalMaterial({
          color,
          roughness: 0.58,
          metalness: 0,
          clearcoat: 0.16,
          clearcoatRoughness: 0.48,
          sheen: 0.8,
          sheenRoughness: 0.85,
          sheenColor: new THREE.Color(color).lerp(
            new THREE.Color("#ffffff"),
            0.35,
          ),
          map: velvetTexture,
          bumpMap: velvetTexture,
          bumpScale: 0.06,
          emissive: new THREE.Color(color),
          emissiveIntensity: 0.04,
        });
        const core = new THREE.Mesh(heartGeometry, coreMaterial);
        const fuzzMaterial = new THREE.ShaderMaterial({
          uniforms: {
            uColor: { value: new THREE.Color(color) },
            uGlow: { value: 1 },
          },
          vertexShader: fuzzVertexShader,
          fragmentShader: fuzzFragmentShader,
          transparent: true,
          depthWrite: false,
          side: THREE.BackSide,
        });
        const fuzz = new THREE.Mesh(heartGeometry, fuzzMaterial);
        fuzz.scale.setScalar(1.025);
        group.add(core, fuzz);
        group.position.set(x, -1.25, 0);
        group.rotation.set(0.12, rotation, rotation * 0.28);
        return {
          group,
          core,
          coreMaterial,
          fuzzMaterial,
          hovered: false,
          hoverAmount: 0,
        };
      };

      const camilaHeart = buildHeart("#7C3AED", -1.22, 0.37);
      const felipeHeart = buildHeart("#FF7A1A", 1.22, -0.37);
      ({ group: camila } = camilaHeart);
      ({ group: felipe } = felipeHeart);
      hearts.push(camilaHeart, felipeHeart);
      scene.add(camila, felipe);
      scene.add(new THREE.AmbientLight("#ffffff", 0.55));
      const keyLight = new THREE.DirectionalLight("#fff6ee", 2.4);
      keyLight.position.set(-2, 4, 6);
      scene.add(keyLight);
      const purpleLight = new THREE.PointLight("#8951ff", 18, 9);
      purpleLight.position.set(-3.4, 1.6, 3.8);
      const orangeLight = new THREE.PointLight("#ff8134", 18, 9);
      orangeLight.position.set(3.4, -0.5, 3.8);
      scene.add(purpleLight, orangeLight);
    }

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      heartLayoutScale = Math.min(1, camera.aspect / 0.85);
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

    const updateHoveredHeart = (event: PointerEvent) => {
      if (reducedMotion || !hearts.length) return;
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(
        hearts.map(({ core }) => core),
        false,
      )[0]?.object;
      hearts.forEach((heart) => {
        heart.hovered = heart.core === hit;
      });
      renderer.domElement.style.cursor = hit ? "pointer" : "";
    };
    const clearHoveredHeart = () => {
      hearts.forEach((heart) => {
        heart.hovered = false;
      });
      renderer.domElement.style.cursor = "";
    };

    if (!ambient) {
      renderer.domElement.addEventListener("pointermove", updateHoveredHeart);
      renderer.domElement.addEventListener("pointerleave", clearHoveredHeart);
    }

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
      const delta = reducedMotion ? 0 : Math.min(clock.getDelta(), 0.05);
      const elapsed = reducedMotion ? 4.2 : clock.elapsedTime;
      time.value = elapsed;
      if (camila && felipe) {
        const embrace = Math.sin(elapsed * 0.35) * 0.12;
        camila.position.x = (-1.22 + embrace) * heartLayoutScale;
        felipe.position.x = (1.22 - embrace) * heartLayoutScale;
        camila.position.y = -1.25 + Math.sin(elapsed * 0.48) * 0.09;
        felipe.position.y = -1.25 + Math.cos(elapsed * 0.44) * 0.09;
        camila.rotation.y = 0.37 + Math.sin(elapsed * 0.35) * 0.1;
        felipe.rotation.y = -0.37 - Math.sin(elapsed * 0.35) * 0.1;
      }
      hearts.forEach((heart) => {
        heart.hoverAmount = THREE.MathUtils.damp(
          heart.hoverAmount,
          heart.hovered ? 1 : 0,
          heart.hovered ? 11 : 7,
          delta,
        );
        const easedHover = THREE.MathUtils.smootherstep(
          heart.hoverAmount,
          0,
          1,
        );
        heart.group.scale.setScalar(heartLayoutScale * (1 + easedHover * 0.14));
        heart.coreMaterial.emissiveIntensity = 0.04 + easedHover * 0.24;
        heart.fuzzMaterial.uniforms.uGlow.value = 1 + easedHover * 1.25;
      });
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
      renderer.domElement.removeEventListener(
        "pointermove",
        updateHoveredHeart,
      );
      renderer.domElement.removeEventListener(
        "pointerleave",
        clearHoveredHeart,
      );
      heartGeometry?.dispose();
      velvetTexture?.dispose();
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
      className={`${styles.canvas} ${ambient ? styles.ambient : styles.interactive}`}
      ref={hostRef}
      aria-hidden="true"
    />
  );
}
