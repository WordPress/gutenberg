/**
 * Internal dependencies
 */
import { create, removeReservedCharacters, RichTextData } from '../create';
import { OBJECT_REPLACEMENT_CHARACTER, ZWNBSP } from '../special-characters';
import { createElement } from '../create-element';
import { registerFormatType } from '../register-format-type';
import { unregisterFormatType } from '../unregister-format-type';
import { toHTMLString } from '../to-html-string';
import { getSparseArrayLength, spec, specWithRegistration } from './helpers';

describe( 'create', () => {
	const em = { type: 'em' };
	const strong = { type: 'strong' };

	beforeAll( () => {
		// Initialize the rich-text store.
		require( '../store' );
	} );

	spec.forEach( ( { description, html, createRange, record } ) => {
		if ( html === undefined ) {
			return;
		}

		// eslint-disable-next-line jest/valid-title
		it( description, () => {
			const element = createElement( document, html );
			const range = createRange( element );
			const createdRecord = create( {
				element,
				range,
			} );
			const formatsLength = getSparseArrayLength( record.formats );
			const createdFormatsLength = getSparseArrayLength(
				createdRecord.formats
			);

			expect( createdRecord ).toEqual( record );
			expect( createdFormatsLength ).toEqual( formatsLength );
		} );
	} );

	specWithRegistration.forEach(
		( {
			description,
			formatName,
			formatType,
			html,
			value: expectedValue,
		} ) => {
			// eslint-disable-next-line jest/valid-title
			it( description, () => {
				if ( formatName ) {
					registerFormatType( formatName, formatType );
				}

				const result = create( { html } );

				if ( formatName ) {
					unregisterFormatType( formatName );
				}

				expect( result ).toEqual( expectedValue );
			} );
		}
	);

	it( 'should reference formats', () => {
		const value = create( { html: '<em>te<strong>st</strong></em>' } );

		expect( value ).toEqual( {
			formats: [ [ em ], [ em ], [ em, strong ], [ em, strong ] ],
			replacements: [ , , , , ],
			text: 'test',
		} );

		// Format objects.
		expect( value.formats[ 0 ][ 0 ] ).toBe( value.formats[ 1 ][ 0 ] );
		expect( value.formats[ 0 ][ 0 ] ).toBe( value.formats[ 2 ][ 0 ] );
		expect( value.formats[ 2 ][ 1 ] ).toBe( value.formats[ 3 ][ 1 ] );

		// Format arrays per index.
		expect( value.formats[ 0 ] ).toBe( value.formats[ 1 ] );
		expect( value.formats[ 2 ] ).toBe( value.formats[ 3 ] );
	} );

	it( 'should use different reference for equal format', () => {
		const value = create( { html: '<a href="#">a</a><a href="#">a</a>' } );

		// Format objects.
		expect( value.formats[ 0 ][ 0 ] ).not.toBe( value.formats[ 1 ][ 0 ] );

		// Format arrays per index.
		expect( value.formats[ 0 ] ).not.toBe( value.formats[ 1 ] );
	} );

	it( 'should use different reference for different format', () => {
		const value = create( { html: '<a href="#">a</a><a href="#a">a</a>' } );

		// Format objects.
		expect( value.formats[ 0 ][ 0 ] ).not.toBe( value.formats[ 1 ][ 0 ] );

		// Format arrays per index.
		expect( value.formats[ 0 ] ).not.toBe( value.formats[ 1 ] );
	} );

	describe( 'collapseWhiteSpace', () => {
		function fromHTML( html ) {
			const element = createElement( document, html );
			const richTextData = RichTextData.fromHTMLElement( element );
			return {
				text: richTextData.text,
				html: toHTMLString( {
					value: {
						text: richTextData.text,
						formats: richTextData.formats,
						replacements: richTextData.replacements,
					},
				} ),
			};
		}

		it( 'should strip leading space at root level', () => {
			const result = fromHTML( ' test' );
			expect( result.text ).toBe( 'test' );
			expect( result.html ).toBe( 'test' );
		} );

		it( 'should strip trailing space at root level', () => {
			const result = fromHTML( 'test ' );
			expect( result.text ).toBe( 'test' );
			expect( result.html ).toBe( 'test' );
		} );

		it( 'should collapse multiple spaces to single space', () => {
			const result = fromHTML( 'hello    world' );
			expect( result.text ).toBe( 'hello world' );
			expect( result.html ).toBe( 'hello world' );
		} );

		it( 'should convert tabs and newlines to spaces', () => {
			const result = fromHTML( 'hello\t\nworld' );
			expect( result.text ).toBe( 'hello world' );
			expect( result.html ).toBe( 'hello world' );
		} );

		it( 'should preserve leading space inside nested element without preceding space', () => {
			const result = fromHTML( 'test<em> word</em>' );
			expect( result.text ).toBe( 'test word' );
			expect( result.html ).toBe( 'test<em> word</em>' );
		} );

		it( 'should preserve trailing space inside nested element without following space', () => {
			const result = fromHTML( '<em>word </em>test' );
			expect( result.text ).toBe( 'word test' );
			expect( result.html ).toBe( '<em>word </em>test' );
		} );

		it( 'should collapse leading space inside nested element with preceding space', () => {
			const result = fromHTML( 'test <em> word</em>' );
			expect( result.text ).toBe( 'test word' );
			expect( result.html ).toBe( 'test <em>word</em>' );
		} );

		it( 'should collapse trailing space inside nested element with following space', () => {
			const result = fromHTML( '<em>word </em> test' );
			expect( result.text ).toBe( 'word test' );
			expect( result.html ).toBe( '<em>word</em> test' );
		} );

		it( 'should strip leading space inside first nested element at root', () => {
			const result = fromHTML( '<em> test</em>' );
			expect( result.text ).toBe( 'test' );
			expect( result.html ).toBe( '<em>test</em>' );
		} );

		it( 'should strip trailing space inside last nested element at root', () => {
			const result = fromHTML( '<em>test </em>' );
			expect( result.text ).toBe( 'test' );
			expect( result.html ).toBe( '<em>test</em>' );
		} );

		it( 'should handle deeply nested elements preserving internal spaces', () => {
			const result = fromHTML( 'a<strong><em> b </em></strong>c' );
			expect( result.text ).toBe( 'a b c' );
			expect( result.html ).toBe( 'a<strong><em> b </em></strong>c' );
		} );

		it( 'should collapse spaces with deeply nested elements and adjacent whitespace', () => {
			const result = fromHTML( 'a <strong><em> b </em></strong> c' );
			expect( result.text ).toBe( 'a b c' );
			expect( result.html ).toBe( 'a <strong><em>b</em></strong> c' );
		} );

		it( 'should collapse spaces between multiple sibling elements', () => {
			const result = fromHTML(
				'<em>a </em><strong> b </strong><em> c</em>'
			);
			expect( result.text ).toBe( 'a b c' );
			expect( result.html ).toBe(
				'<em>a</em><strong> b</strong><em> c</em>'
			);
		} );
	} );

	it( 'removeReservedCharacters should remove all reserved characters', () => {
		expect(
			removeReservedCharacters( `${ OBJECT_REPLACEMENT_CHARACTER }` )
		).toEqual( '' );
		expect( removeReservedCharacters( `${ ZWNBSP }` ) ).toEqual( '' );
		expect(
			removeReservedCharacters(
				`${ OBJECT_REPLACEMENT_CHARACTER }c${ OBJECT_REPLACEMENT_CHARACTER }at${ OBJECT_REPLACEMENT_CHARACTER }`
			)
		).toEqual( 'cat' );
		expect(
			removeReservedCharacters( `${ ZWNBSP }b${ ZWNBSP }at${ ZWNBSP }` )
		).toEqual( 'bat' );
		expect(
			removeReservedCharacters(
				`te${ OBJECT_REPLACEMENT_CHARACTER }st${ ZWNBSP }${ ZWNBSP }`
			)
		).toEqual( 'test' );
	} );
} );
