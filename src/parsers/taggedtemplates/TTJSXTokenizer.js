/**
 * 정규 표현식으로 입력된 (strings, values)를 유의미한 토큰 단위로 분할한다.
 */
export class TTJSXTokenizer {

    /**
     * 테스트 코드 등 직접 (strings, values)를 tagged template에서 가져와야 할 때 사용하는 헬퍼
     * 
     * @param {string[]} strings 
     * @param  {any[]} values 
     */
    static raw(strings, ...values) {
        return { strings, values };
    }

    /**
     * @param {string[]} strings 
     * @param {any[]} values 
     */
    tokenize(strings, values) {
        
        const arrayOfStringTokens = strings.map((string) => 
            string
                // 1. 단순 개행 제거
                .replace(/\r|\n|\t/g, "") 

                // 2. 쉽게 분할 가능한 요소들 분할
                // split 대상을 (,) 로 감싸 split 이후에도 남게 했음.
                // "[^"]*" --> "문자열" 매칭 (문자열에서 "는 제외)
                // <[^\s>\/]* --> <문자열 매칭 (공백과 >는 제외)
                .split(/("[^"]*"|<[^\s>\/]*|>|\/)/g)
                
                // 3. ", = 제거
                // e.g. "Modal__image" src="hello world"
                .map((string) => string.split(/"|=/g))
                .flat()

                // 4. <와 tagName의 분리 필요
                // <는 제거하지 않고 구분자로써 남김.
                .map((string) => string.split(/(<)/g))
                .flat()

                // 5. 최종적으로 빈 공백 문자열 모두 제거
                .map((string) => string.trim()) // 앞/뒤 약간의 공백 제거
                .filter((v) => v.length > 0) // 공백만 있던 case 제거
        );

        const tokens = arrayOfStringTokens.reduce((sum, stringTokens, idx) => {
            if (idx === 0) {
                return [ ...stringTokens ];
            }
            
            return [ ...sum, values[idx - 1], ...stringTokens ];
        });

        return tokens;
    }
}
