import { AnySpec } from "./AnySpec";

export class HTMLSpec extends AnySpec {
    private readonly _type: string;
    private readonly _props: object | null;
    private readonly _children: AnySpec[];

    constructor(type: string, props: object | null, children: AnySpec[]) {
        super();
        this._type = type;
        this._props = props || {};
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
