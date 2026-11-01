import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../src/proto/09-app.jsx', import.meta.url), 'utf8');
const start = source.indexOf('  useEffect(() => {', source.indexOf('  // 부팅 시 Supabase 세션'));
const restore = source.slice(start, source.indexOf('  const refreshDeviceWeather', start));
async function boot(user, socialError = '') {
  const stale = { email: 'another@example.com', avatar: 'private-photo', styles: ['formal'], fit: 'tight' };
  const state = { prefs: stale, persisted: [] };
  const defaults = { styles: [], fit: '', avatar: '' };
  const deps = {
    setAccountSheet: value => { state.accountSheet = value; }, showToast: message => { state.toast = message; },
    useEffect: fn => fn(), isShowcase: false, forceOnb: false, prefsAtBoot: { current: null }, prefs: stale,
    window: { LB_AUTH: { current: async () => user, socialError }, location: new URL('https://app.test/?auth=social') }, URLSearchParams,
    setAuthUid: id => { state.id = id; }, setPrefs: value => { state.prefs = typeof value === 'function' ? value(state.prefs) : value; },
    mergePrefs: (local, saved) => ({ ...local, ...saved }), LB_DATA: { DEFAULT_PREFS: defaults },
    prefsSynced: { current: false }, persistPrefs: value => state.persisted.push(value),
    setOnboarded: value => { state.onboarded = value; }, setPhase: value => { state.phase = value; },
  };
  new Function(...Object.keys(deps), restore)(...Object.values(deps));
  await new Promise(resolve => setImmediate(resolve));
  return state;
}
test('new social account starts preferences without copying another local account', async () => {
  const state = await boot({ id: 'new-owner', providers: ['google'], email: 'new@example.com', prefs: null });
  assert.equal(state.id, 'new-owner');
  assert.equal(state.onboarded, false);
  assert.equal(state.phase, 'onboarding');
  assert.equal(state.prefs.avatar, '');
  assert.deepEqual(state.prefs.styles, []);
  assert.equal(state.persisted.length, 0);
});
test('linked account restores saved preferences under the same owner ID', async () => {
  const saved = { gender: '남성', styles: ['casual'], fit: 'regular', avatar: 'saved-photo' };
  const state = await boot({ id: 'existing-owner', providers: ['email', 'google'], email: 'jsharrykim@gmail.com', prefs: saved });
  assert.equal(state.id, 'existing-owner');
  assert.equal(state.onboarded, true);
  assert.equal(state.prefs.avatar, 'saved-photo');
  assert.deepEqual(state.prefs.styles, ['casual']);
});
test('failed callback without a session returns to the login choices', async () => {
  const state = await boot(null);
  assert.equal(state.onboarded, false);
  assert.equal(state.phase, 'login');
  assert.equal(state.persisted.length, 0);
});

test('a failed link shows the error while preserving the existing account', async () => {
  const state = await boot({ id: 'owner', providers: ['email'], email: 'person@example.com', prefs: {} }, '로그인을 완료하지 못했어요.');
  assert.equal(state.id, 'owner');
  assert.equal(state.accountSheet, true);
  assert.equal(state.toast, '로그인을 완료하지 못했어요.');
});
