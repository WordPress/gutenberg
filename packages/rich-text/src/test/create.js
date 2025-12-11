/**
 * Internal dependencies
 */
import { create, removeReservedCharacters } from '../create';
import { OBJECT_REPLACEMENT_CHARACTER, ZWNBSP } from '../special-characters';
import { createElement } from '../create-element';
import { registerFormatType } from '../register-format-type';
import { unregisterFormatType } from '../unregister-format-type';
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

	it( 'should not nest identical mark elements', () => {
		// Test case for https://github.com/WordPress/gutenberg/issues/58806
		// When pasting highlighted text, identical mark elements should not be nested
		const mark = {
			type: 'mark',
			attributes: {
				style: 'background-color:rgba(0, 0, 0, 0)',
				class: 'has-inline-color has-accent-4-color',
			},
		};

		// HTML representing nested mark elements with identical attributes
		// This simulates what happens when you copy/paste highlighted text
		const html =
			'<mark style="background-color:rgba(0, 0, 0, 0)" class="has-inline-color has-accent-4-color">' +
			'<mark style="background-color:rgba(0, 0, 0, 0)" class="has-inline-color has-accent-4-color">' +
			'test' +
			'</mark>' +
			'</mark>';

		const value = create( { html } );

		// Should have only one mark format per character, not two nested identical marks
		expect( value ).toEqual( {
			formats: [ [ mark ], [ mark ], [ mark ], [ mark ] ],
			replacements: [ , , , , ],
			text: 'test',
		} );

		// All format arrays should reference the same mark object
		expect( value.formats[ 0 ][ 0 ] ).toBe( value.formats[ 1 ][ 0 ] );
		expect( value.formats[ 0 ][ 0 ] ).toBe( value.formats[ 2 ][ 0 ] );
		expect( value.formats[ 0 ][ 0 ] ).toBe( value.formats[ 3 ][ 0 ] );
	} );

	it( 'should nest different mark elements', () => {
		// When marks have different attributes, they should still be nested
		const mark1 = {
			type: 'mark',
			attributes: {
				style: 'background-color:rgba(0, 0, 0, 0)',
				class: 'has-inline-color has-accent-4-color',
			},
		};
		const mark2 = {
			type: 'mark',
			attributes: {
				style: 'background-color:rgba(0, 0, 0, 0)',
				class: 'has-inline-color has-accent-2-color',
			},
		};

		const html =
			'<mark style="background-color:rgba(0, 0, 0, 0)" class="has-inline-color has-accent-4-color">' +
			'<mark style="background-color:rgba(0, 0, 0, 0)" class="has-inline-color has-accent-2-color">' +
			'test' +
			'</mark>' +
			'</mark>';

		const value = create( { html } );

		// Should have two different marks nested
		expect( value ).toEqual( {
			formats: [
				[ mark1, mark2 ],
				[ mark1, mark2 ],
				[ mark1, mark2 ],
				[ mark1, mark2 ],
			],
			replacements: [ , , , , ],
			text: 'test',
		} );
	} );
} );
