import { languageSwitchHref } from '../lib/language';

document.querySelectorAll<HTMLAnchorElement>('[data-language-switch]').forEach(link => {
  const destination = link.href;
  const sync = () => { link.href = languageSwitchHref(destination, new URL(location.href)); };
  sync();
  for (const event of ['pointerenter', 'focus', 'click', 'contextmenu']) link.addEventListener(event, sync);
  window.addEventListener('popstate', sync);
});
