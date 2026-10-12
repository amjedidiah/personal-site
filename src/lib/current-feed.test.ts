import { describe, expect, test } from 'bun:test';
import { parseAvailabilityIssue, parseLatestIssue } from './current-feed';
import { current } from '../data/current';

describe('current GitHub feed', () => {
  test('uses issue state for availability', () => {
    expect(parseAvailabilityIssue({ state: 'open', body: 'Payments and AI.\n\nInstructions.' })).toEqual({
      available: true,
      label: 'Open to project conversations',
      detail: 'Payments and AI.',
    });
    expect(parseAvailabilityIssue({ state: 'closed', body: 'Old open-state detail.' })?.available).toBe(false);
  });

  test('treats missing availability as unpublished', () => {
    expect(parseAvailabilityIssue(null)).toBeNull();
    expect(parseAvailabilityIssue({ state: 'unknown' })).toBeNull();
  });

  test('uses the curated fallback only when the open issue has no published detail', () => {
    expect(parseAvailabilityIssue({ state: 'open', body: '' })?.detail).toBe(current.availabilityDetail);
    expect(parseAvailabilityIssue({ state: 'open', body: 'Payment projects only.' })?.detail).toBe('Payment projects only.');
    expect(parseAvailabilityIssue({ state: 'closed', body: '' })?.detail).toBe('You can still get in touch about future work.');
  });

  test('uses the latest issue title, first paragraph, and edit time', () => {
    expect(parseLatestIssue({
      title: 'Gwela: faster joins',
      body: 'Reduced round trips.\n\nEditorial instructions.',
      updated_at: '2026-10-07T22:25:50Z',
    })).toEqual({
      title: 'Gwela: faster joins',
      detail: 'Reduced round trips.',
      updatedAt: '2026-10-07T22:25:50Z',
      href: 'https://github.com/amjedidiah/personal-site/issues/2',
    });
    expect(parseLatestIssue({ title: '', updated_at: '2026-10-07T22:25:50Z' })).toBeNull();
    expect(parseLatestIssue({ title: 'Update', updated_at: null })).toBeNull();
  });
});
