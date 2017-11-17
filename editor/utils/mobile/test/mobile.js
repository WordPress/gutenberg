/**
 * Internal dependencies
 */
import { disableIsSidebarOpenedOnMobile } from '../';

describe( 'disableIsSidebarOpenOnMobile()', () => {
	it( 'should disable isSidebarOpenedMobile and keep other properties as before', () => {
		const input = {
				isSidebarOpenedMobile: true,
				dummyPref: 'dummy',
			},
			output = {
				isSidebarOpenedMobile: false,
				dummyPref: 'dummy',
			};

		expect( disableIsSidebarOpenedOnMobile( input ) ).toEqual( output );
	} );

	it( 'should keep isSidebarOpenedMobile as false if it was false', () => {
		const input = {
				isSidebarOpenedMobile: false,
				dummy: 'non-dummy',
			},
			output = {
				isSidebarOpenedMobile: false,
				dummy: 'non-dummy',
			};
		expect( disableIsSidebarOpenedOnMobile( input ) ).toEqual( output );
	} );

	it( 'should not make any change if the payload does not contain isSidebarOpenedMobile flag', () => {
		const input = {
				isSidebarOpened: true,
				dummy: 'non-dummy',
			},
			output = {
				isSidebarOpened: true,
				dummy: 'non-dummy',
			};
		expect( disableIsSidebarOpenedOnMobile( input ) ).toEqual( output );
	} );
} );
