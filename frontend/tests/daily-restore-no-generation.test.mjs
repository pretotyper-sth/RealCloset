import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../src/proto/09-app.jsx', import.meta.url), 'utf8');
const start = source.indexOf('  const requestDailyOutfits =');
const end = source.indexOf('    if (opts && opts.restoreOnly) return', start);
const restore = source.slice(start, source.indexOf('\n', end)) + '\n}; requestDailyOutfits;';

for (const state of ['memory', 'cache', 'empty']) {
  test(`restoring ${state} outfits never generates an AI image or shows a failure toast`, async () => {
    const outfit = { id: 'saved', itemIds: ['shirt'] };
    let calls = 0;
    const context = {
      prefs: { dailyEnabled: true, modelLook: true }, preferredDailyStyle: 'minimal', items: [], archived: [],
      LB_DATA: { DAILY: state === 'memory' ? [outfit] : [] },
      syncAllFromWardrobe() {}, pruneDailyAgainstOwned() {}, refreshDeviceWeather() {},
      dailyWardrobeGrewSinceCache: () => false, coordinateLookSettings: () => ({}), coordProfile: () => ({}),
      readDailyCache: () => state === 'cache' ? { outfits: [outfit] } : null,
      filterDailyOutfitsByOwned: list => list, stampOutfitStyle() {}, liveApplyPayload() {},
      dailyCacheItemsFromOwned: () => [], writeDailyCache() {}, clearDailyCache() {},
      setDailyStyle() {}, setDailyAllowed() {}, bumpDaily() {},
      applyModelLooks: () => { calls++; throw new Error('API disabled'); },
      liveJSON: () => assert.fail('restore must not send generation requests'),
      showToast: () => assert.fail('restore must not display a generation failure'),
    };
    const request = vm.runInNewContext(restore, context);
    await request('minimal', { restoreOnly: true });
    assert.equal(calls, 0);
    assert.equal(outfit.lookImg, undefined);
  });
}

test('no background effect fills restored outfits; explicit creation paths remain', () => {
  const preRequest = source.slice(source.indexOf('  const applyModelLooks ='), source.indexOf('  const setModelLook ='));
  assert.doesNotMatch(preRequest, /useEffect\([\s\S]*?applyModelLooks\(pending\)/);
  assert.match(source, /applyModelLooks: \(list\) => applyModelLooks\(list, true\)/);
});
