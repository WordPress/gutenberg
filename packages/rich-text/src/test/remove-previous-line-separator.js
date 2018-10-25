/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */

import { removePreviousLineSeparator } from '../remove-previous-line-separator';
import { LINE_SEPARATOR } from '../special-characters';
import { getSparseArrayLength } from './helpers';

describe( 'removePreviousLineSeparator', () => {
	const ol = { type: 'ol' };

	it( 'should remove previous line separator', () => {
		const value = {
			formats: [ , [ ol ], , ],
			text: `1${ LINE_SEPARATOR }2`,
			start: 2,
			end: 2,
		};
		const expected = {
			formats: [ , , ],
			text: '12',
			start: 1,
			end: 1,
		};
		const result = removePreviousLineSeparator( deepFreeze( value ) );

		expect( result ).not.toBe( value );
		expect( result ).toEqual( expected );
		expect( getSparseArrayLength( result.formats ) ).toBe( 0 );
	} );

	it( 'should return undefined if previous character is not a line separator', () => {
		const value = {
			formats: [ , , , ],
			text: `1${ LINE_SEPARATOR }2`,
			start: 3,
			end: 3,
		};
		const result = removePreviousLineSeparator( deepFreeze( value ) );

		expect( result ).toBe( undefined );
	} );

	it( 'should remove previous line separator with empty first item', () => {
		const value = {
			formats: [ [ ol ], , ],
			text: `${ LINE_SEPARATOR }2`,
			start: 1,
			end: 1,
		};
		const expected = {
			formats: [ , ],
			text: '2',
			start: 0,
			end: 0,
		};
		const result = removePreviousLineSeparator( deepFreeze( value ) );

		expect( result ).not.toBe( value );
		expect( result ).toEqual( expected );
		expect( getSparseArrayLength( result.formats ) ).toBe( 0 );
	} );

	it( 'should remove previous line separator with empty last item', () => {
		const value = {
			formats: [ [ ol ] ],
			text: `${ LINE_SEPARATOR }`,
			start: 1,
			end: 1,
		};
		const expected = {
			formats: [],
			text: '',
			start: 0,
			end: 0,
		};
		const result = removePreviousLineSeparator( deepFreeze( value ) );

		expect( result ).not.toBe( value );
		expect( result ).toEqual( expected );
		expect( getSparseArrayLength( result.formats ) ).toBe( 0 );
	} );
} );
