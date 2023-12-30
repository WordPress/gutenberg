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

	it( 'should remove partial nested keys', () => {
		expect(
			cleanEmptyObject( {
				color: { text: undefined },
				typography: { fontSize: '10px' },
			} )
		).toEqual( {
			typography: { fontSize: '10px' },
		} );
	} );

	it( 'should not remove falsy nested keys', () => {
		expect( cleanEmptyObject( { color: { text: false } } ) ).not.toEqual(
			undefined
		);
		expect( cleanEmptyObject( { color: { text: '' } } ) ).not.toEqual(
			undefined
		);
	} );
} );
