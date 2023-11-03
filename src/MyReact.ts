import { VNodeFactory } from "./nodes/NodeFactory";
import { AnySpec } from "./specs/AnySpec";

export class MyReact {
    private readonly nodeFactory: VNodeFactory;

    constructor(nodeFactory: VNodeFactory) {
        this.nodeFactory = nodeFactory;
    }

    render(rootDomSpec: AnySpec | null, parentElement?: HTMLElement) {
        console.log("render:", rootDomSpec, parentElement);

        if (!parentElement) {
            throw new Error("[MyReact] 렌더링할 부모 Element가 없습니다.");
        }

        if (!(rootDomSpec instanceof AnySpec)) {
            throw new Error(
                "[MyReact] render 요청된 객체가 DomSpec 유형이 아니므로 렌더링할 수 없습니다.",
            );
        }

        const rootNode = this.nodeFactory.createVNode(rootDomSpec, parentElement);
        console.log("rootNode:", rootNode);
        rootNode.newRender();
    }
}
