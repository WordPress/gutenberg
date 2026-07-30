import '@wordpress/vitest-console';
import { vi } from 'vitest';

vi.spyOn( console, 'groupCollapsed' ).mockImplementation( () => undefined );
vi.spyOn( console, 'groupEnd' ).mockImplementation( () => undefined );
