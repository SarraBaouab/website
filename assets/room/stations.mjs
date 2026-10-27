// The stations in the room: the brain hologram in its bay, the command table with the globe, the main screen,
// the mission log, the window over Frankfurt, the two consoles, the CV dock, the plants and the lounge.
// Each station a visitor can tap is a group tagged with its id (userData.hot) and its tooltip (userData.label).
import * as THREE from "three";
import {
  V3, R, H, WIN_TH, IVY_TH, LOG_TH, CV_TH, LNG, polar, faceIn, mat, glowMat, mesh, box, cyl, noPick, wallScreen, rnd,
  C, M, holoMaterial, sparkMaterial, withGroove, leafField,
} from "./kit.mjs";
import {
  makeMainScreen, makeLog, makeWindow, makeConsole, makeTraining, makeCvScreen, makePaper, makeTableTop, makeTiles, makeFrond, makePuff,
} from "./textures.mjs";
import { PLACES, STATIONS } from "./content.mjs";

// the brain has its own bay in front of the window; the globe sits on the command table
const BR = { at: polar(Math.PI + 1.3, 3.3), y: 1.97, s: 0.92 };

function viewToward(target, dist, lift = 0.35) { const dir = V3(-target.x, 0, -target.z).normalize(); const pos = target.clone().addScaledVector(dir, dist); pos.y += lift; return { pos, target: target.clone() }; }

