import { eventRefreshDelay, type EventSchedule } from '../lib/events';

export function observeEventClock(records: readonly EventSchedule[], update: (now: Date) => void): void {
  let timer: ReturnType<typeof setTimeout>;
  const refresh = () => {
    clearTimeout(timer);
    const now = new Date();
    update(now);
    timer = setTimeout(refresh, eventRefreshDelay(records, now));
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  window.addEventListener('pageshow', refresh);
  refresh();
}
