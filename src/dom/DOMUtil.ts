import { TEXT_ELEMENT } from "../shared/constants";

// TODO: 전역으로 만들어서 싱글턴으로 공유하는 게 좋겠다.
export class DOMUtil {
    static attachProperties = (element: HTMLElement | Text, props: object | null) => {
        // 1. props가 없는 경우
        if (props === null) {
            return;
        }

        // 2. props 분류
        const propEntries = Object.entries(props);
        const eventListeners = propEntries.filter(([key]) => key.startsWith("on"));
        const simpleProps = propEntries.filter(([key]) => !key.startsWith("on"));
        console.log("[DOMUtil] [attachProperties] element:", element, "props:", props);

        // 3. event listener 등록
        eventListeners.forEach(([name, listener]) => {
            const eventType = name.substring(2).toLocaleLowerCase();
            element.addEventListener(eventType, listener);
            console.log(`[DOMUtil] [attachProperties] added eventListener: ${eventType}`);
        });

        // 4. 단순 props 추가
        simpleProps.forEach(([key, value]) => {
            console.log(`[DOMUtil] [attachProperties] added simpleProps: ${key}=${value}`);
            // FIXME: 좋은 타입 완성하기
            // readonly 프로퍼티를 제외한 타입을 직접 만들어야 하는 것 같다.
            // @ts-ignore
            element[key as T] = value;
        });
    };

    static removeProperties = (element: HTMLElement | Text, props: object | null) => {
        // 1. props가 없는 경우
        if (props === null) {
            return;
        }

        // 2. props 분류
        const propEntries = Object.entries(props);
        const eventListeners = propEntries.filter(([key]) => key.startsWith("on"));
        const simpleProps = propEntries.filter(([key]) => !key.startsWith("on"));

        // 3. event listener 제거
        eventListeners.forEach(([name, listener]) => {
            const eventType = name.substring(2).toLocaleLowerCase();
            element.removeEventListener(eventType, listener);
        });

        // 4. 단순 props 제거
        simpleProps.forEach(([key]) => {
            // FIXME: 좋은 타입 완성하기
            // @ts-ignore
            delete element[key];
        });
    };

    static createDOMElement = (type: string, props: object | null): HTMLElement | Text => {
        // 텍스트 노드인 경우 이후 props 지정에서 수행
        console.log("[DOMUtil] [createDOMElement] type:", type, ", props:", props);
        const domElement =
            type === TEXT_ELEMENT ? document.createTextNode("") : document.createElement(type);

        DOMUtil.attachProperties(domElement, props);
        return domElement;
    };
}
