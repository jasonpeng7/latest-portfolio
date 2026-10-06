import * as THREE from "three";

export function createWoodMaterial(finish = "walnut") {
  const isOak = finish === "oak";
  const color = isOak ? [218, 174, 119] : [128, 79, 45];
  const width = 512, height = 128;
  // WebGL2 requires RGBA8 for sRGB textures; RGB uploads render black on it.
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width, v = y / height;
      const waviness = v * 36 + 0.22 * Math.sin(u * Math.PI * 4) + 0.09 * Math.sin(u * Math.PI * 12 + v * 8);
      const grain = Math.pow(0.5 + 0.5 * Math.sin(waviness * Math.PI * 2), 10);
      const tone = 1 - grain * (isOak ? 0.18 : 0.24) + 0.06 * Math.sin(v * Math.PI * 8);
      const index = (y * width + x) * 4;
      pixels[index] = color[0] * tone;
      pixels[index + 1] = color[1] * tone;
      pixels[index + 2] = color[2] * tone;
      pixels[index + 3] = 255;
    }
  }
  const map = new THREE.DataTexture(pixels, width, height, THREE.RGBAFormat);
  map.name = isOak ? "Fine oak grain" : "Fine walnut grain";
  map.encoding = THREE.sRGBEncoding;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.minFilter = THREE.LinearMipmapLinearFilter;
  map.magFilter = THREE.LinearFilter;
  map.generateMipmaps = true;
  map.anisotropy = 8;
  map.needsUpdate = true;
  const material = new THREE.MeshStandardMaterial({ map, roughness: 0.7, metalness: 0 });
  if (isOak) {
    // A little indirect fill keeps the oak grain visible in the dim room.
    material.emissive.set(0xffffff);
    material.emissiveMap = map;
    material.emissiveIntensity = 0.12;
  }
  material.name = isOak ? "Light warm oak wood" : "Warm walnut wood";
  return material;
}

