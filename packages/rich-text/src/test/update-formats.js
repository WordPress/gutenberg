/**
 * Internal dependencies
 */

import { updateFormats } from '../update-formats';
import { create } from '../create';
import { toHTMLString } from '../to-html-string';
import { registerFormatType } from '../register-format-type';
import { unregisterFormatType } from '../unregister-format-type';
import { getSparseArrayLength } from './helpers';

describe( 'updateFormats', () => {
	const em = { type: 'em' };

	beforeAll( () => {
		// Initialize the rich-text store.
		require( '../store' );
	} );

	it( 'should update formats with empty array', () => {
		const value = {
			formats: [ [ em ] ],
			text: '1',
		};
		const expected = {
			...value,
			activeFormats: [],
			formats: [ , ],
		};
		const result = updateFormats( {
			value,
			start: 0,
			end: 1,
			formats: [],
		} );

		expect( result ).toEqual( expected );
		expect( result ).toBe( value );
		expect( getSparseArrayLength( result.formats ) ).toBe( 0 );
	} );

	it( 'should update formats and update references', () => {
		const value = {
			formats: [ [ em ], , ],
			text: '123',
		};
		const expected = {
			...value,
			activeFormats: [ em ],
			formats: [ [ em ], [ em ] ],
		};
		const result = updateFormats( {
			value,
			start: 1,
			end: 2,
			formats: [ { ...em } ],
		} );

		expect( result ).toEqual( expected );
		expect( result ).toBe( value );
		expect( result.formats[ 1 ][ 0 ] ).toBe( em );
		expect( getSparseArrayLength( result.formats ) ).toBe( 2 );
	} );

	it( 'should update references for manually applied formats', () => {
		const formatName = 'my-plugin/highlight';

		registerFormatType( formatName, {
			title: 'Highlight',
			tagName: 'mark',
			className: 'highlight',
			edit() {},
		} );

		// Simulates typing the last character: the value is parsed from the
		// DOM while the active format was applied manually, so the two format
		// objects must be recognized as equal for the reference to be reused.
		const value = create( { html: '<mark class="highlight">test</mark>' } );
		const result = updateFormats( {
			value,
			start: 3,
			end: 4,
			formats: [ { type: formatName } ],
		} );

		expect( result.formats[ 3 ][ 0 ] ).toBe( result.formats[ 2 ][ 0 ] );
		expect( toHTMLString( { value: result } ) ).toBe(
			'<mark class="highlight">test</mark>'
		);

		unregisterFormatType( formatName );
	} );
} );
