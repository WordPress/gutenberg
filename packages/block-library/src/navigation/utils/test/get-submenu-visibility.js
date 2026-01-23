/**
 * Internal dependencies
 */
import { getSubmenuVisibility } from '../get-submenu-visibility';

describe( 'getSubmenuVisibility', () => {
	it( 'should return submenuVisibility when it is set', () => {
		expect(
			getSubmenuVisibility( {
				submenuVisibility: 'click',
				openSubmenusOnClick: false,
			} )
		).toBe( 'click' );
		expect(
			getSubmenuVisibility( {
				submenuVisibility: 'hover',
				openSubmenusOnClick: true,
			} )
		).toBe( 'hover' );
		expect(
			getSubmenuVisibility( {
				submenuVisibility: 'always',
				openSubmenusOnClick: false,
			} )
		).toBe( 'always' );
	} );

	it( 'should fall back to "click" when submenuVisibility is undefined and openSubmenusOnClick is true', () => {
		expect( getSubmenuVisibility( { openSubmenusOnClick: true } ) ).toBe(
			'click'
		);
	} );

	it( 'should fall back to "hover" when submenuVisibility is undefined and openSubmenusOnClick is false', () => {
		expect( getSubmenuVisibility( { openSubmenusOnClick: false } ) ).toBe(
			'hover'
		);
	} );

	it( 'should fall back to "hover" when both submenuVisibility and openSubmenusOnClick are undefined', () => {
		expect( getSubmenuVisibility( {} ) ).toBe( 'hover' );
	} );

	it( 'should handle empty attributes object', () => {
		expect( getSubmenuVisibility( {} ) ).toBe( 'hover' );
	} );
} );
