/**
 * Internal dependencies
 */

import { updateFormats } from '../update-formats';
import { getSparseArrayLength } from './helpers';

describe( 'updateFormats', () => {
	const em = { type: 'em' };

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
} );
