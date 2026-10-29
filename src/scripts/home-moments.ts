export function setupHomeMoments(root: HTMLElement) {
  const track = root.querySelector<HTMLElement>('[data-moments-track]')!;
  const moments = Array.from(track.querySelectorAll<HTMLElement>('[data-moment]'));
  if (!moments.length) return;
  const thumbnails = root.querySelector<HTMLElement>('[data-moments-thumbnails]')!;
  const links = Array.from(thumbnails.querySelectorAll<HTMLAnchorElement>('[data-moment-index]'));
  const previous = root.querySelector<HTMLButtonElement>('[data-moments-prev]')!;
  const next = root.querySelector<HTMLButtonElement>('[data-moments-next]')!;
  const count = root.querySelector<HTMLElement>('[data-moments-count]')!;
  const status = root.querySelector<HTMLElement>('[data-moments-status]')!;
  const number = new Intl.NumberFormat(document.documentElement.lang, { useGrouping: false });
  const rtl = document.documentElement.dir === 'rtl';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = 0;
  let firstVisible = 0;
  let scrollTimer: ReturnType<typeof setTimeout>;

  const update = (index: number, announce = false) => {
    active = index;
    const position = `${number.format(index + 1)} / ${number.format(moments.length)}`;
    count.textContent = position;
    previous.disabled = index === 0;
    next.disabled = index === moments.length - 1;
    links.forEach((link, i) => {
      if (i === index) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    const selected = links[index];
    const bounds = thumbnails.getBoundingClientRect();
    const box = selected.getBoundingClientRect();
    if (box.left < bounds.left || box.right > bounds.right) {
      thumbnails.scrollBy({ left: rtl ? box.right - bounds.right : box.left - bounds.left, behavior: 'instant' });
    }
    if (announce) status.textContent = `${position}. ${selected.getAttribute('aria-label')}`;
  };
  const goTo = (index: number) => {
    clearTimeout(scrollTimer);
    const target = Math.max(0, Math.min(index, moments.length - 1));
    firstVisible = target;
    const bounds = track.getBoundingClientRect();
    const box = moments[target].getBoundingClientRect();
    update(target, true);
    track.scrollBy({ left: rtl ? box.right - bounds.right : box.left - bounds.left, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  };
  const sync = () => {
    const bounds = track.getBoundingClientRect();
    const last = moments[moments.length - 1].getBoundingClientRect();
    const atEnd = rtl ? last.left >= bounds.left - 2 : last.right <= bounds.right + 2;
    const boxes = moments.map(moment => moment.getBoundingClientRect());
    const distances = boxes.map(box => {
      return Math.abs(rtl ? box.right - bounds.right : box.left - bounds.left);
    });
    const visible = boxes.flatMap((box, index) => Math.min(box.right, bounds.right) - Math.max(box.left, bounds.left) >= box.width * .5 ? [index] : []);
    firstVisible = visible[0] ?? distances.indexOf(Math.min(...distances));
    const lastVisible = visible.at(-1) ?? firstVisible;
    const selected = active >= firstVisible && active <= lastVisible ? active : firstVisible;
    const changed = selected !== active;
    update(selected);
    const position = `${number.format(firstVisible + 1)}${lastVisible > firstVisible ? `-${number.format(lastVisible + 1)}` : ''} / ${number.format(moments.length)}`;
    count.textContent = position;
    previous.disabled = firstVisible === 0;
    next.disabled = atEnd;
    if (changed) status.textContent = `${position}. ${links[selected].getAttribute('aria-label')}`;
  };
  previous.addEventListener('click', () => goTo(firstVisible - 1));
  next.addEventListener('click', () => goTo(firstVisible + 1));
  links.forEach((link, index) => link.addEventListener('click', event => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    goTo(index);
  }));
  track.addEventListener('keydown', event => {
    if (event.target !== track) return;
    const step = event.key === 'ArrowRight' ? (rtl ? -1 : 1) : event.key === 'ArrowLeft' ? (rtl ? 1 : -1) : 0;
    if (!step && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    goTo(event.key === 'Home' ? 0 : event.key === 'End' ? moments.length - 1 : firstVisible + step);
  });
  track.addEventListener('scroll', () => { clearTimeout(scrollTimer); scrollTimer = setTimeout(sync, 150); }, { passive: true });
  window.addEventListener('resize', sync);
  const videos = Array.from(track.querySelectorAll<HTMLVideoElement>('video'));
  const pauseAll = () => videos.forEach(video => video.pause());
  videos.forEach(video => video.addEventListener('play', () => {
    videos.filter(other => other !== video).forEach(other => other.pause());
    const index = moments.findIndex(moment => moment.contains(video));
    if (index >= 0) goTo(index);
  }));
  const visibility = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (!entry.isIntersecting) (entry.target as HTMLVideoElement).pause(); });
  }, { threshold: 0 });
  videos.forEach(video => visibility.observe(video));
  root.addEventListener('click', event => {
    if ((event.target as Element).closest('[data-gallery-item]')) pauseAll();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseAll(); });
  root.querySelector<HTMLElement>('[data-moments-controls]')!.hidden = false;
  update(0);
  sync();
}
