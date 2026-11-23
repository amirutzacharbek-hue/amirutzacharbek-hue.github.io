// Shared 3D showroom for the Tesla concept pages (unofficial portfolio work).
// Each page holds its settings in <script type="application/json" id="cfg">.
import * as THREE from 'three';
import { GLTFLoader } from '/lib/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from '/lib/addons/loaders/DRACOLoader.js';
import { RGBELoader } from '/lib/addons/loaders/RGBELoader.js';
import { Reflector } from '/lib/addons/objects/Reflector.js';
import { EffectComposer } from '/lib/addons/postprocessing/EffectComposer.js';
import { RenderPass } from '/lib/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '/lib/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '/lib/addons/postprocessing/OutputPass.js';
import { ShaderPass } from '/lib/addons/postprocessing/ShaderPass.js';
import { GroundedSkybox } from '/lib/addons/objects/GroundedSkybox.js';

const cfg = JSON.parse(document.getElementById('cfg').textContent);
const qs = new URLSearchParams(location.search);
if (qs.has('yaw')) cfg.yaw = +qs.get('yaw');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = innerWidth < 820 || matchMedia('(pointer: coarse)').matches;
const BG = new THREE.Color('#08090b');
const L = 4.75; // every car is scaled to this length, nose pointing to +X

// ---------- renderer, scene, post-processing ----------
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 2));
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;

const scene = new THREE.Scene();
scene.background = BG.clone();
scene.fog = new THREE.Fog(BG.clone(), 16, 40);
const camera = new THREE.PerspectiveCamera(30, 1, 0.03, 120);

const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: small ? 2 : 4 });
const composer = new EffectComposer(renderer, rt);
composer.addPass(new RenderPass(scene, camera));
// clamp runaway highlights (and any NaN/Inf) before bloom, so tiny specks never smear into big square glows
composer.addPass(new ShaderPass({
  uniforms: { tDiffuse: { value: null } },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main() { vec4 c = texture2D(tDiffuse, vUv); if (any(isnan(c.rgb)) || any(isinf(c.rgb))) c.rgb = vec3(0.0); gl_FragColor = vec4(min(c.rgb, vec3(14.0)), c.a); }'
}));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .45, .5, cfg.bloomThr ?? 3);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- image-based lighting (CC0 HDRIs from Poly Haven) ----------
// Real places, photographed in 360°: the photo is projected onto the ground so the car stands on the real pavement.
// u/v = where the main light sits in the panorama, look = the part of the panorama behind the car in the first view
const PLACES = {
  day: { file: 'canary', look: .97, u: .934, el: 48, sun: '#fff6ea', amt: .55, shade: .55, exp: 1, bloom: .18, lights: .35 },
  evening: { file: 'zollhof', look: .62, u: .61, el: 40, sun: '#ffd9a8', amt: .7, shade: .5, exp: 1.05, bloom: .3, lights: 1 },
  night: { file: 'hamburg', look: .662, u: .4, el: 60, sun: '#ffdcae', amt: .5, shade: .5, exp: 1, bloom: .35, lights: 1 }
};
const pmrem = new THREE.PMREMGenerator(renderer);
const envs = {};
const hdrFile = n => PLACES[n] ? `${PLACES[n].file}_1k` : n;
function loadEnv(name) {
  if (envs[name]) return envs[name];
  envs[name] = new Promise(res => new RGBELoader().load(`/lib/hdr/${hdrFile(name)}.hdr`, t => {
    t.mapping = THREE.EquirectangularReflectionMapping;
    const e = pmrem.fromEquirectangular(t).texture; t.dispose(); res(e);
  }));
  return envs[name];
}
scene.environmentIntensity = 1;
const STUDIO_ROT = 1.1, HERO_U = .137; // the first camera looks at u = .137 of an unrotated panorama
const placeRot = n => qs.has('rot') ? +qs.get('rot') : (PLACES[n].look - HERO_U) * 2 * Math.PI;
scene.environmentRotation = new THREE.Euler(0, STUDIO_ROT, 0);

// lights (the HDRI does most of the work)
const key = new THREE.DirectionalLight('#ffffff', 1.3); key.position.set(3, 7, 4); scene.add(key);
const rimL = new THREE.DirectionalLight('#9fb8ff', 1.1); rimL.position.set(-6, 3, -5); scene.add(rimL);

