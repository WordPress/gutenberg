/**
 * Internal dependencies
 */

import { isCollapsed } from '../is-collapsed';

describe( 'isCollapsed', () => {
	it( 'should return true for a collapsed selection', () => {
		const record = {
			start: 4,
			end: 4,
		};

		expect( isCollapsed( record ) ).toBe( true );
	} );
} );
