import { describe, expect, it } from 'vitest';
import { asDangerousHTML, isDangerousHTML, getDangerousHTML } from '../html';

describe( 'asDangerousHTML()', () => {
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
		// A minimal stand-in for a native `TrustedHTML` value, since jsdom
		// doesn't implement the Trusted Types API.
		const trustedValue = { toJSON: () => '<p>x</p>' };
		const token = asDangerousHTML( trustedValue as never );
		expect( getDangerousHTML( token ) ).toBe( trustedValue );
	} );
} );
