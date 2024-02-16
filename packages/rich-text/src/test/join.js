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
			_formats: new Map(),
			replacements: [ , ],
			text: ' ',
		},
	];

	separators.forEach( ( separator ) => {
		it( 'should join records with string separator', () => {
			const one = {
				formats: [ , , [ em ] ],
				_formats: new Map( [ [ em, [ 2, 3 ] ] ] ),
				replacements: [ , , , ],
				text: 'one',
			};
			const two = {
				formats: [ [ em ], , , ],
				_formats: new Map( [ [ em, [ 0, 1 ] ] ] ),
				replacements: [ , , , ],
				text: 'two',
			};
			const three = {
				formats: [ , , [ em ], , [ em ], , , ],
				_formats: new Map( [
					[ em, [ 2, 3 ] ],
					[ em, [ 4, 5 ] ],
				] ),
				replacements: [ , , , , , , , ],
				text: 'one two',
			};
			const result = join(
				[ deepFreeze( one ), deepFreeze( two ) ],
				separator
			);

			expect( result ).not.toBe( one );
			expect( result ).not.toBe( two );
			expect( result ).toEqual( three );
			expect( getSparseArrayLength( result.formats ) ).toBe( 2 );
		} );
	} );
} );
