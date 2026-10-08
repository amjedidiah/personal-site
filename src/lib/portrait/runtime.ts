import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { applyAssembly, prepareFragments } from './fragments';
import { createNetwork } from './network';
import { disposeObjects } from './dispose';
import { ASSEMBLY_SECONDS, clamp } from './timing';

const MAX_BYTES = 12 * 1024 * 1024;
export type SceneStatus = 'loading' | 'assembling' | 'idle' | 'fallback';
/** One renderer for model, lights, network and pulses. Returns full teardown. */
export function mountPortrait(host: HTMLElement): () => void {
  const canvas = host.querySelector<HTMLCanvasElement>('[data-portrait-canvas]');
  const stage = host.querySelector<HTMLElement>('[data-portrait-stage]');
  const hero = host.closest<HTMLElement>('.hero') ?? host.parentElement;
  if (!canvas || !stage || !hero) throw new Error('HeroScene requires a positioned parent.');
  const listeners = new AbortController();
  const download = new AbortController();
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000,0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32,1,.1,40);
  camera.position.set(0,.08,8.2);
  camera.lookAt(0,.08,0);
  const portrait = new THREE.Group();
  scene.add(portrait);
  const ambient = new THREE.HemisphereLight(0xddecff,0x172537,1.8);
  const key = new THREE.DirectionalLight(0xffffff,3.8);
  key.position.set(-3,4,6);
  const fill = new THREE.DirectionalLight(0x9ccfe5,1.2);
  fill.position.set(3,1,4);
  const rim = new THREE.DirectionalLight(0x4ad5e3,2.3);
  rim.position.set(2,3,-3);
  scene.add(ambient,key,fill,rim);
  // Local studio environment for PBR; no remote HDR or post-processing dependency.
  function studioEnvironment() {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    try { return pmrem.fromScene(room,.04); }
    finally { disposeObjects(room); pmrem.dispose(); }
  }
  let environment: THREE.WebGLRenderTarget;
  try { environment = studioEnvironment(); }
  catch (error) { disposeObjects(scene); renderer.dispose(); renderer.forceContextLoss(); throw error; }
  scene.environment = environment.texture;
  const network = createNetwork(scene);
  const replays = Array.from(hero.querySelectorAll<HTMLButtonElement>('[data-portrait-replay]'));
  let mode = 0;
  let disposed = false;
  let lost = false;
  let inView = false;
  let frame = 0;
  let last = 0;
  let activeTime = 0;
  let assemblyTime = 0;
  let status: SceneStatus = 'loading';
  let fragments: ReturnType<typeof prepareFragments> = [];
  let x = 0;
  let y = 0;
  let smoothX = 0;
  let smoothY = 0;
  let lightTheme = false;
  let startYaw = 0;
  function setStatus(next: SceneStatus, error?: string) {
    status = next;
    host.dataset.portraitStatus = next;
    for (const button of replays) button.disabled = next !== 'idle' || motion.matches;
    host.dispatchEvent(new CustomEvent('portraitstatuschange',{bubbles:true,detail:{status:next,error}}));
  }
  function render(dt = 0) {
    if (disposed || lost) return;
    const reduced = motion.matches;
    if (fragments.length) {
      applyAssembly(fragments,reduced ? ASSEMBLY_SECONDS : assemblyTime);
      const damping = 1 - Math.exp(-4 * dt);
      smoothX += (x - smoothX) * damping;
      smoothY += (y - smoothY) * damping;
      portrait.rotation.set(reduced ? 0 : -smoothY * .025,startYaw + (reduced ? 0 : smoothX * .04),0);
      portrait.position.y = reduced || assemblyTime < ASSEMBLY_SECONDS ? 0 : Math.sin(activeTime * .75) * .025;
      rim.intensity = (lightTheme ? 1.6 : 2.3) + (reduced ? 0 : Math.sin(activeTime * .9) * .08);
    }
    // The fallback portrait has its own readable diagram; keep WebGL lines
    // behind model geometry rather than drawing them across the static face.
    network.group.visible = fragments.length > 0;
    if (network.group.visible) network.update(activeTime,dt,reduced,smoothX,smoothY);
    renderer.render(scene,camera);
    host.dataset.canvasReady = 'true';
    if (fragments.length) host.dataset.modelReady = 'true';
  }
  function tick(now: number) {
    frame = 0;
    if (disposed || lost || !inView || document.hidden || motion.matches) return;
    frame = requestAnimationFrame(tick);
    const fps = window.innerWidth <= 760 ? 24 : 30;
    if (last && now - last < 1000 / fps - .5) return;
    const dt = last ? Math.min((now - last) / 1000,.12) : 0;
    last = now;
    activeTime += dt;
    if (status === 'assembling') {
      assemblyTime = Math.min(ASSEMBLY_SECONDS,assemblyTime + dt);
      if (assemblyTime >= ASSEMBLY_SECONDS) setStatus('idle');
    }
    render(dt);
  }
  function syncPlayback() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    if (disposed || lost || !inView || document.hidden) return;
    if (motion.matches) {
      assemblyTime = ASSEMBLY_SECONDS;
      if (fragments.length) setStatus('idle');
      render();
    } else frame = requestAnimationFrame(tick);
  }
  function resize() {
    if (disposed || lost) return;
    const {width,height} = stage!.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,window.innerWidth <= 760 ? 1.25 : 1.6));
    renderer.setSize(width,height,false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (inView && !document.hidden) render();
  }
  function theme() {
    lightTheme = document.documentElement.dataset.theme === 'light';
    renderer.toneMappingExposure = lightTheme ? 1.1 : 1;
    ambient.intensity = lightTheme ? 2.2 : 1.8;
    ambient.groundColor.setHex(lightTheme ? 0x85919b : 0x172537);
    key.intensity = lightTheme ? 4.3 : 3.8;
    rim.intensity = lightTheme ? 1.6 : 2.3;
    network.theme(lightTheme);
    if (inView && !document.hidden) render();
  }
  function setMode(value: number) {
    if (!Number.isFinite(value)) return;
    mode = clamp(Math.round(value),0,1);
    host.dataset.mode = String(mode);
    network.setMode(mode,motion.matches);
    if (inView && !document.hidden) render();
  }
  host.addEventListener('systemmodechange',(e) => setMode((e as CustomEvent<number>).detail),{signal:listeners.signal});
  setMode(Number(host.dataset.mode ?? 0));
  function replay() {
    if (motion.matches || !fragments.length || status !== 'idle') return;
    assemblyTime = 0;
    portrait.position.y = 0;
    portrait.rotation.set(0,startYaw,0);
    smoothX = smoothY = 0;
    setStatus('assembling');
    if (inView && !document.hidden) render();
    syncPlayback();
  }
  replays.forEach(b => b.addEventListener('click',replay,{signal:listeners.signal}));
  host.addEventListener('portraitreplay',replay,{signal:listeners.signal});
  hero.addEventListener('pointermove',(e) => {
    if (motion.matches || !finePointer.matches || e.pointerType === 'touch') return;
    const bounds = hero.getBoundingClientRect();
    x = clamp((e.clientX - bounds.left) / bounds.width * 2 - 1,-1,1);
    y = clamp((e.clientY - bounds.top) / bounds.height * 2 - 1,-1,1);
  },{passive:true,signal:listeners.signal});
  hero.addEventListener('pointerleave',() => {x = y = 0;},{signal:listeners.signal});
  motion.addEventListener('change',() => {
    x = y = smoothX = smoothY = 0;
    if (motion.matches && fragments.length) {assemblyTime = ASSEMBLY_SECONDS;setStatus('idle');}
    for (const b of replays) b.disabled = status !== 'idle' || motion.matches;
    syncPlayback();
  },{signal:listeners.signal});
  document.addEventListener('visibilitychange',syncPlayback,{signal:listeners.signal});
  // Matches your data-theme convention without coupling to an unseen theme module.
  const themeObserver = new MutationObserver(theme);
  themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  const visibility = new IntersectionObserver(([entry]) => {inView = entry.isIntersecting;syncPlayback();},{threshold:.05});
  visibility.observe(stage);
  canvas.addEventListener('webglcontextlost',(e) => {
    e.preventDefault();lost = true;host.dataset.canvasReady = 'false';host.dataset.modelReady = 'false';syncPlayback();
  },{signal:listeners.signal});
  canvas.addEventListener('webglcontextrestored',() => {
    if (disposed) return;
    lost = false;
    // Render-target contents are lost with the context; recreate the studio map.
    environment.dispose();
    environment = studioEnvironment();
    scene.environment = environment.texture;
    resize();theme();syncPlayback();
  },{signal:listeners.signal});
  theme();resize();setStatus('loading');
  const timer = window.setTimeout(() => download.abort(),20000);
  async function loadModel() {
    let loaded: THREE.Object3D | undefined;
    try {
      const url = new URL(host.dataset.modelSrc ?? '/models/jedidiah-bust.glb',window.location.href);
      const response = await fetch(url,{signal:download.signal});
      if (!response.ok) throw new Error(`Model request returned HTTP ${response.status}.`);
      if (Number(response.headers.get('content-length') ?? 0) > MAX_BYTES) throw new Error('GLB exceeds the 12 MiB ceiling.');
      const chunks: Uint8Array[] = [];
      let length = 0;
      if (response.body) {
        const reader = response.body.getReader();
        try {
          for (;;) {
            const {done,value} = await reader.read();
            if (done) break;
            length += value.byteLength;
            if (length > MAX_BYTES) {await reader.cancel();throw new Error('GLB exceeds the 12 MiB ceiling.');}
            chunks.push(value);
          }
        } finally {reader.releaseLock();}
      } else {const bytes = new Uint8Array(await response.arrayBuffer());chunks.push(bytes);length = bytes.length;}
      if (length > MAX_BYTES || length < 20) throw new Error('Invalid GLB size.');
      const bytes = new Uint8Array(length);
      let cursor = 0;
      for (const chunk of chunks) {bytes.set(chunk,cursor);cursor += chunk.length;}
      const view = new DataView(bytes.buffer);
      if (view.getUint32(0,true) !== 0x46546c67 || view.getUint32(4,true) !== 2 || view.getUint32(8,true) !== length
        || view.getUint32(16,true) !== 0x4e4f534a) throw new Error('Expected a valid binary glTF 2.0 file.');
      const jsonLength = view.getUint32(12,true);
      if (20 + jsonLength > length) throw new Error('Truncated GLB JSON.');
      const json = JSON.parse(new TextDecoder().decode(bytes.subarray(20,20 + jsonLength)));
      for (const asset of [...(json.buffers ?? []),...(json.images ?? [])]) {
        if (asset.uri && !String(asset.uri).startsWith('data:')) throw new Error('Embed all buffers and textures in the GLB.');
      }
      const extensions = [...(json.extensionsUsed ?? []),...(json.extensionsRequired ?? [])];
      if (extensions.some((name: string) => /draco|meshopt|basisu|gpu_instancing/i.test(name))) {
        throw new Error('Export an uncompressed rigid GLB. Draco, Meshopt, KTX2 and GPU instancing are outside this asset contract.');
      }
      if ((json.scenes ?? []).length !== 1 || (json.animations ?? []).length) throw new Error('Export one scene with animations disabled.');
      if (disposed) return;
      const gltf = await new GLTFLoader().parseAsync(bytes.buffer,new URL('.',url).href);
      loaded = gltf.scene;
      // The contract has one scene; dispose any unused scene resources as well at teardown.
      if (gltf.scenes.length !== 1 || gltf.animations.length) throw new Error('Export one assembled scene with animations disabled.');
      if (disposed) {disposeObjects(loaded);return;}
      loaded.traverse((node) => {
        const item = node as THREE.Mesh;
        if (item.isMesh) {
          const mats = Array.isArray(item.material) ? item.material : [item.material];
          for (const material of mats) if (material instanceof THREE.MeshStandardMaterial) material.envMapIntensity = .65;
        }
        if ((node as THREE.Light).isLight || (node as THREE.Camera).isCamera) throw new Error('Remove exported lights and cameras.');
      });
      const box = new THREE.Box3().setFromObject(loaded);
      const size = box.getSize(new THREE.Vector3());
      if (!Number.isFinite(size.y) || size.y <= 0) throw new Error('Model has no visible geometry.');
      const center = box.getCenter(new THREE.Vector3());
      const normalized = new THREE.Group();
      loaded.position.sub(center);
      normalized.add(loaded);
      normalized.scale.setScalar(Math.min(3.15 / size.y,3.3 / Math.max(size.x,.01),2.2 / Math.max(size.z,.01)));
      portrait.add(normalized);
      portrait.updateWorldMatrix(true,true);
      fragments = prepareFragments(normalized);
      const yaw = Number(host.dataset.modelYaw ?? 0);
      startYaw = Number.isFinite(yaw) ? THREE.MathUtils.degToRad(yaw) : 0;
      assemblyTime = motion.matches ? ASSEMBLY_SECONDS : 0;
      setStatus(motion.matches ? 'idle' : 'assembling');
      if (inView && !document.hidden) render();
      syncPlayback();
    } catch (error) {
      if (loaded && !disposed) {loaded.removeFromParent();disposeObjects(loaded);}
      if (!disposed) {
        fragments = [];
        host.dataset.modelReady = 'false';
        const message = error instanceof Error ? error.message : 'Model could not load.';
        setStatus('fallback',message);
        console.warn('[volumetric hero]',message);
      }
    } finally {window.clearTimeout(timer);}
  }
  void loadModel();
  return () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    window.clearTimeout(timer);
    listeners.abort();download.abort();
    visibility.disconnect();resizeObserver.disconnect();themeObserver.disconnect();
    disposeObjects(scene);
    environment.dispose();
    scene.environment = null;
    renderer.dispose();
    host.dataset.canvasReady = 'false';host.dataset.modelReady = 'false';
    renderer.forceContextLoss();
  };
}
