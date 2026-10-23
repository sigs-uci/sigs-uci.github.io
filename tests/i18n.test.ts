import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { locales } from '../src/config/site';
import { data, events, eventTranslations, type EventTranslation, type EventState, type RegistrationState, validatePublicData } from '../src/data';
import { dictionaries, formatDay, formatNumber, formatTerm, tr } from '../src/i18n/ui';
import { isPublicEvent, registrationAction } from '../src/lib/events';
import { availableLocales, eventHref, eventTextRevision, reviewedTranslation } from '../src/lib/publication';
import { pages } from '../src/lib/routes';
import { eventFixture } from './fixtures/events';

const persianText = /[\u0621-\u063a\u0641-\u064a\u067e\u0686\u0698\u06a9\u06af\u06cc]/u;

test('every current public event has a complete Persian counterpart of its current English text', () => {
  assert.deepEqual([...locales], ['en', 'fa']);
  const publicEvents = events.filter(isPublicEvent);
  assert.equal(eventTranslations.length, publicEvents.length);
  assert.equal(new Set(eventTranslations.map(record => record.eventId)).size, publicEvents.length);
  for (const event of publicEvents) {
    const translation = reviewedTranslation(event.id)!;
    assert.ok(translation, event.id);
    assert.equal(translation.sourceRevision, eventTextRevision(event), event.id);
    assert.match(translation.title, persianText, event.id);
    assert.match(translation.summary, persianText, event.id);
    assert.equal(event.editorial.fa, 'reviewed', event.id);
    assert.deepEqual(availableLocales(`events/${event.slug}`), ['en', 'fa']);
    assert.equal(eventHref(event, 'fa'), `/fa/events/${event.slug}/`);
    assert.equal(eventHref(event, 'en'), `/en/events/${event.slug}/`);
    assert.deepEqual(Object.keys(translation).sort(), ['eventId', 'locale', 'title', 'summary', 'body', 'status', 'sourceRevision', 'reviewedOn'].sort());
  }
});

test('translation records cannot fork shared logistics or publish blank text under another locale', () => {
  const examples: Partial<EventTranslation>[] = [{ title: ' ' }, { summary: '' }, { body: [' '] }, { locale: 'en' as EventTranslation['locale'] }];
  for (const change of examples) {
    const copy = structuredClone(data);
    Object.assign(copy.eventTranslations[0], change);
    assert.ok(validatePublicData(copy).some(error => error.startsWith('eventTranslations.')), JSON.stringify(change));
    assert.equal(reviewedTranslation(copy.eventTranslations[0].eventId, copy.eventTranslations, copy.events), undefined);
  }
  const copy = structuredClone(data);
  Object.assign(copy.eventTranslations[0], { venue: 'A divergent translated venue', date: { value: '2027-01-01' } });
  assert.ok(validatePublicData(copy).some(error => error.includes('event facts belong to the shared record')));
});

test('the Persian dictionary covers the current data-driven public interface', () => {
  const visible = [
    ...pages.flatMap(page => [page.title, page.description]),
    data.organization.description,
    ...data.organization.historicalAcknowledgments.flatMap(item => item.names),
    ...data.programs.flatMap(program => [program.name, program.summary, program.period]),
    ...data.programDetails.flatMap(program => [program.title, program.intro, program.periodLabel,
      ...program.sections.flatMap(section => [section.title, ...section.paragraphs]),
      ...program.relatedPaths.map(link => link.label), ...program.publicContextLinks.map(link => link.label)]),
    ...data.resources.flatMap(resource => [resource.title, resource.description, resource.source, resource.ownerRole]),
    ...data.milestones.flatMap(milestone => [milestone.title, milestone.summary, `Event records for ${milestone.year}`]),
    ...data.boardTerms.flatMap(term => term.people.flatMap(person => [person.role, person.bio])),
    ...events.flatMap(event => [event.venue, event.timeDisplay, event.cost, event.audience, event.accessibility]),
    ...data.media.map(item => item.credit),
  ].filter((value): value is string => Boolean(value));
  const missing = [...new Set(visible)].filter(text => !dictionaries.fa[text]?.trim());
  assert.equal(missing.length, 0, `Missing Persian public text: ${missing.join('\n')}`);
});

