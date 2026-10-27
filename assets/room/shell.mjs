// The engine (renderer, camera, controls, glow) and the room around the stations: floor, walls, ribs,
// skylight, floor paths, hanging ivy, light specks, data streams, light through the window and the main lights.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import { V3, R, H, SPAN0, SPAN, WIN_TH, polar, faceIn, mat, mesh, box, noPick, rnd, leafField, M } from "./kit.mjs";
import { makeFloor, makeBackground } from "./textures.mjs";

export function createEngine(canvas) {
  const coarse = matchMedia("(pointer: coarse)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.6 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.05, 120);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.42, 0.35, 2.6);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const controls = new OrbitControls(camera, canvas);
  Object.assign(controls, {
    enableDamping: true, dampingFactor: 0.08, enablePan: false, rotateSpeed: 0.55,
    minPolarAngle: 0.9, maxPolarAngle: 1.42, minAzimuthAngle: -0.7, maxAzimuthAngle: 0.75,
    minDistance: 4.5, maxDistance: 24,
  });

  const HOME_T = V3(0, 1.55, -0.9), HOME_OFF = V3(1.3, 3.4, 11.4);
  const portrait = () => innerWidth / innerHeight < 0.85;
  const fitFov = () => { camera.fov = portrait() ? 52 : 38; camera.updateProjectionMatrix(); };
  const homeView = () => ({ pos: HOME_OFF.clone().multiplyScalar(portrait() ? 1.5 : 1).add(HOME_T), target: HOME_T.clone() });
  fitFov();
  // the camera starts high and to the side, and flies home when the visitor enters
  camera.position.copy(homeView().pos.sub(HOME_T).multiplyScalar(1.5).applyAxisAngle(V3(0, 1, 0), -0.45).add(V3(0, 3, 0)).add(HOME_T));
  controls.target.copy(HOME_T);
  controls.enabled = false;

  const lowFns = [];
  let low = false;
  return {
    renderer, scene, camera, controls, composer, bloom, coarse, portrait, fitFov, homeView,
    isLow: () => low,
    onLowQuality: (fn) => lowFns.push(fn),
    lowQuality() {
      if (low) return;
      low = true; bloom.enabled = false; renderer.setPixelRatio(1); composer.setPixelRatio(1); composer.setSize(innerWidth, innerHeight);
      lowFns.forEach((fn) => fn());
    },
    resize() { renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; fitFov(); },
    render() { composer.render(); },
  };
}

const flatV = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

export function buildShell(engine) {
  const { scene, renderer } = engine;
  const bg = makeBackground(); bg.draw(new THREE.Color("#fbfdfe"), new THREE.Color("#cfdbe3"));
  scene.background = bg.tex; scene.backgroundIntensity = 1.12;

  // floor: a soft reflection shows through the slightly see-through floor
  const floorM = mat(0xffffff, { map: makeFloor().tex, roughness: 0.28, transparent: true, opacity: 0.84 });
  const floor = mesh(new THREE.CircleGeometry(R + 0.02, 128), floorM, 0, 0.002, 0, scene, false);
  floor.rotation.x = -Math.PI / 2;
  const mirror = noPick(new Reflector(new THREE.CircleGeometry(R + 0.02, 96), { textureWidth: Math.round(innerWidth * 0.5), textureHeight: Math.round(innerHeight * 0.5), color: 0xb8c4cc, multisample: 0 }));
  mirror.rotation.x = -Math.PI / 2; mirror.position.y = -0.004; scene.add(mirror);
  mesh(new THREE.CylinderGeometry(R + 0.02, R - 0.25, 0.5, 128), mat(0xc4d1da, { roughness: 0.4 }), 0, -0.251, 0, scene, false);
  const rim = noPick(new THREE.Mesh(new THREE.TorusGeometry(R + 0.02, 0.02, 8, 200), M.cyan)); rim.rotation.x = Math.PI / 2; rim.position.y = -0.03; scene.add(rim);
  // raised platform under the command table
  mesh(new THREE.CylinderGeometry(1.8, 1.85, 0.08, 96), mat(0xf8fafb, { roughness: 0.25 }), 0, 0.04, 0, scene, false);
  const pr = noPick(new THREE.Mesh(new THREE.TorusGeometry(1.83, 0.012, 6, 140), M.cyan)); pr.rotation.x = Math.PI / 2; pr.position.y = 0.085; scene.add(pr);

  // walls: curved panels with dark seams, a light band, a bench and a ceiling ledge
  mesh(new THREE.CylinderGeometry(R + 0.05, R + 0.05, H, 128, 1, true, SPAN0, SPAN), M.seam, 0, H / 2, 0, scene, false);
  const NP = 15, segA = SPAN / NP, gap = 0.005;
  for (let i = 0; i < NP; i++) {
    const a0 = SPAN0 + i * segA + gap, al = segA - 2 * gap;
    mesh(new THREE.CylinderGeometry(R, R, 2.5, 10, 1, true, a0, al), M.wall, 0, 1.7, 0, scene, false);
    mesh(new THREE.CylinderGeometry(R, R, 0.34, 10, 1, true, a0, al), M.wall, 0, 3.23, 0, scene, false);
    if (i % 3 === 0 && i) { const s = noPick(box(0.014, 2.3, 0.014, M.strip, 0, 1.75, 0, scene)); s.position.copy(polar(a0 - gap, R - 0.02, 1.75)); s.castShadow = false; }
  }
  const band = noPick(new THREE.Mesh(new THREE.CylinderGeometry(R - 0.02, R - 0.02, 0.06, 160, 1, true, SPAN0, SPAN), M.strip)); band.position.y = 3.0; scene.add(band);
  mesh(new THREE.CylinderGeometry(R - 0.4, R - 0.4, 0.42, 160, 1, true, SPAN0 + 0.01, SPAN - 0.02), M.wall, 0, 0.24, 0, scene, false);
  const bt = mesh(new THREE.RingGeometry(R - 0.4, R + 0.02, 160, 1, SPAN0 - Math.PI / 2, SPAN), mat(0xfafcfd, { roughness: 0.3, side: THREE.DoubleSide }), 0, 0.45, 0, scene, false); bt.rotation.x = -Math.PI / 2;
  const bglow = noPick(new THREE.Mesh(new THREE.CylinderGeometry(R - 0.39, R - 0.39, 0.025, 160, 1, true, SPAN0 + 0.01, SPAN - 0.02), M.cyan)); bglow.position.y = 0.035; scene.add(bglow);
  const ledge = mesh(new THREE.RingGeometry(R - 0.72, R + 0.05, 160, 1, SPAN0 - Math.PI / 2, SPAN), mat(0xf6f9fb, { roughness: 0.35, side: THREE.DoubleSide }), 0, H, 0, scene); ledge.rotation.x = -Math.PI / 2;
  mesh(new THREE.CylinderGeometry(R - 0.72, R - 0.72, 0.16, 160, 1, true, SPAN0, SPAN), M.wall, 0, H - 0.08, 0, scene, false);
  const lglow = noPick(new THREE.Mesh(new THREE.CylinderGeometry(R - 0.73, R - 0.73, 0.03, 160, 1, true, SPAN0, SPAN), M.strip)); lglow.position.y = H - 0.17; scene.add(lglow);
  [SPAN0, SPAN0 + SPAN].forEach((th) => { const e = box(0.16, H + 0.02, 0.8, M.white2, 0, 0, 0, scene); e.position.copy(polar(th, R - 0.32, H / 2)); e.rotation.y = th; });
  const halo = noPick(new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.04, 10, 120), M.strip)); halo.rotation.x = Math.PI / 2; halo.position.y = 4.36; scene.add(halo);
  // cables on the floor, from the table to the wall
  [[V3(0.7, 0.03, -0.75), V3(1.5, 0.03, -1.9), V3(1.0, 0.03, -3.5), polar(Math.PI - 0.24, R - 0.42, 0.04)],
   [V3(-0.75, 0.03, -0.7), V3(-1.7, 0.03, -1.6), V3(-1.4, 0.03, -3.6), polar(Math.PI + 0.3, R - 0.42, 0.04)],
   [V3(0.95, 0.03, 0.2), V3(2.4, 0.03, 0.5), V3(3.3, 0.03, -0.2), polar(Math.PI - 1.12, 3.3, 0.04)]].forEach((pts) => {
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.028, 8), mat(0x3b4954, { roughness: 0.5 }), 0, 0, 0, scene, false);
  });

  // hanging ivy from the ceiling ledge
  {
    const leaves = [], stems = [];
    [Math.PI - 1.9, Math.PI - 1.0, Math.PI - 0.62, Math.PI + 0.62, Math.PI + 0.95].forEach((th) => {
      { const pl = box(0.9, 0.16, 0.34, M.white, 0, 0, 0, scene); pl.position.copy(polar(th, R - 0.5, H + 0.08)); faceIn(pl, th); }
      for (let k = 0; k < 7; k++) {
        const a = polar(th + (rnd() - 0.5) * 0.16, R - 0.66 + rnd() * 0.12, H - 0.12), len = 0.45 + rnd() * 1.05, off = rnd() * 6, steps = 16, pts = [];
        for (let s = 0; s <= steps; s++) { const t = s / steps; pts.push(a.clone().add(V3(Math.sin(t * 5 + off) * 0.07 * t, -t * len, Math.cos(t * 4 + off) * 0.06 * t))); }
        for (let s = 0; s < steps; s++) stems.push(pts[s], pts[s + 1]);
        for (let s = 1; s <= steps; s++) for (let j = 0; j < 2; j++)
          leaves.push({ p: pts[s].clone().add(V3((rnd() - 0.5) * 0.1, (rnd() - 0.5) * 0.05, (rnd() - 0.5) * 0.1)), rx: Math.PI + (rnd() - 0.5) * 0.9, ry: rnd() * Math.PI * 2, rz: (rnd() - 0.5) * 0.8, s: 0.06 + rnd() * 0.05, h: 0.3 + rnd() * 0.05, l: 0.3 + rnd() * 0.12 });
      }
      for (let k = 0; k < 40; k++) leaves.push({ p: polar(th + (rnd() - 0.5) * 0.17, R - 0.5 + (rnd() - 0.5) * 0.25, H + 0.15 + rnd() * 0.1), rx: -0.6 + rnd() * 0.5, ry: rnd() * 6.3, rz: (rnd() - 0.5), s: 0.07 + rnd() * 0.05, h: 0.31, l: 0.32 + rnd() * 0.1 });
    });
    scene.add(noPick(leafField(leaves, mat(0xffffff, { roughness: 0.6, side: THREE.DoubleSide }))));
    scene.add(noPick(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(stems), new THREE.LineBasicMaterial({ color: 0x2f6b3a }))));
  }

  // ribs over the room meet at a glowing ring with a skylight
  const hubY = 4.45;
  const hub = mesh(new THREE.TorusGeometry(1.5, 0.08, 14, 120), M.white, 0, hubY, 0, scene); hub.rotation.x = Math.PI / 2;
  const skylightMat = new THREE.MeshBasicMaterial({ color: 0x4f93d4, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
  const sky = noPick(new THREE.Mesh(new THREE.CircleGeometry(1.46, 64), skylightMat)); sky.rotation.x = -Math.PI / 2; sky.position.y = hubY + 0.01; scene.add(sky);
  [-1.55, -0.78, 0, 0.78, 1.55].forEach((d) => {
    const th = Math.PI + d, a = polar(th, R - 0.05, H), c = polar(th, R - 1.4, H + 1.25), b = polar(th, 1.55, hubY), dn = V3(0, -0.065, 0);
    mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, c, b), 40, 0.055, 10), M.white, 0, 0, 0, scene);
    noPick(mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a.clone().add(dn), c.clone().add(dn), b.clone().add(dn)), 40, 0.012, 6), M.strip, 0, 0, 0, scene, false));
  });

  // glowing paths in the floor, from the entrance to the stations
  const pathMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } }, vertexShader: flatV,
    fragmentShader: `uniform float uTime; varying vec2 vUv;
      void main() { float p = fract(vUv.x * 0.9 - uTime * 0.35); float pulse = smoothstep(0.0, 0.06, p) * (1.0 - smoothstep(0.06, 0.3, p));
        float edge = 1.0 - abs(vUv.y - 0.5) * 2.0; gl_FragColor = vec4(vec3(0.5, 0.89, 1.0) * (1.4 + pulse * 2.5), (0.22 + pulse * 0.7) * smoothstep(0.0, 0.4, edge)); }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const floorPath = (pts, w = 0.07) => {
    const curve = new THREE.CatmullRomCurve3(pts), n = 80, len = curve.getLength(), pos = [], uv = [], idx = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, q = curve.getPointAt(u), tg = curve.getTangentAt(u), l = Math.hypot(tg.x, tg.z) || 1, nx = -tg.z / l * w / 2, nz = tg.x / l * w / 2;
      pos.push(q.x + nx, 0.012, q.z + nz, q.x - nx, 0.012, q.z - nz); uv.push(u * len, 0, u * len, 1);
      if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    const m = noPick(new THREE.Mesh(g, pathMat)); m.renderOrder = 1; scene.add(m);
  };
  floorPath([V3(0.5, 0, 5.0), V3(0.3, 0, 3.4), V3(0, 0, 1.95)]);
  floorPath([V3(0.4, 0, 3.7), V3(0.9, 0, 2.5), V3(1.55, 0, 1.6)]);
  floorPath([V3(0.2, 0, 3.7), V3(-1.4, 0, 2.7), V3(-2.6, 0, 0.9)]);

  // data streaming along the upper wall
  const streamMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } }, vertexShader: flatV,
    fragmentShader: `uniform float uTime; varying vec2 vUv; float h(float n) { return fract(sin(n) * 43758.5453); }
      void main() { float lanes = 3.0, lane = floor(vUv.y * lanes), dir = mod(lane, 2.0) * 2.0 - 1.0;
        float x = vUv.x * 240.0 + uTime * (6.0 + h(lane) * 8.0) * dir, cell = floor(x), f = fract(x), ly = fract(vUv.y * lanes);
        float a = step(0.55, h(cell + lane * 31.0)) * step(0.15, f) * step(f, 0.85) * step(0.3, ly) * step(ly, 0.7) * 0.8;
        gl_FragColor = vec4(vec3(0.5, 0.89, 1.0) * 2.0, a); }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  { const st = noPick(new THREE.Mesh(new THREE.CylinderGeometry(R - 0.03, R - 0.03, 0.2, 200, 1, true, SPAN0, SPAN), streamMat)); st.position.y = 3.22; scene.add(st); }

  // drifting specks of light
  const moteMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uAlpha: { value: 0.5 }, uSize: { value: 2.4 * renderer.getPixelRatio() } },
    vertexShader: `attribute float aPhase; uniform float uTime, uSize; varying float vA;
      void main() { vec3 q = position; float ph = aPhase * 6.2831;
        q.x += sin(uTime * 0.13 + ph) * 0.35; q.y += sin(uTime * 0.09 + ph * 1.7) * 0.25; q.z += cos(uTime * 0.11 + ph) * 0.35;
        vec4 mv = modelViewMatrix * vec4(q, 1.0); vA = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * 0.8 + ph * 3.0));
        gl_PointSize = uSize * (8.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uAlpha; varying float vA; void main() { float r = length(gl_PointCoord - 0.5); if (r > 0.5) discard; gl_FragColor = vec4(vec3(1.0, 0.98, 0.92) * 1.3, smoothstep(0.5, 0.0, r) * vA * uAlpha); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  {
    const n = 260, pos = new Float32Array(n * 3), ph = new Float32Array(n);
    for (let i = 0; i < n; i++) { const r = Math.sqrt(rnd()) * 4.6, a = rnd() * Math.PI * 2; pos.set([Math.sin(a) * r, 0.3 + rnd() * 3.3, Math.cos(a) * r], i * 3); ph[i] = rnd(); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("aPhase", new THREE.BufferAttribute(ph, 1));
    scene.add(noPick(new THREE.Points(g, moteMat)));
  }

  // light falling through the window, strongest at sunrise and sunset
  const shaftMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(1, 0.95, 0.85) }, uAlpha: { value: 0 }, uTime: { value: 0 } }, vertexShader: flatV,
    fragmentShader: `uniform vec3 uColor; uniform float uAlpha, uTime; varying vec2 vUv;
      void main() { float edge = smoothstep(0.0, 0.3, vUv.x) * (1.0 - smoothstep(0.7, 1.0, vUv.x)); float fade = smoothstep(0.0, 0.12, vUv.y) * (1.0 - vUv.y * 0.8);
        gl_FragColor = vec4(uColor * 1.4, edge * fade * uAlpha * 0.3 * (0.85 + 0.15 * sin(uTime * 0.7 + vUv.x * 6.0))); }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  });
  {
    const inward = V3(-Math.sin(WIN_TH), 0, -Math.cos(WIN_TH)), along = V3(-inward.z, 0, inward.x);
    [[-0.18, 2.5, 4.3], [0.16, 1.4, 3.1]].forEach(([d, y, reach]) => {
      const s0 = polar(WIN_TH + d, R - 0.15, y), e0 = s0.clone().addScaledVector(inward, reach).add(V3(0, -y, 0)).addScaledVector(along, 0.6);
      const w0 = 0.55, w1 = 0.8, pts = [s0.clone().addScaledVector(along, w0), s0.clone().addScaledVector(along, -w0), e0.clone().addScaledVector(along, -w1), e0.clone().addScaledVector(along, w1)];
      const g = new THREE.BufferGeometry().setFromPoints(pts); g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)); g.setIndex([0, 1, 2, 0, 2, 3]);
      const m = noPick(new THREE.Mesh(g, shaftMat)); m.renderOrder = 5; scene.add(m);
    });
  }

  // the main lights
  const hemi = new THREE.HemisphereLight(0xf4f9ff, 0x9fb0bd, 1.05); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(-4, 10, 7); key.target.position.set(0, 0, -1); scene.add(key, key.target);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 });
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  const sun = new THREE.DirectionalLight(0xffffff, 0); sun.position.copy(polar(WIN_TH, 12, 5)); sun.target.position.set(1, 0, 0.5); scene.add(sun, sun.target);

  engine.onLowQuality(() => { mirror.visible = false; floorM.opacity = 1; });

  return {
    lights: { hemi, key, sun },
    // the parts of a time-of-day mood (from time.mjs) that belong to the room itself
    applyMood(m) {
      const c = (hex) => new THREE.Color(hex);
      key.color.copy(c(m.lightC)); key.intensity = m.key; hemi.intensity = m.hemi;
      sun.color.copy(c(m.lightC)); sun.intensity = m.shaft * 2.2;
      shaftMat.uniforms.uColor.value.copy(c(m.lightC)); shaftMat.uniforms.uAlpha.value = m.shaft;
      skylightMat.color.copy(c(m.top)).lerp(c(m.bot), 0.35);
      moteMat.uniforms.uAlpha.value = 0.3 + m.shaft * 0.9 + (1 - m.day) * 0.2;
      bg.draw(c(m.bgTop), c(m.bgBot));
    },
    update(t) { moteMat.uniforms.uTime.value = t; streamMat.uniforms.uTime.value = t; pathMat.uniforms.uTime.value = t; shaftMat.uniforms.uTime.value = t; },
  };
}
