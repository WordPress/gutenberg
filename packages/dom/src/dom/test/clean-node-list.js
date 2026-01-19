/**
 * Internal dependencies
 */
import removeInvalidHTML from '../remove-invalid-html';

describe( 'cleanNodeList', () => {
	it( 'should preserve whitespace when unwrapping empty phrasing elements', () => {
		const schema = {
			p: { children: { '#text': {} } },
		};
		// Whitespace inside <b> should be preserved when <b> is unwrapped.
		const input = '<p>some text<b> </b>more text</p>';
		const output = '<p>some text more text</p>';
		expect( removeInvalidHTML( input, schema, false ) ).toEqual( output );
	} );

	it( 'should preserve whitespace in various phrasing elements', () => {
		const schema = {
			p: { children: { '#text': {} } },
		};
		// Test with different phrasing elements.
		expect(
			removeInvalidHTML(
				'<p>hello<strong> </strong>world</p>',
				schema,
				false
			)
		).toEqual( '<p>hello world</p>' );
		expect(
			removeInvalidHTML( '<p>hello<em> </em>world</p>', schema, false )
		).toEqual( '<p>hello world</p>' );
		expect(
			removeInvalidHTML( '<p>hello<sup> </sup>world</p>', schema, false )
		).toEqual( '<p>hello world</p>' );
	} );

	it( 'should remove truly empty elements without whitespace', () => {
		const schema = {
			p: { children: { '#text': {} } },
		};
		const input = '<p>some text<b></b>more text</p>';
		const output = '<p>some textmore text</p>';
		expect( removeInvalidHTML( input, schema, false ) ).toEqual( output );
	} );

	it( 'should remove empty block elements entirely (not unwrap)', () => {
		const schema = {
			figure: {
				children: {
					img: {},
				},
			},
		};
		// Block elements like figure should be removed, not unwrapped.
		const input = '<figure> </figure>';
		const output = '';
		expect( removeInvalidHTML( input, schema, false ) ).toEqual( output );
	} );
} );
