import test from 'node:test';
import assert from 'node:assert/strict';
import { createSearchRunner } from '../src/lib/search';

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
