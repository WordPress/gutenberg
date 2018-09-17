import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */

import { applyFormat } from '../apply-format';
import { getSparseArrayLength } from './helpers';

describe( 'applyFormat', () => {
	const strong = { type: 'strong' };
	const em = { type: 'em' };

	it( 'should apply format', () => {
		const record = {
			formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			text: 'one two three',
		};
		const expected = {
			formats: [ , , , [ strong ], [ em, strong ], [ em, strong ], [ em ], , , , , , , ],
			text: 'one two three',
		};
		const result = applyFormat( deepFreeze( record ), strong, 3, 6 );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 4 );
	} );

	it( 'should apply format by selection', () => {
		const record = {
			formats: [ , , , , [ em ], [ em ], [ em ], , , , , , , ],
			text: 'one two three',
			start: 3,
			end: 6,
		};
		const expected = {
			formats: [ , , , [ strong ], [ em, strong ], [ em, strong ], [ em ], , , , , , , ],
			text: 'one two three',
			start: 3,
			end: 6,
		};
		const result = applyFormat( deepFreeze( record ), strong );

		expect( result ).toEqual( expected );
		expect( result ).not.toBe( record );
		expect( getSparseArrayLength( result.formats ) ).toBe( 4 );
	} );
} );
