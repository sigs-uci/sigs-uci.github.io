import test from 'node:test';
import assert from 'node:assert/strict';
import { data, validatePublicData } from '../src/data';

test('event rules links accept ordinary web destinations and reject executable or credential URLs', () => {
  for (const url of ['https://example.com/tournament-rules', null, undefined]) {
    const copy = structuredClone(data);
    copy.events[0].rulesUrl = url;
    assert.deepEqual(validatePublicData(copy), []);
  }
  const credentialUrl = new URL('https://example.com/rules');
  credentialUrl.username = 'example';
  credentialUrl.password = 'example';
  for (const url of ['javascript:alert(1)', credentialUrl.href, '']) {
    const copy = structuredClone(data);
    copy.events[0].rulesUrl = url;
    assert.ok(validatePublicData(copy).some(error => error.includes('Rules URL')));
  }
});
