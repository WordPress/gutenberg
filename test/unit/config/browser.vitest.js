import '@testing-library/jest-dom/vitest';
// eslint-disable-next-line testing-library/no-manual-cleanup -- Vitest globals are disabled, so Testing Library cannot register cleanup automatically.
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import './matchers/to-be-positioned-popover.vitest';

globalThis.tinyMCEPreInit = {
	baseURL: 'about:blank',
};
globalThis.userSettings = { uid: 1 };
globalThis.wpVitest = { timers: vi };

afterEach( cleanup );
