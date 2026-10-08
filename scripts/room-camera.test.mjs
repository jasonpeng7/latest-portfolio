import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import * as three from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Run the real camera controller with deterministic frames and mocked browser
// rendering. Three's vectors, camera, scenes, and materials are unchanged.
const source = (await readFile(new URL("../src/lib/room/createRoom.js", import.meta.url), "utf8"))
  .replace(/^import .*;\n/gm, "")
  .replace("export function createRoom", "function createRoom");
const fitSource = (await readFile(new URL("../src/lib/room/fitWorkstation.js", import.meta.url), "utf8"))
  .replace(/^import .*;\n/gm, "")
  .replace("export function fitWorkstation", "function fitWorkstation");
const furnitureSource = (await readFile(new URL("../src/lib/room/furniture.js", import.meta.url), "utf8"))
  .replace(/^import .*;\n/gm, "")
  .replace(/export function /g, "function ");
const trashSource = (await readFile(new URL("../src/lib/room/trashCan.js", import.meta.url), "utf8"))
  .replace(/^import .*;\n/gm, "")
  .replace(/export function /g, "function ");
const workstationBytes = await readFile(new URL("../public/room/models/Computer/ibm_5150.glb", import.meta.url));
const worldBytes = await readFile(new URL("../public/room/models/World/environment.glb", import.meta.url));
const decorBytes = await readFile(new URL("../public/room/models/Decor/decor.glb", import.meta.url));
const bedBytes = await readFile(new URL("../public/room/models/Bed/bed_agape.glb", import.meta.url));
const modelLoader = new GLTFLoader();
modelLoader.register(() => ({ name: "TEST_TEXTURES", loadTexture: () => Promise.resolve(new three.Texture()) }));

test("the left wastebasket starts over a clean floor, spills its actual contents once, and ends empty", async t => {
  const { room, advance, scenes, views, screenPoint, click } = await setup();
  t.after(() => room.destroy());
  const scene = [...scenes].find(value => value.getObjectByName("Trash can and scattered rubbish"));
  scene.updateMatrixWorld(true);
  const arrangement = scene.getObjectByName("Trash can and scattered rubbish");
  const bin = arrangement.getObjectByName("Under-desk trash can");
  const tabletop = scene.getObjectByName("IBM 5150 workstation").children.find(child => child.material?.name === "Wood");
  const deskBounds = new three.Box3().setFromObject(tabletop);
  const binBounds = new three.Box3().setFromObject(bin);
  assert.ok(binBounds.max.x < (deskBounds.min.x + deskBounds.max.x) / 2);
  assert.ok(binBounds.min.x > deskBounds.min.x && binBounds.max.z < deskBounds.max.z);
  assert.ok(arrangement.position.z < (deskBounds.min.z + deskBounds.max.z) / 2, "the can sits toward the back wall");
  assert.equal(binBounds.min.y, -2975);
  const contents = bin.children.filter(child => child.isGroup);
  assert.equal(contents.length, 6, "rubbish is visible inside the bin");
  assert.equal(arrangement.children.filter(child => child !== bin).length, 0, "floor initially has no rubbish");
  const target = arrangement.position.clone().add(new three.Vector3(-200, 650, 350));
  const currentView = views.at(-1);
  click(...screenPoint(target.toArray()));
  advance(200);
  assert.notEqual(bin.rotation.z, 0, "click starts the shake");
  assert.equal(views.at(-1), currentView, "click does not zoom into the desk");
  advance(800);
  const released = arrangement.children.filter(child => child !== bin);
  assert.ok(released.length > 0 && released.length < contents.length, "contents leave gradually");
  assert.ok(released.every(piece => contents.includes(piece)), "the original contents move out without duplicates");
  advance(3000);
  assert.equal(bin.rotation.z, 0);
  assert.equal(bin.position.y, 0);
  const floorPieces = arrangement.children.filter(child => child !== bin);
  assert.equal(floorPieces.length, contents.length);
  assert.equal(bin.children.filter(child => child.isGroup).length, 0, "the bin ends completely empty");
  assert.ok(contents.every(piece => floorPieces.includes(piece)), "all original rubbish is on the floor");
  scene.updateMatrixWorld(true);
  floorPieces.forEach(piece => {
    const bounds = new three.Box3().setFromObject(piece);
    assert.ok(Math.abs(bounds.min.y - (-2972)) < 0.01, "rubbish settles just above the floor");
  });
  const pieceCount = arrangement.children.length;
  const settledPositions = floorPieces.map(piece => piece.position.toArray());
  click(...screenPoint(target.toArray()));
  advance(200);
  assert.equal(bin.rotation.z, 0, "a second click does not replay the shake");
  assert.equal(views.at(-1), currentView, "clicking the empty bin does not change views");
  advance(3000);
  assert.equal(arrangement.children.length, pieceCount, "no rubbish is created after the first spill");
  assert.deepEqual(floorPieces.map(piece => piece.position.toArray()), settledPositions);
});

test("rubbish moves continuously from the tipping bin to irregular floor positions", () => {
  const context = vm.createContext({ THREE: three });
  vm.runInContext(`${furnitureSource}\n${trashSource}\nglobalThis.makeTrash = createInteractiveTrashCan;`, context);
  const prop = context.makeTrash();
  prop.group.position.set(-2500, -2975, -800);
  const contents = prop.bin.children.filter(child => child.isGroup);
  prop.group.updateMatrixWorld(true);
  let previous = contents.map(piece => piece.getWorldPosition(new three.Vector3()));
  prop.shake(0);
  for (let now = 16; now <= 3600; now += 16) {
    prop.update(now);
    prop.group.updateMatrixWorld(true);
    const current = contents.map(piece => piece.getWorldPosition(new three.Vector3()));
    current.forEach((position, index) => {
      assert.ok(position.distanceTo(previous[index]) < 180, "rubbish does not teleport when it leaves the bin or lands");
    });
    previous = current;
  }
  const xs = contents.map(piece => piece.position.x), zs = contents.map(piece => piece.position.z);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 600, "landings spread across the floor horizontally");
  assert.ok(Math.max(...zs) - Math.min(...zs) > 500, "landings have varied distances from the wall");
  const bearings = contents.map(piece => Math.atan2(piece.position.z, piece.position.x));
  assert.ok(Math.max(...bearings) - Math.min(...bearings) > 0.3, "rubbish does not form a uniform row");
  contents.forEach(piece => {
    assert.equal(piece.parent, prop.group);
    assert.ok(Math.abs(new three.Box3().setFromObject(piece).min.y + 2972) < 0.01);
  });
});

test("reduced motion spills the wastebasket immediately without shaking", async t => {
  const { room, scenes, views, screenPoint, click } = await setup({ reducedMotion: true });
  t.after(() => room.destroy());
  const scene = [...scenes].find(value => value.getObjectByName("Trash can and scattered rubbish"));
  const arrangement = scene.getObjectByName("Trash can and scattered rubbish");
  const bin = arrangement.getObjectByName("Under-desk trash can");
  const target = arrangement.position.clone().add(new three.Vector3(-200, 650, 350));
  const currentView = views.at(-1);
  click(...screenPoint(target.toArray()));
  assert.equal(views.at(-1), currentView);
  assert.equal(bin.rotation.z, 0);
  assert.equal(bin.children.filter(child => child.isGroup).length, 0);
  assert.equal(arrangement.children.filter(piece => piece !== bin && piece.visible).length, 6);
});

