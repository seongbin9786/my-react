import { describe, test, expect } from "@jest/globals";
import { Component } from "../src";
import { TTJSXTokenizer } from "../src/parsers/taggedtemplates/TTJSXTokenizer";
import { DOMSpec } from "../src/spec/DOMSpec";

describe("Tokenizer", () => {

    // 테스트에 사용되는 fixture
    class SimpleComp extends Component {} // 토크나이저가 Component 인스턴스 여부를 확인하지는 않음.
    const childObject = new DOMSpec("div", {}); // 토크나이저가 DOMSpec 인스턴스 여부를 확인하지는 않음. 
    
    /*
        발생 오류: TypeError: this.props.arr.map is not a function
        디버깅 출력: tokens: [ '<', [class Child extends Component], 'arr', 1, 2, 3, '/', '>' ]
        원인 소스 코드: prop value에 쓰일 배열 마저 flat() 된 것.
    */
    test("value가 배열인 prop도 파싱할 수 있다", () => {

        // given
        const { strings, values } = TTJSXTokenizer.raw`
            <div key=${[1,2,3]} />
        `;
        const tokenizer = new TTJSXTokenizer();

        // when
        const result = tokenizer.tokenize(strings, values);

        // then
        const expected = [
            '<', 'div', 'key', [ 1, 2, 3 ], '/', '>',
        ];
        expect(result).toEqual(expected);
    })

    test.each([
        [
            "type [string], props [no], children [no]",
            TTJSXTokenizer.raw`<div></div>`,
            [
                "<", "div", ">",
                "<", "/", "div", ">"
            ]
        ],
        [
            "type [string], props [no], children [string]",
            TTJSXTokenizer.raw`
                <div>
                    <div>
                        <img className="Modal__image" src="hello world" />
                    </div>
                </div>
            `,
            [
                "<", "div", ">",
                "<", "div", ">",
                "<", "img", "className", "Modal__image", "src", "hello world", "/", ">",
                "<", "/", "div", ">",
                "<", "/", "div", ">"
            ]
        ],
        [
            "type [string], props [no], children [expr]",
            TTJSXTokenizer.raw`
                <div>
                    ${childObject}
                </div>
            `,
            [
                "<", "div", ">",
                childObject,
                "<", "/", "div", ">"
            ]
        ],
        [
            "type [string], props [string], children [no]",
            TTJSXTokenizer.raw`<div hello="world" hello="world" hello="world"></div>`,
            [
                "<", "div", "hello", "world", "hello", "world", "hello", "world", ">",
                "<", "/", "div", ">"
            ]
        ],
        [
            "type [string], props [string], children [string]",
            TTJSXTokenizer.raw`
                <div hello="world" hello="world" hello="world">
                    <div>
                        <img className="Modal__image" src="hello world" />
                    </div>
                </div>
            `,
            [
                "<", "div", "hello", "world", "hello", "world", "hello", "world", ">",
                "<", "div", ">",
                "<", "img", "className", "Modal__image", "src", "hello world", "/", ">",
                "<", "/", "div", ">",
                "<", "/", "div", ">"
            ]
        ],
        [
            "type [string], props [string], children [expr]",
            TTJSXTokenizer.raw`
                <div hello="world" hello="world" hello="world">
                    ${childObject}
                </div>
            `,
            [
                "<", "div", "hello", "world", "hello", "world", "hello", "world", ">",
                childObject,
                "<", "/", "div", ">"
            ]
        ],
        [
            "type [string], props [expr], children [no]",
            TTJSXTokenizer.raw`<div hello="world" test=${1} />`,
            [
                "<", "div", "hello", "world", "test", 1, "/", ">"
            ]
        ],
        [
            "type [string], props [expr], children [string]",
            TTJSXTokenizer.raw`
                <div hello="world" test=${1}>
                    <div>
                        <img className="Modal__image" src="hello world" />
                    </div>
                </div>
            `,
            [
                "<", "div", "hello", "world", "test", 1, ">",
                "<", "div", ">",
                "<", "img", "className", "Modal__image", "src", "hello world", "/", ">",
                "<", "/", "div", ">",
                "<", "/", "div", ">"
            ]
        ],
        [
            "type [string], props [expr], children [expr]",
            TTJSXTokenizer.raw`
                <div hello="world" test=${1}>
                    ${childObject}
                </div>
            `,
            [
                "<", "div", "hello", "world", "test", 1, ">",
                childObject,
                "<", "/", "div", ">"
            ]
        ],
        [
            "type [Component], props [no], children [no]",
            TTJSXTokenizer.raw`<${SimpleComp}></${SimpleComp}>`,
            [
                "<", SimpleComp, ">",
                "<", "/", SimpleComp, ">"
            ]
        ],
        [
            "type [Component], props [no], children [string]",
            TTJSXTokenizer.raw`
                <${SimpleComp}>
                    <div>
                        <img className="Modal__image" src="hello world" />
                    </div>
                </${SimpleComp}>
            `,
            [
                "<", SimpleComp, ">",
                "<", "div", ">",
                "<", "img", "className", "Modal__image", "src", "hello world", "/", ">",
                "<", "/", "div", ">",
                "<", "/", SimpleComp, ">"
            ]
        ],
        [
            "type [Component], props [no], children [expr]",
            TTJSXTokenizer.raw`
                <${SimpleComp}>
                    ${childObject}
                </${SimpleComp}>
            `,
            [
                "<", SimpleComp, ">",
                childObject,
                "<", "/", SimpleComp, ">"
            ]
        ],
        [
            "type [Component], props [string], children [no]",
            TTJSXTokenizer.raw`
                <${SimpleComp} hello="world" hello="world" hello="world" />
            `,
            [
                "<", SimpleComp, "hello", "world", "hello", "world", "hello", "world", "/", ">",
            ]
        ],
        [
            "type [Component], props [string], children [string]",
            TTJSXTokenizer.raw`
                <${SimpleComp} hello="world" hello="world" hello="world">
                    <div>
                        <img className="Modal__image" src="hello world" />
                    </div>
                </${SimpleComp}>
            `,
            [
                "<", SimpleComp, "hello", "world", "hello", "world", "hello", "world", ">",
                "<", "div", ">",
                "<", "img", "className", "Modal__image", "src", "hello world", "/", ">",
                "<", "/", "div", ">",
                "<", "/", SimpleComp, ">"
            ]
        ],
        [
            "type [Component], props [string], children [expr]",
            TTJSXTokenizer.raw`
                <${SimpleComp} hello="world" hello="world" hello="world">
                    ${childObject}
                </${SimpleComp}>
            `,
            [
                "<", SimpleComp, "hello", "world", "hello", "world", "hello", "world", ">",
                childObject,
                "<", "/", SimpleComp, ">"
            ]
        ],
        [
            "type [Component], props [expr], children [no]",
            TTJSXTokenizer.raw`<${SimpleComp} hello="world" test=${1} />`,
            [
                "<", SimpleComp, "hello", "world", "test", 1, "/", ">"
            ]
        ],
        [
            "type [Component], props [expr], children [string]",
            TTJSXTokenizer.raw`
                <${SimpleComp} hello="world" test=${1}>
                    <div>
                        <img className="Modal__image" src="hello world" />
                    </div>
                </${SimpleComp}>
            `,
            [
                "<", SimpleComp, "hello", "world", "test", 1, ">",
                "<", "div", ">",
                "<", "img", "className", "Modal__image", "src", "hello world", "/", ">",
                "<", "/", "div", ">",
                "<", "/", SimpleComp, ">"
            ]
        ],
        [
            "type [Component], props [expr], children [expr]",
            TTJSXTokenizer.raw`
                <${SimpleComp} hello="world" test=${1}>
                    ${childObject}
                </${SimpleComp}>
            `,
            [
                "<", SimpleComp, "hello", "world", "test", 1, ">",
                childObject,
                "<", "/", SimpleComp, ">"
            ]
        ],
    ])("%s", (_title, { strings, values }, expected) => {

        // when
        const tokenizer = new TTJSXTokenizer();
        const result = tokenizer.tokenize(strings, values);

        // then
        expect(result).toEqual(expected);
    });
    
});
