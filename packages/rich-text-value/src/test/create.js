/**
 * External dependencies
 */

import { JSDOM } from 'jsdom';

/**
 * Internal dependencies
 */

import { create, createValue } from '../create';
import { getSparseArrayLength } from './helpers';

const { window } = new JSDOM();
const { document } = window;

function createElement( html ) {
	const htmlDocument = document.implementation.createHTMLDocument( '' );

	htmlDocument.body.innerHTML = html;

	return htmlDocument.body;
}

describe( 'create', () => {
	const em = { type: 'em' };
	const strong = { type: 'strong' };
	const img = { type: 'img', attributes: { src: '' }, object: true };
	const a = { type: 'a', attributes: { href: '#' } };
	const list = [ { type: 'ul' }, { type: 'li' } ];

	const spec = [
		{
			description: 'should create an empty value',
			html: '',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 0,
				endContainer: element,
			} ),
			record: {
				start: 0,
				end: 0,
				formats: [],
				text: '',
			},
		},
		{
			description: 'should ignore line breaks to format HTML',
			html: '\n\n\r\n',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 1,
				endContainer: element,
			} ),
			record: {
				start: 0,
				end: 0,
				formats: [],
				text: '',
			},
		},
		{
			description: 'should create an empty value from empty tags',
			html: '<em></em>',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 1,
				endContainer: element,
			} ),
			record: {
				start: 0,
				end: 0,
				formats: [],
				text: '',
			},
		},
		{
			description: 'should create a value without formatting',
			html: 'test',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element.firstChild,
				endOffset: 4,
				endContainer: element.firstChild,
			} ),
			record: {
				start: 0,
				end: 4,
				formats: [ , , , , ],
				text: 'test',
			},
		},
		{
			description: 'should preserve emoji',
			html: '🍒',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 1,
				endContainer: element,
			} ),
			record: {
				start: 0,
				end: 2,
				formats: [ , , ],
				text: '🍒',
			},
		},
		{
			description: 'should preserve emoji in formatting',
			html: '<em>🍒</em>',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 1,
				endContainer: element,
			} ),
			record: {
				start: 0,
				end: 2,
				formats: [ [ em ], [ em ] ],
				text: '🍒',
			},
		},
		{
			description: 'should create a value with formatting',
			html: '<em>test</em>',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element.firstChild,
				endOffset: 1,
				endContainer: element.firstChild,
			} ),
			record: {
				start: 0,
				end: 4,
				formats: [ [ em ], [ em ], [ em ], [ em ] ],
				text: 'test',
			},
		},
		{
			description: 'should create a value with nested formatting',
			html: '<em><strong>test</strong></em>',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 1,
				endContainer: element,
			} ),
			record: {
				start: 0,
				end: 4,
				formats: [ [ em, strong ], [ em, strong ], [ em, strong ], [ em, strong ] ],
				text: 'test',
			},
		},
		{
			description: 'should create a value with formatting for split tags',
			html: '<em>te</em><em>st</em>',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element.querySelector( 'em' ),
				endOffset: 1,
				endContainer: element.querySelector( 'em' ),
			} ),
			record: {
				start: 0,
				end: 2,
				formats: [ [ em ], [ em ], [ em ], [ em ] ],
				text: 'test',
			},
		},
		{
			description: 'should create a value with formatting with attributes',
			html: '<a href="#">test</a>',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 1,
				endContainer: element,
			} ),
			record: {
				start: 0,
				end: 4,
				formats: [ [ a ], [ a ], [ a ], [ a ] ],
				text: 'test',
			},
		},
		{
			description: 'should create a value with image object',
			html: '<img src="">',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 1,
				endContainer: element,
			} ),
			record: {
				start: 0,
				end: 0,
				formats: [ [ img ] ],
				text: '\ufffc',
			},
		},
		{
			description: 'should create a value with image object and formatting',
			html: '<em><img src=""></em>',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element.querySelector( 'img' ),
				endOffset: 1,
				endContainer: element.querySelector( 'img' ),
			} ),
			record: {
				start: 0,
				end: 1,
				formats: [ [ em, img ] ],
				text: '\ufffc',
			},
		},
		{
			description: 'should create a value with image object and text before',
			html: 'te<em>st<img src=""></em>',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 2,
				endContainer: element,
			} ),
			record: {
				start: 0,
				end: 5,
				formats: [ , , [ em ], [ em ], [ em, img ] ],
				text: 'test\ufffc',
			},
		},
		{
			description: 'should create a value with image object and text after',
			html: '<em><img src="">te</em>st',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 2,
				endContainer: element,
			} ),
			record: {
				start: 0,
				end: 5,
				formats: [ [ em, img ], [ em ], [ em ], , , ],
				text: '\ufffctest',
			},
		},
		{
			description: 'should handle br',
			html: '<br>',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 1,
				endContainer: element,
			} ),
			record: {
				start: 0,
				end: 0,
				formats: [ , ],
				text: '\n',
			},
		},
		{
			description: 'should handle br with text',
			html: 'te<br>st',
			createRange: ( element ) => ( {
				startOffset: 1,
				startContainer: element,
				endOffset: 2,
				endContainer: element,
			} ),
			record: {
				start: 2,
				end: 2,
				formats: [ , , , , , ],
				text: 'te\nst',
			},
		},
		{
			description: 'should handle br with formatting',
			html: '<em><br></em>',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 1,
				endContainer: element,
			} ),
			record: {
				start: 0,
				end: 1,
				formats: [ [ em ] ],
				text: '\n',
			},
		},
		{
			description: 'should handle multiline value',
			multiline: 'p',
			html: '<p>one</p><p>two</p>',
			createRange: ( element ) => ( {
				startOffset: 1,
				startContainer: element.querySelector( 'p' ).firstChild,
				endOffset: 0,
				endContainer: element.lastChild,
			} ),
			record: {
				start: 1,
				end: 3,
				formats: [ , , , , , , , , ],
				text: 'one\n\ntwo',
			},
		},
		{
			description: 'should handle multiline list value',
			multiline: 'li',
			html: '<li>one<ul><li>two</li></ul></li><li>three</li>',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 1,
				endContainer: element,
			} ),
			record: {
				start: 0,
				end: 6,
				formats: [ , , , list, list, list, , , , , , , , ],
				text: 'onetwo\n\nthree',
			},
		},
		{
			description: 'should remove with settings',
			settings: {
				unwrapNodeMatch: ( node ) => !! node.getAttribute( 'data-mce-bogus' ),
			},
			html: '<strong data-mce-bogus="true"></strong>',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 1,
				endContainer: element,
			} ),
			record: {
				start: 0,
				end: 0,
				formats: [],
				text: '',
			},
		},
		{
			description: 'should remove br with settings',
			settings: {
				unwrapNodeMatch: ( node ) => !! node.getAttribute( 'data-mce-bogus' ),
			},
			html: '<br data-mce-bogus="true">',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 1,
				endContainer: element,
			} ),
			record: {
				start: 0,
				end: 0,
				formats: [],
				text: '',
			},
		},
		{
			description: 'should unwrap with settings',
			settings: {
				unwrapNodeMatch: ( node ) => !! node.getAttribute( 'data-mce-bogus' ),
			},
			html: '<strong data-mce-bogus="true">te<em>st</em></strong>',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 1,
				endContainer: element,
			} ),
			record: {
				start: 0,
				end: 4,
				formats: [ , , [ em ], [ em ] ],
				text: 'test',
			},
		},
		{
			description: 'should remove with children with settings',
			settings: {
				removeNodeMatch: ( node ) => node.getAttribute( 'data-mce-bogus' ) === 'all',
			},
			html: '<strong data-mce-bogus="all">one</strong>two',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element.lastChild,
				endOffset: 1,
				endContainer: element.lastChild,
			} ),
			record: {
				start: 0,
				end: 1,
				formats: [ , , , ],
				text: 'two',
			},
		},
		{
			description: 'should filter format attributes with settings',
			settings: {
				removeAttributeMatch: ( attribute ) => attribute.indexOf( 'data-mce-' ) === 0,
			},
			html: '<strong data-mce-selected="inline-boundary">test</strong>',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 1,
				endContainer: element,
			} ),
			record: {
				start: 0,
				end: 4,
				formats: [ [ strong ], [ strong ], [ strong ], [ strong ] ],
				text: 'test',
			},
		},
		{
			description: 'should filter text with settings',
			settings: {
				filterString: ( string ) => string.replace( '\uFEFF', '' ),
			},
			html: '&#65279;',
			createRange: ( element ) => ( {
				startOffset: 0,
				startContainer: element,
				endOffset: 1,
				endContainer: element,
			} ),
			record: {
				start: 0,
				end: 0,
				formats: [],
				text: '',
			},
		},
		{
			description: 'should filter text at end with settings',
			settings: {
				filterString: ( string ) => string.replace( '\uFEFF', '' ),
			},
			html: 'test&#65279;',
			createRange: ( element ) => ( {
				startOffset: 4,
				startContainer: element.firstChild,
				endOffset: 4,
				endContainer: element.firstChild,
			} ),
			record: {
				start: 4,
				end: 4,
				formats: [ , , , , ],
				text: 'test',
			},
		},
		{
			description: 'should filter text in format with settings',
			settings: {
				filterString: ( string ) => string.replace( '\uFEFF', '' ),
			},
			html: '<em>test&#65279;</em>',
			createRange: ( element ) => ( {
				startOffset: 5,
				startContainer: element.querySelector( 'em' ).firstChild,
				endOffset: 5,
				endContainer: element.querySelector( 'em' ).firstChild,
			} ),
			record: {
				start: 4,
				end: 4,
				formats: [ [ em ], [ em ], [ em ], [ em ] ],
				text: 'test',
			},
		},
		{
			description: 'should filter text outside format with settings',
			settings: {
				filterString: ( string ) => string.replace( '\uFEFF', '' ),
			},
			html: '<em>test</em>&#65279;',
			createRange: ( element ) => ( {
				startOffset: 1,
				startContainer: element.lastChild,
				endOffset: 1,
				endContainer: element.lastChild,
			} ),
			record: {
				start: 4,
				end: 4,
				formats: [ [ em ], [ em ], [ em ], [ em ] ],
				text: 'test',
			},
		},
	];

	spec.forEach( ( { description, multiline, settings, html, createRange, record } ) => {
		it( description, () => {
			const element = createElement( html );
			const range = createRange( element );
			const createdRecord = create( element, range, multiline, settings );
			expect( createdRecord ).toEqual( record );

			if ( ! multiline ) {
				const formatsLength = getSparseArrayLength( record.formats );
				const createdFormatsLength = getSparseArrayLength( createdRecord.formats );
				expect( createdFormatsLength ).toEqual( formatsLength );
			}
		} );
	} );

	it( 'should reference formats', () => {
		const value = createValue( '<em>te<strong>st</strong></em>' );

		expect( value ).toEqual( {
			formats: [ [ em ], [ em ], [ em, strong ], [ em, strong ] ],
			text: 'test',
		} );

		expect( value.formats[ 0 ][ 0 ] ).toBe( value.formats[ 1 ][ 0 ] );
		expect( value.formats[ 0 ][ 0 ] ).toBe( value.formats[ 2 ][ 0 ] );
		expect( value.formats[ 2 ][ 1 ] ).toBe( value.formats[ 3 ][ 1 ] );
	} );
} );
