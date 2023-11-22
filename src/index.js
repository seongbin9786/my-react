import { VDOM } from './vdom/VDOM.js';

export { Component } from './components/Component.js';

// 디버그 메시지 출력이 필요할 때 사용한다.
export { enableDebugModule } from './debug/debug.js';

// tagged template을 반환할 때 사용한다.
export { createDOMSpec as jsx } from './parsers/taggedtemplates/Parser.js';

// 컴포넌트를 등록한다.
export const registerComponent = (name, constructor) => {
    VDOM.componentMap.set(name, constructor);
}

// 루트 요소를 렌더링한다.
export const renderRoot = (domSpec, $root) => new VDOM(domSpec, null, $root);
