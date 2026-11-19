import React from 'react';
import './feed-skeleton.css';
const { Skeleton } = window;

export default function FeedSkeleton({ layout = 'grid', count = 4, label = '피드를 불러오는 중', square = false }) {
  return <div className={`rc-feed-skeleton rc-feed-skeleton-${layout}`} role="status" aria-label={label}>
    {Array.from({ length: count }, (_, index) => <div className="rc-feed-skeleton-card" aria-hidden="true" key={index}>
      {layout === 'people' ? <>
        <Skeleton w={44} h={44} radius="50%"/>
        <Skeleton w={120} h={12}/>
        <Skeleton w={64} h={32}/>
      </> : <>
        {layout === 'stream' && <div className="rc-feed-skeleton-author"><Skeleton w={28} h={28} radius="50%"/><Skeleton w={90} h={12}/></div>}
        <Skeleton h="auto" style={{ aspectRatio: square ? '1' : '4 / 5' }}/>
        <Skeleton w="70%" h={12}/>
        <Skeleton w="44%" h={10}/>
      </>}
    </div>)}
  </div>;
}
