import test from 'node:test';
import assert from 'node:assert/strict';
import { createSearchRunner, searchQueryVariants, searchWithVariants } from '../src/lib/search';

test('numeric search variants are equivalent and consistently ordered across keyboards', () => {
  const expected = ['2025', '۲۰۲۵', '٢٠٢٥'];
  for (const query of expected) assert.deepEqual(searchQueryVariants(query), expected);
  assert.deepEqual(searchQueryVariants(' HG۱۰۳۰ user12 '), ['hg1030 user12', 'hg۱۰۳۰ user۱۲', 'hg١٠٣٠ user١٢']);
  assert.deepEqual(searchQueryVariants('شب\u200cشعر'), ['شب شعر']);
  assert.deepEqual(searchQueryVariants('   '), []);
});

test('numeric search merges distinct pages once and retains a stable result order and excerpt', async () => {
  const rows: Record<string, { url: string; excerpt: string }[]> = {
    '2025': [{ url: '/fa/about/leadership/', excerpt: 'Latin contact handle' }, { url: '/fa/events/yalda-2025/', excerpt: 'First matching excerpt' }],
    '۲۰۲۵': [{ url: '/fa/events/yalda-2025/', excerpt: 'A duplicate excerpt' }, { url: '/fa/events/archive/2025/', excerpt: 'Persian year archive' }],
    '٢٠٢٥': [{ url: '/fa/events/archive/2025/', excerpt: 'Another duplicate excerpt' }],
  };
  for (const query of ['2025', '۲۰۲۵', '٢٠٢٥']) {
    const calls: string[] = [];
    const results = await searchWithVariants(query, async variant => {
      calls.push(variant);
      if (variant === '2025') await new Promise(resolve => setTimeout(resolve, 1));
      return rows[variant];
    });
    assert.deepEqual(calls, ['2025', '۲۰۲۵', '٢٠٢٥']);
    assert.deepEqual(results, [rows['2025'][0], rows['2025'][1], rows['۲۰۲۵'][1]]);
  }
  let lookups = 0;
  await searchWithVariants('poetry', async () => { lookups++; return []; });
  assert.equal(lookups, 1);
});

test('leaving the query clears a pending search without restoring stale results', async () => {
  let finish!: (value: string[]) => void;
  const runner = createSearchRunner(() => new Promise<string[]>(resolve => { finish = resolve; }));
  const pending = runner.run('yalda');
  runner.cancel();
  finish(['old result']);
  assert.equal(await pending, null);
});

test('the latest search wins even when an earlier request finishes last', async () => {
  const requests = new Map<string, (value: string[]) => void>();
  const runner = createSearchRunner(query => new Promise<string[]>(resolve => requests.set(query, resolve)));
  const older = runner.run('first');
  const newer = runner.run('second');
  requests.get('second')!(['new result']);
  assert.deepEqual(await newer, ['new result']);
  requests.get('first')!(['old result']);
  assert.equal(await older, null);
});

test('cancelled failures stay silent and the active failure can be retried', async () => {
  let fail!: (reason: Error) => void;
  const runner = createSearchRunner(() => new Promise<string[]>((_, reject) => { fail = reject; }));
  const abandoned = runner.run('old');
  runner.cancel();
  fail(new Error('abandoned'));
  assert.equal(await abandoned, null);
  const active = runner.run('current');
  fail(new Error('unavailable'));
  await assert.rejects(active, /unavailable/);
});
