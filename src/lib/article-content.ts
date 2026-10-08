export function enhanceArticleContent() {
  const prose = document.querySelector<HTMLElement>('.project-article .prose, .article-shell .prose');
  if (!prose || prose.dataset.enhanced) return;
  prose.dataset.enhanced = 'true';

  prose.querySelectorAll('table').forEach((table) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'article-table-scroll';
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-label', table.caption?.textContent?.trim() || 'Data table');
    table.before(wrapper);
    wrapper.append(table);
  });

  const regions = prose.querySelectorAll<HTMLElement>('pre, .article-table-scroll');
  const update = () => regions.forEach((region) => {
    if (region.scrollWidth > region.clientWidth) {
      region.tabIndex = 0;
      if (region.tagName === 'PRE') {
        region.setAttribute('role', 'region');
        region.setAttribute('aria-label', 'Code example');
      }
    } else region.removeAttribute('tabindex');
  });
  update();
  const observer = new ResizeObserver(update);
  regions.forEach((region) => observer.observe(region));
  document.addEventListener('astro:before-swap', () => observer.disconnect(), { once: true });
}
