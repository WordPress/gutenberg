/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import reducer, { getNotices } from '../notices';

describe( 'notices', () => {
	describe( 'reducer', () => {
		it( 'should create a notice', () => {
			const originalState = [
				{
					id: 'b',
					content: 'Error saving',
					status: 'error',
				},
			];
			const state = reducer( deepFreeze( originalState ), {
				type: 'CREATE_NOTICE',
				notice: {
					id: 'a',
					content: 'Post saved',
					status: 'success',
				},
			} );
			expect( state ).toEqual( [
				originalState[ 0 ],
				{
					id: 'a',
					content: 'Post saved',
					status: 'success',
				},
			] );
		} );

		it( 'should remove a notice', () => {
			const originalState = [
				{
					id: 'a',
					content: 'Post saved',
					status: 'success',
				},
				{
					id: 'b',
					content: 'Error saving',
					status: 'error',
				},
			];
			const state = reducer( deepFreeze( originalState ), {
				type: 'REMOVE_NOTICE',
				noticeId: 'a',
			} );
			expect( state ).toEqual( [
				originalState[ 1 ],
			] );
		} );
	} );

	describe( 'getNotices', () => {
		it( 'should return the notices array', () => {
			const state = {
				notices: [
					{ id: 'b', content: 'Post saved' },
					{ id: 'a', content: 'Error saving' },
				],
			};

			expect( getNotices( state ) ).toEqual( state.notices );
		} );
	} );
} );
