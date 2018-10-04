/**
 * Internal dependencies
 */

import { getActiveFormat } from '../get-active-format';

describe( 'getActiveFormat', () => {
	const em = { type: 'em' };

	it( 'should get format by selection', () => {
		const record = {
			_formats: [ [ em ], , , ],
			_text: 'one',
			_start: 0,
			_end: 0,
		};

		expect( getActiveFormat( record, 'em' ) ).toEqual( em );
	} );

	it( 'should get format by selection using the start', () => {
		const record = {
			_formats: [ [ em ], , [ em ] ],
			_text: 'one',
			_start: 1,
			_end: 1,
		};

		expect( getActiveFormat( record, 'em' ) ).toBe( undefined );
	} );
} );
