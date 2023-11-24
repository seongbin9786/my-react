/** @type {import('jest').Config} */
const config = {
    transform: {}, // ESM 지원을 위한 설정 (https://jestjs.io/docs/ecmascript-modules)
    testEnvironment: "jsdom",
};

module.exports = config;
