// 실제로는 부모 Element가 전달되지만 해당 함수만 노출하도록 인터페이스 구성
// 각 HTMLElement가 DOMUpdater를 구현하게 할 순 없으므로 TS 인터페이스는 좋은 선택이다.
export interface DOMUpdater {
    appendChild(newDomElement: HTMLElement | Text): void;
    replaceChild(mountedDomElement: HTMLElement | Text, newDomElement: HTMLElement | Text): void;
    removeChild(mountedDomElement: HTMLElement | Text): void;
}
