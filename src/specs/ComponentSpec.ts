import { ConcreteComponent } from "../components/Component";
import { AnySpec } from "./AnySpec";

// TODO: Q. getter 때문에 property가 겹쳐서 필드 prefix로 _를 붙이는 게 맞을까?
export class ComponentSpec extends AnySpec {
    private readonly _type: ConcreteComponent;
    private readonly _props: object | null;
    private readonly _children: AnySpec[];

    constructor(type: ConcreteComponent, props: object | null, children: AnySpec[]) {
        super();
        this._type = type;
        this._props = props || {}; // null을 고려하는 경우의 수 없게 한다.
        this._children = children;
    }

    get type() {
        return this._type;
    }

    get props() {
        return this._props;
    }

    get children() {
        return this._children;
    }
}
