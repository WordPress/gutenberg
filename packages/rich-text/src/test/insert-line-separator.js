/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */

import { insertLineSeparator } from '../insert-line-separator';
import { LINE_SEPARATOR } from '../special-characters';
import { getSparseArrayLength } from './helpers';

describe( 'insertLineSeparator', () => {
	const ol = { type: 'ol' };

	it( 'should insert line separator at end', () => {
		const value = {
			formats: [ , ],
			replacements: new Array( 1 ),
			text: '1',
			start: 1,
			end: 1,
		};
		const expected = {
			formats: [ , , ],
			replacements: new Array( 2 ),
			text: `1${ LINE_SEPARATOR }`,
			start: 2,
			end: 2,
		};
		const result = insertLineSeparator( deepFreeze( value ) );

		expect( result ).not.toBe( value );
		expect( result ).toEqual( expected );
		expect( getSparseArrayLength( result.formats ) ).toBe( 0 );
	} );

	it( 'should insert line separator at start', () => {
		const value = {
			formats: [ , ],
			replacements: new Array( 1 ),
			text: '1',
			start: 0,
			end: 0,
		};
		const expected = {
			formats: [ , , ],
			replacements: new Array ( 2 ),
			text: `${ LINE_SEPARATOR }1`,
			start: 1,
			end: 1,
		};
		const result = insertLineSeparator( deepFreeze( value ) );

		expect( result ).not.toBe( value );
		expect( result ).toEqual( expected );
		expect( getSparseArrayLength( result.formats ) ).toBe( 0 );
	} );

	it( 'should insert line separator with previous line separator formats', () => {
		const value = {
			formats: [ , , , [ ol ], , ],
			replacements: new Array( 5 ),
			text: `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }a`,
			start: 5,
			end: 5,
		};
		const expected = {
			formats: [ , , , [ ol ], , [ ol ] ],
			replacements: new Array( 6 ),
			text: `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }a${ LINE_SEPARATOR }`,
			start: 6,
			end: 6,
		};
		const result = insertLineSeparator( deepFreeze( value ) );

		expect( result ).not.toBe( value );
		expect( result ).toEqual( expected );
		expect( getSparseArrayLength( result.formats ) ).toBe( 2 );
	} );

	it( 'should insert line separator without formats if previous line separator did not have any', () => {
		const value = {
			formats: [ , , , , , ],
			replacements: new Array( 5 ),
			text: `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }a`,
			start: 5,
			end: 5,
		};
		const expected = {
			formats: [ , , , , , , ],
			replacements: new Array( 6 ),
			text: `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }a${ LINE_SEPARATOR }`,
			start: 6,
			end: 6,
		};
		const result = insertLineSeparator( deepFreeze( value ) );

		expect( result ).not.toBe( value );
		expect( result ).toEqual( expected );
		expect( getSparseArrayLength( result.formats ) ).toBe( 0 );
	} );
} );
