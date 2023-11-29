import { describe, test, expect } from '@jest/globals';
import { compareInnerHTML } from './compareInnerHTML';
import { Component, jsx, renderRoot } from '../src';

describe("Component", () => {

    afterEach(() => {
        document.body.innerHTML = "";
    });

    test("1개의 DOM", () => {
        // given
        class SimpleDOM extends Component {
            render() {
                return jsx`<div>hello</div>`;
            }
        }

        // when
        const $body = document.getElementsByTagName('body').item(0);
        renderRoot(jsx`<${SimpleDOM} />`, $body);

        // then
        const $rendered = document.getElementsByTagName('div')[0];
        expect($rendered.textContent).toEqual("hello");
    });
    
    test("중첩된 DOM", () => {
        // given
        class SimpleDOM extends Component {
            render() {
                return jsx`
                    <div>
                        <input value=hello />
                        <ul>
                            <li>item 1</li>
                        </ul>
                    </div>
                `;
            }
        }

        // when
        const $body = document.getElementsByTagName('body').item(0);
        renderRoot(jsx`<${SimpleDOM} />`, $body);

        // then
        const renderedHTML = document.getElementsByTagName('body')[0].innerHTML;
        // input을 createElement로 만들면 /> 가 아닌 >로 끝남.
        const compared = compareInnerHTML(renderedHTML, `
            <div>
                <input value="hello">
                <ul>
                    <li>item 1</li>
                </ul>
            </div>
        `);
        expect(compared).toBe(true);
    });

    test("컴포넌트를 반환하는 컴포넌트", () => {
        // given
        class ParentComponentOfComponent extends Component {
            render() {
                return jsx`
                    <${LeafComponent} />
                `;
            }
        }

        class LeafComponent extends Component {
            render() {
                return jsx`
                    <div>hello</div>
                `;
            }
        }

        // when
        const $body = document.getElementsByTagName('body').item(0);
        renderRoot(jsx`<${ParentComponentOfComponent} />`, $body);

        // then
        const $rendered = document.getElementsByTagName('div')[0];
        expect($rendered.textContent).toEqual("hello");
    });

    test("null을 반환했다가 컴포넌트를 반환하는 컴포넌트", async () => {
        // given
        // TODO: 이런 식의 비동기 렌더링 대기 패턴을 하나 만들 수 있을 듯.
        let resolveMe;
        const promiseForCheck = new Promise((resolve) => {
            resolveMe = resolve;
        });

        class ParentComponentOfComponent extends Component {
            state = {
                loading: true,
            }

            componentDidMount() {
                this.setState({ loading: false });
                resolveMe(); // 테스트 용도로
            }
            
            render() {
                if (this.state.loading) {
                    return null;
                }

                return jsx`
                    <${LeafComponent} />
                `;
            }
        }

        class LeafComponent extends Component {
            render() {
                return jsx`
                    <div>hello</div>
                `;
            }
        }

        // when
        const $body = document.getElementsByTagName('body').item(0);
        renderRoot(jsx`<${ParentComponentOfComponent} />`, $body);

        // then
        await promiseForCheck;
        const $rendered = document.getElementsByTagName('div')[0];
        expect($rendered.textContent).toEqual("hello");
    });
    
    test("자식 컴포넌트에 프로퍼티 값으로 배열을 넘겼을 때 정상적으로 전달된다.", () => {
        // 버그: 배열을 넘겼는데, 객체가 도착하는 현상 확인
        // given
        class Parent extends Component {
            render() {
                return jsx`
                    <${Child} arr=${[ 1, 2, 3 ]} />
                `;
            }
        }

        class Child extends Component {
            render() {
                return jsx`
                    <div>
                        ${this.props.arr.map((num) => jsx`
                            <span id=${num}></span>
                        `)}
                    </div>
                `;
            }
        }

        // when
        const $body = document.getElementsByTagName('body').item(0);
        renderRoot(jsx`<${Parent} />`, $body);

        // then
        const $1 = document.getElementById('1');
        const $2 = document.getElementById('2');
        const $3 = document.getElementById('3');
        expect($1).toBeTruthy();
        expect($2).toBeTruthy();
        expect($3).toBeTruthy();
    });

});
