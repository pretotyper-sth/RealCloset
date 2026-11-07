import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/live-bridge.js', import.meta.url), 'utf8');
const bridge = source.slice(source.indexOf('function installFetchBridge'), source.indexOf('// Bootstrap:'));

function setup(statuses, tokens = ['session']) {
  const requests = [];
  const window = { fetch: async (url, init) => {
    requests.push(init.headers.get('Authorization'));
    assert.ok(statuses.length, 'unexpected extra request');
    return { status: statuses.shift() };
  } };
  vm.runInNewContext(bridge.replaceAll('import.meta.env.PROD', 'true') + '\ninstallFetchBridge();', {
    window, Headers, configured: true, API_BASE: 'https://api.example',
    ensureToken: async () => tokens.length > 1 ? tokens.shift() : tokens[0],
    setTimeout: callback => callback(),
    refreshAccountToken: async () => assert.fail('503 must not refresh the session'),
    renewAnonymousSession: async () => assert.fail('503 must not replace the session'),
  });
  return { fetch: window.fetch, requests };
}

test('a temporary auth outage recovers on the same session', async () => {
  const { fetch, requests } = setup([503, 503, 200]);
  assert.equal((await fetch('/api/studio/feed')).status, 200);
  assert.deepEqual(requests, ['Bearer session', 'Bearer session', 'Bearer session']);
});

test('persistent outage is bounded and writes are never replayed on 503', async () => {
  const read = setup([503, 503, 503]);
  assert.equal((await read.fetch('/api/studio/feed')).status, 503);
  assert.equal(read.requests.length, 3);

  const write = setup([503]);
  assert.equal((await write.fetch('/api/studio/state', { method: 'PUT' })).status, 503);
  assert.equal(write.requests.length, 1);
});

test('an interrupted read is not retried under a different session', async () => {
  const { fetch, requests } = setup([503], ['old-session', 'new-session']);
  assert.equal((await fetch('/api/studio/feed')).status, 503);
  assert.deepEqual(requests, ['Bearer old-session']);
});