const city = new THREE.Group(); city.visible = false; scene.add(city);
const sky = new GroundedSkybox(null, 2.1, 46, small ? 64 : 128);
sky.position.y = 2.1 - .002; sky.material.fog = false; sky.renderOrder = -1; city.add(sky);
const skies = {};
function loadSky(n) {
  return skies[n] ??= new Promise(res => new THREE.TextureLoader().load(`/lib/hdr/${PLACES[n].file}_bg${small ? '_s' : ''}.jpg`, t => {
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); res(t);
  }));
}
// the main light of each place casts a soft shadow onto the photographed ground
const sun = new THREE.DirectionalLight('#fff6ea', .55);
sun.castShadow = true;
sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -4.5, right: 4.5, top: 4.5, bottom: -4.5, near: 1, far: 30 });
sun.shadow.radius = small ? 6 : 10; sun.shadow.blurSamples = 16; sun.shadow.bias = -.0004; sun.shadow.normalBias = .02;
city.add(sun);
const catcher = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.ShadowMaterial({ opacity: .55, color: '#0b0d12' }));
catcher.rotation.x = -Math.PI / 2; catcher.position.y = .001; catcher.receiveShadow = true; city.add(catcher);
function setPlace(n, tex) {
  const P = PLACES[n], rot = placeRot(n);
  sky.material.map = tex; sky.material.needsUpdate = true; sky.rotation.y = rot;
  const el = THREE.MathUtils.degToRad(P.el), az = (P.u - .5) * 2 * Math.PI;
  sun.position.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)).applyAxisAngle(new THREE.Vector3(0, 1, 0), rot).multiplyScalar(12);
  sun.color.set(P.sun); sun.intensity = P.amt; catcher.material.opacity = P.shade;
  scene.environmentRotation.y = rot; renderer.toneMappingExposure = P.exp;
}

// ---------- glossy studio floor ----------
function radialTex(stops) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d');
  const gr = g.createRadialGradient(256, 256, 0, 256, 256, 256); stops.forEach(([o, col]) => gr.addColorStop(o, col));
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
let mirror = null;
if (!small) {
  mirror = new Reflector(new THREE.PlaneGeometry(60, 60), { textureWidth: 1024, textureHeight: 1024, color: 0x8a8d94 });
  mirror.rotation.x = -Math.PI / 2; scene.add(mirror);
}
const floorFade = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({
  map: radialTex([[0, 'rgba(8,9,11,.74)'], [.18, 'rgba(8,9,11,.86)'], [.42, 'rgba(8,9,11,1)']]), transparent: true, depthWrite: false, fog: false
}));
if (small) floorFade.material = new THREE.MeshBasicMaterial({ color: BG });
floorFade.rotation.x = -Math.PI / 2; floorFade.position.y = .002; scene.add(floorFade);
const shadow = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 3.2), new THREE.MeshBasicMaterial({ map: radialTex([[0, 'rgba(0,0,0,.92)'], [.6, 'rgba(0,0,0,.5)'], [1, 'rgba(0,0,0,0)']]), transparent: true, depthWrite: false }));
shadow.rotation.x = -Math.PI / 2; shadow.position.y = .004; scene.add(shadow);
// soft light strip under the car + a moving light line on the floor
const glow = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ map: radialTex([[0, 'rgba(140,165,220,.22)'], [1, 'rgba(140,165,220,0)']]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
glow.rotation.x = -Math.PI / 2; glow.position.y = .003; scene.add(glow);
const scanTex = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 8; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 512, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 8); return new THREE.CanvasTexture(c); })();
const ring = new THREE.Mesh(new THREE.RingGeometry(3.35, 3.37, 160), new THREE.MeshBasicMaterial({ color: '#aac2ff', transparent: true, opacity: .0, blending: THREE.AdditiveBlending, depthWrite: false }));
ring.rotation.x = -Math.PI / 2; ring.position.y = .006; scene.add(ring);

