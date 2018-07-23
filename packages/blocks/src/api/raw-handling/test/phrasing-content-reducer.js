/**
 * Internal dependencies
 */
import phrasingContentReducer from '../phrasing-content-reducer';
import { deepFilterHTML } from '../utils';

describe( 'phrasingContentReducer', () => {
	it( 'should transform font weight', () => {
		expect( deepFilterHTML( '<span style="font-weight:bold">test</span>', [ phrasingContentReducer ], {} ) ).toEqual( '<strong>test</strong>' );
	} );

	it( 'should transform numeric font weight', () => {
		expect( deepFilterHTML( '<span style="font-weight:700">test</span>', [ phrasingContentReducer ], {} ) ).toEqual( '<strong>test</strong>' );
	} );

	it( 'should transform font style', () => {
		expect( deepFilterHTML( '<span style="font-style:italic">test</span>', [ phrasingContentReducer ], {} ) ).toEqual( '<em>test</em>' );
	} );

	it( 'should remove invalid phrasing content', () => {
		expect( deepFilterHTML( '<strong><p>test</p></strong>', [ phrasingContentReducer ], { p: {} } ) ).toEqual( '<p>test</p>' );
	} );
} );
