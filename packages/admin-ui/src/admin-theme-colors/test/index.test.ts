/**
 * Internal dependencies
 */
import { getAdminThemeColors } from '../index';

describe( 'getAdminThemeColors', () => {
	it( 'should return the colors for the admin theme from the body class', () => {
		document.body.className = 'foo admin-color-coffee bar';

		expect( getAdminThemeColors() ).toEqual( {
			primary: '#916745',
			bg: '#5b534d',
		} );
	} );
} );
