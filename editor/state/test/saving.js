/**
 * Internal dependencies
 */
import reducer, {
	isSavingPost,
	didPostSaveRequestSucceed,
	didPostSaveRequestFail,
} from '../saving';

describe( 'saving', () => {
	describe( 'reducer', () => {
		it( 'should update when a request is started', () => {
			const state = reducer( null, {
				type: 'REQUEST_POST_UPDATE',
			} );
			expect( state ).toEqual( {
				requesting: true,
				successful: false,
				error: null,
			} );
		} );

		it( 'should update when a request succeeds', () => {
			const state = reducer( null, {
				type: 'REQUEST_POST_UPDATE_SUCCESS',
			} );
			expect( state ).toEqual( {
				requesting: false,
				successful: true,
				error: null,
			} );
		} );

		it( 'should update when a request fails', () => {
			const state = reducer( null, {
				type: 'REQUEST_POST_UPDATE_FAILURE',
				error: {
					code: 'pretend_error',
					message: 'update failed',
				},
			} );
			expect( state ).toEqual( {
				requesting: false,
				successful: false,
				error: {
					code: 'pretend_error',
					message: 'update failed',
				},
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'isSavingPost', () => {
			it( 'should return true if the post is currently being saved', () => {
				const state = {
					saving: {
						requesting: true,
					},
				};

				expect( isSavingPost( state ) ).toBe( true );
			} );

			it( 'should return false if the post is currently being saved', () => {
				const state = {
					saving: {
						requesting: false,
					},
				};

				expect( isSavingPost( state ) ).toBe( false );
			} );
		} );

		describe( 'didPostSaveRequestSucceed', () => {
			it( 'should return true if the post save request is successful', () => {
				const state = {
					saving: {
						successful: true,
					},
				};

				expect( didPostSaveRequestSucceed( state ) ).toBe( true );
			} );

			it( 'should return true if the post save request has failed', () => {
				const state = {
					saving: {
						successful: false,
					},
				};

				expect( didPostSaveRequestSucceed( state ) ).toBe( false );
			} );
		} );

		describe( 'didPostSaveRequestFail', () => {
			it( 'should return true if the post save request has failed', () => {
				const state = {
					saving: {
						error: 'error',
					},
				};

				expect( didPostSaveRequestFail( state ) ).toBe( true );
			} );

			it( 'should return true if the post save request is successful', () => {
				const state = {
					saving: {
						error: false,
					},
				};

				expect( didPostSaveRequestFail( state ) ).toBe( false );
			} );
		} );
	} );
} );
