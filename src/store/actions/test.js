/** @format */

import * as actions from './';
import ActionTypes from './ActionTypes';
import { buildEmptyBlock }  from '../block-builder';

describe( 'Store', () => {
	describe( 'actions', () => {
		it( 'should create an action to focus a block', () => {
			const action = actions.focusBlockAction( '1' );
			expect( action.type ).toBeDefined();
			expect( action.type ).toEqual( ActionTypes.BLOCK.FOCUS );
			expect( action.uid ).toEqual( '1' );
		} );

		it( 'should create an action to move block up', () => {
			const action = actions.moveBlockUpAction( '1' );
			expect( action.type ).toBeDefined();
			expect( action.type ).toEqual( ActionTypes.BLOCK.MOVE_UP );
			expect( action.uid ).toEqual( '1' );
		} );

		it( 'should create an action to move block down', () => {
			const action = actions.moveBlockDownAction( '1' );
			expect( action.type ).toBeDefined();
			expect( action.type ).toEqual( ActionTypes.BLOCK.MOVE_DOWN );
			expect( action.uid ).toEqual( '1' );
		} );

		it( 'should create an action to delete a block', () => {
			const action = actions.deleteBlockAction( '1' );
			expect( action.type ).toBeDefined();
			expect( action.type ).toEqual( ActionTypes.BLOCK.DELETE );
			expect( action.uid ).toEqual( '1' );
		} );

		it( 'should create an action to create a block', () => {
			const action = actions.createBlockAction( buildEmptyBlock('1', 'paragraph') );
			expect( action.type ).toEqual( ActionTypes.BLOCK.CREATE );
			expect( action.block.uid ).toEqual( '1' );
		} );

	} );
} );
