/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import { downloadableBlocks, blockManagement, hasPermission } from '../reducer';
import { installedItem, downloadableBlock } from './fixtures';

describe( 'state', () => {
	describe( 'downloadableBlocks()', () => {
		it( 'should update state to reflect active search', () => {
			const initialState = deepFreeze( {
				isRequestingDownloadableBlocks: false,
			} );
			const state = downloadableBlocks( initialState, {
				type: 'FETCH_DOWNLOADABLE_BLOCKS',
			} );

			expect( state.isRequestingDownloadableBlocks ).toBe( true );
		} );

		it( 'should update state to reflect search results have returned', () => {
			const state = downloadableBlocks( undefined, {
				type: 'RECEIVE_DOWNLOADABLE_BLOCKS',
				filterValue: downloadableBlock.title,
				downloadableBlocks: [ downloadableBlock ],
			} );

			expect( state.isRequestingDownloadableBlocks ).toBe( false );
		} );

		it( "should set user's search term and save results", () => {
			const state = downloadableBlocks( undefined, {
				type: 'RECEIVE_DOWNLOADABLE_BLOCKS',
				filterValue: downloadableBlock.title,
				downloadableBlocks: [ downloadableBlock ],
			} );
			expect( state.results ).toHaveProperty( downloadableBlock.title );
			expect( state.results[ downloadableBlock.title ] ).toHaveLength(
				1
			);

			// It should append to the results
			const updatedState = downloadableBlocks( state, {
				type: 'RECEIVE_DOWNLOADABLE_BLOCKS',
				filterValue: 'Test 1',
				downloadableBlocks: [ downloadableBlock ],
			} );

			expect( Object.keys( updatedState.results ) ).toHaveLength( 2 );
		} );
	} );

	describe( 'blockManagement()', () => {
		it( 'should start with an empty installedBlockTypes List', () => {
			const state = blockManagement( undefined, {
				type: 'NOOP_TYPE',
			} );
			expect( state.installedBlockTypes ).toEqual( [] );
		} );

		it( 'should add item to the installedBlockTypesList', () => {
			const initialState = deepFreeze( { installedBlockTypes: [] } );
			const state = blockManagement( initialState, {
				type: 'ADD_INSTALLED_BLOCK_TYPE',
				item: installedItem,
			} );

			expect( state.installedBlockTypes ).toHaveLength( 1 );
		} );

		it( 'should remove item from the installedBlockTypesList', () => {
			const initialState = deepFreeze( {
				installedBlockTypes: [ installedItem ],
			} );
			const state = blockManagement( initialState, {
				type: 'REMOVE_INSTALLED_BLOCK_TYPE',
				item: installedItem,
			} );

			expect( state.installedBlockTypes ).toHaveLength( 0 );
		} );
	} );

	describe( 'hasPermission()', () => {
		it( 'should update permissions appropriately', () => {
			const state = hasPermission( true, {
				type: 'SET_INSTALL_BLOCKS_PERMISSION',
				hasPermission: false,
			} );

			expect( state ).toBe( false );
		} );
	} );
} );