// Dimensions are in millimetres, based on the manufacturers' body/lens specs.
// The prop faces local +Z; its placement turns the lens away from the monitor.
export function createFujifilmCamera(labelMaps = {}) {
  const camera = new THREE.Group();
  camera.name = "Fujifilm X-T30 II with Tamron 17-70mm";
  const bodyMetal = new THREE.MeshStandardMaterial({ color: 0x131719, roughness: 0.62, metalness: 0.24 });
  bodyMetal.name = "Fujifilm black body finish";
  const black = new THREE.MeshStandardMaterial({ color: 0x202425, roughness: 0.52, metalness: 0.2 });
  const lensBlack = new THREE.MeshStandardMaterial({ color: 0x080a0b, roughness: 0.72, metalness: 0.06 });
  const lensRubber = new THREE.MeshStandardMaterial({ color: 0x090b0c, roughness: 0.95 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x151819, roughness: 0.92 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0x2d3337, roughness: 0.45, metalness: 0.5 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x172b3e, roughness: 0.12, metalness: 0.55, emissive: 0x081623, emissiveIntensity: 0.3 });
  const glassCoating = new THREE.MeshStandardMaterial({ color: 0x080d10, roughness: 0.2, metalness: 0.3 });
  const lensGlass = new THREE.MeshStandardMaterial({ color: 0x030609, roughness: 0.15, metalness: 0.3 });
  const textureSize = 256;
  const pixels = new Uint8Array(textureSize * textureSize * 4);
  const heights = new Uint8Array(pixels.length);
  const hash = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
  for (let y = 0; y < textureSize; y++) for (let x = 0; x < textureSize; x++) {
    // Rounded, irregular pebbles produce actual lighting relief via a bump map.
    const u = x / 8, v = y / 8;
    let nearest = 2;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const cx = Math.floor(u) + dx, cy = Math.floor(v) + dy;
      const px = cx + 0.2 + hash((cx + 32) % 32, (cy + 32) % 32) * 0.6;
      const py = cy + 0.2 + hash((cy + 32) % 32, (cx + 32) % 32 + 9) * 0.6;
      nearest = Math.min(nearest, Math.hypot(u - px, v - py));
    }
    const pebble = Math.exp(-nearest * nearest * 7);
    const grain = hash(x, y);
    const index = (y * textureSize + x) * 4;
    const tone = 22 + pebble * 25 + grain * 5;
    pixels[index] = pixels[index + 1] = pixels[index + 2] = tone;
    heights[index] = heights[index + 1] = heights[index + 2] = 35 + pebble * 175 + grain * 15;
    pixels[index + 3] = heights[index + 3] = 255;
  }
  const leatherMap = new THREE.DataTexture(pixels, textureSize, textureSize, THREE.RGBAFormat);
  leatherMap.name = "Camera pebbled leather";
  leatherMap.encoding = THREE.sRGBEncoding;
  leatherMap.wrapS = leatherMap.wrapT = THREE.RepeatWrapping;
  leatherMap.repeat.set(2, 1.4);
  leatherMap.minFilter = THREE.LinearMipmapLinearFilter;
  leatherMap.generateMipmaps = true;
  leatherMap.anisotropy = 8;
  leatherMap.needsUpdate = true;
  const leatherBump = new THREE.DataTexture(heights, textureSize, textureSize, THREE.RGBAFormat);
  leatherBump.name = "Camera leather grain relief";
  leatherBump.wrapS = leatherBump.wrapT = THREE.RepeatWrapping;
  leatherBump.repeat.copy(leatherMap.repeat);
  leatherBump.minFilter = THREE.LinearMipmapLinearFilter;
  leatherBump.generateMipmaps = true;
  leatherBump.anisotropy = 8;
  leatherBump.needsUpdate = true;
  const leather = new THREE.MeshStandardMaterial({ map: leatherMap, bumpMap: leatherBump, bumpScale: 0.55, roughness: 0.9 });
  const add = (name, geometry, material, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    camera.add(mesh);
    return mesh;
  };
  const addInstances = (name, geometry, material, transforms) => {
    const mesh = new THREE.InstancedMesh(geometry, material, transforms.length);
    mesh.name = name;
    mesh.castShadow = mesh.receiveShadow = true;
    const pose = new THREE.Object3D();
    transforms.forEach(([x, y, z, rx, ry, rz], index) => {
      pose.position.set(x, y, z);
      pose.rotation.set(rx, ry, rz);
      pose.updateMatrix();
      mesh.setMatrixAt(index, pose.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    camera.add(mesh);
    return mesh;
  };
  const normalizeUV = geometry => {
    // ExtrudeGeometry's default UVs are in millimetres. Normalize them so the
    // leather grain has a visible, consistent scale instead of hundreds of repeats.
    geometry.computeBoundingBox();
    const min = geometry.boundingBox.min, size = geometry.boundingBox.getSize(new THREE.Vector3());
    const position = geometry.attributes.position, normal = geometry.attributes.normal, uv = geometry.attributes.uv;
    for (let index = 0; index < position.count; index++) {
      const x = (position.getX(index) - min.x) / size.x;
      const y = (position.getY(index) - min.y) / size.y;
      const z = (position.getZ(index) - min.z) / size.z;
      if (Math.abs(normal.getZ(index)) > 0.5) uv.setXY(index, x, y);
      else if (Math.abs(normal.getX(index)) > Math.abs(normal.getY(index))) uv.setXY(index, z, y);
      else uv.setXY(index, x, z);
    }
    return geometry;
  };
  const rounded = (width, height, depth, radius = 2, bevel = 0.5) => {
    const shape = new THREE.Shape();
    const x = -width / 2, y = -height / 2;
    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: depth - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5, steps: 1, curveSegments: 10 });
    geometry.translate(0, 0, -depth / 2 + bevel);
    return normalizeUV(geometry);
  };
  add("Camera black chassis", rounded(114.4, 59, 34, 5, 1.5), bodyMetal, 0, 31);
  add("Camera leather body", rounded(112, 46, 35, 5, 2.5), leather, 0, 30);
  add("Camera black top plate", rounded(115.4, 7, 35, 4, 1), bodyMetal, 0, 60);
  add("Camera black base plate", rounded(115.4, 2, 35, 4, 0.5), bodyMetal, 0, 1.5);
  const gripShape = new THREE.Shape();
  gripShape.moveTo(-7, -22);
  gripShape.bezierCurveTo(-12, -21, -11, -12, -10, 12);
  gripShape.bezierCurveTo(-9, 21, -2, 25, 3, 22);
  gripShape.bezierCurveTo(10, 18, 11, 8, 9, 0);
  gripShape.lineTo(7, -17);
  gripShape.quadraticCurveTo(6, -24, -7, -22);
  const gripGeometry = new THREE.ExtrudeGeometry(gripShape, { depth: 6, bevelEnabled: true, bevelThickness: 4, bevelSize: 2, bevelSegments: 8, steps: 1, curveSegments: 12 });
  gripGeometry.translate(0, 0, -3);
  add("Camera sculpted hand grip", normalizeUV(gripGeometry), leather, -48, 29, 20);
  const seam = (name, points, radius = 0.3) => add(name, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point))), 40, radius, 6, false), rubber);
  seam("Camera upper body seam", [[-52,54,15.8],[-42,55.4,17.6],[0,55.4,17.7],[42,55.4,17.6],[52,54,15.8]]);
  seam("Camera grip contour seam", [[-54,9,22],[-56,18,25.2],[-55,35,26.5],[-50,49,23.6]], 0.4);
  seam("Camera right panel groove", [[51,8,15.2],[54,12,16.4],[54.5,30,16.5],[54,47,16.4],[51,52,15.2]], 0.35);
  seam("Camera lower body seam", [[-52,6,15.8],[-42,4.6,17.6],[0,4.6,17.7],[42,4.6,17.6],[52,6,15.8]]);
  const hump = new THREE.Shape();
  hump.moveTo(-22, 63);
  hump.quadraticCurveTo(-19,70,-14,79.5);
  hump.quadraticCurveTo(-13,81.3,-10,81.3);
  hump.lineTo(10,81.3);
  hump.quadraticCurveTo(13,81.3,14,79.5);
  hump.quadraticCurveTo(19,70,22,63);
  hump.closePath();
  const viewfinder = new THREE.ExtrudeGeometry(hump, { depth: 26, bevelEnabled: true, bevelThickness: 1.5, bevelSize: 1.2, bevelSegments: 5, steps: 1, curveSegments: 10 });
  viewfinder.translate(0, 0, -13);
  add("Camera black viewfinder housing", viewfinder, bodyMetal);
  add("Camera hot shoe", new THREE.BoxGeometry(15, 1.2, 17), chrome, 0, 83, -2);
  add("Camera rear eyecup", rounded(24, 13, 7), rubber, 0, 72, -19);
  add("Camera eyepiece glass", rounded(15, 8, 1), glass, 0, 72, -23);
  add("Camera rear screen surround", rounded(74, 47, 2), black, -10, 30, -18.5);
  add("Camera rear LCD", rounded(66, 39, 0.8), glass, -10, 30, -20);
  const frontControl = add("Camera front command dial", new THREE.CylinderGeometry(4, 4, 3, 32), rubber, 40, 46, 18.6);
  frontControl.rotation.x = Math.PI / 2;
  const focusSwitch = add("Camera focus selector dial", new THREE.CylinderGeometry(4.5, 4.5, 1.6, 32), black, -34, 17, 18.5);
  focusSwitch.rotation.x = Math.PI / 2;
  add("Camera focus selector lever", rounded(1.5, 6, 1, 0.4), chrome, -34, 17, 19.6).rotation.z = -0.4;
  const assistLamp = add("Camera focus assist lamp", new THREE.CylinderGeometry(1.8, 1.8, 1.2, 24), glass, -30, 55, 18.2);
  assistLamp.rotation.x = Math.PI / 2;

  const dial = (x, z, radius, height, y = 67) => {
    add("Camera knurled control dial", new THREE.CylinderGeometry(radius, radius, height, 48), black, x, y, z);
    add("Camera black dial cap", new THREE.CylinderGeometry(radius - 0.5, radius - 0.5, 0.8, 48), bodyMetal, x, y + height / 2, z);
    const teeth = Array.from({ length: 32 }, (_, tooth) => {
      const angle = tooth / 32 * Math.PI * 2;
      return [x + Math.sin(angle) * radius, y, z + Math.cos(angle) * radius, 0, angle, 0];
    });
    addInstances("Camera dial grip", new THREE.BoxGeometry(0.5, height - 1, 1), chrome, teeth);
  };
  dial(-38, -2, 10, 5);
  dial(31, -2, 10, 5);
  dial(48, -6, 7.5, 4);
  add("Camera shutter button", new THREE.CylinderGeometry(3.4, 3.4, 3, 24), chrome, -48, 68, 10);
  add("Camera red shutter inset", new THREE.CylinderGeometry(1.4, 1.4, 0.5, 24), new THREE.MeshStandardMaterial({ color: 0x893c32, roughness: 0.7 }), -48, 69.8, 10);
  for (const x of [-60, 60]) {
    const lug = add("Camera strap lug", new THREE.TorusGeometry(3, 0.8, 8, 20), chrome, x, 52, 0);
    lug.rotation.y = Math.PI / 2;
  }
  for (const [x, y] of [[42, 40], [48, 24], [48, 12]]) {
    const button = add("Camera rear control", new THREE.CylinderGeometry(2.4, 2.4, 1.5, 16), rubber, x, y, -19);
    button.rotation.x = Math.PI / 2;
  }
  const lens = (name, radius, length, z, material) => {
    const part = add(name, new THREE.CylinderGeometry(radius, radius, length, 64), material, 0, 38.5, z);
    part.rotation.x = Math.PI / 2;
    return part;
  };
  lens("Camera lens mount", 30, 6, 21, lensBlack);
  lens("Tamron lens barrel", 35.5, 117, 82.5, lensBlack);
  lens("Tamron mount trim", 33.5, 2, 25, lensBlack);
  for (const [z, length] of [[51, 29], [115, 22]]) {
    lens("Tamron ribbed focus / zoom ring", 37.3, length, z, lensRubber);
    const ribs = Array.from({ length: 96 }, (_, rib) => {
      const angle = rib / 96 * Math.PI * 2;
      return [Math.sin(angle) * 37.3, 38.5 + Math.cos(angle) * 37.3, z, 0, 0, -angle];
    });
    // Hundreds of grip ridges share one draw call per ring.
    addInstances("Tamron ring grip rib", new THREE.BoxGeometry(0.6, 0.4, length - 1), lensBlack, ribs);
  }
  lens("Tamron front rim", 37.3, 5, 141, lensBlack);
  add("Tamron front rim highlight", new THREE.RingGeometry(36.1, 36.8, 64), lensBlack, 0, 38.5, 144.1);
  lens("Tamron recessed front glass", 31.5, 0.8, 144.6, glassCoating);
  lens("Tamron inner glass", 26, 0.9, 145.2, lensGlass);
  lens("Tamron optical center", 13, 0.6, 145.9, lensBlack);
  const reflection = add("Lens coating reflection", new THREE.RingGeometry(23.5, 24, 64), glassCoating, 0, 38.5, 146.3);
  reflection.scale.y = 0.86;

  const label = (name, map, width, height, x, y, z, rotationX = 0) => {
    if (!map) return;
    const material = new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
    const mesh = add(name, new THREE.PlaneGeometry(width, height), material, x, y, z);
    mesh.rotation.x = rotationX;
    mesh.castShadow = mesh.receiveShadow = false;
    return mesh;
  };
  label("FUJIFILM front badge", labelMaps.fujifilm, 33, 6.2, 0, 74.5, 15.1);
  label("X-T30 II front badge", labelMaps.xt30, 18, 6.8, 40, 60, 18.1);
  label("Tamron barrel branding", labelMaps.tamron, 25, 10, 0, 74.2, 83, -Math.PI / 2);
  camera.userData.lensDirection = [0, 0, 1];
  return camera;
}

