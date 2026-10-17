import { clientStrings } from '../i18n/client';
import { observeReducedMotion, prefersReducedMotion } from './motion';

function shouldActivateExploreRead(key: string, selectedPaper: HTMLElement | null): selectedPaper is HTMLElement {
  if (!selectedPaper) return false;
  if (key === 'Enter') return true;
  return key === ' ';
}

function visibleExplorePapers(papers: HTMLElement[]) {
  return papers.filter((paper) => !paper.hidden);
}

type CanPreviewPaperOnHoverOptions = {
  fineHover: MediaQueryList;
  dragging: boolean;
  paper: HTMLElement;
  selectedPaper: HTMLElement | null;
  selectedRead: HTMLElement;
};

function canPreviewPaperOnHover(options: CanPreviewPaperOnHoverOptions) {
  const { fineHover, dragging, paper, selectedPaper, selectedRead } = options;
  if (!fineHover.matches) return false;
  if (dragging) return false;
  if (paper.hidden) return false;
  if (paper === selectedPaper) return false;
  return document.activeElement !== selectedRead;
}

type ExploreStageKeydown = {
  stage: HTMLElement;
  papers: HTMLElement[];
  getSelected: () => HTMLElement | null;
  selectPaper: (paper: HTMLElement) => void;
  adjustPitch: (delta: number) => void;
  focusRead: () => void;
};

function withVisibleExplorePaper(
  visible: HTMLElement[],
  select: (papers: HTMLElement[]) => void,
): boolean {
  if (!visible.length) return false;
  select(visible);
  return true;
}

function navigateExplorePaperHorizontal(
  key: string,
  visible: HTMLElement[],
  current: number,
  selectPaper: (paper: HTMLElement) => void,
): boolean {
  if (key === 'ArrowLeft') {
    return withVisibleExplorePaper(visible, (papers) => {
      selectPaper(papers[(current - 1 + papers.length) % papers.length]);
    });
  }
  if (key === 'ArrowRight') {
    return withVisibleExplorePaper(visible, (papers) => {
      selectPaper(papers[(current + 1) % papers.length]);
    });
  }
  return false;
}

function navigateExplorePaperHomeEnd(
  key: string,
  visible: HTMLElement[],
  selectPaper: (paper: HTMLElement) => void,
): boolean {
  if (key === 'Home') {
    return withVisibleExplorePaper(visible, (papers) => { selectPaper(papers[0]); });
  }
  if (key === 'End') {
    return withVisibleExplorePaper(visible, (papers) => { selectPaper(papers[papers.length - 1]); });
  }
  return false;
}

function navigateExplorePaper(
  key: string,
  visible: HTMLElement[],
  current: number,
  selectPaper: (paper: HTMLElement) => void,
): boolean {
  return navigateExplorePaperHorizontal(key, visible, current, selectPaper)
    || navigateExplorePaperHomeEnd(key, visible, selectPaper);
}

function nudgeExplorePitch(key: string, step: number, adjustPitch: (delta: number) => void): boolean {
  if (key === 'ArrowUp') {
    adjustPitch(step);
    return true;
  }
  if (key === 'ArrowDown') {
    adjustPitch(-step);
    return true;
  }
  return false;
}

function handleExploreStageKeydown(event: KeyboardEvent, actions: ExploreStageKeydown) {
  if (event.target !== actions.stage) return;
  const step = event.shiftKey ? 30 : 12;
  const visible = visibleExplorePapers(actions.papers);
  const selectedPaper = actions.getSelected();
  const current = selectedPaper ? visible.indexOf(selectedPaper) : -1;
  let handled = navigateExplorePaper(event.key, visible, current, actions.selectPaper);
  if (!handled) handled = nudgeExplorePitch(event.key, step, actions.adjustPitch);
  if (!handled && shouldActivateExploreRead(event.key, selectedPaper)) {
    actions.focusRead();
    handled = true;
  }
  if (!handled) return;
  actions.stage.classList.add('has-interacted');
  event.preventDefault();
}

type CompletedDrag = {
  moved: boolean;
  lastTime: number;
  velocityYaw: number;
  velocityPitch: number;
};

function isRecentPointerUp(completed: CompletedDrag, event: PointerEvent) {
  return event.type === 'pointerup' && event.timeStamp - completed.lastTime < 90;
}

function hasMeaningfulDragVelocity(completed: CompletedDrag) {
  return Math.abs(completed.velocityYaw) + Math.abs(completed.velocityPitch) > 0.025;
}

