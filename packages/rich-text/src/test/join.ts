import { describe, expect, it } from 'vitest';
import { join } from '../join';
import { freezeValue, getSparseArrayLength, partialValue } from './helpers';

describe( 'join', () => {
	const em = { type: 'em' };
	const separators = [
		' ',
		partialValue( {
			formats: [ , ],
			replacements: [ , ],
			text: ' ',
		} ),
	];

	separators.forEach( ( separator ) => {
		it( 'should join records with string separator', () => {
			const one = {
				formats: [ , , [ em ] ],
				replacements: [ , , , ],
				text: 'one',
			};
			const two = {
				formats: [ [ em ], , , ],
				replacements: [ , , , ],
				text: 'two',
			};
			const three = {
				formats: [ , , [ em ], , [ em ], , , ],
				replacements: [ , , , , , , , ],
				text: 'one two',
			};
			const result = join(
				[ freezeValue( one ), freezeValue( two ) ],
				separator
			);

			expect( result ).not.toBe( one );
			expect( result ).not.toBe( two );
			expect( result ).toEqual( three );
			expect( getSparseArrayLength( result.formats ) ).toBe( 2 );
		} );
	} );
} );
