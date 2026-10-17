import { clientStrings } from '../i18n/client';

const EXTERNAL_LINK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="external-link-icon"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>`;

export function decorateExternalProseLinks(root: ParentNode = document) {
  const prose = root.querySelector<HTMLElement>('.prose');
  if (!prose) return;

  prose.querySelectorAll<HTMLAnchorElement>('a[href^="http"]').forEach((link) => {
    if (link.classList.contains('external-link')) return;

    link.classList.add('external-link');
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    const hint = document.createElement('span');
    hint.className = 'visually-hidden';
    hint.textContent = clientStrings().newTab;

    link.insertAdjacentHTML('beforeend', EXTERNAL_LINK_ICON);
    link.append(hint);
  });
}
