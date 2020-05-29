/**
 * Internal dependencies
 */
const { getVersionMilestoneTitle } = require( '../milestone' );

describe( 'getVersionMilestoneTitle', () => {
	it( 'should return a milestone title for a given version', () => {
		const title = getVersionMilestoneTitle( '8.3.0-rc.1' );
		expect( title ).toBe( 'Gutenberg 8.3' );
	} );
} );
