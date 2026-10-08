import * as THREE from 'three';
import { clamp, defaultDelay, hashName, MAX_DELAY, pieceProgress, seededRandom } from './timing.ts';

interface Fragment {
  node: THREE.Object3D;
  end: THREE.Vector3;
  start: THREE.Vector3;
  bend: THREE.Vector3;
  rotation: THREE.Quaternion;
  startRotation: THREE.Quaternion;
  scale: THREE.Vector3;
  delay: number;
}
export function isFragment(node: THREE.Object3D): boolean {
  return node.userData.assemblyPart === true || /^frag_/i.test(node.name);
}
/** Keep parent transforms, authored pivots and complete subtrees intact. */
export function prepareFragments(root: THREE.Object3D): Fragment[] {
  root.updateWorldMatrix(true, true);
  const roots: THREE.Object3D[] = [];
  root.traverse((node) => {
    if (!isFragment(node)) return;
    for (let parent = node.parent; parent; parent = parent.parent) {
      if (isFragment(parent)) throw new Error(`Nested fragments: ${node.name}. Tag only each outer fragment root.`);
      if (parent === root) break;
    }
    roots.push(node);
  });
  if (roots.length < 8 || roots.length > 120) {
    throw new Error(`Expected 8–120 independent fragment roots; found ${roots.length}. See MODEL-SPEC.md.`);
  }
  const names = new Set<string>();
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    if ((mesh as THREE.SkinnedMesh).isSkinnedMesh || Object.keys(mesh.morphTargetDictionary ?? {}).length) {
      throw new Error('Bake skinning and shape keys into rigid geometry before exporting.');
    }
    let covered = false;
    for (let parent: THREE.Object3D | null = node; parent; parent = parent.parent) {
      if (isFragment(parent)) { covered = true; break; }
      if (parent === root) break;
    }
    if (!covered) throw new Error(`Mesh ${node.name} is outside a fragment; put it under a tagged root.`);
  });
  return roots.map((node) => {
    if (!node.name || names.has(node.name)) throw new Error('Every fragment needs a unique, nonempty name.');
    names.add(node.name);
    const parent = node.parent!;
    const rng = seededRandom(hashName(node.name));
    const end = node.position.clone();
    const worldEnd = node.getWorldPosition(new THREE.Vector3());
    const pieceBox = new THREE.Box3().setFromObject(node);
    const center = pieceBox.getCenter(new THREE.Vector3());
    if (pieceBox.isEmpty() || !Number.isFinite(center.x)) throw new Error(`Empty fragment ${node.name}.`);
    const direction = center.clone().normalize();
    if (direction.lengthSq() < .01) direction.set(rng() - .5, rng() - .5, .5).normalize();
    direction.z = Math.abs(direction.z) * .45 + .2;
    direction.add(new THREE.Vector3((rng() - .5) * .45, (rng() - .5) * .35, 0)).normalize();
    const start = parent.worldToLocal(worldEnd.clone().addScaledVector(direction, .7 + rng() * .8));
    const bend = parent.worldToLocal(worldEnd.clone().add(new THREE.Vector3((rng() - .5) * .5, .25 + rng() * .25, .15))).sub(end);
    const spin = new THREE.Quaternion().setFromEuler(new THREE.Euler((rng() - .5) * 1.2, (rng() - .5) * 1.5, (rng() - .5) * .8));
    const rotation = node.quaternion.clone();
    const authoredDelay = node.userData.assemblyDelay;
    return {
      node, end, start, bend, rotation,
      startRotation: rotation.clone().multiply(spin), scale: node.scale.clone(),
      delay: typeof authoredDelay === 'number' && Number.isFinite(authoredDelay)
        ? clamp(authoredDelay, 0, MAX_DELAY) : defaultDelay(node.name),
    };
  });
}
export function applyAssembly(fragments: Fragment[], seconds: number): void {
  for (const part of fragments) {
    const p = pieceProgress(seconds, part.delay);
    if (p === 1) {
      // Copy exact authored values: no residual seams from interpolation.
      part.node.position.copy(part.end);
      part.node.quaternion.copy(part.rotation);
    } else {
      part.node.position.lerpVectors(part.start, part.end, p).addScaledVector(part.bend, 4 * p * (1 - p));
      part.node.quaternion.slerpQuaternions(part.startRotation, part.rotation, p);
    }
    part.node.scale.copy(part.scale);
  }
}
