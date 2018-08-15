/**
 * @format
 */

import { reducer } from './';
import * as actions from '../actions/';
import { registerCoreBlocks } from '@gutenberg/core-blocks';

describe( 'Store', () => {
	describe( 'reducer', () => {
		// use scoped variables. See https://github.com/facebook/jest/issues/3553#issuecomment-300851842
		let __iniState;
		let initialState;

		beforeAll( () => {
			registerCoreBlocks()
			
			__iniState = {
				blocks: [
					{
						clientId: '0',
						blockType: 'title',
						attributes: {
							content: 'Hello World',
						},
						focused: false,
					},
					{
						clientId: '1',
						blockType: 'paragraph',
						attributes: {
							content: 'paragraph content',
						},
						focused: false,
					},
				],
				refresh: false,
			};
		} );

		beforeEach( () => {
			initialState = { ...__iniState };
		} );

		afterEach( () => {
			expect( initialState ).toEqual( __iniState );
		} );

		// eslint-disable-next-line quotes
		it( "should mutate block's content", () => {
			const newState = reducer(
				initialState,
				actions.updateBlockAttributes( '1', { content: 'new content' } )
			);

			// the title block should still be there at the top
			expect( newState.blocks[ 1 ].attributes.content ).toEqual( 'new content' );
		} );

		it( 'should focus a block', () => {
			let newState = reducer( initialState, actions.focusBlockAction( '0' ) );

			// the focused block should have its variable set to true
			expect( newState.blocks[ 0 ].focused ).toEqual( true );

			// the other block should have its variable set to false
			expect( newState.blocks[ 1 ].focused ).toEqual( false );

			// let's focus on the other block
			newState = reducer( initialState, actions.focusBlockAction( '1' ) );

			// the focused block should have its variable set to true
			expect( newState.blocks[ 1 ].focused ).toEqual( true );

			// the other block should have its variable set to false
			expect( newState.blocks[ 0 ].focused ).toEqual( false );
		} );

		it( 'should not be able to move top block up', () => {
			const newState = reducer( initialState, actions.moveBlockUpAction( '0' ) );

			// blocks should still be in the same places
			expect( newState.blocks[ 0 ].blockType ).toEqual( 'title' );
			expect( newState.blocks[ 1 ].blockType ).toEqual( 'paragraph' );
		} );

		it( 'should move a block up', () => {
			const newState = reducer( initialState, actions.moveBlockUpAction( '1' ) );

			// the paragraph block should have moved up
			expect( newState.blocks[ 0 ].blockType ).toEqual( 'paragraph' );

			// the block below it should be the title now
			expect( newState.blocks[ 1 ].blockType ).toEqual( 'title' );
		} );

		it( 'should not be able to move bottom block down', () => {
			const newState = reducer( initialState, actions.moveBlockDownAction( '1' ) );

			// blocks should still be in the same places
			expect( newState.blocks[ 0 ].blockType ).toEqual( 'title' );
			expect( newState.blocks[ 1 ].blockType ).toEqual( 'paragraph' );
		} );

		it( 'should move a block down', () => {
			const newState = reducer( initialState, actions.moveBlockDownAction( '0' ) );

			// the paragraph block should be at the top now
			expect( newState.blocks[ 0 ].blockType ).toEqual( 'paragraph' );

			// the title block should have moved down
			expect( newState.blocks[ 1 ].blockType ).toEqual( 'title' );
		} );

		it( 'should delete top block', () => {
			const newState = reducer( initialState, actions.deleteBlockAction( '0' ) );

			// only one block should be left
			expect( newState.blocks ).toHaveLength( 1 );

			// the paragraph block should be at the top now
			expect( newState.blocks[ 0 ].blockType ).toEqual( 'paragraph' );
		} );

		it( 'should delete bottom block', () => {
			const newState = reducer( initialState, actions.deleteBlockAction( '1' ) );

			// only one block should be left
			expect( newState.blocks ).toHaveLength( 1 );

			// the title block should still be there at the top
			expect( newState.blocks[ 0 ].blockType ).toEqual( 'title' );
		} );

		it( 'should delete middle block', () => {
			// add a third block so there's a middle one to remove
			const extraState = {
				...initialState,
				blocks: [
					...initialState.blocks,
					{
						key: '2',
						blockType: 'core/code',
						attributes: {
							content: 'Hello code',
						},
						focused: false,
					},
				],
			};
			const newState = reducer( extraState, actions.deleteBlockAction( '1' ) );

			// only two blocks should be left
			expect( newState.blocks ).toHaveLength( 2 );

			// the title block should still be there at the top
			expect( newState.blocks[ 0 ].blockType ).toEqual( 'title' );

			// the code block should be at the bottom
			expect( newState.blocks[ 1 ].blockType ).toEqual( 'core/code' );
		} );

		it( 'parses the html string into a new array of blocks', () => {
			const htmlContent = '<!--more-->'
			const html = '<!-- wp:more -->' + htmlContent + '<!-- /wp:more -->'

			const newState = reducer( initialState, actions.parseBlocksAction( html ) );

			expect( newState.blocks ).toHaveLength( 1 );
			expect( newState.blocks[ 0 ].originalContent ).toEqual( htmlContent );
			expect( newState.blocks[ 0 ].name ).toEqual( 'core/more' );
		})
	} );
} );
