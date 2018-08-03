/**
 * Internal dependencies
 */
import { getPhrasingContentSchema } from '../phrasing-content';
import { isEmpty, isPlain, removeInvalidHTML } from '../utils';

describe( 'isEmpty', () => {
	function isEmptyHTML( HTML ) {
		const doc = document.implementation.createHTMLDocument( '' );

		doc.body.innerHTML = HTML;

		return isEmpty( doc.body );
	}

	it( 'should return true for empty element', () => {
		expect( isEmptyHTML( '' ) ).toBe( true );
	} );

	it( 'should return true for element with only whitespace', () => {
		expect( isEmptyHTML( ' ' ) ).toBe( true );
	} );

	it( 'should return true for element with non breaking space', () => {
		expect( isEmptyHTML( '&nbsp;' ) ).toBe( true );
	} );

	it( 'should return true for element with BR', () => {
		expect( isEmptyHTML( '<br>' ) ).toBe( true );
	} );

	it( 'should return true for element with empty element', () => {
		expect( isEmptyHTML( '<em></em>' ) ).toBe( true );
	} );

	it( 'should return false for element with image', () => {
		expect( isEmptyHTML( '<img src="">' ) ).toBe( false );
	} );

	it( 'should return true for element with mixed empty pieces', () => {
		expect( isEmptyHTML( ' <br><br><em>&nbsp; </em>' ) ).toBe( true );
	} );
} );

describe( 'isPlain', () => {
	it( 'should return true for plain text', () => {
		expect( isPlain( 'test' ) ).toBe( true );
	} );

	it( 'should return true for only line breaks', () => {
		expect( isPlain( 'test<br>test' ) ).toBe( true );
		expect( isPlain( 'test<br/>test' ) ).toBe( true );
		expect( isPlain( 'test<br />test' ) ).toBe( true );
		expect( isPlain( 'test<br data-test>test' ) ).toBe( true );
	} );

	it( 'should return false for formatted text', () => {
		expect( isPlain( '<strong>test</strong>' ) ).toBe( false );
		expect( isPlain( '<strong>test<br></strong>' ) ).toBe( false );
		expect( isPlain( 'test<br-custom>test' ) ).toBe( false );
	} );
} );

describe( 'removeInvalidHTML', () => {
	const phrasingContentSchema = getPhrasingContentSchema();
	const schema = {
		p: {
			children: phrasingContentSchema,
		},
		figure: {
			require: [ 'img' ],
			children: {
				img: {
					attributes: [ 'src', 'alt' ],
					classes: [ 'alignleft' ],
				},
				figcaption: {
					children: phrasingContentSchema,
				},
			},
		},
		...phrasingContentSchema,
	};

	it( 'should leave plain text alone', () => {
		const input = 'test';
		expect( removeInvalidHTML( input, schema ) ).toBe( input );
	} );

	it( 'should leave valid phrasing content alone', () => {
		const input = '<strong>test</strong>';
		expect( removeInvalidHTML( input, schema ) ).toBe( input );
	} );

	it( 'should remove unrecognised tags from phrasing content', () => {
		const input = '<strong><div>test</div></strong>';
		const output = '<strong>test</strong>';
		expect( removeInvalidHTML( input, schema ) ).toBe( output );
	} );

	it( 'should remove unwanted whitespace outside phrasing content', () => {
		const input = '<figure><img src=""> </figure>';
		const output = '<figure><img src=""></figure>';
		expect( removeInvalidHTML( input, schema ) ).toBe( output );
	} );

	it( 'should remove attributes', () => {
		const input = '<p class="test">test</p>';
		const output = '<p>test</p>';
		expect( removeInvalidHTML( input, schema ) ).toBe( output );
	} );

	it( 'should remove id attributes', () => {
		const input = '<p id="foo">test</p>';
		const output = '<p>test</p>';
		expect( removeInvalidHTML( input, schema ) ).toBe( output );
	} );

	it( 'should remove multiple attributes', () => {
		const input = '<p class="test" id="test">test</p>';
		const output = '<p>test</p>';
		expect( removeInvalidHTML( input, schema ) ).toBe( output );
	} );

	it( 'should deep remove attributes', () => {
		const input = '<p class="test">test <em id="test">test</em></p>';
		const output = '<p>test <em>test</em></p>';
		expect( removeInvalidHTML( input, schema ) ).toBe( output );
	} );

	it( 'should remove data-* attributes', () => {
		const input = '<p data-reactid="1">test</p>';
		const output = '<p>test</p>';
		expect( removeInvalidHTML( input, schema ) ).toBe( output );
	} );

	it( 'should keep some attributes', () => {
		const input = '<a href="#keep" target="_blank">test</a>';
		const output = '<a href="#keep" target="_blank">test</a>';
		expect( removeInvalidHTML( input, schema ) ).toBe( output );
	} );

	it( 'should keep some classes', () => {
		const input = '<figure><img class="alignleft test" src=""></figure>';
		const output = '<figure><img class="alignleft" src=""></figure>';
		expect( removeInvalidHTML( input, schema ) ).toBe( output );
	} );

	it( 'should remove empty nodes that should have children', () => {
		const input = '<figure> </figure>';
		const output = '';
		expect( removeInvalidHTML( input, schema ) ).toBe( output );
	} );

	it( 'should break up block content with phrasing schema', () => {
		const input = '<p>test</p><p>test</p>';
		const output = 'test<br>test';
		expect( removeInvalidHTML( input, phrasingContentSchema, true ) ).toBe( output );
	} );

	it( 'should unwrap node that does not satisfy require', () => {
		const input = '<figure><p>test</p><figcaption>test</figcaption></figure>';
		const output = '<p>test</p>test';
		expect( removeInvalidHTML( input, schema ) ).toBe( output );
	} );
} );
