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
const workstationBytes = await readFile(new URL("../public/room/models/Computer/ibm_5150.glb", import.meta.url));
const worldBytes = await readFile(new URL("../public/room/models/World/environment.glb", import.meta.url));
const decorBytes = await readFile(new URL("../public/room/models/Decor/decor.glb", import.meta.url));
const modelLoader = new GLTFLoader();
modelLoader.register(() => ({ name: "TEST_TEXTURES", loadTexture: () => Promise.resolve(new three.Texture()) }));

async function setup({ autoDesktopReady = true, holdLayers = false, viewportWidth = 1200, viewportHeight = 800 } = {}) {
  let now = 0, frame, camera;
  let readyCount = 0;
  const pendingLayers = [];
  const listeners = new Map();
  const views = [];
  const scenes = new Set();
  let resizeCallback;
  const element = () => ({
    style: {}, contentWindow: {}, setAttribute() {}, append() {}, remove() {},
    play: () => Promise.resolve(), pause() {}, load() {}, removeAttribute() {},
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
  class Loader {
    constructor(manager) { this.manager = manager; }
    loadAsync(url) {
      this.manager?.itemStart(url);
      const bytes = url.endsWith("ibm_5150.glb") ? workstationBytes : url.endsWith("environment.glb") ? worldBytes : url.endsWith("decor.glb") ? decorBytes : null;
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
    constructor() { this.target = new three.Vector3(); }
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
  const host = { clientWidth: viewportWidth, clientHeight: viewportHeight, append() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: host.clientWidth, height: host.clientHeight }), ...events };
  const shader = "void main() {}";
  const context = vm.createContext({
    THREE: { ...three, WebGLRenderer: Renderer, TextureLoader: Loader },
    GLTFLoader: Loader, CSS3DRenderer: Renderer, CSS3DObject: CSSObject,
    OrbitControls: Controls,
    steamVertex: shader, steamFragment: shader, grainVertex: shader, grainFragment: shader,
    performance: { now: () => now },
    requestAnimationFrame(callback) { frame = callback; return 1; },
    cancelAnimationFrame() {},
    ResizeObserver: class { constructor(callback) { resizeCallback = callback; } observe() {} disconnect() {} },
    document: { createElement(type) { return type === "iframe" ? iframe : element(); } },
    window: { devicePixelRatio: 1, location: { origin: "https://portfolio.test" }, ...events },
    Audio: class {
      play() { return Promise.resolve(); }
      pause() {}
      removeAttribute() {}
      load() {}
    },
  });
  vm.runInContext(`${fitSource}\n${furnitureSource}\n${source}\nglobalThis.createRoom = createRoom;`, context);
  let resolveReady, rejectReady;
  const ready = new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
  const room = context.createRoom(host, {
    onProgress() {}, onReady: () => { readyCount++; resolveReady(); }, onError: rejectReady,
    onView(view) { views.push(view); },
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
    room, advance, message, views, scenes,
    ready, readyCount: () => readyCount, completeLayers: () => pendingLayers.splice(0).forEach(complete => complete()),
    sendRawMessage: event => listeners.get("message")(event),
    resize: (width, height) => { host.clientWidth = width; host.clientHeight = height; resizeCallback(); advance(0); },
    pose: () => ({ position: camera.position.toArray(), rotation: camera.quaternion.toArray() }),
    move: (clientX, clientY) => listeners.get("pointermove")?.({ clientX, clientY }),
    click: (clientX = 0, clientY = 0) => listeners.get("click")({ target: element(), clientX, clientY }),
    screenPoint: (world = [0, 950, 255]) => {
      camera.updateMatrixWorld();
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
  assert.equal(pose().position[2], 2250, "the desktop Computer zoom keeps its original distance");
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
  const floor = meshes.find(mesh => mesh.name === "Live shadow floor");
  assert.ok(floor.receiveShadow && floor.material.isMeshStandardMaterial && !floor.material.transparent);
  assert.ok(floor.material.polygonOffset, "the replacement floor avoids depth fighting with the original floor");
  assert.ok(!meshes.find(mesh => mesh.name === "Background").material.map, "the outdated baked desk shadow is no longer displayed");
});

test("the taller plant stays on the floor and clears the enlarged tabletop", async t => {
  const { room, scenes } = await setup();
  t.after(() => room.destroy());
  const meshes = [];
  for (const scene of scenes) scene.traverse(child => { if (child.isMesh) meshes.push(child); });
  const plantBounds = new three.Box3().setFromObject(meshes.find(mesh => mesh.name === "plant"));
  const deskBounds = new three.Box3().setFromObject(meshes.find(mesh => mesh.material.name === "Wood"));
  assert.ok(plantBounds.getSize(new three.Vector3()).y > 5000);
  assert.ok(Math.abs(plantBounds.min.y + 2986) < 1, "stretching the plant does not lift its pot from the floor");
  assert.ok(plantBounds.min.x > deskBounds.max.x, "the plant clears the larger table");
});

test("the hanging warm light casts desk shadows in the darker room", async t => {
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
  assert.ok(objects.find(object => object.isHemisphereLight).intensity < 0.3, "ambient room lighting is subdued");
});

test("all six wall records fit in Room and Desk views without the workstation hiding their centers", async t => {
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
  for (const view of ["room", "desk"]) {
    room.transition(view);
    advance(1600);
    const origin = new three.Vector3().fromArray(pose().position);
    for (const cover of covers) {
      cover.updateWorldMatrix(true, false);
      for (const corner of [[-480,-480,0],[-480,480,0],[480,-480,0],[480,480,0]]) {
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

test("wood textures upload as opaque sRGB RGBA instead of unsupported RGB", async t => {
  const { room, scenes } = await setup();
  t.after(() => room.destroy());
  const textures = new Set();
  let oak;
  for (const scene of scenes) scene.traverse(object => {
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (material?.map?.isDataTexture && material.map.encoding === three.sRGBEncoding) textures.add(material.map);
    }
    if (object.name === "Vinyl ledge 1") oak = object.material.map;
  });
  assert.ok(oak);
  for (const map of textures) {
    assert.equal(map.format, three.RGBAFormat, "WebGL2 supports sRGB RGBA8 uploads");
    assert.equal(map.image.data.length, map.image.width * map.image.height * 4, "each texel has all four channels");
  }
  for (let index = 0; index < oak.image.data.length; index += 4) {
    assert.ok(oak.image.data[index] > 150, "oak is a light wood finish");
    assert.ok(oak.image.data[index] > oak.image.data[index + 1] && oak.image.data[index + 1] > oak.image.data[index + 2]);
    assert.equal(oak.image.data[index + 3], 255);
  }
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

test("the curved backdrop meets the floor without an overlapping panel or old backdrop", async t => {
  const { room, scenes } = await setup();
  t.after(() => room.destroy());
  const objects = [];
  for (const scene of scenes) scene.traverse(child => objects.push(child));
  const wall = objects.find(object => object.name === "Vinyl gallery wall");
  const floor = objects.find(object => object.name === "Live shadow floor");
  assert.equal(wall.material, floor.material, "curved wall and floor share the same gradient");
  const positions = wall.geometry.attributes.position;
  const join = new three.Vector3().fromBufferAttribute(positions, 0);
  const floorBounds = new three.Box3().setFromObject(floor);
  assert.ok(Math.abs(join.y - floorBounds.min.y) < 1);
  assert.ok(Math.abs(join.z - floorBounds.min.z) < 1, "the surfaces meet edge to edge without a coplanar overlap");
  assert.ok(positions.count > 4, "the join has a rounded cross section");
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
