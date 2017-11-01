/**
 * External dependencies
 */
import { noop } from 'lodash';
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import reducer, { toggleDirty, middleware } from '../save-state';
import * as selectors from '../../selectors';

jest.mock( '../../selectors' );

describe( 'saveState', () => {
	beforeEach( () => jest.resetAllMocks() );

	describe( '.middleware()', () => {
		const dispatch = jest.fn();

		let isDirty, editor;
		const store = {
			getState() {
				return {
					saveState: {
						isDirty,
					},
					editor,
				};
			},
			dispatch,
		};

		it( 'should dispatch toggle dirty false when post reset', () => {
			isDirty = true;
			// Return new object reference for each call, strictly unequal
			selectors.getCurrentPost.mockImplementation( () => ( {} ) );

			middleware( store )( noop )( {} );

			expect( store.dispatch ).toHaveBeenCalledWith( toggleDirty( false ) );
		} );

		it( 'should dispatch toggle dirty true when editor changes', () => {
			isDirty = false;
			const currentPost = {};
			selectors.getCurrentPost.mockReturnValue( currentPost );
			selectors.hasEditorUndo.mockReturnValue( true );

			editor = {};
			middleware( store )( () => {
				// Set editor as new reference, strictly unequal to old
				editor = {};
			} )( {} );

			expect( store.dispatch ).toHaveBeenCalledWith( toggleDirty( true ) );
		} );

		it( 'should not dispatch toggle dirty when post has no undo history', () => {
			isDirty = false;
			const currentPost = {};
			selectors.getCurrentPost.mockReturnValue( currentPost );
			selectors.hasEditorUndo.mockReturnValue( false );

			middleware( store )( noop )( {} );

			expect( store.dispatch ).not.toHaveBeenCalled();
		} );

		it( 'should not dispatch toggle if already the same', () => {
			isDirty = true;
			const currentPost = {};
			selectors.getCurrentPost.mockReturnValue( currentPost );
			selectors.hasEditorUndo.mockReturnValue( true );

			editor = {};
			middleware( store )( () => {
				// Set editor as new reference, strictly unequal to old
				editor = {};
			} )( {} );

			expect( store.dispatch ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'reducer', () => {
		describe( '.isDirty()', () => {
			it( 'should default to false', () => {
				const state = reducer( undefined, {} );

				expect( state.isDirty ).toBe( false );
			} );

			it( 'should return value by toggle property', () => {
				const originalState = deepFreeze( reducer( undefined, {} ) );
				const state = reducer( originalState, {
					type: 'TOGGLE_DIRTY',
					isDirty: true,
				} );

				expect( state.isDirty ).toBe( true );
			} );
		} );
	} );
} );
