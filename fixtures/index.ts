import { mergeTests } from '@playwright/test';
import { test as apiTest } from './api';
import { test as pagesTest } from './pages';

/** Single entry point for specs: every page object and API fixture in one test. */
export const test = mergeTests(pagesTest, apiTest);
export { expect } from '@playwright/test';
