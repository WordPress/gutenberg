/**
 * Internal dependencies
 */
import {
	isHorizontalEdge,
	placeCaretAtHorizontalEdge,
	isTextField,
	removeInvalidHTML,
	isEmpty,
} from '../dom';

import { getPhrasingContentSchema } from '../phrasing-content';

describe( 'DOM', () => {
	let parent;

	beforeEach( () => {
		parent = document.createElement( 'div' );
		document.body.appendChild( parent );
	} );

	afterEach( () => {
		parent.remove();
	} );

	describe( 'isHorizontalEdge', () => {
		it( 'should return true for empty input', () => {
			const input = document.createElement( 'input' );
			parent.appendChild( input );
			input.focus();
			expect( isHorizontalEdge( input, true ) ).toBe( true );
			expect( isHorizontalEdge( input, false ) ).toBe( true );
		} );

		it( 'should return the right values if we focus the end of the input', () => {
			const input = document.createElement( 'input' );
			parent.appendChild( input );
			input.value = 'value';
			input.focus();
			input.selectionStart = 5;
			input.selectionEnd = 5;
			expect( isHorizontalEdge( input, true ) ).toBe( false );
			expect( isHorizontalEdge( input, false ) ).toBe( true );
		} );

		it( 'should return the right values if we focus the start of the input', () => {
			const input = document.createElement( 'input' );
			parent.appendChild( input );
			input.value = 'value';
			input.focus();
			input.selectionStart = 0;
			input.selectionEnd = 0;
			expect( isHorizontalEdge( input, true ) ).toBe( true );
			expect( isHorizontalEdge( input, false ) ).toBe( false );
		} );

		it( 'should return false if we’re not at the edge', () => {
			const input = document.createElement( 'input' );
			parent.appendChild( input );
			input.value = 'value';
			input.focus();
			input.selectionStart = 3;
			input.selectionEnd = 3;
			expect( isHorizontalEdge( input, true ) ).toBe( false );
			expect( isHorizontalEdge( input, false ) ).toBe( false );
		} );

		it( 'should return false if the selection is not collapseds', () => {
			const input = document.createElement( 'input' );
			parent.appendChild( input );
			input.value = 'value';
			input.focus();
			input.selectionStart = 0;
			input.selectionEnd = 5;
			expect( isHorizontalEdge( input, true ) ).toBe( false );
			expect( isHorizontalEdge( input, false ) ).toBe( false );
		} );

		it( 'should always return true for non content editabless', () => {
			const div = document.createElement( 'div' );
			parent.appendChild( div );
			expect( isHorizontalEdge( div, true ) ).toBe( true );
			expect( isHorizontalEdge( div, false ) ).toBe( true );
		} );

		it( 'should return true for input types that do not have selection ranges', () => {
			const input = document.createElement( 'input' );
			input.setAttribute( 'type', 'checkbox' );
			parent.appendChild( input );
			expect( isHorizontalEdge( input, true ) ).toBe( true );
			expect( isHorizontalEdge( input, false ) ).toBe( true );
		} );
	} );

	describe( 'placeCaretAtHorizontalEdge', () => {
		it( 'should place caret at the start of the input', () => {
			const input = document.createElement( 'input' );
			input.value = 'value';
			placeCaretAtHorizontalEdge( input, true );
			expect( isHorizontalEdge( input, false ) ).toBe( true );
		} );

		it( 'should place caret at the end of the input', () => {
			const input = document.createElement( 'input' );
			input.value = 'value';
			placeCaretAtHorizontalEdge( input, false );
			expect( isHorizontalEdge( input, true ) ).toBe( true );
		} );
	} );

	describe( 'isTextField', () => {
		/**
		 * A sampling of input types expected not to be text eligible.
		 *
		 * @type {string[]}
		 */
		const NON_TEXT_INPUT_TYPES = [
			'button',
			'checkbox',
			'hidden',
			'file',
			'radio',
			'image',
			'range',
			'reset',
			'submit',
			'email',
			'time',
		];

		/**
		 * A sampling of input types expected to be text eligible.
		 *
		 * @type {string[]}
		 */
		const TEXT_INPUT_TYPES = [ 'text', 'password', 'search', 'url' ];

		it( 'should return false for non-text input elements', () => {
			NON_TEXT_INPUT_TYPES.forEach( ( type ) => {
				const input = document.createElement( 'input' );
				input.type = type;

				expect( isTextField( input ) ).toBe( false );
			} );
		} );

		it( 'should return true for text input elements', () => {
			TEXT_INPUT_TYPES.forEach( ( type ) => {
				const input = document.createElement( 'input' );
				input.type = type;

				expect( isTextField( input ) ).toBe( true );
			} );
		} );

		it( 'should return true for an textarea element', () => {
			expect( isTextField( document.createElement( 'textarea' ) ) ).toBe(
				true
			);
		} );

		it( 'should return true for a contenteditable element', () => {
			const div = document.createElement( 'div' );

			div.contentEditable = 'true';

			expect( isTextField( div ) ).toBe( true );
		} );

		it( 'should return true for a normal div element', () => {
			expect( isTextField( document.createElement( 'div' ) ) ).toBe(
				false
			);
		} );
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
		expect( removeInvalidHTML( input, phrasingContentSchema, true ) ).toBe(
			output
		);
	} );

	it( 'should unwrap node that does not satisfy require', () => {
		const input =
			'<figure><p>test</p><figcaption>test</figcaption></figure>';
		const output = '<p>test</p>test';
		expect( removeInvalidHTML( input, schema ) ).toBe( output );
	} );

	it( 'should remove invalid phrasing content', () => {
		const input = '<strong><p>test</p></strong>';
		const output = '<p>test</p>';
		expect( removeInvalidHTML( input, schema ) ).toEqual( output );
	} );
} );

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
