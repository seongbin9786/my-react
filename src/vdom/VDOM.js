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
        // JSX가 null을 반환한 경우 -> 빈 DOM
        // 빈 DOM <=> $current = null 이고 childVDOM = [] 이다.
        const domSpec = this.#isComponentType() ? this.#componentDOMSpec : this.#domSpec;
        const jsxIsNull = domSpec === null;
        if (jsxIsNull) {
            // this.#domSpec은 항상 값이 있다. 애초에 new VDOM()은 DOMSpec이 null일 때 호출되지 않는다.
            debug(`[createDOM]: JSX [${this.#domSpec.type}] returns null --> NO DOM`);
            this.#$current = null;
            this.#childVDOMs = [];
            return;
        }

        // 본인이 컴포넌트이고 그 컴포넌트가 또 컴포넌트를 반환한 경우 -> 새 VDOM을 자식으로 생성
        // Q. 컴포넌트가 아니어도 컴포넌트를 반환하면 어차피 VDOM을 새로 만들어야 되는 거 아닌가요?
        const isComponentAndChildIsComponent = 
            this.#isComponentType() && 
            this.#isComponent(this.#componentDOMSpec?.type);
        if (isComponentAndChildIsComponent) {
            debug(`[createDOM]: component's child is component [${this.#componentDOMSpec.type}] --> NO DOM, new VDOM`);
            this.#$current = null;
            this.#childVDOMs = [ new VDOM(this.#componentDOMSpec, this) ];
            return;
        }

        // JSX든, JSX가 반환한 컴포넌트든 DOM을 반환한 경우
        debug('[createDOM]:', domSpec.type, domSpec.props, domSpec);
        this.#$current = new DOMRenderer().makeDOM(domSpec);
        // VDOM을 만들면 VDOM이 알아서 DOM도 만들어주니, 직접 DOM을 만들기보다, 각 VDOM에서 알아서 VDOM을 만드는 게 더 좋다.
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

    /**
     * DOM을 생성할 때 컴포넌트 타입인 경우 Renderer가 생성할 수 없고, 다시 new Component() 후 render()의 결과물에 대해 Renderer에게 위임해야 한다.
     * 이렇게 되면 로직이 재귀적으로 반복되기 때문에, 이를 새로운 VDOM에 위임하는 것으로 해결한다.
     */
    #createDOMAsChildForComponentType(newChildDOMSpec) {
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
        this.#component?.componentWillUnmount();

        // VDOM이 컴포넌트 타입이고, 컴포넌트를 반환한 경우 $current = null이다.
        if (this.#isComponentType() && this.#isComponent(this.#componentDOMSpec.type)) {
            const childVDOM = this.#childVDOMs[0];
            childVDOM.#removeDOM(); // Component를 반환하는 Component가 아닐 때까지 재귀 호출
            return;
        }

        // null
        if (!this.#$current) {
            return;
        }

        debug('removeDOM:', this.#$parent, this.#$current, this);

        /*
        본인의 HTML Element가 null이지만
        본인이 반환한 Component의 Element는 null이 아닐 수 있다.
        이 경우 해당 Element를 제거해줘야 한다.
        */
        const $child = this.#$current ?? this.#childVDOMs[0].#$current;
        this.#$parent.removeChild($child);
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

            const nextComponentSpec = this.#reRenderComponentWithNextProps(nextDOMSpec);
            debug(`replaceOrUpdate Update [Component: ${oldDOMSpec.type}]`, oldComponentSpec, "-->", nextComponentSpec);
            this.#updateDOMOfComponent(nextComponentSpec);
            this.#componentDOMSpec = nextComponentSpec;
            return;
        }
        
        // CASE 2-2. DOM -> DOM
        debug(`replaceOrUpdate: Update [DOM: ${oldDOMSpec.type}]`, oldDOMSpec, "-->", nextDOMSpec);
        this.#updateDOM(nextDOMSpec);

        this.#domSpec = nextDOMSpec;
    }

    /**
     * 부모 DOM 변경으로 본인이 re-render 하게 될 때
     * this.#componentDOMSpec을 직접 갱신하지는 않는다.
     */
    #reRenderComponentWithNextProps(nextDOMSpec) {
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

    #isComponent(type) {
        return type.prototype instanceof Component;
    }

    /** 
     * VDOM 인스턴스가 Component Type인지 여부를 반환.
     * 
     * 반환하는 JSX와는 상관이 없음.
     */
    #isComponentType() {
        const { type } = this.#domSpec;
        const isComponent = this.#isComponent(type);
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
        const constructor = type;
        const component = new constructor(props);
        this.#component = component;
        this.#componentDOMSpec = component.render(); // null일 수 있음, 컴포넌트일 수 있음.
        // domSpec은 컴포넌트. current는 null ?

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
            this.#childVDOMs = []; // Q. Child VDOM 각각의 참조들을 제거해줘야 하는 거 아닐까요?
            return;
        }

        // CASE 3. null -> DOM | ComponentType
        if (!this.#componentDOMSpec && nextComponentDOMSpec) {
            this.#componentDOMSpec = nextComponentDOMSpec;
            // ComponentType인 경우에는 component를 만들고, render를 호출해줘야 함.
            // 이 동작은 이미 VDOM에 캡슐화되어 있으므로, 신규 VDOM을 생성하는 것으로 해결
            if (this.#isComponent(nextComponentDOMSpec.type)) {
                this.#createDOMAsChildForComponentType(nextComponentDOMSpec);
                return;
            }
            // 일반 DOM인 경우
            this.#createDOM();
            this.#mountToDOM();
            return;
        }

        // 여기서부턴 DOM|Component -> DOM|Component

        // 같은 타입이 아니면 update는 불가능 (여기에 도달한 것은 논리 오류)
        if (this.#componentDOMSpec.type !== nextComponentDOMSpec.type) {
            throw new Error(`[VDOM] [${this.#componentDOMSpec.type}] 컴포넌트가 반환한 DOM의 type이 달라 렌더링할 수 없습니다.`);
        }
        
        // 여기서부터 동일 타입

        // CASE 4. 컴포넌트가 동일 컴포넌트 반환
        // FIXME: 큰 설계 개선이 필요할 듯. 그리고 어떤 Case가 있는지 전수 조사도 필요할 듯.
        const justPropsChange = 
            this.#isComponent(this.#componentDOMSpec.type) &&
            this.#isComponent(nextComponentDOMSpec.type);
        if (justPropsChange) {
            const childVDOM = this.#childVDOMs[0];
            childVDOM.#replaceOrUpdate(nextComponentDOMSpec); // e.g. Layout -> Layout
            return;
        }

        // CASE 5. TODO: VDOM -> VDOM case도 있을 듯.. (현재는 이런 case가 없지만 추후 자주 발생할 듯)

        // CASE 6. DOM -> DOM
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
