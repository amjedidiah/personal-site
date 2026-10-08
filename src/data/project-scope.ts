type ProjectScope = {
  platforms: readonly ('web' | 'mobile')[];
  mobileDelivery?: 'native' | 'pwa';
  disciplines: readonly ('front-end' | 'back-end')[];
};

export function formatProjectScope(project: ProjectScope) {
  const platforms = project.platforms.map((platform) => {
    if (platform === 'web') return 'web';
    return project.mobileDelivery === 'pwa' ? 'mobile PWA' : 'mobile app';
  });

  return [...platforms, ...project.disciplines].join(' · ');
}
