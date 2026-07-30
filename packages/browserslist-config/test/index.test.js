/**
 * External dependencies
 */
import browserslist from 'browserslist';
import { expect, it } from 'vitest';

/**
 * Internal dependencies
 */
import config from '../';

it( 'should export an array', () => {
	expect( Array.isArray( config ) ).toBe( true );
} );

it( 'should not contain invalid queries', () => {
	const result = browserslist( config );

	expect( result ).toBeTruthy();
} );
