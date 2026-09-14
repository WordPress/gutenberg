import { describe, expect, it } from 'vitest';
import getNavigationMenuTitle from '../get-navigation-menu-title';

describe( 'getNavigationMenuTitle', () => {
	it( 'returns undefined when there is no menu or title', () => {
		expect( getNavigationMenuTitle( undefined ) ).toBeUndefined();
		expect( getNavigationMenuTitle( {} ) ).toBeUndefined();
		expect( getNavigationMenuTitle( { title: '' } ) ).toBeUndefined();
		expect( getNavigationMenuTitle( { title: {} } ) ).toBeUndefined();
	} );

	it( 'decodes the title of an edited record, whose title is a string', () => {
		expect( getNavigationMenuTitle( { title: 'Caf&eacute; menu' } ) ).toBe(
			'Café menu'
		);
	} );

	it( 'decodes the title of a collection record, whose title is an object', () => {
		expect(
			getNavigationMenuTitle( {
				title: { raw: 'Caf&eacute; menu', rendered: 'Café menu' },
			} )
		).toBe( 'Café menu' );

		expect(
			getNavigationMenuTitle( { title: { rendered: 'Caf&eacute;' } } )
		).toBe( 'Café' );
	} );

	it( 'accepts a bare title', () => {
		expect( getNavigationMenuTitle( 'Header' ) ).toBe( 'Header' );
	} );
} );
