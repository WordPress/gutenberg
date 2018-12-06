/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */

import { applyLineFormat } from '../apply-line-format';
import { getSparseArrayLength } from './helpers';
import { LINE_SEPARATOR } from '../special-characters';

describe( 'applyFormat', () => {
	const ul = { type: 'ul' };
	const ol = { type: 'ol' };

	it( 'should not apply anything if there is only one line', () => {
		const record = {
			formats: [ , ],
			text: '1',
			start: 1,
			end: 1,
		};
		const result = applyLineFormat( deepFreeze( record ), ul );

		expect( result ).toEqual( record );
		expect( result ).toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 0 );
	} );

	it( 'should apply line format', () => {
		const record = {
			formats: [ , , ],
			text: `1${ LINE_SEPARATOR }`,
			start: 2,
			end: 2,
		};
		const expected = {
			formats: [ , [ ul ] ],
			text: `1${ LINE_SEPARATOR }`,
			start: 2,
			end: 2,
		};
		const result = applyLineFormat( deepFreeze( record ), ul );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 1 );
	} );

	it( 'should not apply additional line format', () => {
		const record = {
			formats: [ , [ ul ] ],
			text: `1${ LINE_SEPARATOR }`,
			start: 2,
			end: 2,
		};
		const result = applyLineFormat( deepFreeze( record ), ul );

		expect( result ).toEqual( record );
		expect( result ).toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 1 );
	} );

	it( 'should apply line format with previous line format', () => {
		const record = {
			formats: [ , [ ol ], , ],
			text: `1${ LINE_SEPARATOR }${ LINE_SEPARATOR }`,
			start: 3,
			end: 3,
		};
		const expected = {
			formats: [ , [ ol ], [ ol ] ],
			text: `1${ LINE_SEPARATOR }${ LINE_SEPARATOR }`,
			start: 3,
			end: 3,
		};
		const result = applyLineFormat( deepFreeze( record ), ul );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 2 );
	} );

	it( 'should apply line format with existing', () => {
		const record = {
			formats: [ , [ ul ], , [ ul ], , ],
			text: `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3`,
			start: 5,
			end: 5,
		};
		const expected = {
			formats: [ , [ ul ], , [ ul, ul ], , ],
			text: `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3`,
			start: 5,
			end: 5,
		};
		const result = applyLineFormat( deepFreeze( record ), ul );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 2 );
	} );

	it( 'should apply line format with multi select', () => {
		const record = {
			formats: [ , , , [ ul ], , ],
			text: `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3`,
			start: 2,
			end: 5,
		};
		const expected = {
			formats: [ , [ ul ], , [ ul, ul ], , ],
			text: `1${ LINE_SEPARATOR }2${ LINE_SEPARATOR }3`,
			start: 2,
			end: 5,
		};
		const result = applyLineFormat( deepFreeze( record ), ul );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 2 );
	} );
} );