async function setup({ autoDesktopReady = true, holdLayers = false, viewportWidth = 1200, viewportHeight = 800, reducedMotion = false } = {}) {
  let now = 0, frame, camera, cssCamera, cssScene;
  let readyCount = 0;
  const pendingLayers = [];
  const listeners = new Map();
  const views = [];
  const vinylStates = [];
  let cameraReadyCount = 0;
  const scenes = new Set();
  let orbit;
  let resizeCallback;
  const element = () => ({
    style: {}, contentWindow: {}, setAttribute() {}, append() {}, remove() {},
    paused: true, playCount: 0, videoWidth: 1920, videoHeight: 1080,
    play() { this.paused = false; this.playCount++; return Promise.resolve(); }, pause() { this.paused = true; }, load() {}, removeAttribute() {},
    addEventListener() {}, removeEventListener() {},
    closest: () => false,
  });
  const iframe = element();
  class Renderer {
    constructor() { this.domElement = element(); this.shadowMap = {}; }
    setClearColor() {}
    setSize() {}
    setPixelRatio() {}
    render(scene, value) { camera = value; scenes.add(scene); }
    dispose() {}
  }
  class CSSRenderer extends Renderer {
    render(scene, value) { cssScene = scene; cssCamera = value; scenes.add(scene); }
  }
  class Loader {
    constructor(manager) { this.manager = manager; }
    loadAsync(url) {
      this.manager?.itemStart(url);
      const bytes = url.endsWith("ibm_5150.glb") ? workstationBytes : url.endsWith("environment.glb") ? worldBytes : url.endsWith("decor.glb") ? decorBytes : url.endsWith("bed_agape.glb") ? bedBytes : null;
      const pending = bytes ? modelLoader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "") : Promise.resolve(url.endsWith(".glb") ? { scene: new three.Group() } : new three.Texture());
      return pending.then(value => { this.manager?.itemEnd(url); return value; });
    }
    load(url) {
      this.manager?.itemStart(url);
      const complete = () => this.manager?.itemEnd(url);
      if (holdLayers) pendingLayers.push(complete);
      else queueMicrotask(complete);
      return new three.Texture();
    }
  }
  class CSSObject extends three.Object3D {
    constructor(value) { super(); this.element = value; }
  }
  class Controls {
    constructor() { this.target = new three.Vector3(); orbit = this; }
    update() {}
    dispose() {}
  }
  const events = {
    addEventListener(type, callback) {
      listeners.set(type, callback);
      if (type === "message" && autoDesktopReady) queueMicrotask(() => callback({ origin: "https://portfolio.test", source: iframe.contentWindow, data: { channel: "jason-os", type: "ready" } }));
    },
    removeEventListener(type) { listeners.delete(type); },
  };
  const host = { style: {}, clientWidth: viewportWidth, clientHeight: viewportHeight, append() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: host.clientWidth, height: host.clientHeight }), ...events };
  const shader = "void main() {}";
  const context = vm.createContext({
    THREE: { ...three, WebGLRenderer: Renderer, TextureLoader: Loader },
    GLTFLoader: Loader, CSS3DRenderer: CSSRenderer, CSS3DObject: CSSObject,
    OrbitControls: Controls,
    cameraFilm: { src: "/room/textures/monitor/video/real.mp4", title: "Film" },
    steamVertex: shader, steamFragment: shader, grainVertex: shader, grainFragment: shader,
    performance: { now: () => now },
    requestAnimationFrame(callback) { frame = callback; return 1; },
    cancelAnimationFrame() {},
    ResizeObserver: class { constructor(callback) { resizeCallback = callback; } observe() {} disconnect() {} },
    document: { createElement(type) { return type === "iframe" ? iframe : element(); } },
    window: { devicePixelRatio: 1, location: { origin: "https://portfolio.test" }, matchMedia: () => ({ matches: reducedMotion }), ...events },
    Audio: class {
      play() { return Promise.resolve(); }
      pause() {}
      removeAttribute() {}
      load() {}
    },
  });
  vm.runInContext(`${fitSource}\n${furnitureSource}\n${trashSource}\n${source}\nglobalThis.createRoom = createRoom;`, context);
  let resolveReady, rejectReady;
  const ready = new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
  const room = context.createRoom(host, {
    onProgress() {}, onReady: () => { readyCount++; resolveReady(); }, onError: rejectReady,
    onView(view) { views.push(view); },
    onCameraReady() { cameraReadyCount++; },
    onVinylState(state) { vinylStates.push(state); },
  });
  if (autoDesktopReady && !holdLayers) await ready;
  else while (!listeners.has("message")) await new Promise(resolve => setImmediate(resolve));
  const advance = milliseconds => { now += milliseconds; frame(now); return camera.position.clone(); };
  const message = (type, data = {}) => listeners.get("message")({
    origin: "https://portfolio.test", source: iframe.contentWindow,
    data: { channel: "jason-os", type, ...data },
  });
  if (autoDesktopReady && !holdLayers) { room.start(); advance(2500); }
  else advance(0);
  return {
    room, advance, message, views, scenes, cameraReadyCount: () => cameraReadyCount, vinylState: () => vinylStates.at(-1),
    screenRendering: () => ({ camera, cssCamera, cssScene }),
    ready, readyCount: () => readyCount, completeLayers: () => pendingLayers.splice(0).forEach(complete => complete()),
    sendRawMessage: event => listeners.get("message")(event),
    resize: (width, height) => { host.clientWidth = width; host.clientHeight = height; resizeCallback(); advance(0); },
    pose: () => ({ position: camera.position.toArray(), rotation: camera.quaternion.toArray() }),
    forceOrbit: offset => { camera.position.copy(orbit.target).add(new three.Vector3().fromArray(offset)); advance(16); },
    orbitTarget: () => orbit.target.clone(),
    move: (clientX, clientY) => listeners.get("pointermove")?.({ clientX, clientY }),
    pointerDown: (clientX, clientY) => listeners.get("pointerdown")?.({ clientX, clientY }),
    pointerUp: () => listeners.get("pointerup")?.(),
    click: (clientX = 0, clientY = 0) => listeners.get("click")({ target: element(), clientX, clientY }),
    screenPoint: world => {
      camera.updateMatrixWorld();
      if (!world) world = [...scenes].flatMap(scene => scene.children).find(child => child.isMesh && child.material.blending === three.NoBlending).position.toArray();
      const projected = new three.Vector3().fromArray(world).project(camera);
      return [(projected.x + 1) / 2 * host.clientWidth, (1 - projected.y) / 2 * host.clientHeight];
    },
  };
}

test("Start waits for monitor textures even after the embedded desktop is ready", async t => {
  const { room, ready, readyCount, message, completeLayers, views } = await setup({ holdLayers: true });
  t.after(() => room.destroy());
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(readyCount(), 0);
  room.start();
  assert.deepEqual(views, [], "the room cannot start while managed textures are still loading");
  completeLayers();
  await ready;
  assert.equal(readyCount(), 1);
  message("ready");
  assert.equal(readyCount(), 1, "duplicate readiness messages do not complete preload twice");
  room.start();
  assert.deepEqual(views, ["room"]);
});

test("Start waits for a readiness message from the actual embedded desktop", async t => {
  const { room, ready, readyCount, message, sendRawMessage, views } = await setup({ autoDesktopReady: false });
  t.after(() => room.destroy());
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(readyCount(), 0);
  sendRawMessage({ origin: "https://untrusted.test", source: {}, data: { channel: "jason-os", type: "ready" } });
  assert.equal(readyCount(), 0, "untrusted messages cannot enable Start");
  room.start();
  assert.deepEqual(views, []);
  message("ready");
  await ready;
  room.start();
  assert.deepEqual(views, ["room"]);
});

