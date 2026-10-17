import { describe, expect, test } from 'bun:test';
import { localeFromPath, localePath, stripLocale, toLocale } from './config';

describe('localeFromPath', () => {
  test('reads the prefix, defaulting to English', () => {
    expect(localeFromPath('/fr')).toBe('fr');
    expect(localeFromPath('/fr/projects/gwela')).toBe('fr');
    expect(localeFromPath('/projects')).toBe('en');
    expect(localeFromPath('/')).toBe('en');
  });

  test('does not mistake paths that only start with the letters', () => {
    expect(localeFromPath('/free-tribe-network')).toBe('en');
    expect(localeFromPath('/projects/fr')).toBe('en');
  });
});

describe('stripLocale', () => {
  test('removes the prefix and keeps the rest', () => {
    expect(stripLocale('/fr')).toBe('/');
    expect(stripLocale('/fr/')).toBe('/');
    expect(stripLocale('/fr/about#contact')).toBe('/about#contact');
    expect(stripLocale('/about')).toBe('/about');
  });
});

describe('localePath', () => {
  test('prefixes French and leaves English unprefixed', () => {
    expect(localePath('fr', '/')).toBe('/fr');
    expect(localePath('fr', '/projects/gwela')).toBe('/fr/projects/gwela');
    expect(localePath('en', '/projects')).toBe('/projects');
  });

  test('switches between locales without stacking prefixes', () => {
    expect(localePath('fr', '/fr/blog')).toBe('/fr/blog');
    expect(localePath('en', '/fr/blog?category=ai')).toBe('/blog?category=ai');
  });
});

describe('toLocale', () => {
  test('falls back to English for unknown values', () => {
    expect(toLocale('fr')).toBe('fr');
    expect(toLocale('de')).toBe('en');
    expect(toLocale(undefined)).toBe('en');
  });
});
