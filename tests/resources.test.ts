import test from 'node:test';
import assert from 'node:assert/strict';
import { resources } from '../src/data';
import { campusDay } from '../src/lib/events';

test('the campus directory keeps distinct official destinations and no future review dates', () => {
  const destinations = resources.map(resource => {
    const url = new URL(resource.url);
    assert.equal(url.protocol, 'https:');
    assert.ok(url.hostname === 'uci.edu' || url.hostname.endsWith('.uci.edu'));
    assert.equal(url.username + url.password, '');
    assert.ok(resource.reviewedOn <= campusDay());
    return `${url.hostname}${url.pathname.replace(/\/$/, '')}${url.search}`;
  });
  assert.equal(new Set(destinations).size, destinations.length);
  assert.ok(resources.some(resource => resource.id === 'library-research'));
  assert.ok(resources.some(resource => resource.id === 'disability-services'));
  assert.ok(resources.some(resource => resource.id === 'anteater-express'));
});
