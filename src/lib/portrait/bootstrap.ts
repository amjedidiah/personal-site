const mounts = new Map<HTMLElement,() => void>();
/** Import Three.js only when the stage is near the viewport. */
export function initializePortraits(): void {
  for (const host of document.querySelectorAll<HTMLElement>('[data-volumetric-hero]')) {
    if (mounts.has(host)) continue;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    let loading = false;
    const stage = host.querySelector('[data-portrait-stage]') ?? host;
    const observer = new IntersectionObserver(async (entries) => {
      if (!entries.some(entry => entry.isIntersecting) || loading) return;
      loading = true;
      observer.disconnect();
      try {
        const {mountPortrait} = await import('./runtime');
        if (!cancelled && host.isConnected) cleanup = mountPortrait(host);
      } catch (error) {
        if (!cancelled) {
          host.dataset.portraitStatus = 'fallback';
          host.dispatchEvent(new CustomEvent('portraitstatuschange',{bubbles:true,detail:{status:'fallback',error:String(error)}}));
          console.warn('[volumetric hero] Renderer unavailable; showing static fallback.',error);
        }
      }
    },{rootMargin:'120px',threshold:0});
    observer.observe(stage);
    mounts.set(host,() => {cancelled = true;observer.disconnect();cleanup?.();});
  }
}
export function destroyPortraits(): void {
  for (const cleanup of mounts.values()) cleanup();
  mounts.clear();
}
initializePortraits();
document.addEventListener('astro:page-load',initializePortraits);
document.addEventListener('astro:before-swap',destroyPortraits);
window.addEventListener('pagehide',destroyPortraits);
window.addEventListener('pageshow',initializePortraits);
if (import.meta.hot) import.meta.hot.dispose(() => {
  destroyPortraits();
  document.removeEventListener('astro:page-load',initializePortraits);
  document.removeEventListener('astro:before-swap',destroyPortraits);
  window.removeEventListener('pagehide',destroyPortraits);
  window.removeEventListener('pageshow',initializePortraits);
});
