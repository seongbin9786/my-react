// 사용자는 new로 컴포넌트를 생성하지 않는다.
export const addDOMSpecChangeListener = Symbol('Component/addDOMSpecChangeListener');

/**
 * 사용자를 위한 Component API
 * 
 * 해당 컴포넌트를 상속한 후 setState() 호출 시 re-render 된다.
 */
export class Component {

    state;
    props;

    #domSpecListeners;

    constructor(props) {
        this.props = props;
        this.#domSpecListeners = [];
    }

    /**
     * @public
     * 화면에 표시될 다음 DOMSpec을 반환한다.
     * 
     * @returns {DOMSpec} DOMSpec
     */
    render() {
        throw new Error('컴포넌트는 render() 매소드를 구현해야 합니다.');
    }

    /**
     * @protected
     */
    setState(nextState) {
        // merge state 방식으로 수행
        this.state = {
            ...this.state,
            ...nextState
        };

        this.#notifyDOMSpecChange();
    }

    shouldComponentUpdate(_nextProps) {
        return true;
    }

    // 내부 구현 용도로 노출하지 않게
    [addDOMSpecChangeListener](listener) {
        this.#domSpecListeners.push(listener);
    }
 
    #notifyDOMSpecChange() {
        this.#domSpecListeners.forEach((listener) => listener());
    }
}
