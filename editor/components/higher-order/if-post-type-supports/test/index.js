/**
 * Internal dependencies
 */
import { checkIfPostTypeSupports } from '../';

describe( 'checkIfPostTypeSupports', () => {
	it( 'returns true if post type supports at least one of the keys passed', () => {
		expect( checkIfPostTypeSupports( {
			data: {
				supports: {
					chicken: true,
				},
			},
		}, 'chicken' ) ).toBe( true );

		expect( checkIfPostTypeSupports( {
			data: {
				supports: {
					chicken: true,
				},
			},
		}, [ 'chicken', 'ribs' ] ) ).toBe( true );

		expect( checkIfPostTypeSupports( {
			data: {
				supports: {
					chicken: true,
					ribs: false,
				},
			},
		}, [ 'chicken', 'ribs' ] ) ).toBe( true );
	} );

	it( 'returns false if post type does not support at least one of the keys passed', () => {
		expect( checkIfPostTypeSupports( {
			data: {
				supports: {},
			},
		}, 'chicken' ) ).toBe( false );

		expect( checkIfPostTypeSupports( {
			data: {
				supports: {
					chicken: true,
				},
			},
		}, [ 'ribs' ] ) ).toBe( false );

		expect( checkIfPostTypeSupports( {
			data: {
				supports: {
					ribs: false,
				},
			},
		}, [ 'ribs', 'ribs' ] ) ).toBe( false );
	} );
} );
