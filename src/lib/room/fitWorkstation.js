import * as THREE from "three";

// Normalize the supplied Sketchfab asset once, without changing its materials
// or the room's camera coordinates. Its original curved CRT is replaced by OS.
export function fitWorkstation(source, screenPosition, screenWidth) {
  source.updateMatrixWorld(true);
  let crt;
  source.traverse(mesh => { if (mesh.isMesh && mesh.material.name === "Pantalla") crt = mesh; });
  if (!crt) throw new Error("The IBM workstation is missing its CRT surface.");
  crt.geometry.computeBoundingBox();
  const bounds = crt.geometry.boundingBox;
  const localSize = bounds.getSize(new THREE.Vector3());
  const worldScale = crt.getWorldScale(new THREE.Vector3());
  const scale = screenWidth / (localSize.x * worldScale.x);
  const screenHeight = Math.round(localSize.y * worldScale.y * scale);
  const screenRotation = new THREE.Euler().setFromQuaternion(crt.getWorldQuaternion(new THREE.Quaternion()));
  // Place the OS in front of the curved glass, inside the monitor's bezel.
  const anchor = bounds.getCenter(new THREE.Vector3());
  anchor.z = bounds.max.z;
  anchor.applyMatrix4(crt.matrixWorld);

  const workstation = new THREE.Group();
  workstation.name = "IBM 5150 workstation";
  const originalGeometry = new Set();
  const removedMaterials = new Set([crt.material]);
  const meshes = [];
  source.traverse(mesh => {
    if (!mesh.isMesh) return;
    originalGeometry.add(mesh.geometry);
    if (mesh === crt || mesh.material.name === "Folleto") { removedMaterials.add(mesh.material); return; }
    // Bake nested Sketchfab transforms before fitting the tabletop and props.
    const fitted = new THREE.Mesh(mesh.geometry.clone().applyMatrix4(mesh.matrixWorld), mesh.material);
    fitted.name = mesh.name;
    fitted.castShadow = true;
    fitted.receiveShadow = true;
    meshes.push(fitted);
    workstation.add(fitted);
  });
  originalGeometry.forEach(geometry => geometry.dispose());
  removedMaterials.forEach(material => {
    new Set(Object.values(material).filter(value => value?.isTexture)).forEach(texture => texture.dispose());
    material.dispose();
  });
  workstation.scale.setScalar(scale);
  workstation.position.copy(screenPosition).addScaledVector(anchor, -scale);
  workstation.updateMatrixWorld(true);

  const tabletop = meshes.find(mesh => mesh.material.name === "Wood");
  if (!tabletop) throw new Error("The IBM workstation is missing its desk.");
  const deskBounds = new THREE.Box3().setFromObject(tabletop);
  const surfaceY = deskBounds.max.y;
  const center = tabletop.geometry.boundingBox.getCenter(new THREE.Vector3());
  tabletop.geometry.translate(-center.x, -center.y, -center.z);
  tabletop.position.copy(center);
  const deskSize = deskBounds.getSize(new THREE.Vector3());
  tabletop.scale.set(7800 / deskSize.x, 120 / deskSize.y, 3800 / deskSize.z);
  tabletop.position.y = (surfaceY - 60 - workstation.position.y) / scale;

  // Keep the included peripherals and paper props comfortably on the narrower
  // room-sized desk. Their original texture maps and proportions are preserved.
  for (const mesh of meshes) {
    if (/^Revista_/.test(mesh.name)) { mesh.position.x -= 900 / scale; mesh.position.z -= 100 / scale; }
    if (/^Teclado_/.test(mesh.name)) mesh.position.z -= 400 / scale;
    if (mesh.material.emissive && !/Led|material/i.test(mesh.material.name)) mesh.material.emissiveIntensity = 0.12;
  }
  workstation.updateMatrixWorld(true);
  const fittedDesk = new THREE.Box3().setFromObject(tabletop);
  const legHeight = fittedDesk.min.y - (-2980);
  const frameMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(0x24282a).convertSRGBToLinear(), roughness: 0.7, metalness: 0.35 });
  for (const x of [fittedDesk.min.x + 240, fittedDesk.max.x - 240]) {
    for (const z of [fittedDesk.min.z + 220, fittedDesk.max.z - 220]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(100 / scale, legHeight / scale, 100 / scale), frameMaterial);
      leg.name = "Desk steel leg";
      leg.position.set((x - workstation.position.x) / scale, (fittedDesk.min.y - legHeight / 2 - workstation.position.y) / scale, (z - workstation.position.z) / scale);
      leg.castShadow = true;
      workstation.add(leg);
    }
  }
  return { workstation, screenRotation, screenHeight, surfaceY, monitorTargets: meshes.filter(mesh => /^(Monitor_|Caja_)/.test(mesh.name)) };
}
