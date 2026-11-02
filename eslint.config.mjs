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
  {
    // Page objects, components and fixtures drive the browser too, so they get the same rules as specs.
    files: ['tests/**/*.ts', 'pages/**/*.ts', 'components/**/*.ts', 'fixtures/**/*.ts', 'api/**/*.ts'],
    extends: [playwright.configs['flat/recommended']],
    rules: {
      // Errors, not warnings, so a fixed wait or forced click fails `npm run check` and CI.
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-wait-for-selector': 'error',
      'playwright/no-force-option': 'error',
      'playwright/no-element-handle': 'error',
      'playwright/no-page-pause': 'error',
    },
  },
  { files: ['**/*.mjs'], extends: [tseslint.configs.disableTypeChecked] },
  // Last, so formatting is left entirely to Prettier.
  prettier,
);
