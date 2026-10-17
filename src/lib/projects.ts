import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n/config';

export type LocalizedProject = CollectionEntry<'projects'> & {
  /** The entry whose Markdown body renders for this locale. */
  content: CollectionEntry<'projects'> | CollectionEntry<'projectsFr'>;
  /** False when the locale has no translation yet and the English record is shown. */
  translated: boolean;
};

/**
 * Projects with their translatable fields and body in the requested locale.
 * Missing translations fall back to English so a new case study never
 * disappears from the French site.
 */
export async function getProjects(locale: Locale): Promise<LocalizedProject[]> {
  const projects = await getCollection('projects');
  if (locale === 'en') return projects.map((project) => ({ ...project, content: project, translated: true }));

  const translations = new Map((await getCollection('projectsFr')).map((entry) => [entry.id, entry]));
  return projects.map((project) => {
    const translation = translations.get(project.id);
    if (!translation) return { ...project, content: project, translated: false };
    const { reviewed: _reviewed, ...fields } = translation.data;
    const defined = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));
    return { ...project, data: { ...project.data, ...defined }, content: translation, translated: true };
  });
}

/** Static paths for /projects/[id] in one locale, with neighbours in display order. */
export async function getProjectPaths(locale: Locale) {
  const projects = (await getProjects(locale)).sort((a, b) => a.data.order - b.data.order);
  return projects.map((project, index) => ({
    params: { id: project.id },
    props: {
      project,
      previousProject: projects[index - 1] ?? null,
      nextProject: projects[index + 1] ?? null,
    },
  }));
}
