/**
 * Internal dependencies
 */
import { getLevelFromHeadingNodeName } from '../shared';

describe( 'getLevelFromHeadingNodeName()', () => {
	it( 'should return a numeric value from nodeName', () => {
		const level = getLevelFromHeadingNodeName( 'H4' );

		expect( level ).toBe( 4 );
	} );
} );
