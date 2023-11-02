// 특이한 점은 Component를 직접 생성하고 instance의 생명 주기를 관리해야 한다는 점임.

import { Component, setProps } from "../components/Component";
import { DOMUpdater } from "../dom/DOMUpdater";
import { ComponentSpec } from "../specs/ComponentSpec";
import { VNodeFactory } from "./NodeFactory";
import { VNode } from "./VNode";

// 벌써 신남. HTML Node와 Component Node를 분리할 수 있다는 게 너무 신남 호호
export class VComponentNode implements VNode {
    // Spec 수준
    private mySpec: ComponentSpec;

    // VDOM 수준
    private instance: Component | undefined;
    private childVDOMNode: VNode | null | undefined;
    private readonly nodeFactory: VNodeFactory;

    // DOM 수준
    private readonly domUpdater: DOMUpdater;

    constructor(spec: ComponentSpec, domUpdater: DOMUpdater, factory: VNodeFactory) {
        this.mySpec = spec;
        this.domUpdater = domUpdater;
        this.nodeFactory = factory;
    }

    // 인스턴스 생성하고, 본인의 render();가 반환하는 새로운 VNode에게 위임만 하면 끝.
    newRender() {
        // 1. Component 인스턴스 생성하기
        const instance = this.createInstance(this.mySpec);
        const childAnySpec = instance.render();

        // 2-1. null 반환했으므로, 렌더링에서 아무것도 하지 않음.
        // VDOMNode가 null이므로 re-render 시 반영
        if (childAnySpec === null) {
            this.childVDOMNode = null;
            return;
        }

        // 2-2. Component가 반환한 Node를 생성하고, 렌더링을 호출
        // 단순히 domUpdater만 전달하고 종료함.
        // 실제 HTML을 렌더링하는 경우, child가 알아서 마운트할 것임.
        const childVDOMNode = this.nodeFactory.createVNode(
            childAnySpec,
            this.domUpdater,
            this.nodeFactory,
        );
        childVDOMNode.newRender();
        this.childVDOMNode = childVDOMNode;
    }

    // 엥?? 아래 내용은 틀렸음. 아직 컴포넌트의 re-render는 구현 안 했음.
    // 이거 같은 경우는 부모가 신규 Spec을 반환한 경우임.
    // 내 컴포넌트가 스스로 리-렌더했으면 newSpec을 입력받을 필요가 없죠?
    //
    //
    // ---> 아래는 어떻게 구현해야? <---
    // Component VDOM Node의 re-render는 현재 컴포넌트가 호출하거나 부모가 변경될 때 호출됨
    // 현재 컴포넌트의 render가 null을 반환한 경우 newSpec이 null일 수 있음.
    reRender(newSpec: ComponentSpec | null) {
        if (!this.instance) {
            throw new Error("인스턴스가 초기화되지 않은 상태에서 re-render가 호출되었습니다.");
        }

        // 1. 삭제하는 경우
        if (newSpec === null) {
            // 기존에 VDOM이 있던 경우
            if (this.childVDOMNode) {
                this.childVDOMNode.removeSelf();
                this.childVDOMNode = null;
            }
            return;
        }

        const { type } = this.mySpec;
        const { type: newType } = newSpec;

        // 2. 기존 child가 null인 경우 - 신규 인스턴스 생성 및 DOM 추가
        if (!this.childVDOMNode) {
            this.mySpec = newSpec;
            this.newRender();
            return;
        }

        // 3. type이 달라진 경우 - 신규 인스턴스 생성 및 DOM 교체
        if (type !== newType) {
            // replace 여부는 HTML Node가 알아서 수행
            // 근데 newSpec이 null인건 체크해줘야? 아 어차피 위에서 했네
            this.childVDOMNode.reRender(newSpec);
            return;
        }

        // 4. 기존 Component를 재사용하는 경우
        const newChildSpec = this.instance.render(); // 신규 props 포함

        // 5. 다음 render가 null인 경우 re-render하지 않음.
        if (!newChildSpec) {
            this.childVDOMNode = null;
            return;
        }

        // 6. 다음 render가 유의미한 경우. childNode에 위임
        this.childVDOMNode.reRender(newChildSpec);
    }

    removeSelf() {
        if (!this.childVDOMNode) {
            return null;
        }
        // HTML Node를 만나게 되면 해당 Node에서 removeChild(); 호출하고 종료됨.
        this.childVDOMNode.removeSelf();
    }

    private createInstance(spec: ComponentSpec) {
        console.log("createInstance:", spec);
        const { type, props } = spec;
        const instance = new type();
        if (props !== null) {
            instance[setProps](props);
        }
        return instance;
    }
}
