/** @format */

import React from 'react';
import renderer from 'react-test-renderer';

import App from './App';
import BlockHolder from './block-management/block-holder';
import * as actions from './store/actions';

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
			expect( action.type ).toEqual( 'BLOCK_FOCUS_ACTION' );
			expect( action.rowId ).toEqual( 1 );
		} );

		it( 'should create an action to move block up', () => {
			const action = actions.moveBlockUpAction( 1 );
			expect( action.type ).toEqual( 'BLOCK_MOVE_UP_ACTION' );
			expect( action.rowId ).toEqual( 1 );
		} );

		it( 'should create an action to focus a block', () => {
			const action = actions.moveBlockDownAction( 1 );
			expect( action.type ).toEqual( 'BLOCK_MOVE_DOWN_ACTION' );
			expect( action.rowId ).toEqual( 1 );
		} );

		it( 'should create an action to focus a block', () => {
			const action = actions.deleteBlockAction( 1 );
			expect( action.type ).toEqual( 'BLOCK_DELETE_ACTION' );
			expect( action.rowId ).toEqual( 1 );
		} );
	} );
} );
