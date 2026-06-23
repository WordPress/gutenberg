/**
 * Internal dependencies
 */
import { getAdminThemeColors } from '../index';

describe( 'getAdminThemeColors', () => {
	it( 'should return the colors for the admin theme from the body class', () => {
		document.body.className = 'foo admin-color-coffee bar';

		expect( getAdminThemeColors() ).toEqual( {
			primary: '#916745',
			background: '#5b534d',
		} );
	} );

	it( 'should fall back to the fresh scheme colors when no admin-color class is present', () => {
		document.body.className = 'foo bar';

		expect( getAdminThemeColors() ).toEqual( {
			primary: '#3858e9',
			background: '#25292b',
		} );
	} );

	it( 'should fall back to the default colors for an unknown scheme', () => {
		document.body.className = 'admin-color-unknown';

		expect( getAdminThemeColors() ).toEqual( {
			primary: '#3858e9',
			background: '#25292b',
		} );
	} );
} );
