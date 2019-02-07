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

	it( 'should not get any format if outside boundary position', () => {
		const record = {
			formats: [ [ em ], , [ em ] ],
			text: 'one',
			start: 1,
			end: 1,
			selectedFormat: 0,
		};

		expect( getActiveFormat( record, 'em' ) ).toBe( undefined );
	} );

	it( 'should get format if inside boundary position', () => {
		const record = {
			formats: [ [ em ], , [ em ] ],
			text: 'one',
			start: 1,
			end: 1,
			selectedFormat: 1,
		};

		expect( getActiveFormat( record, 'em' ) ).toBe( em );
	} );
} );
