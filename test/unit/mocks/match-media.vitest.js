/**
 * External dependencies
 */
import { afterAll, beforeAll, vi } from 'vitest';

if ( typeof window !== 'undefined' ) {
	const originalMatchMedia = window.matchMedia;
	const mockedMatchMedia = vi.fn( ( query ) => {
		if ( /prefers-reduced-motion/.test( query ) ) {
			return {
				...originalMatchMedia( query ),
				matches: true,
			};
		}

		return originalMatchMedia( query );
	} );

	beforeAll( () => {
		window.matchMedia = vi.fn( mockedMatchMedia );
	} );

	afterAll( () => {
		window.matchMedia = originalMatchMedia;
	} );
}
