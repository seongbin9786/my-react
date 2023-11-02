module.exports = {
    root: true,
    env: {
        browser: true,
        es2021: true,
    },
    extends: ["airbnb-base", "plugin:prettier/recommended"],
    overrides: [
        {
            env: {
                node: true,
            },
            files: [".eslintrc.{js,cjs}"],
            parserOptions: {
                sourceType: "script",
            },
        },
    ],
    ignorePatterns: ["node_modules/**", "**/dist/**", "**/build/**"],
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
    plugins: ["prettier"],
    rules: {
        "prettier/prettier": [
            "error",
            {
                endOfLine: "auto",
            },
        ],
    },
};