function shouldCoastAfterDrag(completed: CompletedDrag, event: PointerEvent) {
  if (!completed.moved) return false;
  if (!isRecentPointerUp(completed, event)) return false;
  if (prefersReducedMotion()) return false;
  return hasMeaningfulDragVelocity(completed);
}

type StartExploreDragCoastOptions = {
  completed: CompletedDrag;
  turn: () => void;
  readAngles: () => { yaw: number; pitch: number };
  writeAngles: (yaw: number, pitch: number) => void;
  stopInertia: () => void;
  setInertiaFrame: (id: number) => void;
};

function startExploreDragCoast(options: StartExploreDragCoastOptions) {
  const { completed, turn, readAngles, writeAngles, stopInertia, setInertiaFrame } = options;
  let velocityYaw = completed.velocityYaw;
  let velocityPitch = completed.velocityPitch;
  let previousTime = 0;
  const coast = (time: number) => {
    const elapsed = Math.min(32, time - (previousTime || time - 16));
    previousTime = time;
    const { yaw, pitch } = readAngles();
    writeAngles(yaw + velocityYaw * elapsed, Math.max(-78, Math.min(78, pitch + velocityPitch * elapsed)));
    turn();
    const decay = 0.86 ** (elapsed / 16);
    velocityYaw *= decay;
    velocityPitch *= decay;
    if (Math.abs(velocityYaw) + Math.abs(velocityPitch) < 0.012) stopInertia();
    else setInertiaFrame(window.requestAnimationFrame(coast));
  };
  setInertiaFrame(window.requestAnimationFrame(coast));
}

export type ListingExploreWire = {
  listingRoot: string;
  eventEnter: string;
  eventFilter: string;
  eventJump: string;
  eventSelectJump: string;
  itemNoun: string;
  /** Full phrases, since word order differs by language ("Selected project", "Projet sélectionné"). */
  selectedLabel: string;
  previewLabel: string;
  readLabel: string;
  fallbackHref: string;
  emptyTitle: string;
  emptyDescription: string;
  previewNote: string;
};

type ExploreDetailPanels = {
  detailLabel: HTMLElement;
  selectedPosition: HTMLElement;
  selectedTitle: HTMLElement;
  selectedDescription: HTMLElement;
  selectedDate: HTMLElement;
  selectedSource: HTMLElement;
  selectedRead: HTMLAnchorElement;
  previewNote: HTMLElement;
  selectedThumb: HTMLImageElement;
};

type ExploreDetailTitleMotion = {
  title: string;
  animation?: Animation;
};

type ExploreGlobeElements = {
  stage: HTMLElement;
  axis: HTMLElement;
  globe: HTMLElement;
  detail: HTMLElement;
};

function getExploreGlobeElements(explore: HTMLElement): ExploreGlobeElements | null {
  const stage = explore.querySelector<HTMLElement>('.globe-stage');
  if (!stage) return null;
  const axis = explore.querySelector<HTMLElement>('.globe-axis');
  if (!axis) return null;
  const globe = explore.querySelector<HTMLElement>('.paper-globe');
  if (!globe) return null;
  const detail = explore.querySelector<HTMLElement>('.selected-paper');
  if (!detail) return null;
  return { stage, axis, globe, detail };
}

type PartialExploreDetailPanels = {
  [Key in keyof ExploreDetailPanels]: ExploreDetailPanels[Key] | null;
};

function isCompleteExploreDetailPanels(panels: PartialExploreDetailPanels): panels is ExploreDetailPanels {
  for (const key of Object.keys(panels) as (keyof ExploreDetailPanels)[]) {
    if (!panels[key]) return false;
  }
  return true;
}

function getExploreDetailPanels(detail: HTMLElement): ExploreDetailPanels | null {
  const panels: PartialExploreDetailPanels = {
    detailLabel: detail.querySelector('[data-detail-label]'),
    selectedPosition: detail.querySelector('[data-paper-position]'),
    selectedTitle: detail.querySelector('[data-selected-title]'),
    selectedDescription: detail.querySelector('[data-selected-description]'),
    selectedDate: detail.querySelector('[data-selected-date]'),
    selectedSource: detail.querySelector('[data-selected-source]'),
    selectedRead: detail.querySelector('[data-selected-read]'),
    previewNote: detail.querySelector('[data-preview-note]'),
    selectedThumb: detail.querySelector('[data-selected-thumb]'),
  };
  if (!isCompleteExploreDetailPanels(panels)) return null;
  return panels;
}

