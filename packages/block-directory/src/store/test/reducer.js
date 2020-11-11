/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import { blockManagement, downloadableBlocks, errorNotices } from '../reducer';
import { blockTypeInstalled, downloadableBlock } from './fixtures';

describe( 'state', () => {
	describe( 'downloadableBlocks()', () => {
		it( 'should update state to reflect active search', () => {
			const initialState = deepFreeze( {} );
			const filterValue = 'Awesome Block';

			const state = downloadableBlocks( initialState, {
				type: 'FETCH_DOWNLOADABLE_BLOCKS',
				filterValue,
			} );

			expect( state[ filterValue ].isRequesting ).toEqual( true );
		} );

		it( 'should update state to reflect search results have returned', () => {
			const query = downloadableBlock.title;
			const initialState = deepFreeze( {
				[ query ]: {
					isRequesting: true,
				},
			} );

			const state = downloadableBlocks( initialState, {
				type: 'RECEIVE_DOWNLOADABLE_BLOCKS',
				filterValue: query,
				downloadableBlocks: [ downloadableBlock ],
			} );

			expect( state[ query ].isRequesting ).toEqual( false );
		} );

		it( "should set user's search term and save results", () => {
			const query = downloadableBlock.title;
			const initialState = deepFreeze( {} );
			const state = downloadableBlocks( initialState, {
				type: 'RECEIVE_DOWNLOADABLE_BLOCKS',
				filterValue: query,
				downloadableBlocks: [ downloadableBlock ],
			} );
			expect( state ).toHaveProperty( query );
			expect( state[ query ].results ).toHaveLength( 1 );
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
				item: blockTypeInstalled,
			} );

			expect( state.installedBlockTypes ).toHaveLength( 1 );
		} );

		it( 'should remove item from the installedBlockTypesList', () => {
			const initialState = deepFreeze( {
				installedBlockTypes: [ blockTypeInstalled ],
			} );
			const state = blockManagement( initialState, {
				type: 'REMOVE_INSTALLED_BLOCK_TYPE',
				item: blockTypeInstalled,
			} );

			expect( state.installedBlockTypes ).toHaveLength( 0 );
		} );
	} );

	describe( 'errorNotices()', () => {
		it( 'should set an error notice', () => {
			const initialState = deepFreeze( {} );
			const error = {
				message: 'error',
				isFatal: false,
			};

			const state = errorNotices( initialState, {
				type: 'SET_ERROR_NOTICE',
				blockId: 'block/has-error',
				...error,
			} );

			expect( state ).toEqual( {
				'block/has-error': error,
			} );
		} );

		it( 'should set a second error notice', () => {
			const initialState = deepFreeze( {
				'block/has-error': {
					message: 'error',
					isFatal: false,
				},
			} );
			const state = errorNotices( initialState, {
				type: 'SET_ERROR_NOTICE',
				blockId: 'block/another-error',
				message: 'error',
				isFatal: true,
			} );

			expect( state ).toEqual( {
				'block/has-error': {
					message: 'error',
					isFatal: false,
				},
				'block/another-error': {
					message: 'error',
					isFatal: true,
				},
			} );
		} );

		it( 'should clear an existing error notice', () => {
			const initialState = deepFreeze( {
				'block/has-error': {
					message: 'existing error',
					isFatal: false,
				},
			} );

			const state = errorNotices( initialState, {
				type: 'CLEAR_ERROR_NOTICE',
				blockId: 'block/has-error',
			} );

			expect( state ).toEqual( {} );
		} );

		it( 'should clear a nonexistent error notice', () => {
			const initialState = deepFreeze( {
				'block/has-error': {
					message: 'new error',
					isFatal: true,
				},
			} );
			const state = errorNotices( initialState, {
				type: 'CLEAR_ERROR_NOTICE',
				blockId: 'block/no-error',
			} );

			expect( state ).toEqual( initialState );
		} );
	} );
} );
