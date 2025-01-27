import neostandard from 'neostandard'

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...neostandard({
    ignores: ['build/'],
    ts: true,
  }),
  {
    name: 'overrides',
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'comma-dangle': 'error'
    }
  }
]
