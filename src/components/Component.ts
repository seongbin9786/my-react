// 단순한 컴포넌트 정의
// 객체에서 class로 변경하기로 결정 (타입 체크 필요)
import { AnySpec } from "../specs/AnySpec";

export const setProps = Symbol("MyReact.setProps");
export const addListener = Symbol("MyReact.addListener");
export const removeListener = Symbol("MyReact.removeListener");

type NewStateListener = (nextState: object) => void;

export abstract class Component {
    protected _state: object;
    private _props: object;
    private _listeners: NewStateListener[];

    // 흠? 이게 강제가 안되나?
    // 구현체 입장에선 필수로 호출해야 하는데,
    // 구현체가 해당 signature일 필욘 없음
    constructor() {
        this._state = {};
        this._props = {};
        this._listeners = [];
    }

    [setProps](props: object) {
        this._props = props;
    }

    // 생성자에서 사용하는 용도
    set state(newState: object) {
        this._state = newState;
    }

    // this.state로 접근할 수 있도록
    get state() {
        return this._state;
    }

    // this.props로 접근할 수 있도록
    get props() {
        return this._props;
    }

    setState(nextState: object): void {
        // merge 방식
        this._state = {
            ...this._state,
            ...nextState,
        };

        for (const listener of this._listeners) {
            listener(this._state);
        }
    }

    [addListener](listener: NewStateListener) {
        this._listeners.push(listener);
    }

    [removeListener](toFind: NewStateListener) {
        const registeredIdx = this._listeners.findIndex((cur) => cur === toFind);
        if (registeredIdx === -1) {
            throw new Error(
                "[MyReact] [Component#removeListener] 등록되지 않은 listener를 제거하려 시도했습니다.",
            );
        }
        this._listeners.splice(registeredIdx, 1);
    }

    // 필수 구현으로 지정
    abstract render(): AnySpec | null; // 단일 element 반환 혹은 null 반환
}

// 추상 클래스인 Component 타입으로 인자를 받는 경우 생성이 불가
// 되게 이상한 점은 추상 클래스 타입의 인스턴스는 구체 클래스의 인스턴스일 수 밖에
// 없다는 점인데...
// TODO: 이 상황을 이해하기
export type ConcreteComponent = Component & {
    new (): Component;
};
