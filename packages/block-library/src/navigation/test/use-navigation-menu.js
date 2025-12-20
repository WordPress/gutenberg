/**
 * WordPress dependencies
 */
import { createRegistry, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import useNavigationMenu from '../use-navigation-menu';

const BASE_ENTITY = {
	kind: 'postType',
	name: 'wp_navigation',
	id: undefined,
};

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

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test.
	const mock = jest.fn();
	return mock;
} );

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

function resolveReadPermission( registry, allowed ) {
	const dispatch = registry.dispatch( coreStore );
	dispatch.receiveUserPermission( 'read/postType/wp_navigation', allowed );
	dispatch.startResolution( 'canUser', [ 'read', BASE_ENTITY ] );
	dispatch.finishResolution( 'canUser', [ 'read', BASE_ENTITY ] );
}

function resolveReadRecordPermission( registry, ref, allowed ) {
	const dispatch = registry.dispatch( coreStore );
	dispatch.receiveUserPermission(
		`read/postType/wp_navigation/${ ref }`,
		allowed
	);
	dispatch.startResolution( 'canUser', [
		'read',
		{ ...BASE_ENTITY, id: ref },
	] );
	dispatch.finishResolution( 'canUser', [
		'read',
		{ ...BASE_ENTITY, id: ref },
	] );
}

function resolveCreatePermission( registry, allowed ) {
	const dispatch = registry.dispatch( coreStore );
	dispatch.receiveUserPermission( 'create/postType/wp_navigation', allowed );
	dispatch.startResolution( 'canUser', [
		'create',
		{ kind: 'postType', name: 'wp_navigation' },
	] );
	dispatch.finishResolution( 'canUser', [
		'create',
		{ kind: 'postType', name: 'wp_navigation' },
	] );
}

function resolveUpdatePermission( registry, ref, allowed ) {
	const dispatch = registry.dispatch( coreStore );
	dispatch.receiveUserPermission(
		`update/postType/wp_navigation/${ ref }`,
		allowed
	);
	dispatch.startResolution( 'canUser', [
		'update',
		{ ...BASE_ENTITY, id: ref },
	] );
	dispatch.finishResolution( 'canUser', [
		'update',
		{ ...BASE_ENTITY, id: ref },
	] );
}

