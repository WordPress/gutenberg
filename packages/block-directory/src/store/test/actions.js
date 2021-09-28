/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';
import { store as blocksStore } from '@wordpress/blocks';
import { store as noticesStore } from '@wordpress/notices';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { loadAssets } from '../load-assets';
import { store as blockDirectoryStore } from '..';

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '../load-assets', () => ( {
	loadAssets: jest.fn(),
} ) );

function createRegistryWithStores() {
	// create a registry and register stores
	const registry = createRegistry();

	registry.register( blockDirectoryStore );
	registry.register( noticesStore );
	registry.register( blocksStore );

	return registry;
}

// mock the `loadAssets` function. The real function would load the installed
// block's script assets, which in turn register the block. That registration
// call is the only thing we need to mock.
function loadAssetsMock( registry ) {
	return async function () {
		registry
			.dispatch( blocksStore )
			.addBlockTypes( [ { name: 'block/block' } ] );
	};
}

function blockWithLinks( block, links ) {
	return { ...block, links: { ...block.links, ...links } };
}

describe( 'actions', () => {
	const pluginEndpoint =
		'https://example.com/wp-json/wp/v2/plugins/block-block';

	const block = {
		id: 'block-block',
		name: 'block/block',
		title: 'Test Block',
		links: {
			'wp:install-plugin': [
				{
					href:
						'https://example.com/wp-json/wp/v2/plugins?slug=waves',
				},
			],
		},
	};

	const pluginResponse = {
		plugin: 'block/block.php',
		status: 'active',
		name: 'Test Block',
		version: '1.0.0',
		_links: {
			self: [ { href: pluginEndpoint } ],
		},
	};

	describe( 'installBlockType', () => {
		it( 'should install a block successfully', async () => {
			const registry = createRegistryWithStores();

			// mock the api-fetch and load-assets modules
			apiFetch.mockImplementation( async ( { path } ) => {
				switch ( path ) {
					case 'wp/v2/plugins':
						return pluginResponse;
					default:
						throw new Error( `unexpected API endpoint: ${ path }` );
				}
			} );

			loadAssets.mockImplementation( loadAssetsMock( registry ) );

			// install the block
			await registry
				.dispatch( blockDirectoryStore )
				.installBlockType( block );

			// check that blocks store contains the new block
			const registeredBlock = registry
				.select( blocksStore )
				.getBlockType( 'block/block' );
			expect( registeredBlock ).toBeTruthy();

			// check that the block-directory store contains the new block, too
			const installedBlockTypes = registry
				.select( blockDirectoryStore )
				.getInstalledBlockTypes();
			expect( installedBlockTypes ).toMatchObject( [
				{ name: 'block/block' },
			] );

			// check that notice was displayed
			const notices = registry.select( noticesStore ).getNotices();
			expect( notices ).toMatchObject( [
				{ content: 'Block Test Block installed and added.' },
			] );
		} );

		it( 'should activate an inactive block plugin successfully', async () => {
			const registry = createRegistryWithStores();

			// mock the api-fetch and load-assets modules
			apiFetch.mockImplementation( async ( p ) => {
				const { url } = p;
				switch ( url ) {
					case pluginEndpoint:
						return pluginResponse;
					default:
						throw new Error( `unexpected API endpoint: ${ url }` );
				}
			} );

			loadAssets.mockImplementation( loadAssetsMock( registry ) );

			// install the block
			await registry.dispatch( blockDirectoryStore ).installBlockType(
				blockWithLinks( block, {
					'wp:plugin': [ { href: pluginEndpoint } ],
				} )
			);

			// check that blocks store contains the new block
			const registeredBlock = registry
				.select( blocksStore )
				.getBlockType( 'block/block' );
			expect( registeredBlock ).toBeTruthy();

			// check that notice was displayed
			const notices = registry.select( noticesStore ).getNotices();
			expect( notices ).toMatchObject( [
				{ content: 'Block Test Block installed and added.' },
			] );
		} );

		it( "should set an error if the plugin can't install", async () => {
			const registry = createRegistryWithStores();

			// mock the api-fetch and load-assets modules
			apiFetch.mockImplementation( async ( { path } ) => {
				switch ( path ) {
					case 'wp/v2/plugins':
						throw {
							code: 'plugins_api_failed',
							message: 'Plugin not found.',
							data: null,
						};
					default:
						throw new Error( `unexpected API endpoint: ${ path }` );
				}
			} );

			loadAssets.mockImplementation( loadAssetsMock( registry ) );

			// install the block
			await registry
				.dispatch( blockDirectoryStore )
				.installBlockType( block );

			// check that blocks store doesn't contain the new block
			const registeredBlock = registry
				.select( blocksStore )
				.getBlockType( 'block/block' );
			expect( registeredBlock ).toBeUndefined();

			// check that error notice was displayed
			const notices = registry.select( noticesStore ).getNotices();
			expect( notices ).toMatchObject( [
				{ content: 'Plugin not found.' },
			] );
		} );
	} );

	describe( 'uninstallBlockType', () => {
		const installedBlock = blockWithLinks( block, {
			self: [ { href: pluginEndpoint } ],
		} );

		it( 'should uninstall a block successfully', async () => {
			const registry = createRegistryWithStores();

			apiFetch.mockImplementation( async ( { url, method } ) => {
				switch ( url ) {
					case pluginEndpoint:
						switch ( method ) {
							case 'PUT':
							case 'DELETE':
								return;
							default:
								throw new Error(
									`unexpected API endpoint method: ${ method }`
								);
						}
					default:
						throw new Error( `unexpected API endpoint: ${ url }` );
				}
			} );

			// add installed block type that we're going to uninstall
			registry
				.dispatch( blockDirectoryStore )
				.addInstalledBlockType( installedBlock );

			// uninstall the block
			await registry
				.dispatch( blockDirectoryStore )
				.uninstallBlockType( installedBlock );

			// check that no error notice was displayed
			const notices = registry.select( noticesStore ).getNotices();
			expect( notices ).toEqual( [] );

			// verify that the block was uninstalled
			const installedBlockTypes = registry
				.select( blockDirectoryStore )
				.getInstalledBlockTypes();
			expect( installedBlockTypes ).toEqual( [] );
		} );

		it( "should set a global notice if the plugin can't be deleted", async () => {
			const registry = createRegistryWithStores();

			apiFetch.mockImplementation( async ( { url, method } ) => {
				switch ( url ) {
					case pluginEndpoint:
						switch ( method ) {
							case 'PUT':
								return;
							case 'DELETE':
								throw {
									code: 'rest_cannot_delete_active_plugin',
									message:
										'Cannot delete an active plugin. Please deactivate it first.',
									data: null,
								};
							default:
								throw new Error(
									`unexpected API endpoint method: ${ method }`
								);
						}
					default:
						throw new Error( `unexpected API endpoint: ${ url }` );
				}
			} );

			// uninstall the block
			await registry
				.dispatch( blockDirectoryStore )
				.uninstallBlockType( installedBlock );

			// check that error notice was displayed
			const notices = registry.select( noticesStore ).getNotices();
			expect( notices ).toMatchObject( [
				{
					content:
						'Cannot delete an active plugin. Please deactivate it first.',
				},
			] );
		} );
	} );
} );