test('literal interface messages cannot silently fall back to English on Persian pages', async () => {
  const root = new URL('../src/', import.meta.url);
  const files: string[] = [];
  for (const directory of ['components', 'layouts', 'pages']) {
    const dir = new URL(`${directory}/`, root);
    for (const name of await readdir(dir, { recursive: true })) if (name.endsWith('.astro')) files.push(path.join(fileURLToPath(dir), name));
  }
  const missing = new Set<string>();
  const messages = (node: ts.Expression): string[] => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return [node.text];
    if (ts.isParenthesizedExpression(node)) return messages(node.expression);
    if (ts.isConditionalExpression(node)) return [...messages(node.whenTrue), ...messages(node.whenFalse)];
    if (ts.isBinaryExpression(node) && [ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.BarBarToken].includes(node.operatorToken.kind)) return [...messages(node.left), ...messages(node.right)];
    return [];
  };
  for (const filename of files) {
    const source = await readFile(filename, 'utf8');
    for (const match of source.matchAll(/\bt\(/g)) {
      const parsed = ts.createSourceFile('message.tsx', `const value = ${source.slice(match.index)};`, ts.ScriptTarget.Latest, false, ts.ScriptKind.TSX);
      const value = (parsed.statements[0] as ts.VariableStatement).declarationList.declarations[0].initializer;
      if (value && ts.isCallExpression(value)) for (const message of value.arguments.flatMap(argument => messages(argument))) {
        if (!dictionaries.fa[message]?.trim()) missing.add(message);
      }
    }
  }
  assert.equal(missing.size, 0, `Missing Persian interface text: ${[...missing].join('\n')}`);
});

test('future participation and lifecycle states have Persian labels before an officer publishes them', () => {
  const states: EventState[] = ['tentative', 'scheduled', 'postponed', 'rescheduled', 'cancelled', 'completed'];
  const registrations: RegistrationState[] = ['not_required', 'not_open', 'open', 'full', 'waitlist', 'closed'];
  const messages = new Set<string>(states);
  for (const eventState of states) for (const registration of registrations) {
    const event = eventFixture({ eventState, registration, registrationUrl: ['open', 'waitlist'].includes(registration) ? 'https://example.com/rsvp' : null });
    messages.add(registrationAction(event).label);
  }
  const missing = [...messages].filter(message => !dictionaries.fa[message]?.trim());
  assert.equal(missing.length, 0, `Missing Persian participation labels: ${missing.join('\n')}`);
});

test('event role display labels are translated rather than only the stored role codes', async () => {
  const source = await readFile(new URL('../src/components/EventDetail.astro', import.meta.url), 'utf8');
  const frontmatter = source.split('---')[1];
  const parsed = ts.createSourceFile('event-detail.ts', frontmatter, ts.ScriptTarget.Latest);
  const labels = new Map<string, string>();
  for (const statement of parsed.statements) if (ts.isVariableStatement(statement)) {
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== 'roleLabels'
        || !declaration.initializer || !ts.isObjectLiteralExpression(declaration.initializer)) continue;
      for (const property of declaration.initializer.properties) {
        if (ts.isPropertyAssignment(property) && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) && ts.isStringLiteral(property.initializer)) labels.set(property.name.text, property.initializer.text);
      }
    }
  }
  assert.ok(labels.size > 0, 'The event detail role display map must be checked');
  for (const event of events.filter(isPublicEvent)) assert.ok(labels.has(event.sigsRole), event.sigsRole);
  for (const label of labels.values()) assert.match(tr('fa', label), persianText, label);
});

test('a missing Persian interface message fails before it can become an English public fallback', () => {
  const message = 'An untranslated isolated interface fixture';
  assert.equal(tr('en', message), message);
  assert.throws(() => tr('fa', message), /Missing Persian interface text/);
  assert.equal(tr('fa', 'برنامهٔ SIGS'), 'برنامهٔ SIGS');
});

test('published media has Persian alternatives and captions while names and contact links remain shared', () => {
  for (const item of data.media.filter(item => item.publication === 'published' && item.rights === 'approved')) {
    assert.match(item.alt.fa ?? '', persianText, `${item.id}: alternative text`);
    assert.match(item.caption.fa ?? '', persianText, `${item.id}: caption`);
  }
  assert.match(tr('fa', 'Events'), persianText);
  assert.equal(formatNumber('fa', 2026), '۲۰۲۶');
  assert.equal(formatTerm('fa', '2026-2027'), '۲۰۲۶-۲۰۲۷');
  assert.ok(tr('fa', 'The 2026-2027 team').includes('\u2066۲۰۲۶-۲۰۲۷\u2069'));
  assert.match(formatDay('fa', '2026-10-22'), /۲۰۲۶/);
  assert.equal(formatDay('fa', '2026-10-22').includes('۱۴۰۵'), false);
});
