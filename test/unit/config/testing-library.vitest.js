import * as matchers from '@testing-library/jest-dom/matchers';
// eslint-disable-next-line testing-library/no-manual-cleanup -- Vitest globals are disabled, so Testing Library cannot register cleanup automatically.
import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';

expect.extend( matchers );
afterEach( cleanup );
