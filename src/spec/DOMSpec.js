// Validation + Immutable
/**
 * HTML 메타데이터 형식을 표현하는 값 객체
 */
export class DOMSpec {

    #type;
    #props;
    #children;

    constructor(type, { children = [], ...props }) {
        this.#type = type;
        this.#props = props;
        this.#children = children;
    }

    get type() {
        return this.#type;
    }

    get props() {
        return this.#props;
    }

    get children() {
        return this.#children;
    }
}
