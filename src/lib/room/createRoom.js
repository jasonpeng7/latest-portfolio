/* Adapted from Henry Heffernan's portfolio. Original license: ./LICENSE.md */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { CSS3DObject, CSS3DRenderer } from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { steamVertex, steamFragment, grainVertex, grainFragment } from "./shaders";
import { fitWorkstation } from "./fitWorkstation";
import { createWoodMaterial, createWovenMaterial, createAeronChair, createFujifilmCamera, createNightstandLamp, createFloatingShelves } from "./furniture";
import { createInteractiveTrashCan } from "./trashCan";
import { cameraFilm } from "../../data/film";

export function createRoom(host, { onProgress, onReady, onError, onView, onCameraReady, onFilmState, onVinylState }) {
  const scene = new THREE.Scene();
  const cssScene = new THREE.Scene();
  // Keep depth precision around the furniture instead of reserving it for a
  // distant horizon. All camera positions and zoom targets remain unchanged.
  const camera = new THREE.PerspectiveCamera(35, 1, 100, 160000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
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
  controls.minDistance = 2200;
  controls.maxDistance = 29000;
  // The workstation stays at its original origin. Place the room behind it,
  // leaving the same small gap for the baseboard and cables.
  const roomBounds = { left: -42000, right: 42000, back: -1800, front: 44300, floor: -2975, top: 57025 };
  function keepOrbitInsideRoom() {
    // Shorten the orbit along its current direction before it can enter a wall.
    // This only runs in manual mode; scripted poses and transitions stay intact.
    const offset = camera.position.clone().sub(controls.target);
    const distance = offset.length();
    if (!distance) return;
    const direction = offset.divideScalar(distance);
    let limit = controls.maxDistance;
    const margin = 750;
    for (const [axis, low, high] of [["x", roomBounds.left, roomBounds.right], ["y", roomBounds.floor, roomBounds.top], ["z", roomBounds.back, roomBounds.front]]) {
      if (Math.abs(direction[axis]) < .00001) continue;
      const boundary = direction[axis] > 0 ? high - margin : low + margin;
      limit = Math.min(limit, (boundary - controls.target[axis]) / direction[axis]);
    }
    if (distance > limit) camera.position.copy(controls.target).addScaledVector(direction, Math.max(1, limit));
    camera.lookAt(controls.target);
  }

  const initial = new THREE.Vector3(-35000, 35000, 35000);
  const position = initial.clone();
  const focal = new THREE.Vector3(0, -5000, 0);
  const lookAt = new THREE.Vector3();
  let view = "loading", tween, frame, disposed = false, elapsed = 0;
  let ready = false, lastTime = performance.now(), steam, dimmer, chair;
  let plant, placedBedBounds;
  let placedDeskBounds, floatingShelves, bedBaseMaterial, shelfLabelMaps;
  let muted = false;
  const audio = new Map();
  const videos = [];
  const textures = new Set();
  const materials = new Set();
  const monitorTargets = [];
  const cameraTargets = [];
  let nightstandLamp, lampHitArea, lampLight, lampOn = true, lampTween;
  let trashCan;
  let vinylGallery, vinylBounds, activeVinyl, vinylTween, vinylReturnView = "room";
  const vinylTargets = [], vinylCovers = [];
  let vinylAlbums = [];
  const vinylState = ready => onVinylState?.({ albums: vinylAlbums, selected: view === "vinyl" ? activeVinyl?.userData.index ?? null : null, ready });
  const lampGlow = { value: 1 };
  const lampCenter = { value: new THREE.Vector3() };
  // Each shadow only attenuates the illumination from its own light. Keeping
  // both spots present at zero intensity also avoids shader changes at off/on.
  const surfaceShadows = `
    float pendantVisibility() {
      #if defined(USE_SHADOWMAP) && NUM_SPOT_LIGHT_SHADOWS > 0
        SpotLightShadow light = spotLightShadows[0];
        return receiveShadow ? getShadow(spotShadowMap[0], light.shadowMapSize, light.shadowBias, light.shadowRadius, vSpotShadowCoord[0]) : 1.0;
      #else
        return 1.0;
      #endif
    }
    float bedsideVisibility() {
      #if defined(USE_SHADOWMAP) && NUM_SPOT_LIGHT_SHADOWS > 1
        SpotLightShadow light = spotLightShadows[1];
        return receiveShadow ? getShadow(spotShadowMap[1], light.shadowMapSize, light.shadowBias, light.shadowRadius, vSpotShadowCoord[1]) : 1.0;
      #else
        return 1.0;
      #endif
    }
  `;
  let photoCamera, cameraHitArea, returnView = "desk";
  let cameraRest, cameraLifted, cameraRestBounds, propTween, filmStarted = false;
  const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const smooth = t => { t = THREE.MathUtils.clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
  const filmVideo = document.createElement("video");
  filmVideo.src = cameraFilm.src;
  filmVideo.preload = "auto";
  filmVideo.muted = true;
  filmVideo.playsInline = true;
  videos.push(filmVideo);
  const filmState = () => onFilmState?.({ playing: !filmVideo.paused, muted: filmVideo.muted, ended: filmVideo.ended, error: Boolean(filmVideo.error), time: filmVideo.currentTime || 0, duration: Number.isFinite(filmVideo.duration) ? filmVideo.duration : 0 });
  const filmEvents = ["playing", "pause", "ended", "volumechange", "timeupdate", "loadedmetadata", "error"];
  filmEvents.forEach(type => filmVideo.addEventListener(type, filmState));
  function playFilm() { filmVideo.play().catch(() => filmState()); }
  const raycaster = new THREE.Raycaster();
  const width = 1280;
  let height = 1024;
  const screenPosition = new THREE.Vector3(0, 950, 255);
  const screenRotation = new THREE.Euler(-3 * THREE.MathUtils.DEG2RAD, 0, 0);
  scene.add(new THREE.HemisphereLight(0xf3f5fa, 0xb3a38b, 0.6));
  const keyLight = new THREE.DirectionalLight(0xfff4e3, 0.65);
  keyLight.position.set(-3500, 6500, 7300);
  keyLight.target.position.z = 2300;
  scene.add(keyLight, keyLight.target);
  const fillLight = new THREE.DirectionalLight(0xdce8f5, 0.22);
  fillLight.position.set(3500, 2000, 1300);
  fillLight.target.position.z = 2300;
  scene.add(fillLight, fillLight.target);
  // An opaque floor replaces the obsolete baked desk shadow. The enlarged desk
  // casts its real silhouette here from the pendant's light.
  const roomMaterial = new THREE.MeshStandardMaterial({ color: 0xcdb592, roughness: 0.85, metalness: 0, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
  roomMaterial.name = "Natural oak floor";
  // Long, lightly grained oak boards continue to the room's square edges.
  roomMaterial.onBeforeCompile = shader => {
    shader.uniforms.uLampGlow = lampGlow;
    shader.uniforms.uLampCenter = lampCenter;
    shader.uniforms.uRoomGlowCenter = { value: new THREE.Vector3(95, -2975, 250) };
    shader.vertexShader = "varying vec3 vRoomWorldPosition;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvRoomWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = `varying vec3 vRoomWorldPosition;
      uniform vec3 uRoomGlowCenter;
      uniform vec3 uLampCenter;
      uniform float uLampGlow;
      float oakHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <shadowmap_pars_fragment>", "#include <shadowmap_pars_fragment>\n" + surfaceShadows);
    shader.fragmentShader = shader.fragmentShader.replace("vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;", `
      vec3 roomOffset = vRoomWorldPosition - uRoomGlowCenter;
      vec2 roomHorizontal = roomOffset.xz / 10500.0;
      float roomVertical = roomOffset.y / 18000.0;
      float roomGlow = exp(-dot(roomHorizontal, roomHorizontal) - roomVertical * roomVertical);
      vec3 roomAmbient = vec3(0.48, 0.49, 0.5);
      vec3 roomWarmPool = vec3(0.11, 0.085, 0.065) * roomGlow;
      vec2 lampOffset = (vRoomWorldPosition.xz - uLampCenter.xz) / 2800.0;
      vec3 lampPool = vec3(0.18, 0.13, 0.08) * exp(-dot(lampOffset, lampOffset)) * uLampGlow;
      float boardRow = floor(vRoomWorldPosition.x / 680.0);
      vec2 plankUV = vec2(vRoomWorldPosition.x / 680.0, vRoomWorldPosition.z / 5400.0 + oakHash(vec2(boardRow, 7.0)));
      vec2 plankID = floor(plankUV);
      vec2 withinPlank = fract(plankUV);
      float woodTone = 0.99 + 0.025 * sin(withinPlank.x * 15.0 + sin(vRoomWorldPosition.z * 0.0013));
      float grainPhase = vRoomWorldPosition.x * 0.18 + 1.8 * sin(vRoomWorldPosition.z * 0.0014 + boardRow);
      float grainVisibility = 1.0 - smoothstep(5000.0, 26000.0, distance(cameraPosition, vRoomWorldPosition));
      float grain = pow(0.5 + 0.5 * sin(grainPhase), 8.0) * 0.035 * grainVisibility;
      float edge = min(min(withinPlank.x, 1.0 - withinPlank.x), min(withinPlank.y, 1.0 - withinPlank.y) * 7.94);
      float seam = mix(0.9, 1.0, smoothstep(0.0, 0.004, edge));
      float boardTone = mix(0.96, 1.04, oakHash(plankID));
      vec3 oak = vec3(0.62, 0.51, 0.39) * boardTone * (woodTone - grain) * seam;
      vec3 outgoingLight = oak * (roomAmbient + roomWarmPool * pendantVisibility() + lampPool * bedsideVisibility());
    `);
  };
  roomMaterial.customProgramCacheKey = () => "natural-oak-floor-v1";
  materials.add(roomMaterial);
  const roomWidth = roomBounds.right - roomBounds.left, roomDepth = roomBounds.front - roomBounds.back;
  const floorShadow = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomDepth), roomMaterial);
  floorShadow.name = "Live shadow floor";
  floorShadow.rotation.x = -Math.PI / 2;
  floorShadow.position.set(0, roomBounds.floor, (roomBounds.front + roomBounds.back) / 2);
  floorShadow.receiveShadow = true;
  scene.add(floorShadow);
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f1e8, roughness: .9, metalness: 0 });
  wallMaterial.name = "Warm off-white plaster";
  wallMaterial.onBeforeCompile = shader => {
    shader.uniforms.uLampGlow = lampGlow;
    shader.uniforms.uLampCenter = lampCenter;
    shader.uniforms.uWallGlowCenter = { value: new THREE.Vector3(95, 1000, roomBounds.back) };
    shader.vertexShader = "varying vec3 vWallPosition;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWallPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = "varying vec3 vWallPosition;\nuniform vec3 uLampCenter;\nuniform vec3 uWallGlowCenter;\nuniform float uLampGlow;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <shadowmap_pars_fragment>", "#include <shadowmap_pars_fragment>\n" + surfaceShadows);
    shader.fragmentShader = shader.fragmentShader.replace("vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;", `
      vec3 wallOffset = (vWallPosition - uWallGlowCenter) / vec3(13000.0, 18000.0, 16000.0);
      float wallGlow = exp(-dot(wallOffset, wallOffset));
      vec3 lampOffset = (vWallPosition - uLampCenter) / vec3(3100.0, 2500.0, 3100.0);
      vec3 lampPool = vec3(0.085, 0.06, 0.035) * exp(-dot(lampOffset, lampOffset)) * uLampGlow;
      float plaster = 0.992 + 0.008 * sin(vWallPosition.x * 0.0008 + sin(vWallPosition.y * 0.0012));
      vec3 outgoingLight = diffuseColor.rgb * plaster * (vec3(0.67, 0.68, 0.69) + vec3(0.05, 0.04, 0.025) * wallGlow * pendantVisibility() + lampPool * bedsideVisibility());
    `);
  };
  wallMaterial.customProgramCacheKey = () => "daylight-limewash-v1";
  materials.add(wallMaterial);
  const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f1e8, roughness: .8, metalness: 0, emissive: 0xf5f1e8, emissiveIntensity: .08 });
  trimMaterial.name = "White painted baseboard";
  materials.add(trimMaterial);
  const wallHeight = roomBounds.top - roomBounds.floor;
  const featureWidth = 11700, featureLeft = 4150;
  for (const [name, span, x, z, rotation] of [
    ["Vinyl gallery wall", roomWidth, 0, roomBounds.back, 0],
    ["Front room wall", roomWidth, 0, roomBounds.front, Math.PI],
    ["Left room wall", roomDepth, roomBounds.left, (roomBounds.front + roomBounds.back) / 2, Math.PI / 2],
    ["Right room wall", roomDepth, roomBounds.right, (roomBounds.front + roomBounds.back) / 2, -Math.PI / 2],
  ]) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(span, wallHeight), wallMaterial);
    wall.name = name;
    wall.position.set(x, roomBounds.floor + wallHeight / 2, z);
    wall.rotation.y = rotation;
    wall.receiveShadow = true;
    scene.add(wall);
    const trim = new THREE.Group();
    trim.name = `${name} baseboard`;
    trim.position.set(x, roomBounds.floor, z);
    trim.rotation.y = rotation;
    const trimSpans = name === "Vinyl gallery wall"
      ? [[roomBounds.left, featureLeft], [featureLeft + featureWidth, roomBounds.right]]
      : [[-span / 2, span / 2]];
    for (const [left, right] of trimSpans) {
      for (const [height, depth, y] of [[210, 60, 105], [14, 72, 217]]) {
        const profile = new THREE.Mesh(new THREE.BoxGeometry(right - left, height, depth), trimMaterial);
        profile.position.set((left + right) / 2, y, depth / 2);
        profile.receiveShadow = true;
        trim.add(profile);
      }
    }
    scene.add(trim);
  }
  // One instanced draw keeps the closely spaced architectural battens inexpensive.
  const featureWall = new THREE.Group();
  featureWall.name = "Vertical oak feature wall";
  const backingMaterial = new THREE.MeshStandardMaterial({ color: 0x463b2f, roughness: 1 });
  const backing = new THREE.Mesh(new THREE.BoxGeometry(featureWidth, wallHeight, 18), backingMaterial);
  backing.position.set(featureLeft + featureWidth / 2, roomBounds.floor + wallHeight / 2, roomBounds.back + 10);
  backing.receiveShadow = true;
  featureWall.add(backing);
  const oakMaterial = createWoodMaterial("smoked-oak");
  oakMaterial.map.center.set(0.5, 0.5);
  oakMaterial.map.rotation = Math.PI / 2;
  oakMaterial.roughness = 0.88;
  const slatCount = 87;
  const slats = new THREE.InstancedMesh(new THREE.BoxGeometry(91, wallHeight, 44), oakMaterial, slatCount);
  slats.name = "Oak wall battens";
  const slatTransform = new THREE.Matrix4();
  for (let index = 0; index < slatCount; index++) {
    slatTransform.makeTranslation(featureLeft + (index + 0.5) * featureWidth / slatCount, roomBounds.floor + wallHeight / 2, roomBounds.back + 40);
    slats.setMatrixAt(index, slatTransform);
  }
  slats.castShadow = slats.receiveShadow = true;
  featureWall.add(slats);
  materials.add(backingMaterial);
  materials.add(oakMaterial);
  textures.add(oakMaterial.map);
  scene.add(featureWall);
  const textile = createWovenMaterial();
  textile.onBeforeCompile = shader => {
    shader.fragmentShader = shader.fragmentShader.replace("#include <shadowmap_pars_fragment>", "#include <shadowmap_pars_fragment>\n" + surfaceShadows);
    shader.fragmentShader = shader.fragmentShader.replace("vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;", "vec3 outgoingLight = diffuseColor.rgb * (vec3(0.68) + vec3(0.17) * pendantVisibility());");
  };
  textile.customProgramCacheKey = () => "ivory-daylight-textile-v1";
  materials.add(textile);
  textures.add(textile.map);
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(8500, 5500), textile);
  rug.name = "Ivory woven area rug";
  rug.position.set(450, roomBounds.floor + 4, 5050);
  rug.rotation.x = -Math.PI / 2;
  rug.receiveShadow = true;
  scene.add(rug);
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
    if (chair) chair.visible = !(["monitor", "camera", "shelves", "vinyl"].includes(view) && compactViewport());
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
  const cameraFrame = () => {
    // Frame the rear body rather than the lens extending behind it, so the LCD
    // is large enough to watch while the camera's silhouette remains visible.
    const center = new THREE.Vector3(0, 42, -18).multiplyScalar(5.2).applyQuaternion(cameraLifted.quaternion).add(cameraLifted.position);
    const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const distance = Math.max(340 / (tangent * camera.aspect * .82), 265 / (tangent * .68));
    return { position: center.clone().add(new THREE.Vector3(0, 0, distance)), focal: center };
  };
  const deskFrame = () => {
    // Keep the existing viewpoint; center the restored desk at the room origin.
    let z = 5800 + host.clientHeight / host.clientWidth * 3000 - 1800;
    const x = photoCamera && camera.aspect < 1.1 ? -500 : 0;
    if (x) {
      const bounds = cameraRestBounds;
      const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      // Keep the camera available to tap beside the computer in narrow views.
      for (const edge of [bounds.min.x, bounds.max.x, width / 2 + 100]) {
        z = Math.max(z, bounds.max.z + Math.abs(edge - x) / (tangent * camera.aspect * 0.85));
      }
    }
    return { position: new THREE.Vector3(x, 1800, z), focal: new THREE.Vector3(x, 500, 0) };
  };
  const vinylLiftPosition = () => vinylBounds.getCenter(new THREE.Vector3()).add(new THREE.Vector3(0, 0, 2100));
  const vinylFrame = closeup => {
    if (!vinylBounds) return { position: position.clone(), focal: focal.clone() };
    const center = closeup ? vinylLiftPosition() : vinylBounds.getCenter(new THREE.Vector3());
    const size = closeup ? new THREE.Vector3(960, 960, 24) : vinylBounds.getSize(new THREE.Vector3());
    const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const distance = Math.max(size.x / (2 * tangent * camera.aspect * .85), size.y / (2 * tangent * .65)) + 150;
    const target = center.clone().add(new THREE.Vector3(0, -size.y * .18, 0));
    return { position: target.clone().add(new THREE.Vector3(0, 0, distance)), focal: target };
  };
  const keyframes = () => ({
    room: { position: roomPosition(), focal: new THREE.Vector3(0, -1000, 0) },
    desk: deskFrame(),
    monitor: { position: monitorPosition(), focal: new THREE.Vector3(0, 950, 0) },
    free: { position: new THREE.Vector3(-15000, 10000, 15000), focal: new THREE.Vector3(-100, 350, 0) },
    camera: photoCamera ? cameraFrame() : { position: position.clone(), focal: focal.clone() },
    shelves: vinylFrame(false),
    vinyl: vinylFrame(true),
  });
  function transition(next, duration = next === "camera" ? 2100 : 1600) {
    if (disposed || !ready || next === view) return;
    if (next === "vinyl" && !activeVinyl) return;
    if (next === "shelves" && !["shelves", "vinyl"].includes(view)) vinylReturnView = view;
    if (activeVinyl && next !== "vinyl") {
      vinylTween = { mesh: activeVinyl, start: performance.now(), duration: reducedMotion() ? 1 : duration, from: activeVinyl.position.clone(), to: activeVinyl.userData.rest.position, fromRotation: activeVinyl.quaternion.clone(), toRotation: activeVinyl.userData.rest.quaternion, returning: true };
    }
    if (next === "camera") {
      returnView = view;
      filmStarted = false;
      filmVideo.pause();
      filmVideo.currentTime = 0;
    } else if (view === "camera") {
      filmVideo.pause();
    }
    if (next === "camera" || view === "camera") {
      const target = next === "camera" ? cameraLifted : cameraRest;
      propTween = { start: performance.now(), duration: reducedMotion() ? 1 : duration, from: photoCamera.position.clone(), to: target.position, fromRotation: photoCamera.quaternion.clone(), toRotation: target.quaternion, lifting: next === "camera" };
    }
    controls.enabled = false;
    host.style.cursor = "";
    renderer.domElement.style.pointerEvents = next === "free" ? "auto" : "none";
    const target = keyframes()[next];
    tween = { start: performance.now(), duration: reducedMotion() ? 1 : duration, from: position.clone(), to: target.position, fromFocal: focal.clone(), toFocal: target.focal, cameraMove: ["camera", "vinyl", "shelves"].includes(next) || ["camera", "vinyl", "shelves"].includes(view) };
    view = next;
    syncViewVisibility();
    onView(next);
    vinylState(false);
  }
  function openVinyl(index) {
    if (disposed || !ready || view !== "shelves" || tween || vinylTween || !vinylCovers[index]) return;
    activeVinyl = vinylCovers[index];
    vinylGallery.updateMatrixWorld(true);
    const target = vinylGallery.worldToLocal(vinylLiftPosition());
    vinylTween = { mesh: activeVinyl, start: performance.now(), duration: reducedMotion() ? 1 : 1600, from: activeVinyl.position.clone(), to: target, fromRotation: activeVinyl.quaternion.clone(), toRotation: new THREE.Quaternion(), returning: false };
    transition("vinyl");
  }
  function closeVinyl() {
    if (view === "vinyl") transition("shelves", 1300);
    else if (view === "shelves") transition(vinylReturnView, 1300);
  }
  function closeCamera() { if (view === "camera") transition(returnView, 1300); }
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
    filmVideo.muted = value;
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
    if (["camera", "shelves", "vinyl"].includes(view)) {
      const target = keyframes()[view];
      // Retarget from the current rendered pose instead of cutting on rotation.
      tween = { start: performance.now(), duration: reducedMotion() ? 1 : 550, from: position.clone(), to: target.position, fromFocal: focal.clone(), toFocal: target.focal, cameraMove: true };
    } else if (view === "monitor" || view === "desk") {
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
  function placePlant() {
    if (!plant || !placedBedBounds) return;
    const bounds = new THREE.Box3().setFromObject(plant);
    plant.position.x += placedBedBounds.max.x + 600 - bounds.min.x;
    plant.position.z += roomBounds.back + 550 - bounds.min.z;
  }
  function placeFloatingShelves() {
    if (disposed || floatingShelves || !placedDeskBounds || !placedBedBounds || !bedBaseMaterial || !shelfLabelMaps) return;
    const gap = placedBedBounds.min.x - placedDeskBounds.max.x;
    floatingShelves = createFloatingShelves(Math.min(2200, gap - 760), bedBaseMaterial, shelfLabelMaps);
    const group = floatingShelves.group;
    group.position.set((placedDeskBounds.max.x + placedBedBounds.min.x) / 2, 1950, roomBounds.back + 255);
    group.updateMatrixWorld(true);
    group.traverse(child => {
      if (!child.material) return;
      materials.add(child.material);
      Object.values(child.material).forEach(value => { if (value?.isTexture) textures.add(value); });
    });
    scene.add(group);
  }
  async function floatingShelfLabels() {
    const names = ["lakers", "dodgers", "imagination", "myslf"];
    const maps = await Promise.all(names.map(name => textureLoader.loadAsync(`/room/textures/shelf-props/${name}.svg`)));
    if (disposed) { maps.forEach(map => map.dispose()); return; }
    maps.forEach(map => {
      map.encoding = THREE.sRGBEncoding;
      map.minFilter = THREE.LinearMipmapLinearFilter;
      map.magFilter = THREE.LinearFilter;
      map.generateMipmaps = true;
      map.anisotropy = 8;
      textures.add(map);
    });
    shelfLabelMaps = Object.fromEntries(names.map((name, index) => [name, maps[index]]));
    placeFloatingShelves();
  }
  async function bedroomModel() {
    const { scene: bed } = await gltfLoader.loadAsync("/room/models/Bed/bed_agape.glb");
    if (disposed) {
      bed.traverse(child => { child.geometry?.dispose(); if (child.material) { Object.values(child.material).forEach(value => { if (value?.isTexture) value.dispose(); }); child.material.dispose(); } });
      return;
    }
    bed.name = "Bed Agape with integrated nightstand";
    bed.scale.setScalar(36);
    bed.rotation.y = Math.PI / 2;
    const bounds = new THREE.Box3().setFromObject(bed);
    bed.position.set(6700 - bounds.min.x, roomBounds.floor - bounds.min.y, roomBounds.back + 300 - bounds.min.z);
    bed.traverse(child => {
      if (!child.isMesh) return;
      child.castShadow = child.receiveShadow = true;
      const material = child.material;
      // Keep the supplied weave, with an ivory tint in the brighter room.
      material.emissive.set(0xffffff);
      material.emissiveMap = material.map || null;
      material.emissiveIntensity = material.map ? .05 : .018;
      if (material.name === "fabric") { material.color.set(0xf4f0e7); material.roughness = 1; }
      if (material.name === "Wood_polish") bedBaseMaterial = material;
      materials.add(material);
      Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value); });
    });
    scene.add(bed);
    placedBedBounds = new THREE.Box3().setFromObject(bed);
    placeFloatingShelves();
    placePlant();
    bed.updateWorldMatrix(true, true);
    // Coordinates on the supplied model's actual 38.49 cm nightstand top.
    const tabletop = bed.getObjectByName("Object_2").localToWorld(new THREE.Vector3(215, 195.6, 38.49));
    nightstandLamp = createNightstandLamp();
    nightstandLamp.position.copy(tabletop);
    nightstandLamp.traverse(child => { if (child.material) materials.add(child.material); });
    scene.add(nightstandLamp);
    lampCenter.value.copy(tabletop).y += 500;
    lampLight = new THREE.SpotLight(0xffc58a, 2.5, 7500, Math.PI / 3, .65, 1);
    lampLight.name = "Nightstand warm light";
    lampLight.position.copy(tabletop).y += 535;
    lampLight.target.position.copy(tabletop).y = roomBounds.floor;
    lampLight.castShadow = true;
    lampLight.shadow.mapSize.set(1024, 1024);
    lampLight.shadow.camera.near = 75;
    lampLight.shadow.camera.far = 8000;
    lampLight.shadow.bias = -.0001;
    lampLight.shadow.normalBias = 5;
    scene.add(lampLight, lampLight.target);
    const hitMaterial = new THREE.MeshBasicMaterial({ visible: false });
    materials.add(hitMaterial);
    lampHitArea = new THREE.Mesh(new THREE.BoxGeometry(900, 1100, 900), hitMaterial);
    lampHitArea.name = "Nightstand lamp touch target";
    lampHitArea.position.copy(tabletop).y += 500;
    scene.add(lampHitArea);
    const posterMap = await textureLoader.loadAsync("/room/textures/posters/heroes-villains-don-toliver.png");
    if (disposed) { posterMap.dispose(); return; }
    posterMap.encoding = THREE.sRGBEncoding;
    posterMap.anisotropy = 8;
    textures.add(posterMap);
    const poster = new THREE.Group();
    poster.name = "Heroes & Villains — Don Toliver comic poster";
    const headboardCenter = bed.getObjectByName("Object_2").localToWorld(new THREE.Vector3(242, 95, 89.85));
    const posterWidth = 2850, posterHeight = posterWidth * 1416 / 1111;
    poster.position.set(headboardCenter.x, 850 + posterHeight / 2, roomBounds.back + 100);
    const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x191918, roughness: .65 });
    const artworkMaterial = new THREE.MeshBasicMaterial({ map: posterMap, color: 0xdedbd3 });
    materials.add(frameMaterial);
    materials.add(artworkMaterial);
    const backing = new THREE.Mesh(new THREE.BoxGeometry(posterWidth + 110, posterHeight + 110, 70), frameMaterial);
    backing.castShadow = backing.receiveShadow = true;
    poster.add(backing);
    const artwork = new THREE.Mesh(new THREE.PlaneGeometry(posterWidth, posterHeight), artworkMaterial);
    artwork.name = "Don Toliver comic artwork";
    artwork.position.z = 36;
    poster.add(artwork);
    scene.add(poster);
  }
  function toggleLamp() {
    if (!nightstandLamp || !ready || disposed) return;
    lampOn = !lampOn;
    lampTween = { start: performance.now(), from: lampGlow.value, to: lampOn ? 1 : 0, duration: reducedMotion() ? 1 : 450 };
  }
  async function vinylWall() {
    const albums = [
      { title: "HEROES & VILLAINS", artist: "Metro Boomin", image: "metro" },
      { title: "Graduation", artist: "Kanye West", image: "graduation" },
      { title: "Souled Out", artist: "Jhené Aiko", image: "souled" },
      { title: "Take Care", artist: "Drake", image: "takecare" },
      { title: "1989", artist: "Taylor Swift", image: "1989" },
      { title: "petal", artist: "Ariana Grande", image: "petal" },
    ];
    vinylAlbums = albums;
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
    const gallery = new THREE.Group();
    vinylGallery = gallery;
    gallery.name = "Two-row vinyl gallery";
    // Give the monitor some breathing room while keeping both rows together.
    gallery.position.set(-3000, 400, roomBounds.back + 130);
    const ledgeMaterial = oakMaterial.clone();
    ledgeMaterial.map = oakMaterial.map.clone();
    ledgeMaterial.map.rotation = 0;
    ledgeMaterial.map.needsUpdate = true;
    ledgeMaterial.emissiveMap = ledgeMaterial.map;
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
      vinylTargets.push(mesh);
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
        cover.userData.index = index;
        cover.position.set(x, y, -25);
        cover.rotation.x = -0.055;
        cover.userData.rest = { position: cover.position.clone(), quaternion: cover.quaternion.clone() };
        cover.castShadow = true;
        // Thin printed sleeves need no self-shadow sampling on the artwork.
        cover.receiveShadow = false;
        gallery.add(cover);
        vinylTargets.push(cover);
        vinylCovers.push(cover);
      }
    }
    scene.add(gallery);
    vinylBounds = new THREE.Box3().setFromObject(gallery);
    vinylState(false);
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
          plant = child;
        }
        if (child.name === "coffee") child.position.z -= 1600;
      }
    });
    if (disposed) { gltf.scene.traverse(child => child.geometry?.dispose()); map.dispose(); material.dispose(); return; }
    scene.add(gltf.scene);
    placePlant();
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
    trashCan = createInteractiveTrashCan();
    const tabletop = fitted.workstation.children.find(child => child.material?.name === "Wood");
    materials.add(tabletop.material);
    Object.values(tabletop.material).forEach(value => { if (value?.isTexture) textures.add(value); });
    tabletop.material = createWoodMaterial("pale-oak");
    tabletop.material.name = "Wood";
    tabletop.material.roughness = 0.8;
    // Use the fitted top's own coordinates instead of the weathered baked UV atlas.
    const bounds = tabletop.geometry.boundingBox;
    const vertices = tabletop.geometry.attributes.position;
    const uv = new Float32Array(vertices.count * 2);
    for (let index = 0; index < vertices.count; index++) {
      uv[index * 2] = (vertices.getX(index) - bounds.min.x) / (bounds.max.x - bounds.min.x);
      uv[index * 2 + 1] = (vertices.getZ(index) - bounds.min.z) / (bounds.max.z - bounds.min.z);
    }
    tabletop.geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    const deskBounds = new THREE.Box3().setFromObject(tabletop);
    placedDeskBounds = deskBounds.clone();
    placeFloatingShelves();
    // Tuck it inside the left legs, clear of the chair and resting on the floor.
    trashCan.group.position.set(deskBounds.min.x + 1100, roomBounds.floor, Math.max(roomBounds.back + 720, deskBounds.min.z + 720));
    height = fitted.screenHeight;
    screenRotation.copy(fitted.screenRotation);
    photoCamera = createFujifilmCamera(Object.fromEntries(labels.map((label, index) => [label, maps[index]])));
    photoCamera.scale.setScalar(5.2);
    photoCamera.rotation.y = -Math.PI / 7;
    photoCamera.position.set(-1850, 0, -500);
    // Ground the complete body on the fitted tabletop, not a hardcoded height.
    photoCamera.position.y = fitted.surfaceY - new THREE.Box3().setFromObject(photoCamera).min.y;
    [fitted.workstation, photoCamera, trashCan.group].forEach(root => root.traverse(child => {
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
      trashCan.group.traverse(child => child.geometry?.dispose());
      textures.forEach(texture => texture.dispose());
      materials.forEach(material => material.dispose());
      return;
    }
    scene.add(fitted.workstation, photoCamera, trashCan.group);
    const cameraBounds = new THREE.Box3().setFromObject(photoCamera);
    cameraRestBounds = cameraBounds.clone();
    cameraRest = { position: photoCamera.position.clone(), quaternion: photoCamera.quaternion.clone() };
    cameraLifted = { position: cameraRest.position.clone().add(new THREE.Vector3(0, 1200, 850)), quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI, 0)) };
    cameraLCD();
    cameraHitArea = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ visible: false }));
    cameraHitArea.name = "Camera touch target";
    cameraHitArea.position.copy(cameraBounds.getCenter(new THREE.Vector3()));
    cameraHitArea.scale.copy(cameraBounds.getSize(new THREE.Vector3())).addScalar(100);
    materials.add(cameraHitArea.material);
    scene.add(cameraHitArea);
    cameraTargets.push(cameraHitArea);
    monitorTargets.push(...fitted.monitorTargets);
    cleanupScreen = screen();
  }
  function cameraLCD() {
    // A video texture is attached directly to the physical rear LCD, so it
    // follows the lift and turn and is occluded by the body like a real screen.
    const glass = photoCamera.getObjectByName("Camera rear LCD");
    const map = new THREE.VideoTexture(filmVideo);
    map.encoding = THREE.sRGBEncoding;
    textures.add(map);
    const screenMaterial = new THREE.MeshBasicMaterial({ map, toneMapped: false });
    materials.add(screenMaterial);
    const lcd = new THREE.Mesh(new THREE.PlaneGeometry(64, 37), screenMaterial);
    lcd.name = "Camera LCD playback";
    lcd.position.set(-10, 30, -20.5);
    lcd.rotation.y = Math.PI;
    photoCamera.add(lcd);
    // Preserve the dark rounded glass around the letterboxed picture.
    glass.material = new THREE.MeshBasicMaterial({ color: 0x050706, toneMapped: false });
    materials.add(glass.material);
    const fitFilm = () => {
      const aspect = filmVideo.videoWidth / filmVideo.videoHeight;
      if (!Number.isFinite(aspect) || aspect <= 0) return;
      const screenAspect = 64 / 37;
      lcd.scale.set(aspect < screenAspect ? aspect / screenAspect : 1, aspect > screenAspect ? screenAspect / aspect : 1, 1);
    };
    filmVideo.addEventListener("loadedmetadata", fitFilm);
    fitFilm();
    cleanupFilm = () => filmVideo.removeEventListener("loadedmetadata", fitFilm);
  }
  let cleanupFilm = () => {};
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

  function cameraHit(event) {
    if (!cameraHitArea) return false;
    const bounds = host.getBoundingClientRect();
    const pointer = new THREE.Vector2((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    cameraHitArea.updateMatrixWorld();
    camera.updateMatrixWorld();
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(cameraTargets).length > 0;
  }
  function lampHit(event) {
    if (!lampHitArea || !["room", "desk", "free"].includes(view)) return false;
    const bounds = host.getBoundingClientRect();
    const pointer = new THREE.Vector2((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    scene.updateMatrixWorld();
    camera.updateMatrixWorld();
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(lampHitArea)[0];
    if (!hit) return false;
    const opaque = [];
    scene.traverse(child => {
      if (child.isMesh && child.visible && child.material?.visible && !child.material.transparent && child.material.blending !== THREE.NoBlending && child.parent !== nightstandLamp) opaque.push(child);
    });
    const obstruction = raycaster.intersectObjects(opaque)[0];
    return !obstruction || obstruction.distance >= hit.distance;
  }
  function trashHit(event) {
    if (!trashCan || !["room", "desk", "free"].includes(view)) return false;
    const bounds = host.getBoundingClientRect();
    const pointer = new THREE.Vector2((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    scene.updateMatrixWorld();
    camera.updateMatrixWorld();
    raycaster.setFromCamera(pointer, camera);
    const opaque = [];
    scene.traverseVisible(child => {
      if (child.isMesh && child.material?.visible && !child.material.transparent && child.material.blending !== THREE.NoBlending) opaque.push(child);
    });
    let target = raycaster.intersectObjects(opaque, false)[0]?.object;
    while (target) {
      if (target === trashCan.bin) return true;
      target = target.parent;
    }
    return false;
  }
  function vinylHit(event) {
    if (!vinylGallery || !["room", "desk", "free", "shelves", "vinyl"].includes(view)) return null;
    const bounds = host.getBoundingClientRect();
    const pointer = new THREE.Vector2((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld();
    raycaster.setFromCamera(pointer, camera);
    const targets = view === "vinyl" ? (activeVinyl ? [activeVinyl] : []) : vinylTargets;
    const hit = raycaster.intersectObjects(targets, false)[0];
    if (!hit) return null;
    const opaque = [];
    scene.traverseVisible(child => {
      if (!child.isMesh) return;
      const meshMaterials = Array.isArray(child.material) ? child.material : [child.material];
      if (meshMaterials.some(material => material.visible && !material.transparent && material.blending !== THREE.NoBlending)) opaque.push(child);
    });
    const obstruction = raycaster.intersectObjects(opaque, false)[0];
    return !obstruction || obstruction.distance >= hit.distance - 1 ? hit.object : null;
  }
  let pointerStart, pointerDragged = false;
  const onPointerDown = event => { pointerStart = new THREE.Vector2(event.clientX, event.clientY); pointerDragged = false; };
  const onPointerMove = event => {
    if (pointerStart && pointerStart.distanceTo(new THREE.Vector2(event.clientX, event.clientY)) > 8) pointerDragged = true;
    const vinyl = vinylHit(event);
    const vinylClick = view === "vinyl" ? !vinyl : view === "shelves" || vinyl;
    host.style.cursor = !tween && !vinylTween && (vinylClick || (trashCan?.canSpill && trashHit(event)) || lampHit(event) || (["room", "desk"].includes(view) && cameraHit(event))) ? "pointer" : "";
  };
  const onPointerUp = () => { pointerStart = null; };
  host.addEventListener("pointerdown", onPointerDown);
  host.addEventListener("pointerup", onPointerUp);
  host.addEventListener("pointercancel", onPointerUp);
  host.addEventListener("pointermove", onPointerMove);
  const onClick = event => {
    if (event.target.closest("button, a, input, iframe")) return;
    if (pointerDragged) { pointerDragged = false; return; }
    if (["shelves", "vinyl"].includes(view)) {
      const vinyl = vinylHit(event);
      if (!vinyl) {
        if (view === "vinyl") closeVinyl();
        else transition("room", 1300);
      } else if (view === "shelves" && vinyl.userData.index !== undefined) {
        openVinyl(vinyl.userData.index);
      }
      return;
    }
    if (!tween && !vinylTween) {
      const vinyl = vinylHit(event);
      if (vinyl) {
        if (view !== "shelves") transition("shelves");
        else if (vinyl.userData.index !== undefined) openVinyl(vinyl.userData.index);
        return;
      }
    }
    if (!tween && trashHit(event)) { trashCan.shake(performance.now(), reducedMotion()); return; }
    if (!tween && lampHit(event)) { toggleLamp(); return; }
    if (!tween && !propTween && ["room", "desk"].includes(view) && cameraHit(event)) { transition("camera"); return; }
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
    trashCan?.update(now);
    if (vinylTween) {
      const t = Math.min((now - vinylTween.start) / vinylTween.duration, 1);
      const progress = smooth(t);
      // Pull clear of the ledge before centering the sleeve in front of the lens.
      const control1 = vinylTween.from.clone().add(new THREE.Vector3(0, 150, 650));
      const control2 = vinylTween.to.clone().add(new THREE.Vector3(0, 120, vinylTween.returning ? 650 : -250));
      const inverse = 1 - progress;
      vinylTween.mesh.position.copy(vinylTween.from).multiplyScalar(inverse ** 3)
        .addScaledVector(control1, 3 * inverse ** 2 * progress)
        .addScaledVector(control2, 3 * inverse * progress ** 2)
        .addScaledVector(vinylTween.to, progress ** 3);
      vinylTween.mesh.quaternion.slerpQuaternions(vinylTween.fromRotation, vinylTween.toRotation, progress);
      if (t === 1) {
        if (vinylTween.returning) activeVinyl = null;
        vinylTween = null;
        if (!tween) vinylState(true);
      }
    }
    if (lampTween) {
      const t = Math.min((now - lampTween.start) / lampTween.duration, 1);
      lampGlow.value = THREE.MathUtils.lerp(lampTween.from, lampTween.to, smooth(t));
      lampLight.intensity = 2.5 * lampGlow.value;
      nightstandLamp.getObjectByName("Lamp shade").material.emissiveIntensity = .5 * lampGlow.value;
      nightstandLamp.getObjectByName("Lamp diffuser").material.color.set(0x756855).lerp(new THREE.Color(0xffdfae), lampGlow.value);
      if (t === 1) lampTween = null;
    }
    if (propTween) {
      const t = Math.min((now - propTween.start) / propTween.duration, 1);
      // Lift clear of the tabletop before turning; undo the turn before landing.
      const travel = propTween.lifting ? smooth(t / .82) : smooth((t - .25) / .75);
      const turn = propTween.lifting ? smooth((t - .22) / .68) : smooth(t / .7);
      photoCamera.position.lerpVectors(propTween.from, propTween.to, travel);
      photoCamera.quaternion.slerpQuaternions(propTween.fromRotation, propTween.toRotation, turn);
      if (t === 1) propTween = null;
    }
    if (tween) {
      const t = Math.min((now - tween.start) / tween.duration, 1);
      const ease = tween.cameraMove ? smooth(t) : 1 - Math.pow(1 - t, 5);
      // Ease into the ongoing pan itself. A fixed Room endpoint would snap to
      // the current pan position on the first frame after the tween finishes.
      if (view === "room") roomPosition(tween.to);
      position.lerpVectors(tween.from, tween.to, ease);
      focal.lerpVectors(tween.fromFocal, tween.toFocal, ease);
      if (t === 1) {
        tween = null;
        if (["shelves", "vinyl"].includes(view) && !vinylTween) vinylState(true);
        if (view === "free") { camera.position.copy(position); controls.target.copy(focal); controls.enabled = true; controls.update(); }
      }
    } else if (view === "room") {
      roomPosition(position);
    }
    if (view === "camera" && !tween && !propTween && !filmStarted) {
      filmStarted = true;
      playFilm();
      onCameraReady?.();
    }
    if (!controls.enabled) {
      camera.position.copy(position);
      lookAt.copy(focal);
      camera.lookAt(lookAt);
    } else { controls.update(); keepOrbitInsideRoom(); position.copy(camera.position); focal.copy(controls.target); }
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
    bedroomModel(),
    floatingShelfLabels(),
    vinylWall(),
    bakedModel("World/environment.glb", "World/baked_environment.jpg"),
    bakedModel("Decor/decor.glb", "Decor/baked_decor_modified.jpg"),
  ]).then(() => { assetsBuilt = true; finishPreload(); }).catch(error => { if (!disposed) onError(error); });

  return {
    start, transition, closeCamera, isCameraView: () => view === "camera", setMuted, toggleLamp,
    openVinyl, closeVinyl, isVinylView: () => ["shelves", "vinyl"].includes(view),
    toggleFilm() { if (view !== "camera" || !filmStarted) return; if (filmVideo.paused) playFilm(); else filmVideo.pause(); },
    replayFilm() { if (view !== "camera" || !filmStarted) return; filmVideo.currentTime = 0; if (filmVideo.error) filmVideo.load(); playFilm(); },
    toggleFilmMute() { filmVideo.muted = !filmVideo.muted; },
    destroy() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      cleanupScreen();
      cleanupFilm();
      filmEvents.forEach(type => filmVideo.removeEventListener(type, filmState));
      host.removeEventListener("click", onClick);
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerdown", onPointerDown);
      host.removeEventListener("pointerup", onPointerUp);
      host.removeEventListener("pointercancel", onPointerUp);
      host.style.cursor = "";
      controls.dispose();
      audio.forEach(track => { track.pause(); track.removeAttribute("src"); track.load(); });
      videos.forEach(video => { video.pause(); video.removeAttribute("src"); video.load(); });
      scene.traverse(child => { child.geometry?.dispose(); if (child.isInstancedMesh) child.dispose(); });
      grain.geometry.dispose();
      textures.forEach(texture => texture.dispose());
      materials.forEach(material => material.dispose());
      keyLight.shadow.map?.dispose();
      pendantLight.shadow.map?.dispose();
      lampLight?.shadow.map?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      cssRenderer.domElement.remove();
    },
  };
}
