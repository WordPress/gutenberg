/* eslint-disable no-console */

/**
 * External dependencies
 */
import url from 'url';

/**
 * Internal dependencies
 */
import { bumpStat } from '../tracking';

describe( 'bumpStat', () => {
	const originalConsoleError = console.error;
	const originalGetUserSetting = window.getUserSetting;

	beforeEach( () => {
		console.error = jest.fn();
	} );

	afterEach( () => {
		console.error = originalConsoleError;
		window.getUserSetting = originalGetUserSetting;
	} );

	it( 'should reject non-string stat groups', () => {
		expect( bumpStat( 42, 'valid-name' ) ).toBeUndefined();
		expect( console.error ).toHaveBeenCalledWith(
			'Stat group names and stat names must be strings.'
		);
	} );

	it( 'should reject non-string stat names', () => {
		expect( bumpStat( 'valid_group', 42 ) ).toBeUndefined();
		expect( console.error ).toHaveBeenCalledWith(
			'Stat group names and stat names must be strings.'
		);
	} );

	it( 'should reject group names with invalid characters', () => {
		expect( bumpStat( 'invalid-group', 'valid-name' ) ).toBeUndefined();
		expect( console.error ).toHaveBeenCalledWith(
			'Stat group names must consist of letters, numbers, and underscores.'
		);
	} );

	it( 'should reject group names longer than 22 chars', () => {
		expect( bumpStat( Array( 23 + 1 ).join( 'x' ), 'valid-name' ) ).toBeUndefined();
		expect( console.error ).toHaveBeenCalledWith(
			'Stat group names cannot be longer than 22 characters.'
		);
	} );

	it( 'should reject stat names with invalid characters', () => {
		expect( bumpStat( 'group', 'invalidName' ) ).toBeUndefined();
		expect( console.error ).toHaveBeenCalledWith(
			'Stat names must consist of letters, numbers, underscores, and dashes.'
		);
	} );

	it( 'should reject stat names longer than 32 chars', () => {
		expect( bumpStat( 'name', Array( 33 + 1 ).join( 'x' ) ) ).toBeUndefined();
		expect( console.error ).toHaveBeenCalledWith(
			'Stat names cannot be longer than 32 characters.'
		);
	} );

	it( 'should do nothing if the user has not opted in', () => {
		window.getUserSetting = () => 'off';
		expect( bumpStat( 'valid_group', 'valid-name' ) ).toBeUndefined();
		expect( console.error ).not.toHaveBeenCalled();
	} );

	it( 'should bump valid stats', () => {
		// Testing the URL protocol and the randomized `?t=` cache-buster is
		// difficult, so only test the pieces we're actually interested in.
		const statUrlPieces = url.parse(
			bumpStat( 'valid_group', 'valid-name' ),
			true
		);
		expect( statUrlPieces.hostname ).toBe( 'pixel.wp.com' );
		expect( statUrlPieces.pathname ).toBe( '/g.gif' );
		expect( statUrlPieces.query.v ).toBe( 'wpcom-no-pv' );
		expect( statUrlPieces.query.x_gutenberg_valid_group ).toBe( 'valid-name' );
	} );
} );
