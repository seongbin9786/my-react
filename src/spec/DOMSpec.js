// Validation + Immutable
import { createDebug } from "../debug/debug.js";
import { Component } from "../components/Component.js";

const debug = createDebug('DOMSpec');

/**
 * HTML 메타데이터 형식을 표현하는 값 객체
 */
export class DOMSpec {

    #type;
    #props;
    #children;

    /**
     * @param {string | Component} type
     * @param {object} props null이 아닌 object 
     */
    constructor(type, { children = [], ...props }) {
        this.#type = type;
        this.#props = props;
        this.#children = children;

        debug(this.#debug());
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

    /**
     * 디버그 용도로 출력
     */
    #debug() {
        return `
            type: ${this.#type.prototype instanceof Component ? this.#type.name : this.#type}
            props: ${JSON.stringify(this.#props)}
            children: ${this.#children.map((child) => {
                if (child instanceof DOMSpec) {
                    return child.#debug();
                }
                return child;
            })}
        `;
    }
}
