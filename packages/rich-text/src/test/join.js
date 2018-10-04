/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */

import { join } from '../join';
import { getSparseArrayLength } from './helpers';

describe( 'join', () => {
	const em = { type: 'em' };
	const separators = [
		' ',
		{
			_text: ' ',
			_formats: [ , ],
		},
	];

	separators.forEach( ( separator ) => {
		it( 'should join records with string separator', () => {
			const one = {
				_formats: [ , , [ em ] ],
				_text: 'one',
			};
			const two = {
				_formats: [ [ em ], , , ],
				_text: 'two',
			};
			const three = {
				_formats: [ , , [ em ], , [ em ], , , ],
				_text: 'one two',
			};
			const result = join( [ deepFreeze( one ), deepFreeze( two ) ], separator );

			expect( result ).not.toBe( one );
			expect( result ).not.toBe( two );
			expect( result ).toEqual( three );
			expect( getSparseArrayLength( result._formats ) ).toBe( 2 );
		} );
	} );
} );
