import { createDebug } from "../../debug/debug.js";
import { NodeParser } from "./NodeParser.js";

const debug = createDebug("Parser");

// 뭐지? textNode가 안 잡힘.
// \w 여서 alphanumeric + underscore만 됐음.
// . 으로 하니 모든 캐릭터가 됨. 이렇게 하면 기존 스플릿이 완전 망가짐
// ^[<>]으로 괄호 제외 모든 캐릭터로 변경함. 이럼 정상적으로 동작함
// [<>]가 아니라 [</>]으로 놓아야 /와 >가 분리되지 않음.
const REGEXP_FIND_TOKENS = /<?(\/?[^</>]| |=)+(?=\/?>?)|(\/?>)/g;

/**
 * Tagged Template Literal 문법을 사용해 파싱한다.
 * 
 * FIXME: 최상위 요소가 하나일 때만 동작한다.
 *
 * @param {string[]} strings
 * @param  {any[]} values
 * @returns {DOMSpec} 루트 요소
 */
export const createDOMSpec = (strings, ...values) => {
    // TODO: 인라인 텍스트들은 다 공백이 제거돼서 공백을 2개 이상 연달아 가질 수 없음.
    // 그렇다고 공백 제거를 안 하기엔 tag와 props를 구분할 때 space를 못 쓰게 되어서 불편해짐
    // 아마 좀 해보면 될텐데 지금은 시간이 없으니 나중으로 미룸.
    const normalized = strings.map((string) =>
        string
            .replace(/[\s\n]+/g, " ") // 불필요한 개행, 공백을 하나 빼고 제거
            .replace(/> </g, "><") // 닫고 여는 태그 사이의 공백 제거
            .trim(),
    );
    debug("[PARSE STARTS]");
    debug("normalized strings:", normalized);
    debug("values:", values);
    debug("[LOOP STARTS]");

    /**
     * @type {NodeParser[]}
     */
    const parserStack = [];

    const getCurrentParser = () => parserStack[parserStack.length - 1];

    for (const [idx, rawString] of normalized.entries()) {
        debug(`[${idx + 1}/${normalized.length}] RAW-STRING:`, rawString);

        // space로 split할 수 있음
        const tokens = rawString.match(REGEXP_FIND_TOKENS); // 열리는 태그 OR />로 닫히기 전까지 내용 OR >,< 사이의 내용
        debug("TOKENS:", tokens);

        // VALUE가 연속되는 CASE (e.g.)
        /*
            <div>
                ${$sidebar}
                ${$header}
                ${$editor}
            </div>
        */
        // TODO: 예외가 있는지 확인하기
        if (rawString.length === 0) {
            const currentParser = getCurrentParser();
            const value = values[idx];
            currentParser.parseValue(value);
            debug("VALUE:", value);
            continue;
        }

        if (!tokens) {
            continue;
        }

        for (const token of tokens) {
            debug("-----[TOKEN]:", token);

            if (token.startsWith("<") && !token.startsWith("</")) {
                // OPENING
                parserStack.push(new NodeParser(token));
                continue;
            }

            // 기존 parser에게 파싱 위임
            const currentParser = getCurrentParser();
            const $elem = currentParser.parseToken(token);

            // 파싱이 끝난 경우
            if ($elem) {
                // 파서 스택에서 제거
                parserStack.pop();

                // 현재 파서가 루트인 경우
                if (parserStack.length === 0) {
                    return $elem; // 루트 요소
                }

                // 부모의 자식으로 등록
                const parentParser = getCurrentParser();
                parentParser.appendChild($elem);
            }
        }

        // 마지막 String인 경우 처리할 Value가 없음.
        if (strings.length - 1 === idx) {
            continue;
        }
        const currentParser = getCurrentParser();
        const value = values[idx];
        currentParser.parseValue(value);
        debug("VALUE:", value);
    }
    debug("[PARSE ENDS]");
};
