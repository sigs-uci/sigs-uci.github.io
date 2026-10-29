import { featuredEvent, hasEnded, type EventFeatureRecord } from '../lib/events';
import { observeEventClock } from './event-clock';

document.querySelectorAll<HTMLElement>('[data-home-event-feature]').forEach(root => {
  const records = JSON.parse(root.dataset.candidates!) as EventFeatureRecord[];
  const content = root.querySelector<HTMLElement>('[data-feature-content]')!;
  const templates = Array.from(root.querySelectorAll<HTMLTemplateElement>('[data-feature-template]'));
  observeEventClock(records, now => {
    const feature = featuredEvent(records, now);
    const id = feature?.id ?? '';
    if (content.dataset.featuredEvent !== id) {
      const template = id ? templates.find(item => item.dataset.featureTemplate === id)
        : root.querySelector<HTMLTemplateElement>('[data-feature-empty]');
      if (!template) return;
      content.replaceChildren(template.content.cloneNode(true));
      content.dataset.featuredEvent = id;
    }
    const heading = content.querySelector<HTMLElement>('[data-feature-heading]')!;
    heading.id = 'next-title';
    const past = feature ? hasEnded(feature, now) : false;
    heading.textContent = past ? root.dataset.latestTitle! : root.dataset.nextTitle!;
    const pastNote = content.querySelector<HTMLElement>('[data-feature-past]');
    if (pastNote) pastNote.hidden = !past;
    content.classList.toggle('gathering-next-featured', Boolean(feature));
    content.classList.toggle('gathering-next-with-poster', Boolean(content.querySelector('.gathering-event-poster')));
  });
});
