import { afterEach, beforeEach, vi } from 'vitest';

beforeEach( () => {
	vi.useRealTimers();
} );

afterEach( () => {
	vi.restoreAllMocks();
} );
