import { afterEach, describe, expect, it, vi } from 'vitest';
import { asDangerousHTML, isDangerousHTML, getDangerousHTML } from '../html';

describe( 'asDangerousHTML()', () => {
	afterEach( () => {
		vi.unstubAllGlobals();
	} );

	it( 'returns a token isDangerousHTML() recognizes', () => {
		const token = asDangerousHTML( '<strong>Hi</strong>' );
		expect( isDangerousHTML( token ) ).toBe( true );
	} );

	it( 'does not expose the underlying HTML on the returned token', () => {
		const token = asDangerousHTML( '<strong>Hi</strong>' );
		expect( Object.keys( token ) ).toEqual( [] );
		expect( Object.getOwnPropertySymbols( token ) ).toEqual( [] );
		expect( JSON.stringify( token ) ).toBe( '{}' );
	} );

	it( 'does not treat a shallow clone of the token as trusted', () => {
		const token = asDangerousHTML( '<strong>Hi</strong>' );
		expect( isDangerousHTML( { ...token } ) ).toBe( false );
	} );

	it( 'does not treat a value round-tripped through JSON as trusted', () => {
		const token = asDangerousHTML( '<strong>Hi</strong>' );
		const roundTripped = JSON.parse( JSON.stringify( token ) );
		expect( isDangerousHTML( roundTripped ) ).toBe( false );
	} );

	it( 'does not treat an unrelated frozen, null-prototype object as trusted', () => {
		expect(
			isDangerousHTML( Object.freeze( Object.create( null ) ) )
		).toBe( false );
	} );

	it( 'returns the exact HTML value passed in, without converting it', () => {
		const token = asDangerousHTML( '<strong>Hi</strong>' );
		expect( getDangerousHTML( token ) ).toBe( '<strong>Hi</strong>' );
	} );

	it( 'stores and returns a TrustedHTML-like value without converting it', () => {
		// A minimal stand-in for a native `TrustedHTML` value, since this
		// environment doesn't implement the Trusted Types API.
		const trustedValue = { toJSON: () => '<p>x</p>' };
		vi.stubGlobal( 'trustedTypes', {
			isHTML: ( value: unknown ) => value === trustedValue,
		} );
		const token = asDangerousHTML( trustedValue as never );
		expect( getDangerousHTML( token ) ).toBe( trustedValue );
	} );

	describe( 'input validation', () => {
		it.each( [
			[ 'a string', '<strong>Hi</strong>' ],
			[ 'an empty string', '' ],
		] )( 'accepts %s', ( _, html ) => {
			expect( isDangerousHTML( asDangerousHTML( html ) ) ).toBe( true );
		} );

		it.each( [
			[ 'null', null ],
			[ 'undefined', undefined ],
			[ 'a number', 42 ],
			[ 'a plain object', { toJSON: () => '<p>x</p>' } ],
			[ 'an array', [ '<p>x</p>' ] ],
			[ 'a function', () => '<p>x</p>' ],
			[ 'a token from an earlier call', asDangerousHTML( '<p>x</p>' ) ],
		] )( 'throws a TypeError for %s', ( _, html ) => {
			expect( () => asDangerousHTML( html as never ) ).toThrow(
				TypeError
			);
		} );

		it( 'throws a TypeError when called with no argument', () => {
			expect( () =>
				// @ts-expect-error Testing a missing argument on purpose.
				asDangerousHTML()
			).toThrow( TypeError );
		} );

		it( 'throws a TypeError for an object trustedTypes.isHTML() rejects', () => {
			vi.stubGlobal( 'trustedTypes', { isHTML: () => false } );
			expect( () =>
				asDangerousHTML( { toJSON: () => '<p>x</p>' } as never )
			).toThrow( TypeError );
		} );
	} );
} );
