import React from 'react'
import * as ReactDOM from 'react-dom/client'
import './proto/proto.css'
import protoManifest from './proto/manifest.json'
import { initLiveBridge } from './live-bridge.js'

// The prototype modules were written for an in-browser Babel runtime that shared
// one global scope. We expose React/ReactDOM/resources on window, then import the
// modules in their original order so each one can register itself on window and
// the final app-shell module can mount <App/>.
window.React = React
window.ReactDOM = ReactDOM
// Exact resource id -> image path map, extracted from the given prototype HTML.
window.__resources = protoManifest.resources

// Route the prototype's /api/live/* calls to the backend with an anon session.
// Non-blocking: installs the fetch bridge synchronously and warms the session in
// the background so we don't delay first paint on a network round trip.
initLiveBridge()

// iOS는 작은 글자 input 포커스·더블탭으로 페이지를 확대한 뒤 그 배율을 기억한다.
// 로드·bfcache 복원 때 initial-scale을 한 번 다시 심어 1배로 되돌린다.
function resetMobilePageZoom() {
  const meta = document.querySelector('meta[name="viewport"]')
  if (!meta) return
  const base = 'width=device-width, initial-scale=1.0, viewport-fit=cover'
  meta.setAttribute('content', `${base}, maximum-scale=1.0`)
  requestAnimationFrame(() => {
    meta.setAttribute('content', base)
  })
}
resetMobilePageZoom()
window.addEventListener('pageshow', resetMobilePageZoom)

// 옷 사진 전용 캐시(서비스 워커). 스토리지가 no-cache로 내려줘 매번 다시 받던 것을 막는다.
// 앱 셸은 캐시하지 않으므로 배포는 평소처럼 즉시 반영된다.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* 지원 안 하면 그냥 넘어간다 */ })
  })
}

await import('./proto/screens.js')

// 로컬 전용: 익명 세션의 옷장·오늘 코디·룩북을 기준 계정 데이터로 채우고 토글 버튼을 띄운다.
// LB_DATA(03-data)를 채운 뒤, App이 마운트되는 09-app 앞에서 실행돼야 한다.
if (import.meta.env.DEV && !['style','vote'].some(key=>new URLSearchParams(location.search).has(key))) await import('./dev/wardrobe-seed.js')

const styleExperience = await import('./style/experience.jsx')
if (import.meta.env.DEV) await import('./style/closet-studio.jsx')

if (styleExperience && new URLSearchParams(location.search).has('vote')) {
  ReactDOM.createRoot(document.getElementById('root')).render(<styleExperience.SharedVotePage />)
} else if (styleExperience && new URLSearchParams(location.search).has('style')) {
  ReactDOM.createRoot(document.getElementById('root')).render(<styleExperience.SharedStylePage />)
} else {
  await import('./proto/09-app.jsx')
}
