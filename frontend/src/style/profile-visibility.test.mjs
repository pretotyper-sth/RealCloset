import test from 'node:test';
import assert from 'node:assert/strict';
import { visibleItems, persistVisibility } from './profile-visibility.js';

const item = { id: 'shirt', name: '셔츠' };

test('optimistic changes and rollback preserve concurrent changes to other clothes', () => {
  let items = visibleItems([], item, true);
  items = visibleItems(items, { id: 'shoes' }, true);
  items = visibleItems(items, item, false);
  assert.deepEqual(items.map(x => x.id), ['shoes']);
  assert.equal(visibleItems(visibleItems([], item, true), item, true).length, 1);
});

test('visibility writes wardrobe and public closet only once each', async () => {
  const calls = [];
  await persistVisibility(item, true, {
    updateWardrobe: async (_, value) => calls.push(['wardrobe', value]),
    updateProfile: async (_, value) => calls.push(['profile', value]),
  });
  assert.deepEqual(calls, [['wardrobe', true], ['profile', true]]);
});

test('failed public save restores both stores and surfaces the original error', async () => {
  const calls = [], error = new Error('save failed');
  await assert.rejects(persistVisibility(item, true, {
    updateWardrobe: async (_, value) => calls.push(['wardrobe', value]),
    updateProfile: async (_, value) => { calls.push(['profile', value]); if (value) throw error; },
  }), error);
  assert.deepEqual(calls, [['wardrobe', true], ['profile', true], ['wardrobe', false], ['profile', false]]);
});

test('failed wardrobe save does not publish the public closet', async () => {
  const calls = [];
  await assert.rejects(persistVisibility(item, true, {
    updateWardrobe: async (_, value) => { calls.push(value); if (value) throw new Error('offline'); },
    updateProfile: async () => assert.fail('must not publish'),
  }), /offline/);
  assert.deepEqual(calls, [true, false]);
});

test('failed rollback requests a refresh instead of claiming persistence', async () => {
  await assert.rejects(persistVisibility(item, false, {
    updateWardrobe: async () => { throw new Error('offline'); },
    updateProfile: async () => {},
  }), /새로고침/);
});

test('a profile-only entry point still saves and rolls back its own store', async () => {
  const calls = [];
  await assert.rejects(persistVisibility(item, false, {
    updateProfile: async (_, value) => { calls.push(value); if (!value) throw new Error('failed'); },
  }), /failed/);
  assert.deepEqual(calls, [false, true]);
});
