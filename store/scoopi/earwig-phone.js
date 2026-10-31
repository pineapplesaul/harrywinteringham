// © 2026 Harry Winteringham. All rights reserved. Earwig is a trademark of Harry Winteringham. Unauthorised copying, modification or distribution of this file is prohibited.
// The Earwig phone from earwig.io (same model as harrywinteringham.uk), playing the app recording on its screen,
// in the Earwig card on the Scoopi page. It sways gently and leans towards the mouse. Falls back to the flat
// phone (the video in a frame) if WebGL or the module can't load, or the visitor prefers reduced motion.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Canvas id doubles as a provenance marker; the stage is looked up by it below
const STAGE_ID = 'hw-earwig-phone-scoopi';

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

function planeFromShape(w, h, r, seg = 24) {
  const g = new THREE.ShapeGeometry(roundedRectShape(w, h, r), seg);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
  return g;
}

// Soft boxes baked into an environment map, for the long clean highlights of a product shot
function studioEnv(renderer) {
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({ color: 0x060506, side: THREE.BackSide })));
  const box = (w, h, intensity, color, pos) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); scene.add(m);
  };
  box(10, 3.2, 3.2, 0xffffff, [0, 9, 4]);
  box(1.2, 12, 5.0, 0xfff6ec, [-9, 1, 3]);
  box(1.0, 12, 3.6, 0xf0f4ff, [9, 0.5, 2]);
  box(6, 2.0, 1.6, 0xff8a6a, [3, -3, -9]);
  box(14, 1.2, 0.9, 0xffffff, [0, -8, 6]);
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(scene, 0.035).texture;
  pm.dispose();
  return tex;
}

function createPhone(screenTexture) {
  const W = 0.719, H = 1.500, D = 0.0825, R = 0.118, B = 0.016;
  const group = new THREE.Group();
  const frameMat = new THREE.MeshPhysicalMaterial({ color: 0x2f3036, metalness: 1, roughness: 0.27, clearcoat: 0.3, clearcoatRoughness: 0.2 });
  const body = new THREE.ExtrudeGeometry(roundedRectShape(W - 2 * B, H - 2 * B, R - B), {
    depth: D - 2 * B, bevelEnabled: true, bevelThickness: B, bevelSize: B, bevelSegments: 10, curveSegments: 48,
  });
  body.translate(0, 0, -(D - 2 * B) / 2);
  group.add(new THREE.Mesh(body, frameMat));

  const back = new THREE.Mesh(planeFromShape(W - 0.012, H - 0.012, R - 0.006, 32),
    new THREE.MeshPhysicalMaterial({ color: 0x1d1e22, metalness: 0.2, roughness: 0.45, clearcoat: 1, clearcoatRoughness: 0.35 }));
  back.rotation.y = Math.PI; back.position.z = -D / 2 - 0.0006; group.add(back);
  const plateau = new THREE.Mesh(new RoundedBoxGeometry(W - 0.03, 0.42, 0.03, 6, 0.05), frameMat);
  plateau.position.set(0, H / 2 - 0.24, -D / 2 - 0.01); group.add(plateau);
  const lensMat = new THREE.MeshPhysicalMaterial({ color: 0x050506, metalness: 0.4, roughness: 0.08, clearcoat: 1 });
  [[-0.17, 0.62], [-0.17, 0.42], [0.0, 0.52]].forEach(([x, y]) => {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.03, 48), frameMat);
    ring.rotation.x = Math.PI / 2; ring.position.set(x, y, -D / 2 - 0.035); group.add(ring);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.032, 48), lensMat);
    lens.rotation.x = Math.PI / 2; lens.position.set(x, y, -D / 2 - 0.037); group.add(lens);
  });

  const front = new THREE.Mesh(planeFromShape(W - 0.006, H - 0.006, R - 0.003, 32),
    new THREE.MeshPhysicalMaterial({ color: 0x020202, roughness: 0.2, metalness: 0 }));
  front.position.z = D / 2 + 0.0004; group.add(front);

  // The display: the app recording as a video texture
  const SW = 0.669, SH = 1.454, SR = 0.098;
  const screen = new THREE.Mesh(planeFromShape(SW, SH, SR, 32), new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false }));
  screen.position.z = D / 2 + 0.0009; group.add(screen);

  // Cover glass: reflections only, on top of the display
  const glass = new THREE.Mesh(planeFromShape(W - 0.006, H - 0.006, R - 0.003, 32),
    new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.06, metalness: 0, envMapIntensity: 0.55, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  glass.position.z = D / 2 + 0.0014; group.add(glass);

  const btn = (h, side, y, mat = frameMat) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(0.03, h, 0.034, 4, 0.012), mat);
    m.position.set(side * (W / 2 + 0.004), y, 0); group.add(m);
  };
  btn(0.075, -1, 0.44); btn(0.105, -1, 0.31); btn(0.105, -1, 0.18);
  btn(0.16, 1, 0.26);
  btn(0.07, 1, -0.12, new THREE.MeshPhysicalMaterial({ color: 0x15161a, metalness: 0.6, roughness: 0.12, clearcoat: 1 }));
  return group;
}

function start() {
  const holder = document.querySelector('.ewpop-phone');
  const card = document.getElementById('ewpop');
  const video = holder && holder.querySelector('video');
  if (!holder || !video || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.id = STAGE_ID;
  canvas.className = 'ewpop-canvas';
  holder.appendChild(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (err) {
    canvas.remove();
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.environment = studioEnv(renderer);
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(-3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffb8a8, 1.0); rim.position.set(4, 1, -3); scene.add(rim);
  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
  camera.position.set(0, 0, 4.1);

  const tex = new THREE.VideoTexture(video);
  tex.colorSpace = THREE.SRGBColorSpace;
  const phone = createPhone(tex);
  scene.add(phone);
  holder.classList.add('is-3d');

  const size = () => {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  };
  size();
  addEventListener('resize', size);

  const mouse = { x: 0, y: 0 }, lean = { x: 0, y: 0 };
  addEventListener('pointermove', e => {
    mouse.x = e.clientX / innerWidth - 0.5;
    mouse.y = e.clientY / innerHeight - 0.5;
  }, { passive: true });

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    // Only while the card is showing.
    if (!card || card.hidden || !card.classList.contains('in')) return;
    if (!canvas.width || canvas.width < 2) size();
    lean.x += (mouse.x - lean.x) * 0.06;
    lean.y += (mouse.y - lean.y) * 0.06;
    const t = clock.getElapsedTime();
    phone.rotation.y = -0.5 + Math.sin(t * 0.55) * 0.32 + lean.x * 0.3;
    phone.rotation.x = 0.12 + Math.sin(t * 0.4) * 0.05 + lean.y * 0.15;
    phone.rotation.z = 0.05;
    phone.position.y = Math.sin(t * 1.1) * 0.025;
    renderer.render(scene, camera);
  });
}

start();
