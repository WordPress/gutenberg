import { describe, expect, it } from 'vitest';
import getNavigationMenuBySlug, {
	getQueriedNavigationMenu,
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

	it( 'ignores a menu that has no slug of its own', () => {
		// An auto draft created in the editor has no `post_name` yet, so it
		// must not stand in for the slug a block asked for.
		expect(
			getNavigationMenuBySlug(
				[ { id: 4, status: 'draft' }, footer ],
				'header'
			)
		).toBeUndefined();
	} );

	it( 'matches a slug that is stored percent encoded', () => {
		// `cleanForSlug()` normalizes both sides, so a stored slug that is
		// already an octet sequence still matches itself.
		const encoded = {
			id: 5,
			slug: '%e4%bd%a0%e5%a5%bd',
			status: 'publish',
		};

		expect(
			getNavigationMenuBySlug( [ encoded ], '%e4%bd%a0%e5%a5%bd' )
		).toBe( encoded );
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

describe( 'getQueriedNavigationMenu', () => {
	it( 'returns undefined when the server matched nothing', () => {
		expect( getQueriedNavigationMenu( undefined ) ).toBeUndefined();
		expect( getQueriedNavigationMenu( null ) ).toBeUndefined();
		expect( getQueriedNavigationMenu( [] ) ).toBeUndefined();
	} );

	it( 'does not re-match the slug the server already matched', () => {
		// The stored slug is percent encoded, which `cleanForSlug()` cannot
		// produce from the slug as it was authored.
		const encoded = {
			id: 1,
			slug: '%e4%bd%a0%e5%a5%bd',
			status: 'publish',
		};

		expect( getQueriedNavigationMenu( [ encoded ] ) ).toBe( encoded );
	} );

	it( 'prefers a published menu over a draft', () => {
		const draft = { id: 3, slug: 'header', status: 'draft' };
		const published = { id: 1, slug: 'header', status: 'publish' };

		expect( getQueriedNavigationMenu( [ draft, published ] ) ).toBe(
			published
		);
	} );

	it( 'falls back to a draft when there is no published menu', () => {
		const draft = { id: 3, slug: 'header', status: 'draft' };

		expect( getQueriedNavigationMenu( [ draft ] ) ).toBe( draft );
	} );
} );