function syncExploreReadLink(
  selectedRead: HTMLAnchorElement,
  paper: HTMLElement,
  wire: ListingExploreWire,
) {
  selectedRead.href = paper.dataset.href ?? wire.fallbackHref;
  const readTarget = paper.dataset.title ?? wire.itemNoun;
  const external = paper.dataset.external === 'true';
  selectedRead.setAttribute(
    'aria-label',
    `${wire.readLabel} ${readTarget}${external ? clientStrings().newTab : ''}`,
  );
  if (external) {
    selectedRead.target = '_blank';
    selectedRead.rel = 'noopener noreferrer';
  } else {
    selectedRead.removeAttribute('target');
    selectedRead.removeAttribute('rel');
  }
}

type WriteExploreDetailPanelsOptions = {
  panels: ExploreDetailPanels;
  paper: HTMLElement;
  papers: HTMLElement[];
  wire: ListingExploreWire;
  preview: boolean;
};

function writeExploreDetailPanels(options: WriteExploreDetailPanelsOptions) {
  const { panels, paper, papers, wire, preview } = options;
  const visible = visibleExplorePapers(papers);
  panels.detailLabel.textContent = preview ? wire.previewLabel : wire.selectedLabel;
  panels.selectedPosition.textContent = `${String(visible.indexOf(paper) + 1).padStart(2, '0')} / ${String(visible.length).padStart(2, '0')}`;
  panels.selectedTitle.textContent = paper.dataset.title ?? '';
  panels.selectedDescription.textContent = paper.dataset.description ?? '';
  panels.selectedDate.textContent = paper.dataset.exploreMetaA ?? '';
  panels.selectedSource.textContent = paper.dataset.exploreMetaB ?? '';
  syncExploreReadLink(panels.selectedRead, paper, wire);
  const { thumbSrc, thumbSrcset } = paper.dataset;
  panels.selectedThumb.hidden = !thumbSrc;
  if (thumbSrc && panels.selectedThumb.getAttribute('src') !== thumbSrc) {
    panels.selectedThumb.srcset = thumbSrcset ?? '';
    panels.selectedThumb.src = thumbSrc;
  }
  panels.selectedRead.hidden = preview;
  panels.previewNote.hidden = !preview;
}

function animateExploreDetailTitleChange(
  detail: HTMLElement,
  moduleSurface: boolean,
  nextTitle: string,
  motion: ExploreDetailTitleMotion,
) {
  if (nextTitle === motion.title) return;
  motion.animation?.cancel();
  if (!prefersReducedMotion()) {
    motion.animation = detail.querySelector('.selected-content')?.animate(
      moduleSurface
        ? [{ opacity: .7, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }]
        : [{ opacity: .55 }, { opacity: 1 }],
      { duration: moduleSurface ? 200 : 160, easing: 'cubic-bezier(.16, 1, .3, 1)' },
    );
  }
  motion.title = nextTitle;
}

