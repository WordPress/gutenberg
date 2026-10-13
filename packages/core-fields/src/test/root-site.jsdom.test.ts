import { describe, expect, it } from 'vitest';
import rootSite from '../root_site';

describe( 'root_site', () => {
	it( 'provides the JavaScript parts of the site fields', () => {
		expect( Object.keys( rootSite ) ).toEqual( [
			'description',
			'site_icon',
			'site_logo',
			'title',
		] );
	} );

	it( 'decodes the entities of the title and the tagline', () => {
		expect(
			rootSite.title.getValue?.( {
				item: { title: 'Salt &amp; Pepper' },
			} )
		).toBe( 'Salt & Pepper' );
		expect(
			rootSite.description.getValue?.( {
				item: { description: 'Recipes &amp; more' },
			} )
		).toBe( 'Recipes & more' );
		expect( rootSite.title.getValue?.( { item: {} } ) ).toBe( '' );
	} );

	it( 'stores `0` for a site without a logo or an icon', () => {
		expect(
			rootSite.site_logo.setValue?.( { item: {}, value: undefined } )
		).toEqual( { site_logo: 0 } );
		expect(
			rootSite.site_icon.setValue?.( { item: {}, value: 12 } )
		).toEqual( { site_icon: 12 } );
	} );
} );
