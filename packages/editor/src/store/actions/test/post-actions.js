/**
 * External dependencies
 */
import { BEGIN, COMMIT, REVERT } from 'redux-optimist';

/**
 * Internal dependencies
 */
import {
	resetPost,
	resetAutosave,
	__experimentalRequestPostUpdateStart as requestPostUpdateStart,
	__experimentalRequestPostUpdateSuccess as requestPostUpdateSuccess,
	__experimentalRequestPostUpdateFailure as requestPostUpdateFailure,
	updatePost,
	editPost,
	__experimentalOptimisticUpdatePost as optimisticUpdatePost,
	lockPostSaving,
	unlockPostSaving,
} from '../post-actions';
import { POST_UPDATE_TRANSACTION_ID } from '../../constants';

describe( 'actions', () => {
	describe( 'resetPost', () => {
		it( 'should return the RESET_POST action', () => {
			const post = {};
			const result = resetPost( post );
			expect( result ).toEqual( {
				type: 'RESET_POST',
				post,
			} );
		} );
	} );
	describe( 'resetAutosave', () => {
		it( 'should return the RESET_AUTOSAVE action', () => {
			const post = {};
			const result = resetAutosave( post );
			expect( result ).toEqual( {
				type: 'RESET_AUTOSAVE',
				post,
			} );
		} );
	} );
	describe( 'requestPostUpdateStart', () => {
		it( 'should return the REQUEST_POST_UPDATE_START action', () => {
			const result = requestPostUpdateStart();
			expect( result ).toEqual( {
				type: 'REQUEST_POST_UPDATE_START',
				optimist: { type: BEGIN, id: POST_UPDATE_TRANSACTION_ID },
				options: {},
			} );
		} );
	} );
	describe( 'requestPostUpdateSuccess', () => {
		it( 'should return the REQUEST_POST_UPDATE_SUCCESS action', () => {
			const testActionData = {
				previousPost: {},
				post: {},
				options: {},
				postType: 'post',
			};
			const result = requestPostUpdateSuccess( {
				...testActionData,
				isRevision: false,
			} );
			expect( result ).toEqual( {
				...testActionData,
				type: 'REQUEST_POST_UPDATE_SUCCESS',
				optimist: { type: COMMIT, id: POST_UPDATE_TRANSACTION_ID },
			} );
		} );
	} );
	describe( 'requestPostUpdateFailure', () => {
		it( 'should return the REQUEST_POST_UPDATE_FAILURE action', () => {
			const testActionData = {
				post: {},
				options: {},
				edits: {},
				error: {},
			};
			const result = requestPostUpdateFailure( testActionData );
			expect( result ).toEqual( {
				...testActionData,
				type: 'REQUEST_POST_UPDATE_FAILURE',
				optimist: { type: REVERT, id: POST_UPDATE_TRANSACTION_ID },
			} );
		} );
	} );
	describe( 'updatePost', () => {
		it( 'should return the UPDATE_POST action', () => {
			const edits = {};
			const result = updatePost( edits );
			expect( result ).toEqual( {
				type: 'UPDATE_POST',
				edits,
			} );
		} );
	} );
	describe( 'editPost', () => {
		it( 'should return the EDIT_POST action', () => {
			const edits = {};
			const result = editPost( edits );
			expect( result ).toEqual( {
				type: 'EDIT_POST',
				edits,
			} );
		} );
	} );
	describe( 'optimisticUpdatePost', () => {
		it( 'should return the UPDATE_POST action with optimist property', () => {
			const edits = {};
			const result = optimisticUpdatePost( edits );
			expect( result ).toEqual( {
				type: 'UPDATE_POST',
				edits,
				optimist: { id: POST_UPDATE_TRANSACTION_ID },
			} );
		} );
	} );
	describe( 'lockPostSaving', () => {
		it( 'should return the LOCK_POST_SAVING action', () => {
			const result = lockPostSaving( 'test' );
			expect( result ).toEqual( {
				type: 'LOCK_POST_SAVING',
				lockName: 'test',
			} );
		} );
	} );
	describe( 'unlockPostSaving', () => {
		it( 'should return the UNLOCK_POST_SAVING action', () => {
			const result = unlockPostSaving( 'test' );
			expect( result ).toEqual( {
				type: 'UNLOCK_POST_SAVING',
				lockName: 'test',
			} );
		} );
	} );
} );
