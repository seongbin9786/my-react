import { DOMSpec } from "../spec/DOMSpec.js";
import { createDebug } from "../debug/debug.js";

const debug = createDebug("Renderer");

/**
 * DOM Spec을 받아 DOM 객체를 생성해 반환하거나,
 * 기존 DOM 객체의 프로퍼티를 덮어쓴다.
 */
export class DOMRenderer {

    /**
     * @param {DOMSpec} domSpec 
     * @returns {HTMLElement}
     */
    makeDOM(domSpec) {
        const $target = this.#createHTMLElement(domSpec.type);
        this.#attachProperties($target, domSpec);
        return $target;
    }

    /**
     * @param {HTMLElement} $target 
     * @param {DOMSpec} oldSpec 
     * @param {DOMSpec} nextSpec
     */
    updateDOM($target, oldSpec, nextSpec) {
        debug('[updateDOM]', oldSpec, nextSpec);
        this.#removeProperties($target, oldSpec);
        this.#attachProperties($target, nextSpec);
    }

    #createHTMLElement(type) {
        if (type === "__TEXT") {
            return document.createTextNode("");
        }

        try {
            return document.createElement(type);
        } catch (e) {
            debug(`[${type}]는 브라우저에서 지원하지 않는 태그입니다.`);
        }
    };
    
    #attachProperties($target, domSpec) {
        const { props: { className, ...props } } = domSpec;

        debug('[attachProperties]', $target, props);

        // Text는 set/removeAttribute가 없다.
        if ($target instanceof Text) {
            $target.nodeValue = props.nodeValue;
            return;
        }
    
        // className 타입에 따라 다르게
        if (typeof className === "string" && className.length > 0) {
            $target.className = className;
        }
    
        if (className instanceof Array) {
            $target.className = className.join(" ");
        }
    
        // property 설정대로 추가
        for (const property of Object.keys(props)) {
            const isEventHandler = typeof props[property] === "function";
            if (isEventHandler) {
                $target[property] = props[property];
                continue;
            }
            // innerHTML을 프로퍼티로 설정하게
            if (property === "dangerouslySetInnerHTML") {
                $target.innerHTML = props[property];
                continue;
            }
            // input.value는 remove/setAttribute으로 기존 값을 바꿀 수 없음.
            if ($target.nodeName === "INPUT" && property === "value") {
                $target.value = props[property];
            }
            $target.setAttribute(property, props[property]);
        }
    };

    #removeProperties($target, props) {
        debug('[removeProperties]', $target, props);

        // Text는 set/removeAttribute가 없다.
        if ($target instanceof Text) {
            $target.nodeValue = null;
            return;
        }

        for (const property of Object.keys(props)) {

            // 이벤트 핸들러는 property 방식으로 등록
            const isEventHandler = typeof props[property] === "function";
            if (isEventHandler) {
                delete $target[property];
                continue;
            }

            // innerHTML 제거
            if (property === "dangerouslySetInnerHTML") {
                delete $target.innerHTML;
                continue;
            }

            // input.value는 remove/setAttribute으로 기존 값을 바꿀 수 없음.
            if ($target.nodeName === "INPUT" && property === "value") {
                $target.value = null;
            }

            // 그 외는 attribute 방식으로 등록
            $target.removeAttribute(property);
        }
    };
}
