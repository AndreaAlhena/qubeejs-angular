import js from '@eslint/js';
import angular from 'angular-eslint';
import jsdoc from 'eslint-plugin-jsdoc';
import perfectionist from 'eslint-plugin-perfectionist';
import tseslint from 'typescript-eslint';

/*
 * The same rule set as @qubeejs/core (see its CODING-STANDARDS.md), plus the
 * angular-eslint recommendations for the injectables this adapter ships.
 */
export default tseslint.config(
  {
    // The docs site is its own workspace with its own toolchain.
    ignores: [
      '.angular/**',
      'coverage/**',
      'dist/**',
      'docs/**',
      'docs-site/**',
      'node_modules/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  {
    extends: [...angular.configs.tsRecommended],
    files: ['src/**/*.ts', 'router/**/*.ts', 'http/**/*.ts'],
    languageOptions: {
      parserOptions: {
        // One lint-only project covering all three entry points: router/ and
        // http/ import '@qubeejs/angular', which only the spec paths resolve,
        // and specs need jasmine types the root tsconfig.json does not load.
        project: ['./tsconfig.eslint.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { jsdoc, perfectionist },
    rules: {
      /* --- Type safety --- */
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: false }],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      /* --- Naming: underscore required on private, forbidden elsewhere --- */
      '@typescript-eslint/naming-convention': [
        'error',
        {
          format: ['camelCase'],
          leadingUnderscore: 'require',
          modifiers: ['private'],
          selector: 'memberLike',
        },
        {
          format: ['camelCase'],
          leadingUnderscore: 'forbid',
          modifiers: ['protected'],
          selector: 'memberLike',
        },
        {
          format: ['camelCase'],
          leadingUnderscore: 'forbid',
          modifiers: ['public'],
          selector: 'memberLike',
        },
        { format: ['PascalCase'], selector: 'typeLike' },
        { format: ['UPPER_CASE'], selector: 'enumMember' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      /* --- Modern syntax --- */
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/restrict-template-expressions': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      /* --- Documentation --- */
      'jsdoc/require-jsdoc': [
        'error',
        {
          contexts: ['TSInterfaceDeclaration', 'TSTypeAliasDeclaration', 'TSEnumDeclaration'],
          publicOnly: true,
          require: {
            ClassDeclaration: true,
            FunctionDeclaration: true,
            MethodDefinition: true,
          },
        },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-prototype-builtins': 'error',
      'no-var': 'error',
      /* --- Ordering: alphabetical everywhere, auto-fixed --- */
      'perfectionist/sort-classes': [
        'error',
        {
          groups: [
            'index-signature',
            'static-property',
            'private-property',
            'protected-property',
            'property',
            'constructor',
            'private-method',
            'protected-method',
            'method',
          ],
          order: 'asc',
          type: 'alphabetical',
        },
      ],
      'perfectionist/sort-imports': ['error', { order: 'asc', type: 'alphabetical' }],
      'perfectionist/sort-named-imports': ['error', { order: 'asc', type: 'alphabetical' }],
      'prefer-const': 'error',
      'prefer-object-spread': 'error',
    },
  },

  {
    files: ['**/*.spec.ts', 'src/test.ts'],
    rules: {
      '@typescript-eslint/naming-convention': 'off',
      'jsdoc/require-jsdoc': 'off',
    },
  },

  {
    // Config files only. `perfectionist/sort-objects` stays off in the library
    // for the same reason as in the core: object-literal order can be
    // wire-significant once it reaches a request strategy. Config files are
    // outside the tsconfig project, so type-checked rules cannot run here.
    files: ['*.config.mjs', 'karma.conf.js'],
    ...tseslint.configs.disableTypeChecked,
    plugins: { perfectionist },
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      'perfectionist/sort-objects': 'error',
    },
  },

  {
    // The repository checks run on node:test, outside the tsconfig project.
    files: ['test/**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
    languageOptions: {
      globals: { URL: 'readonly' },
    },
  },

  {
    files: ['karma.conf.js'],
    languageOptions: {
      globals: { __dirname: 'readonly', module: 'writable', require: 'readonly' },
      sourceType: 'commonjs',
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  }
);
