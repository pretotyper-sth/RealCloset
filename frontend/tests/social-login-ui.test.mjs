import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { transformWithOxc } from 'vite';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

test('landing renders social login actions directly, with provider logos', async () => {
  const window = {React, LB_AUTH: {socialError:''}, LB_DATA:{IMG:{}}, Wordmark:()=>React.createElement('span',null,'REALCLOSET'), Icon:()=>React.createElement('span')};
  const shared=readFileSync(new URL('../src/proto/02-shared.jsx',import.meta.url),'utf8');
  const button=shared.slice(shared.indexOf('function Btn('),shared.indexOf('function Chip('));
  const btnCode=await transformWithOxc(button+'\nwindow.Btn=Btn;','button.jsx',{jsx:{runtime:'classic'}});
  const context=vm.createContext({window,React,Icon:window.Icon,console});
  vm.runInContext(btnCode.code,context);
  const source=readFileSync(new URL('../src/proto/07-onboarding.jsx',import.meta.url),'utf8').replaceAll('import.meta.env.DEV','false');
  const {code}=await transformWithOxc(source,'onboarding.jsx',{jsx:{runtime:'classic'}});
  // Separate module scope matches the prototype loader.
  vm.runInNewContext(code,{window,console});
  const html=renderToStaticMarkup(React.createElement(window.Landing));
  assert.equal((html.match(/로 로그인/g)||[]).length,2);
  assert.ok(html.includes('/auth/google.svg')&&html.includes('/auth/kakao.svg'));
  assert.ok(!/기존 이메일|시작하기|이미 계정/.test(html));
});
