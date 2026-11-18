import { describe, expect, it } from 'vitest';
import { removeFormat } from '../remove-format';
import { freezeValue, getSparseArrayLength } from './helpers';

describe( 'removeFormat', () => {
	const strong = { type: 'strong' };
	const em = { type: 'em' };

	it( 'should remove format', () => {
		const record = {
			formats: [
				,
				,
				,
				[ strong ],
				[ em, strong ],
				[ em, strong ],
				[ em ],
				,
				,
				,
				,
				,
				,
			],
			text: 'one two three',
		};
		const expected = {
			formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			activeFormats: [],
			text: 'one two three',
		};
		const result = removeFormat( freezeValue( record ), 'strong', 3, 6 );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 3 );
	} );

	it( 'should remove format for collapsed selection', () => {
		const record = {
			formats: [
				,
				,
				,
				[ strong ],
				[ em, strong ],
				[ em, strong ],
				[ em ],
				,
				,
				,
				,
				,
				,
			],
			text: 'one two three',
		};
		const expected = {
			formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			activeFormats: [],
			text: 'one two three',
		};
		const result = removeFormat( freezeValue( record ), 'strong', 4, 4 );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 3 );
	} );
} );
