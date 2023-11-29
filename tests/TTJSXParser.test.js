import { describe, test, expect } from "@jest/globals";
import { TTJSXParser } from "../src/parsers/taggedtemplates/TTJSXParser";
import { DOMSpec } from "../src/spec/DOMSpec";
import { Component } from "../src";

describe("Parser", () => {

    // 테스트에 사용되는 fixture
    class SimpleComp extends Component {} // 토크나이저가 Component 인스턴스 여부를 확인하지는 않음.
    const childObject = new DOMSpec("div", {}); // 토크나이저가 DOMSpec 인스턴스 여부를 확인하지는 않음. 
    
    test.each([
        [
            "토큰에 null이 있으면 무시된다",
            [
                "<", "div", ">",
                null,
                "<", "/", "div", ">"
            ],
            new DOMSpec('div', {}),
        ],
        [
            "type [string], props [no], children [no]",
            [
                "<", "div", ">",
                "<", "/", "div", ">"
            ],
            new DOMSpec('div', {}),
        ],
        [
            "type [string], props [no], children [string]",
            [
                "<", "div", ">",
                "<", "div", ">",
                "<", "img", "className", "Modal__image", "src", "hello world", "/", ">",
                "<", "/", "div", ">",
                "<", "/", "div", ">"
            ],
            new DOMSpec('div', {
                children: [
                    new DOMSpec('div', {
                        children: [
                            new DOMSpec('img', {
                                className: 'Modal__image',
                                src: 'hello world',
                                children: [],
                            }),
                        ]
                    }),
                ]
            }),
        ],
        [
            "type [string], props [no], children [expr]",
            [
                "<", "div", ">",
                childObject,
                "<", "/", "div", ">"
            ],
            new DOMSpec('div', {
                children: [
                    childObject,
                ],
            }),
        ],
        [
            "type [string], props [string], children [no]",
            [
                "<", "div", "hello", "world", "hello", "world", "hello", "world", ">",
                "<", "/", "div", ">"
            ],
            new DOMSpec('div', {
                hello: 'world',
            }),
        ],
        [
            "type [string], props [string], children [string]",
            [
                "<", "div", "hello", "world", "hello", "world", "hello", "world", ">",
                "<", "div", ">",
                "<", "img", "className", "Modal__image", "src", "hello world", "/", ">",
                "<", "/", "div", ">",
                "<", "/", "div", ">"
            ],
            new DOMSpec('div', {
                hello: 'world',
                children: [
                    new DOMSpec('div', {
                        children: [
                            new DOMSpec('img', {
                                className: 'Modal__image',
                                src: 'hello world',
                                children: [],
                            }),
                        ]
                    })
                ]
            })
        ],
        [
            "type [string], props [string], children [expr]",
            [
                "<", "div", "hello", "world", "hello", "world", "hello", "world", ">",
                childObject,
                "<", "/", "div", ">"
            ],
            new DOMSpec('div', {
                hello: 'world',
                children: [
                    childObject,
                ],
            }),
        ],
        [
            "type [string], props [expr], children [no]",
            [
                "<", "div", "hello", "world", "test", 1, "/", ">"
            ],
            new DOMSpec('div', {
                hello: 'world',
                test: 1,
            }),
        ],
        [
            "type [string], props [expr], children [string]",
            [
                "<", "div", "hello", "world", "test", 1, ">",
                "<", "div", ">",
                "<", "img", "className", "Modal__image", "src", "hello world", "/", ">",
                "<", "/", "div", ">",
                "<", "/", "div", ">"
            ],
            new DOMSpec('div', {
                hello: 'world',
                test: 1,
                children: [
                    new DOMSpec('div', {
                        children: [
                            new DOMSpec('img', {
                                className: 'Modal__image',
                                src: 'hello world',
                            })
                        ]
                    })
                ]
            })
        ],
        [
            "type [string], props [expr], children [expr]",
            [
                "<", "div", "hello", "world", "test", 1, ">",
                childObject,
                "<", "/", "div", ">"
            ],
            new DOMSpec('div', {
                hello: 'world',
                test: 1,
                children: [
                    childObject
                ]
            })
        ],
        [
            "type [Component], props [no], children [no]",
            [
                "<", SimpleComp, ">",
                "<", "/", SimpleComp, ">"
            ],
            new DOMSpec(SimpleComp, {}),
        ],
        [
            "type [Component], props [no], children [string]",
            [
                "<", SimpleComp, ">",
                "<", "div", ">",
                "<", "img", "className", "Modal__image", "src", "hello world", "/", ">",
                "<", "/", "div", ">",
                "<", "/", SimpleComp, ">"
            ],
            new DOMSpec(SimpleComp, {
                children: [
                    new DOMSpec('div', {
                        children: [
                            new DOMSpec('img', {
                                className: 'Modal__image',
                                src: 'hello world',
                            })
                        ]
                    }),
                ],
            }),
        ],
        [
            "type [Component], props [no], children [expr]",
            [
                "<", SimpleComp, ">",
                childObject,
                "<", "/", SimpleComp, ">"
            ],
            new DOMSpec(SimpleComp, {
                children: [
                    childObject,
                ],
            }),
        ],
        [
            "type [Component], props [string], children [no]",
            [
                "<", SimpleComp, "hello", "world", "hello", "world", "hello", "world", "/", ">",
            ],
            new DOMSpec(SimpleComp, {
                hello: 'world',
            }),
        ],
        [
            "type [Component], props [string], children [string]",
            [
                "<", SimpleComp, "hello", "world", "hello", "world", "hello", "world", ">",
                "<", "div", ">",
                "<", "img", "className", "Modal__image", "src", "hello world", "/", ">",
                "<", "/", "div", ">",
                "<", "/", SimpleComp, ">"
            ],
            new DOMSpec(SimpleComp, {
                hello: 'world',
                children: [
                    new DOMSpec('div', {
                        children: [
                            new DOMSpec('img', {
                                className: 'Modal__image',
                                src: 'hello world',
                            })
                        ]
                    }),
                ],
            }),
        ],
        [
            "type [Component], props [string], children [expr]",
            [
                "<", SimpleComp, "hello", "world", "hello", "world", "hello", "world", ">",
                childObject,
                "<", "/", SimpleComp, ">"
            ],
            new DOMSpec(SimpleComp, {
                hello: 'world',
                children: [
                    childObject,
                ],
            }),
        ],
        [
            "type [Component], props [expr], children [no]",
            [
                "<", SimpleComp, "hello", "world", "test", 1, "/", ">"
            ],
            new DOMSpec(SimpleComp, {
                hello: 'world',
                test: 1,
            }),
        ],
        [
            "type [Component], props [expr], children [string]",
            [
                "<", SimpleComp, "hello", "world", "test", 1, ">",
                "<", "div", ">",
                "<", "img", "className", "Modal__image", "src", "hello world", "/", ">",
                "<", "/", "div", ">",
                "<", "/", SimpleComp, ">"
            ],
            new DOMSpec(SimpleComp, {
                hello: 'world',
                test: 1,
                children: [
                    new DOMSpec('div', {
                        children: [
                            new DOMSpec('img', {
                                className: 'Modal__image',
                                src: 'hello world',
                            })
                        ]
                    }),
                ],
            }),
        ],
        [
            "type [Component], props [expr], children [expr]",
            [
                "<", SimpleComp, "hello", "world", "test", 1, ">",
                childObject,
                "<", "/", SimpleComp, ">"
            ],
            new DOMSpec(SimpleComp, {
                hello: 'world',
                test: 1,
                children: [
                    childObject,
                ],
            }),
        ],
    ])("%s", (_title, tokens, expected) => {

        // when
        const parser = new TTJSXParser(tokens);
        const result = parser.parse();

        // then
        expect(result).toEqual(expected);
    });
});
