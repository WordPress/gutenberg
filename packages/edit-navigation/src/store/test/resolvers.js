/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import {
	NAVIGATION_POST_KIND,
	NAVIGATION_POST_POST_TYPE,
} from '../../constants';
import { store as editNavigationStore } from '..';

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

// Mock createBlock to avoid creating block in test environment
jest.mock( '@wordpress/blocks', () => {
	const blocks = jest.requireActual( '@wordpress/blocks' );
	let id = 0;

	return {
		...blocks,
		createBlock( name, attributes, innerBlocks ) {
			return {
				clientId: `client-id-${ id++ }`,
				name,
				attributes,
				innerBlocks,
			};
		},
	};
} );

function createRegistryWithStores() {
	// create a registry and register stores
	const registry = createRegistry();

	registry.register( editNavigationStore );
	registry.register( coreStore );

	// Set up the navigation post entity.
	registry.dispatch( coreStore ).addEntities( [
		{
			kind: NAVIGATION_POST_KIND,
			name: NAVIGATION_POST_POST_TYPE,
			transientEdits: { blocks: true, selection: true },
			label: 'Navigation Post',
			__experimentalNoFetch: true,
		},
	] );

	return registry;
}

const mockMenuItems = [
	{
		id: 100,
		title: {
			raw: 'wp.com',
			rendered: 'wp.com',
		},
		url: 'http://wp.com',
		menu_order: 1,
		menus: 1,
		parent: 0,
		object_id: 123,
		object: 'post',
		classes: [ 'menu', 'classes' ],
		xfn: [ 'nofollow' ],
		description: 'description',
		attr_title: 'link title',
	},
	{
		id: 101,
		title: {
			raw: 'wp.org',
			rendered: 'wp.org',
		},
		url: 'http://wp.org',
		menu_order: 2,
		menus: 1,
		parent: 0,
		object_id: 456,
		object: 'page',
		classes: [],
		xfn: [],
		description: '',
		attr_title: '',
		target: '_blank',
	},
	{
		id: 102,
		title: {
			raw: 'My Example Page',
			rendered: 'My Example Page',
		},
		url: '/my-example-page/',
		object_id: 56789,
		type: 'post-type',
		menu_order: 3,
		menus: 1,
		parent: 0,
		classes: [],
		object: 'custom',
		xfn: [],
		description: '',
		attr_title: '',
		target: '_blank',
	},
];

describe( 'getNavigationPostForMenu', () => {
	jest.useRealTimers();

	apiFetch.mockImplementation( async ( { path, method = 'GET' } ) => {
		if ( ! path.startsWith( '/wp/v2/menu-items?' ) ) {
			throw new Error( `unexpected API endpoint: ${ path }` );
		}

		if ( method === 'GET' ) {
			return mockMenuItems;
		}

		throw new Error( `unexpected API endpoint method: ${ method }` );
	} );

	it( 'returns early when a menuId is not provided', async () => {
		const menuId = null;

		const registry = createRegistryWithStores();
		await registry
			.resolveSelect( editNavigationStore )
			.getNavigationPostForMenu( menuId );

		const stubPost = registry
			.select( coreStore )
			.getEntityRecord( 'root', 'postType', menuId );

		expect( stubPost ).toBeFalsy();
	} );

	it( 'creates a stub navigation post for menu id', async () => {
		const menuId = 123;

		const registry = createRegistryWithStores();
		const stubPost = await registry
			.resolveSelect( editNavigationStore )
			.getNavigationPostForMenu( menuId );

		expect( stubPost ).toMatchSnapshot();
	} );
} );
