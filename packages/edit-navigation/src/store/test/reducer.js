/**
 * Internal dependencies
 */
import { selectedMenuId } from '../reducer';

describe( 'selectedMenuId', () => {
	it( 'should apply default state', () => {
		expect( selectedMenuId( undefined, {} ) ).toEqual( null );
	} );

	it( 'should update when a new menu is selected', () => {
		expect(
			selectedMenuId( 1, { type: 'SET_SELECTED_MENU_ID', menuId: 2 } )
		).toBe( 2 );
	} );
} );
