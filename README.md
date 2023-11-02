
# 문제점들

## 새로 배운 점 / 찾아본 점

### tsc를 해도 paths alias는 그대로인 이유

tsc는 paths를 반영하는 기능이 없다고 한다.

tsc-alias를 추가로 CLI로 실행하면 된다. <https://www.npmjs.com/package/tsc-alias>

tsconfig에 간단한 설정만 추가하면 돼서 매우 편리하다.

### package.json의 module 옵션의 역할?

출처: <https://toss.tech/article/commonjs-esm-exports-field>

ESM/CJS 여부를 전역으로 설정한다.

TS에선 이 값을 보고 ESM/CJS로 해석 방향을 결정한다고 한다.

JS의 경우는 Node에서 ESM을 지원하는 경우 의미 있을 듯?

그리고 .mjs = ESM, .cjs = CJS 로 항상 해석한다고 함

## TypeScript 관련 문제점

### 1. nodeResolution=Node 문제 - Vitest, testing-library import 오류

해결 방법 = ?

- `node`로 두면 vitest는 괜찮아지는 듯하다.
- `testing-library`의 경우 `import` 경로를 다르게 하니 해결된다.

### 2. ESM으로 컴파일 후에 `.js`를 붙여주지 않아 !!Browser에서!! 404가 뜨는 문제

module=ESNext로 지정했다. (module = Specify what module code is generated)
-> NodeNext로 설정하니 컴파일 시 `Object.define(exports, ...)` 같은 ESM에 없는 `exports`가 등장해서 ESM 환경에서는 구동할 수 없게 됐다.

해결 방법 = ?

- 쉬운 방법은 없다. <https://github.com/microsoft/TypeScript/issues/16577>
- tsc-alias의 `.js` 부착 옵션을 활용하는 게 최선인 듯하다.
