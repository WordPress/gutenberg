import '@wordpress/vitest-console';
import { beforeEach, vi } from 'vitest';

beforeEach( () => {
	vi.useRealTimers();
} );
