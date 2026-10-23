export const site = {
  name: 'Society of Iranian Graduate Students',
  origin: 'https://sigs-uci.github.io',
  email: 'sigs@uci.edu',
  timezone: 'America/Los_Angeles',
  persianApproved: false,
};
export const locales = site.persianApproved ? ['en', 'fa'] as const : ['en'] as const;
export type Locale = 'en' | 'fa';
export const href = (locale: Locale, path = '') => `/${locale}/${path ? path.replace(/^\/+|\/+$/g, '') + '/' : ''}`;
export const emailLink = (subject: string) => `mailto:${site.email}?subject=${encodeURIComponent(subject)}`;