const cabinLight = new THREE.PointLight('#fff4e6', 0, 3.2, 1.6); scene.add(cabinLight);
// ---------- the car ----------
const car = new THREE.Group(); scene.add(car);
const M = cfg.mats || {};
const rx = s => s ? new RegExp(s, 'i') : null;
const R = { rim: rx(M.rim), paint: rx(M.paint), glass: rx(M.glass), head: rx(M.head), tail: rx(M.tail), drop: rx(M.drop), tint: rx(M.tint), chrome: rx(M.chrome), glassy: rx(M.glassy), shade: rx(M.shade) };
// automotive paint: pigment + metallic flake under a glossy clear coat
const paintMat = new THREE.MeshPhysicalMaterial({ color: cfg.paints[0].c, metalness: .42, roughness: .34, clearcoat: 1, clearcoatRoughness: .035, envMapIntensity: 1.15 });
// machined alloy wheels in a dark graphite finish
const rimMat = new THREE.MeshPhysicalMaterial({ color: cfg.rimColor || '#5a5e64', metalness: .92, roughness: .3, clearcoat: .6, clearcoatRoughness: .12 });
const glassMat =new THREE.MeshPhysicalMaterial({ color: '#0b0e13', metalness: 0, roughness: .09, transparent: true, opacity: .42, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.05, clearcoat: 1, clearcoatRoughness: .07 });
const headMats = [], tailMats = [], tintMats = [];
const seen = new Map();
function fixMat(mt) {
  if (!mt) return mt;
  if (seen.has(mt)) return seen.get(mt);
  const n = mt.name || '';
  let out = mt;
  if (R.rim && R.rim.test(n)) out = rimMat;
  else if (R.paint && R.paint.test(n)) out = paintMat;
  else if (R.glass && R.glass.test(n)) out = glassMat;
  else if (R.head && R.head.test(n)) { out = mt.clone(); out.emissive = new THREE.Color('#eaf1ff'); out.emissiveIntensity = 0; if (out.map) out.emissiveMap = out.map; headMats.push(out); }
  else if (R.tail && R.tail.test(n)) { out = mt.clone(); out.emissive = new THREE.Color('#ff1a1a'); out.emissiveIntensity = 0; tailMats.push(out); }
  else if (R.tint && R.tint.test(n)) { out = mt.clone(); out.metalness = cfg.tintMetal ?? .9; out.roughness = cfg.tintRough ?? .34; out.color.set(cfg.paints[0].c); tintMats.push(out); }
  else if (R.chrome && R.chrome.test(n)) { out.metalness = 1; out.roughness = .12; }
  if (out === mt) out.envMapIntensity = 1;
  if (cfg.double && out !== glassMat) out.side = THREE.DoubleSide;
  if (R.glassy && R.glassy.test(n)) { out.envMapIntensity = .45; }
  if (R.shade && R.shade.test(n) && out.color) { out.color.set(cfg.shadeColor || '#1c1c1e'); out.roughness = .55; }
  // rubber is never glossy
  if (/tyre|tire|pneu/i.test(n) && out === mt) { out.roughness = Math.max(out.roughness ?? .9, .82); out.metalness = 0; if (out.color && !out.map) out.color.set('#161617'); }
  // mirror-smooth surfaces make highlights so bright they overflow the half-float buffer and bloom into square blocks
  if ('roughness' in out && out.roughness < .1) out.roughness = .1;
  if (out.clearcoat && out.clearcoatRoughness < .03) out.clearcoatRoughness = .03;
  seen.set(mt, out); return out;
}
let carH = 1.45;
const loaderEl = document.getElementById('loader'), pctEl = document.getElementById('pct'), lnEl = loaderEl.querySelector('.ln');
function setPct(p) { pctEl.textContent = p + '%'; lnEl.style.setProperty('--p', p + '%'); }
const draco = new DRACOLoader().setDecoderPath('/lib/addons/libs/draco/');
let mood = PLACES[qs.get('scene')] || qs.get('scene') === 'studio' ? qs.get('scene') : cfg.mood || 'day';
const envReady = Promise.all([loadEnv(mood), PLACES[mood] ? loadSky(mood) : null]).then(([e, tex]) => { scene.environment = e; applyMood(mood, tex); });
new GLTFLoader().setDRACOLoader(draco).load(cfg.glb, async gltf => {
  const m = gltf.scene, drop = [];
  m.traverse(o => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    if (R.drop && mats.every(x => R.drop.test(x.name || ''))) { drop.push(o); return; }
    o.material = Array.isArray(o.material) ? o.material.map(fixMat) : fixMat(o.material);
    o.castShadow = !(Array.isArray(o.material) ? o.material : [o.material]).every(x => x === glassMat || x.transparent);
  });
  drop.forEach(o => o.parent.remove(o));
  const box = new THREE.Box3().setFromObject(m, true), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  m.position.set(-c.x, -box.min.y, -c.z);
  const pivot = new THREE.Group(); pivot.add(m);
  pivot.rotation.y = THREE.MathUtils.degToRad(cfg.yaw || 0);
  const sc = L / Math.max(size.x, size.z); pivot.scale.setScalar(sc);
  carH = size.y * sc;
  car.add(pivot);
  await envReady;
  renderer.compile(scene, camera);
  setPct(100);
  setTimeout(() => { loaderEl.classList.add('done'); document.documentElement.classList.add('ready'); }, reduce ? 0 : 450);
  introT = 0; started = true;
}, xhr => setPct(Math.min(99, Math.round(xhr.loaded / (xhr.total || cfg.bytes || 4e6) * 100))),
err => { console.error(err); pctEl.textContent = 'Could not load the 3D model'; });

