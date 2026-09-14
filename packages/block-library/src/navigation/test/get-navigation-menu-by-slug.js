import { describe, expect, it } from 'vitest';
import getNavigationMenuBySlug, {
	normalizeNavigationMenuSlug,
} from '../get-navigation-menu-by-slug';

describe( 'normalizeNavigationMenuSlug', () => {
	it( 'returns an empty string for an absent slug', () => {
		expect( normalizeNavigationMenuSlug( undefined ) ).toBe( '' );
		expect( normalizeNavigationMenuSlug( null ) ).toBe( '' );
		expect( normalizeNavigationMenuSlug( '' ) ).toBe( '' );
	} );

	it( 'normalizes a hand authored slug', () => {
		expect( normalizeNavigationMenuSlug( 'Header Menu' ) ).toBe(
			'header-menu'
		);
	} );
} );

describe( 'getNavigationMenuBySlug', () => {
	const header = { id: 1, slug: 'header', status: 'publish' };
	const footer = { id: 2, slug: 'footer', status: 'publish' };
	const navigationMenus = [ header, footer ];

	it( 'returns undefined when there is no slug', () => {
		expect( getNavigationMenuBySlug( navigationMenus ) ).toBeUndefined();
		expect(
			getNavigationMenuBySlug( navigationMenus, '' )
		).toBeUndefined();
	} );

	it( 'returns undefined when the menus have not resolved', () => {
		expect( getNavigationMenuBySlug( null, 'header' ) ).toBeUndefined();
		expect( getNavigationMenuBySlug( [], 'header' ) ).toBeUndefined();
	} );

	it( 'returns the menu matching the slug', () => {
		expect( getNavigationMenuBySlug( navigationMenus, 'footer' ) ).toBe(
			footer
		);
	} );

	it( 'returns undefined when no menu matches the slug', () => {
		expect(
			getNavigationMenuBySlug( navigationMenus, 'sidebar' )
		).toBeUndefined();
	} );

	it( 'matches a hand authored slug against the stored slug', () => {
		expect( getNavigationMenuBySlug( navigationMenus, 'Header' ) ).toBe(
			header
		);
	} );

	it( 'prefers a published menu over a draft with the same slug', () => {
		const draft = { id: 3, slug: 'header', status: 'draft' };

		expect( getNavigationMenuBySlug( [ draft, header ], 'header' ) ).toBe(
			header
		);
	} );

	it( 'falls back to a draft when no published menu matches', () => {
		const draft = { id: 3, slug: 'header', status: 'draft' };

		expect( getNavigationMenuBySlug( [ draft, footer ], 'header' ) ).toBe(
			draft
		);
	} );
} );
