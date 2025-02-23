import neostandard from 'neostandard'
const tseslint = neostandard.plugins['typescript-eslint']

/** @type {import('eslint').Linter.Config[]} */
// @ts-expect-error -- typescript-eslint has a goofy return type
export default [
  ...neostandard({
    files: ['**/*.ts', '**/*.tsx', '**/*.*js'],
    ts: true,
    env: ['node', 'es2025']
  }),
  ...tseslint.config(
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    {
      files: ['**/*.ts', '**/*.tsx', '**/*.*js'],
      ignores: ['build/', 'src/graphql'],
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
          projectService: true
        }
      },
      rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-redeclare': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/explicit-function-return-type': ['error', {
          allowExpressions: true
        }],
        '@typescript-eslint/no-unused-vars': ['error', {
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }],
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
        '@typescript-eslint/no-invalid-void-type': 'off',
        '@typescript-eslint/consistent-type-imports': ['error', {
          prefer: 'type-imports',
          disallowTypeAnnotations: true,
          fixStyle: 'inline-type-imports'
        }],
        '@typescript-eslint/no-import-type-side-effects': 'error',
        '@typescript-eslint/no-dynamic-delete': 'warn',
        '@typescript-eslint/unbound-method': ['error', {
          ignoreStatic: true
        }],
        '@typescript-eslint/no-unnecessary-condition': 'error',
        '@typescript-eslint/prefer-optional-chain': 'error',
        '@typescript-eslint/prefer-nullish-coalescing': 'off',
        '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
        '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
        '@typescript-eslint/no-confusing-void-expression': 'off',
        '@typescript-eslint/restrict-template-expressions': ['error', {
          allowAny: true,
          allowBoolean: false,
          allowNever: false,
          allowNullish: true,
          allowNumber: true,
          allowRegExp: false
        }],
        '@typescript-eslint/restrict-plus-operands': ['error', {
          allowAny: true,
          allowBoolean: false,
          allowNullish: false,
          allowNumberAndString: true,
          allowRegExp: false
        }],
        '@typescript-eslint/use-unknown-in-catch-callback-variable': 'off',
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint/require-await': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/prefer-promise-reject-errors': ['error', {
          allowThrowingAny: true,
          allowThrowingUnknown: true
        }],
        '@typescript-eslint/no-unnecessary-type-parameters': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/prefer-regexp-exec': 'off'
      }
    }
  ),
  {
    name: 'overrides',
    files: ['**/*.ts*', '**/*.tsx', '**/*.*js'],
    ignores: ['build/', 'src/graphql'],
    rules: {
      'no-debugger': 'error',
      'no-console': ['error', {
        allow: ['info', 'log', 'warn', 'error'] // Not `debug`
      }],
      'no-void': 'off',
      'import/no-anonymous-default-export': 'off',

      '@stylistic/comma-dangle': ['error', 'never'],
      '@stylistic/member-delimiter-style': ['error', {
        multiline: {
          delimiter: 'none'
        },
        singleline: {
          delimiter: 'comma',
          requireLast: false
        }
      }],
      '@stylistic/indent': ['error', 2, {
        SwitchCase: 1,
        VariableDeclarator: 1,
        outerIIFEBody: 1,
        MemberExpression: 1,
        FunctionDeclaration: { parameters: 1, body: 1 },
        FunctionExpression: { parameters: 1, body: 1 },
        CallExpression: { arguments: 1 },
        ArrayExpression: 1,
        ObjectExpression: 1,
        ImportDeclaration: 1,
        flatTernaryExpressions: false,
        ignoreComments: false,
        ignoredNodes: ['TemplateLiteral *', 'JSXElement', 'JSXElement > *', 'JSXAttribute', 'JSXIdentifier', 'JSXNamespacedName', 'JSXMemberExpression', 'JSXSpreadAttribute', 'JSXExpressionContainer', 'JSXOpeningElement', 'JSXClosingElement', 'JSXFragment', 'JSXOpeningFragment', 'JSXClosingFragment', 'JSXText', 'JSXEmptyExpression', 'JSXSpreadChild'],
        offsetTernaryExpressions: false
      }],
      '@stylistic/array-bracket-newline': ['error', 'consistent'],
      '@stylistic/array-element-newline': ['error', 'consistent']
    }
  },
  {
    name: 'vanilla overrides',
    files: ['**/*.*js'],
    ignores: ['build/', 'src/graphql'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off'
    }
  }
]