test("Desk and Computer move progressively closer, and Room returns to the wide view", async t => {
  const { room, advance, views } = await setup();
  t.after(() => room.destroy());
  const wide = advance(0);
  room.transition("desk");
  const midway = advance(800);
  const desk = advance(800);
  assert.ok(midway.distanceTo(wide) > 0, "camera moves before the animation finishes");
  assert.ok(midway.distanceTo(desk) > 0, "camera eases into the final position");
  assert.ok(desk.length() < wide.length(), "Desk zooms in from Room");
  room.transition("monitor");
  const computer = advance(1600);
  assert.ok(computer.z < desk.z, "Computer zooms closer to the monitor");
  room.transition("room");
  assert.ok(advance(1600).length() > desk.length(), "Room zooms back out");
  assert.deepEqual(views, ["room", "desk", "monitor", "room"]);
});

for (const closeView of ["desk", "monitor"]) {
  test(`returning from ${closeView} joins the Room pan without a position or rotation cut`, async t => {
    const { room, advance, pose } = await setup();
    t.after(() => room.destroy());
    const runFrames = milliseconds => {
      while (milliseconds > 0) {
        const step = Math.min(milliseconds, 16);
        advance(step);
        milliseconds -= step;
      }
    };
    // Sample different parts of the pan, including time spent in a close view.
    for (const wait of [5000, 19000, 36000]) {
      runFrames(wait);
      room.transition(closeView);
      runFrames(1600 + wait);
      room.transition("room");
      runFrames(1584);
      const before = advance(0);
      const endpoint = advance(16);
      const orientation = new three.Quaternion().fromArray(pose().rotation);
      const next = advance(16);
      const nextOrientation = new three.Quaternion().fromArray(pose().rotation);
      assert.ok(next.distanceTo(endpoint) < 30, "the first idle frame continues the gentle pan");
      assert.ok(orientation.angleTo(nextOrientation) < 0.002, "the camera orientation remains continuous");
      assert.ok(next.clone().sub(endpoint).distanceTo(endpoint.clone().sub(before)) < 0.2, "pan velocity is continuous across the end of the zoom");
      const later = advance(100);
      assert.ok(later.distanceTo(next) > 0.1, "automatic Room panning still runs after returning");
    }
  });
}

test("the entire monitor screen fits mobile portrait and landscape viewports after zoom and resize", async t => {
  const { room, advance, scenes, screenPoint, resize, pose } = await setup({ viewportWidth: 390, viewportHeight: 844 });
  t.after(() => room.destroy());
  room.transition("monitor");
  advance(1600);
  const aperture = [...scenes].flatMap(scene => scene.children).find(child => child.isMesh && child.material.blending === three.NoBlending);
  const chair = [...scenes].flatMap(scene => scene.children).find(child => child.name === "Aeron-style black mesh chair");
  assert.equal(chair.visible, false, "the chair is hidden as mobile Computer view starts");
  aperture.updateWorldMatrix(true, false);
  for (const [width, height] of [[390,844], [320,568], [430,932], [768,390], [844,390], [932,430]]) {
    resize(width, height);
    assert.equal(chair.visible, false, `chair cannot obscure the screen at ${width}×${height}`);
    const positions = aperture.geometry.attributes.position;
    for (let index = 0; index < positions.count; index++) {
      const corner = new three.Vector3().fromBufferAttribute(positions, index).applyMatrix4(aperture.matrixWorld);
      const [x, y] = screenPoint(corner.toArray());
      assert.ok(x >= width * 0.05 && x <= width * 0.95, `screen has horizontal padding at ${width}×${height}`);
      assert.ok(y >= height * 0.1 && y <= height * 0.9, `screen has vertical padding at ${width}×${height}`);
    }
  }
  resize(1200,800);
  assert.equal(pose().position[2] - aperture.position.z, 1995, "the desktop Computer zoom keeps its distance from the relocated monitor");
  assert.equal(chair.visible, true, "normal desktop room geometry is restored after resizing");
  resize(390,844);
  assert.equal(chair.visible, false);
  room.transition("desk");
  advance(1600);
  assert.equal(chair.visible, true, "the chair returns in mobile Desk view");
  room.transition("monitor");
  advance(1600);
  assert.equal(chair.visible, false);
  room.transition("room");
  advance(1600);
  assert.equal(chair.visible, true, "the chair returns in mobile Room view");
});

test("a Computer button click can replace an unfinished Desk zoom", async t => {
  const { room, advance, views } = await setup();
  t.after(() => room.destroy());
  room.transition("desk");
  advance(400);
  room.transition("monitor");
  const computer = advance(1600);
  assert.equal(views.at(-1), "monitor");
  assert.ok(computer.z < 3000);
});

test("monitor hover and background clicks cannot hijack a button's active zoom", async t => {
  const { room, advance, message, click, views } = await setup();
  t.after(() => room.destroy());
  room.transition("desk");
  advance(400);
  message("mousemove");
  click();
  const desk = advance(1200);
  assert.deepEqual(views, ["room", "desk"]);
  assert.ok(desk.z > 3000, "camera remains at Desk");
  message("mousemove");
  assert.equal(views.at(-1), "desk", "hover never selects Computer");
  room.transition("monitor");
  advance(1600);
  room.transition("room");
  advance(400);
  message("mousemove");
  assert.equal(views.at(-1), "room");
});

test("clicking the monitor from Desk zooms into Computer without hover switching", async t => {
  const { room, advance, message, views } = await setup();
  t.after(() => room.destroy());
  room.transition("desk");
  advance(1600);
  const desk = advance(0);
  message("mousemove");
  message("mousedown", { button: 2 });
  assert.equal(views.at(-1), "desk", "hover and right clicks do not zoom");
  message("mousedown", { button: 0 });
  assert.equal(views.at(-1), "monitor");
  assert.ok(advance(1600).z < desk.z, "a monitor click moves the camera closer");
});

test("clicks on the projected monitor surface also zoom into Computer", async t => {
  const { room, advance, click, screenPoint, views } = await setup();
  t.after(() => room.destroy());
  room.transition("desk");
  advance(1600);
  click(...screenPoint());
  assert.equal(views.at(-1), "monitor", "the monitor is hit-tested in the real camera's projection");
});

test("clicking the replacement IBM case still zooms into Computer", async t => {
  const { room, advance, click, screenPoint, views } = await setup();
  t.after(() => room.destroy());
  room.transition("desk");
  advance(1600);
  click(...screenPoint([800, -100, 550]));
  assert.equal(views.at(-1), "monitor", "the new model's casing participates in click detection");
});

test("the supplied workstation keeps its textured materials and replaces its baked CRT", async t => {
  const { room, scenes } = await setup();
  t.after(() => room.destroy());
  const workstation = [...scenes].flatMap(scene => scene.children).find(child => child.name === "IBM 5150 workstation");
  assert.ok(workstation);
  const meshes = [];
  workstation.traverse(child => { if (child.isMesh) meshes.push(child); });
  assert.ok(meshes.some(mesh => mesh.material.name === "Monitor" && mesh.material.isMeshStandardMaterial && mesh.material.map));
  assert.ok(meshes.some(mesh => mesh.material.name === "Wood" && mesh.material.map));
  assert.ok(!meshes.some(mesh => mesh.material.name === "Pantalla"), "the original static CRT is removed so the OS remains interactive");
  const legs = meshes.filter(mesh => mesh.name === "Desk steel leg");
  assert.equal(legs.length, 4);
  for (const leg of legs) assert.ok(Math.abs(new three.Box3().setFromObject(leg).min.y + 2980) < 1, "desk legs reach the existing room floor");
});

