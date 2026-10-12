import { describe, expect, test } from 'bun:test';
import { MOTION_STORAGE_KEY, readMotionPreference, writeMotionPreference } from './motion';

describe('homepage motion preference', () => {
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
