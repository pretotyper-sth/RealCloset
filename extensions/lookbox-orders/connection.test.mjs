import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const background = (await readFile(new URL('./background.js', import.meta.url), 'utf8')).replace(/^import[\s\S]*?from '.+?';\n/gm, '');
const bridge = await readFile(new URL('./lookbox-bridge.js', import.meta.url), 'utf8');
const manifest = JSON.parse(await readFile(new URL('./manifest.json', import.meta.url), 'utf8'));

function worker(tabs = []) {
  const handlers = {}, calls = [];
  const chrome = {
    runtime: { onInstalled: { addListener(fn) { handlers.install = fn; } }, onMessage: { addListener(fn) { handlers.message = fn; } }, getManifest: () => manifest },
    action: { onClicked: { addListener(fn) { handlers.click = fn; } } },
    tabs: {
      query: async () => tabs,
      get: async id => tabs.find(tab => tab.id === id),
      update: async (...args) => { calls.push(['update', ...args]); },
      create: async (...args) => { calls.push(['create', ...args]); },
      sendMessage: async (...args) => { calls.push(['message', ...args]); return { opened: true }; },
    },
    windows: { update: async (...args) => { calls.push(['focus', ...args]); } },
    scripting: { executeScript: async (...args) => { calls.push(['script', ...args]); } },
  };
  vm.runInNewContext(background, { chrome, URL, byId: () => undefined, setTimeout, clearTimeout });
  return { handlers, calls };
}

test('only REALCLOSET pages receive replies; version comes from manifest', () => {
  const { handlers } = worker();
  let result;
  const reply = value => { result = value; };
  handlers.message({ type: 'PING' }, { tab: { id: 1, url: 'https://evil.example/' } }, reply);
  assert.equal(result, undefined);
  handlers.message({ type: 'PING' }, { tab: { id: 1, url: 'https://realcloset.vercel.app.evil.example/' } }, reply);
  assert.equal(result, undefined);
  handlers.message({ type: 'PING' }, { tab: { id: 1, url: 'https://realcloset.vercel.app/' } }, reply);
  assert.equal(result.ok, true);
  assert.equal(result.version, manifest.version);
  handlers.message({ type: 'COLLECT', platform: 'unknown' }, { tab: { id: 1, url: 'https://realcloset.vercel.app/' } }, reply);
  assert.equal(result.status, 'error');
});

test('install connects existing pages and toolbar opens or reuses purchase import', async () => {
  const fresh = worker();
  await fresh.handlers.click();
  assert.equal(fresh.calls[0][0], 'create');
  assert.equal(fresh.calls[0][1].url, 'https://realcloset.vercel.app/?tab=wardrobe&add=orders');
  const existing = worker([{ id: 4, windowId: 9, lastAccessed: 10 }]);
  await existing.handlers.install();
  assert.equal(existing.calls[0][1].files[0], 'lookbox-bridge.js');
  await existing.handlers.click();
  assert.ok(existing.calls.some(call => call[0] === 'message' && call[1] === 4 && call[2].type === 'LOOKBOX_OPEN_ORDERS'));
  assert.ok(!existing.calls.some(call => call[0] === 'create'));
});

test('repeated bridge injection sends once, rejects other origins and opens orders', () => {
  const messages = [], listeners = {}, events = [];
  const window = {
    location: { origin: 'https://realcloset.vercel.app' },
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); },
    postMessage(message) { messages.push(message); },
    dispatchEvent(event) { events.push(event.type); return false; },
  };
  let received;
  const chrome = { runtime: { sendMessage(data, callback) { messages.push(data); callback({ ok: true }); }, onMessage: { addListener(fn) { received = fn; } } } };
  const context = vm.createContext({ window, chrome, Event });
  vm.runInContext(bridge, context);
  vm.runInContext(bridge, context);
  assert.equal(listeners.message.length, 1);
  const send = origin => listeners.message[0]({ source: window, origin, data: { source: 'lookbox-app', type: 'PING', id: 'request1' } });
  send('https://evil.example');
  assert.equal(messages.length, 1);
  send(window.location.origin);
  assert.equal(messages.length, 3);
  assert.equal(messages[2].replyTo, 'request1');
  let reply;
  received({ type: 'LOOKBOX_OPEN_ORDERS' }, {}, value => { reply = value; });
  assert.deepEqual(events, ['rc-open-orders']);
  assert.equal(reply.opened, true);
});
