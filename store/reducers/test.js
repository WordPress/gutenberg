/** @format */

import { reducer } from './';
import * as actions from '../actions/';
import { DataSource } from 'react-native-recyclerview-list';

describe( 'Store', () => {
	describe( 'reducer', () => {
		// use scoped variables. See https://github.com/facebook/jest/issues/3553#issuecomment-300851842
		let __iniState;
		let initialState;

		beforeAll( () => {
			__iniState = {
				blocks: [
					{
						uid: '0',
						blockType: 'title',
						attributes: {
							content: 'Hello World',
						},
						focused: false,
					},
					{
						uid: '1',
						blockType: 'paragraph',
						attributes: {
							content: 'paragraph content',
						},
						focused: false,
					},
				],
			};
		} );

		beforeEach( () => {
			initialState = {
				dataSource: new DataSource(
					[ ...__iniState.blocks ],
					( item: BlockType, index ) => item.uid
				),
			};
		} );

		afterEach( () => {
			// TODO: the following check is not working with the datasource because it's a mutable structure. Duplicating it in the reducer kills the animation in the recycler view.
			// expect( initialState.dataSource._data ).toEqual( __iniState.blocks );
		} );

		it( "should mutate block's content", () => {
			let newState = reducer(
				initialState,
				actions.updateBlockAttributes( '1', { content: 'new content' } )
			);
			// the title block should still be there at the top
			expect( newState.dataSource.get( 1 ).attributes.content ).toEqual( 'new content' );
		} );

		it( 'should focus a block', () => {
			let newState = reducer( initialState, actions.focusBlockAction( '0' ) );

			// the focused block should have its variable set to true
			expect( newState.dataSource.get( 0 ).focused ).toEqual( true );

			// the other block should have its variable set to false
			expect( newState.dataSource.get( 1 ).focused ).toEqual( false );

			// let's focus on the other block
			newState = reducer( initialState, actions.focusBlockAction( '1' ) );

			// the focused block should have its variable set to true
			expect( newState.dataSource.get( 1 ).focused ).toEqual( true );

			// the other block should have its variable set to false
			expect( newState.dataSource.get( 0 ).focused ).toEqual( false );
		} );

		it( 'should not be able to move top block up', () => {
			const newState = reducer( initialState, actions.moveBlockUpAction( '0' ) );

			// blocks should still be in the same places
			expect( newState.dataSource.get( 0 ).blockType ).toEqual( 'title' );
			expect( newState.dataSource.get( 1 ).blockType ).toEqual( 'paragraph' );
		} );

		it( 'should move a block up', () => {
			let newState = reducer( initialState, actions.moveBlockUpAction( '1' ) );

			// the paragraph block should have moved up
			expect( newState.dataSource.get( 0 ).blockType ).toEqual( 'paragraph' );

			// the block below it should be the title now
			expect( newState.dataSource.get( 1 ).blockType ).toEqual( 'title' );
		} );

		it( 'should not be able to move bottom block down', () => {
			const newState = reducer( initialState, actions.moveBlockDownAction( '1' ) );

			// blocks should still be in the same places
			expect( newState.dataSource.get( 0 ).blockType ).toEqual( 'title' );
			expect( newState.dataSource.get( 1 ).blockType ).toEqual( 'paragraph' );
		} );

		it( 'should move a block down', () => {
			let newState = reducer( initialState, actions.moveBlockDownAction( '0' ) );

			// the paragraph block should be at the top now
			expect( newState.dataSource.get( 0 ).blockType ).toEqual( 'paragraph' );

			// the title block should have moved down
			expect( newState.dataSource.get( 1 ).blockType ).toEqual( 'title' );
		} );

		it( 'should delete top block', () => {
			let newState = reducer( initialState, actions.deleteBlockAction( '0' ) );

			// only one block should be left
			expect( newState.dataSource.size() ).toEqual( 1 );

			// the paragraph block should be at the top now
			expect( newState.dataSource.get( 0 ).blockType ).toEqual( 'paragraph' );
		} );

		it( 'should delete bottom block', () => {
			let newState = reducer( initialState, actions.deleteBlockAction( '1' ) );
			// only one block should be left
			expect( newState.dataSource.size() ).toEqual( 1 );

			// the title block should still be there at the top
			expect( newState.dataSource.get( 0 ).blockType ).toEqual( 'title' );
		} );

		it( 'should delete middle block', () => {
			// add a third block so there's a middle one to remove
			const extraState = {
				...initialState,
				dataSource: new DataSource( [
					...initialState.dataSource._data,
					{
						key: '2',
						blockType: 'core/code',
						attributes: {
							content: 'Hello code',
						},
						focused: false,
					},
				] ),
			};
			let newState = reducer( extraState, actions.deleteBlockAction( '1' ) );

			// only two blocks should be left
			expect( newState.dataSource.size() ).toEqual( 2 );

			// the title block should still be there at the top
			expect( newState.dataSource.get( 0 ).blockType ).toEqual( 'title' );

			// the code block should be at the bottom
			expect( newState.dataSource.get( 1 ).blockType ).toEqual( 'core/code' );
		} );
	} );
} );
