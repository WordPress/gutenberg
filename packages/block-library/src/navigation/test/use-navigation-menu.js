/**
 * WordPress dependencies
 */
import { useSelect, createRegistry } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import useNavigationMenu from '../use-navigation-menu';

function createRegistryWithStores() {
	// Create a registry and register used stores.
	const registry = createRegistry();
	[ coreStore ].forEach( registry.register );

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

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test.
	const mock = jest.fn();
	return mock;
} );

function setRecords( registry, menus ) {
	const dispatch = registry.dispatch( coreStore );
	dispatch.startResolution( 'getEntityRecords', [
		'postType',
		'wp_navigation',
		{ per_page: -1, status: 'publish' },
	] );
	dispatch.finishResolution( 'getEntityRecords', [
		'postType',
		'wp_navigation',
		{ per_page: -1, status: 'publish' },
	] );
	dispatch.receiveEntityRecords( 'postType', 'wp_navigation', menus, {
		per_page: -1,
		status: 'publish',
	} );
}

function setCreatePermission( registry, allowed ) {
	const dispatch = registry.dispatch( coreStore );
	dispatch.receiveUserPermission( 'create/navigation', allowed );
	dispatch.startResolution( 'canUser', [ 'create', 'navigation' ] );
	dispatch.finishResolution( 'canUser', [ 'create', 'navigation' ] );
}

function setUpdatePermission( registry, ref, allowed ) {
	const dispatch = registry.dispatch( coreStore );
	dispatch.receiveUserPermission( `update/navigation/${ ref }`, allowed );
	dispatch.startResolution( 'canUser', [ 'update', 'navigation', ref ] );
	dispatch.finishResolution( 'canUser', [ 'update', 'navigation', ref ] );
}

function setDeletePermission( registry, ref, allowed ) {
	const dispatch = registry.dispatch( coreStore );
	dispatch.receiveUserPermission( `delete/navigation/${ ref }`, allowed );
	dispatch.startResolution( 'canUser', [ 'delete', 'navigation', ref ] );
	dispatch.finishResolution( 'canUser', [ 'delete', 'navigation', ref ] );
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
			canSwitchNavigationMenu: false,
			canUserCreateNavigationMenu: false,
			canUserDeleteNavigationMenu: false,
			canUserUpdateNavigationMenu: false,
			hasResolvedCanUserCreateNavigationMenu: false,
			hasResolvedCanUserDeleteNavigationMenu: false,
			hasResolvedCanUserUpdateNavigationMenu: false,
			hasResolvedNavigationMenus: false,
			isNavigationMenuMissing: true,
			isNavigationMenuResolved: false,
			isResolvingCanUserCreateNavigationMenu: false,
			isResolvingNavigationMenus: false,
		} );
	} );

	it( 'Should return information about all menus when ref is missing', () => {
		setRecords( registry, navigationMenus );
		setCreatePermission( registry, true );
		expect( useNavigationMenu() ).toEqual( {
			navigationMenus,
			canSwitchNavigationMenu: true,
			canUserCreateNavigationMenu: true,
			canUserDeleteNavigationMenu: false,
			canUserUpdateNavigationMenu: false,
			hasResolvedCanUserCreateNavigationMenu: true,
			hasResolvedCanUserDeleteNavigationMenu: false,
			hasResolvedCanUserUpdateNavigationMenu: false,
			hasResolvedNavigationMenus: true,
			isNavigationMenuMissing: true,
			isNavigationMenuResolved: false,
			isResolvingCanUserCreateNavigationMenu: false,
			isResolvingNavigationMenus: false,
		} );
	} );

	it( 'Should also return information about a specific menu when ref is given', () => {
		setRecords( registry, navigationMenus );
		expect( useNavigationMenu( 1 ) ).toEqual( {
			navigationMenu: navigationMenu1,
			navigationMenus,
			canSwitchNavigationMenu: true,
			canUserCreateNavigationMenu: false,
			canUserDeleteNavigationMenu: false,
			canUserUpdateNavigationMenu: false,
			hasResolvedCanUserCreateNavigationMenu: false,
			hasResolvedCanUserDeleteNavigationMenu: false,
			hasResolvedCanUserUpdateNavigationMenu: false,
			hasResolvedNavigationMenus: true,
			isNavigationMenuMissing: false,
			isNavigationMenuResolved: false,
			isResolvingCanUserCreateNavigationMenu: false,
			isResolvingNavigationMenus: false,
		} );
	} );

	it( 'Should return correct permissions (create, update)', () => {
		setRecords( registry, navigationMenus );
		setCreatePermission( registry, true );
		setUpdatePermission( registry, 1, true );
		expect( useNavigationMenu( 1 ) ).toEqual( {
			navigationMenu: navigationMenu1,
			navigationMenus,
			canSwitchNavigationMenu: true,
			canUserCreateNavigationMenu: true,
			canUserDeleteNavigationMenu: false,
			canUserUpdateNavigationMenu: true,
			hasResolvedCanUserCreateNavigationMenu: true,
			hasResolvedCanUserDeleteNavigationMenu: false,
			hasResolvedCanUserUpdateNavigationMenu: true,
			hasResolvedNavigationMenus: true,
			isNavigationMenuMissing: false,
			isNavigationMenuResolved: false,
			isResolvingCanUserCreateNavigationMenu: false,
			isResolvingNavigationMenus: false,
		} );
	} );

	it( 'Should return correct permissions (delete only)', () => {
		setRecords( registry, navigationMenus );
		setDeletePermission( registry, 1, true );
		expect( useNavigationMenu( 1 ) ).toEqual( {
			navigationMenu: navigationMenu1,
			navigationMenus,
			canSwitchNavigationMenu: true,
			canUserCreateNavigationMenu: false,
			canUserDeleteNavigationMenu: true,
			canUserUpdateNavigationMenu: false,
			hasResolvedCanUserCreateNavigationMenu: false,
			hasResolvedCanUserDeleteNavigationMenu: true,
			hasResolvedCanUserUpdateNavigationMenu: false,
			hasResolvedNavigationMenus: true,
			isNavigationMenuMissing: false,
			isNavigationMenuResolved: false,
			isResolvingCanUserCreateNavigationMenu: false,
			isResolvingNavigationMenus: false,
		} );
	} );

	it( 'Should return correct permissions (no permissions)', () => {
		const menuWithNoDeletePermissions = 2;
		const requestedMenu = 1;
		const requestedMenuData = [`navigationMenu${requestedMenu}`];
		
		setRecords( registry, navigationMenus );
		// Note the ref refers to a different record
		setDeletePermission( registry, menuWithNoDeletePermissions, true );
		expect( useNavigationMenu( requestedMenu ) ).toEqual( {
			navigationMenu: requestedMenuData,
			navigationMenus,
			canSwitchNavigationMenu: true,
			canUserCreateNavigationMenu: false,
			canUserDeleteNavigationMenu: false,
			canUserUpdateNavigationMenu: false,
			hasResolvedCanUserCreateNavigationMenu: false,
			hasResolvedCanUserDeleteNavigationMenu: false,
			hasResolvedCanUserUpdateNavigationMenu: false,
			hasResolvedNavigationMenus: true,
			isNavigationMenuMissing: false,
			isNavigationMenuResolved: false,
			isResolvingCanUserCreateNavigationMenu: false,
			isResolvingNavigationMenus: false,
		} );
	} );
} );
