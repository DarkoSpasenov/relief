/*
  RELIEF — paysage alpin 3D du hero (three.js)
  Source lisible. Le fichier servi est assets/relief-3d.min.js (voir README.txt pour le build).
  Un massif généré par du bruit, un sommet principal avec le drapeau suisse,
  des sapins, un lac, des nuages et une télécabine.
  1) À l'arrivée, la montagne se construit : fil de fer, volumes, couleurs.
  2) Le défilement de la page fait monter la caméra de la vallée jusqu'au sommet.
*/
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, PlaneGeometry, BoxGeometry, ConeGeometry,
  CylinderGeometry, IcosahedronGeometry, MeshStandardMaterial, MeshBasicMaterial, CanvasTexture,
  InstancedMesh, Object3D, Fog, Color, HemisphereLight, DirectionalLight, BufferAttribute,
  BufferGeometry, Line, LineBasicMaterial, Vector3, CatmullRomCurve3, SRGBColorSpace, NoToneMapping, DoubleSide, MathUtils
} from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';


/* ---------- relief ---------- */
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rand = rng(11);
const simplex = new SimplexNoise({ random: rng(5) });
const smooth = (x, a, b) => { const t = MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const PEAK = { x: 12, z: -24, h: 19 };

function ridged(x, z) {
  let amp = 1, f = 1, sum = 0, norm = 0;
  for (let i = 0; i < 5; i++) {
    const v = 1 - Math.abs(simplex.noise(x * f, z * f));
    sum += v * v * amp; norm += amp; amp *= 0.44; f *= 2.07;
  }
  return sum / norm;
}

function height(x, z) {
  const valleyX = Math.sin(z * 0.06) * 5 - 3;
  const side = smooth(Math.abs(x - valleyX), 3, 30);   // les versants de la vallée
  const back = smooth(-z, -6, 50);                      // ça monte vers le fond
  const west = x < valleyX ? 0.42 + 0.58 * smooth(-z, 25, 60) : 1;   // versant gauche plus bas : le titre reste sur le ciel
  let h = ridged(x * 0.034, z * 0.034) * (side * 15 * west + back * 12 * (0.6 + 0.4 * west));
  h += simplex.noise(x * 0.16, z * 0.16) * 0.35 * side;
  // le sommet principal, une pyramide un peu asymétrique
  const dx = x - PEAK.x, dz = z - PEAK.z;
  const p = Math.max(0, 1 - Math.hypot(dx * (dx > 0 ? 1.15 : 0.9), dz * 1.1) / 12);
  h += Math.pow(p, 1.75) * PEAK.h * (0.88 + 0.12 * simplex.noise(x * 0.3, z * 0.3));
  return h;
}

function start(renderer) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.toneMapping = NoToneMapping;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  scene.fog = new Fog(new Color('#DCEBF3'), 42, 125);
  const camera = new PerspectiveCamera(40, 1, 0.5, 260);

  scene.add(new HemisphereLight(0xeaf6ff, 0xa9bcc4, 1.45));
  const sun = new DirectionalLight(0xfff1dc, 2.3); sun.position.set(30, 38, 18); scene.add(sun);

  const land = new Group();   // tout ce qui « pousse » à l'arrivée
  scene.add(land);
  const reveal = { value: reduce ? 99 : -3 };   // altitude jusqu'où les couleurs sont posées

  /* 1) le plan : une grille en fil de fer */
  const wireGeo = new PlaneGeometry(150, 150, 64, 64);
  wireGeo.rotateX(-Math.PI / 2);
  for (let i = 0, wp = wireGeo.attributes.position; i < wp.count; i++) wp.setY(i, height(wp.getX(i), wp.getZ(i)) + 0.05);
  const wire = new Mesh(wireGeo, new MeshBasicMaterial({ color: '#1F5E86', wireframe: true, transparent: true, opacity: 0.6 }));
  land.add(wire);

  /* 2) les volumes : terrain facetté, couleur par face selon l'altitude et la pente */
  const SIZE = 150, SEG = 190;
  let geo = new PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, height(pos.getX(i), pos.getZ(i)));
  geo = geo.toNonIndexed();
  geo.computeVertexNormals();
  const P = geo.attributes.position, N = geo.attributes.normal;
  const colors = new Float32Array(P.count * 3);
  const c = new Color(), snow = new Color('#FFFFFF'), ice = new Color('#E6F0F8'), rock = new Color('#8E98A6'), rockDark = new Color('#6E7A89'),
    alp = new Color('#9DBE77'), meadow = new Color('#6FB067'), shore = new Color('#B9C9A0');
  for (let i = 0; i < P.count; i += 3) {
    const h = (P.getY(i) + P.getY(i + 1) + P.getY(i + 2)) / 3;
    const x = P.getX(i), z = P.getZ(i), ny = N.getY(i);
    const snowLine = 7.6 + simplex.noise(x * 0.09, z * 0.09) * 1.6;
    const r = rand();
    if (h > snowLine && ny > 0.32) c.copy(snow).lerp(ice, r * 0.5);
    else if (h > snowLine + 7) c.copy(snow).lerp(ice, r);
    else if (h > snowLine + 2.2) c.copy(snow).lerp(rock, r * 0.3);
    else if (ny < 0.66 || h > 6.6) c.copy(rock).lerp(rockDark, r);
    else if (h > 3.4) c.copy(alp).lerp(rock, smooth(h, 5, 7.5) * 0.6 + r * 0.08);
    else if (h < 0.55) c.copy(shore).lerp(meadow, r * 0.4);
    else c.copy(meadow).lerp(alp, smooth(h, 1, 3.4) + r * 0.1);
    for (let k = 0; k < 3; k++) c.toArray(colors, (i + k) * 3);
  }
  geo.setAttribute('color', new BufferAttribute(colors, 3));
  const landMat = new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0, transparent: !reduce, opacity: reduce ? 1 : 0 });
  /* 3) les couleurs montent de la vallée vers le sommet (sous uReveal : couleur, au-dessus : maquette grise) */
  landMat.onBeforeCompile = (sh) => {
    sh.uniforms.uReveal = reveal;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vH;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvH = position.y;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vH;\nuniform float uReveal;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = mix(vec3(0.85, 0.88, 0.91), diffuseColor.rgb, 1.0 - smoothstep(uReveal - 1.2, uReveal + 1.2, vH));');
  };
  const solid = new Mesh(geo, landMat);
  solid.visible = reduce;
  land.add(solid);

  /* lac */
  const lake = new Mesh(new PlaneGeometry(SIZE, SIZE), new MeshStandardMaterial({ color: '#7FC3DD', roughness: 0.25, metalness: 0.15, transparent: true, opacity: reduce ? 0.92 : 0 }));
  lake.rotation.x = -Math.PI / 2; lake.position.y = 0.3;
  scene.add(lake);

  /* sapins : ils poussent quand la couleur arrive à leur altitude */
  const spots = [];
  for (let i = 0; i < 9000 && spots.length < 1300; i++) {
    const x = (rand() - 0.5) * 110, z = rand() * 100 - 62;
    const h = height(x, z);
    if (h < 0.7 || h > 6.2) continue;
    if (Math.abs(height(x + 0.6, z) - h) > 0.42 || Math.abs(height(x, z + 0.6) - h) > 0.42) continue;
    if (simplex.noise(x * 0.07 + 40, z * 0.07) < -0.05) continue;
    spots.push([x, h, z]);
  }
  const treeMat = new MeshStandardMaterial({ color: '#2F6B4A', flatShading: true, roughness: 1 });
  treeMat.onBeforeCompile = (sh) => {
    sh.uniforms.uReveal = reveal;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uReveal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\ntransformed *= 1.0 - smoothstep(uReveal - 1.2, uReveal + 1.2, instanceMatrix[3].y);\n#endif');
  };
  const trees = new InstancedMesh(new ConeGeometry(0.34, 1.25, 5), treeMat, spots.length);
  const dummy = new Object3D();
  spots.forEach((s, i) => {
    const k = 0.7 + rand() * 0.9;
    dummy.position.set(s[0], s[1] + 0.55 * k, s[2]); dummy.scale.setScalar(k); dummy.rotation.y = rand() * 6;
    dummy.updateMatrix(); trees.setMatrixAt(i, dummy.matrix);
  });
  land.add(trees);

  /* drapeau suisse au sommet */
  const top = height(PEAK.x, PEAK.z);
  const fc = document.createElement('canvas'); fc.width = fc.height = 64;
  const fx = fc.getContext('2d'); fx.fillStyle = '#DA291C'; fx.fillRect(0, 0, 64, 64); fx.fillStyle = '#fff'; fx.fillRect(26, 12, 12, 40); fx.fillRect(12, 26, 40, 12);
  const ftex = new CanvasTexture(fc); ftex.colorSpace = SRGBColorSpace;
  const summit = new Group();
  summit.position.set(PEAK.x, top - 0.1, PEAK.z);
  const pole = new Mesh(new CylinderGeometry(0.035, 0.035, 2.4, 6), new MeshBasicMaterial({ color: '#33414E' }));
  pole.position.y = 1.2;
  const flagGeo = new PlaneGeometry(1.25, 1.25, 8, 1);
  const flag = new Mesh(flagGeo, new MeshBasicMaterial({ map: ftex, side: DoubleSide, fog: false }));
  flag.position.set(0.66, 1.75, 0);
  summit.add(pole, flag);
  land.add(summit);
  const flagBase = flagGeo.attributes.position.array.slice();

  /* télécabine */
  const A = new Vector3(-10, height(-10, 10) + 1.6, 10), B = new Vector3(2.5, height(2.5, -17) + 1.8, -17);
  const cable = new Line(new BufferGeometry().setFromPoints([A, B]), new LineBasicMaterial({ color: '#33414E' }));
  const cabin = new Group();
  const box = new Mesh(new BoxGeometry(0.75, 0.6, 0.55), new MeshStandardMaterial({ color: '#DA291C', flatShading: true, roughness: 0.6 }));
  box.position.y = -0.75;
  const glass = new Mesh(new BoxGeometry(0.77, 0.2, 0.57), new MeshStandardMaterial({ color: '#EAF6FF', roughness: 0.2 }));
  glass.position.y = -0.66;
  const arm = new Mesh(new CylinderGeometry(0.025, 0.025, 0.5, 5), new MeshBasicMaterial({ color: '#33414E' }));
  arm.position.y = -0.24;
  cabin.add(box, glass, arm);
  land.add(cable, cabin);

  /* nuages */
  const cloudMat = new MeshStandardMaterial({ color: '#FFFFFF', emissive: '#C9D6DE', emissiveIntensity: 0.75, flatShading: true, roughness: 1, fog: false });
  const puff = new IcosahedronGeometry(1, 1);
  const clouds = [[-26, 15, -30, 1.5], [-4, 19, -46, 1.9], [30, 17.5, -40, 1.6], [20, 12, -6, 0.9], [-16, 10.5, -8, 0.8], [-14, 19, -14, 1.1], [26, 24, -22, 1.3], [-8, 27, -40, 1.7]].map(([x, y, z, s], i) => {
    const g = new Group();
    for (let k = 0; k < 5; k++) {
      const m = new Mesh(puff, cloudMat);
      m.position.set((k - 2) * 1.25, (k % 2) * 0.4 - Math.abs(k - 2) * 0.22, (k % 3) * 0.5);
      m.scale.set(1.5 - Math.abs(k - 2) * 0.32, 1 - Math.abs(k - 2) * 0.24, 1.1);
      g.add(m);
    }
    g.position.set(x, y, z); g.userData = { x, s, speed: 0.25 + (i % 5) * 0.07 };
    scene.add(g);
    return g;
  });

  /* ---------- le chemin de la caméra, de la vallée au sommet ---------- */
  const V = (a) => a.map((p) => new Vector3(p[0], p[1], p[2]));
  // on longe le lac, on contourne le sommet par l'ouest en gardant du recul, puis on se pose près du drapeau
  const climb = [[-5, 5.6, 22], [-9, 11, 9], [-14, 19, -5], [-11, 26, -22], [PEAK.x - 13, top + 1.5, PEAK.z + 9], [PEAK.x - 4.6, top + 2.6, PEAK.z + 7.2]];
  const gaze = [[3, 8, -10], [PEAK.x, 10, PEAK.z], [PEAK.x, 13, PEAK.z], [PEAK.x, top - 9, PEAK.z], [PEAK.x, top - 2.5, PEAK.z], [PEAK.x + 0.4, top + 1.1, PEAK.z]];
  const paths = {
    wide: { pos: new CatmullRomCurve3(V([[1, 8.2, 40]].concat(climb))), look: new CatmullRomCurve3(V([[-3.5, 11.4, -20]].concat(gaze))), fov: 40 },
    tall: { pos: new CatmullRomCurve3(V([[9, 12, 47]].concat(climb))), look: new CatmullRomCurve3(V([[PEAK.x - 1, 35.5, PEAK.z]].concat(gaze))), fov: 56 },
  };
  let path = paths.wide;
  function resize() {
    const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    path = camera.aspect < 0.9 ? paths.tall : paths.wide;
    camera.fov = path.fov;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  const pointer = { x: 0, y: 0 }, eased = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1; pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  /* ---------- interface : étapes de construction et altimètre ---------- */
  const chips = Array.from(document.querySelectorAll('[data-build] li'));
  const altiN = document.querySelector('[data-alti-n]');
  const altiBar = document.querySelector('[data-alti-bar]');
  let stage = -1, shownAlt = -1;
  function setStage(n) {
    if (n === stage) return; stage = n;
    chips.forEach((li, i) => { li.classList.toggle('is-on', i <= n); li.classList.toggle('is-now', i === n); });
  }

  /* ---------- boucle ---------- */
  let raf = 0, prog = -1;
  const t0 = performance.now();
  const q = new URLSearchParams(location.search).get('build');   // ?build=1.6 fige la construction à 1,6 s (pour les tests)
  const frozen = q === null ? null : parseFloat(q) || 0;
  const ease = (x) => { x = MathUtils.clamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); };
  const camPos = new Vector3(), camLook = new Vector3();

  function frame(now) {
    raf = 0;
    const t = reduce ? 99 : frozen !== null ? frozen : (now - t0) / 1000;

    /* construction */
    land.scale.y = 0.02 + 0.98 * ease(t / 1.3);
    wire.material.opacity = 0.6 * (1 - ease((t - 1.5) / 1.1));
    wire.visible = wire.material.opacity > 0.01;
    if (t > 1.2) solid.visible = true;
    if (landMat.transparent) { landMat.opacity = ease((t - 1.2) / 0.9); if (landMat.opacity >= 1) { landMat.transparent = false; landMat.needsUpdate = true; } }
    reveal.value = -3 + 40 * MathUtils.clamp((t - 2.2) / 1.7, 0, 1);
    lake.material.opacity = 0.92 * ease((t - 2.2) / 0.8);
    const cl = ease((t - 3.0) / 0.9);
    clouds.forEach((g) => g.scale.setScalar(Math.max(0.0001, g.userData.s * cl)));
    const fin = ease((t - 3.8) / 0.5);
    summit.scale.setScalar(Math.max(0.0001, fin)); cabin.scale.setScalar(Math.max(0.0001, fin)); cable.visible = fin > 0;
    setStage(t < 1.3 ? 0 : t < 2.2 ? 1 : t < 3.9 ? 2 : 3);

    /* ascension : le défilement de la page fait monter la caméra */
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const target = max > 0 ? MathUtils.clamp(window.scrollY / max / 0.9, 0, 1) : 0;   // sommet atteint un peu avant le bas de page
    prog = prog < 0 || reduce ? target : prog + (target - prog) * 0.07;
    eased.x += (pointer.x - eased.x) * 0.04; eased.y += (pointer.y - eased.y) * 0.04;
    path.pos.getPoint(prog, camPos); path.look.getPoint(prog, camLook);
    const calm = 1 - prog * 0.7;
    camPos.x += eased.x * 2 * calm; camPos.y -= eased.y * 0.8 * calm;
    camPos.y = Math.max(camPos.y, height(camPos.x, camPos.z) + 1.6);
    camera.position.copy(camPos); camera.lookAt(camLook);

    const alt = Math.round((560 + prog * (4478 - 560)) / 10) * 10;   // 4478 m : l'altitude du Cervin
    if (alt !== shownAlt && altiN) { shownAlt = alt; altiN.textContent = alt.toLocaleString('fr-CH'); if (altiBar) altiBar.style.transform = 'scaleY(' + Math.max(0.03, prog).toFixed(3) + ')'; }

    if (!reduce) {
      clouds.forEach((g) => { g.position.x = g.userData.x + ((t * g.userData.speed) % 90); if (g.position.x > 55) g.position.x -= 110; });
      cabin.position.lerpVectors(A, B, 0.5 - 0.5 * Math.cos(t * 0.16));
      const arr = flagGeo.attributes.position.array;
      for (let i = 0; i < arr.length; i += 3) { const d = flagBase[i] + 0.625; arr[i + 2] = Math.sin(d * 5 - t * 6) * 0.1 * d; }
      flagGeo.attributes.position.needsUpdate = true;
    } else cabin.position.lerpVectors(A, B, 0.45);

    renderer.render(scene, camera);
    if (!document.hidden && !reduce) loop();
  }
  function loop() { if (!raf) raf = requestAnimationFrame(frame); }
  loop();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) loop(); });
  if (reduce) { window.addEventListener('scroll', loop, { passive: true }); window.addEventListener('resize', loop); }
  document.documentElement.classList.add('webgl-ready');
}

const canvas = document.querySelector('[data-hero-canvas]');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (canvas) {
  let renderer = null;
  try { renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch (e) { /* pas de WebGL */ }
  if (renderer) start(renderer); else document.documentElement.classList.add('no-webgl');
}
