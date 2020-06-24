/**
 * Internal dependencies
 */
import { installBlockType, uninstallBlockType } from '../actions';

describe( 'actions', () => {
	const endpoint = '/wp-json/__experimental/plugins/block/block';
	const item = {
		id: 'block/block',
		name: 'Test Block',
		assets: [ 'script.js' ],
	};
	const plugin = {
		plugin: 'block/block.php',
		status: 'active',
		name: 'Test Block',
		version: '1.0.0',
		_links: {
			self: [
				{
					href: endpoint,
				},
			],
		},
	};

	describe( 'installBlockType', () => {
		it( 'should install a block successfully', () => {
			const generator = installBlockType( item );

			expect( generator.next().value ).toEqual( {
				type: 'SET_ERROR_NOTICE',
				blockId: item.id,
				notice: false,
			} );

			expect( generator.next().value ).toEqual( {
				type: 'SET_INSTALLING_BLOCK',
				blockId: item.id,
				isInstalling: true,
			} );

			expect( generator.next().value ).toMatchObject( {
				type: 'API_FETCH',
				request: {
					path: '__experimental/plugins',
					method: 'POST',
				},
			} );

			const itemWithEndpoint = { ...item, endpoint };
			expect( generator.next( plugin ).value ).toEqual( {
				type: 'ADD_INSTALLED_BLOCK_TYPE',
				item: itemWithEndpoint,
			} );

			expect( generator.next().value ).toEqual( {
				type: 'LOAD_ASSETS',
				assets: item.assets,
			} );

			expect( generator.next().value ).toEqual( {
				args: [],
				selectorName: 'getBlockTypes',
				storeKey: 'core/blocks',
				type: 'SELECT',
			} );

			expect( generator.next( [ item ] ).value ).toEqual( {
				type: 'SET_INSTALLING_BLOCK',
				blockId: item.id,
				isInstalling: false,
			} );

			expect( generator.next() ).toEqual( {
				value: true,
				done: true,
			} );
		} );

		it( 'should set an error if the plugin has no assets', () => {
			const generator = installBlockType( { ...item, assets: [] } );

			expect( generator.next().value ).toEqual( {
				type: 'SET_ERROR_NOTICE',
				blockId: item.id,
				notice: false,
			} );

			expect( generator.next().value ).toMatchObject( {
				type: 'SET_ERROR_NOTICE',
				blockId: item.id,
			} );

			expect( generator.next().value ).toEqual( {
				type: 'SET_INSTALLING_BLOCK',
				blockId: item.id,
				isInstalling: false,
			} );

			expect( generator.next() ).toEqual( {
				value: false,
				done: true,
			} );
		} );

		it( "should set an error if the plugin can't install", () => {
			const generator = installBlockType( item );

			expect( generator.next().value ).toEqual( {
				type: 'SET_ERROR_NOTICE',
				blockId: item.id,
				notice: false,
			} );

			expect( generator.next().value ).toEqual( {
				type: 'SET_INSTALLING_BLOCK',
				blockId: item.id,
				isInstalling: true,
			} );

			expect( generator.next().value ).toMatchObject( {
				type: 'API_FETCH',
				request: {
					path: '__experimental/plugins',
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
				blockId: item.id,
			} );

			expect( generator.next().value ).toEqual( {
				type: 'SET_INSTALLING_BLOCK',
				blockId: item.id,
				isInstalling: false,
			} );

			expect( generator.next() ).toEqual( {
				value: false,
				done: true,
			} );
		} );
	} );

	describe( 'uninstallBlockType', () => {
		const itemWithEndpoint = { ...item, endpoint };

		it( 'should uninstall a block successfully', () => {
			const generator = uninstallBlockType( itemWithEndpoint );

			// First the deactivation step
			expect( generator.next().value ).toMatchObject( {
				type: 'API_FETCH',
				request: {
					url: endpoint,
					method: 'PUT',
				},
			} );

			// Then the deletion step
			expect( generator.next().value ).toMatchObject( {
				type: 'API_FETCH',
				request: {
					url: endpoint,
					method: 'DELETE',
				},
			} );

			expect( generator.next().value ).toEqual( {
				type: 'REMOVE_INSTALLED_BLOCK_TYPE',
				item: itemWithEndpoint,
			} );

			expect( generator.next() ).toEqual( {
				value: undefined,
				done: true,
			} );
		} );

		it( "should set a global notice if the plugin can't be deleted", () => {
			const generator = uninstallBlockType( itemWithEndpoint );

			expect( generator.next().value ).toMatchObject( {
				type: 'API_FETCH',
				request: {
					url: endpoint,
					method: 'PUT',
				},
			} );

			expect( generator.next().value ).toMatchObject( {
				type: 'API_FETCH',
				request: {
					url: endpoint,
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
				type: 'DISPATCH',
				actionName: 'createErrorNotice',
				storeKey: 'core/notices',
			} );

			expect( generator.next() ).toEqual( {
				value: undefined,
				done: true,
			} );
		} );
	} );
} );