test("the larger desk has a live shadow receiver and the left paper is removed", async t => {
  const { room, scenes } = await setup();
  t.after(() => room.destroy());
  const meshes = [];
  for (const scene of scenes) scene.traverse(child => { if (child.isMesh) meshes.push(child); });
  assert.ok(!meshes.some(mesh => mesh.material.name === "Folleto"), "the left white paper is removed from the replacement model");
  const desk = meshes.find(mesh => mesh.material.name === "Wood");
  const deskBounds = new three.Box3().setFromObject(desk);
  assert.ok(deskBounds.getSize(new three.Vector3()).x > 7400);
  assert.ok(deskBounds.getSize(new three.Vector3()).z > 3500);
  assert.ok(desk.castShadow && desk.receiveShadow);
  const wall = meshes.find(mesh => mesh.name === "Vinyl gallery wall");
  const wallGap = deskBounds.min.z - new three.Box3().setFromObject(wall).max.z;
  assert.ok(wallGap > 100 && wallGap < 250, "the desk is against the back wall with room for its baseboard and cables");
  const floor = meshes.find(mesh => mesh.name === "Live shadow floor");
  assert.ok(floor.receiveShadow && floor.material.isMeshStandardMaterial && !floor.material.transparent);
  assert.ok(floor.material.polygonOffset, "the replacement floor avoids depth fighting with the original floor");
  assert.ok(!meshes.find(mesh => mesh.name === "Background").material.map, "the outdated baked desk shadow is no longer displayed");
});

test("the taller plant stays on the floor to the right of the bed", async t => {
  const { room, scenes } = await setup();
  t.after(() => room.destroy());
  const meshes = [];
  for (const scene of scenes) scene.traverse(child => { if (child.isMesh) meshes.push(child); });
  const plantBounds = new three.Box3().setFromObject(meshes.find(mesh => mesh.name === "plant"));
  const deskBounds = new three.Box3().setFromObject(meshes.find(mesh => mesh.material.name === "Wood"));
  const bed = [...scenes].flatMap(scene => scene.children).find(child => child.name === "Bed Agape with integrated nightstand");
  const bedBounds = new three.Box3().setFromObject(bed);
  assert.ok(plantBounds.getSize(new three.Vector3()).y > 5000);
  assert.ok(Math.abs(plantBounds.min.y + 2986) < 1, "stretching the plant does not lift its pot from the floor");
  assert.ok(plantBounds.min.x > deskBounds.max.x, "the plant clears the larger table");
  assert.ok(plantBounds.min.x > bedBounds.max.x + 500, "the plant clears the right side of the bed");
  assert.ok(plantBounds.min.z > -1800 && plantBounds.max.z < bedBounds.max.z, "the plant sits beside the bed toward the back wall");
});

test("the warm pendant keeps live shadows in the brighter neutral room", async t => {
  const { room, scenes } = await setup();
  t.after(() => room.destroy());
  const objects = [];
  for (const scene of scenes) scene.traverse(child => objects.push(child));
  const pendant = objects.find(object => object.name === "Warm hanging pendant");
  const light = objects.find(object => object.name === "Pendant warm light");
  assert.ok(pendant && pendant.position.y > 4000);
  assert.ok(light.isSpotLight && light.castShadow);
  assert.ok(light.color.r > light.color.b, "the light has a warm color");
  assert.ok(light.target.position.y < light.position.y, "the light points down toward the desk");
  assert.ok(objects.find(object => object.isHemisphereLight).intensity >= 0.5, "neutral daylight fills the modern room");
});

test("all six wall records fit in Room and remain unobstructed by the workstation in Desk", async t => {
  const { room, advance, scenes, screenPoint, pose } = await setup();
  t.after(() => room.destroy());
  const objects = [];
  for (const scene of scenes) scene.traverse(child => objects.push(child));
  const covers = objects.filter(object => object.name.startsWith("Vinyl cover —"));
  assert.equal(covers.length, 6);
  assert.deepEqual(covers.map(cover => cover.userData.album), ["HEROES & VILLAINS", "Graduation", "Souled Out", "Take Care", "1989", "petal"]);
  assert.equal(objects.filter(object => /^Vinyl ledge [12]$/.test(object.name)).length, 2);
  const isVisible = object => { for (let current = object; current; current = current.parent) if (!current.visible) return false; return true; };
  const solidMeshes = objects.filter(object => object.isMesh && isVisible(object) && (object.castShadow || covers.includes(object)));
  solidMeshes.forEach(object => object.updateWorldMatrix(true, false));
  for (const view of ["room", "desk"]) {
    room.transition(view);
    advance(1600);
    const origin = new three.Vector3().fromArray(pose().position);
    for (const cover of covers) {
      cover.updateWorldMatrix(true, false);
      // Desk keeps its established camera position when furniture moves; the
      // closer gallery may extend beyond that view. Room shows every sleeve.
      for (const corner of view === "room" ? [[-480,-480,0],[-480,480,0],[480,-480,0],[480,480,0]] : []) {
        const point = new three.Vector3().fromArray(corner).applyMatrix4(cover.matrixWorld);
        const [x, y] = screenPoint(point.toArray());
        assert.ok(x >= 0 && x <= 1200 && y >= 0 && y <= 800, `${cover.userData.album} fits inside ${view}`);
      }
      const center = cover.getWorldPosition(new three.Vector3());
      const ray = new three.Raycaster(origin, center.clone().sub(origin).normalize());
      const hit = ray.intersectObjects(solidMeshes, false)[0];
      assert.equal(hit?.object, cover, `${cover.userData.album} is visible rather than hidden by the workstation in ${view}`);
    }
  }
});

for (const [viewportWidth, viewportHeight] of [[1440, 900], [390, 844], [844, 390]]) {
  test(`clicking the vinyl shelf and each sleeve opens a fitted close-up and restores it at ${viewportWidth}×${viewportHeight}`, async t => {
    const { room, advance, scenes, screenPoint, click, views, vinylState, resize } = await setup({ viewportWidth, viewportHeight });
    t.after(() => room.destroy());
    const scene = [...scenes].find(value => value.getObjectByName("Two-row vinyl gallery"));
    const gallery = scene.getObjectByName("Two-row vinyl gallery");
    const covers = gallery.children.filter(child => child.userData.album);
    const rest = covers.map(cover => ({ position: cover.position.clone(), quaternion: cover.quaternion.clone() }));
    scene.updateMatrixWorld(true);
    const first = covers[0].getWorldPosition(new three.Vector3());
    click(...screenPoint(first.toArray()));
    assert.equal(views.at(-1), "shelves", "clicking a sleeve first zooms into the full collection");
    advance(1600);
    assert.equal(vinylState().ready, true);
    for (const [index, cover] of covers.entries()) {
      scene.updateMatrixWorld(true);
      const center = cover.getWorldPosition(new three.Vector3());
      click(...screenPoint(center.toArray()));
      assert.equal(views.at(-1), "vinyl", `${cover.userData.album} responds to its own 3D click`);
      assert.equal(vinylState().selected, index);
      assert.equal(vinylState().ready, false);
      advance(800);
      assert.ok(cover.position.z > rest[index].position.z + 200, "the original sleeve lifts off the ledge");
      assert.equal(vinylState().ready, false);
      advance(800);
      assert.equal(vinylState().ready, true);
      scene.updateMatrixWorld(true);
      click(...screenPoint(cover.getWorldPosition(new three.Vector3()).toArray()));
      assert.equal(views.at(-1), "vinyl", "clicking the enlarged sleeve itself keeps its close-up open");
      for (const corner of [[-480,-480,12], [-480,480,12], [480,-480,12], [480,480,12]]) {
        const world = new three.Vector3(...corner).applyMatrix4(cover.matrixWorld);
        const [x, y] = screenPoint(world.toArray());
        assert.ok(x >= 0 && x <= viewportWidth && y >= 0 && y < viewportHeight * .75, "the whole cover fits above the controls");
      }
      if (index === 0) {
        resize(viewportHeight, viewportWidth);
        advance(550);
        resize(viewportWidth, viewportHeight);
        advance(550);
      }
      covers.forEach((other, otherIndex) => {
        if (other !== cover) assert.ok(other.position.distanceTo(rest[otherIndex].position) < 0.001, "other sleeves stay on the shelf");
      });
      click(0, viewportHeight - 1);
      advance(1300);
      assert.equal(views.at(-1), "shelves");
      assert.ok(cover.position.distanceTo(rest[index].position) < 0.001);
      assert.ok(cover.quaternion.angleTo(rest[index].quaternion) < 0.001);
      assert.equal(vinylState().selected, null);
    }
    click(0, viewportHeight - 1);
    advance(1300);
    assert.equal(views.at(-1), "room");
    room.transition("desk");
    advance(1600);
    room.transition("shelves");
    advance(1600);
    click(0, viewportHeight - 1);
    advance(1300);
    assert.equal(views.at(-1), "room", "click-away leaves the gallery for Room even when entered from Desk");
  });
}

