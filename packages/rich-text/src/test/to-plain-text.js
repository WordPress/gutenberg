/**
 * Internal dependencies
 */
import { toPlainText } from '../to-plain-text';

describe( 'toPlainText', () => {
	beforeAll( () => {
		// Initialize the rich-text store.
		require( '../store' );
	} );

	it( 'removes any HTML from a text string', () => {
		expect( toPlainText( 'This is <em>emphasized</em>' ) ).toBe( 'This is emphasized' );
	} );

	it( 'removes script tags, but does not execute them', () => {
		const html = 'This will not <script>throw "Error"</script>';
		expect( toPlainText( html ) ).toBe( 'This will not throw "Error"' );
		expect( () => toPlainText( html ) ).not.toThrow();
	} );

	it( 'expects strings and an empty string for falsey values', () => {
		expect( toPlainText( '' ) ).toBe( '' );
		expect( toPlainText( undefined ) ).toBe( '' );
		expect( toPlainText( null ) ).toBe( '' );
	} );
} );
