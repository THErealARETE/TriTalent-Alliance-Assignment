import { existsSync } from 'node:fs';
import path from 'node:path';

// Locally, values come from .env. In CI they are injected as environment variables,
// so the file is optional and real environment variables always take precedence.
const envFile = path.resolve(__dirname, '..', '.env');
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name}. Copy .env.example to .env and fill it in.`);
  }
  return value;
}

function url(name: string): string {
  const value = required(name);
  try {
    return new URL(value).toString();
  } catch {
    throw new Error(`Environment variable ${name} is not a valid URL: "${value}"`);
  }
}

/** Typed, validated configuration. Import this instead of reading process.env directly. */
export const env = Object.freeze({
  sauce: {
    baseUrl: url('SAUCE_BASE_URL'),
    username: required('SAUCE_USERNAME'),
    password: required('SAUCE_PASSWORD'),
  },
  booker: {
    baseUrl: url('BOOKER_BASE_URL'),
    username: required('BOOKER_USERNAME'),
    password: required('BOOKER_PASSWORD'),
  },
});
