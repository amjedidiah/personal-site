import type { Locale } from '../i18n/config';
import { useTranslations } from '../i18n/ui';

type ProjectScope = {
  platforms: readonly ('web' | 'mobile')[];
  mobileDelivery?: 'native' | 'pwa';
  disciplines: readonly ('front-end' | 'back-end')[];
};

export function formatProjectScope(project: ProjectScope, locale: Locale = 'en') {
  const labels = useTranslations(locale).projectScope;
  const platforms = project.platforms.map((platform) => {
    if (platform === 'web') return labels.web;
    return project.mobileDelivery === 'pwa' ? labels.mobilePwa : labels.mobileApp;
  });

  return [...platforms, ...project.disciplines.map((discipline) => labels[discipline])].join(' · ');
}
