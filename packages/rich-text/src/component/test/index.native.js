/**
 * Internal dependencies
 */
import { RichText } from '../index';

describe( 'RichText Native', () => {
	let richText;

	beforeEach( () => {
		richText = new RichText( { multiline: false } );
	} );

	describe( 'willTrimSpaces', () => {
		it( 'exists', () => {
			expect( richText ).toHaveProperty( 'willTrimSpaces' );
		} );

		it( 'is a function', () => {
			expect( richText.willTrimSpaces ).toBeInstanceOf( Function );
		} );

		it( 'reports false for styled text with no outer spaces', () => {
			const html = '<p><b>Hello</b> <strong>Hello</strong> WorldWorld!</p>';
			expect( richText.willTrimSpaces( html ) ).toBe( false );
		} );

		it( 'reports false for Preformatted block', () => {
			const html = '<pre>Hello World <br><br><br></pre>';
			richText.props.tagName = 'pre';
			expect( richText.willTrimSpaces( html ) ).toBe( false );
		} );
	} );
} );
