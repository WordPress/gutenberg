/**
 * External dependencies
 */
import { describe, expect, it } from 'vitest';

/**
 * Internal dependencies
 */
import apiFetch from '..';

describe( 'apiFetch exports', () => {
	it( 'default export is callable', () => {
		expect( typeof apiFetch ).toBe( 'function' );
	} );
} );
