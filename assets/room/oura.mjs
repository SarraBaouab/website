// Oura, the holographic guide: a glowing orb with rings and a voice ring that ripples while she talks.
// She drifts around the room, greets the visitor, visits the station being looked at and floats beside the chat.
import * as THREE from "three";
import { V3, C, glowMat, noPick, rnd, holoMaterial, sparkMaterial, withGroove } from "./kit.mjs";

const $ = (id) => document.getElementById(id);
const IDLE = [V3(2.2, 2.4, 3.6), V3(-1.8, 2.6, 3.4), V3(0.9, 2.9, 2.4), V3(-0.4, 2.3, 4.4)];

export function createOura(scene, sound, pixelRatio = 1) {
  const root = new THREE.Group(); root.position.set(3.6, 3.8, 7); scene.add(root);
  const body = new THREE.Group(); root.add(body);
  const shell = holoMaterial(0x4fd2ff, 0x0a6ea8, 1.25, 0.04);
  const voice = { level: 0, talk: 0, rings: [] };
  body.add(new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), new THREE.MeshBasicMaterial({ visible: false })));   // what a tap hits
  const core = noPick(new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 16), glowMat(0xe6fbff, 4))); body.add(core);
  body.add(noPick(new THREE.Mesh(withGroove(new THREE.SphereGeometry(0.17, 40, 28)), shell)));
  [[0.24, 0.006, 0.4, 0.9], [0.285, 0.005, -0.7, 0.3], [0.32, 0.004, 1.2, -0.5]].forEach(([r, w, rx, ry]) => {
    const g = new THREE.Group(); g.rotation.set(rx, ry, 0); body.add(g);
    const ring = noPick(new THREE.Mesh(new THREE.TorusGeometry(r, w, 6, 120), glowMat(C.glow, 3.4))); g.add(ring);
    const bead = noPick(new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8), glowMat(0xffffff, 4))); bead.position.x = r; ring.add(bead);
    voice.rings.push(ring);
  });
  const N = 160, wg = new THREE.BufferGeometry(); wg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  const wave = noPick(new THREE.LineLoop(wg, new THREE.LineBasicMaterial({ color: new THREE.Color(C.glow).multiplyScalar(2.6), transparent: true, opacity: 0.9 }))); body.add(wave);
  let dots;
  {
    const n = 70, dp = new Float32Array(n * 3), dph = new Float32Array(n);
    for (let i = 0; i < n; i++) { const a = rnd() * Math.PI * 2, r = 0.2 + rnd() * 0.25; dp.set([Math.cos(a) * r, (rnd() - 0.5) * 0.3, Math.sin(a) * r], i * 3); dph[i] = rnd(); }
    const dg = new THREE.BufferGeometry(); dg.setAttribute("position", new THREE.BufferAttribute(dp, 3)); dg.setAttribute("aPhase", new THREE.BufferAttribute(dph, 1));
    dots = noPick(new THREE.Points(dg, sparkMaterial(0xbff4ff, 3, pixelRatio))); body.add(dots);
  }
  // her voice: every sound cue she makes adds to how much she is talking, with or without sound on
  sound.onTalk = (n) => { voice.talk = Math.min(1, voice.talk + n); };

  const BOT = { target: V3(3.6, 3.8, 7), look: null, mode: "off", wp: 0, wpClock: 0, sayUntil: 0, hover: 0, hoverOn: 0 };
  const dummy = new THREE.Object3D(), ray = new THREE.Raycaster();

  function say(text, ms = 4500) { const el = $("botsay"); el.textContent = text; el.hidden = false; BOT.sayUntil = performance.now() + ms; }
  function idle() { BOT.mode = "idle"; BOT.wpClock = 0; BOT.look = null; }
  return {
    root, say, idle,
    get mode() { return BOT.mode; },
    // fly in from outside and say hello, then wander
    arrive(hello, delay) {
      BOT.mode = "greet"; BOT.target.set(1.5, 2.5, 4.6);
      setTimeout(() => { if (BOT.mode === "greet") { sound.bot(5); say(hello, 6500); } }, delay);
      setTimeout(() => { if (BOT.mode === "greet") idle(); }, 9000);
    },
    // float near a point of interest and look at it (look may be null)
    visit(target, look) {
      BOT.mode = "visit"; $("botsay").hidden = true;
      BOT.target.copy(target); BOT.look = look ? look.clone() : null;
      setTimeout(() => sound.bot(3), 700);
    },
    chat(on) { if (on) { BOT.mode = "chat"; $("botsay").hidden = true; } else idle(); },
    hover(on) { BOT.hoverOn = on ? 1 : 0; },
    // right beside the chat panel, in front of the camera
    place(camera) { root.position.copy(chatSpot(camera)); },
    update(dt, t, camera, pointer) {
      if (BOT.mode === "off") return;
      if (BOT.mode === "idle") { BOT.wpClock -= dt; if (BOT.wpClock <= 0) { BOT.wp = (BOT.wp + 1) % IDLE.length; BOT.target.copy(IDLE[BOT.wp]); BOT.wpClock = 6 + Math.random() * 4; } }
      if (BOT.mode === "chat") BOT.target.copy(chatSpot(camera));
      root.position.lerp(BOT.target, 1 - Math.exp(-dt * (BOT.mode === "chat" ? 3 : 1.4)));
      body.position.y = Math.sin(t * 2.1) * 0.035;
      let look;
      if (BOT.mode === "visit" && BOT.look) look = BOT.look;
      else if (BOT.mode !== "chat" && performance.now() - pointer.time < 2500) { ray.setFromCamera(pointer.ndc, camera); look = ray.ray.at(camera.position.distanceTo(root.position), V3(0, 0, 0)); }
      else look = camera.position;
      dummy.position.copy(root.position); dummy.lookAt(look); body.quaternion.slerp(dummy.quaternion, Math.min(1, dt * 5));
      // the real sound level when sound is on, otherwise an estimate from her speech
      voice.talk = Math.max(0, voice.talk - dt * 1.8);
      voice.level += (Math.max(sound.level(), voice.talk * 0.8) - voice.level) * Math.min(1, dt * 12);
      const wp = wave.geometry.attributes.position, wn = wp.count;
      for (let i = 0; i < wn; i++) {
        const a = (i / wn) * Math.PI * 2, wob = Math.sin(a * 6 + t * 7) * 0.5 + Math.sin(a * 11 - t * 11) * 0.3 + Math.sin(a * 3 + t * 3) * 0.2;
        const r = 0.37 + 0.012 * Math.sin(a * 4 + t) + voice.level * 0.09 * wob; wp.setXYZ(i, Math.cos(a) * r, Math.sin(a) * r, 0);
      }
      wp.needsUpdate = true;
      voice.rings.forEach((rg, i) => { rg.rotation.z += dt * (0.6 + i * 0.35) * (1 + voice.level * 4) * (i % 2 ? -1 : 1); });
      core.scale.setScalar(1 + voice.level * 0.6 + Math.sin(t * 2.4) * 0.06);
      BOT.hover += ((BOT.hoverOn || BOT.mode === "chat" ? 1 : 0) - BOT.hover) * Math.min(1, dt * 6);
      shell.uniforms.uTime.value = t; shell.uniforms.uHover.value = BOT.hover; shell.uniforms.uFire.value = Math.min(1, voice.level);
      dots.material.uniforms.uTime.value = t; dots.rotation.y += dt * (0.4 + voice.level * 2);
      const el = $("botsay");
      if (!el.hidden) {
        if (performance.now() > BOT.sayUntil || !$("os").hidden || BOT.mode === "chat") el.hidden = true;
        else {
          const q = root.position.clone().add(V3(0, 0.5, 0)).project(camera), half = el.offsetWidth / 2 + 12;
          el.style.left = Math.min(innerWidth - half, Math.max(half, ((q.x + 1) / 2) * innerWidth)) + "px";
          el.style.top = Math.max(el.offsetHeight + 70, ((1 - q.y) / 2) * innerHeight) + "px";
        }
      }
    },
  };
}

function chatSpot(camera) {
  const fwd = V3(0, 0, -1).applyQuaternion(camera.quaternion), right = V3(1, 0, 0).applyQuaternion(camera.quaternion), up = V3(0, 1, 0).applyQuaternion(camera.quaternion);
  const wide = innerWidth > 760;
  return camera.position.clone().addScaledVector(fwd, wide ? 3.0 : 2.8).addScaledVector(right, wide ? -0.6 : 0).addScaledVector(up, wide ? 0.2 : 0.1);
}
