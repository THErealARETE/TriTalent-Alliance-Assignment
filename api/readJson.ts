import { type APIResponse } from '@playwright/test';

/**
 * Parses a response body as T. Playwright types json() as `any`, so this is the one
 * place the cast happens. It is a compile-time type only; tests still assert the content.
 */
export async function readJson<T>(response: APIResponse): Promise<T> {
  return (await response.json()) as T;
}
