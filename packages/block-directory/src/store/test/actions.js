/**
 * Internal dependencies
 */
import { installBlockType } from '../actions';

describe( 'actions', () => {
	const item = {
		id: 'block/block',
		name: 'Test Block',
		assets: [ 'script.js' ],
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
			} );

			expect( generator.next( { success: true } ).value ).toEqual( {
				type: 'ADD_INSTALLED_BLOCK_TYPE',
				item,
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
			} );

			const apiError = {
				code: 'plugins_api_failed',
				message: 'Plugin not found.',
				data: null,
			};
			expect( generator.next( apiError ).value ).toMatchObject( {
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
} );
