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
			text: ' ',
			formats: [ , ],
		},
	];

	separators.forEach( ( separator ) => {
		it( 'should join records with string separator', () => {
			const one = {
				formats: [ , , [ em ] ],
				text: 'one',
			};
			const two = {
				formats: [ [ em ], , , ],
				text: 'two',
			};
			const three = {
				formats: [ , , [ em ], , [ em ], , , ],
				text: 'one two',
			};
			const result = join( [ deepFreeze( one ), deepFreeze( two ) ], separator );

			expect( result ).not.toBe( one );
			expect( result ).not.toBe( two );
			expect( result ).toEqual( three );
			expect( getSparseArrayLength( result.formats ) ).toBe( 2 );
		} );
	} );
} );