test("leaving during a vinyl lift returns the sleeve without stranding it", async t => {
  const { room, advance, scenes, views, click, pointerDown, move, pointerUp } = await setup();
  t.after(() => room.destroy());
  const scene = [...scenes].find(value => value.getObjectByName("Two-row vinyl gallery"));
  const cover = scene.getObjectByName("Two-row vinyl gallery").children.find(child => child.userData.album);
  const rest = cover.position.clone();
  room.transition("shelves");
  advance(1600);
  room.openVinyl(0);
  advance(500);
  room.transition("desk");
  advance(1600);
  assert.equal(views.at(-1), "desk");
  assert.ok(cover.position.distanceTo(rest) < 0.001);
  room.transition("shelves");
  advance(1600);
  room.openVinyl(0);
  advance(1600);
  assert.equal(views.at(-1), "vinyl", "the record can be selected again after cancellation");
  pointerDown(10, 700);
  move(50, 750);
  pointerUp();
  click(50, 750);
  assert.equal(views.at(-1), "vinyl", "a drag does not trigger click-away");
  room.closeVinyl();
  advance(1300);
  room.openVinyl(0);
  advance(500);
  click(0, 799);
  assert.equal(views.at(-1), "shelves", "click-away can cancel an unfinished lift");
  advance(1300);
  assert.ok(cover.position.distanceTo(rest) < 0.001, "cancelling by click-away restores the exact shelf position");
});

test("reduced motion opens and returns a vinyl sleeve without a long lift", async t => {
  const { room, advance, scenes, views, vinylState } = await setup({ reducedMotion: true });
  t.after(() => room.destroy());
  const gallery = [...scenes].map(scene => scene.getObjectByName("Two-row vinyl gallery")).find(Boolean);
  const cover = gallery.children.find(child => child.userData.index === 4);
  const rest = cover.position.clone();
  room.transition("shelves");
  advance(1);
  room.openVinyl(4);
  advance(1);
  assert.equal(views.at(-1), "vinyl");
  assert.equal(vinylState().ready, true);
  assert.equal(vinylState().selected, 4);
  assert.ok(cover.position.z > rest.z + 2000);
  room.closeVinyl();
  advance(1);
  assert.equal(views.at(-1), "shelves");
  assert.ok(cover.position.distanceTo(rest) < 0.001);
});

test("wood textures upload as opaque sRGB RGBA instead of unsupported RGB", async t => {
  const { room, scenes } = await setup();
  t.after(() => room.destroy());
  const textures = new Set();
  let oak, slatMaterial;
  for (const scene of scenes) scene.traverse(object => {
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (material?.map?.isDataTexture && material.map.encoding === three.sRGBEncoding) textures.add(material.map);
    }
    if (object.name === "Vinyl ledge 1") oak = object.material.map;
    if (object.name === "Oak wall battens") slatMaterial = object.material;
  });
  assert.ok(oak);
  for (const map of textures) {
    assert.ok(map.version > 0, "procedural textures, including cloned ledge maps, are queued for GPU upload");
    assert.equal(map.format, three.RGBAFormat, "WebGL2 supports sRGB RGBA8 uploads");
    assert.equal(map.image.data.length, map.image.width * map.image.height * 4, "each texel has all four channels");
  }
  for (let index = 0; index < oak.image.data.length; index += 4) {
    assert.ok(oak.image.data[index] > oak.image.data[index + 1] && oak.image.data[index + 1] > oak.image.data[index + 2]);
    assert.equal(oak.image.data[index + 3], 255);
  }
  assert.deepEqual(oak.image.data, slatMaterial.map.image.data, "vinyl ledges use the slatted wall's smoked-oak color");
});

test("the camera rests on the desk's left with its lens and Fujifilm badge visible", async t => {
  const { room, scenes, advance, pose, screenPoint } = await setup();
  t.after(() => room.destroy());
  const objects = [];
  for (const scene of scenes) { scene.updateMatrixWorld(true); scene.traverse(child => objects.push(child)); }
  const prop = objects.find(object => object.name === "Fujifilm X-T30 II with Tamron 17-70mm");
  const desk = objects.find(object => object.isMesh && object.material.name === "Wood");
  assert.ok(prop);
  const bounds = new three.Box3().setFromObject(prop);
  const tabletop = new three.Box3().setFromObject(desk);
  assert.ok(Math.abs(bounds.min.y - tabletop.max.y) < 1, "the camera base rests on the tabletop");
  assert.ok(bounds.min.x > tabletop.min.x && bounds.max.x < -1200, "the camera sits on the monitor's left without intersecting the case");
  assert.ok(bounds.min.z > tabletop.min.z && bounds.max.z < tabletop.max.z, "the full lens stays over the table");
  const direction = new three.Vector3(0, 0, 1).transformDirection(prop.matrixWorld);
  assert.ok(direction.x < -0.25 && direction.z > 0.8, "the lens points slightly left while facing the Desk viewer");
  const badge = objects.find(object => object.name === "FUJIFILM front badge");
  const lens = objects.find(object => object.name === "Tamron front rim");
  const isVisible = object => { for (let current = object; current; current = current.parent) if (!current.visible) return false; return true; };
  const solid = objects.filter(object => object.isMesh && isVisible(object) && (object.castShadow || object === badge));
  for (const view of ["room", "desk"]) {
    room.transition(view);
    advance(1600);
    const origin = new three.Vector3().fromArray(pose().position);
    for (const target of [badge, lens]) {
      const center = target.getWorldPosition(new three.Vector3());
      const [x, y] = screenPoint(center.toArray());
      assert.ok(x > 0 && x < 1200 && y > 0 && y < 800, `${target.name} fits in ${view}`);
      const hit = new three.Raycaster(origin, center.clone().sub(origin).normalize()).intersectObjects(solid, false)[0];
      assert.ok(hit && (hit.object === target || (target === lens && hit.object.name.startsWith("Tamron"))), `${target.name} is visible in ${view}`);
    }
  }
});

