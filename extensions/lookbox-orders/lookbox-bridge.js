(() => {
  if (window.__realclosetOrdersBridge) return;
  window.__realclosetOrdersBridge = true;
window.addEventListener('message', (event) => {
  if (event.source !== window || event.origin !== window.location.origin) return;
  const data = event.data;
  if (!data || data.source !== 'lookbox-app' || !['PING', 'OPEN', 'COLLECT', 'CANCEL', 'FETCH_IMAGE'].includes(data.type) || typeof data.id !== 'string') return;
  try { chrome.runtime.sendMessage(data, (result) => {
    window.postMessage({
      source: 'lookbox-ext',
      replyTo: data.id,
      result: result || null,
      lastError: (chrome.runtime.lastError && chrome.runtime.lastError.message) || '',
    }, window.location.origin);
  }); } catch {
    window.postMessage({ source: 'lookbox-ext', replyTo: data.id, lastError: '확장 프로그램을 업데이트했어요. 페이지를 새로고침해 주세요.' }, window.location.origin);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'LOOKBOX_OPEN_ORDERS') {
    const opened = !window.dispatchEvent(new Event('rc-open-orders', { cancelable: true }));
    sendResponse({ opened });
    return;
  }
  if (!message || message.type !== 'LOOKBOX_ORDER_EVENT') return;
  window.postMessage({
    source: 'lookbox-ext',
    eventFor: message.requestId,
    event: message.event || null,
  }, window.location.origin);
});

window.postMessage({ source: 'lookbox-ext', type: 'ready' }, window.location.origin);

})();
