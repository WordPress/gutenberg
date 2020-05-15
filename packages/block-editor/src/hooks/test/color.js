/**
 * Internal dependencies
 */
import { cleanEmptyObject } from '../utils';

describe( 'cleanEmptyObject', () => {
	it( 'should remove nested keys', () => {
		expect( cleanEmptyObject( { color: { text: undefined } } ) ).toEqual(
			undefined
		);
	} );
} );
