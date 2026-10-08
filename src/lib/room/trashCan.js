import * as THREE from "three";
import { createTrashCan, createRubbish } from "./furniture";

export function createInteractiveTrashCan() {
  const group = new THREE.Group();
  group.name = "Trash can and scattered rubbish";
  const bin = createTrashCan();
  group.add(bin);
  const smooth = t => { t = THREE.MathUtils.clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const variation = (index, salt) => {
    const value = Math.sin((index + 1) * 127.1 + salt * 311.7) * 43758.5453;
    return value - Math.floor(value);
  };
  const tipDirection = new THREE.Vector3(-0.8, 0, 0.6);
  const tipAxis = new THREE.Vector3(tipDirection.z, 0, -tipDirection.x);
  const spills = ["paper", "paper", "cup", "paper", "can", "paper"].map((kind, index) => {
    const piece = createRubbish(kind, index);
    const landingRotation = new THREE.Euler(kind === "paper" ? variation(index, 1) : Math.PI / 2, variation(index, 2) * Math.PI * 2, variation(index, 3) * 0.6);
    piece.rotation.copy(landingRotation);
    piece.updateMatrixWorld(true);
    const floorY = 3 - new THREE.Box3().setFromObject(piece).min.y;
    const angle = index * 2.4;
    piece.position.set(Math.cos(angle) * 270, 1230 + variation(index, 4) * 95, Math.sin(angle) * 270);
    piece.rotation.set(index * 0.7, angle, index * 0.4);
    bin.add(piece);
    const spread = -0.8 + variation(index, 5) * 3.2;
    const speed = 450 + variation(index, 6) * 1550;
    return {
      piece, floorY, landingRotation,
      initial: piece.position.clone(),
      exit: tipDirection.clone().multiplyScalar(425 + variation(index, 7) * 60).setY(1350 + variation(index, 8) * 50),
      direction: new THREE.Vector3(-Math.sin(spread), 0, Math.cos(spread)),
      speed, delay: 840 + index * 68 + variation(index, 9) * 70,
      spin: new THREE.Vector3(variation(index, 10) * 8 - 4, variation(index, 11) * 8 - 4, variation(index, 12) * 8 - 4),
      origin: null, rotation: null,
      previous: new THREE.Vector3(), previousTime: null,
      restitution: 0.12 + variation(index, 13) * 0.09,
    };
  });
  let started = null, used = false;
  const gravity = 6500;
  function update(now) {
    if (started === null) return;
    const age = now - started;
    // Two small rocks lead into a deeper tip, then the empty can returns gently.
    let tilt;
    if (age < 600) tilt = Math.sin(age / 600 * Math.PI * 4) * 0.1 * (1 - age / 600);
    else if (age < 1200) tilt = 1.26 * smooth((age - 600) / 600);
    else tilt = 1.26 * (1 - smooth((age - 1200) / 950));
    bin.quaternion.setFromAxisAngle(tipAxis, tilt);
    // Pivot on the lower edge instead of letting the base sink through the floor.
    bin.position.y = 430 * Math.abs(Math.sin(tilt));
    let moving = age < 2150;
    spills.forEach(spill => {
      const { piece, floorY, speed, direction } = spill;
      if (!spill.origin) {
        // The original contents slide toward the low rim as the can tips.
        piece.position.lerpVectors(spill.initial, spill.exit, smooth((age - 620) / (spill.delay - 620)));
        group.updateMatrixWorld(true);
        const current = group.worldToLocal(piece.getWorldPosition(new THREE.Vector3()));
        if (age < spill.delay) {
          spill.previous.copy(current);
          spill.previousTime = now;
          return;
        }
        group.attach(piece);
        spill.origin = piece.position.clone();
        spill.rotation = piece.quaternion.clone();
        const delta = spill.previousTime === null ? 0 : (now - spill.previousTime) / 1000;
        const inheritedVelocity = delta > 0 && delta < 0.1
          ? current.clone().sub(spill.previous).divideScalar(delta).clampLength(0, 1800)
          : new THREE.Vector3();
        spill.velocity = direction.clone().multiplyScalar(speed).addScaledVector(inheritedVelocity, 0.35);
        spill.velocity.y = Math.min(-100, spill.velocity.y);
        const height = Math.max(0, spill.origin.y - floorY);
        spill.flight = (spill.velocity.y + Math.sqrt(spill.velocity.y ** 2 + 2 * gravity * height)) / gravity;
        spill.bounceSpeed = (gravity * spill.flight - spill.velocity.y) * spill.restitution;
        spill.releasedAt = started + spill.delay;
      }
      const t = (now - spill.releasedAt) / 1000;
      const bounceTime = Math.max(0, t - spill.flight);
      const bounceDuration = 2 * spill.bounceSpeed / gravity;
      const slideDuration = 0.45;
      const slideTime = Math.min(bounceTime, slideDuration);
      const travelTime = Math.min(t, spill.flight) + 0.35 * (slideTime - slideTime * slideTime / (2 * slideDuration));
      piece.position.copy(spill.origin).addScaledVector(spill.velocity, travelTime);
      piece.position.y = t < spill.flight
        ? spill.origin.y + spill.velocity.y * t - 0.5 * gravity * t * t
        : floorY + Math.max(0, spill.bounceSpeed * bounceTime - 0.5 * gravity * bounceTime * bounceTime);
      const airborneRotation = spill.rotation.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(spill.spin.x * t, spill.spin.y * t, spill.spin.z * t)));
      const restingRotation = new THREE.Quaternion().setFromEuler(spill.landingRotation);
      piece.quaternion.copy(airborneRotation).slerp(restingRotation, smooth((t / Math.max(spill.flight, 0.001) - 0.55) / 0.45));
      if (t < spill.flight + Math.max(bounceDuration, slideDuration)) moving = true;
    });
    if (!moving) {
      bin.rotation.set(0, 0, 0);
      bin.position.y = 0;
      started = null;
    }
  }
  function shake(now, reducedMotion = false) {
    if (used) return;
    used = true;
    started = now;
    if (reducedMotion) {
      // Complete the same release and settling steps without visible movement.
      update(now + 1300);
      update(now + 5000);
    } else update(now);
  }
  return { group, bin, shake, update, get canSpill() { return !used; } };
}
