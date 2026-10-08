import { describe, expect, test } from 'bun:test';
import {
  THEME_STORAGE_KEY,
  isThemePreference,
  readThemePreference,
  resolveTheme,
  writeThemePreference,
} from './theme';

describe('theme preference', () => {
  test('accepts only supported preferences', () => {
    expect(isThemePreference('system')).toBe(true);
    expect(isThemePreference('light')).toBe(true);
    expect(isThemePreference('dark')).toBe(true);
    expect(isThemePreference('sepia')).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });

  test('resolves System from the operating system preference', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });

  test('falls back to System for invalid or unavailable storage', () => {
    const storage = {
      getItem: () => 'sepia',
    };
    const unavailableStorage = {
      getItem: () => {
        throw new Error('storage unavailable');
      },
    };

    expect(readThemePreference(storage)).toBe('system');
    expect(readThemePreference(unavailableStorage)).toBe('system');
    expect(readThemePreference(null)).toBe('system');
  });

  test('persists explicit choices and removes the override for System', () => {
    const values = new Map<string, string>();
    const storage = {
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };

    writeThemePreference(storage, 'dark');
    expect(values.get(THEME_STORAGE_KEY)).toBe('dark');
    expect(readThemePreference({ getItem: (key) => values.get(key) ?? null })).toBe('dark');

    writeThemePreference(storage, 'system');
    expect(values.has(THEME_STORAGE_KEY)).toBe(false);
  });
});
