import { expect, test } from 'bun:test';
import { getReadingProgress } from './page-progress';

const articleBody = {
  bodyTop: 400,
  bodyBottom: 2400,
  viewportHeight: 800,
  topInset: 180,
  bottomInset: 64,
};

test('reading progress finishes at the article body before footer content', () => {
  // Body starts at 400 and ends at 2400; usable viewport is 180..736.
  expect(getReadingProgress({ ...articleBody, scrollTop: 220 })).toBe(0);
  expect(getReadingProgress({ ...articleBody, scrollTop: 942 })).toBe(.5);
  expect(getReadingProgress({ ...articleBody, scrollTop: 1664 })).toBe(1);
  expect(getReadingProgress({ ...articleBody, scrollTop: 3000 })).toBe(1);
});
test('short and zero-height bodies produce bounded progress', () => {
  expect(getReadingProgress({ scrollTop: 0, bodyTop: 400, bodyBottom: 600, viewportHeight: 800, topInset: 180, bottomInset: 0 })).toBe(1);
  expect(getReadingProgress({ scrollTop: 0, bodyTop: 1000, bodyBottom: 1000, viewportHeight: 800, topInset: 100, bottomInset: 0 })).toBe(0);
  expect(getReadingProgress({ scrollTop: 200, bodyTop: 1000, bodyBottom: 1000, viewportHeight: 800, topInset: 100, bottomInset: 0 })).toBe(1);
});
