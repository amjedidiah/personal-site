import { describe, expect, test } from 'bun:test';
import { MOTION_STORAGE_KEY, readMotionPreference, supportsMotionPreference, writeMotionPreference } from './motion';

describe('site motion preference', () => {
  test('includes articles and project details while keeping other routes outside the motion treatment', () => {
    for (const route of ['/', '/about', '/projects', '/blog', '/blog/', '/blog/hello-world', '/blog/hello-world/', '/projects/gwela', '/projects/gwela/']) expect(supportsMotionPreference(route)).toBe(true);
    for (const route of ['/blog/a/b', '/projects/a/b', '/feedback', '/feedback/gwela']) expect(supportsMotionPreference(route)).toBe(false);
  });
  test('follows the system when storage is missing, invalid, or blocked', () => {
    expect(readMotionPreference(null)).toBe('system');
    expect(readMotionPreference({ getItem: () => 'full' })).toBe('system');
    expect(readMotionPreference({ getItem: () => { throw new Error('blocked'); } })).toBe('system');
  });

  test('remembers reduced motion and removes the override when following the system', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
    } as Storage;
    writeMotionPreference(storage, 'reduce');
    expect(readMotionPreference(storage)).toBe('reduce');
    writeMotionPreference(storage, 'system');
    expect(values.has(MOTION_STORAGE_KEY)).toBe(false);
    expect(readMotionPreference(storage)).toBe('system');
  });

  test('blocked writes do not prevent using the preference in the current page', () => {
    const blocked = {
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    } as unknown as Storage;
    expect(() => writeMotionPreference(blocked, 'reduce')).not.toThrow();
    expect(() => writeMotionPreference(blocked, 'system')).not.toThrow();
  });
});
