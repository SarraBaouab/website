// Shared building blocks for the room: sizes, placement, materials, holographic shaders and leaves.
import * as THREE from "three";

export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
// The room is a cut-away cylinder: radius R, wall height H, walls from angle SPAN0 over SPAN radians.
export const R = 5.2, H = 3.4, SPAN0 = Math.PI - 1.95, SPAN = 3.9;
// Where things stand, by angle around the room (0 points at the visitor) or position.
export const WIN_TH = Math.PI + 1.32, IVY_TH = Math.PI + 1.85, LOG_TH = Math.PI - 1.42, CV_TH = Math.PI - 1.12;
export const LNG = V3(2.55, 0, 2.45);

export const polar = (th, r, y = 0) => V3(r * Math.sin(th), y, r * Math.cos(th));
export const faceIn = (o, th) => { o.rotation.y = th + Math.PI; return o; };
export const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0, envMapIntensity: 0.38, ...o });
export const glowMat = (color, k = 4) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k) });
export function mesh(geo, material, x, y, z, parent, shadow = true) {
  const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m;
}
export const box = (w, h, d, material, x, y, z, parent) => mesh(new THREE.BoxGeometry(w, h, d), material, x, y, z, parent);
export const cyl = (rt, rb, h, material, x, y, z, parent, seg = 48) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material, x, y, z, parent);
export function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; if (draw) draw(c.getContext("2d"), c);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return { tex: t, canvas: c, g: c.getContext("2d") };
}
export const mirrorX = (t) => { t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; t.offset.x = 1; return t; };
export function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
export const noPick = (o) => { o.raycast = () => {}; return o; };
// a curved screen or panel set into the wall, centred on angle thC
export function wallScreen(thC, span, y0, h, tex, r = R - 0.08) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 48, 1, true, thC - span / 2, span),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, color: new THREE.Color(1.3, 1.3, 1.3) }));
  m.position.y = y0 + h / 2; m.userData.screen = true; return m;
}

let seed = 11;
export const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

export const C = { white: 0xf3f7f9, white2: 0xe8eef2, steel: 0xb9c6cf, dark: 0x2b3843, glow: 0x7fe3ff, leaf: 0x46b85a, amber: 0xffcf7a };
export const M = {
  wall: mat(C.white, { roughness: 0.42, side: THREE.DoubleSide }), seam: mat(0x8d9eab, { roughness: 0.7, side: THREE.DoubleSide }),
  white: mat(C.white, { roughness: 0.3 }), white2: mat(C.white2, { roughness: 0.35 }), dark: mat(C.dark, { roughness: 0.4 }),
  strip: glowMat(0xc9f4ff, 4.2), cyan: glowMat(C.glow, 3.6),
};

export function holoMaterial(color, deep, gain = 1.3, base = 0.14) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uDeep: { value: new THREE.Color(deep) }, uHover: { value: 0 }, uFire: { value: 0 }, uGain: { value: gain }, uBase: { value: base } },
    vertexShader: `attribute float aGroove; varying float vG; varying vec3 vN; varying vec3 vV; varying vec3 vW;
      void main() { vG = aGroove; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: `uniform float uTime, uHover, uFire, uGain, uBase; uniform vec3 uColor, uDeep; varying float vG; varying vec3 vN, vV, vW;
      void main() {
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
        float scan = 0.78 + 0.22 * sin(vW.y * 140.0 - uTime * 6.0);
        float ph = fract(vW.y * 1.3 - uTime * 0.32);
        float band = smoothstep(0.0, 0.02, ph) * (1.0 - smoothstep(0.02, 0.07, ph));
        vec3 col = mix(uColor, uDeep, clamp(vG, 0.0, 1.0) * 0.8);
        float a = (uBase + f * 0.6 + vG * 0.4 + band * 0.35) * scan * (0.85 + 0.3 * uHover + 0.3 * uFire);
        vec3 c = col * uGain * (0.55 + f * 0.9 + band * 1.2 + uHover * 0.35 + uFire * 0.5);
        gl_FragColor = vec4(c, clamp(a, 0.0, 0.95));
      }`,
    transparent: true, depthWrite: false,
  });
}
export function sparkMaterial(color, size, pixelRatio = 1) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uRate: { value: 1.3 }, uSize: { value: size * pixelRatio }, uColor: { value: new THREE.Color(color) } },
    vertexShader: `attribute float aPhase; uniform float uTime, uRate, uSize; varying float vA;
      void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); float s = sin(uTime * uRate * (0.6 + aPhase) + aPhase * 40.0);
        vA = pow(max(s, 0.0), 14.0); gl_PointSize = uSize * (0.5 + vA * 1.8) * (6.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; varying float vA; void main() { float r = length(gl_PointCoord - 0.5); if (r > 0.5) discard;
        gl_FragColor = vec4(uColor * (0.8 + vA * 2.5), smoothstep(0.5, 0.0, r) * (0.18 + vA * 0.8)); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}
export const withGroove = (g, arr) => { g.setAttribute("aGroove", new THREE.BufferAttribute(arr || new Float32Array(g.attributes.position.count), 1)); return g; };

const leafShape = new THREE.Shape([[0, 0], [0.3, 0.16], [0.5, 0.44], [0.27, 0.5], [0.2, 0.8], [0, 1], [-0.2, 0.8], [-0.27, 0.5], [-0.5, 0.44], [-0.3, 0.16]].map(([x, y]) => new THREE.Vector2(x, y)));
export const leafGeo = new THREE.ShapeGeometry(leafShape);
export function leafField(list, material) {
  const im = new THREE.InstancedMesh(leafGeo, material, list.length), d = new THREE.Object3D(), c = new THREE.Color();
  list.forEach((L, i) => { d.position.copy(L.p); d.rotation.set(L.rx, L.ry, L.rz); d.scale.setScalar(L.s); d.updateMatrix(); im.setMatrixAt(i, d.matrix); im.setColorAt(i, c.setHSL(L.h, 0.6, L.l)); });
  im.castShadow = true; im.receiveShadow = true; return im;
}
