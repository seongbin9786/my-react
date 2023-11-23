import { Component, addDOMSpecChangeListener } from "../components/Component.js";
import { DOMRenderer } from "../renderers/DOMRenderer.js";
import { DOMSpec } from "../spec/DOMSpec.js";
import { createDebug } from "../debug/debug.js";

const debug = createDebug('VDOM');

/**
 * DOM Spec을 받아 렌더링한다.
 * 
 * 이후 렌더링 시 DOM Spec을 받아 직전 DOM Spec과 비교해
 * DOM 추가/변경/제거를 수행한다.
 * 
 * DOM Spec이 Component 타입인 경우,
 * Component의 직전 JSX, 자식 컴포넌트를 소유하고, 
 * 이 정보를 바탕으로 적절히 리-렌더링한다.
 * 
 * 각 DOM 별로 인스턴스 하나가 대응된다.
 */
export class VDOM {

    // 사용자는 컴포넌트 타입을 (String, constructor)로 등록한다.
    static componentMap = new Map();

    /** @type {VDOM | null} */          #parentVDOM;
    /** @type {VDOM[]} */               #childVDOMs;
    /** @type {HTMLElement | null} */   #$current;
    /** @type {HTMLElement | null} */   #$root;

    /** @type {DOMSpec | null} */       #domSpec;
    /** @type {DOMSpec | null} */       #componentDOMSpec;
    /** @type {Component | null} */     #component;

    /**
     * @param {DOMSpec} domSpec 
     * @param {VDOM} parentVDOM
     * @param {HTMLElement | undefined} $root root 요소를 렌더링할 때만 사용
     */
    constructor(domSpec, parentVDOM, $root) {

        if (!parentVDOM && !$root) {
            throw new Error(`[VDOM] [${domSpec.type}] 부모 VDOM 혹은 root DOM 요소가 입력되지 않았습니다.`)
        }

        this.#domSpec = domSpec;
        this.#parentVDOM = parentVDOM;
        this.#$root = $root;
        this.#createComponent();
        this.#createDOM();
        this.#mountToDOM();
        this.#callComponentDidMount();
    }

    #createDOM() {
        const domSpec = this.#isComponentType() ? this.#componentDOMSpec : this.#domSpec;

        if (domSpec == null) {
            debug(`createDOM: component [${this.#domSpec.type}] returns null --> NO DOM`);
            this.#$current = null;
            this.#childVDOMs = [];
            return;
        }

