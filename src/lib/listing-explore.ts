export type ListingExploreWire = {
  listingRoot: string;
  eventEnter: string;
  eventFilter: string;
  eventJump: string;
  eventSelectJump: string;
  itemNoun: string;
  readLabel: string;
  fallbackHref: string;
  emptyTitle: string;
  emptyDescription: string;
  previewNote: string;
};

export function initListingExplore(explore: HTMLElement, wire: ListingExploreWire) {
  const listingRoot = document.querySelector<HTMLElement>(wire.listingRoot);
  const stage = explore.querySelector<HTMLElement>('.globe-stage');
  const axis = explore.querySelector<HTMLElement>('.globe-axis');
  const globe = explore.querySelector<HTMLElement>('.paper-globe');
  const detail = explore.querySelector<HTMLElement>('.selected-paper');
  if (!stage || !axis || !globe || !detail) return;

  const papers = Array.from(explore.querySelectorAll<HTMLElement>('.paper'));
  const selectedTitle = detail.querySelector<HTMLElement>('[data-selected-title]');
  const selectedDescription = detail.querySelector<HTMLElement>('[data-selected-description]');
  const selectedDate = detail.querySelector<HTMLElement>('[data-selected-date]');
  const selectedSource = detail.querySelector<HTMLElement>('[data-selected-source]');
  const selectedPosition = detail.querySelector<HTMLElement>('[data-paper-position]');
  const detailLabel = detail.querySelector<HTMLElement>('[data-detail-label]');
  const selectedRead = detail.querySelector<HTMLAnchorElement>('[data-selected-read]');
  const previewNote = detail.querySelector<HTMLElement>('[data-preview-note]');
  if (
    !selectedTitle
    || !selectedDescription
    || !selectedDate
    || !selectedSource
    || !selectedPosition
    || !detailLabel
    || !selectedRead
    || !previewNote
  ) {
    return;
  }

  const mobile = window.matchMedia('(max-width: 760px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
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
  let detailAnimation: Animation | undefined;
  let detailTitle = selectedTitle.textContent;

  const stopInertia = () => {
    if (inertiaFrame) window.cancelAnimationFrame(inertiaFrame);
    inertiaFrame = 0;
    if (!drag) stage.classList.remove('is-dragging');
  };

  const updateDepth = () => {
    const toRadians = Math.PI / 180;
    const rotation = pitch * toRadians;
    papers.forEach((paper) => {
      if (paper.hidden) return;
      const latitude = Number(paper.dataset.lat ?? 0) * toRadians;
      const longitude = (Number(paper.dataset.lon ?? 0) + yaw) * toRadians;
      const facing = Math.sin(rotation) * Math.sin(latitude)
        + Math.cos(rotation) * Math.cos(latitude) * Math.cos(longitude);
      const depth = Math.max(0, Math.min(1, (facing - 0.08) / 0.92));
      paper.style.setProperty('--depth-alpha', String(paper === selected ? 1 : 0.3 + 0.7 * depth));
      paper.style.pointerEvents = paper === selected || facing > 0.12 ? 'auto' : 'none';
    });
  };

  const turn = () => {
    axis.style.setProperty('--pitch', `${pitch}deg`);
    globe.style.setProperty('--yaw', `${yaw}deg`);
    updateDepth();
  };

  const renderDetail = (paper: HTMLElement, preview = false) => {
    const nextTitle = paper.dataset.title ?? '';
    if (nextTitle !== detailTitle) {
      detailAnimation?.cancel();
      if (!reduceMotion.matches) {
        detailAnimation = detail.querySelector('.selected-content')?.animate(
          [{ opacity: 0.55 }, { opacity: 1 }],
          { duration: 160, easing: 'ease-out' },
        );
      }
      detailTitle = nextTitle;
    }
    const visible = papers.filter((item) => !item.hidden);
    detailLabel.textContent = preview ? `Preview ${wire.itemNoun}` : `Selected ${wire.itemNoun}`;
    selectedPosition.textContent = `${String(visible.indexOf(paper) + 1).padStart(2, '0')} / ${String(visible.length).padStart(2, '0')}`;
    selectedTitle.textContent = paper.dataset.title ?? '';
    selectedDescription.textContent = paper.dataset.description ?? '';
    selectedDate.textContent = paper.dataset.exploreMetaA ?? '';
    selectedSource.textContent = paper.dataset.exploreMetaB ?? '';
    selectedRead.href = paper.dataset.href ?? wire.fallbackHref;
    const readTarget = paper.dataset.title ?? wire.itemNoun;
    const external = paper.dataset.external === 'true';
    selectedRead.setAttribute(
      'aria-label',
      `${wire.readLabel} ${readTarget}${external ? ' (opens in a new tab)' : ''}`,
    );
    if (external) {
      selectedRead.target = '_blank';
      selectedRead.rel = 'noopener noreferrer';
    } else {
      selectedRead.removeAttribute('target');
      selectedRead.removeAttribute('rel');
    }
    selectedRead.hidden = preview;
    previewNote.hidden = !preview;
  };

  const selectPaper = (paper: HTMLElement, focusRead = false) => {
    if (paper.hidden) return;
    stopInertia();
    previewed = null;
    selected = paper;
    papers.forEach((item) => {
      const active = item === paper;
      item.classList.toggle('is-selected', active);
      item.querySelector<HTMLButtonElement>('.paper-select')?.setAttribute('aria-pressed', String(active));
    });
    renderDetail(paper);
    pitch = Number(paper.dataset.lat ?? 0);
    yaw = -Number(paper.dataset.lon ?? 0);
    turn();
    listingRoot?.dispatchEvent(new CustomEvent(wire.eventSelectJump, { detail: paper.dataset.exploreJump ?? '' }));
    if (focusRead) selectedRead.focus();
  };

  const revealDetail = () => {
    if (mobile.matches) {
      detail.scrollIntoView({ block: 'center', behavior: reduceMotion.matches ? 'instant' : 'smooth' });
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
    visible.forEach((paper, index) => {
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
    });
    if (visible.length) {
      selectPaper(selected && !selected.hidden ? selected : visible[0]);
    } else {
      selected = null;
      previewed = null;
      detailLabel.textContent = `Selected ${wire.itemNoun}`;
      selectedPosition.textContent = '00 / 00';
      selectedTitle.textContent = wire.emptyTitle;
      selectedDescription.textContent = wire.emptyDescription;
      selectedDate.textContent = '';
      selectedSource.textContent = '';
      previewNote.hidden = true;
      yaw = 0;
      pitch = 0;
      turn();
    }
    selectedRead.hidden = visible.length === 0;
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
  listingRoot?.addEventListener(wire.eventEnter, () => reset());
  listingRoot?.addEventListener(wire.eventFilter, () => arrange());
  listingRoot?.addEventListener(wire.eventJump, (event) => {
    const jump = String((event as CustomEvent<string>).detail);
    const paper = papers.find((item) => !item.hidden && item.dataset.exploreJump === jump);
    if (paper) {
      selectPaper(paper);
      revealDetail();
    }
  });

  papers.forEach((paper) => {
    const button = paper.querySelector<HTMLButtonElement>('.paper-select');
    if (!button) return;
    paper.addEventListener('pointerenter', () => {
      if (!fineHover.matches || drag || paper.hidden || paper === selected || document.activeElement === selectedRead) return;
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
  });

  stage.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || (event.target as Element).closest('.explore-reset')) return;
    stage.classList.add('has-interacted');
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
    if (
      completed.moved
      && event.type === 'pointerup'
      && event.timeStamp - completed.lastTime < 90
      && !reduceMotion.matches
      && Math.abs(completed.velocityYaw) + Math.abs(completed.velocityPitch) > 0.025
    ) {
      let velocityYaw = completed.velocityYaw;
      let velocityPitch = completed.velocityPitch;
      let previousTime = 0;
      const coast = (time: number) => {
        const elapsed = Math.min(32, time - (previousTime || time - 16));
        previousTime = time;
        yaw += velocityYaw * elapsed;
        pitch = Math.max(-78, Math.min(78, pitch + velocityPitch * elapsed));
        turn();
        const decay = Math.pow(0.86, elapsed / 16);
        velocityYaw *= decay;
        velocityPitch *= decay;
        if (Math.abs(velocityYaw) + Math.abs(velocityPitch) < 0.012) stopInertia();
        else inertiaFrame = window.requestAnimationFrame(coast);
      };
      inertiaFrame = window.requestAnimationFrame(coast);
    } else stage.classList.remove('is-dragging');
  };

  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  reduceMotion.addEventListener('change', () => {
    if (reduceMotion.matches) {
      stopInertia();
      detailAnimation?.cancel();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopInertia();
  });

  stage.addEventListener('keydown', (event) => {
    if (event.target !== stage) return;
    const step = event.shiftKey ? 30 : 12;
    const visible = papers.filter((paper) => !paper.hidden);
    const current = visible.indexOf(selected!);
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      if (visible.length) selectPaper(visible[(current + direction + visible.length) % visible.length]);
    } else if (event.key === 'Home' && visible.length) selectPaper(visible[0]);
    else if (event.key === 'End' && visible.length) selectPaper(visible[visible.length - 1]);
    else if (event.key === 'ArrowUp') {
      pitch = Math.min(78, pitch + step);
      turn();
    } else if (event.key === 'ArrowDown') {
      pitch = Math.max(-78, pitch - step);
      turn();
    } else if ((event.key === 'Enter' || event.key === ' ') && selected) {
      selectedRead.focus();
    } else return;
    stage.classList.add('has-interacted');
    event.preventDefault();
  });

  if (CSS.supports('transform-style', 'preserve-3d')) {
    globe.classList.add('is-ready');
    stage.classList.add('is-ready');
  }
  arrange();
}
