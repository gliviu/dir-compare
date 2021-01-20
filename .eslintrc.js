module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
        '@typescript-eslint',
    ],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
    ],
    rules: {
        '@typescript-eslint/no-floating-promises': ['error'],
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { 'args': 'none' }],
    },
    parserOptions: {
        tsconfigRootDir: "./",
        project: ["./tsconfig.json"]
    },
    overrides: [
        {
            files: [
                '**/*.js'
            ],
            rules: {
                '@typescript-eslint/no-var-requires': 'off'
            },
            env: {
                node: true
            }
        }
    ]
};