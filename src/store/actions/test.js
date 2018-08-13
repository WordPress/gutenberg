/** @format */

import * as actions from './';
import ActionTypes from './ActionTypes';
// Gutenberg imports
import { getBlockType, serialize, createBlock } from '@wordpress/blocks';
import { registerCoreBlocks } from '@gutenberg/core-blocks';

describe( 'Store', () => {
	describe( 'actions', () => {
		beforeAll( () => {
			registerCoreBlocks();
		} );
	
		it( 'should create an action to focus a block', () => {
			const action = actions.focusBlockAction( '1' );
			expect( action.type ).toBeDefined();
			expect( action.type ).toEqual( ActionTypes.BLOCK.FOCUS );
			expect( action.clientId ).toEqual( '1' );
		} );

		it( 'should create an action to move block up', () => {
			const action = actions.moveBlockUpAction( '1' );
			expect( action.type ).toBeDefined();
			expect( action.type ).toEqual( ActionTypes.BLOCK.MOVE_UP );
			expect( action.clientId ).toEqual( '1' );
		} );

		it( 'should create an action to move block down', () => {
			const action = actions.moveBlockDownAction( '1' );
			expect( action.type ).toBeDefined();
			expect( action.type ).toEqual( ActionTypes.BLOCK.MOVE_DOWN );
			expect( action.clientId ).toEqual( '1' );
		} );

		it( 'should create an action to delete a block', () => {
			const action = actions.deleteBlockAction( '1' );
			expect( action.type ).toBeDefined();
			expect( action.type ).toEqual( ActionTypes.BLOCK.DELETE );
			expect( action.clientId ).toEqual( '1' );
		} );

		it( 'should create an action to create a block', () => {
			const newBlock = createBlock( 'core/code', { content: 'new test text for a core/code block' } );
			const action = actions.createBlockAction( '1', newBlock );
			expect( action.type ).toEqual( ActionTypes.BLOCK.CREATE );
			expect( action.clientId ).toEqual( '1' );
			expect( action.block ).toEqual( newBlock );
		} );

	} );
} );
