/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	store as blocksStore,
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';

import { store as coreStore } from '@wordpress/core-data';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { store as reusableBlocksStore } from '../index';

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

function createRegistryWithStores() {
	// Create a registry and register stores.
	const registry = createRegistry();

	registry.register( coreStore );
	registry.register( blockEditorStore );
	registry.register( reusableBlocksStore );
	registry.register( blocksStore );

	// Register entity here instead of mocking API handlers for loadPostTypeEntities()
	registry.dispatch( coreStore ).addEntities( [
		{
			baseURL: '/wp/v2/reusable-blocks',
			kind: 'postType',
			name: 'wp_block',
			label: 'Reusable blocks',
		},
	] );

	return registry;
}

describe( 'Actions', () => {
	beforeAll( () => {
		registerBlockType( 'core/test-block', {
			title: 'Test block',
			category: 'text',
			save: () => null,
			attributes: {
				name: { type: 'string' },
			},
		} );

		registerBlockType( 'core/block', {
			title: 'Reusable block',
			category: 'text',
			save: () => null,
			attributes: {
				ref: { type: 'string' },
			},
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/test-block' );
		unregisterBlockType( 'core/block' );
	} );

	describe( '__experimentalSetEditingReusableBlock', () => {
		it( 'should flip the editing state', () => {
			const registry = createRegistryWithStores();

			registry
				.dispatch( reusableBlocksStore )
				.__experimentalSetEditingReusableBlock( 3, true );
			expect(
				registry
					.select( reusableBlocksStore )
					.__experimentalIsEditingReusableBlock( 3 )
			).toBe( true );

			registry
				.dispatch( reusableBlocksStore )
				.__experimentalSetEditingReusableBlock( 3, false );
			expect(
				registry
					.select( reusableBlocksStore )
					.__experimentalIsEditingReusableBlock( 3 )
			).toBe( false );
		} );
	} );

	describe( '__experimentalConvertBlocksToReusable', () => {
		it( 'should convert a static block into a reusable block', async () => {
			const staticBlock = createBlock( 'core/test-block', {
				name: 'Big Bird',
			} );

			const registry = createRegistryWithStores();
			// Mock the api-fetch.
			apiFetch.mockImplementation( async ( args ) => {
				const { path, data } = args;
				switch ( path ) {
					case '/wp/v2/reusable-blocks':
						return {
							id: 'new-id',
							...data,
						};
					default:
						throw new Error( `unexpected API endpoint: ${ path }` );
				}
			} );

			registry.dispatch( blockEditorStore ).insertBlock( staticBlock );

			await registry
				.dispatch( reusableBlocksStore )
				.__experimentalConvertBlocksToReusable( [
					staticBlock.clientId,
				] );

			// Check that blocks were converted to reusable.
			const updatedBlocks = registry
				.select( blockEditorStore )
				.getBlocks();

			const newClientId = updatedBlocks[ 0 ].clientId;

			expect( updatedBlocks ).toHaveLength( 1 );

			// Delete random clientId before matching with snapshot.
			delete updatedBlocks[ 0 ].clientId;
			expect( updatedBlocks ).toMatchSnapshot();

			expect(
				registry
					.select( reusableBlocksStore )
					.__experimentalIsEditingReusableBlock( newClientId )
			).toBe( true );
		} );
	} );

	describe( '__experimentalConvertBlockToStatic', () => {
		it( 'should convert a static reusable into a static block', async () => {
			const associatedBlock = createBlock( 'core/block', {
				ref: 123,
			} );
			const reusableBlock = {
				id: 123,
				title: 'My cool block',
				content:
					'<!-- wp:test-block {"name":"Big Bird"} --><!-- wp:test-block {"name":"Oscar the Grouch"} /--><!-- wp:test-block {"name":"Cookie Monster"} /--><!-- /wp:test-block -->',
			};

			const registry = createRegistryWithStores();
			// Mock the api-fetch.
			apiFetch.mockImplementation( async ( args ) => {
				const { path, data } = args;
				switch ( path ) {
					case '/wp/v2/reusable-blocks/123':
						return data;
					default:
						throw new Error( `unexpected API endpoint: ${ path }` );
				}
			} );

			registry
				.dispatch( blockEditorStore )
				.insertBlock( associatedBlock );
			await registry
				.dispatch( coreStore )
				.saveEntityRecord( 'postType', 'wp_block', reusableBlock );

			await registry
				.dispatch( reusableBlocksStore )
				.__experimentalConvertBlockToStatic( [
					associatedBlock.clientId,
				] );

			// Check that blocks were converted to reusable.
			const updatedBlocks = registry
				.select( blockEditorStore )
				.getBlocks();

			expect( updatedBlocks ).toHaveLength( 1 );

			// Delete random clientIds before matching with snapshot.
			delete updatedBlocks[ 0 ].clientId;
			delete updatedBlocks[ 0 ].innerBlocks[ 0 ].clientId;
			delete updatedBlocks[ 0 ].innerBlocks[ 1 ].clientId;
			expect( updatedBlocks ).toMatchSnapshot();
		} );
	} );

	describe( '__experimentalDeleteReusableBlock', () => {
		it( 'should delete a reusable block and remove all its instances from the store', async () => {
			const reusableBlock = {
				id: 123,
			};
			const availableBlocks = [
				createBlock( 'core/block' ),
				createBlock( 'core/block', {
					ref: 123,
				} ),
				createBlock( 'core/block', {
					ref: 456,
				} ),
				createBlock( 'core/block', {
					ref: 123,
				} ),
				createBlock( 'core/test-block', {
					ref: 123,
				} ),
			];

			const registry = createRegistryWithStores();
			// Mock the api-fetch.
			apiFetch.mockImplementation( async ( args ) => {
				const { path, data, method } = args;
				if (
					path.startsWith( '/wp/v2/reusable-blocks' ) &&
					method === 'DELETE'
				) {
					return data;
				} else if (
					path === '/wp/v2/reusable-blocks/123' &&
					method === 'PUT'
				) {
					return data;
				}
				throw new Error(
					`unexpected API request: ${ path } ${ method }`
				);
			} );

			await registry
				.dispatch( coreStore )
				.saveEntityRecord( 'postType', 'wp_block', reusableBlock );

			registry
				.dispatch( blockEditorStore )
				.insertBlocks( availableBlocks );

			// Confirm that reusable block is stored.
			const reusableBlockBefore = registry
				.select( coreStore )
				.getEntityRecord( 'postType', 'wp_block', reusableBlock.id );

			expect( reusableBlockBefore ).toBeTruthy();

			await registry
				.dispatch( reusableBlocksStore )
				.__experimentalDeleteReusableBlock( reusableBlock.id );

			// Check if reusable block was deleted.
			const reusableBlockAfter = registry
				.select( coreStore )
				.getEntityRecord( 'postType', 'wp_block', reusableBlock.id );
			expect( reusableBlockAfter ).toBeFalsy();

			// Check if block instances were removed from the editor.
			const blocksAfter = registry.select( blockEditorStore ).getBlocks();
			expect( blocksAfter ).toHaveLength( 3 );
		} );
	} );
} );