// ---------- camera path driven by scroll ----------
// p = camera position, t = look-at target (car is 4.75 long, nose +X, floor at y=0)
// s = horizontal view shift (to leave room for text), free = turntable allowed, inside = in the cabin
const SHOTS = Object.assign({
  hero: { p: [7.2, 1.55, 8.4], t: [0, .9, 0], s: 0, free: 1 },
  exterior: { p: [.35, .95, 10.6], t: [.35, .62, 0], s: -.2 },
  lights: { p: [9.6, .5, 2.9], t: [0, .62, 0], s: .19 },
  approach: { p: [-8.2, 2.5, 0], t: [1, .75, 0], s: 0 },
  cabin: { p: [-.25, 1.1, 0], t: [3, .92, 0], s: 0, inside: 1, fov: 62 },
  configure: { p: [-7.1, 2.55, 8.3], t: [0, .52, 0], s: .18, free: 1 }
}, cfg.shots || {});
if (qs.has('cab')) { const v = qs.get('cab').split(',').map(Number); SHOTS.cabin = { ...SHOTS.cabin, p: v.slice(0, 3), t: v.slice(3, 6) }; }
const marks = [...document.querySelectorAll('[data-shot]')];
const cyl = p => ({ a: Math.atan2(p[2], p[0]), r: Math.hypot(p[0], p[2]), y: p[1] });
const want = { pos: new THREE.Vector3(...SHOTS.hero.p), tgt: new THREE.Vector3(...SHOTS.hero.t), s: 0, free: 1, inside: 0, fov: 30, lights: 0, ring: 0 };
const cur = { pos: want.pos.clone(), tgt: want.tgt.clone(), s: 0, free: 1, inside: 0, fov: 30, lights: 0, ring: 0 };
let curShot = 'hero', visible3d = true;
function shotVec(sh, f, A, B) {
  const a = cyl(A.p), b = cyl(B.p);
  let da = b.a - a.a; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
  const ang = a.a + da * f, r = a.r + (b.r - a.r) * f, y = a.y + (b.y - a.y) * f;
  return [r * Math.cos(ang), y, r * Math.sin(ang)];
}
function updateWanted() {
  const mid = innerHeight / 2;
  let i = 0;
  const cs = marks.map(el => { const r = el.getBoundingClientRect(); return r.top + r.height / 2; });
  for (let k = 0; k < cs.length; k++) if (cs[k] <= mid) i = k;
  const j = Math.min(i + 1, marks.length - 1);
  let f = cs[j] === cs[i] ? 0 : (mid - cs[i]) / (cs[j] - cs[i]); f = Math.min(1, Math.max(0, f)); f = f * f * (3 - 2 * f);
  const A = SHOTS[marks[i].dataset.shot], B = SHOTS[marks[j].dataset.shot];
  const hs = carH / 1.45; // taller cars: lift heights a bit
  const sy = v => v * (.55 + .45 * hs);
  const pA = { p: [A.p[0], A.inside ? A.p[1] : sy(A.p[1]), A.p[2]] }, pB = { p: [B.p[0], B.inside ? B.p[1] : sy(B.p[1]), B.p[2]] };
  want.pos.set(...shotVec(null, f, pA, pB));
  want.tgt.set(...A.t).lerp(new THREE.Vector3(...B.t), f); want.tgt.y *= .55 + .45 * hs;
  want.s = A.s + (B.s - A.s) * f;
  want.free = (A.free ? 1 - f : 0) + (B.free ? f : 0);
  want.inside = (A.inside ? 1 - f : 0) + (B.inside ? f : 0);
  want.fov = (A.fov || 30) * (1 - f) + (B.fov || 30) * f;
  curShot = f < .5 ? marks[i].dataset.shot : marks[j].dataset.shot;
  want.lights = curShot === 'lights' || curShot === 'hero' || curShot === 'configure' ? 1 : .35;
  want.ring = curShot === 'exterior' || curShot === 'lights' ? 1 : 0;
  if (innerWidth < 820 && want.inside < .5) { const d = 2.05 - want.inside * 2; want.pos.x *= d; want.pos.z *= d; want.pos.y *= 1.25; want.tgt.y -= innerHeight > innerWidth * 1.6 ? .95 : .6; want.s = 0; }
  if (innerWidth < 820) want.s = 0;
}

