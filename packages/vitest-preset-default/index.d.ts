import type { UserConfig } from 'vite';
import type { TestUserConfig } from 'vitest/node';

declare const config: UserConfig & { test: TestUserConfig };
export default config;
