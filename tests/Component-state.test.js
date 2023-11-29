import { describe, test, expect } from '@jest/globals';
import { Component, jsx, renderRoot } from '../src';

describe("Component State", () => {

    afterEach(() => {
        document.body.innerHTML = "";
    });

    test("state가 변경되면 리-렌더한다.", () => {
        // given
        class Counter extends Component {

            state = {
                counter: 0,
            };

            handleIncrease() {
                this.setState({ counter: this.state.counter + 1 });
            }

            render() {
                return jsx`
                    <button onclick=${this.handleIncrease.bind(this)}>
                        ${this.state.counter}
                    </button>
                `;
            }
        }
        const $body = document.getElementsByTagName('body').item(0);
        renderRoot(jsx`<${Counter} />`, $body);

        // when
        const $button = document.getElementsByTagName('button').item(0);
        $button.click();
        
        // then
        expect($button.textContent).toEqual("1");
    });
    
    test("setState는 입력 객체를 기존 상태에 병합한다.", () => {
        // given
        class Counter extends Component {

            state = {
                changingProperty: 0,
                anotherProperty: "anotherProperty",
            };

            changeProperty() {
                this.setState({ changingProperty: "someRandomValue" });
            }

            render() {
                return jsx`
                    <button onclick=${this.changeProperty.bind(this)}>
                        ${this.state.anotherProperty}
                    </button>
                `;
            }
        }
        const $body = document.getElementsByTagName('body').item(0);
        renderRoot(jsx`<${Counter} />`, $body);

        // when
        const $button = document.getElementsByTagName('button').item(0);
        $button.click();
        
        // then
        expect($button.textContent).toEqual("anotherProperty");
    });

    test("부모 컴포넌트가 re-render해도 컴포넌트의 상태는 보존된다.", () => {
        // given
        let forceUpdate;
        
        class ParentComponent extends Component {
            
            constructor(props) {
                super(props);

                forceUpdate = () => this.setState({ randomKey: "randomValue" });
            }
            
            render() {
                return jsx`
                    <${ChildComponent} />
                `;
            }
        }

        class ChildComponent extends Component {
            
            state = {
                prop1: "value1",
            }

            render() {
                return jsx`
                    <div>${JSON.stringify(this.state)}</div>
                `;
            }
        }

        // when
        const $body = document.getElementsByTagName('body').item(0);
        renderRoot(jsx`<${ParentComponent} />`, $body);
        forceUpdate();

        // then
        const $rendered = document.getElementsByTagName('div')[0];
        expect($rendered.textContent).toEqual('{"prop1":"value1"}');
    });

    test("부모가 re-render하면서 props를 갱신하면 자식의 props가 갱신된다.", async () => {
        // given
        let increase;

        class ParentCounter extends Component {

            state = {
                counter: 0,
            };

            constructor(props) {
                super(props);

                increase = this.handleIncrease.bind(this);
            }

            handleIncrease() {
                this.setState({ counter: this.state.counter + 1 });
            }

            render() {
                return jsx`
                    <${ChildDisplay} value=${this.state.counter} />
                `;
            }
        }

        class ChildDisplay extends Component {
            render() {
                const { value } = this.props;

                return jsx`
                    <div>${value}</div>
                `;
            }
        }

        const $body = document.getElementsByTagName('body').item(0);
        renderRoot(jsx`<${ParentCounter} />`, $body);
        
        // when
        increase();
        
        // then
        const $rendered = document.getElementsByTagName('div').item(0);
        expect($rendered.textContent).toEqual("1");
    });
});
