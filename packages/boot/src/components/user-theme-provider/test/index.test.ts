import { getAdminThemePrimaryColor } from '../index';

describe( 'getAdminThemePrimaryColor', () => {
	it( 'should return the primary color for the admin theme from the body class', () => {
		document.body.className = 'foo admin-color-coffee bar';

		const primaryColor = getAdminThemePrimaryColor();

		expect( primaryColor ).toBe( '#46403c' );
	} );
} );
