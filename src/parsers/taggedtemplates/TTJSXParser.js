import { Component } from "../../components/Component.js";
import { createDebug } from "../../debug/debug.js";
import { DOMSpec } from "../../spec/DOMSpec.js";

const debug = createDebug("TTJSXParser");

/**
 * Tokenizer의 입력을 받아 DOMSpec을 반환하는 파서
 * 
 * 재귀적으로 DOMSpec을 생성하고 반환한다.
 * 
 * 주고 받는 데이터가 많아 상태로 뺐는데
 * 
 * 인스턴스 상태는 모든 메소드에 대한 공유 상태인 듯해서
 * 메소드 이름만 보고는 이해하기 많이 어렵겠다는 생각도 들었음.
 * 
 * 다만 갖고 있는 상태가 전역적으로 쓰이는 경우는 token밖에 없어서
 * 괜찮치 않나 생각도 함.
 */
export class TTJSXParser {

    #tokens;
    #idx;
    #isInlineTag;
    #isRootParser;

    /** @type {string | Component} */
    #type;
    #props;
    /** @type {DOMSpec[]} */
    #children;

    /**
     * @param {any[]} tokens
     * @param {boolean} isRootParser
     */
    constructor(tokens, isRootParser) {
        this.#tokens = tokens;
        this.#idx = 0;
        this.#isInlineTag = false;
        this.#isRootParser = isRootParser;

        this.#props = {};
        this.#children = [];
    }

    /**
     * TT-JSX를 파싱한 토큰을 입력 받는다.
     * 
     * `<tagName>`부터 `</tagName>`까지의 범위의 토큰을 활용해 DOMSpec을 생성 후 반환한다.
     * 
     * @param {any[]} tokens 토큰 배열
     * @returns {DOMSpec} DOMSpec 객체 (Renderer의 입력이 된다.)
     */
    parse() {
        debug("[PARSE STARTS]");
        debug("tokens:", this.#tokens);

        this.#parseOpeningTag();

        if (this.#isInlineTag) {
            return this.#createDOMSpec();
        }

        this.#parseChildren();

        debug("[PARSE ENDS]");

        return this.#createDOMSpec();
    }

    /**
     * 여는 태그(< ... >)에서 type과 props를 추출한다.
     */
    #parseOpeningTag() {
        this.#expectOpeningBracket(); // 1. < 검증
        this.#parseType(); // 2. type 등록
        this.#parseProps(); // 3. props 반복 등록
    }

    /**
     * 토큰에서 type을 읽어 등록한다.
     * 
     * string, Component가 아닌 경우 예외를 던진다.
     */
    #parseType() {
        const token = this.#readNextToken();
        // instanceof를 prototype에 쓰는 것은 이상하지만 상속 여부를 확인할 수 있다.
        // ChildClass.prototype.__proto__ === ParentClass.prototype 이기 때문.
        if (typeof token === "string" || token.prototype instanceof Component) {
            this.#type = token;
            return;
        }

