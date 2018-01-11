/**
 * Internal dependencies
 */
import { disableMobileSidebar } from '../';

describe( 'disableMobileSidebar()', () => {
	it( 'should disable mobile sidebar and keep other properties as before', () => {
		const input = {
				sidebars: {
					mobile: true,
					desktop: false,
				},
				dummyPref: 'dummy',
			},
			output = {
				sidebars: {
					mobile: false,
					desktop: false,
				},
				dummyPref: 'dummy',
			};

		expect( disableMobileSidebar( input ) ).toEqual( output );
	} );

	it( 'should keep mobile sidebar false if it was false', () => {
		const input = {
				sidebars: {
					mobile: false,
					desktop: false,
				},
				dummyPref: 'dummy',
			},
			output = {
				sidebars: {
					mobile: false,
					desktop: false,
				},
				dummyPref: 'dummy',
			};
		expect( disableMobileSidebar( input ) ).toEqual( output );
	} );

	it( 'should not make any change if the payload does not contain mobile sidebar flag', () => {
		const input = {
				sidebars: {
					chicken: 'ribs',
				},
				dummy: 'non-dummy',
			},
			output = {
				sidebars: {
					chicken: 'ribs',
				},
				dummy: 'non-dummy',
			};
		expect( disableMobileSidebar( input ) ).toEqual( output );
	} );
} );
