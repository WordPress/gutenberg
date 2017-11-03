/**
 * Internal dependencies
 */
import { disableIsSidebarOpenedOnMobile } from '../';

describe( 'disableIsSidebarOpenOnMobile()', () => {
	it( 'should disable isSidebarOpen on mobile and keep other properties as before', () => {
		const input = {
				isSidebarOpened: true,
				dummyPref: 'dummy',
			},
			output = {
				isSidebarOpened: false,
				dummyPref: 'dummy',
			},
			isMobile = true;

		expect( disableIsSidebarOpenedOnMobile( input, isMobile ) ).toEqual( output );
	} );

	it( 'should keep isSidebarOpen on non-mobile and keep other properties as before', () => {
		const input = {
				isSidebarOpened: true,
				dummy: 'non-dummy',
			},
			output = {
				isSidebarOpened: true,
				dummy: 'non-dummy',
			},
			isMobile = false;
		expect( disableIsSidebarOpenedOnMobile( input, isMobile ) ).toEqual( output );
	} );
} );