export function createAeronChair() {
  const chair = new THREE.Group();
  chair.name = "Aeron-style black mesh chair";
  const frame = new THREE.MeshStandardMaterial({ color: 0x171b1c, roughness: 0.45, metalness: 0.35 });
  frame.name = "Aeron matte black frame";
  const rubber = new THREE.MeshStandardMaterial({ color: 0x101314, roughness: 0.95 });
  rubber.name = "Aeron black rubber";
  const wood = createWoodMaterial();
  const pixels = new Uint8Array(128 * 128 * 4);
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const thread = x % 8 < 2 || y % 8 < 2;
    const index = (y * 128 + x) * 4;
    pixels[index] = thread ? 62 : 22;
    pixels[index + 1] = thread ? 66 : 25;
    pixels[index + 2] = thread ? 65 : 25;
    pixels[index + 3] = thread ? 225 : 100;
  }
  const weave = new THREE.DataTexture(pixels, 128, 128, THREE.RGBAFormat);
  weave.name = "Aeron woven mesh";
  weave.encoding = THREE.sRGBEncoding;
  weave.wrapS = weave.wrapT = THREE.RepeatWrapping;
  weave.repeat.set(6, 8);
  weave.minFilter = THREE.LinearMipmapLinearFilter;
  weave.magFilter = THREE.LinearFilter;
  weave.generateMipmaps = true;
  weave.anisotropy = 8;
  weave.needsUpdate = true;
  // Filtered alpha gives a woven translucent surface without alpha-test shimmer.
  const meshMaterial = new THREE.MeshStandardMaterial({ map: weave, roughness: 0.95, metalness: 0, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide });
  meshMaterial.name = "Aeron black mesh";
  const add = (name, geometry, material, x = 0, y = 0, z = 0) => {
    const part = new THREE.Mesh(geometry, material);
    part.name = name;
    part.position.set(x, y, z);
    part.castShadow = !material.transparent;
    part.receiveShadow = !material.transparent;
    chair.add(part);
    return part;
  };
  const rod = (name, start, end, radius, material = frame) => {
    const direction = end.clone().sub(start);
    const part = add(name, new THREE.CylinderGeometry(radius * 0.8, radius, direction.length(), 16), material);
    part.position.copy(start).add(end).multiplyScalar(0.5);
    part.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return part;
  };
  const curve = (name, points, radius, material = frame, closed = false) => {
    return add(name, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, closed), 80, radius, 10, closed), material);
  };
  const roundedShape = (width, height, radius) => {
    const path = new THREE.Shape();
    const left = -width / 2, right = width / 2, bottom = -height / 2, top = height / 2;
    path.moveTo(left + radius, bottom);
    path.lineTo(right - radius, bottom);
    path.quadraticCurveTo(right, bottom, right, bottom + radius);
    path.lineTo(right, top - radius);
    path.quadraticCurveTo(right, top, right - radius, top);
    path.lineTo(left + radius, top);
    path.quadraticCurveTo(left, top, left, top - radius);
    path.lineTo(left, bottom + radius);
    path.quadraticCurveTo(left, bottom, left + radius, bottom);
    return path;
  };

  // A five-star base with twin casters and a central height-adjustment stem.
  add("Chair swivel hub", new THREE.CylinderGeometry(0.11, 0.15, 0.14, 24), frame, 0, 0.15);
  rod("Chair height adjustment", new THREE.Vector3(0, 0.16, 0), new THREE.Vector3(0, 0.52, 0), 0.045);
  for (let index = 0; index < 5; index++) {
    const angle = index / 5 * Math.PI * 2;
    const end = new THREE.Vector3(Math.cos(angle) * 0.49, 0.12, Math.sin(angle) * 0.49);
    rod("Chair base spoke", new THREE.Vector3(0, 0.21, 0), end, 0.047);
    const axle = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
    for (const side of [-1, 1]) {
      const wheel = add("Chair caster wheel", new THREE.CylinderGeometry(0.067, 0.067, 0.035, 20), rubber);
      wheel.position.copy(end).addScaledVector(axle, side * 0.027);
      wheel.position.y = 0.067;
      wheel.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axle);
    }
  }
  add("Chair tilt mechanism", new THREE.BoxGeometry(0.42, 0.13, 0.3), frame, 0, 0.51, -0.015);
  add("Chair adjustment knob", new THREE.CylinderGeometry(0.048, 0.048, 0.08, 20), rubber, 0.24, 0.5, 0.06).rotation.z = Math.PI / 2;

  const seatShape = roundedShape(0.84, 0.65, 0.1);
  seatShape.holes.push(roundedShape(0.72, 0.53, 0.08));
  const seat = add("Chair sculpted seat rim", new THREE.ExtrudeGeometry(seatShape, { depth: 0.035, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3, curveSegments: 12 }), frame, 0, 0.60, 0.025);
  seat.rotation.x = -Math.PI / 2;
  const seatMesh = new THREE.PlaneGeometry(0.74, 0.55, 18, 18);
  const seatPosition = seatMesh.attributes.position;
  for (let index = 0; index < seatPosition.count; index++) {
    const x = seatPosition.getX(index), z = seatPosition.getY(index);
    const sag = 0.035 * (1 - (x / 0.37) ** 2) * (1 - (z / 0.275) ** 2);
    seatPosition.setXYZ(index, x, 0.645 - sag, z + 0.025);
  }
  seatMesh.computeVertexNormals();
  add("Chair suspended mesh seat", seatMesh, meshMaterial);

  // The Aeron silhouette: a cupped mesh back, rounded frame, and rear lumbar Y.
  const outline = new THREE.Shape();
  outline.moveTo(-0.25, 0.64);
  outline.bezierCurveTo(-0.39, 0.64, -0.42, 0.90, -0.44, 1.10);
  outline.bezierCurveTo(-0.47, 1.32, -0.43, 1.49, -0.32, 1.54);
  outline.bezierCurveTo(-0.20, 1.61, 0.20, 1.61, 0.32, 1.54);
  outline.bezierCurveTo(0.43, 1.49, 0.47, 1.32, 0.44, 1.10);
  outline.bezierCurveTo(0.42, 0.90, 0.39, 0.64, 0.25, 0.64);
  outline.bezierCurveTo(0.12, 0.61, -0.12, 0.61, -0.25, 0.64);
  const points = outline.getPoints(12).slice(0, -1).map(point => new THREE.Vector3(point.x, point.y, -0.28 - 0.18 * (point.y - 0.65) / 0.9));
  curve("Chair rounded back frame", points, 0.042, frame, true);
  curve("Chair brown back trim", points.map(point => point.clone().add(new THREE.Vector3(0, 0, -0.033))), 0.014, wood, true);
  const backGeometry = new THREE.ShapeGeometry(outline, 24);
  const backPosition = backGeometry.attributes.position;
  const backUv = backGeometry.attributes.uv;
  for (let index = 0; index < backPosition.count; index++) {
    const x = backPosition.getX(index), y = backPosition.getY(index);
    // The net follows the entire rim rather than floating inside a second outline.
    const z = -0.28 - 0.18 * (y - 0.65) / 0.9 - 0.018 * (1 - (x / 0.47) ** 2);
    backPosition.setXYZ(index, x, y, z);
    backUv.setXY(index, x + 0.5, (y - 0.61) / 0.98);
  }
  backGeometry.computeVertexNormals();
  add("Chair suspended mesh back", backGeometry, meshMaterial);
  rod("Chair rear support", new THREE.Vector3(0, 0.49, -0.18), new THREE.Vector3(0, 0.86, -0.4), 0.04);
  for (const side of [-1, 1]) {
    rod("Chair lumbar support", new THREE.Vector3(0, 0.85, -0.4), new THREE.Vector3(side * 0.27, 1.05, -0.43), 0.025);
    curve("Chair arm support", [new THREE.Vector3(side * 0.34, 0.55, -0.12), new THREE.Vector3(side * 0.49, 0.72, -0.12), new THREE.Vector3(side * 0.49, 0.9, -0.07)], 0.025);
    const armShape = roundedShape(0.13, 0.43, 0.06);
    const trim = add("Chair brown arm trim", new THREE.ExtrudeGeometry(armShape, { depth: 0.035, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2, curveSegments: 10 }), wood, side * 0.49, 0.87, 0.04);
    trim.rotation.x = -Math.PI / 2;
    const pad = add("Chair black arm pad", new THREE.ExtrudeGeometry(armShape, { depth: 0.04, bevelEnabled: true, bevelSize: 0.014, bevelThickness: 0.014, bevelSegments: 3, curveSegments: 10 }), rubber, side * 0.49, 0.90, 0.04);
    pad.rotation.x = -Math.PI / 2;
  }
  chair.scale.setScalar(2400);
  chair.position.set(850, -2975, 3550);
  chair.rotation.y = Math.PI - 0.1;
  return chair;
}
