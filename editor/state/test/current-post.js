/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';

/**
 * Internal dependencies
 */
import reducer, {
	isCurrentPostNew,
	getCurrentPost,
	getCurrentPostId,
	getCurrentPostLastRevisionId,
	getCurrentPostRevisionsCount,
	getCurrentPostType,
	isCurrentPostPublished,
	getCurrentPostPreviewLink,
} from '../current-post';

describe( 'currentPost', () => {
	describe( 'reducer', () => {
		it( 'should reset a post object', () => {
			const original = deepFreeze( { title: 'unmodified' } );

			const state = reducer( original, {
				type: 'RESET_POST',
				post: {
					title: 'new post',
				},
			} );

			expect( state ).toEqual( {
				title: 'new post',
			} );
		} );

		it( 'should update the post object with UPDATE_POST', () => {
			const original = deepFreeze( { title: 'unmodified', status: 'publish' } );

			const state = reducer( original, {
				type: 'UPDATE_POST',
				edits: {
					title: 'updated post object from server',
				},
			} );

			expect( state ).toEqual( {
				title: 'updated post object from server',
				status: 'publish',
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'isCurrentPostNew', () => {
			it( 'should return true when the post is new', () => {
				const state = {
					currentPost: {
						status: 'auto-draft',
					},
					editor: {
						present: {
							edits: {},
						},
					},
				};

				expect( isCurrentPostNew( state ) ).toBe( true );
			} );

			it( 'should return false when the post is not new', () => {
				const state = {
					currentPost: {
						status: 'draft',
					},
					editor: {
						present: {
							edits: {},
						},
					},
				};

				expect( isCurrentPostNew( state ) ).toBe( false );
			} );
		} );

		describe( 'getCurrentPost', () => {
			it( 'should return the current post', () => {
				const state = {
					currentPost: { id: 1 },
				};

				expect( getCurrentPost( state ) ).toEqual( { id: 1 } );
			} );
		} );

		describe( 'getCurrentPostId', () => {
			it( 'should return null if the post has not yet been saved', () => {
				const state = {
					currentPost: {},
				};

				expect( getCurrentPostId( state ) ).toBeNull();
			} );

			it( 'should return the current post ID', () => {
				const state = {
					currentPost: { id: 1 },
				};

				expect( getCurrentPostId( state ) ).toBe( 1 );
			} );
		} );

		describe( 'getCurrentPostLastRevisionId', () => {
			it( 'should return null if the post has not yet been saved', () => {
				const state = {
					currentPost: {},
				};

				expect( getCurrentPostLastRevisionId( state ) ).toBeNull();
			} );

			it( 'should return the last revision ID', () => {
				const state = {
					currentPost: {
						revisions: {
							last_id: 123,
						},
					},
				};

				expect( getCurrentPostLastRevisionId( state ) ).toBe( 123 );
			} );
		} );

		describe( 'getCurrentPostRevisionsCount', () => {
			it( 'should return 0 if the post has no revisions', () => {
				const state = {
					currentPost: {},
				};

				expect( getCurrentPostRevisionsCount( state ) ).toBe( 0 );
			} );

			it( 'should return the number of revisions', () => {
				const state = {
					currentPost: {
						revisions: {
							count: 5,
						},
					},
				};

				expect( getCurrentPostRevisionsCount( state ) ).toBe( 5 );
			} );
		} );

		describe( 'getCurrentPostType', () => {
			it( 'should return the post type', () => {
				const state = {
					currentPost: {
						type: 'post',
					},
				};

				expect( getCurrentPostType( state ) ).toBe( 'post' );
			} );
		} );

		describe( 'isCurrentPostPublished', () => {
			it( 'should return true for public posts', () => {
				const state = {
					currentPost: {
						status: 'publish',
					},
				};

				expect( isCurrentPostPublished( state ) ).toBe( true );
			} );

			it( 'should return true for private posts', () => {
				const state = {
					currentPost: {
						status: 'private',
					},
				};

				expect( isCurrentPostPublished( state ) ).toBe( true );
			} );

			it( 'should return false for draft posts', () => {
				const state = {
					currentPost: {
						status: 'draft',
					},
				};

				expect( isCurrentPostPublished( state ) ).toBe( false );
			} );

			it( 'should return true for old scheduled posts', () => {
				const state = {
					currentPost: {
						status: 'future',
						date: '2016-05-30T17:21:39',
					},
				};

				expect( isCurrentPostPublished( state ) ).toBe( true );
			} );
		} );

		describe( 'getCurrentPostPreviewLink', () => {
			it( 'should return null if the post has not link yet', () => {
				const state = {
					currentPost: {},
				};

				expect( getCurrentPostPreviewLink( state ) ).toBeNull();
			} );

			it( 'should return the correct url adding a preview parameter to the query string', () => {
				const state = {
					currentPost: {
						link: 'https://andalouses.com/beach',
					},
				};

				expect( getCurrentPostPreviewLink( state ) ).toBe( 'https://andalouses.com/beach?preview=true' );
			} );
		} );
	} );
} );
