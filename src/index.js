import { VDOM } from './vdom/VDOM.js';
import { TTJSXFactory } from './parsers/taggedtemplates/TTJSXFactory.js';
export { Component } from './components/Component.js';

// 디버그 메시지 출력이 필요할 때 사용한다.
export { enableDebugModule } from './debug/debug.js';

// tagged template을 반환할 때 사용한다.
// 싱글톤 팩토리로 사용한다.
const factory = new TTJSXFactory();
export const jsx = (strings, ...values) => factory.parseTTJSX(strings, values);

// 루트 요소를 렌더링한다.
export const renderRoot = (domSpec, $root) => new VDOM(domSpec, null, $root);
