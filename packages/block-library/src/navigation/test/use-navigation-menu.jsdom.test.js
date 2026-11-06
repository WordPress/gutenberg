import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRegistry, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import useNavigationMenu from '../use-navigation-menu';

vi.mock( import( '@wordpress/api-fetch' ) );

function createRegistryWithStores() {
	// Create a registry and register used stores.
	const registry = createRegistry();
	registry.register( coreStore );

	const navigationConfig = {
		kind: 'postType',
		name: 'wp_navigation',
		baseURL: '/wp/v2/navigation',
		rawAttributes: [ 'title', 'excerpt', 'content' ],
	};
	// Register post type entity.
	registry.dispatch( coreStore ).addEntities( [ navigationConfig ] );
	return registry;
}

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	// This allows us to tweak the returned value on each test.
	useSelect: vi.fn(),
} ) );

function resolveRecords( registry, menus ) {
	const dispatch = registry.dispatch( coreStore );
	dispatch.startResolution( 'getEntityRecords', [
		'postType',
		'wp_navigation',
		{
			per_page: 100,
			status: [ 'publish', 'draft' ],
			order: 'desc',
			orderby: 'date',
		},
	] );
	dispatch.finishResolution( 'getEntityRecords', [
		'postType',
		'wp_navigation',
		{
			per_page: 100,
			status: [ 'publish', 'draft' ],
			order: 'desc',
			orderby: 'date',
		},
	] );
	dispatch.receiveEntityRecords( 'postType', 'wp_navigation', menus, {
		per_page: 100,
		status: [ 'publish', 'draft' ],
		order: 'desc',
		orderby: 'date',
	} );
}

describe( 'useNavigationMenus', () => {
	const navigationMenu1 = { id: 1, title: 'Menu 1', status: 'publish' };
	const navigationMenu2 = { id: 2, title: 'Menu 2', status: 'publish' };
	const navigationMenu3 = { id: 3, title: 'Menu 3', status: 'publish' };
	const navigationMenus = [
		navigationMenu1,
		navigationMenu2,
		navigationMenu3,
	];

	let registry;
	beforeEach( () => {
		registry = createRegistryWithStores();
		useSelect.mockImplementation( ( fn ) => fn( registry.select ) );
	} );

	it( 'Should return no information when no data is resolved', () => {
		expect( useNavigationMenu() ).toEqual( {
			navigationMenus: null,
			navigationMenu: undefined,
			canSwitchNavigationMenu: false,
			hasResolvedNavigationMenus: false,
			isNavigationMenuMissing: true,
			isNavigationMenuResolved: false,
			isResolvingNavigationMenus: false,
		} );
	} );

	it( 'Should return information about all menus when the ref is missing', () => {
		resolveRecords( registry, navigationMenus );
		expect( useNavigationMenu() ).toEqual( {
			navigationMenus,
			navigationMenu: undefined,
			canSwitchNavigationMenu: true,
			hasResolvedNavigationMenus: true,
			isNavigationMenuMissing: true,
			isNavigationMenuResolved: false,
			isResolvingNavigationMenus: false,
		} );
	} );

	it( 'Should return information about a specific menu when ref is given', () => {
		resolveRecords( registry, navigationMenus );
		expect( useNavigationMenu( 1 ) ).toEqual( {
			navigationMenu: navigationMenu1,
			navigationMenus,
			canSwitchNavigationMenu: true,
			hasResolvedNavigationMenus: true,
			isNavigationMenuMissing: false,
			isNavigationMenuResolved: false,
			isResolvingNavigationMenus: false,
		} );
	} );

	it( 'Should return the menu when menu status is "draft"', () => {
		const navigationMenuDraft = { id: 4, title: 'Menu 3', status: 'draft' };
		const testMenus = [ ...navigationMenus, navigationMenuDraft ];
		resolveRecords( registry, testMenus );
		expect( useNavigationMenu( 4 ) ).toEqual( {
			navigationMenu: navigationMenuDraft,
			navigationMenus: testMenus,
			canSwitchNavigationMenu: true,
			hasResolvedNavigationMenus: true,
			isNavigationMenuMissing: false,
			isNavigationMenuResolved: false,
			isResolvingNavigationMenus: false,
		} );
	} );
} );