test("the replacement chair is grounded and clear of the desk while the original chair is hidden", async t => {
  const { room, scenes } = await setup();
  t.after(() => room.destroy());
  const objects = [];
  for (const scene of scenes) scene.traverse(child => objects.push(child));
  const chair = objects.find(object => object.name === "Aeron-style black mesh chair");
  assert.ok(chair);
  assert.ok(objects.find(object => object.name === "Chair suspended mesh back"));
  assert.ok(objects.find(object => object.name === "Chair brown back trim").material.map);
  assert.equal(objects.filter(object => object.name === "Chair base spoke").length, 5);
  assert.ok(!objects.find(object => object.name === "chair_base").visible);
  assert.ok(!objects.find(object => object.name === "chair_seat").visible);
  const bounds = new three.Box3();
  const point = new three.Vector3();
  chair.updateWorldMatrix(true, true);
  chair.traverse(object => {
    if (!object.isMesh) return;
    const positions = object.geometry.attributes.position;
    for (let index = 0; index < positions.count; index++) bounds.expandByPoint(point.fromBufferAttribute(positions, index).applyMatrix4(object.matrixWorld));
  });
  assert.ok(Math.abs(bounds.min.y + 2975) < 1, "caster tires rest on the live floor");
  const desk = objects.find(object => object.isMesh && object.material.name === "Wood");
  assert.ok(bounds.min.z > new three.Box3().setFromObject(desk).max.z, "the replacement chair does not intersect the desk");
});

test("the original workstation anchors the wall, bed, shelves, and lighting", async t => {
  const { room, scenes } = await setup();
  t.after(() => room.destroy());
  const objects = [...scenes].flatMap(scene => { const result = []; scene.traverse(object => result.push(object)); return result; });
  const aperture = objects.find(object => object.isMesh && object.material.blending === three.NoBlending);
  assert.deepEqual(aperture.position.toArray(), [0, 950, 255], "the monitor uses its original absolute position");
  const wall = objects.find(object => object.name === "Vinyl gallery wall");
  const desk = new three.Box3().setFromObject(objects.find(object => object.material?.name === "Wood"));
  assert.ok(desk.min.z - wall.position.z > 150 && desk.min.z - wall.position.z < 200, "the wall keeps the existing cable and baseboard clearance behind the desk");
  const bed = new three.Box3().setFromObject(objects.find(object => object.name === "Bed Agape with integrated nightstand"));
  assert.ok(Math.abs(bed.min.z - wall.position.z - 300) < .001, "the bed keeps its clearance from the moved wall");
  assert.equal(objects.find(object => object.name === "Two-row vinyl gallery").position.z - wall.position.z, 130);
  const poster = objects.find(object => object.name === "Heroes & Villains — Don Toliver comic poster");
  const slats = objects.find(object => object.name === "Oak wall battens");
  const slatTransform = new three.Matrix4();
  slats.getMatrixAt(0, slatTransform);
  slats.geometry.computeBoundingBox();
  const slatFront = slats.geometry.boundingBox.max.z + new three.Vector3().setFromMatrixPosition(slatTransform).z;
  assert.ok(new three.Box3().setFromObject(poster).min.z > slatFront, "the poster frame clears the new oak battens");
  const pendant = objects.find(object => object.name === "Pendant warm light");
  assert.equal(pendant.position.z, 250, "desk lighting returns to its original position");
});

test("four warm plaster walls meet the oak floor at square white baseboards", async t => {
  const { room, scenes } = await setup();
  t.after(() => room.destroy());
  const objects = [];
  for (const scene of scenes) scene.traverse(child => objects.push(child));
  const wall = objects.find(object => object.name === "Vinyl gallery wall");
  const floor = objects.find(object => object.name === "Live shadow floor");
  assert.notEqual(wall.material, floor.material, "the oak floor and plaster walls keep distinct finishes");
  const walls = objects.filter(object => object.material?.name === "Warm off-white plaster");
  assert.equal(walls.length,4);
  const wallBounds = new three.Box3().setFromObject(wall);
  const floorBounds = new three.Box3().setFromObject(floor);
  assert.ok(Math.abs(wallBounds.min.y - floorBounds.min.y) < 1);
  assert.ok(Math.abs(wallBounds.min.z - floorBounds.min.z) < 1, "the wall meets the edge of the flat floor");
  const trims = objects.filter(object => object.name.endsWith(" baseboard"));
  assert.equal(trims.length,4);
  for (const trim of trims) {
    const bounds = new three.Box3().setFromObject(trim);
    assert.ok(Math.abs(bounds.min.y - floorBounds.min.y) < 1,"baseboards sit directly on the floor");
    assert.ok(bounds.max.y - bounds.min.y > 200);
  }
  const feature = objects.find(object => object.name === "Vertical oak feature wall");
  const panel = feature.children.find(object => !object.isInstancedMesh);
  const panelBounds = new three.Box3().setFromObject(panel);
  const backTrim = objects.find(object => object.name === "Vinyl gallery wall baseboard");
  assert.equal(backTrim.children.length, 4, "both baseboard profiles are split around the feature wall");
  for (const profile of backTrim.children) {
    const bounds = new three.Box3().setFromObject(profile);
    assert.ok(bounds.max.x <= panelBounds.min.x || bounds.min.x >= panelBounds.max.x, "no baseboard overlaps the oak panel");
  }
  assert.ok(!objects.find(object => object.name === "Background").visible);
});

test("a monitor click during the Desk zoom immediately selects Computer", async t => {
  const { room, advance, message, views } = await setup();
  t.after(() => room.destroy());
  room.transition("desk");
  advance(400);
  message("mousedown", { button: 0 });
  assert.equal(views.at(-1), "monitor");
  assert.ok(advance(1600).z < 3000, "explicit clicks can replace the active zoom");
});

test("the WebGL monitor aperture reveals the desktop instead of compositing white", async t => {
  const { room, scenes } = await setup();
  t.after(() => room.destroy());
  const aperture = [...scenes].flatMap(scene => scene.children).find(child => child.isMesh && child.material.blending === three.NoBlending);
  assert.ok(aperture, "the monitor has an aperture through the WebGL scene");
  const material = aperture.material;
  // NoBlending writes shader output directly. A premultiplied canvas composites
  // that RGB plus the desktop RGB * (1 - alpha), so alpha 0 must also have RGB 0.
  const rgb = material.color.toArray().map(value => material.premultipliedAlpha ? value * material.opacity : value);
  assert.equal(material.opacity, 0);
  assert.deepEqual(rgb, [0, 0, 0], "transparent WebGL pixels add no white over the embedded desktop");
});

test("the embedded screen keeps a clickable CSS depth and aligns with the CRT through every view", async t => {
  const { room, advance, resize, scenes, screenRendering } = await setup();
  t.after(() => room.destroy());
  const aperture = [...scenes].flatMap(scene => scene.children).find(child => child.isMesh && child.material.blending === three.NoBlending);
  for (const [width, height] of [[1200, 800], [390, 844], [844, 390]]) {
    resize(width, height);
    for (const view of ["room", "desk", "monitor", "camera"]) {
      room.transition(view);
      for (const duration of [800, 800]) {
        advance(duration);
        const { camera, cssCamera, cssScene } = screenRendering();
        cssScene.updateMatrixWorld(true);
        camera.updateMatrixWorld(true);
        cssCamera.updateMatrixWorld(true);
        aperture.updateMatrixWorld(true);
        const screen = cssScene.children.find(child => child.element);
        assert.ok(screen.getWorldPosition(new three.Vector3()).z > 0, "the CSS screen stays ahead of its containing plane for pointer hit tests");
        for (const [x, y] of [[-640, -452], [640, -452], [640, 452], [-640, 452], [0, 0]]) {
          const cssPoint = new three.Vector3(x, y, 0).applyMatrix4(screen.matrixWorld).project(cssCamera);
          const webglPoint = new three.Vector3(x, y, 0).applyMatrix4(aperture.matrixWorld).project(camera);
          assert.ok(cssPoint.distanceTo(webglPoint) < 1e-9, `${view} at ${width}×${height}: the interactive screen matches the WebGL aperture`);
        }
      }
    }
  }
});

