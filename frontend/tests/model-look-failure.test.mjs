import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('../src/proto/09-app.jsx', import.meta.url), 'utf8');
const block = source.slice(source.indexOf('  const lookInflight ='), source.indexOf('  // 페이지 진입과 저장 코디 복원'));

test('manual image generation reports both request failures and missing images', async () => {
  const outfit = { id: 'outfit', itemIds: ['item'] };
  const toasts = [];
  const data = { DAILY: [outfit], LOOK_STAGE: {} };
  let requests = 0;
  const liveJSON = async () => {
    if (++requests === 1) throw new Error('Internal provider error');
    return { outfits: [{ id: outfit.id, lookImg: null }] };
  };
  const apply = new Function('useRef', 'useCallback', 'LB_DATA', 'outfitWishPending', 'bumpDaily',
    'liveJSON', 'prefs', 'dailyStyle', 'items', 'reloadBilling', 'showToast', block + '\nreturn applyModelLooks;')(
    current => ({ current }), callback => callback, data, () => false, () => {},
    liveJSON, {}, '', [], () => {}, message => toasts.push(message),
  );

  assert.equal(await apply(outfit, true), 0);
  assert.equal(await apply(outfit, true), 0);
  assert.equal(requests, 2);
  assert.deepEqual(toasts, Array(2).fill('착장 이미지 생성에 실패했어요. 잠시 후 다시 시도해 주세요.'));
  assert.deepEqual(data.LOOK_STAGE, {});
});
