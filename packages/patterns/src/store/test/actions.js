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
import { store as patternsStore } from '../index';

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

function createRegistryWithStores() {
	// Create a registry and register stores.
	const registry = createRegistry();

	registry.register( coreStore );
	registry.register( blockEditorStore );
	registry.register( patternsStore );
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
				.dispatch( patternsStore )
				.__experimentalSetEditingReusableBlock( 3, true );
			expect(
				registry
					.select( patternsStore )
					.__experimentalIsEditingReusableBlock( 3 )
			).toBe( true );

			registry
				.dispatch( patternsStore )
				.__experimentalSetEditingReusableBlock( 3, false );
			expect(
				registry
					.select( patternsStore )
					.__experimentalIsEditingReusableBlock( 3 )
			).toBe( false );
		} );
	} );

	describe( '__experimentalConvertBlocksToPattern', () => {
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
				.dispatch( patternsStore )
				.__experimentalConvertBlocksToPattern( [
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
					.select( patternsStore )
					.__experimentalIsEditingReusableBlock( newClientId )
			).toBe( true );
		} );
	} );
} );
