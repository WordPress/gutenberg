import { afterEach, describe, expect, it, vi } from 'vitest';
import { prefersReducedMotion } from '../prefers-reduced-motion';

// jsdom does not implement `matchMedia`, so it is assigned rather than spied on.
const originalMatchMedia = window.matchMedia;

afterEach( () => {
	window.matchMedia = originalMatchMedia;
} );

describe( 'prefersReducedMotion', () => {
	it( 'returns true when the preference is set to reduce', () => {
		window.matchMedia = vi.fn( ( query: string ) => ( {
			matches: true,
			media: query,
		} ) ) as unknown as typeof window.matchMedia;

		expect( prefersReducedMotion() ).toBe( true );
		expect( window.matchMedia ).toHaveBeenCalledWith(
			'(prefers-reduced-motion: reduce)'
		);
	} );

	it( 'returns false when the preference is not set', () => {
		window.matchMedia = vi.fn( () => ( {
			matches: false,
		} ) ) as unknown as typeof window.matchMedia;

		expect( prefersReducedMotion() ).toBe( false );
	} );

	it( 'returns false when the browser does not support matchMedia', () => {
		window.matchMedia = undefined as unknown as typeof window.matchMedia;

		expect( prefersReducedMotion() ).toBe( false );
	} );
} );
