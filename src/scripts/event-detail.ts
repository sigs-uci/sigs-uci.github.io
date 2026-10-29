import { eventViewState, type EventFeatureRecord } from '../lib/events';
import { observeEventClock } from './event-clock';

document.querySelectorAll<HTMLElement>('[data-event-detail-clock]').forEach(root => {
  const event = JSON.parse(root.dataset.eventDetailClock!) as EventFeatureRecord;
  const messages = JSON.parse(root.dataset.clockMessages!) as { past: string; heading: string; registration: string };
  const update = (now: Date) => {
    const state = eventViewState(event, now);
    if (!state.past) return;
    root.dataset.dateState = 'past';
    root.querySelector<HTMLElement>('[data-event-logistics-title]')!.textContent = messages.heading;
    if (!['cancelled', 'postponed'].includes(event.eventState)) {
      root.querySelector<HTMLElement>('[data-event-state]')!.textContent = messages.past;
      root.querySelector<HTMLElement>('[data-event-participation]')!.textContent = messages.registration;
    }
    root.querySelectorAll<HTMLAnchorElement>('[data-event-registration]').forEach(link => {
      link.hidden = true;
      link.removeAttribute('href');
      link.setAttribute('aria-disabled', 'true');
    });
    root.querySelectorAll<HTMLElement>('[data-live-registration]').forEach(group => { group.hidden = true; });
  };
  root.addEventListener('click', click => {
    const target = click.target;
    if (target instanceof Element && target.closest('[data-event-registration]') && eventViewState(event).past) {
      click.preventDefault();
      update(new Date());
    }
  });
  observeEventClock([event], update);
});