test("the settled Desk camera stays fixed as the cursor moves", async t => {
  const { room, advance, pose, move } = await setup();
  t.after(() => room.destroy());
  room.transition("desk");
  advance(1600);
  const fixed = pose();
  for (const [x, y] of [[0, 0], [1200, 800], [600, 400]]) {
    move(x, y);
    advance(16);
    assert.deepEqual(pose(), fixed, "cursor movement changes neither position nor orientation");
  }
});

test("Escape from the embedded desktop still returns Computer to Desk", async t => {
  const { room, advance, message, views } = await setup();
  t.after(() => room.destroy());
  room.transition("monitor");
  advance(1600);
  message("exitMonitor");
  assert.equal(views.at(-1), "desk");
});

for (const [viewportWidth, viewportHeight] of [[1440,900],[390,844],[844,390]]) {
  test(`camera click opens a fitted close-up and returns smoothly at ${viewportWidth}×${viewportHeight}`, async t => {
    const context = await setup({ viewportWidth, viewportHeight });
    const { room, scenes, advance, click, screenPoint, views, cameraReadyCount, pose } = context;
    t.after(() => room.destroy());
    room.transition("desk");
    advance(1600);
    const desk = advance(0);
    const prop = [...scenes].flatMap(scene => scene.children).find(object => object.name.startsWith("Fujifilm"));
    const bounds = new three.Box3().setFromObject(prop);
    const [cameraX, cameraY] = screenPoint(bounds.getCenter(new three.Vector3()).toArray());
    assert.ok(cameraX > 0 && cameraX < viewportWidth && cameraY > 0 && cameraY < viewportHeight, "the camera can actually be tapped inside the Desk viewport");
    click(cameraX, cameraY);
    assert.equal(views.at(-1), "camera", "the camera's own hit target wins over the desk background");
    const restPosition = prop.position.clone();
    const restRotation = prop.quaternion.clone();
    assert.equal(cameraReadyCount(), 0, "playback waits for the lift and turn");
    const halfway = advance(1050);
    assert.ok(halfway.distanceTo(desk) > 0, "the approach moves progressively");
    assert.ok(prop.position.y > restPosition.y + 300, "the camera lifts clear of the tabletop");
    assert.ok(prop.quaternion.angleTo(restRotation) > .1, "the physical camera turns");
    advance(1050);
    assert.equal(cameraReadyCount(), 1);
    const rearDirection = new three.Vector3(0,0,-1).applyQuaternion(prop.quaternion);
    assert.ok(rearDirection.z > .99, "the rear LCD faces the viewer");
    const lcd = prop.getObjectByName("Camera LCD playback");
    assert.ok(lcd.material.map.isVideoTexture, "the actual LCD plays the video texture");
    assert.equal(lcd.material.map.image.paused,false);
    assert.equal(lcd.parent,prop, "the playback surface follows the physical camera");
    prop.updateMatrixWorld(true);
    for (const x of [-64/2,64/2]) for (const y of [-37/2,37/2]) {
      const world = lcd.localToWorld(new three.Vector3(x,y,0));
      const [px, py] = screenPoint(world.toArray());
      assert.ok(px > viewportWidth*.05 && px < viewportWidth*.95 && py > viewportHeight*.05 && py < viewportHeight*.95, "the rear LCD fits with padding");
    }
    const beforeResize = pose();
    context.resize(viewportHeight, viewportWidth);
    assert.deepEqual(pose(), beforeResize, "orientation changes do not cut the current pose");
    advance(550);
    room.closeCamera();
    assert.equal(views.at(-1), "desk");
    assert.equal(lcd.material.map.image.paused,true, "closing stops the film immediately");
    const from = advance(0);
    assert.ok(advance(650).distanceTo(from) > 0, "closing animates back instead of snapping");
    advance(650);
    assert.ok(prop.position.distanceTo(restPosition) < .001, "the camera lands at its original table position");
    assert.ok(prop.quaternion.angleTo(restRotation) < .001, "the original angle is restored");
  });
}

test("camera approach can be cancelled without starting the film or stranding the camera", async t => {
  const { room, scenes, advance, cameraReadyCount, views } = await setup();
  t.after(() => room.destroy());
  const prop = [...scenes].flatMap(scene => scene.children).find(object => object.name.startsWith("Fujifilm"));
  const rest = prop.position.clone(), rotation = prop.quaternion.clone();
  room.transition("camera",1300);
  advance(300);
  room.closeCamera();
  advance(1300);
  assert.equal(views.at(-1), "room", "return to the view from which the film was opened");
  assert.equal(cameraReadyCount(),0);
  assert.ok(prop.position.distanceTo(rest) < .001);
  assert.ok(prop.quaternion.angleTo(rotation) < .001);
  assert.equal(prop.getObjectByName("Camera LCD playback").material.map.image.playCount,0);
});

test("LCD controls pause, replay, mute, and stop when switching views", async t => {
  const { room, scenes, advance } = await setup();
  t.after(() => room.destroy());
  const prop = [...scenes].flatMap(scene => scene.children).find(object => object.name.startsWith("Fujifilm"));
  const video = prop.getObjectByName("Camera LCD playback").material.map.image;
  room.transition("camera");
  room.toggleFilm();
  assert.equal(video.playCount,0,"controls cannot start playback while the camera is turning");
  advance(2100);
  assert.equal(video.playCount,1);
  room.toggleFilm();
  assert.equal(video.paused,true);
  video.currentTime=12;
  room.replayFilm();
  assert.equal(video.currentTime,0);
  assert.equal(video.paused,false);
  room.toggleFilmMute();
  assert.equal(video.muted,false);
  room.setMuted(true);
  assert.equal(video.muted,true,"room mute also mutes LCD playback");
  room.transition("monitor");
  assert.equal(video.paused,true);
});

test("reduced motion reaches the film without a long camera animation", async t => {
  const { room, advance, cameraReadyCount } = await setup({ reducedMotion:true });
  t.after(() => room.destroy());
  room.transition("camera",1300);
  advance(1);
  assert.equal(cameraReadyCount(),1);
});

test("manual orbit stays inside all four walls across a full turn and cannot zoom through them", async t => {
  const { room, scenes, advance, forceOrbit, orbitTarget, pose } = await setup();
  t.after(() => room.destroy());
  const walls = [...scenes].flatMap(scene => scene.children).filter(object => object.material?.name === "Warm off-white plaster");
  const bounds = new three.Box3();
  walls.forEach(wall => bounds.union(new three.Box3().setFromObject(wall)));
  room.transition("free");
  advance(1600);
  for (let step=0; step<32; step++) {
    const angle = step / 32 * Math.PI * 2;
    forceOrbit([Math.sin(angle)*70000,12000,Math.cos(angle)*70000]);
    const position = new three.Vector3().fromArray(pose().position);
    assert.ok(position.x > bounds.min.x+500 && position.x < bounds.max.x-500);
    assert.ok(position.z > bounds.min.z+500 && position.z < bounds.max.z-500);
    assert.ok(position.y > bounds.min.y+500 && position.y < bounds.max.y-500);
    const target = orbitTarget();
    assert.ok(position.distanceTo(target) <= 29000.001, "the zoom limit still applies");
    const hits = new three.Raycaster(position,target.clone().sub(position).normalize()).intersectObjects(walls);
    assert.ok(!hits.length || hits[0].distance > position.distanceTo(target),"no wall comes between the viewpoint and the orbit target");
  }
  room.transition("desk");
  advance(1600);
  assert.deepEqual(pose().position,[0,1800,6000],"restoring the desk does not translate the existing Desk viewpoint");
});

