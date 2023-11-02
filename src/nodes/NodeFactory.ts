import { DOMUpdater } from "../dom/DOMUpdater";
import { AnySpec } from "../specs/AnySpec";
import { ComponentSpec } from "../specs/ComponentSpec";
import { HTMLSpec } from "../specs/HTMLSpec";
import { VComponentNode } from "./VComponentNode";
import { VHTMLNode } from "./VHTMLNode";
import { VNode } from "./VNode";

export class VNodeFactory {
    createVNode(spec: AnySpec, domUpdater: DOMUpdater, nodeFactory: VNodeFactory): VNode {
        if (spec instanceof HTMLSpec) {
            return new VHTMLNode(spec, domUpdater, nodeFactory);
        }

        if (spec instanceof ComponentSpec) {
            return new VComponentNode(spec, domUpdater, nodeFactory);
        }

        throw new Error("[MyReact] createVNode에 비정상 Spec이 입력되었습니다.");
    }
}
