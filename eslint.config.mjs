import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import playwright from 'eslint-plugin-playwright';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['node_modules/', 'playwright-report/', 'test-results/', 'allure-results/', 'allure-report/'] },
  eslint.configs.recommended,
  // Type-aware rules, including no-floating-promises, which catches a missing `await`.
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  { files: ['tests/**/*.ts'], extends: [playwright.configs['flat/recommended']] },
  { files: ['**/*.mjs'], extends: [tseslint.configs.disableTypeChecked] },
  // Last, so formatting is left entirely to Prettier.
  prettier,
);