export function initListingExplore(explore: HTMLElement, wire: ListingExploreWire) {
  const listingRoot = document.querySelector<HTMLElement>(wire.listingRoot);
  const globeElements = getExploreGlobeElements(explore);
  if (!globeElements) return;
  const { stage, axis, globe, detail } = globeElements;

  const papers = Array.from(explore.querySelectorAll<HTMLElement>('.paper'));
  const detailPanels = getExploreDetailPanels(detail);
  if (!detailPanels) return;

  const mobile = window.matchMedia('(max-width: 760px)');
  const moduleSurface = explore.dataset.exploreSurface === 'module';
  const fineHover = window.matchMedia('(hover: hover) and (pointer: fine)');
  let yaw = 0;
  let pitch = 0;
  let selected: HTMLElement | null = papers[0] ?? null;
  let previewed: HTMLElement | null = null;
  let drag: {
    id: number;
    x: number;
    y: number;
    yaw: number;
    pitch: number;
    moved: boolean;
    lastTime: number;
    velocityYaw: number;
    velocityPitch: number;
  } | null = null;
  let inertiaFrame = 0;
  let suppressClick = false;
  let sceneAnimation: Animation | undefined;
  const detailTitleMotion: ExploreDetailTitleMotion = {
    title: detailPanels.selectedTitle.textContent ?? '',
  };

  const stopInertia = () => {
    if (inertiaFrame) window.cancelAnimationFrame(inertiaFrame);
    inertiaFrame = 0;
    if (!drag) stage.classList.remove('is-dragging');
  };

  const updateDepth = () => {
    // Without 3D support the papers sit in a flat grid: all readable and clickable.
    if (!stage.classList.contains('is-ready')) return;
    const toRadians = Math.PI / 180;
    const rotation = pitch * toRadians;
    for (const paper of papers) {
      if (paper.hidden) continue;
      const latitude = Number(paper.dataset.lat ?? 0) * toRadians;
      const longitude = (Number(paper.dataset.lon ?? 0) + yaw) * toRadians;
      const facing = Math.sin(rotation) * Math.sin(latitude)
        + Math.cos(rotation) * Math.cos(latitude) * Math.cos(longitude);
      const depth = Math.max(0, Math.min(1, (facing - 0.08) / 0.92));
      paper.style.setProperty('--depth-alpha', String(paper === selected ? 1 : 0.3 + 0.7 * depth));
      paper.style.pointerEvents = paper === selected || facing > 0.12 ? 'auto' : 'none';
    }
  };

  const turn = () => {
    axis.style.setProperty('--pitch', `${pitch}deg`);
    globe.style.setProperty('--yaw', `${yaw}deg`);
    updateDepth();
  };

  const renderDetail = (paper: HTMLElement, preview = false) => {
    animateExploreDetailTitleChange(detail, moduleSurface, paper.dataset.title ?? '', detailTitleMotion);
    writeExploreDetailPanels({ panels: detailPanels, paper, papers, wire, preview });
  };

  const selectPaper = (paper: HTMLElement, focusRead = false) => {
    if (paper.hidden) return;
    stopInertia();
    previewed = null;
    selected = paper;
    for (const item of papers) {
      const active = item === paper;
      item.classList.toggle('is-selected', active);
      item.querySelector<HTMLButtonElement>('.paper-select')?.setAttribute('aria-pressed', String(active));
    }
    renderDetail(paper);
    pitch = Number(paper.dataset.lat ?? 0);
    const targetYaw = -Number(paper.dataset.lon ?? 0);
    // Keep a selection close to the current angle even after several full turns.
    yaw += ((targetYaw - yaw + 180) % 360 + 360) % 360 - 180;
    turn();
    listingRoot?.dispatchEvent(new CustomEvent(wire.eventSelectJump, { detail: paper.dataset.exploreJump ?? '' }));
    if (focusRead) detailPanels.selectedRead.focus();
  };

  const revealDetail = () => {
    if (mobile.matches) {
      detail.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'instant' : 'smooth' });
    }
  };

  const arrange = () => {
    stopInertia();
    const visible = papers.filter((paper) => !paper.hidden);
    stage.classList.toggle('is-sparse', visible.length <= 5);
    const compact = [
      { latitude: 0, longitude: 0 },
      { latitude: 18, longitude: -38 },
      { latitude: -18, longitude: 38 },
      { latitude: -29, longitude: -31 },
      { latitude: 29, longitude: 31 },
    ];
    for (const [index, paper] of visible.entries()) {
      let latitude = 0;
      let longitude = 0;
      if (visible.length <= compact.length) {
        ({ latitude, longitude } = compact[index]);
      } else if (index > 0) {
        const fraction = (index - 0.5) / Math.max(1, visible.length - 1);
        latitude = (Math.asin(1 - 2 * fraction) * 180) / Math.PI;
        longitude = ((index * 137.508 + 36) % 360) - 180;
      }
      paper.dataset.lat = String(latitude);
      paper.dataset.lon = String(longitude);
      paper.style.setProperty('--lon', `${longitude}deg`);
      paper.style.setProperty('--neg-lat', `${-latitude}deg`);
    }
    if (visible.length) {
      selectPaper(selected && !selected.hidden ? selected : visible[0]);
    } else {
      selected = null;
      previewed = null;
      detailPanels.detailLabel.textContent = wire.selectedLabel;
      detailPanels.selectedPosition.textContent = '00 / 00';
      detailPanels.selectedTitle.textContent = wire.emptyTitle;
      detailPanels.selectedDescription.textContent = wire.emptyDescription;
      detailPanels.selectedDate.textContent = '';
      detailPanels.selectedSource.textContent = '';
      detailPanels.previewNote.hidden = true;
      yaw = 0;
      pitch = 0;
      turn();
    }
    detailPanels.selectedRead.hidden = visible.length === 0;
  };

  const reset = (focus = false) => {
    stage.classList.remove('has-interacted');
    const firstVisible = papers.find((paper) => !paper.hidden);
    if (firstVisible) selectPaper(firstVisible);
    else {
      yaw = 0;
      pitch = 0;
      turn();
    }
    if (focus) stage.focus();
  };

  explore.querySelector<HTMLButtonElement>('.explore-reset')?.addEventListener('click', () => reset(true));
  listingRoot?.addEventListener(wire.eventEnter, () => {
    reset();
    sceneAnimation?.cancel();
    if (!prefersReducedMotion() && typeof stage.animate === 'function') {
      sceneAnimation = stage.animate([
        { transform: 'scale(.985)' }, { transform: 'none' },
      ], { duration: moduleSurface ? 380 : 350, easing: 'cubic-bezier(.16, 1, .3, 1)' });
      sceneAnimation.id = 'listing-explore-entry';
    }
  });
  listingRoot?.addEventListener(wire.eventFilter, () => arrange());
  listingRoot?.addEventListener(wire.eventJump, (event) => {
    const jump = String((event as CustomEvent<string>).detail);
    const paper = papers.find((item) => !item.hidden && item.dataset.exploreJump === jump);
    if (paper) {
      selectPaper(paper);
      revealDetail();
    }
  });

  for (const paper of papers) {
    const button = paper.querySelector<HTMLButtonElement>('.paper-select');
    if (!button) continue;
    paper.addEventListener('pointerenter', () => {
      if (!canPreviewPaperOnHover({
        fineHover,
        dragging: Boolean(drag),
        paper,
        selectedPaper: selected,
        selectedRead: detailPanels.selectedRead,
      })) return;
      previewed = paper;
      renderDetail(paper, true);
    });
    paper.addEventListener('pointerleave', () => {
      if (previewed !== paper) return;
      previewed = null;
      if (selected) renderDetail(selected);
    });
    button.addEventListener('focus', () => selectPaper(paper));
    button.addEventListener('click', (event) => {
      if (!suppressClick) {
        stage.classList.add('has-interacted');
        selectPaper(paper, event.detail === 0);
        if (event.detail > 0) revealDetail();
      }
    });
  }

  stage.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || (event.target as Element).closest('.explore-reset')) return;
    stage.classList.add('has-interacted');
    sceneAnimation?.cancel();
    stopInertia();
    if (previewed && selected) {
      previewed = null;
      renderDetail(selected);
    }
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      yaw,
      pitch,
      moved: false,
      lastTime: event.timeStamp,
      velocityYaw: 0,
      velocityPitch: 0,
    };
  });

  window.addEventListener('pointermove', (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      stage.setPointerCapture(event.pointerId);
      stage.classList.add('is-dragging');
    }
    const previousYaw = yaw;
    const previousPitch = pitch;
    yaw = drag.yaw + dx * 0.38;
    pitch = Math.max(-78, Math.min(78, drag.pitch - dy * 0.3));
    const elapsed = Math.max(8, event.timeStamp - drag.lastTime);
    drag.velocityYaw = Math.max(-0.28, Math.min(0.28, (yaw - previousYaw) / elapsed));
    drag.velocityPitch = Math.max(-0.28, Math.min(0.28, (pitch - previousPitch) / elapsed));
    drag.lastTime = event.timeStamp;
    turn();
  });

  const endDrag = (event: PointerEvent) => {
    if (!drag || drag.id !== event.pointerId) return;
    const completed = drag;
    if (drag.moved) {
      suppressClick = true;
      window.setTimeout(() => {
        suppressClick = false;
      }, 100);
    }
    drag = null;
    if (shouldCoastAfterDrag(completed, event)) {
      startExploreDragCoast({
        completed,
        turn,
        readAngles: () => ({ yaw, pitch }),
        writeAngles: (nextYaw, nextPitch) => {
          yaw = nextYaw;
          pitch = nextPitch;
        },
        stopInertia,
        setInertiaFrame: (id) => { inertiaFrame = id; },
      });
    } else stage.classList.remove('is-dragging');
  };

  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  const cancelMotion = () => {
      stopInertia();
      detailTitleMotion.animation?.cancel();
      sceneAnimation?.cancel();
  };
  const stopObservingMotion = observeReducedMotion(() => {
    if (prefersReducedMotion()) cancelMotion();
  });
  const syncVisibility = () => { if (document.hidden) cancelMotion(); };
  document.addEventListener('visibilitychange', syncVisibility);
  const visibilityObserver = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) cancelMotion(); }) : null;
  visibilityObserver?.observe(stage);
  window.addEventListener('pagehide', (event) => {
    cancelMotion();
    if (!event.persisted) {
      visibilityObserver?.disconnect();
      stopObservingMotion();
      document.removeEventListener('visibilitychange', syncVisibility);
    }
  });

  stage.addEventListener('keydown', (event) => {
    handleExploreStageKeydown(event, {
      stage,
      papers,
      getSelected: () => selected,
      selectPaper,
      adjustPitch: (delta) => {
        pitch = Math.max(-78, Math.min(78, pitch + delta));
        turn();
      },
      focusRead: () => { detailPanels.selectedRead.focus(); },
    });
  });

  if (CSS.supports('transform-style', 'preserve-3d')) {
    globe.classList.add('is-ready');
    stage.classList.add('is-ready');
  }
  arrange();
}
