import React from 'react';
import { outfitPrice } from '../look-layout.js';
import './feed-items.css';

const { Icon } = window;

export default function FeedItems({ look, onOpen }) {
  const items = (look.items || []).filter((item, i, all) => all.findIndex(x => x.id === item.id) === i);
  if (!items.length) return <div className="rc-feed-items rc-feed-items-empty" role="region" aria-label="피드 아이템"><Icon name="hanger" size={18}/><span>등록한 아이템이 없어요</span></div>;
  if (!onOpen) return null;

  return <div className="rc-feed-items" role="region" aria-label="피드 아이템">
    {items.map(item => <button type="button" key={item.id} className="rc-feed-item" onClick={onOpen} aria-label={`${item.name || '아이템'} · 아이템 목록 보기`}>
      <span className="rc-feed-item-image">{item.img ? <img src={item.img} alt="" loading="lazy" draggable={false}/> : <Icon name="hanger" size={24}/>}</span>
      <span className="rc-feed-item-copy">
        <small>{item.brand?.trim() || '브랜드 미등록'}</small>
        <span className="rc-feed-item-name">{item.name || item.category || '아이템'}</span>
        <strong className={!item.price ? 'rc-feed-item-missing' : undefined}>{item.price ? outfitPrice(item.price) : '가격 미등록'}</strong>
      </span>
    </button>)}
  </div>;
}
