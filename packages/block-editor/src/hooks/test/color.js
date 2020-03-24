/**
 * Internal dependencies
 */
import { cleanEmptyObject } from '../color';

describe( 'cleanEmptyObject', () => {
	it( 'should remove nested keys', () => {
		expect( cleanEmptyObject( { color: { text: undefined } } ) ).toEqual(
			undefined
		);
	} );
} );