        throw new Error(`Unexpected token: ${token}, expected string or Component`);
    }

    /**
     * 토큰에서 props를 읽어 props 객체에 등록한다.
     * 
     * 여는 태그에서 type 이후의 토큰부터 닫는 괄호 토큰까지 확인한다.
     */
    #parseProps() {
        while (!this.#checkAndVerifyOpenTagClosed()) {
            this.#parseProp();
        }
    }
    
    /**
     * 기존 props 객체를 받아 다음 토큰으로 props를 파싱해 등록한다.
     */
    #parseProp() {
        const token = this.#readNextToken();

        // CASE 1. String: key로 간주하고 다음 토큰을 value로 해서 등록
        if (typeof token === "string") {
            const key = token;
            const value = this.#readNextToken();

            // style을 객체로 넘기면 변환해주기
            if (key === "style" && typeof value === "object") {
                this.#props[key] = this.#convertToStylePropString(value);
            } else {
                this.#props[key] = value;
            }
            return;
        }

        // CASE 2. Object: 풀어 해쳐서 key-value 등록
        for (const [key, value] of Object.entries(token)) {
            this.#props[key] = value;
        }
    }

    /**
     * 토큰에서 children을 읽어 children 배열에 등록한다.
     * 
     * child는 항상 DOMSpec이다?
     * -> text node는 어떻게 하려고? __TEXT에 nodeValue를 넣어줘서 만들면 됨.
     */
    #parseChildren() {
        while (!this.#checkNextTokenIsClosingTag()) {
            const child = this.#parseChild();
            this.#children.push(child);
        }
    }

    #parseChild() {
        const token = this.#peekTokenAt(0); // idx 증가시키진 않고 읽기만

        // CASE 1. </로 시작하는 닫는 태그인 경우
        // CASE 1. <로 시작하는 HTML/Component Spec
        if (token === "<") {
            const nextTokens = this.#tokens.slice(this.#idx);
            const childParser = new TTJSXParser(nextTokens, false); // 토큰을 얼마나 썼는지 알 수 없다는 문제가 있음.
            const child = childParser.parse();
            
            // FIXME: 더 좋은 방법 찾기
            // 좀.. 이상하긴 한데 최선의 방법이라고 생각함. 
            // 더해줘야 함. childParser의 idx는 0부터 시작이어서.
            // TODO: idx를 그냥 더하는 게 맞는지 확인 필요
            this.#idx += childParser.#idx; 
            
            return child;
        }
        
        this.#readNextToken(); // idx 위치 이동 용도

        // CASE 2. 표현식인 경우
        if (token instanceof DOMSpec) {
            return token;
        }
        
        // CASE 3. object, function 이외의 기타 타입은 Text Node로 출력
        if (typeof token !== "object") {
            return new DOMSpec("__TEXT", {
                // TODO: String() 으로 값이 바뀔 수 있는지 체크하기
                nodeValue: String(token),
            });
        }

        throw new Error(`Unexpected token ${token}. expected children`);
    }

    #createDOMSpec() {
        this.#expectNoTokenLeft();

        return new DOMSpec(this.#type, {
            ...this.#props,
            children: this.#children,
        });
    }
    
    /**
     * `<`가 등장하는지 확인하고 아니라면 예외를 던진다.
     */
    #expectOpeningBracket() {
        const token = this.#readNextToken();
        if (token !== "<") {
            throw new Error(`Unexpected token: ${token}, expected <`);
        }
    }

    /**
     * `>` 혹은 `/>`의 등장 여부를 반환한다.
     */
    #checkAndVerifyOpenTagClosed() {
        const firstToken = this.#peekTokenAt(0);

        if (firstToken === ">") {
            this.#readNextToken();
            return true;
        }

        if (firstToken === "/") {
            this.#expectToken(this.#readNextToken(), "/");
            this.#expectToken(this.#readNextToken(), ">");
            this.#isInlineTag = true;
            return true;
        }

        return false;
    }

    /**
     * `</type>`의 등장 여부를 반환한다.
     * 
     * 등장하는 경우 해당 토큰을 검증한다.
     */
    #checkNextTokenIsClosingTag() {
        const firstToken = this.#peekTokenAt(0);
        const secondToken = this.#peekTokenAt(1);

        if (firstToken !== "<" || secondToken !== "/") {
            return false;
        }

        this.#expectToken(this.#readNextToken(), "<");
        this.#expectToken(this.#readNextToken(), "/");
        this.#expectToken(this.#readNextToken(), this.#type);
        this.#expectToken(this.#readNextToken(), ">");

        return true;
    }

    /**
     * 파싱이 끝난 이후에도 토큰이 남았는지 여부를 반환
     * 
     * 이 기능은 루트 파서에서만 실행 가능하다. 
     * 자식 파서들은 항상 토큰이 남을 수밖에 없기 때문에.
     */
    #expectNoTokenLeft() {
        // 루트 파서가 아니면 expect할 수 없음.
        if (!this.#isRootParser) {
            return;
        }

        if (this.#tokens.length === this.#idx) {
            return;
        }

        const token = this.#peekTokenAt(0);
        throw new Error(`Unexpected token: ${token}, expected nothing.`);
    }
    
    #expectToken(actual, expected) {
        if (actual !== expected) {
            throw new Error(`Unexpected token: ${actual}, expected ${expected}`);
        }
    }

    /**
     * 다음에 읽을 토큰을 반환한다.
     * 
     * 모든 토큰이 사용되었는데도 요청되는 경우 예외를 던진다.
     * 
     * @returns {any} token
     */
    #readNextToken() {
        if (this.#tokens.length === this.#idx) {
            throw new Error("이미 모든 토큰을 소진했습니다.");
        }
        return this.#tokens[this.#idx++];
    }
    
    /**
     * 현재 idx의 상대 위치의 token을 반환한다.
     * 
     * 범위를 벗어나는 경우 예외를 던진다.
     */
    #peekTokenAt(relativeIdx) {
        const targetIdx = this.#idx + relativeIdx;
        if (this.#tokens.length === targetIdx) {
            throw new Error("이미 모든 토큰을 소진했습니다.");
        }
        return this.#tokens[targetIdx];
    }

    #convertToStylePropString(styleObject) {
        return Object.entries(styleObject)
            .map(([key, value]) => `${key}:${value}`)
            .join(";");
    }
}
