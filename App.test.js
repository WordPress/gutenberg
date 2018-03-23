/** @format */

import React from 'react';
import renderer from 'react-test-renderer';

import App from './App';
import BlockHolder from './block-management/block-holder';
import * as actions from './store/actions';
import ActionTypes from './store/actions/ActionTypes';

describe( 'App', () => {
	it( 'renders without crashing', () => {
		const rendered = renderer.create( <App /> ).toJSON();
		expect( rendered ).toBeTruthy();
	} );

	it( 'Code block is a TextInput', () => {
		renderer
			.create( <App /> )
			.root.findAllByType( BlockHolder )
			.forEach( blockHolder => {
				if ( blockHolder.props.blockType === 'code' ) {
					// TODO: hardcoded indices are ugly and error prone. Can we do better here?
					const blockHolderContainer = blockHolder.children[ 0 ].children[ 0 ].children[ 0 ];
					const contentComponent = blockHolderContainer.children[ 1 ];
					const inputComponent =
						contentComponent.children[ 0 ].children[ 0 ].children[ 0 ].children[ 0 ].children[ 0 ]
							.children[ 0 ].children[ 0 ];
					expect( inputComponent.type ).toBe( 'TextInput' );
				}
			} );
	} );
} );

describe( 'Store', () => {
	describe( 'actions', () => {
		it( 'should create an action to focus a block', () => {
			const action = actions.focusBlockAction( 1 );
			expect( action.type ).toEqual( ActionTypes.BLOCK.FOCUS );
			expect( action.rowId ).toEqual( 1 );
		} );

		it( 'should create an action to move block up', () => {
			const action = actions.moveBlockUpAction( 1 );
			expect( action.type ).toEqual( ActionTypes.BLOCK.MOVE_UP );
			expect( action.rowId ).toEqual( 1 );
		} );

		it( 'should create an action to move block down', () => {
			const action = actions.moveBlockDownAction( 1 );
			expect( action.type ).toEqual( ActionTypes.BLOCK.MOVE_DOWN );
			expect( action.rowId ).toEqual( 1 );
		} );

		it( 'should create an action to delete a block', () => {
			const action = actions.deleteBlockAction( 1 );
			expect( action.type ).toEqual( ActionTypes.BLOCK.DELETE );
			expect( action.rowId ).toEqual( 1 );
		} );
	} );
} );
