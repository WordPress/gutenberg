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

const VIEW_QUERY = {
	per_page: 100,
	status: 'publish',
	context: 'view',
	order: 'desc',
	orderby: 'date',
};

const EDIT_QUERY = {
	per_page: 100,
	status: [ 'publish', 'draft' ],
	order: 'desc',
	orderby: 'date',
};

function resolveRecords( registry, menus, query = VIEW_QUERY ) {
	const dispatch = registry.dispatch( coreStore );
	const args = [ 'postType', 'wp_navigation', query ];
	dispatch.startResolution( 'getEntityRecords', args );
	dispatch.finishResolution( 'getEntityRecords', args );
	dispatch.receiveEntityRecords( 'postType', 'wp_navigation', menus, query );
}

function resolveRecord( registry, ref, query = { context: 'view' } ) {
	const dispatch = registry.dispatch( coreStore );
	const args = [ 'postType', 'wp_navigation', ref, query ];
	dispatch.startResolution( 'getEntityRecord', args );
	dispatch.finishResolution( 'getEntityRecord', args );
}

function resolveReadPermission( registry, allowed ) {
	const dispatch = registry.dispatch( coreStore );
	dispatch.receiveUserPermission( 'read/postType/wp_navigation', allowed );
	dispatch.startResolution( 'canUser', [
		'read',
		{ kind: 'postType', name: 'wp_navigation' },
	] );
	dispatch.finishResolution( 'canUser', [
		'read',
		{ kind: 'postType', name: 'wp_navigation' },
	] );
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
	const publishedMenu = {
		id: 1,
		title: { rendered: 'Menu 1', raw: 'Menu 1' },
		content: { rendered: '<a href="/">Home</a>', raw: 'raw menu' },
		status: 'publish',
	};
	const anotherPublishedMenu = {
		id: 2,
		title: { rendered: 'Menu 2', raw: 'Menu 2' },
		content: { rendered: '<a href="/about">About</a>', raw: 'raw menu 2' },
		status: 'publish',
	};
	const draftMenu = {
		id: 3,
		title: { rendered: 'Draft Menu', raw: 'Draft Menu' },
		content: { rendered: '', raw: 'draft menu' },
		status: 'draft',
	};
	const publishedMenus = [ publishedMenu, anotherPublishedMenu ];

	let registry;
	beforeEach( () => {
		registry = createRegistryWithStores();
		useSelect.mockImplementation( ( fn ) => fn( registry.select ) );
	} );

	function resolvePermissions(
		ref,
		{
			create = false,
			read = true,
			update = false,
			delete: canDelete = false,
		} = {}
	) {
		resolveCreatePermission( registry, create );
		resolveReadRecordPermission( registry, ref, read );
		resolveUpdatePermission( registry, ref, update );
		resolveDeletePermission( registry, ref, canDelete );
	}

	it( 'returns unresolved state before data and permissions resolve', () => {
		expect( useNavigationMenu() ).toEqual(
			expect.objectContaining( {
				navigationMenus: null,
				publishedNavigationMenus: null,
				navigationMenu: undefined,
				isNavigationMenuMissing: false,
				hasResolvedNavigationMenus: false,
			} )
		);
	} );

	it( 'lists published menus in view context when no ref is selected', () => {
		resolveRecords( registry, publishedMenus );
		resolveCreatePermission( registry, false );
		resolveReadPermission( registry, true );

		expect( useNavigationMenu() ).toEqual(
			expect.objectContaining( {
				navigationMenus: publishedMenus,
				publishedNavigationMenus: publishedMenus,
				canSwitchNavigationMenu: true,
				canUserCreateNavigationMenus: false,
				hasResolvedNavigationMenus: true,
			} )
		);
	} );

	it( 'normalizes a published menu for a user without update permission', () => {
		resolveRecords( registry, publishedMenus );
		resolveRecord( registry, publishedMenu.id );
		resolvePermissions( publishedMenu.id );

		expect( useNavigationMenu( publishedMenu.id ) ).toEqual(
			expect.objectContaining( {
				navigationMenu: expect.objectContaining( {
					id: publishedMenu.id,
					title: 'Menu 1',
					content: '<a href="/">Home</a>',
					status: 'publish',
				} ),
				navigationMenus: publishedMenus,
				canUserUpdateNavigationMenu: false,
				isNavigationMenuMissing: false,
				isNavigationMenuResolved: true,
			} )
		);
	} );

	it( 'does not expose a draft menu without update permission', () => {
		resolveRecords( registry, publishedMenus );
		resolveRecord( registry, draftMenu.id );
		resolvePermissions( draftMenu.id );

		expect( useNavigationMenu( draftMenu.id ) ).toEqual(
			expect.objectContaining( {
				navigationMenu: null,
				navigationMenus: publishedMenus,
				isNavigationMenuMissing: true,
			} )
		);
	} );

	it( 'preserves editable draft menus for an authorized user', () => {
		resolveRecords( registry, publishedMenus );
		resolveRecords(
			registry,
			[ ...publishedMenus, draftMenu ],
			EDIT_QUERY
		);
		resolvePermissions( draftMenu.id, {
			create: true,
			update: true,
			delete: true,
		} );

		expect( useNavigationMenu( draftMenu.id ) ).toEqual(
			expect.objectContaining( {
				navigationMenu: expect.objectContaining( {
					id: draftMenu.id,
					title: 'Draft Menu',
					content: 'draft menu',
					status: 'draft',
				} ),
				navigationMenus: [ ...publishedMenus, draftMenu ],
				publishedNavigationMenus: publishedMenus,
				canUserCreateNavigationMenus: true,
				canUserUpdateNavigationMenu: true,
				canUserDeleteNavigationMenu: true,
			} )
		);
	} );
} );
