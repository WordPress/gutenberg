/**
 * External dependencies
 */

import { JSDOM } from 'jsdom';

/**
 * Internal dependencies
 */
import { create, removeReservedCharacters } from '../create';
import { OBJECT_REPLACEMENT_CHARACTER, ZWNBSP } from '../special-characters';
import { createElement } from '../create-element';
import { registerFormatType } from '../register-format-type';
import { unregisterFormatType } from '../unregister-format-type';
import { getSparseArrayLength, spec, specWithRegistration } from './helpers';

const { window } = new JSDOM();
const { document } = window;

describe( 'create', () => {
	const em = { type: 'em' };
	const strong = { type: 'strong' };

	beforeAll( () => {
		// Initialize the rich-text store.
		require( '../store' );
	} );

	spec.forEach(
		( {
			description,
			multilineTag,
			multilineWrapperTags,
			html,
			createRange,
			record,
		} ) => {
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
					multilineTag,
					multilineWrapperTags,
				} );
				const formatsLength = getSparseArrayLength( record.formats );
				const createdFormatsLength = getSparseArrayLength(
					createdRecord.formats
				);

				expect( createdRecord ).toEqual( record );
				expect( createdFormatsLength ).toEqual( formatsLength );
			} );
		}
	);

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
} );