// ---------- turntable drag (outside) and look-around (inside) ----------
let dragging = false, lastX = 0, lastY = 0, turn = 0, turnVel = 0, autoSpin = !reduce, lookYaw = 0, lookPitch = 0, wantYaw = 0, wantPitch = 0;
function down(e) { dragging = true; lastX = e.clientX; lastY = e.clientY; autoSpin = false; }
canvas.addEventListener('pointerdown', e => { down(e); canvas.setPointerCapture(e.pointerId); });
document.querySelectorAll('.drag-zone').forEach(z => z.addEventListener('pointerdown', e => { if (!e.target.closest('a,button,.panel')) down(e); }));
addEventListener('pointermove', e => {
  if (!dragging) return;
  const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
  if (cur.inside > .5) { wantYaw = THREE.MathUtils.clamp(wantYaw - dx * .004, -1.9, 1.9); wantPitch = THREE.MathUtils.clamp(wantPitch - dy * .003, -.5, .45); }
  else turnVel = dx * .006;
});
addEventListener('pointerup', () => { if (!dragging) return; dragging = false; setTimeout(() => autoSpin = !reduce, 2500); });

// ---------- configurator ----------
const paintFrom = new THREE.Color(), paintTo = new THREE.Color(cfg.paints[0].c); let paintK = 1;
document.querySelectorAll('#swatches button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('#swatches button').forEach(x => x.setAttribute('aria-pressed', x === b));
  paintFrom.copy(tintMats.length ? tintMats[0].color : paintMat.color); paintTo.set(b.dataset.c); paintK = 0;
  document.getElementById('colorName').textContent = b.dataset.n;
  const pr = document.getElementById('price'); if (pr && b.dataset.p) pr.textContent = b.dataset.p;
}));
let lightsOn = true, lightK = 0;
document.getElementById('lights')?.addEventListener('click', e => { lightsOn = !lightsOn; e.currentTarget.setAttribute('aria-pressed', lightsOn); });
const studioFog = scene.fog;
function applyMood(m, tex) {
  const c = !!PLACES[m];
  city.visible = c; if (c) setPlace(m, tex);
  [floorFade, glow, ring].forEach(o => o.visible = !c); if (mirror) mirror.visible = !c;
  scene.fog = c ? null : studioFog;
  if (!c) { scene.environmentRotation.y = STUDIO_ROT; renderer.toneMappingExposure = 1; }
  rimL.visible = key.visible = !c;
  shadow.material.opacity = c ? .8 : 1;
  document.documentElement.classList.toggle('scene-city', c);
  document.documentElement.dataset.scene = m;
}
// switching places: a short fade, the new place, fade back in
let switching = false;
document.querySelectorAll('#mood button').forEach(b => {
  b.setAttribute('aria-pressed', b.dataset.m === mood);
  if (b.dataset.m === mood) { const n = document.getElementById('moodName'); if (n) n.textContent = b.dataset.n || b.textContent; }
  b.addEventListener('pointerenter', () => { if (PLACES[b.dataset.m]) { loadEnv(b.dataset.m); loadSky(b.dataset.m); } }, { once: true });
  b.addEventListener('click', async () => {
    const want = b.dataset.m; if (want === mood || switching) return;
    switching = true;
    document.querySelectorAll('#mood button').forEach(x => x.setAttribute('aria-pressed', x === b));
    document.getElementById('moodName').textContent = b.dataset.n || b.textContent;
    const ready = Promise.all([loadEnv(want), PLACES[want] ? loadSky(want) : null]);
    canvas.classList.add('swap');
    const [[env, tex]] = await Promise.all([ready, new Promise(r => setTimeout(r, reduce ? 0 : 380))]);
    mood = want; scene.environment = env; applyMood(mood, tex);
    requestAnimationFrame(() => { canvas.classList.remove('swap'); switching = false; });
  });
});