function resolveDeletePermission( registry, ref, allowed ) {
	const dispatch = registry.dispatch( coreStore );
	dispatch.receiveUserPermission(
		`delete/postType/wp_navigation/${ ref }`,
		allowed
	);
	dispatch.startResolution( 'canUser', [
		'delete',
		{ ...BASE_ENTITY, id: ref },
	] );
	dispatch.finishResolution( 'canUser', [
		'delete',
		{ ...BASE_ENTITY, id: ref },
	] );
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
			canUserCreateNavigationMenus: false,
			canUserDeleteNavigationMenu: undefined,
			canUserUpdateNavigationMenu: undefined,
			hasResolvedCanUserCreateNavigationMenus: false,
			hasResolvedCanUserDeleteNavigationMenu: undefined,
			hasResolvedCanUserUpdateNavigationMenu: undefined,
			hasResolvedNavigationMenus: false,
			isNavigationMenuMissing: true,
			isNavigationMenuResolved: false,
			isResolvingCanUserCreateNavigationMenus: false,
			isResolvingNavigationMenus: false,
		} );
	} );

	it( 'Should return information about all menus when the ref is missing', () => {
		resolveRecords( registry, navigationMenus );
		resolveCreatePermission( registry, true );
		resolveReadPermission( registry, true );
		expect( useNavigationMenu() ).toEqual( {
			navigationMenus,
			navigationMenu: undefined,
			canSwitchNavigationMenu: true,
			canUserCreateNavigationMenus: true,
			canUserDeleteNavigationMenu: undefined,
			canUserUpdateNavigationMenu: undefined,
			hasResolvedCanUserCreateNavigationMenus: true,
			hasResolvedCanUserDeleteNavigationMenu: undefined,
			hasResolvedCanUserUpdateNavigationMenu: undefined,
			hasResolvedNavigationMenus: true,
			isNavigationMenuMissing: true,
			isNavigationMenuResolved: false,
			isResolvingCanUserCreateNavigationMenus: false,
			isResolvingNavigationMenus: false,
		} );
	} );

	it( 'Should return information about a specific menu when ref is given', () => {
		resolveRecords( registry, navigationMenus );
		expect( useNavigationMenu( 1 ) ).toEqual( {
			navigationMenu: navigationMenu1,
			navigationMenus,
			canSwitchNavigationMenu: true,
			canUserCreateNavigationMenus: false,
			canUserDeleteNavigationMenu: false,
			canUserUpdateNavigationMenu: false,
			hasResolvedCanUserCreateNavigationMenus: false,
			hasResolvedCanUserDeleteNavigationMenu: false,
			hasResolvedCanUserUpdateNavigationMenu: false,
			hasResolvedNavigationMenus: true,
			isNavigationMenuMissing: false,
			isNavigationMenuResolved: false,
			isResolvingCanUserCreateNavigationMenus: false,
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
			canUserCreateNavigationMenus: false,
			canUserDeleteNavigationMenu: false,
			canUserUpdateNavigationMenu: false,
			hasResolvedCanUserCreateNavigationMenus: false,
			hasResolvedCanUserDeleteNavigationMenu: false,
			hasResolvedCanUserUpdateNavigationMenu: false,
			hasResolvedNavigationMenus: true,
			isNavigationMenuMissing: false,
			isNavigationMenuResolved: false,
			isResolvingCanUserCreateNavigationMenus: false,
			isResolvingNavigationMenus: false,
		} );
	} );

	it( 'Should return correct permissions (create, update)', () => {
		resolveRecords( registry, navigationMenus );
		resolveCreatePermission( registry, true );
		resolveReadRecordPermission( registry, 1, true );
		resolveUpdatePermission( registry, 1, true );
		resolveDeletePermission( registry, 1, false );
		expect( useNavigationMenu( 1 ) ).toEqual( {
			navigationMenu: navigationMenu1,
			navigationMenus,
			canSwitchNavigationMenu: true,
			canUserCreateNavigationMenus: true,
			canUserDeleteNavigationMenu: false,
			canUserUpdateNavigationMenu: true,
			hasResolvedCanUserCreateNavigationMenus: true,
			hasResolvedCanUserDeleteNavigationMenu: true,
			hasResolvedCanUserUpdateNavigationMenu: true,
			hasResolvedNavigationMenus: true,
			isNavigationMenuMissing: false,
			isNavigationMenuResolved: false,
			isResolvingCanUserCreateNavigationMenus: false,
			isResolvingNavigationMenus: false,
		} );
	} );

	it( 'Should return correct permissions (delete only)', () => {
		resolveRecords( registry, navigationMenus );
		resolveCreatePermission( registry, false );
		resolveReadRecordPermission( registry, 1, false );
		resolveUpdatePermission( registry, 1, false );
		resolveDeletePermission( registry, 1, true );
		expect( useNavigationMenu( 1 ) ).toEqual( {
			navigationMenu: navigationMenu1,
			navigationMenus,
			canSwitchNavigationMenu: true,
			canUserCreateNavigationMenus: false,
			canUserDeleteNavigationMenu: true,
			canUserUpdateNavigationMenu: false,
			hasResolvedCanUserCreateNavigationMenus: true,
			hasResolvedCanUserDeleteNavigationMenu: true,
			hasResolvedCanUserUpdateNavigationMenu: true,
			hasResolvedNavigationMenus: true,
			isNavigationMenuMissing: false,
			isNavigationMenuResolved: false,
			isResolvingCanUserCreateNavigationMenus: false,
			isResolvingNavigationMenus: false,
		} );
	} );

	it( 'Should return correct permissions (no permissions)', () => {
		const requestedMenu = navigationMenu1;
		// Note the "delete" permission is resolved for menu 2, but we're requesting
		// the details of menu 1.
		resolveDeletePermission( registry, navigationMenu2, true );
		resolveRecords( registry, navigationMenus );

		expect( useNavigationMenu( requestedMenu.id ) ).toEqual( {
			navigationMenu: requestedMenu,
			navigationMenus,
			canSwitchNavigationMenu: true,
			canUserCreateNavigationMenus: false,
			canUserDeleteNavigationMenu: false,
			canUserUpdateNavigationMenu: false,
			hasResolvedCanUserCreateNavigationMenus: false,
			hasResolvedCanUserDeleteNavigationMenu: false,
			hasResolvedCanUserUpdateNavigationMenu: false,
			hasResolvedNavigationMenus: true,
			isNavigationMenuMissing: false,
			isNavigationMenuResolved: false,
			isResolvingCanUserCreateNavigationMenus: false,
			isResolvingNavigationMenus: false,
		} );
	} );
} );
