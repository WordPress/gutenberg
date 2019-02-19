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
			formats: [ , ],
			lineFormats: [ , ],
			objects: [ , ],
			text: ' ',
		},
	];

	separators.forEach( ( separator ) => {
		it( 'should join records with string separator', () => {
			const one = {
				formats: [ , , [ em ] ],
				lineFormats: [ , , , ],
				objects: [ , , , ],
				text: 'one',
			};
			const two = {
				formats: [ [ em ], , , ],
				lineFormats: [ , , , ],
				objects: [ , , , ],
				text: 'two',
			};
			const three = {
				formats: [ , , [ em ], , [ em ], , , ],
				lineFormats: [ , , , , , , , ],
				objects: [ , , , , , , , ],
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
