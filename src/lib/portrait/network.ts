import * as THREE from 'three';
import { clamp } from './timing';
// Original layouts, edge sets and palettes from your uploaded HeroScene.astro.
const layouts = [
  [[0,0,0],[-2.7,.95,.25],[-2.7,-.95,-.5],[-1.35,1.8,-1],[-1.35,-1.85,.85],[1.3,1.8,.75],[1.3,-1.8,-1],[2.7,1,-.4],[2.7,-1,.65],[-.75,.05,1.85],[.75,.05,-1.85]],
  [[0,0,0],[-2.45,0,.2],[-1.7,1.75,-.95],[0,2.45,.65],[1.75,1.75,-.95],[2.45,0,.2],[1.75,-1.75,-.95],[0,-2.45,.65],[-1.7,-1.75,-.95],[-.95,.8,1.55],[.95,-.8,1.55]],
];
const edges = [
  [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,9],[0,10],[1,3],[2,4],[5,7],[6,8],[7,8]],
  [[0,1],[0,3],[0,5],[0,7],[0,9],[0,10],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,1]],
];
const palettes = [[0x61d6bb,0x58a6ff,0xe8b86d],[0xe8b86d,0xc4a0ff,0x58a6ff]];
export function createNetwork(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.position.z = -2.2;
  group.scale.set(.68, .68, .1); // Network stays behind the complete bust.
  scene.add(group);
  let mode = 0;
  let light = false;
  const geometry = new THREE.OctahedronGeometry(.1);
  const nodes = layouts[0].map((p, i) => {
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: palettes[0][i % 3], transparent: true, opacity: .24, depthWrite: false }));
    mesh.position.set(p[0],p[1],p[2]);
    // Central core used to compete with the face; retain its connection anchor only.
    mesh.visible = i !== 0;
    group.add(mesh);
    return mesh;
  });
  const positions = new Float32Array(16 * 6);
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  const material = new THREE.LineBasicMaterial({ color: palettes[0][0], transparent: true, opacity: .105, depthWrite: false });
  group.add(new THREE.LineSegments(lineGeometry, material));
  const pulseGeometry = new THREE.SphereGeometry(.025,8,6);
  const pulses = Array.from({length:5},(_, i) => {
    const mesh = new THREE.Mesh(pulseGeometry,new THREE.MeshBasicMaterial({color:palettes[0][i % 3],transparent:true,opacity:.32,depthWrite:false}));
    group.add(mesh);
    return mesh;
  });
  function theme(value: boolean) {
    light = value;
    material.color.setHex(light ? 0x356c9e : palettes[mode][0]);
    material.opacity = light ? .14 : .105;
    nodes.forEach(n => n.material.opacity = light ? .34 : .24);
  }
  function setMode(value: number, snap = false) {
    mode = clamp(Math.round(value),0,1);
    nodes.forEach((n,i) => {
      n.material.color.setHex(palettes[mode][i % 3]);
      if (snap) n.position.fromArray(layouts[mode][i]);
    });
    pulses.forEach((p,i) => p.material.color.setHex(palettes[mode][i % 3]));
    theme(light);
  }
  function update(t: number, dt: number, reduced: boolean, x: number, y: number) {
    const factor = reduced ? 1 : 1 - Math.exp(-4 * dt);
    nodes.forEach((n,i) => {
      const target = layouts[mode][i];
      n.position.x += (target[0] - n.position.x) * factor;
      n.position.y += (target[1] - n.position.y) * factor;
      n.position.z += (target[2] - n.position.z) * factor;
      if (!reduced) n.rotation.y += dt * .2;
    });
    edges[mode].forEach(([from,to],i) => {
      nodes[from].position.toArray(positions,i * 6);
      nodes[to].position.toArray(positions,i * 6 + 3);
    });
    lineGeometry.setDrawRange(0,edges[mode].length * 2);
    lineGeometry.attributes.position.needsUpdate = true;
    pulses.forEach((p,i) => {
      const [from,to] = edges[mode][i * 2 % edges[mode].length];
      p.position.lerpVectors(nodes[from].position,nodes[to].position,reduced ? .5 : (t * .18 + i / pulses.length) % 1);
    });
    group.rotation.set(reduced ? 0 : -y * .025, reduced ? 0 : x * .05 + Math.sin(t * .2) * .035,0);
  }
  return { group, theme, setMode, update };
}