// ---------- loop ----------
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); composer.setSize(w, h); bloom.resolution.set(w / 2, h / 2);
  camera.aspect = w / h; camera.updateProjectionMatrix(); updateWanted();
}
addEventListener('resize', resize); resize();
const clock = new THREE.Clock(); let introT = 0, started = false;
const tmp = new THREE.Vector3(), nightBG = new THREE.Color('#04060b');
function frame(t) {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), .05);
  if (!visible3d && started) return;
  updateWanted();
  introT = Math.min(1, introT + dt * .45);
  const k = reduce ? 1 : 1 - Math.pow(.002, dt);
  cur.pos.lerp(want.pos, k); cur.tgt.lerp(want.tgt, k);
  for (const n of ['s', 'free', 'inside', 'fov', 'lights', 'ring']) cur[n] += (want[n] - cur[n]) * k;
  const intro = reduce ? 0 : Math.pow(1 - introT, 3);
  camera.position.copy(cur.pos).add(tmp.set(intro * 5, intro * 2.2, intro * 4));
  // look-around inside the cabin
  if (cur.inside < .3) { wantYaw = 0; wantPitch = 0; }
  lookYaw += (wantYaw - lookYaw) * .08; lookPitch += (wantPitch - lookPitch) * .08;
  const dir = tmp.copy(cur.tgt).sub(cur.pos);
  dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), lookYaw); dir.y += lookPitch * dir.length();
  camera.lookAt(cur.pos.x + dir.x, cur.pos.y + dir.y, cur.pos.z + dir.z);
  if (Math.abs(camera.fov - cur.fov) > .01) { camera.fov = cur.fov; camera.updateProjectionMatrix(); }
  camera.setViewOffset(innerWidth, innerHeight, cur.s * innerWidth, 0, innerWidth, innerHeight);
  // turntable only where allowed; otherwise glide back to straight
  if (cur.free > .5) {
    if (autoSpin) turnVel += (.0016 - turnVel) * .02;
    turn += turnVel; if (!dragging && !autoSpin) turnVel *= .94;
  } else {
    turnVel = 0; const home = Math.round(turn / (2 * Math.PI)) * 2 * Math.PI; turn += (home - turn) * .07;
  }
  car.rotation.y = turn;
  cabinLight.position.set(SHOTS.cabin.p[0] + .5, SHOTS.cabin.p[1] + .15, 0); cabinLight.intensity = cur.inside * (cfg.cabinLight ?? 2.2);
  // paint
  if (paintK < 1) {
    paintK = Math.min(1, paintK + dt * 1.5); const e = paintK * paintK * (3 - 2 * paintK);
    paintMat.color.copy(paintFrom).lerp(paintTo, e); tintMats.forEach(m => m.color.copy(paintFrom).lerp(paintTo, e));
  }
  // lights + mood
  const lw = lightsOn && started ? Math.min(1, introT * 1.5) * Math.max(cur.lights, PLACES[mood]?.lights ?? 0) : 0; lightK += (lw - lightK) * .1;
  headMats.forEach(m => m.emissiveIntensity = lightK * 10); tailMats.forEach(m => m.emissiveIntensity = lightK * 8);
  ring.material.opacity = cur.ring * .55; ring.scale.setScalar(1 + Math.sin(t * .0012) * .015);
  bloom.strength = PLACES[mood] ? PLACES[mood].bloom : .45;
  composer.render();
}
requestAnimationFrame(frame);

// pause the 3D when an opaque section fills the screen
const solids = [...document.querySelectorAll('.solidsec, .gallery, .specs, .others, footer')];
function checkVisible() {
  const h = innerHeight;
  visible3d = !solids.some(el => { const r = el.getBoundingClientRect(); return r.top <= 0 && r.bottom >= h; });
}
addEventListener('scroll', checkVisible, { passive: true });
