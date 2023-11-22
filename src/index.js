import { VDOM } from './vdom/VDOM.js';

export { Component } from './components/Component.js';

// 컴포넌트를 등록한다.
export const registerComponent = (name, constructor) => {
    VDOM.componentMap.set(name, constructor);
}

// 루트 요소를 렌더링한다.
export const renderRoot = (domSpec, $root) => new VDOM(domSpec, null, $root);
