type GalleryOpener = (link: HTMLAnchorElement) => void;

export function setupGalleryLinks(root: HTMLElement,
  loader: () => Promise<GalleryOpener> = () => import('./gallery').then(module => module.setupGallery(root)),
  navigate: (url: string) => void = url => window.location.assign(url)) {
  let ready: Promise<GalleryOpener> | undefined;
  const load = () => ready ??= loader().catch(error => { ready = undefined; throw error; });
  const preload = () => { void load().catch(() => {}); };
  root.addEventListener('pointerenter', preload, { once: true });
  root.addEventListener('focusin', preload, { once: true });
  root.addEventListener('click', async event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('[data-gallery-item]');
    if (!link || !root.contains(link)) return;
    event.preventDefault();
    try { (await load())(link); }
    catch { navigate(link.href); }
  });
}
