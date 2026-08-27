import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import './matchers/to-be-positioned-popover.vitest';

globalThis.tinyMCEPreInit = {
	baseURL: 'about:blank',
};
globalThis.userSettings = { uid: 1 };

afterEach( cleanup );
