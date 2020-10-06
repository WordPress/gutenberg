/**
 * External dependencies
 */
import { filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import * as selectors from '../selectors';

const {
	__experimentalGetReusableBlock: getReusableBlock,
	__experimentalIsSavingReusableBlock: isSavingReusableBlock,
	__experimentalIsFetchingReusableBlock: isFetchingReusableBlock,
	__experimentalGetReusableBlocks: getReusableBlocks,
} = selectors;

describe( 'selectors', () => {
	let cachedSelectors;

	beforeAll( () => {
		cachedSelectors = filter( selectors, ( selector ) => selector.clear );
	} );

	beforeEach( () => {
		registerBlockType( 'core/block', {
			save: () => null,
			category: 'reusable',
			title: 'Reusable Block Stub',
			supports: {
				inserter: false,
			},
		} );

		cachedSelectors.forEach( ( { clear } ) => clear() );
	} );

	afterEach( () => {
		unregisterBlockType( 'core/block' );
	} );

	describe( 'getReusableBlock', () => {
		it( 'should return a reusable block', () => {
			const state = {
				data: {
					8109: {
						clientId: 'foo',
						title: 'My cool block',
					},
				},
			};

			const actualReusableBlock = getReusableBlock( state, 8109 );
			expect( actualReusableBlock ).toEqual( {
				id: 8109,
				isTemporary: false,
				clientId: 'foo',
				title: 'My cool block',
			} );
		} );

		it( 'should return a temporary reusable block', () => {
			const state = {
				data: {
					reusable1: {
						clientId: 'foo',
						title: 'My cool block',
					},
				},
			};

			const actualReusableBlock = getReusableBlock( state, 'reusable1' );
			expect( actualReusableBlock ).toEqual( {
				id: 'reusable1',
				isTemporary: true,
				clientId: 'foo',
				title: 'My cool block',
			} );
		} );

		it( 'should return null when no reusable block exists', () => {
			const state = {
				data: {},
			};

			const reusableBlock = getReusableBlock( state, 123 );
			expect( reusableBlock ).toBeNull();
		} );
	} );

	describe( 'isSavingReusableBlock', () => {
		it( 'should return false when the block is not being saved', () => {
			const state = {
				isSaving: {},
			};

			const isSaving = isSavingReusableBlock( state, 5187 );
			expect( isSaving ).toBe( false );
		} );

		it( 'should return true when the block is being saved', () => {
			const state = {
				isSaving: {
					5187: true,
				},
			};

			const isSaving = isSavingReusableBlock( state, 5187 );
			expect( isSaving ).toBe( true );
		} );
	} );

	describe( 'isFetchingReusableBlock', () => {
		it( 'should return false when the block is not being fetched', () => {
			const state = {
				isFetching: {},
			};

			const isFetching = isFetchingReusableBlock( state, 5187 );
			expect( isFetching ).toBe( false );
		} );

		it( 'should return true when the block is being fetched', () => {
			const state = {
				isFetching: {
					5187: true,
				},
			};

			const isFetching = isFetchingReusableBlock( state, 5187 );
			expect( isFetching ).toBe( true );
		} );
	} );

	describe( 'getReusableBlocks', () => {
		it( 'should return an array of reusable blocks', () => {
			const state = {
				data: {
					123: { clientId: 'carrot' },
					reusable1: { clientId: 'broccoli' },
				},
			};

			const reusableBlocks = getReusableBlocks( state );
			expect( reusableBlocks ).toEqual( [
				{ id: 123, isTemporary: false, clientId: 'carrot' },
				{ id: 'reusable1', isTemporary: true, clientId: 'broccoli' },
			] );
		} );

		it( 'should return an empty array when no reusable blocks exist', () => {
			const state = {
				data: {},
			};

			const reusableBlocks = getReusableBlocks( state );
			expect( reusableBlocks ).toEqual( [] );
		} );
	} );
} );
