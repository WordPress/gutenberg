import '@testing-library/jest-dom/vitest';
// eslint-disable-next-line testing-library/no-manual-cleanup -- Vitest globals are disabled, so Testing Library cannot register cleanup automatically.
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach( cleanup );
