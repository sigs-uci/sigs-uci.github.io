import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { cloudflareWebAnalyticsSiteId } from '../src/config/analytics';
import { analyticsSiteId, cloudflareAnalyticsBootstrap, cloudflareBeaconUrl } from '../src/lib/analytics';

const exampleSiteId = '0123456789abcdef0123456789abcdef';

function browser(url: string, existingBeacon = false) {
  const inserted: { type?: string; src?: string; attributes: Record<string, string> }[] = [];
  const document = {
    querySelector: (selector: string) => selector === 'script[data-cf-beacon]' && (existingBeacon || inserted.length > 0) ? {} : null,
    createElement: (tag: string) => {
      assert.equal(tag, 'script');
      return { attributes: {} as Record<string, string>,
        setAttribute(name: string, value: string) { this.attributes[name] = value; } };
    },
    body: { appendChild: (element: typeof inserted[number]) => { inserted.push(element); } },
  };
  return { inserted, context: vm.createContext({ window: { location: new URL(url) }, document }) };
}

test('missing or invalid public site IDs emit no analytics loader', () => {
  for (const value of [null, undefined, '', ' ', 'a'.repeat(31), 'a'.repeat(33), 'g'.repeat(32),
    ` ${exampleSiteId}`, `${exampleSiteId}\n`, '<script>alert(1)</script>', { token: exampleSiteId }]) {
    assert.equal(analyticsSiteId(value), null);
    assert.equal(cloudflareAnalyticsBootstrap(value), null);
  }
  assert.equal(analyticsSiteId(exampleSiteId.toUpperCase()), exampleSiteId);
  assert.ok(cloudflareWebAnalyticsSiteId === null || analyticsSiteId(cloudflareWebAnalyticsSiteId), 'The production configuration must be disabled or contain a valid public site ID');
});

test('the production HTTPS origin loads one official module beacon with the public site ID', () => {
  for (const url of ['https://sigs-uci.github.io/fa/events/', 'https://sigs-uci.github.io:443/en/']) {
    const page = browser(url);
    const bootstrap = cloudflareAnalyticsBootstrap(exampleSiteId)!;
    vm.runInContext(bootstrap, page.context);
    vm.runInContext(bootstrap, page.context);
    assert.equal(page.inserted.length, 1);
    assert.equal(page.inserted[0].src, cloudflareBeaconUrl);
    assert.equal(page.inserted[0].type, 'module');
    assert.deepEqual(JSON.parse(page.inserted[0].attributes['data-cf-beacon']), { token: exampleSiteId });
  }
});

test('localhost, previews, lookalike hosts and other origins never load the beacon', () => {
  for (const url of [
    'http://127.0.0.1:4321/en/', 'http://localhost:4321/fa/', 'https://localhost/en/',
    'file:///preview/en/index.html', 'http://sigs-uci.github.io/en/',
    'https://sigs-uci.github.io:444/en/', 'https://preview.sigs-uci.github.io/en/',
    'https://sigs-uci.github.io.example.com/en/', 'https://example.com/sigs-uci.github.io/',
  ]) {
    const page = browser(url);
    vm.runInContext(cloudflareAnalyticsBootstrap(exampleSiteId)!, page.context);
    assert.equal(page.inserted.length, 0, url);
  }
});

test('an existing Cloudflare beacon is not initialized twice', () => {
  const page = browser('https://sigs-uci.github.io/en/', true);
  vm.runInContext(cloudflareAnalyticsBootstrap(exampleSiteId)!, page.context);
  assert.equal(page.inserted.length, 0);
});
