/* Adapted from Henry Heffernan's portfolio. Original license: ./LICENSE.md */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { CSS3DObject, CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { steamVertex, steamFragment, grainVertex, grainFragment } from "./shaders";
import { fitWorkstation } from "./fitWorkstation";
import { createWoodMaterial, createAeronChair, createFujifilmCamera } from "./furniture";

export function createRoom(host, { onProgress, onReady, onError, onView }) {
  const scene = new THREE.Scene();
  const cssScene = new THREE.Scene();
  // Keep depth precision around the furniture instead of reserving it for a
  // distant horizon. All camera positions and zoom targets remain unchanged.
  const camera = new THREE.PerspectiveCamera(35, 1, 100, 160000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = "room-webgl";
  renderer.domElement.setAttribute("aria-label", "Interactive 3D office");
  const cssRenderer = new CSS3DRenderer();
  cssRenderer.domElement.className = "room-css";
  host.append(cssRenderer.domElement, renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enabled = false;
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2;
  controls.minDistance = 4000;
  controls.maxDistance = 29000;

  const initial = new THREE.Vector3(-35000, 35000, 35000);
  const position = initial.clone();
  const focal = new THREE.Vector3(0, -5000, 0);
  const lookAt = new THREE.Vector3();
  let view = "loading", tween, frame, disposed = false, elapsed = 0;
  let ready = false, lastTime = performance.now(), steam, dimmer, chair;
  let muted = false;
  const audio = new Map();
  const videos = [];
  const textures = new Set();
  const materials = new Set();
  const monitorTargets = [];
  const raycaster = new THREE.Raycaster();
  const width = 1280;
  let height = 1024;
  const screenPosition = new THREE.Vector3(0, 950, 255);
  const screenRotation = new THREE.Euler(-3 * THREE.MathUtils.DEG2RAD, 0, 0);
  scene.add(new THREE.HemisphereLight(0xbfc9df, 0x302219, 0.22));
  const keyLight = new THREE.DirectionalLight(0xffe7c6, 0.2);
  keyLight.position.set(-3500, 6500, 5000);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xcadfff, 0.1);
  fillLight.position.set(3500, 2000, -1000);
  scene.add(fillLight);
  // An opaque floor replaces the obsolete baked desk shadow. The enlarged desk
  // casts its real silhouette here from the pendant's light.
  const roomMaterial = new THREE.MeshStandardMaterial({ color: 0x343330, roughness: 1, metalness: 0, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
  roomMaterial.name = "Seamless room surface";
  // A shared world-space light gradient avoids a color/lighting seam between the
  // horizontal floor and the backdrop. Only the warm pool receives live shadows;
  // the dim ambient component keeps shadowed areas from turning pure black.
  roomMaterial.onBeforeCompile = shader => {
    shader.uniforms.uRoomGlowCenter = { value: new THREE.Vector3(95, -2975, 250) };
    shader.vertexShader = "varying vec3 vRoomWorldPosition;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvRoomWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = "varying vec3 vRoomWorldPosition;\nuniform vec3 uRoomGlowCenter;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <shadowmap_pars_fragment>", "#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>");
    shader.fragmentShader = shader.fragmentShader.replace("vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;", `
      vec3 roomOffset = vRoomWorldPosition - uRoomGlowCenter;
      vec2 roomHorizontal = roomOffset.xz / 10500.0;
      float roomVertical = roomOffset.y / 18000.0;
      float roomGlow = exp(-dot(roomHorizontal, roomHorizontal) - roomVertical * roomVertical);
      vec3 roomAmbient = vec3(0.14);
      vec3 roomWarmPool = vec3(0.34, 0.27, 0.205) * roomGlow;
      vec3 outgoingLight = diffuseColor.rgb * (roomAmbient + roomWarmPool * getShadowMask());
    `);
  };
  roomMaterial.customProgramCacheKey = () => "seamless-room-gradient-v1";
  materials.add(roomMaterial);
  const floorShadow = new THREE.Mesh(new THREE.PlaneGeometry(180000, 92500), roomMaterial);
  floorShadow.name = "Live shadow floor";
  floorShadow.rotation.x = -Math.PI / 2;
  floorShadow.position.set(0, -2975, 43750);
  floorShadow.receiveShadow = true;
  scene.add(floorShadow);
  const pendant = new THREE.Group();
  pendant.name = "Warm hanging pendant";
  pendant.position.set(95, 4800, 250);
  const metal = new THREE.MeshStandardMaterial({ color: 0x181b1e, roughness: 0.48, metalness: 0.65 });
  const cableMaterial = new THREE.MeshStandardMaterial({ color: 0x181a1c, roughness: 0.85 });
  const diffuserMaterial = new THREE.MeshBasicMaterial({ color: 0xffdfae, side: THREE.DoubleSide, toneMapped: false });
  const addPendantPart = (geometry, material, y) => {
    materials.add(material);
    const part = new THREE.Mesh(geometry, material);
    part.position.y = y;
    pendant.add(part);
    return part;
  };
  // A low-profile, softly beveled LED ring replaces the cone shade and exposed bulb.
  const ringProfile = [[610, -40], [610, 40], [620, 50], [700, 50], [710, 40], [710, -40], [700, -50], [620, -50], [610, -40]];
  addPendantPart(new THREE.LatheGeometry(ringProfile.reverse().map(([radius, y]) => new THREE.Vector2(radius, y)), 96), metal, 0);
  const diffuser = addPendantPart(new THREE.RingGeometry(620, 700, 96), diffuserMaterial, -51);
  diffuser.rotation.x = Math.PI / 2;
  for (const x of [-540, 540]) {
    const start = new THREE.Vector3(x, 55, 0);
    const end = new THREE.Vector3(Math.sign(x) * 90, 3440, 0);
    const direction = end.clone().sub(start);
    const wire = addPendantPart(new THREE.CylinderGeometry(6, 6, direction.length(), 8), cableMaterial, 0);
    wire.position.copy(start).add(end).multiplyScalar(0.5);
    wire.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  }
  addPendantPart(new THREE.CylinderGeometry(140, 140, 40, 32), metal, 3457);
  scene.add(pendant);
  const pendantLight = new THREE.SpotLight(0xffc58a, 2.5, 19000, Math.PI / 3, 0.65, 1);
  pendantLight.name = "Pendant warm light";
  pendantLight.position.copy(pendant.position).y -= 220;
  pendantLight.target.position.set(95, -426, 250);
  pendantLight.castShadow = true;
  pendantLight.shadow.mapSize.set(2048, 2048);
  pendantLight.shadow.camera.near = 100;
  pendantLight.shadow.camera.far = 20000;
  pendantLight.shadow.bias = -0.0001;
  pendantLight.shadow.normalBias = 5;
  scene.add(pendantLight, pendantLight.target);
  const compactViewport = () => host.clientWidth <= 768 || host.clientHeight <= 500;
  const syncViewVisibility = () => {
    if (chair) chair.visible = !(view === "monitor" && compactViewport());
  };
  const monitorPosition = () => {
    let z = Math.max(2250, 1400 + host.clientHeight / host.clientWidth * 1200);
    if (compactViewport()) {
      const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const aspect = host.clientWidth / host.clientHeight;
      // Fit the tilted screen plus bezel padding inside the narrow viewport.
      // Leave additional vertical room for mobile navigation and browser chrome.
      for (const x of [-width / 2 - 100, width / 2 + 100]) {
        for (const y of [-height / 2 - 90, height / 2 + 90]) {
          const corner = new THREE.Vector3(x, y, 0).applyEuler(screenRotation).add(screenPosition);
          z = Math.max(z, corner.z + Math.abs(corner.x) / (tangent * aspect * 0.9), corner.z + Math.abs(corner.y - screenPosition.y) / (tangent * 0.8));
        }
      }
    }
    return new THREE.Vector3(0, screenPosition.y, z);
  };
  const roomPosition = (target = new THREE.Vector3()) => target.set(
    Math.sin((elapsed + 19000) * 0.00008) * -20000,
    Math.sin((elapsed + 1000) * 0.000004) * 4000 + 9000,
    20000,
  );
  const keyframes = () => ({
    room: { position: roomPosition(), focal: new THREE.Vector3(0, -1000, 0) },
    desk: { position: new THREE.Vector3(0, 1800, 5500 + host.clientHeight / host.clientWidth * 3000 - 1800), focal: new THREE.Vector3(0, 500, 0) },
    monitor: { position: monitorPosition(), focal: new THREE.Vector3(0, 950, 0) },
    free: { position: new THREE.Vector3(-15000, 10000, 15000), focal: new THREE.Vector3(-100, 350, 0) },
  });
  function transition(next, duration = 1600) {
    if (disposed || !ready || next === view) return;
    controls.enabled = false;
    renderer.domElement.style.pointerEvents = next === "free" ? "auto" : "none";
    tween = { start: performance.now(), duration, from: position.clone(), to: keyframes()[next].position, fromFocal: focal.clone(), toFocal: keyframes()[next].focal };
    view = next;
    syncViewVisibility();
    onView(next);
  }
  function sound(name, volume = 0.3, loop = false) {
    if (disposed || muted) return;
    let track = audio.get(name);
    if (!track) { track = new Audio(`/room/audio/${name}`); track.loop = loop; audio.set(name, track); }
    track.volume = volume;
    if (!loop) track.currentTime = 0;
    track.play().catch(() => {});
  }
  function start() {
    transition("room", 2500);
    sound("startup/startup.mp3", 0.25);
    sound("atmosphere/office.mp3", 0.12, true);
  }
  function setMuted(value) {
    muted = value;
    audio.forEach(track => { track.muted = value; });
    if (!value && view !== "loading") sound("atmosphere/office.mp3", 0.12, true);
  }
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    cssRenderer.setSize(w, h);
    syncViewVisibility();
    if (view === "monitor" || view === "desk") {
      position.copy(keyframes()[view].position);
      focal.copy(keyframes()[view].focal);
      tween = null;
    }
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();

  // Reuse the exact baked models, per-mesh scale, and lighting from the reference.
  const manager = new THREE.LoadingManager();
  let assetsBuilt = false, sourcesLoaded = false, desktopLoaded = false;
  const finishPreload = () => {
    if (disposed || ready || !assetsBuilt || !sourcesLoaded || !desktopLoaded) return;
    ready = true;
    onReady();
  };
  manager.onStart = () => { sourcesLoaded = false; };
  manager.onLoad = () => { sourcesLoaded = true; finishPreload(); };
  manager.onProgress = (url, loaded, total) => { if (!disposed && !ready) onProgress({ name: url.split("/").pop(), loaded, total }); };
  const gltfLoader = new GLTFLoader(manager);
  const textureLoader = new THREE.TextureLoader(manager);
  async function vinylWall() {
    const albums = [
      { title: "HEROES & VILLAINS", artist: "Metro Boomin", image: "metro" },
      { title: "Graduation", artist: "Kanye West", image: "graduation" },
      { title: "Souled Out", artist: "Jhené Aiko", image: "souled" },
      { title: "Take Care", artist: "Drake", image: "takecare" },
      { title: "1989", artist: "Taylor Swift", image: "1989" },
      { title: "petal", artist: "Ariana Grande", image: "petal" },
    ];
    const maps = await Promise.all(albums.map(album => textureLoader.loadAsync(`/room/textures/vinyl/${album.image}.jpg`)));
    if (disposed) { maps.forEach(map => map.dispose()); return; }
    maps.forEach(map => {
      map.encoding = THREE.sRGBEncoding;
      map.minFilter = THREE.LinearMipmapLinearFilter;
      map.magFilter = THREE.LinearFilter;
      map.generateMipmaps = true;
      map.anisotropy = 8;
      textures.add(map);
    });
    // One broad cyclorama joins the floor to the vinyl wall with a soft radius.
    // Its edges are outside the camera paths; the original backdrop is hidden.
    const crossSection = [];
    for (let step = 0; step <= 48; step++) {
      const angle = step / 48 * Math.PI / 2;
      crossSection.push([-1375 - 1600 * Math.cos(angle), -2500 - 1600 * Math.sin(angle)]);
    }
    crossSection.push([90000, -4100]);
    const vertices = [], indices = [];
    crossSection.forEach(([y, z], row) => {
      vertices.push(-90000, y, z, 90000, y, z);
      if (row < crossSection.length - 1) {
        const a = row * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    });
    const wallGeometry = new THREE.BufferGeometry();
    wallGeometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    wallGeometry.setIndex(indices);
    wallGeometry.computeVertexNormals();
    const wall = new THREE.Mesh(wallGeometry, roomMaterial);
    wall.name = "Vinyl gallery wall";
    wall.receiveShadow = true;
    scene.add(wall);

    const gallery = new THREE.Group();
    gallery.name = "Two-row vinyl gallery";
    // Leave the lower row to the monitor's left so all six sleeves remain visible
    // from the existing Desk camera; camera behavior and zoom targets stay intact.
    gallery.position.set(-2700, 0, -3970);
    const ledgeMaterial = createWoodMaterial("oak");
    const sleeveMaterial = new THREE.MeshStandardMaterial({ color: 0x242522, roughness: 0.95 });
    materials.add(ledgeMaterial);
    textures.add(ledgeMaterial.map);
    materials.add(sleeveMaterial);
    const part = (name, width, height, depth, material, x, y, z) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
      mesh.name = name;
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      gallery.add(mesh);
      return mesh;
    };
    for (let row = 0; row < 2; row++) {
      const baseY = 150 + row * 1100;
      part(`Vinyl ledge ${row + 1}`, 3440, 35, 210, ledgeMaterial, 0, baseY, 0);
      part(`Vinyl ledge ${row + 1} front lip`, 3440, 60, 18, ledgeMaterial, 0, baseY + 30, 96);
      part(`Vinyl ledge ${row + 1} wall rail`, 3440, 105, 18, ledgeMaterial, 0, baseY + 50, -96);
      for (let column = 0; column < 3; column++) {
        const index = row * 3 + column;
        const album = albums[index];
        const x = (column - 1) * 1100;
        const y = baseY + 17.5 + 480;
        const material = new THREE.MeshStandardMaterial({ map: maps[index], roughness: 0.9, metalness: 0 });
        materials.add(material);
        // Put artwork directly on the sleeve's front face. The former plane was
        // only two units above the sleeve, which depth-quantized at Room distance.
        const cover = new THREE.Mesh(new THREE.BoxGeometry(960, 960, 24), [sleeveMaterial, sleeveMaterial, sleeveMaterial, sleeveMaterial, material, sleeveMaterial]);
        cover.name = `Vinyl cover — ${album.artist} — ${album.title}`;
        cover.userData.album = album.title;
        cover.userData.artist = album.artist;
        cover.position.set(x, y, -25);
        cover.rotation.x = -0.055;
        cover.castShadow = true;
        // Thin printed sleeves need no self-shadow sampling on the artwork.
        cover.receiveShadow = false;
        gallery.add(cover);
      }
    }
    scene.add(gallery);
  }
  async function bakedModel(model, texture) {
    const [gltf, map] = await Promise.all([gltfLoader.loadAsync(`/room/models/${model}`), textureLoader.loadAsync(`/room/models/${texture}`)]);
    textures.add(map);
    map.flipY = false;
    map.encoding = THREE.sRGBEncoding;
    const material = new THREE.MeshBasicMaterial({ map, color: 0xb7af9e });
    materials.add(material);
    gltf.scene.traverse(child => {
      if (child.isMesh) {
        child.scale.setScalar(900);
        const originals = Array.isArray(child.material) ? child.material : [child.material];
        originals.forEach(original => {
          Object.values(original).forEach(value => { if (value?.isTexture) value.dispose(); });
          original.dispose();
        });
        child.material = material;
        if (child.name === "Background") {
          child.geometry.computeVertexNormals();
          child.material = roomMaterial;
          child.receiveShadow = true;
          child.visible = false;
        }
        if (["desk", "chair_base", "chair_seat"].includes(child.name) || (model.startsWith("Decor/") && !["coffee", "plant"].includes(child.name))) child.visible = false;
        if (child.name === "plant") {
          child.geometry.computeBoundingBox();
          const bottom = child.geometry.boundingBox.min.y * child.scale.y;
          child.scale.y *= 1.45;
          child.position.y += bottom - child.geometry.boundingBox.min.y * child.scale.y;
          child.position.x += 1550;
        }
        if (child.name === "coffee") child.position.z -= 1600;
      }
    });
    if (disposed) { gltf.scene.traverse(child => child.geometry?.dispose()); map.dispose(); material.dispose(); return; }
    scene.add(gltf.scene);
  }
  chair = createAeronChair();
  chair.traverse(child => {
    if (!child.isMesh) return;
    materials.add(child.material);
    if (child.material.map) textures.add(child.material.map);
  });
  scene.add(chair);
  async function workstationModel() {
    const labels = ["fujifilm", "xt30", "tamron"];
    const [gltf, maps] = await Promise.all([
      gltfLoader.loadAsync("/room/models/Computer/ibm_5150.glb"),
      Promise.all(labels.map(name => textureLoader.loadAsync(`/room/textures/camera/${name}.svg`))),
    ]);
    maps.forEach(map => {
      map.encoding = THREE.sRGBEncoding;
      map.minFilter = THREE.LinearMipmapLinearFilter;
      map.generateMipmaps = true;
      map.anisotropy = 8;
      textures.add(map);
    });
    const fitted = fitWorkstation(gltf.scene, screenPosition, width);
    height = fitted.screenHeight;
    screenRotation.copy(fitted.screenRotation);
    const photoCamera = createFujifilmCamera(Object.fromEntries(labels.map((label, index) => [label, maps[index]])));
    photoCamera.scale.setScalar(5.2);
    photoCamera.rotation.y = -Math.PI / 7;
    photoCamera.position.set(-1850, 0, -500);
    // Ground the complete body on the fitted tabletop, not a hardcoded height.
    photoCamera.position.y = fitted.surfaceY - new THREE.Box3().setFromObject(photoCamera).min.y;
    [fitted.workstation, photoCamera].forEach(root => root.traverse(child => {
      if (!child.isMesh) return;
      const meshMaterials = Array.isArray(child.material) ? child.material : [child.material];
      meshMaterials.forEach(material => {
        materials.add(material);
        Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value); });
      });
    }));
    if (disposed) {
      fitted.workstation.traverse(child => child.geometry?.dispose());
      photoCamera.traverse(child => child.geometry?.dispose());
      textures.forEach(texture => texture.dispose());
      materials.forEach(material => material.dispose());
      return;
    }
    scene.add(fitted.workstation, photoCamera);
    monitorTargets.push(...fitted.monitorTargets);
    cleanupScreen = screen();
  }
  function screenPlane(material, offset = 0) {
    materials.add(material);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    mesh.position.copy(screenPosition).add(new THREE.Vector3(0, 0, offset).applyEuler(screenRotation));
    mesh.rotation.copy(screenRotation);
    scene.add(mesh);
    return mesh;
  }
  function screen() {
    const element = document.createElement("div");
    element.style.cssText = `width:${width}px;height:${height}px;background:#1d2e2f;border-radius:24px;overflow:hidden`;
    const iframe = document.createElement("iframe");
    iframe.src = "/desktop?embedded=1";
    iframe.title = "JasonOS — Jason Peng's portfolio";
    iframe.allow = "autoplay; encrypted-media; fullscreen; picture-in-picture";
    iframe.className = "jitter";
    iframe.style.cssText = `width:${width}px;height:${height}px;padding:32px;box-sizing:border-box;border:0;background:#1d2e2f`;
    element.append(iframe);
    const object = new CSS3DObject(element);
    object.position.copy(screenPosition);
    object.rotation.copy(screenRotation);
    cssScene.add(object);
    // Cut a transparent hole in WebGL so the CSS desktop underneath is visible.
    // NoBlending writes raw RGBA; white RGB with alpha 0 is invalid for the
    // canvas's premultiplied compositing and paints a white screen instead.
    monitorTargets.push(screenPlane(new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide, opacity: 0, transparent: true, blending: THREE.NoBlending, premultipliedAlpha: true })));
    const layers = [
      ["smudges.jpg", THREE.AdditiveBlending, 0.12, 96],
      ["shadow-compressed.png", THREE.NormalBlending, 1, 20],
    ];
    layers.forEach(([name, blending, opacity, offset]) => {
      const map = textureLoader.load(`/room/textures/monitor/layers/compressed/${name}`);
      textures.add(map);
      screenPlane(new THREE.MeshBasicMaterial({ map, blending, opacity, transparent: true, side: THREE.DoubleSide }), offset);
    });
    [["base-static.mp4", 0.5, 40], ["static-texture-layer.mp4", 0.1, 60]].forEach(([name, opacity, offset]) => {
      const video = document.createElement("video");
      video.src = `/room/textures/monitor/video/${name}`;
      video.loop = true; video.muted = true; video.playsInline = true;
      video.play().catch(() => {});
      videos.push(video);
      const map = new THREE.VideoTexture(video);
      textures.add(map);
      screenPlane(new THREE.MeshBasicMaterial({ map, blending: THREE.AdditiveBlending, transparent: true, side: THREE.DoubleSide, opacity }), offset);
    });
    dimmer = screenPlane(new THREE.MeshBasicMaterial({ color: 0, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }), 91);
    // Close the screen's side gaps so the CSS desktop stays inside the CRT casing.
    const casing = new THREE.Group();
    casing.position.copy(screenPosition);
    casing.rotation.copy(screenRotation);
    scene.add(casing);
    [[96, height, -width / 2, 0, 48, 0, Math.PI / 2], [96, height, width / 2, 0, 48, 0, Math.PI / 2], [width, 96, 0, height / 2, 48, Math.PI / 2, 0], [width, 96, 0, -height / 2, 48, Math.PI / 2, 0]].forEach(([w, h, x, y, z, rx, ry]) => {
      const material = new THREE.MeshBasicMaterial({ color: 0x48493f, side: THREE.DoubleSide });
      materials.add(material);
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
      plane.position.set(x, y, z);
      plane.rotation.set(rx, ry, 0);
      casing.add(plane);
    });
    const onMessage = event => {
      if (event.origin !== window.location.origin || event.source !== iframe.contentWindow || !event.data || event.data.channel !== "jason-os") return;
      if (event.data.type === "ready") { desktopLoaded = true; finishPreload(); }
      if (event.data.type === "mousedown" && (event.data.button ?? 0) === 0 && view === "desk") transition("monitor");
      if (event.data.type === "mousedown") sound("mouse/mouse_down.mp3", 0.18);
      if (event.data.type === "keydown") sound(`keyboard/key_${1 + Math.floor(Math.random() * 6)}.mp3`, 0.12);
      if (event.data.type === "exitMonitor") transition("desk");
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }
  let cleanupScreen = () => {};
  const steamMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, vertexShader: steamVertex, fragmentShader: steamFragment, uniforms: { uTime: { value: 0 }, uTimeFrequency: { value: 0.001 }, uUvFrequency: { value: new THREE.Vector2(3, 5) }, uColor: { value: new THREE.Color("#c9c9c9") } } });
  materials.add(steamMaterial);
  steam = new THREE.Mesh(new THREE.PlaneGeometry(280, 700), steamMaterial);
  steam.position.set(1670, 200, -700);
  scene.add(steam);
  // Grain overlay uses the reference's original shader, on the same WebGL renderer.
  const grainScene = new THREE.Scene();
  const grainMaterial = new THREE.ShaderMaterial({ vertexShader: grainVertex, fragmentShader: grainFragment, transparent: true, depthTest: false, depthWrite: false, uniforms: { u_time: { value: 1 } } });
  materials.add(grainMaterial);
  const grain = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), grainMaterial);
  grainScene.add(grain);

  const onClick = event => {
    if (event.target.closest("button, a, input, iframe")) return;
    if (view === "desk") {
      const bounds = host.getBoundingClientRect();
      const pointer = new THREE.Vector2((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
      scene.updateMatrixWorld();
      camera.updateMatrixWorld();
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.intersectObjects(monitorTargets).length) { transition("monitor"); return; }
    }
    if (tween) return;
    if (view === "room") transition("desk");
    else if (view === "desk") transition("room");
  };
  host.addEventListener("click", onClick);
  function tick(now) {
    if (disposed) return;
    elapsed += Math.min(now - lastTime, 100);
    lastTime = now;
    if (tween) {
      const t = Math.min((now - tween.start) / tween.duration, 1);
      const ease = 1 - Math.pow(1 - t, 5);
      // Ease into the ongoing pan itself. A fixed Room endpoint would snap to
      // the current pan position on the first frame after the tween finishes.
      if (view === "room") roomPosition(tween.to);
      position.lerpVectors(tween.from, tween.to, ease);
      focal.lerpVectors(tween.fromFocal, tween.toFocal, ease);
      if (t === 1) {
        tween = null;
        if (view === "free") { camera.position.copy(position); controls.target.copy(focal); controls.enabled = true; controls.update(); }
      }
    } else if (view === "room") {
      roomPosition(position);
    }
    if (!controls.enabled) {
      camera.position.copy(position);
      lookAt.copy(focal);
      camera.lookAt(lookAt);
    } else { controls.update(); position.copy(camera.position); focal.copy(controls.target); }
    steam.material.uniforms.uTime.value = elapsed;
    if (dimmer) {
      const direction = camera.position.clone().sub(screenPosition).normalize();
      const distance = camera.position.distanceTo(dimmer.position);
      const facing = direction.dot(new THREE.Vector3(0, 0, 1).applyEuler(screenRotation));
      dimmer.material.opacity = Math.max(0, Math.min(0.95, (1 - 10000 / distance) * 0.7 + (1 - facing) * 0.7));
    }
    renderer.autoClear = true;
    renderer.render(scene, camera);
    renderer.autoClear = false;
    grainMaterial.uniforms.u_time.value = Math.sin(now * 0.01);
    renderer.render(grainScene, camera);
    cssRenderer.render(cssScene, camera);
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  Promise.all([
    workstationModel(),
    vinylWall(),
    bakedModel("World/environment.glb", "World/baked_environment.jpg"),
    bakedModel("Decor/decor.glb", "Decor/baked_decor_modified.jpg"),
  ]).then(() => { assetsBuilt = true; finishPreload(); }).catch(error => { if (!disposed) onError(error); });

  return {
    start, transition, setMuted,
    destroy() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      cleanupScreen();
      host.removeEventListener("click", onClick);
      controls.dispose();
      audio.forEach(track => { track.pause(); track.removeAttribute("src"); track.load(); });
      videos.forEach(video => { video.pause(); video.removeAttribute("src"); video.load(); });
      scene.traverse(child => child.geometry?.dispose());
      grain.geometry.dispose();
      textures.forEach(texture => texture.dispose());
      materials.forEach(material => material.dispose());
      keyLight.shadow.map?.dispose();
      pendantLight.shadow.map?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      cssRenderer.domElement.remove();
    },
  };
}
