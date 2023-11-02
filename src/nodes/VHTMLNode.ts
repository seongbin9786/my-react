import { DOMUpdater } from "../dom/DOMUpdater";
import { DOMUtil } from "../dom/DOMUtil";
import { HTMLSpec } from "../specs/HTMLSpec";
import { VNodeFactory } from "./NodeFactory";
import { VNode } from "./VNode";

export class VHTMLNode implements VNode {
    // Spec 수준
    private mySpec: HTMLSpec;
    // VDOM 수준
    private childVDOMNodes: VNode[];
    private readonly nodeFactory: VNodeFactory;

    // DOM 수준
    private myElement: HTMLElement | Text | undefined;
    // 부모 DOM이 변경되는 경우 자식 Node를 모두 버리므로 갱신할 일 없음
    private readonly domUpdater: DOMUpdater;

    // DOMUpdater의 경우 부모 Node가 제공해야 함
    constructor(spec: HTMLSpec, domUpdater: DOMUpdater, factory: VNodeFactory) {
        this.mySpec = spec; // re-render 시 비교를 위해 메타데이터 저장
        this.domUpdater = domUpdater; // 부모 Element 참조 없이 DOM 사용
        this.childVDOMNodes = [];
        this.nodeFactory = factory;
    }

    // 부모로부터 호출됨
    // 본인 및 자식의 DOM 생성하고 마운트함
    newRender() {
        const myElement = this.createDOMElements();
        this.domUpdater.appendChild(myElement);
        console.log(`[HTML] newRender:`, myElement, "--child-->", this.domUpdater);

        this.myElement = myElement;
    }

    // 부모로부터 호출된다.
    // 기존 domSpec과 신규 domSpec을 비교해 DOM 교체/추가/삭제
    // htmlSpec은 null을 반환할 수가 없어 null이 아니며, 항상 기존 DOM이 존재한다.
    reRender(newSpec: HTMLSpec) {
        if (!this.myElement) {
            throw new Error("rerender 오류: HTML 노드가 이전에 렌더링되지 않았습니다.");
        }

        const { type, props } = this.mySpec;
        const { type: newType, props: newProps, children: newChildrenSpec } = newSpec;

        // CASE 1. 요소가 아예 다른 경우 - 제거 및 추가
        // 현재 위치를 지키기 위해 replace한다.
        if (type !== newType) {
            this.replaceRender(newSpec);
            return;
        }

        // CASE 2. 본인 Element 재활용
        DOMUtil.removeProperties(this.myElement, props);
        DOMUtil.attachProperties(this.myElement, newProps);

        // 각 자식들의 처분을 결정한다.

        // CASE 3-1. 기존-신규 domSpec 순서가 겹치는 경우
        // 스스로 재활용/신규/제거
        for (const [idx, newChildSpec] of newChildrenSpec.entries()) {
            const oldChildVNode = this.childVDOMNodes[idx];
            oldChildVNode.reRender(newChildSpec);
        }

        // CASE 3-2. domSpec이 원래보다 더 긴 경우
        // VDOM 생성 / DOM 추가
        const extraChildrenSpecs = newChildrenSpec.slice(this.childVDOMNodes.length);
        for (const extraChildSpec of extraChildrenSpecs) {
            const extraChildVNode = this.nodeFactory.createVNode(
                extraChildSpec,
                this.myElement,
                this.nodeFactory,
            );
            this.childVDOMNodes.push(extraChildVNode);
            extraChildVNode.newRender();
        }

        // CASE 3-3. domSpec이 원래보다 적은 경우
        // VDOM 제거 / DOM 제거
        const extraChildren = this.childVDOMNodes.slice(newChildrenSpec.length);
        for (const extraChild of extraChildren) {
            extraChild.removeSelf();
        }
    }

    // TODO: Q. 단순히 removeChild만 해도 메모리 해제가 될까?
    removeSelf() {
        if (!this.myElement) {
            throw new Error("remove 오류: 노드가 이전에 렌더링되지 않았습니다.");
        }
        this.domUpdater.removeChild(this.myElement);
    }

    private replaceRender(newSpec: HTMLSpec) {
        if (!this.myElement) {
            throw new Error("기존 Element가 없는데 Spec 교체가 호출됐습니다.");
        }

        const oldElement = this.myElement; // 기존 DOM

        this.mySpec = newSpec;
        const myElement = this.createDOMElements();
        this.domUpdater.replaceChild(oldElement, myElement);

        this.myElement = myElement;
    }

    private createDOMElements() {
        const { type, props, children } = this.mySpec;

        // 1. 본인 DOM 생성
        console.log("[HTML][createDOMElements] spec:", this.mySpec);
        const myElement = DOMUtil.createDOMElement(type, props);

        // 2. 자식 신규 생성 및 DOM 추가
        // myElement=Text일 때는 자식이 Spec 상에 없으므로 생략된다.
        for (const childSpec of children) {
            const domNode = this.nodeFactory.createVNode(childSpec, myElement, this.nodeFactory);
            this.childVDOMNodes.push(domNode);
            domNode.newRender();
        }
        console.log("[HTML][createDOMElements] created:", myElement);
        return myElement;
    }
}
