/**
 * Internal dependencies
 */

import { getActiveFormat } from '../get-active-format';

describe( 'getActiveFormat', () => {
	const em = { type: 'em' };

	it( 'should get format by selection', () => {
		const record = {
			formats: [ [ em ], , , ],
			text: 'one',
			start: 0,
			end: 0,
		};

		expect( getActiveFormat( record, 'em' ) ).toEqual( em );
	} );

	it( 'should get format by selection using the start', () => {
		const record = {
			formats: [ [ em ], , [ em ] ],
			text: 'one',
			start: 1,
			end: 1,
		};

		expect( getActiveFormat( record, 'em' ) ).toBe( undefined );
	} );
} );
