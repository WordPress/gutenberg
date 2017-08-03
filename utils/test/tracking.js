/* eslint-disable no-console */

/**
 * Internal dependencies
 */
import { bumpStat } from '../tracking';

describe( 'bumpStat', () => {
	const originalConsoleError = console.error;
	const originalGetUserSetting = window.getUserSetting;

	beforeEach( () => {
		console.error = jest.fn();
		window.getUserSetting = () => 'off';
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
		expect( bumpStat( 'valid_group', 'valid-name' ) ).toBeUndefined();
		expect( console.error ).not.toHaveBeenCalled();
	} );

	it( 'should bump valid stats', () => {
		window.getUserSetting = () => 'on';
		const url = bumpStat( 'valid_group', 'valid-name' );
		// There are a couple of pieces of the URL where we don't care about
		// testing the specific value.  Replace them with placeholders.
		const urlMatch = url
			.replace( /^[a-z]+:/, 'PROTOCOL:' )
			.replace( /t=[0-9.]+$/, 't=NUMBER' );
		expect( urlMatch ).toBe(
			'PROTOCOL://pixel.wp.com/g.gif?v=wpcom-no-pv'
			+ '&x_gutenberg_valid_group=valid-name'
			+ '&t=NUMBER'
		);
	} );
} );
