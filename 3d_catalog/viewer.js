// 3D ビューア：gallery.json（代表の核 6 個）を three.js で描く
(function () {
  const stage = document.getElementById("vstage");
  const canvas = document.getElementById("vcanvas");
  const tabs = document.getElementById("vtabs");
  const note = document.getElementById("vnote");
  const offBox = document.getElementById("v-off");
  const nucBox = document.getElementById("v-nuc");
  if (!window.THREE || !stage) { if (note) note.textContent = "3D 表示のライブラリを読み込めませんでした。静止画（図 3）をご覧ください。"; return; }
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 500);
  camera.up.set(0, 0, 1); camera.position.set(-27, -34, 25);
  const controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.target.set(0, 0, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const dl = new THREE.DirectionalLight(0xffffff, 0.6); dl.position.set(-20, -30, 40); scene.add(dl);
  let group = null, data = [], cur = 0;

  function pointsObj(arr, color, size, opacity) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
    const m = new THREE.PointsMaterial({ color, size, sizeAttenuation: true, transparent: true, opacity, depthWrite: false });
    return new THREE.Points(g, m);
  }
  function build(i) {
    cur = i;
    if (group) { scene.remove(group); group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
    group = new THREE.Group();
    const d = data[i];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(d.verts, 3));
    geo.setIndex(d.faces); geo.computeVertexNormals();
    const nuc = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: css("--nuc") || "#8aa0c8", transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }));
    nuc.name = "nuc"; nuc.visible = nucBox.checked; group.add(nuc);
    const off = new THREE.Group(); off.name = "off";
    off.add(pointsObj(d.pts.cis_only, css("--off") || "#9a9a9a", 0.3, 0.4));
    off.add(pointsObj(d.pts.trans_only, css("--off") || "#9a9a9a", 0.3, 0.4));
    off.visible = offBox.checked; group.add(off);
    group.add(pointsObj(d.pts.trans, css("--trans") || "#1f9e3a", 0.42, 0.75));
    group.add(pointsObj(d.pts.cis, css("--cis") || "#c2188b", 0.42, 0.9));
    // 1 目盛り 5 µm の床の格子
    const grid = new THREE.GridHelper(30, 6, 0x999999, 0xcccccc); grid.rotation.x = Math.PI / 2; grid.position.z = -6;
    grid.material.transparent = true; grid.material.opacity = 0.35; group.add(grid);
    scene.add(group);
    note.textContent = `${d.cell} ${d.stage}（${d.sample_id} #${d.nucleus_id}）  核 ${d.volume} µm³・核表面からの距離 ${d.dist} µm・片寄り ${d.polarity}・高さ ${d.dz} µm。床の格子は 5 µm。`;
    [...tabs.children].forEach((b, j) => b.setAttribute("aria-selected", j === i ? "true" : "false"));
  }
  function resize() {
    const w = stage.clientWidth, h = Math.max(300, Math.min(520, w * 0.62));
    renderer.setSize(w, h, false); canvas.style.width = w + "px"; canvas.style.height = h + "px";
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  offBox.addEventListener("change", () => { const o = group && group.getObjectByName("off"); if (o) o.visible = offBox.checked; });
  nucBox.addEventListener("change", () => { const o = group && group.getObjectByName("nuc"); if (o) o.visible = nucBox.checked; });
  new ResizeObserver(resize).observe(stage);
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener && mq.addEventListener("change", () => data.length && build(cur));
  fetch("gallery.json").then((r) => r.json()).then((js) => {
    data = js;
    js.forEach((d, i) => {
      const b = document.createElement("button"); b.type = "button"; b.setAttribute("role", "tab");
      b.textContent = `${d.cell === "HEK293T" ? "HEK" : "IMR"} ${d.stage}`; b.addEventListener("click", () => build(i)); tabs.appendChild(b);
    });
    resize(); build(0);
  }).catch(() => { note.textContent = "gallery.json を読み込めませんでした。"; });
  (function loop() { requestAnimationFrame(loop); controls.update(); renderer.render(scene, camera); })();
})();