test("the initial approach and automatic room pan keep the original path and room center inside the enclosure", async t => {
  const { room, scenes, advance, pose, screenRendering } = await setup();
  t.after(() => room.destroy());
  const walls = [...scenes].flatMap(scene => scene.children).filter(object => object.material?.name === "Warm off-white plaster");
  const bounds = new three.Box3();
  walls.forEach(wall => bounds.union(new three.Box3().setFromObject(wall)));
  assert.ok(bounds.containsPoint(new three.Vector3(-35000,35000,35000)),"the startup camera begins inside the room");
  for (let frame=0;frame<320;frame++) {
    advance(100);
    assert.ok(bounds.containsPoint(new three.Vector3().fromArray(pose().position)),"the automatic Room pan remains inside the walls");
    const { camera } = screenRendering();
    assert.equal(camera.position.z, 20000, "the existing Room path does not move with the furniture");
    const centeredDirection = new three.Vector3(0, -1000, 0).sub(camera.position).normalize();
    assert.ok(camera.getWorldDirection(new three.Vector3()).dot(centeredDirection) > 1 - 1e-10, "Room continues looking at the original center");
  }
});

test("the supplied bed rests on the floor to the right and its lamp sits on the integrated nightstand", async t => {
  const { room, scenes } = await setup();
  t.after(() => room.destroy());
  const objects = [];
  for (const scene of scenes) scene.traverse(child => objects.push(child));
  const bed = objects.find(object => object.name === "Bed Agape with integrated nightstand");
  const bounds = new three.Box3().setFromObject(bed);
  const plant = new three.Box3().setFromObject(objects.find(object => object.name === "plant"));
  assert.ok(Math.abs(bounds.min.y + 2975) < 1, "bed is grounded");
  assert.ok(plant.min.x > bounds.max.x + 250, "plant clears the bed's right side");
  assert.ok(bounds.min.z > -1800, "headboard clears the back wall");
  assert.ok(objects.some(object => object.material?.name === "fabric" && object.material.map), "supplied fabric textures are retained");
  const lamp = objects.find(object => object.name === "Nightstand lamp");
  const top = bed.getObjectByName("Object_2").localToWorld(new three.Vector3(215,195.6,38.49));
  assert.ok(lamp.position.distanceTo(top) < .001, "lamp rests on the actual nightstand top");
  const bedside = objects.find(object => object.name === "Nightstand warm light");
  const pendant = objects.find(object => object.name === "Pendant warm light");
  assert.ok(bedside.color.equals(pendant.color), "both lamps use the same warm light color");
  assert.equal(bedside.penumbra, pendant.penumbra);
  assert.ok(bedside.distance < pendant.distance, "the bedside light covers a smaller area");
});

for (const [viewportWidth,viewportHeight] of [[1280,720],[390,844]]) {
  test(`the nightstand lamp toggles smoothly without changing views at ${viewportWidth}×${viewportHeight}`, async t => {
    const { room, scenes, advance, screenPoint, click, pointerDown, move, pointerUp, views } = await setup({ viewportWidth, viewportHeight });
    t.after(() => room.destroy());
    const objects = [];
    for (const scene of scenes) scene.traverse(child => objects.push(child));
    const lamp = objects.find(object => object.name === "Nightstand lamp");
    const light = objects.find(object => object.name === "Nightstand warm light");
    const point = lamp.position.clone().add(new three.Vector3(0,740,0));
    const pixel = screenPoint(point.toArray());
    assert.ok(pixel[0] >= 0 && pixel[0] <= viewportWidth && pixel[1] >= 0 && pixel[1] <= viewportHeight, "the tested lamp click is inside the viewport");
    click(...pixel);
    advance(225);
    assert.ok(light.intensity > 0 && light.intensity < 2.5, "physical lamp click fades the light");
    advance(225);
    assert.equal(light.intensity,0);
    assert.equal(light.visible,true, "the zero-intensity light keeps shadow ordering stable throughout the fade");
    assert.deepEqual(views,["room"], "lamp click does not start a desk zoom");
    room.toggleLamp();
    advance(450);
    assert.equal(light.intensity,2.5, "the lamp can be switched back on");
    const nextPixel = screenPoint(point.toArray());
    pointerDown(nextPixel[0]-30,nextPixel[1]);
    move(...nextPixel);
    pointerUp();
    click(...nextPixel);
    advance(450);
    assert.equal(light.intensity,2.5,"dragging onto the lamp does not toggle it");
    const floor = objects.find(object => object.name === "Live shadow floor");
    const wall = objects.find(object => object.name === "Vinyl gallery wall");
    const compile = material => {
      const shader = { uniforms: {}, vertexShader: '#include <worldpos_vertex>', fragmentShader: '#include <shadowmap_pars_fragment>\nvec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;' };
      material.onBeforeCompile(shader); return shader;
    };
    const floorShader = compile(floor.material), wallShader = compile(wall.material);
    room.toggleLamp(); advance(450);
    assert.equal(floorShader.uniforms.uLampGlow.value,0, "floor glow switches off with the light");
    assert.equal(wallShader.uniforms.uLampGlow.value,0, "wall glow switches off with the light");
    room.toggleLamp(); advance(225);
    const partial = light.intensity;
    assert.ok(partial > 0 && partial < 2.5);
    assert.ok(Math.abs(floorShader.uniforms.uLampGlow.value - partial / 2.5) < .00001, "floor illumination follows the same fade as the light");
    room.toggleLamp(); advance(0);
    assert.equal(light.intensity,partial,"a second click during the fade resumes from the current light level");
    advance(450);
    assert.equal(light.intensity,0);
  });
}

test("the larger bed has a framed comic poster above its headboard and no added left wall", async t => {
  const { room, scenes } = await setup();
  t.after(() => room.destroy());
  const objects = [];
  for (const scene of scenes) scene.traverse(child => objects.push(child));
  assert.ok(!objects.some(object => object.name === "Visible left wall" || object.name === "Left return trim"));
  const bed = objects.find(object => object.name === "Bed Agape with integrated nightstand");
  const bedBounds = new three.Box3().setFromObject(bed);
  assert.ok(bedBounds.getSize(new three.Vector3()).z > 8900, "the bed is about 20 percent larger than before");
  const poster = objects.find(object => object.name === "Heroes & Villains — Don Toliver comic poster");
  const posterBounds = new three.Box3().setFromObject(poster);
  assert.ok(posterBounds.min.y > bedBounds.max.y + 500, "the frame clears the headboard");
  assert.ok(posterBounds.min.x > bedBounds.min.x && posterBounds.max.x < bedBounds.max.x, "the poster fits above the bed");
  assert.ok(posterBounds.min.z > -1800 && posterBounds.max.z < -1650, "the frame is mounted against the back wall");
  assert.ok(objects.find(object => object.name === "Don Toliver comic artwork").material.map, "the poster uses the cleaned supplied artwork");
});
