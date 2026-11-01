import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

test('shared item details show recorded fields and context-appropriate actions', async () => {
  global.window = { Icon: () => null, Skeleton: () => null };
  const server = await createServer({
    root: new URL('..', import.meta.url).pathname,
    server: { middlewareMode: true, hmr: false },
    plugins: [{
      name: 'sheet-shell-for-server-render', enforce: 'pre',
      load(id) {
        if (!id.endsWith('/src/style/social.jsx')) return;
        return `import React from 'react'; export function StudioSheet({children,title,description}) {
          return React.createElement('section',null,React.createElement('h2',null,title),description,children);
        }`;
      },
    }],
  });
  try {
    const { default: ProductSheet } = await server.ssrLoadModule('/src/style/product-sheet.jsx');
    const item = { id: 'shirt', name: '셔츠', brand: '브랜드', price: 99000, color: '블루', size: 'M', material: '면', store: '매장', note: '내 기록', url: 'https://example.com/item' };
    const props = { look: { author: '작성자', items: [item] }, initialItem: item, context: 'profile', onSaveItem() {}, onClose() {} };
    const own = renderToStaticMarkup(React.createElement(ProductSheet, { ...props, canSaveItem: () => false }));
    for (const text of ['아이템 정보', '브랜드', '99,000원', '블루', '사이즈', '소재', '매장', '내 기록', '상품 링크']) assert.ok(own.includes(text), text);
    assert.ok(!own.includes('만들기 재료로 담기'));
    assert.ok(!own.includes('아이템 목록</button>'));
    const publish = renderToStaticMarkup(React.createElement(ProductSheet, { ...props, canSaveItem: () => false, detailAction: React.createElement('button', { 'aria-pressed': true }, '공개 중') }));
    assert.ok(publish.includes('aria-pressed="true">공개 중</button>'));
    assert.ok(!publish.includes('만들기 재료로 담기'));
    const other = renderToStaticMarkup(React.createElement(ProductSheet, props));
    assert.ok(other.includes('만들기 재료로 담기'));
    const saved = renderToStaticMarkup(React.createElement(ProductSheet, { ...props, collections: [{ type: 'item', item }] }));
    assert.match(saved, /disabled=""[^>]*>만들기 재료에 담김/);
    const list = renderToStaticMarkup(React.createElement(ProductSheet, { ...props, initialItem: null, context: 'feed' }));
    assert.ok(list.includes('피드 아이템'));
    assert.ok(list.includes('셔츠 상세 정보 보기'));
    const { default: FeedSkeleton } = await server.ssrLoadModule('/src/style/feed-skeleton.jsx');
    const skeleton = renderToStaticMarkup(React.createElement(FeedSkeleton, { label: '저장한 피드를 불러오는 중', count: 4 }));
    assert.equal((skeleton.match(/rc-feed-skeleton-card/g) || []).length, 4);
    assert.ok(skeleton.includes('role="status"'));
    assert.ok(!skeleton.includes('>저장한 피드를 불러오는 중<'));
    const { default: FeedItems } = await server.ssrLoadModule('/src/style/feed-items.jsx');
    const emptyItems = renderToStaticMarkup(React.createElement(FeedItems, { look: { items: [] }, onOpen() {} }));
    assert.ok(emptyItems.includes('rc-feed-items-empty'));
    assert.ok(emptyItems.includes('등록한 아이템이 없어요'));
    const itemStrip = renderToStaticMarkup(React.createElement(FeedItems, { look: { items: [item, item, { id: 'pants', category: '하의' }] }, onOpen() {} }));
    assert.equal((itemStrip.match(/class="rc-feed-item"/g) || []).length, 2);
    assert.ok(itemStrip.includes('<small>브랜드 미등록</small><span class="rc-feed-item-name">하의</span><strong class="rc-feed-item-missing">가격 미등록</strong>'));
  } finally {
    await server.close();
    delete global.window;
  }
});
