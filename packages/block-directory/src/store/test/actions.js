/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { installBlockType, uninstallBlockType } from '../actions';

describe( 'actions', () => {
	const pluginEndpoint =
		'https://example.com/wp-json/wp/v2/plugins/block/block';
	const item = {
		id: 'block/block',
		name: 'Test Block',
		assets: [ 'script.js' ],
		links: {
			'wp:install-plugin': [
				{
					href:
						'https://example.com/wp-json/wp/v2/plugins?slug=waves',
				},
			],
		},
	};
	const plugin = {
		plugin: 'block/block.php',
		status: 'active',
		name: 'Test Block',
		version: '1.0.0',
		_links: {
			self: [
				{
					href: pluginEndpoint,
				},
			],
		},
	};

	describe( 'installBlockType', () => {
		const block = item;
		it( 'should install a block successfully', () => {
			const generator = installBlockType( block );

			expect( generator.next().value ).toEqual( {
				type: 'CLEAR_ERROR_NOTICE',
				blockId: block.id,
			} );

			expect( generator.next().value ).toEqual( {
				type: 'SET_INSTALLING_BLOCK',
				blockId: block.id,
				isInstalling: true,
			} );

			expect( generator.next().value ).toMatchObject( {
				type: 'API_FETCH',
				request: {
					path: 'wp/v2/plugins',
					method: 'POST',
				},
			} );

			expect( generator.next( plugin ).value ).toEqual( {
				type: 'ADD_INSTALLED_BLOCK_TYPE',
				item: {
					...block,
					links: {
						...block.links,
						self: [
							{
								href: pluginEndpoint,
							},
						],
					},
				},
			} );

			expect( generator.next().value ).toEqual( {
				type: 'LOAD_ASSETS',
				assets: block.assets,
			} );

			expect( generator.next().value ).toEqual( {
				args: [],
				selectorName: 'getBlockTypes',
				storeKey: blocksStore.name,
				type: '@@data/SELECT',
			} );

			expect( generator.next( [ block ] ).value ).toMatchObject( {
				type: '@@data/DISPATCH',
				actionName: 'createInfoNotice',
				storeKey: noticesStore,
			} );

			expect( generator.next().value ).toEqual( {
				type: 'SET_INSTALLING_BLOCK',
				blockId: block.id,
				isInstalling: false,
			} );

			expect( generator.next() ).toEqual( {
				value: true,
				done: true,
			} );
		} );

		it( 'should activate an inactive block plugin successfully', () => {
			const inactiveBlock = {
				...block,
				links: {
					...block.links,
					'wp:plugin': [
						{
							href: pluginEndpoint,
						},
					],
				},
			};
			const generator = installBlockType( inactiveBlock );

			expect( generator.next().value ).toEqual( {
				type: 'CLEAR_ERROR_NOTICE',
				blockId: inactiveBlock.id,
			} );

			expect( generator.next().value ).toEqual( {
				type: 'SET_INSTALLING_BLOCK',
				blockId: inactiveBlock.id,
				isInstalling: true,
			} );

			expect( generator.next().value ).toMatchObject( {
				type: 'API_FETCH',
				request: {
					url: pluginEndpoint,
					method: 'PUT',
				},
			} );

			expect( generator.next( plugin ).value ).toEqual( {
				type: 'ADD_INSTALLED_BLOCK_TYPE',
				item: inactiveBlock,
			} );

			expect( generator.next().value ).toEqual( {
				type: 'LOAD_ASSETS',
				assets: inactiveBlock.assets,
			} );

			expect( generator.next().value ).toEqual( {
				args: [],
				selectorName: 'getBlockTypes',
				storeKey: blocksStore.name,
				type: '@@data/SELECT',
			} );

			expect( generator.next( [ inactiveBlock ] ).value ).toMatchObject( {
				type: '@@data/DISPATCH',
				actionName: 'createInfoNotice',
				storeKey: noticesStore,
			} );

			expect( generator.next().value ).toEqual( {
				type: 'SET_INSTALLING_BLOCK',
				blockId: inactiveBlock.id,
				isInstalling: false,
			} );

			expect( generator.next() ).toEqual( {
				value: true,
				done: true,
			} );
		} );

		it( "should set an error if the plugin can't install", () => {
			const generator = installBlockType( block );

			expect( generator.next().value ).toEqual( {
				type: 'CLEAR_ERROR_NOTICE',
				blockId: block.id,
			} );

			expect( generator.next().value ).toEqual( {
				type: 'SET_INSTALLING_BLOCK',
				blockId: block.id,
				isInstalling: true,
			} );

			expect( generator.next().value ).toMatchObject( {
				type: 'API_FETCH',
				request: {
					path: 'wp/v2/plugins',
					method: 'POST',
				},
			} );

			const apiError = {
				code: 'plugins_api_failed',
				message: 'Plugin not found.',
				data: null,
			};
			expect( generator.throw( apiError ).value ).toMatchObject( {
				type: 'SET_ERROR_NOTICE',
				blockId: block.id,
			} );

			expect( generator.next().value ).toMatchObject( {
				type: '@@data/DISPATCH',
				actionName: 'createErrorNotice',
				storeKey: noticesStore,
			} );

			expect( generator.next().value ).toEqual( {
				type: 'SET_INSTALLING_BLOCK',
				blockId: block.id,
				isInstalling: false,
			} );

			expect( generator.next() ).toEqual( {
				value: false,
				done: true,
			} );
		} );
	} );

	describe( 'uninstallBlockType', () => {
		const block = {
			...item,
			links: {
				...item.links,
				self: [
					{
						href: pluginEndpoint,
					},
				],
			},
		};

		it( 'should uninstall a block successfully', () => {
			const generator = uninstallBlockType( block );

			// First the deactivation step
			expect( generator.next().value ).toMatchObject( {
				type: 'API_FETCH',
				request: {
					url: pluginEndpoint,
					method: 'PUT',
				},
			} );

			// Then the deletion step
			expect( generator.next().value ).toMatchObject( {
				type: 'API_FETCH',
				request: {
					url: pluginEndpoint,
					method: 'DELETE',
				},
			} );

			expect( generator.next().value ).toEqual( {
				type: 'REMOVE_INSTALLED_BLOCK_TYPE',
				item: block,
			} );

			expect( generator.next() ).toEqual( {
				value: undefined,
				done: true,
			} );
		} );

		it( "should set a global notice if the plugin can't be deleted", () => {
			const generator = uninstallBlockType( block );

			expect( generator.next().value ).toMatchObject( {
				type: 'API_FETCH',
				request: {
					url: pluginEndpoint,
					method: 'PUT',
				},
			} );

			expect( generator.next().value ).toMatchObject( {
				type: 'API_FETCH',
				request: {
					url: pluginEndpoint,
					method: 'DELETE',
				},
			} );

			const apiError = {
				code: 'rest_cannot_delete_active_plugin',
				message:
					'Cannot delete an active plugin. Please deactivate it first.',
				data: null,
			};
			expect( generator.throw( apiError ).value ).toMatchObject( {
				type: '@@data/DISPATCH',
				actionName: 'createErrorNotice',
				storeKey: noticesStore,
			} );

			expect( generator.next() ).toEqual( {
				value: undefined,
				done: true,
			} );
		} );
	} );
} );