export function buildStations(engine) {
  const { scene, renderer } = engine;
  const hot = new Map();
  const label = Object.fromEntries(STATIONS.map((s) => [s.id, s.label]));
  const tag = (id, group) => { group.userData.hot = id; group.userData.label = label[id]; hot.set(id, group); if (!group.parent) scene.add(group); return group; };

  const mainTex = makeMainScreen(), logTex = makeLog(), winTex = makeWindow(), consoleTex = makeConsole(), trainTex = makeTraining();
  const cvScreenTex = makeCvScreen(), paperTex = makePaper(), tableTex = makeTableTop();

  /* ---------------------------------------------------------------- the brain hologram */
  const brainHot = new THREE.Group(); brainHot.position.copy(BR.at);
  const brain = new THREE.Group(); brain.position.set(0, BR.y, 0); brain.scale.setScalar(BR.s); brain.rotation.y = 0.9; brainHot.add(brain);
  function hemisphere(side) {
    const g = new THREE.SphereGeometry(1, 140, 100), p = g.attributes.position, n = p.count, groove = new Float32Array(n), v = V3(0, 0, 0), q = V3(0, 0, 0);
    for (let i = 0; i < n; i++) {
      v.fromBufferAttribute(p, i);
      const lateral = v.x * side;
      let x = v.x * 0.46, y = v.y * 0.47, z = v.z * 0.78;
      if (lateral < 0) x = -side * 0.155 * Math.tanh(Math.abs(v.x) * 0.46 / 0.155);   // flat medial wall
      if (y < -0.1) y = -0.1 + (y + 0.1) * 0.62;                          // flatter base
      const tl = Math.exp(-((v.z - 0.12) ** 2) / 0.1 - ((v.y + 0.55) ** 2) / 0.06) * (lateral > 0 ? 1 : 0.4);
      y -= tl * 0.1; x += side * tl * 0.03;                               // temporal lobe
      z -= Math.max(0, v.y) * Math.max(0, v.z) * 0.06;
      const s1 = Math.sin(v.x * 8.5 + side * 0.7 + Math.sin(v.z * 5.5) * 1.7 + Math.sin(v.y * 6.5) * 0.9);
      const s2 = Math.sin(v.y * 9.5 + Math.sin(v.x * 6.5 + side) * 1.5 + v.z * 3.0);
      const s3 = Math.sin(v.z * 10.5 + Math.sin(v.y * 7.5) * 1.6 + v.x * 2.0);
      let gr = 1 - THREE.MathUtils.smoothstep(Math.abs((s1 + s2 + s3) / 3), 0, 0.15);
      // the lateral and central sulci
      if (lateral > 0.2 && v.z > -0.35 && v.z < 0.7) gr = Math.max(gr, Math.exp(-((v.y + 0.18 - v.z * 0.32) ** 2) / 0.003) * 1.4);
      if (v.y > 0.05) gr = Math.max(gr, Math.exp(-((v.z - 0.02 + v.y * 0.28) ** 2) / 0.0025));
      if (lateral < -0.2) gr *= 0.35;
      groove[i] = Math.min(1, gr);
      q.set(x, y, z); const len = q.length(); q.multiplyScalar((len - 0.04 * Math.min(1, gr)) / len);
      p.setXYZ(i, q.x + side * 0.16, q.y, q.z);
    }
    withGroove(g, groove); g.computeVertexNormals(); return g;
  }
  const brainShell = holoMaterial(0x4fd2ff, 0x0a6ea8);
  const hemis = [-1, 1].map((side) => { const m = new THREE.Mesh(hemisphere(side), brainShell); m.renderOrder = 2; brain.add(m); return m; });
  {
    const g = new THREE.SphereGeometry(1, 72, 54), p = g.attributes.position, groove = new Float32Array(p.count), v = V3(0, 0, 0);
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i); const gr = Math.max(0, Math.sin(v.y * 34)) ** 6 * 0.8 + Math.exp(-(v.x * v.x) / 0.004) * 0.6;
      groove[i] = Math.min(1, gr); const k = 1 - 0.03 * gr; p.setXYZ(i, v.x * 0.36 * k, v.y * 0.2 * k, v.z * 0.27 * k);
    }
    withGroove(g, groove); g.computeVertexNormals();
    const cb = new THREE.Mesh(g, brainShell); cb.position.set(0, -0.3, -0.5); cb.renderOrder = 2; brain.add(cb);
    const stem = new THREE.Mesh(withGroove(new THREE.CylinderGeometry(0.075, 0.055, 0.45, 24)), brainShell); stem.position.set(0, -0.48, -0.26); stem.rotation.x = -0.35; brain.add(stem);
    // the hippocampus in each temporal lobe
    [-1, 1].forEach((side) => {
      const curve = new THREE.CatmullRomCurve3([V3(side * 0.24, -0.1, -0.34), V3(side * 0.29, -0.19, -0.14), V3(side * 0.31, -0.26, 0.04), V3(side * 0.29, -0.3, 0.17)]);
      brain.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.03, 8), glowMat(0x6dffae, 1.5)));
    });
  }
  const brainSparks = sparkMaterial(0xbff4ff, 4, renderer.getPixelRatio());
  {
    const src = hemis.map((h) => h.geometry.attributes.position), pts = [], ph = [];
    src.forEach((a) => { for (let i = 0; i < a.count; i += 43) { pts.push(a.getX(i), a.getY(i), a.getZ(i)); ph.push(rnd()); } });
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3)); g.setAttribute("aPhase", new THREE.Float32BufferAttribute(ph, 1));
    const sp = noPick(new THREE.Points(g, brainSparks)); sp.renderOrder = 3; brain.add(sp);
  }
  // the brain's pedestal and the projector beam under it
  cyl(0.3, 0.38, 0.9, M.white, 0, 0.45, 0, brainHot);
  { const d = noPick(new THREE.Mesh(new THREE.CircleGeometry(0.22, 40), M.strip)); d.rotation.x = -Math.PI / 2; d.position.y = 0.905; brainHot.add(d); }
  const beamMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uBoost: { value: 0 }, uColor: { value: new THREE.Color(0x7fe3ff) } },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uTime, uBoost; uniform vec3 uColor; varying vec2 vUv;
      void main() { float a = pow(1.0 - vUv.y, 1.6) * 0.13 * (0.82 + 0.18 * sin(vUv.y * 46.0 - uTime * 3.0)) * (0.8 + 0.6 * uBoost); gl_FragColor = vec4(uColor * (1.3 + uBoost), a); }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  { const beamBot = 0.91, beamH = BR.y - 0.3 * BR.s - beamBot; const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.8 * BR.s, 0.22, beamH, 64, 1, true), beamMat); beam.position.y = beamBot + beamH / 2; beam.renderOrder = 1; brainHot.add(beam); }
  tag("brain", brainHot);

  /* ---------------------------------------------------------------- the command table */
  const tableG = new THREE.Group();
  let tableTop;
  {
    const tg = tableG;
    cyl(1.0, 1.15, 0.7, M.white, 0, 0.43, 0, tg, 96);
    cyl(1.24, 1.24, 0.06, mat(0xffffff, { roughness: 0.2 }), 0, 0.81, 0, tg, 96);
    const tr = noPick(new THREE.Mesh(new THREE.TorusGeometry(1.17, 0.015, 6, 120), M.cyan)); tr.rotation.x = Math.PI / 2; tr.position.y = 0.6; tg.add(tr);
    tableTop = new THREE.Mesh(new THREE.CircleGeometry(1.06, 96), new THREE.MeshBasicMaterial({ map: tableTex.tex, color: new THREE.Color(1.5, 1.5, 1.5) }));
    tableTop.rotation.x = -Math.PI / 2; tableTop.position.y = 0.842; tableTop.userData.screen = true; tg.add(tableTop);
    cyl(0.3, 0.36, 0.1, M.white2, 0, 0.9, 0, tg);
    const lens = noPick(new THREE.Mesh(new THREE.CircleGeometry(0.24, 40), M.strip)); lens.rotation.x = -Math.PI / 2; lens.position.y = 0.952; tg.add(lens);
  }

  /* ---------------------------------------------------------------- the main screen on the back wall */
  const screenG = new THREE.Group();
  {
    const bez = mesh(new THREE.CylinderGeometry(R - 0.05, R - 0.05, 1.78, 64, 1, true, Math.PI - 0.535, 1.07), mat(0x27333d, { roughness: 0.35, side: THREE.DoubleSide }), 0, 1.86, 0, screenG, false);
    bez.userData.noGlow = true;
    screenG.add(wallScreen(Math.PI, 1.0, 1.06, 1.6, mainTex.tex));
    const under = noPick(new THREE.Mesh(new THREE.CylinderGeometry(R - 0.09, R - 0.09, 0.02, 64, 1, true, Math.PI - 0.5, 1.0), M.cyan)); under.position.y = 0.92; screenG.add(under);
  }
  const scanStrip = noPick(new THREE.Mesh(new THREE.CylinderGeometry(R - 0.1, R - 0.1, 0.05, 64, 1, true, Math.PI - 0.5, 1.0),
    new THREE.MeshBasicMaterial({ color: 0x7fe3ff, transparent: true, opacity: 0.12, side: THREE.BackSide, depthWrite: false })));
  screenG.add(scanStrip);
  tag("screen", screenG);

  /* ---------------------------------------------------------------- the mission log (experience) */
  const logG = new THREE.Group();
  mesh(new THREE.CylinderGeometry(R - 0.05, R - 0.05, 1.12, 48, 1, true, LOG_TH - 0.3, 0.6), mat(0x27333d, { roughness: 0.35, side: THREE.DoubleSide }), 0, 1.79, 0, logG, false);
  logG.add(wallScreen(LOG_TH, 0.56, 1.25, 1.0, logTex.tex));
  tag("log", logG);

  /* ---------------------------------------------------------------- the window over Frankfurt */
  const winG = new THREE.Group();
  {
    winG.add(wallScreen(WIN_TH, 0.6, 0.85, 1.9, winTex.tex, R - 0.06));
    const fr = mat(0xf7fafc, { roughness: 0.3, side: THREE.DoubleSide });
    [[0.82, 0.07], [2.75, 0.07]].forEach(([y, h]) => mesh(new THREE.CylinderGeometry(R - 0.1, R - 0.1, h, 48, 1, true, WIN_TH - 0.32, 0.64), fr, 0, y + h / 2, 0, winG, false));
    [-0.3, 0.3, 0].forEach((d) => { const b = box(d ? 0.08 : 0.035, 1.92, 0.1, fr, 0, 0, 0, winG); b.position.copy(polar(WIN_TH + d, R - 0.1, 1.8)); b.rotation.y = WIN_TH + d; b.castShadow = false; });
  }
  tag("window", winG);

  /* ---------------------------------------------------------------- the holographic globe on the command table */
  const globeG = new THREE.Group();
  const globeSpin = new THREE.Group(), PINS = {};
  const globeShell = holoMaterial(0x4fd2ff, 0x0a6ea8, 1.2, 0.07);
  {
    const tilt = new THREE.Group(); tilt.position.y = 1.45; tilt.rotation.z = 0.41; tilt.scale.setScalar(0.62); globeG.add(tilt); tilt.add(globeSpin);
    const r = 0.55;
    globeSpin.add(new THREE.Mesh(withGroove(new THREE.SphereGeometry(r, 48, 36)), globeShell));
    const LAND = [[-100, 45, 35, 22], [-85, 18, 12, 9], [-42, 72, 13, 8], [-150, 63, 13, 7], [-60, -14, 17, 24], [-68, -42, 8, 12], [15, 50, 18, 10], [18, 64, 8, 8], [-4, 40, 5, 4],
      [-2, 54, 3, 4], [18, 8, 21, 27], [8, 25, 26, 10], [42, 8, 6, 7], [90, 52, 52, 18], [78, 20, 9, 11], [102, 14, 8, 9], [45, 24, 10, 8], [112, 32, 14, 12], [138, 37, 3, 6],
      [115, -3, 15, 4], [134, -25, 17, 11], [47, -19, 3, 6], [172, -42, 3, 5]];
    const isLand = (lon, lat) => lat < -72 || LAND.some(([cx, cy, rx, ry]) => ((lon - cx) / rx) ** 2 + ((lat - cy) / ry) ** 2 < 1);
    const ll = (lon, lat, rad = r) => { const a = THREE.MathUtils.degToRad(lat), b = THREE.MathUtils.degToRad(lon); return V3(rad * Math.cos(a) * Math.sin(b), rad * Math.sin(a), rad * Math.cos(a) * Math.cos(b)); };
    const pts = [], N = 5200, gold = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2, rr2 = Math.sqrt(1 - y * y), ph = i * gold, x = Math.cos(ph) * rr2, z = Math.sin(ph) * rr2;
      if (isLand(THREE.MathUtils.radToDeg(Math.atan2(x, z)), THREE.MathUtils.radToDeg(Math.asin(y)))) pts.push(x * r * 1.005, y * r * 1.005, z * r * 1.005);
    }
    const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    globeSpin.add(noPick(new THREE.Points(lg, new THREE.PointsMaterial({ color: new THREE.Color(0x0b8fc4).multiplyScalar(1.6), size: 0.024, transparent: true, opacity: 0.95, depthWrite: false }))));
    const lines = [];
    for (let lat = -60; lat <= 60; lat += 30) for (let lon = 0; lon < 360; lon += 6) lines.push(...ll(lon, lat).toArray(), ...ll(lon + 6, lat).toArray());
    for (let lon = 0; lon < 360; lon += 30) for (let lat = -84; lat < 84; lat += 6) lines.push(...ll(lon, lat).toArray(), ...ll(lon, lat + 6).toArray());
    const lgeo = new THREE.BufferGeometry(); lgeo.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
    globeSpin.add(noPick(new THREE.LineSegments(lgeo, new THREE.LineBasicMaterial({ color: 0x5fcbef, transparent: true, opacity: 0.4 }))));
    const pinM = glowMat(C.amber, 3);
    const at = Object.fromEntries(PLACES.map((pl) => [pl.id, ll(pl.lon, pl.lat, r * 1.02)]));
    Object.entries(at).forEach(([id, p]) => { const s = noPick(new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 10), pinM)); s.position.copy(p); globeSpin.add(s); PINS[id] = s; });
    [["tn", "de"], ["de", "sh"]].forEach(([a, b]) => {
      const mid = at[a].clone().add(at[b]).multiplyScalar(0.5).setLength(r * (1.12 + at[a].distanceTo(at[b]) * 0.35));
      const arc = new THREE.QuadraticBezierCurve3(at[a], mid, at[b]);
      globeSpin.add(noPick(new THREE.Line(new THREE.BufferGeometry().setFromPoints(arc.getPoints(40)), new THREE.LineBasicMaterial({ color: new THREE.Color(C.amber).multiplyScalar(2.5) }))));
    });
    const orbit = noPick(new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.006, 6, 120), M.cyan)); orbit.rotation.set(1.2, 0.3, 0); tilt.add(orbit);
    globeSpin.rotation.y = -0.4;
  }
  tag("globe", globeG);
  globeG.add(tableG);

  /* ---------------------------------------------------------------- the interview console (forensic) and the training bay (clinical) */
  function consoleDesk(th, tex, id) {
    const g = new THREE.Group(); g.position.copy(polar(th, 3.7)); faceIn(g, th);
    box(1.3, 0.72, 0.46, M.white, 0, 0.36, -0.05, g);
    box(1.56, 0.06, 0.72, mat(0xffffff, { roughness: 0.22 }), 0, 0.75, 0.02, g);
    const edge = noPick(box(1.5, 0.018, 0.018, M.cyan, 0, 0.73, 0.385, g)); edge.castShadow = false;
    box(0.1, 0.5, 0.08, M.white2, 0, 1.0, -0.24, g);
    const frame = box(1.36, 0.72, 0.05, mat(0x27333d, { roughness: 0.35 }), 0, 1.34, -0.25, g); frame.rotation.x = -0.18; frame.userData.noGlow = true;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.28, 0.64), new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(1.3, 1.3, 1.3) }));
    scr.position.set(0, 1.34, -0.22); scr.rotation.x = -0.18; scr.userData.screen = true; g.add(scr);
    return tag(id, g);
  }
  consoleDesk(Math.PI - 0.62, consoleTex.tex, "forensic");
  const clinicalG = consoleDesk(Math.PI + 0.62, trainTex.tex, "clinical");
  {
    // a swivel chair at the training bay
    const ch = new THREE.Group(); ch.position.set(0, 0, 0.95); clinicalG.add(ch);
    cyl(0.05, 0.05, 0.42, mat(C.steel, { roughness: 0.3, metalness: 0.3 }), 0, 0.24, 0, ch, 16);
    cyl(0.3, 0.3, 0.04, M.dark, 0, 0.03, 0, ch, 32);
    const seat = mesh(new THREE.SphereGeometry(0.34, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.white, 0, 0.47, 0, ch); seat.scale.y = 0.35; seat.rotation.x = Math.PI;
    mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.5, 32, 1, true, -1.1, 2.2), mat(C.white, { side: THREE.DoubleSide, roughness: 0.3 }), 0, 0.75, 0, ch);
    ch.rotation.y = 0.35;
  }

  /* ---------------------------------------------------------------- the CV dock */
  const cvG = new THREE.Group(); cvG.position.copy(polar(CV_TH, 3.55)); faceIn(cvG, CV_TH);
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), new THREE.MeshBasicMaterial({ map: paperTex.tex, color: new THREE.Color(1.25, 1.25, 1.25), side: THREE.DoubleSide }));
  const paperState = { cur: 0, target: 0 };
  {
    box(0.6, 1.0, 0.44, M.white, 0, 0.5, 0, cvG);
    const lid = box(0.6, 0.1, 0.5, M.white2, 0, 1.03, 0.02, cvG); lid.rotation.x = -0.12;
    box(0.4, 0.03, 0.12, M.dark, 0, 1.085, 0.0, cvG);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.21), new THREE.MeshBasicMaterial({ map: cvScreenTex.tex, color: new THREE.Color(1.3, 1.3, 1.3) }));
    scr.position.set(0, 0.74, 0.222); scr.userData.screen = true; cvG.add(scr);
    const ring = noPick(box(0.62, 0.02, 0.46, M.cyan, 0, 0.02, 0, cvG)); ring.castShadow = false;
    paper.position.set(0, 0.95, 0.0); paper.rotation.x = -0.12; paper.userData.screen = true; paper.visible = false; cvG.add(paper);
  }
  tag("cv", cvG);

  /* ---------------------------------------------------------------- the glowing ivy tube */
  const ivyG = new THREE.Group(); ivyG.position.copy(polar(IVY_TH, 4.0));
  const ivySway = new THREE.Group(); ivyG.add(ivySway);
  const rodMat = glowMat(0xeafcff, 4.5);
  const ivyMat = mat(0xffffff, { roughness: 0.5, side: THREE.DoubleSide, emissive: 0x2bd24a, emissiveIntensity: 0.55 });
  {
    cyl(0.5, 0.56, 0.5, M.white, 0, 0.25, 0, ivyG, 48);
    cyl(0.56, 0.5, 0.42, M.white, 0, H - 0.21, 0, ivyG, 48);
    [0.38, H - 0.3].forEach((y) => { const s = box(0.5, 0.05, 0.02, M.dark, 0, y, 0.55, ivyG); s.castShadow = false; });
    const glass = mesh(new THREE.CylinderGeometry(0.44, 0.44, H - 0.92, 48, 1, true), mat(0xdff4ff, { transparent: true, opacity: 0.16, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false }), 0, 0.5 + (H - 0.92) / 2, 0, ivyG, false);
    glass.renderOrder = 4; glass.userData.noGlow = true;
    cyl(0.47, 0.47, 0.04, M.white2, 0, 1.75, 0, ivyG, 48);
    noPick(cyl(0.045, 0.045, H - 0.9, rodMat, 0, 0.5 + (H - 0.92) / 2, 0, ivyG, 16)).castShadow = false;
    const leaves = [];
    for (let v = 0; v < 5; v++) {
      const off = v * 1.26;
      for (let s = 0; s < 46; s++) {
        const t = s / 45, ang = t * Math.PI * 5 + off, rad = 0.12 + 0.12 * Math.abs(Math.sin(t * 9 + off)), y = 0.55 + t * (H - 1.15);
        for (let j = 0; j < 2; j++) leaves.push({ p: V3(Math.cos(ang) * rad + (rnd() - 0.5) * 0.06, y + (rnd() - 0.5) * 0.06, Math.sin(ang) * rad + (rnd() - 0.5) * 0.06), rx: -0.4 + rnd() * 0.4, ry: -ang + Math.PI / 2 + (rnd() - 0.5), rz: (rnd() - 0.5) * 0.8, s: 0.08 + rnd() * 0.05, h: 0.33, l: 0.42 + rnd() * 0.12 });
      }
    }
    ivySway.add(leafField(leaves, ivyMat));
  }
  tag("ivy", ivyG);

  // a potted palm by the CV dock
  {
    const pg = new THREE.Group(); pg.position.copy(polar(Math.PI - 1.86, 4.25)); scene.add(pg);
    mesh(new THREE.LatheGeometry([[0, 0], [0.24, 0], [0.33, 0.08], [0.38, 0.42], [0.36, 0.48], [0, 0.48]].map(([x, y]) => new THREE.Vector2(x, y)), 40), M.white, 0, 0, 0, pg);
    cyl(0.035, 0.05, 0.6, mat(0x6d5a44, { roughness: 0.8 }), 0, 0.75, 0, pg, 10);
    const fg = new THREE.PlaneGeometry(1.0, 0.34, 16, 1); fg.rotateX(-Math.PI / 2); fg.translate(0.5, 0, 0);
    { const p = fg.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setY(i, p.getY(i) - 0.6 * x * x); } fg.computeVertexNormals(); }
    const fm = mat(0xffffff, { map: makeFrond().tex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 });
    for (let i = 0; i < 9; i++) { const f = new THREE.Group(); f.position.y = 1.03; f.rotation.y = (i / 9) * Math.PI * 2 + rnd() * 0.3; pg.add(f); const m = mesh(fg, fm, 0, 0, 0, f); m.rotation.z = 0.55 + rnd() * 0.4; }
  }

  /* ---------------------------------------------------------------- the lounge: sofa, mint tea, books and Tunisian jasmine */
  const lngIn = V3(-LNG.x, 0, -LNG.z).normalize(), lngTop = 0.3;
  const loungeG = new THREE.Group(); loungeG.position.copy(LNG); scene.add(loungeG);
  const outTh = Math.atan2(-lngIn.x, -lngIn.z), backTh = outTh;   // the sofa backs onto the railing and faces the middle of the room
  function sector(r0, r1, a0, a1, depth) {
    const sh = new THREE.Shape(), n = 40;
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; sh[i ? "lineTo" : "moveTo"](r1 * Math.sin(a), r1 * Math.cos(a)); }
    for (let i = n; i >= 0; i--) { const a = a0 + (a1 - a0) * i / n; sh.lineTo(r0 * Math.sin(a), r0 * Math.cos(a)); }
    const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3, curveSegments: 8 });
    g.rotateX(Math.PI / 2); g.translate(0, depth, 0); return g;
  }
  const sofaG = new THREE.Group(); loungeG.add(sofaG);
  const teaG = new THREE.Group(), jasmineG = new THREE.Group(); loungeG.add(teaG, jasmineG);
  const jasmineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff8e8, emissiveIntensity: 0.3, roughness: 0.6, side: THREE.DoubleSide });
  let puffs = [];
  {
    mesh(new THREE.CylinderGeometry(1.35, 1.38, lngTop, 96), mat(0xf8fafb, { roughness: 0.25 }), 0, lngTop / 2, 0, loungeG);
    const rim = noPick(new THREE.Mesh(new THREE.TorusGeometry(1.365, 0.012, 6, 140), M.cyan)); rim.rotation.x = Math.PI / 2; rim.position.y = lngTop + 0.004; loungeG.add(rim);
    const step = box(0.95, 0.15, 0.42, M.white, 0, 0, 0, loungeG); step.position.copy(lngIn.clone().multiplyScalar(1.5)).setY(0.075); step.rotation.y = Math.atan2(lngIn.x, lngIn.z);
    const rail = mesh(new THREE.CylinderGeometry(1.33, 1.33, 0.55, 64, 1, true, outTh - 1.25, 2.5), mat(0xdff4ff, { transparent: true, opacity: 0.16, roughness: 0.05, side: THREE.DoubleSide, depthWrite: false }), 0, lngTop + 0.275, 0, loungeG, false);
    rail.renderOrder = 4; rail.userData.noGlow = true;
    noPick(mesh(new THREE.CylinderGeometry(1.335, 1.335, 0.018, 64, 1, true, outTh - 1.25, 2.5), M.strip, 0, lngTop + 0.56, 0, loungeG, false));
    // the curved sofa
    const fabric = mat(0xe4ded6, { roughness: 0.92 });
    mesh(sector(0.6, 1.0, backTh - 1.15, backTh + 1.15, 0.36), fabric, 0, lngTop, 0, sofaG);
    mesh(sector(0.88, 1.02, backTh - 1.15, backTh + 1.15, 0.8), fabric, 0, lngTop, 0, sofaG);
    [[-0.65, 0x9fc9b8], [0, 0xd9cbb6], [0.6, 0x8fc3d8]].forEach(([d, c]) => { const pl = mesh(new THREE.SphereGeometry(0.16, 20, 14), mat(c, { roughness: 0.95 }), Math.sin(backTh + d) * 0.84, lngTop + 0.52, Math.cos(backTh + d) * 0.84, sofaG); pl.scale.set(1, 0.75, 0.45); pl.rotation.y = backTh + d; });
    // coffee table, books and a glass of mint tea
    cyl(0.08, 0.14, 0.3, M.white2, 0, lngTop + 0.15, 0, loungeG, 32);
    cyl(0.38, 0.38, 0.05, mat(0xffffff, { roughness: 0.15 }), 0, lngTop + 0.32, 0, loungeG, 64);
    const tr = noPick(new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.008, 6, 80), M.cyan)); tr.rotation.x = Math.PI / 2; tr.position.y = lngTop + 0.3; loungeG.add(tr);
    [[0xd8cfc2, 0.0], [0x9fb7c4, 0.25], [0xc9d9cf, -0.15]].forEach(([c, r], i) => { const b = box(0.26, 0.045, 0.19, mat(c, { roughness: 0.8 }), -0.12, lngTop + 0.37 + i * 0.047, 0.08, loungeG); b.rotation.y = r; });
    teaG.position.set(0.16, lngTop + 0.345, -0.08);
    const glass = mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.19, 24, 1, true), mat(0xdff3ff, { transparent: true, opacity: 0.32, roughness: 0.08, side: THREE.DoubleSide, depthWrite: false }), 0, 0.095, 0, teaG, false);
    glass.userData.noGlow = true; glass.renderOrder = 4;
    cyl(0.054, 0.046, 0.14, mat(0xb07a2e, { roughness: 0.25 }), 0, 0.075, 0, teaG, 24);
    [[-0.012, 0.01], [0.018, -0.012], [-0.004, -0.02]].forEach(([x, z], i) => { const l = mesh(new THREE.SphereGeometry(1, 8, 6), mat(0x4caf6e), x, 0.152, z, teaG); l.scale.set(0.026, 0.007, 0.014); l.rotation.y = i; });
    const puffTex = makePuff().tex;
    puffs = [0, 1, 2].map(() => { const sp = noPick(new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, transparent: true, opacity: 0, depthWrite: false }))); sp.scale.setScalar(0.1); teaG.add(sp); return sp; });
    // jasmine in a planter painted with Tunisian tiles
    const jTh = outTh - 1.7; jasmineG.position.set(Math.sin(jTh) * 1.0, lngTop, Math.cos(jTh) * 1.0);
    mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.42, 48), mat(0xffffff, { map: makeTiles().tex, roughness: 0.3 }), 0, 0.21, 0, jasmineG);
    const soil = new THREE.Mesh(new THREE.CircleGeometry(0.19, 32), mat(0x4a3b2c)); soil.rotation.x = -Math.PI / 2; soil.position.y = 0.415; jasmineG.add(soil);
    const leaves = [];
    for (let i = 0; i < 170; i++) {
      const a = rnd() * Math.PI * 2, u = rnd() * 2 - 1, r = 0.12 + rnd() * 0.18, k = Math.sqrt(1 - u * u);
      leaves.push({ p: V3(Math.cos(a) * k * r, 0.68 + u * r * 0.85, Math.sin(a) * k * r), rx: rnd() * 6.3, ry: rnd() * 6.3, rz: rnd() * 6.3, s: 0.05 + rnd() * 0.035, h: 0.33, l: 0.2 + rnd() * 0.1 });
    }
    jasmineG.add(leafField(leaves, mat(0xffffff, { roughness: 0.6, side: THREE.DoubleSide })));
    const petal = new THREE.Shape(); for (let i = 0; i <= 10; i++) { const a = (i / 10) * Math.PI * 2, r = i % 2 ? 0.35 : 1; petal[i ? "lineTo" : "moveTo"](Math.cos(a) * r, Math.sin(a) * r); }
    const fl = new THREE.InstancedMesh(new THREE.ShapeGeometry(petal), jasmineMat, 46), d = new THREE.Object3D();
    for (let i = 0; i < 46; i++) {
      const a = rnd() * Math.PI * 2, u = rnd() * 1.6 - 0.6, k = Math.sqrt(Math.max(0, 1 - u * u)), r = 0.29;
      d.position.set(Math.cos(a) * k * r, 0.68 + u * r * 0.85, Math.sin(a) * k * r); d.lookAt(d.position.clone().multiplyScalar(2).add(V3(0, -0.68, 0))); d.scale.setScalar(0.03 + rnd() * 0.015); d.updateMatrix(); fl.setMatrixAt(i, d.matrix);
    }
    jasmineG.add(fl);
  }
  tag("lounge", sofaG);
  tag("tea", teaG);
  tag("jasmine", jasmineG);

  /* ---------------------------------------------------------------- the stations' own lights */
  const holoLight = new THREE.PointLight(0x7fe3ff, 5, 6, 2); holoLight.position.set(BR.at.x, BR.y - 0.2, BR.at.z); scene.add(holoLight);
  const ivyLight = new THREE.PointLight(0x9dffb0, 4, 4, 2); ivyLight.position.copy(polar(IVY_TH, 3.6, 1.8)); scene.add(ivyLight);
  const screenLight = new THREE.PointLight(0x9ad8ff, 3, 4.5, 2); screenLight.position.set(0, 1.8, -4.1); scene.add(screenLight);
  const loungeLight = new THREE.PointLight(0xffd9b0, 1.6, 3.2, 2); loungeLight.position.copy(LNG).add(V3(0, 1.7, 0)); scene.add(loungeLight);

  engine.onLowQuality(() => { brainSparks.uniforms.uSize.value = 4; });

  /* ---------------------------------------------------------------- camera views of each station */
  const views = {
    brain: viewToward(V3(BR.at.x, BR.y, BR.at.z), 2.75, 0.3),
    screen: { pos: V3(0, 1.88, -1.1), target: V3(0, 1.86, -5) },
    forensic: viewToward(polar(Math.PI - 0.62, 3.7, 1.2), 2.4, 0.35),
    clinical: viewToward(polar(Math.PI + 0.62, 3.7, 1.15), 2.6, 0.45),
    globe: { pos: V3(0.3, 1.9, 1.75), target: V3(0, 1.5, 0) },
    log: viewToward(polar(LOG_TH, R - 0.1, 1.75), 3.4, 0.15),
    cv: viewToward(polar(CV_TH, 3.55, 1.0), 2.3, 0.45),
    lounge: { pos: V3(3.1, 1.55, 2.95), target: V3(-0.6, 1.4, -3.4) },
  };

  /* ---------------------------------------------------------------- hover glow and effects */
  const hoverAmt = { brain: 0, globe: 0 }, hoverOn = { brain: 0, globe: 0 };
  const glowC = new THREE.Color(0x7fe3ff);
  function hover(id, on) {
    const root = hot.get(id); if (!root) return;
    if (id in hoverOn) hoverOn[id] = on ? 1 : 0;
    root.traverse((m) => {
      if (!m.isMesh || m.userData.noGlow) return;
      if (m.userData.screen) { m.material.color.setScalar(on ? 1.6 : 1.3); return; }
      if (!m.material.emissive || m.material === ivyMat) return;
      if (on) { if (!m.userData.e0) { m.userData.e0 = m.material.emissive.clone(); m.userData.ei0 = m.material.emissiveIntensity; } m.material.emissive.copy(glowC); m.material.emissiveIntensity = 0.16; }
      else if (m.userData.e0) { m.material.emissive.copy(m.userData.e0); m.material.emissiveIntensity = m.userData.ei0; }
    });
  }

  let fire = 0, spin = 0, ivyPulse = 0, consoleLive = 0, trainLive = 0, globeAim = null, pinOn = null, steamBoost = 0, jasminePulse = 0;
  let consoleClock = 0, trainClock = 0, minuteClock = 0;
  const fx = {
    fireBrain(amount = 1.8) { fire = amount; },
    spinGlobe() { spin = 12; },
    // turn the globe so a place faces the globe camera (0.17: that camera sits slightly to the right); null lets it spin again
    aimGlobe(placeId) {
      const pl = PLACES.find((x) => x.id === placeId);
      if (!pl) { globeAim = null; pinOn = null; return; }
      globeAim = 0.17 - THREE.MathUtils.degToRad(pl.lon); pinOn = placeId; spin = 0;
    },
    print(on) { paperState.target = on ? 1 : 0; },
    consoleLive(seconds) { consoleLive = seconds; },
    trainingLive(seconds) { trainLive = seconds; trainTex.left = 300; },
    ivy() { ivyPulse = 2.2; },
    tea() { steamBoost = 2.5; },
    jasmine() { jasminePulse = 2.4; },
    star() { winTex.star.on = true; winTex.star.t = 0; },
    screenTime() { mainTex.draw(); },
  };

  return {
    hot, views, fx, hover,
    // where the globe is on screen, for the greeting bubbles
    globeWorld: (out) => globeSpin.getWorldPosition(out),
    // draw every screen once the fonts are in
    redraw() { mainTex.draw(); logTex.draw(); winTex.draw(); consoleTex.draw(0, false); trainTex.draw(); },
    // the parts of a time-of-day mood that belong to the stations: the sky in the window and the lounge lamp
    applyMood(m) {
      const s = winTex.sky;
      s.top.set(m.top); s.bot.set(m.bot); s.lights = m.lights; s.stars = m.stars; s.sunY = m.sunY; s.day = m.day; s.sunC.set(m.lightC);
      loungeLight.intensity = 1.2 + (1 - m.day) * 2;
      winTex.draw();
    },
    update(dt, t, focus) {
      for (const k in hoverAmt) hoverAmt[k] += ((hoverOn[k] || focus === k ? 1 : 0) - hoverAmt[k]) * Math.min(1, dt * 6);
      fire = Math.max(0, fire - dt);
      const f = Math.min(1, fire);
      brainShell.uniforms.uTime.value = t; brainShell.uniforms.uHover.value = hoverAmt.brain; brainShell.uniforms.uFire.value = f;
      globeShell.uniforms.uTime.value = t; globeShell.uniforms.uHover.value = hoverAmt.globe;
      brainSparks.uniforms.uTime.value = t; brainSparks.uniforms.uRate.value = 1.3 + f * 5;
      beamMat.uniforms.uTime.value = t; beamMat.uniforms.uBoost.value = Math.max(hoverAmt.brain, f);
      brain.rotation.y += dt * (0.22 + f * 1.4);
      brain.position.y = BR.y + Math.sin(t * 0.9) * 0.03;
      holoLight.intensity = 5 + hoverAmt.brain * 3 + f * 6;
      tableTop.rotation.z += dt * 0.08;
      if (globeAim !== null) { const d = Math.atan2(Math.sin(globeAim - globeSpin.rotation.y), Math.cos(globeAim - globeSpin.rotation.y)); globeSpin.rotation.y += d * Math.min(1, dt * 3.5); }
      else globeSpin.rotation.y += (0.18 + spin) * dt;
      spin *= Math.pow(0.3, dt);
      for (const id in PINS) PINS[id].scale.setScalar(id === pinOn ? 1.7 + Math.sin(t * 6) * 0.5 : 1);
      scanStrip.position.y = 2.62 - ((t * 0.18) % 1) * 1.56;
      ivyPulse = Math.max(0, ivyPulse - dt);
      ivySway.rotation.y = Math.sin(t * 0.4) * 0.05 + ivyPulse * Math.sin(t * 6) * 0.03;
      rodMat.color.setRGB(0.92, 0.99, 1).multiplyScalar(4.5 + ivyPulse * 3);
      ivyMat.emissiveIntensity = 0.55 + ivyPulse * 0.5; ivyLight.intensity = 4 + ivyPulse * 4;
      paperState.cur += (paperState.target - paperState.cur) * Math.min(1, dt * 2.5);
      paper.position.y = 0.95 + paperState.cur * 0.42; paper.visible = paperState.cur > 0.02;
      if (consoleLive > 0) { consoleLive -= dt; consoleClock += dt; if (consoleClock > 0.07) { consoleClock = 0; consoleTex.draw(t, true); } if (consoleLive <= 0) consoleTex.draw(t, false); }
      if (trainLive > 0 || focus === "clinical") {
        trainLive -= dt; trainClock += dt;
        if (trainClock > 0.08) { trainClock = 0; trainTex.left = Math.max(0, trainTex.left - 0.08); trainTex.draw(); }
      }
      if (winTex.star.on) { winTex.star.t += dt / 1.1; if (winTex.star.t >= 1) winTex.star.on = false; winTex.draw(); }
      minuteClock += dt; if (minuteClock > 20) { minuteClock = 0; mainTex.draw(); }
      steamBoost *= Math.pow(0.4, dt);
      puffs.forEach((sp, i) => { const ph = (t * 0.35 + i / 3) % 1; sp.position.set(Math.sin(t + i) * 0.012, 0.2 + ph * 0.38, 0); sp.material.opacity = Math.sin(ph * Math.PI) * 0.28 * (1 + steamBoost); sp.scale.setScalar(0.07 + ph * 0.08); });
      jasminePulse = Math.max(0, jasminePulse - dt); jasmineMat.emissiveIntensity = 0.3 + jasminePulse * 0.5 * (0.6 + 0.4 * Math.sin(t * 5));
      jasmineG.rotation.y = jasminePulse * Math.sin(t * 4) * 0.03;
    },
  };
}
