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

	describe( 'countBreaksBeforeParagraphTag', () => {
		it( 'exists', () => {
			expect( richText ).toHaveProperty( 'countBreaksBeforeParagraphTag' );
		} );

		it( 'is a function', () => {
			expect( richText.countBreaksBeforeParagraphTag ).toBeInstanceOf( Function );
		} );

		it( 'Counts zero breaks when no breaks are in the text', () => {
			const html = '<p><b>Hello</b> <strong>Hello</strong> WorldWorld! </p>';
			expect( richText.countBreaksBeforeParagraphTag( html ) ).toBe( 0 );
		} );

		it( 'Counts zero breaks when breaks precede a non paragraph tag', () => {
			const html = '<pre><b>Hello</b> <strong>Hello</strong> WorldWorld!<br></pre>';
			expect( richText.countBreaksBeforeParagraphTag( html ) ).toBe( 0 );
		} );

		it( 'Counts zero breaks when no break is not directly in front of ending paragraph tag', () => {
			const html = '<p><b>Hello</b> <br><strong>Hello</strong> WorldWorld!<br><br> </p>';
			expect( richText.countBreaksBeforeParagraphTag( html ) ).toBe( 0 );
		} );

		it( 'Counts one break tag preceding the ending paragraph tag', () => {
			const html = '<p><b>Hello</b> <strong>Hello</strong> WorldWorld!<br></p>';
			expect( richText.countBreaksBeforeParagraphTag( html ) ).toBe( 1 );
		} );

		it( 'Counts multiple break tags preceding the ending paragraph tag', () => {
			const html = '<p><b>Hello</b> <strong>Hello</strong> WorldWorld!<br><br><br></p>';
			expect( richText.countBreaksBeforeParagraphTag( html ) ).toBe( 3 );
		} );

	} );

} );
