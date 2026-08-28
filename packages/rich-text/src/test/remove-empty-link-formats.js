import { create } from '../create';
import { toHTMLString } from '../to-html-string';
import {
	isEmptyLinkReplacement,
	isLinkFormat,
	removeEmptyLinkFormats,
} from '../remove-empty-link-formats';
import { OBJECT_REPLACEMENT_CHARACTER } from '../special-characters';

describe( 'removeEmptyLinkFormats', () => {
	beforeAll( () => {
		require( '../store' );
	} );
	it( 'removes empty link object replacements', () => {
		const value = {
			text: `hello${ OBJECT_REPLACEMENT_CHARACTER }world`,
			formats: [ , , , , , , , , , , , ],
			replacements: [
				,
				,
				,
				,
				,
				{
					type: 'core/link',
					attributes: { url: 'https://google.com' },
				},
				,
				,
				,
				,
				,
				,
			],
		};

		expect( removeEmptyLinkFormats( value ) ).toEqual( {
			text: 'helloworld',
			formats: [ , , , , , , , , , ],
			replacements: [ , , , , , , , , , ],
		} );
	} );

	it( 'preserves non-link object replacements', () => {
		const value = {
			text: OBJECT_REPLACEMENT_CHARACTER,
			formats: [ , ],
			replacements: [
				{
					type: 'img',
					attributes: { src: 'test.jpg' },
				},
			],
		};

		expect( removeEmptyLinkFormats( value ) ).toEqual( value );
	} );

	it( 'preserves non-editable link replacements with inner HTML', () => {
		const value = {
			text: OBJECT_REPLACEMENT_CHARACTER,
			formats: [ , ],
			replacements: [
				{
					type: 'my-plugin/non-editable',
					tagName: 'a',
					innerHTML: 'a',
				},
			],
		};

		expect( removeEmptyLinkFormats( value ) ).toEqual( value );
	} );

	it( 'adjusts selection after removing empty links', () => {
		const value = {
			text: `a${ OBJECT_REPLACEMENT_CHARACTER }b`,
			formats: [ , , , ],
			replacements: [
				,
				{ type: 'a', attributes: { href: 'https://example.com' } },
				,
				,
			],
			start: 2,
			end: 2,
		};

		expect( removeEmptyLinkFormats( value ) ).toEqual( {
			text: 'ab',
			formats: [ , , ],
			replacements: [ , , ],
			start: 1,
			end: 1,
		} );
	} );
} );

describe( 'isEmptyLinkReplacement', () => {
	it( 'detects empty link replacements', () => {
		expect(
			isEmptyLinkReplacement( {
				type: 'core/link',
				attributes: { url: 'https://example.com' },
			} )
		).toBe( true );
		expect(
			isEmptyLinkReplacement( {
				type: 'my-plugin/non-editable',
				tagName: 'a',
				innerHTML: 'a',
			} )
		).toBe( false );
	} );
} );

describe( 'isLinkFormat', () => {
	it( 'detects registered and bare link formats', () => {
		expect(
			isLinkFormat( {
				type: 'core/link',
				attributes: { url: 'https://example.com' },
			} )
		).toBe( true );
		expect(
			isLinkFormat( {
				type: 'a',
				attributes: { href: 'https://example.com' },
			} )
		).toBe( true );
		expect( isLinkFormat( { type: 'strong' } ) ).toBe( false );
	} );
} );

describe( 'create empty link cleanup', () => {
	it( 'drops empty anchor tags when parsing HTML', () => {
		const record = create( {
			html: '<p>Hello<a href="https://google.com"></a> world</p>',
		} );

		expect( record.text ).toBe( 'Hello world' );
		expect(
			record.replacements.every( ( replacement ) => ! replacement )
		).toBe( true );
	} );

	it( 'serializes parsed content without empty anchors', () => {
		const record = create( {
			html: '<h2>Heading<a href="https://google.com"></a></h2>',
		} );

		expect( toHTMLString( { value: record } ) ).toBe( '<h2>Heading</h2>' );
	} );

	it( 'preserves links that contain inline images', () => {
		const html = '<a href="#"><img src="test.jpg"></a>';
		const record = create( { html } );

		expect( toHTMLString( { value: record } ) ).toBe( html );
	} );
} );
