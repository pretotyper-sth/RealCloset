import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/live-bridge.js', import.meta.url), 'utf8');
function setup(methods = {}, href = 'https://realcloset.vercel.app/') {
  let listener;
  const storage = new Map();
  const window = Object.assign(new EventTarget(), { location: new URL(href), history: { replaceState() {} } });
  const context = vm.createContext({
    window, Event, URL, URLSearchParams, console,
    sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    createClient: () => ({ auth: { onAuthStateChange(fn) { listener = fn; }, ...methods } }),
  });
  vm.runInContext(source.slice(source.indexOf('const API_BASE'), source.indexOf('// Warm up TCP/TLS')).replaceAll('import.meta.env.', 'testEnv.'), vm.createContext(Object.assign(context, { testEnv: { VITE_API_BASE_URL: 'https://api.example', VITE_SUPABASE_URL: 'https://auth.example', VITE_SUPABASE_ANON_KEY: 'public-test-key' } })));
  return { window, auth: window.LB_AUTH, emit: (event, session) => listener(event, session), storage };
}

test('sign-in translates returned and thrown network failures', async () => {
  for (const signInWithPassword of [async () => ({ error: new Error('Failed to fetch') }), async () => { throw new TypeError('Failed to fetch'); }]) {
    const { auth } = setup({ signInWithPassword });
    const result = await auth.signIn('person@example.com', 'secret');
    assert.match(result.error, /인증 서버에 연결하지 못했어요/);
  }
});

test('reset request uses clean same-origin recovery URL and trims email', async () => {
  let args;
  const { auth } = setup({ resetPasswordForEmail: async (...value) => { args = value; return {}; } }, 'https://realcloset.vercel.app/?debug=1');
  assert.equal((await auth.requestPasswordReset(' person@example.com ')).error, '');
  assert.equal(args[0], 'person@example.com');
  assert.equal(args[1].redirectTo, 'https://realcloset.vercel.app/?reset=1');
});

test('reset failures stay actionable; invalid credentials remain distinct', async () => {
  const { auth } = setup({ resetPasswordForEmail: async () => { throw new Error('Failed to fetch'); }, signInWithPassword: async () => ({ error: new Error('Invalid login credentials') }) });
  assert.match((await auth.requestPasswordReset('person@example.com')).error, /인증 서버/);
  assert.match((await auth.signIn('person@example.com', 'secret')).error, /이메일 또는 비밀번호/);
});

test('query alone cannot turn an ordinary session into verified recovery', async () => {
  const session = { user: { id: 'owner' } };
  const { auth, emit, storage } = setup({ getSession: async () => ({ data: { session } }) }, 'https://realcloset.vercel.app/?reset=1');
  assert.equal(auth.recoveryActive, true);
  assert.equal(await auth.recoveryStatus(), 'expired');
  emit('PASSWORD_RECOVERY', session);
  assert.equal(await auth.recoveryStatus(), 'ready');
  assert.equal(storage.get('lb-password-recovery'), 'owner');
  auth.finishRecovery();
  assert.equal(auth.recoveryActive, false);
  assert.equal(storage.has('lb-password-recovery'), false);
});

test('expired recovery without session does not show password form', async () => {
  const { auth } = setup({ getSession: async () => ({ data: { session: null } }) }, 'https://realcloset.vercel.app/?reset=1#error=access_denied');
  assert.equal(await auth.recoveryStatus(), 'expired');
});

test('social sign-in supports only Google/Kakao and returns to the clean app URL', async () => {
  const calls = [];
  const { auth } = setup({ signInWithOAuth: async args => { calls.push(args); return {}; } }, 'https://realcloset.vercel.app/?reset=1&debug=1#stale');
  for (const provider of ['google', 'kakao']) {
    assert.equal((await auth.signInSocial(provider)).error, '');
    assert.equal(calls.at(-1).provider, provider);
    assert.equal(calls.at(-1).options.redirectTo, 'https://realcloset.vercel.app/?auth=social');
  }
  assert.equal(calls[0].options.queryParams.prompt, 'select_account');
  assert.ok((await auth.signInSocial('other')).error);
  assert.equal(calls.length, 2);
});

test('linking requires a verified existing session and uses linkIdentity, preserving its user ID', async () => {
  for (const user of [null, { id: 'anon', is_anonymous: true }]) {
    const { auth } = setup({ getUser: async () => ({ data: { user } }), linkIdentity: () => assert.fail('must not link') });
    assert.match((await auth.signInSocial('google', { link: true })).error, /기존 계정/);
  }
  const user = { id: 'existing-owner', email: 'jsharrykim@gmail.com', identities: [{ provider: 'email' }, { provider: 'google' }], user_metadata: { prefs: { gender: '남성', styles: ['casual'] } } };
  let linked;
  const { auth } = setup({ getUser: async () => ({ data: { user } }), getSession: async () => ({ data: { session: { user } } }), linkIdentity: async args => { linked = args; return {}; } });
  assert.equal((await auth.signInSocial('google', { link: true })).error, '');
  assert.equal(linked.provider, 'google');
  const current = await auth.current();
  assert.equal(current.id, 'existing-owner');
  assert.equal(current.prefs.gender, '남성');
  assert.deepEqual(Array.from(current.providers), ['email', 'google']);
});

test('social configuration failures and provider collisions remain actionable', async () => {
  const { auth } = setup({ signInWithOAuth: async () => ({ error: new Error('Unsupported provider: provider is not enabled') }), getUser: async () => ({ data: { user: { id: 'owner' } } }), linkIdentity: async () => ({ error: { code: 'identity_already_exists', message: 'Identity exists' } }) });
  assert.match((await auth.signInSocial('google')).error, /기존 이메일/);
  assert.match((await auth.signInSocial('kakao', { link: true })).error, /다른 계정/);
  const failed = setup({}, 'https://realcloset.vercel.app/?auth=social#error=access_denied&error_description=private-details');
  assert.match(failed.auth.socialError, /다시 시도/);
  assert.ok(!failed.auth.socialError.includes('private-details'));
});


test('callback error survives SDK clearing the URL fragment', () => {
  const { auth, window } = setup({}, 'https://realcloset.vercel.app/?auth=social#error=access_denied');
  window.location.hash = '';
  assert.match(auth.socialError, /다시 시도/);
});
