import { describe, test, expect } from '@jest/globals';
import { compareInnerHTML } from './compareInnerHTML';
import { jsx, renderRoot } from '../src';

describe("TT-JSX (Tagged Templates)", () => {

    afterEach(() => {
        document.body.innerHTML = "";
    });

    test("1개의 DOM", () => {
        // given
        const JSX = jsx`<div>hello</div>`;

        // when
        const $body = document.getElementsByTagName('body').item(0);
        renderRoot(JSX, $body);

        // then
        const $rendered = document.getElementsByTagName('div')[0];
        expect($rendered.textContent).toEqual("hello");
    });
    
    test("중첩된 DOM", () => {
        // given
        const JSX = jsx`
            <div>
                <input value=hello />
                <ul>
                    <li>item 1</li>
                </ul>
            </div>
        `;

        // when
        const $body = document.getElementsByTagName('body').item(0);
        renderRoot(JSX, $body);

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
});
