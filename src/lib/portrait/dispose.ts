import * as THREE from 'three';
/** Assets are owned per scene; de-duplicate shared materials, maps and bitmaps. */
export function disposeObjects(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const bitmaps = new Set<ImageBitmap>();
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    if (mesh.material) for (const m of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) materials.add(m);
  });
  for (const material of materials) {
    for (const value of Object.values(material)) {
      if (value instanceof THREE.Texture) textures.add(value);
    }
  }
  for (const texture of textures) {
    const images = Array.isArray(texture.source.data) ? texture.source.data : [texture.source.data];
    for (const image of images) if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) bitmaps.add(image);
    texture.dispose();
  }
  for (const image of bitmaps) image.close();
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}
