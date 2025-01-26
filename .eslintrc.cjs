const legacy = require('eslint-config-standard-with-typescript').rules
const transformed = {}

const equivalents = [
  'block-spacing',
  'brace-style',
  'comma-dangle',
  'comma-spacing',
  'func-call-spacing',
  'function-call-spacing',
  'indent',
  'key-spacing',
  'keyword-spacing',
  'lines-around-comment',
  'lines-between-class-members',
  'member-delimiter-style',
  'no-extra-parens-new-line',
  'no-extra-semi',
  'object-curly-spacing',
  'padding-line-between-statements',
  'quotes',
  'semi',
  'space-before-blocks',
  'space-before-function-paren',
  'space-infix-ops',
  'type-annotation-spacing'
]

for (const rule of equivalents) {
  const oldKey = `@typescript-eslint/${rule}`
  /* @ts-expect-error -- Don't make me deal with this lmao */
  if (oldKey in legacy) transformed[`@stylistic/${rule}`] = legacy[oldKey]
}

/** @type {import('eslint').Linter.Config} */
const config = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', '@stylistic'],
  extends: ['standard-with-typescript', 'plugin:@stylistic/disable-legacy'],
  overrides: [
    {
      files: '**/*.mjs',
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off'
      }
    },
    {
      files: '**/*.cjs',
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-var-requires': 'off'
      }
    }
  ],
  ignorePatterns: [
    'build/',
    '*.js'
  ],
  reportUnusedDisableDirectives: true,
  rules: {
    ...transformed,
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/promise-function-async': 'off',
    '@typescript-eslint/no-confusing-void-expression': 'off',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-shadow': 'warn',
    '@typescript-eslint/consistent-type-assertions': [
      'error',
      {
        assertionStyle: 'as',
        objectLiteralTypeAssertions: 'allow'
      }
    ],
    '@typescript-eslint/no-misused-promises': [
      'error',
      {
        checksVoidReturn: {
          attributes: false
        }
      }
    ],
    '@typescript-eslint/no-import-type-side-effects': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/no-dynamic-delete': 'warn',
    '@typescript-eslint/unbound-method': ['error', {
      ignoreStatic: true
    }],
    '@typescript-eslint/no-unnecessary-condition': 'error',

    'no-lonely-if': 'warn',
    'no-var': 'error',
    'prefer-const': 'error',
    'no-labels': 'off',

    '@stylistic/array-bracket-spacing': 'error',
    '@stylistic/arrow-parens': 'error',
    '@stylistic/max-len': 'off',
    '@stylistic/quote-props': ['warn', 'as-needed'],
    '@stylistic/jsx-quotes': ['error', 'prefer-single'],
    '@stylistic/indent': ['error', 2],
    '@stylistic/jsx-curly-spacing': 'error',
    '@stylistic/jsx-curly-newline': ['error', { singleline: 'forbid', multiline: 'consistent' }],
    '@stylistic/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never', propElementValues: 'always' }],
    '@stylistic/jsx-closing-tag-location': 'error',
    '@stylistic/jsx-closing-bracket-location': 'error',
    '@stylistic/jsx-equals-spacing': 'error',
    '@stylistic/jsx-self-closing-comp': ['error', { component: true, html: true }],
    '@stylistic/jsx-tag-spacing': ['error', { beforeClosing: 'never' }],
    '@stylistic/jsx-wrap-multilines': ['error', {
      declaration: 'parens-new-line',
      assignment: 'parens-new-line',
      return: 'parens-new-line',
      arrow: 'parens-new-line',
      condition: 'parens-new-line',
      logical: 'ignore'
    }],
    '@stylistic/jsx-props-no-multi-spaces': 'error',
    '@stylistic/jsx-first-prop-new-line': ['error', 'multiline'],
    '@stylistic/jsx-max-props-per-line': ['error', { maximum: 1, when: 'multiline' }],
    '@stylistic/jsx-one-expression-per-line': ['error', { allow: 'single-child' }]
  }
}

module.exports = config
