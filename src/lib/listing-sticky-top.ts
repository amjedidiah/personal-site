export function setListingYearStickyTop(
  listingRoot: HTMLElement,
  header: HTMLElement,
  mobile: boolean,
) {
  const headerTop = Number.parseFloat(getComputedStyle(header).top) || 0;
  const stickyTop = headerTop + header.offsetHeight + (mobile ? 0 : 8);
  const value = `${stickyTop}px`;
  if (listingRoot.style.getPropertyValue('--year-sticky-top') !== value) {
    listingRoot.style.setProperty('--year-sticky-top', value);
  }
  return stickyTop;
}
