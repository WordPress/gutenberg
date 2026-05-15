/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */

import { removeFormat } from '../remove-format';
import { getSparseArrayLength } from './helpers';

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
		const result = removeFormat( deepFreeze( record ), 'strong', 3, 6 );

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
		const result = removeFormat( deepFreeze( record ), 'strong', 4, 4 );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 3 );
	} );
} );