        debug('createDOM:', domSpec.type, domSpec.props, domSpec);
        this.#$current = new DOMRenderer().makeDOM(domSpec);
        this.#childVDOMs = domSpec.children.map((childDOMSpec) => {
            return new VDOM(childDOMSpec, this);
        });
    }

    #mountToDOM() {
        if (this.#$current) {
            this.#$parent.appendChild(this.#$current);
        }
    }

    #callComponentDidMount() {
        // setTimeout을 활용해 동기적 렌더링이 끝난 후 호출되게 한다.
        // 컴포넌트 마운트 최초 1회에만 호출한다.
        setTimeout(() => {
            this.#component?.componentDidMount();
        });
    }

    /**
     * DOM 교체 시에는 VDOM도 교체해줘야 함.
     * @param {VDOM} newVDOM 
     * @param {VDOM} oldVDOM 
     */
    #replaceDOM(newVDOM, oldVDOM) {
        debug('replaceDOM:', newVDOM, oldVDOM);

        const oldVDOMIdx = this.#childVDOMs.findIndex((child) => child === oldVDOM);
        this.#childVDOMs.splice(oldVDOMIdx, 1, newVDOM);

        this.#$current.replaceChild(newVDOM.#$current, oldVDOM.#$current);
    }

    #replaceWithNew(nextSpec) {
        debug("createToReplace:", nextSpec);
        if (!this.#parentVDOM) {
            throw new Error('[VDOM] root 요소의 re-render 결과가 서로 다른 태그입니다.');
        }
        const nextVDOM = new VDOM(nextSpec, this.#parentVDOM);
        this.#parentVDOM.#replaceDOM(nextVDOM, this);
    }

    /**
     * DOM -> DOM
     * 본인은 props만 갱신하고, 자식을 갱신한다.
     * 생성, 교체, 제거의 경우는 미리 해결되어야 한다.
     * 
     * @param {DOMSpec} nextSpec DOM의 domSpec이다.
     */
    #updateDOM(nextSpec) {
        // 1. 본인 props 바꾸기
        debug('updateDOM:', this.#domSpec, nextSpec);
        new DOMRenderer().updateDOM(this.#$current, this.#domSpec, nextSpec);

        // 2. 자식 점검하기
        const nextChildDOMSpecs = nextSpec.children;
        debug("nextChildDomSpecs:", nextChildDOMSpecs);
        
        // 2-1. 기존 child 변경
        const maxLength = Math.max(this.#childVDOMs.length, nextChildDOMSpecs.length);
        for (let idx = 0; idx < maxLength; idx++) {
            const childVDOM = this.#childVDOMs[idx];
            const nextChildSpec = nextChildDOMSpecs[idx];

            // 2-3. 신규 child 추가
            if (!childVDOM) {
                const newChildDOMSpecs = nextChildDOMSpecs.slice(idx);
                this.#createChildren(newChildDOMSpecs);
                return;
            }

             // 2-2. 기존 child 제거
            if (!nextChildSpec) {
                this.#removeChildren(idx);
                return;
            }

            // 신규, 제거 CASE는 아님.
            // Replace, Update 뿐임.
            childVDOM.#replaceOrUpdate(nextChildSpec);
        }
    }

    #createChild(newChildDOMSpec) {
        debug("newChildSpec:", newChildDOMSpec);
        const newVDOM = new VDOM(newChildDOMSpec, this);
        this.#childVDOMs.push(newVDOM);
        debug('AFTER ADD CHILD:', this.#childVDOMs);
    }

    #createChildren(newChildDOMSpecs) {
        for (const newChildSpec of newChildDOMSpecs) {
            debug("newChildSpec:", newChildSpec);
            const newVDOM = new VDOM(newChildSpec, this);
            this.#childVDOMs.push(newVDOM);
        }
        debug('AFTER ADD CHILDREN:', this.#childVDOMs);
    }

    #removeChildren(nextChildSize) {
        while (this.#childVDOMs.length > nextChildSize) {
            const childVDOM = this.#childVDOMs.pop();
            childVDOM.#removeDOM();
        }
        debug('AFTER REMOVE CHILDREN:', this.#childVDOMs);
    }

    #removeDOM() {
        // TODO: 컴포넌트가 제거되지 않고 null을 렌더링할 때에도
        // unmount가 호출되는지 확인해보기
        // 어떤 게 더 좋은지 고민해보기
        this.#component?.componentWillUnmount?.();

        if (!this.#$current) {
            return;
        }
        debug('removeDOM:', this.#$parent, this.#$current, this);
        this.#$parent.removeChild(this.#$current);
    }

    /**
     * 본인의 혹은 부모의 re-render에 따른 DOMSpec 변경을 반영한다.
     * 신규 생성, 제거의 경우는 포함되지 않는다.
     * 컴포넌트 일수도, 아닐 수도 있다.
     * @param {DOMSpec} nextDOMSpec componentSpec은 오지 않는다. null이 올 수는 있다.
     */
    #replaceOrUpdate(nextDOMSpec) { 
        const oldDOMSpec = this.#domSpec;
        const oldComponentSpec = this.#componentDOMSpec;

        // 루트 교체 CASE
        // CASE 1. VDOM 교체 (루트 요소 교체됨)
        // 컴포넌트 여부와 상관 업음
        if (oldDOMSpec.type !== nextDOMSpec.type) {
            debug(`replaceOrUpdate: Replace [DOM: ${oldDOMSpec.type}]`, oldDOMSpec, "-->", nextDOMSpec);
            this.#replaceWithNew(nextDOMSpec);
            return;
        }

        // 루트 props만 변경 CASE
        // 즉 component의 부모로 인한 re-render는 여기에서만 발생한다.
        // CASE 2-1. 컴포넌트 -> 동일 컴포넌트
        if (this.#isComponentType()) {
            this.#domSpec = nextDOMSpec;

            const shouldRerender = this.#component.shouldComponentUpdate(nextDOMSpec.props);
            if (!shouldRerender) {
                debug(`skipped re-render: [Component: ${this.#domSpec.type}].shouldComponentUpdate = false`);
                return;
            }

            const nextComponentSpec = this.#renderComponent(nextDOMSpec);
            debug(`replaceOrUpdate Update [Component: ${oldDOMSpec.type}]`, oldComponentSpec, "-->", nextComponentSpec);
            this.#updateDOMOfComponent(nextComponentSpec);
            this.#componentDOMSpec = nextComponentSpec;
            return;
        }
        
        // CASE 2-2. DOM -> 
        debug(`replaceOrUpdate: Update [DOM: ${oldDOMSpec.type}]`, oldDOMSpec, "-->", nextDOMSpec);
        this.#updateDOM(nextDOMSpec);

        this.#domSpec = nextDOMSpec;
    }

    /**
     * 부모 DOM 변경으로 본인이 re-render 하게 될 때
     * this.#componentDOMSpec을 직접 갱신하지는 않는다.
     */
    #renderComponent(nextDOMSpec) {
        if (!this.#isComponentType()) {
            throw new Error(`[VDOM] [${this.#domSpec.type}] 컴포넌트가 아닌 요소가 re-render를 시도했습니다.`);
        }

        // 컴포넌트에게 children을 전달하기 위함
        // e.g. <Folder><File /></Folder> 이면 <File />이 children
        // 컴포넌트는 ${props.children} 으로 렌더링 여부와 위치를 결정하게 됨
        const nextProps = {
            ...nextDOMSpec.props,
            children: nextDOMSpec.children
        };
        debug('rerender - nextProps:', nextProps, 'on', this.#component);
        this.#component.props = nextProps;

        return this.#component.render();
    }

    /**
     * 컴포넌트가 (컴포넌트 | null)을 jsx로 반환하는 경우는 컴포넌트의 current가 null일 수 있음 --> 로딩 시 null 후 컴포넌트 반환
     * 이 때는 자식 컴포넌트가 마운트할 때 부모의 HTML Element가 null임.
     * 이 때는 해당 컴포넌트의 부모 VDOM의 HTML Element에 마운트 해야 함.
     * 이 때는 재귀적으로 찾아서 올라가야 함 --> (컴포넌트|null)을 반환하는 컴포넌트가 중첩된 경우.
     * 
     * 만약 부모 컴포넌트가 컴포넌트 타입이 아닌데도 $current=null 이면 예외 상황임. (발생 불가능할 것으로 예상)
     */
    #findParentDOM() {
        if (this.#$root) {
            return this.#$root;
        }
        if (this.#parentVDOM.#$current) {
            return this.#parentVDOM.#$current;
        }

        return this.#parentVDOM.#findParentDOM();
    }

    get #$parent() {
        const $parent = this.#findParentDOM();
        if (!$parent) {
            const message = "부모 HTML Element를 찾을 수 없습니다.";
            debug(message);
            throw new Error(message);
        }
        return $parent;
    }

    #isComponentName(type) {
        return type[0] >= 'A' && type[0] <= 'Z';
    }

    /** 
     * VDOM 인스턴스가 Component Type인지 여부를 반환.
     * 
     * 반환하는 JSX와는 상관이 없음.
     */
    #isComponentType() {
        const { type } = this.#domSpec;
        const isComponent = this.#isComponentName(type);
        debug("isComponentName:", type, isComponent);
        return isComponent;
    }

    /**
     * DOMSpec이 컴포넌트인 경우 컴포넌트 인스턴스를 생성한다.
     * componentDOMSpec과는 상관 없다.
     */
    #createComponent() {
        if (!this.#isComponentType()) {
            return;
        }
        
        const { type, props } = this.#domSpec;
        debug('creating component:', type);
        const constructor = VDOM.componentMap.get(type);
        const component = new constructor(props);
        this.#component = component;
        this.#componentDOMSpec = component.render(); // null일 수 있음

        // 차후 렌더링 시 update 호출하도록
        const listener = this.#handleComponentUpdate.bind(this);
        component[addDOMSpecChangeListener](listener);
    }
    
    /**
     * 컴포넌트의 전/후 DOMSpec을 반영한다.
     * 
     * 컴포넌트가 반환하는 JSX만 달라지고, 
     * 컴포넌트에 대응되는 VDOM의 인스턴스는 유지되는 경우.
     */
    /** @param {DOMSpec} nextComponentDOMSpec */
    #updateDOMOfComponent(nextComponentDOMSpec) {
        // CASE 1. null -> null
        if (!this.#componentDOMSpec && !nextComponentDOMSpec) {
            return;
        }
        
        // CASE 2. DOM -> null
        if (this.#componentDOMSpec && !nextComponentDOMSpec) {
            this.#removeDOM();
            return;
        }

        // CASE 3. null -> DOM | ComponentType
        if (!this.#componentDOMSpec && nextComponentDOMSpec) {
            this.#componentDOMSpec = nextComponentDOMSpec;
            // ComponentType인 경우에는 component를 만들고, render를 호출해줘야 함.
            // 이 동작은 이미 VDOM에 캡슐화되어 있으므로, 신규 VDOM을 생성하는 것으로 해결
            if (this.#isComponentName(nextComponentDOMSpec.type)) {
                this.#createChild(nextComponentDOMSpec);
                return;
            }
            // 일반 DOM인 경우
            this.#createDOM();
            this.#mountToDOM();
            return;
        }

        // CASE 4. DOM -> DOM
        // 무조건 같은 type을 반환해야 함.
        // FIXME: 이게 React에서도 되는 경우면 replace 하기
        if (this.#componentDOMSpec.type !== nextComponentDOMSpec.type) {
            throw new Error(`[VDOM] [${this.#componentDOMSpec.type}] 컴포넌트가 반환한 DOM의 type이 달라 렌더링할 수 없습니다.`);
        }
        this.#updateDOM(nextComponentDOMSpec);
    }

    /** 소유한 Component의 상태가 변경될 때 호출되는 핸들러. 스스로 제거하는 경우는 없다. */
    #handleComponentUpdate() {
        const nextComponentDOMSpec = this.#component.render();
        debug('handleComponentUpdate:', nextComponentDOMSpec);
        this.#updateDOMOfComponent(nextComponentDOMSpec);
        this.#componentDOMSpec = nextComponentDOMSpec;
    }
}
