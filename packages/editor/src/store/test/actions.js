/**
 * External dependencies
 */
import { BEGIN, COMMIT, REVERT } from 'redux-optimist';

/**
 * Internal dependencies
 */
import * as actions from '../actions';
import { select, dispatch, apiFetch, resolveSelect } from '../controls';
import {
	STORE_KEY,
	SAVE_POST_NOTICE_ID,
	TRASH_POST_NOTICE_ID,
	POST_UPDATE_TRANSACTION_ID,
} from '../constants';

jest.mock( '../controls' );

select.mockImplementation( ( ...args ) => {
	const { select: actualSelect } = jest.requireActual( '../controls' );
	return actualSelect( ...args );
} );

dispatch.mockImplementation( ( ...args ) => {
	const { dispatch: actualDispatch } = jest.requireActual( '../controls' );
	return actualDispatch( ...args );
} );

resolveSelect.mockImplementation( ( ...args ) => {
	const { resolveSelect: selectResolver } = jest
		.requireActual( '../controls' );
	return selectResolver( ...args );
} );

const apiFetchThrowError = ( error ) => {
	apiFetch.mockClear();
	apiFetch.mockImplementation( () => {
		throw error;
	} );
};

const apiFetchDoActual = () => {
	apiFetch.mockClear();
	apiFetch.mockImplementation( ( ...args ) => {
		const { apiFetch: fetch } = jest.requireActual( '../controls' );
		return fetch( ...args );
	} );
};

const postType = {
	rest_base: 'posts',
	labels: {
		item_updated: 'Updated Post',
		item_published: 'Post published',
	},
};
const postId = 44;
const postTypeSlug = 'post';
const userId = 1;

describe( 'Post generator actions', () => {
	describe( 'savePost()', () => {
		let fulfillment,
			edits,
			currentPost,
			currentPostStatus,
			currentUser,
			editPostToSendOptimistic,
			autoSavePost,
			autoSavePostToSend,
			savedPost,
			savedPostStatus,
			isAutosave,
			isEditedPostNew,
			savedPostMessage;
		beforeEach( () => {
			edits = ( defaultStatus = null ) => {
				const postObject = {
					title: 'foo',
					content: 'bar',
					excerpt: 'cheese',
					foo: 'bar',
				};
				if ( defaultStatus !== null ) {
					postObject.status = defaultStatus;
				}
				return postObject;
			};
			currentPost = () => ( {
				id: postId,
				type: postTypeSlug,
				title: 'bar',
				content: 'bar',
				excerpt: 'crackers',
				status: currentPostStatus,
			} );
			currentUser = { id: userId };
			editPostToSendOptimistic = () => {
				const postObject = {
					...edits(),
					content: editedPostContent,
					id: currentPost().id,
				};
				if ( ! postObject.status && isEditedPostNew ) {
					postObject.status = 'draft';
				}
				if ( isAutosave ) {
					delete postObject.foo;
				}
				return postObject;
			};
			autoSavePost = { status: 'autosave', bar: 'foo' };
			autoSavePostToSend = () => editPostToSendOptimistic();
			savedPost = () => (
				{
					...currentPost(),
					...editPostToSendOptimistic(),
					content: editedPostContent,
					status: savedPostStatus,
				}
			);
		} );
		const editedPostContent = 'to infinity and beyond';
		const reset = ( isAutosaving ) => fulfillment = actions.savePost(
			{ isAutosave: isAutosaving }
		);
		const rewind = ( isAutosaving, isNewPost ) => {
			reset( isAutosaving );
			fulfillment.next();
			fulfillment.next( true );
			fulfillment.next( edits() );
			fulfillment.next( isNewPost );
			fulfillment.next( currentPost() );
			fulfillment.next( editedPostContent );
			fulfillment.next( postTypeSlug );
			fulfillment.next( postType );
			fulfillment.next();
			if ( isAutosaving ) {
				fulfillment.next( currentUser );
				fulfillment.next();
			} else {
				fulfillment.next();
				fulfillment.next();
			}
		};
		const initialTestConditions = [
			[
				'yields action for selecting if edited post is saveable',
				() => true,
				() => {
					reset( isAutosave );
					const { value } = fulfillment.next();
					expect( value ).toEqual(
						select( STORE_KEY, 'isEditedPostSaveable' )
					);
				},
			],
			[
				'yields action for selecting the post edits done',
				() => true,
				() => {
					const { value } = fulfillment.next( true );
					expect( value ).toEqual(
						select( STORE_KEY, 'getPostEdits' )
					);
				},
			],
			[
				'yields action for selecting whether the edited post is new',
				() => true,
				() => {
					const { value } = fulfillment.next( edits() );
					expect( value ).toEqual(
						select( STORE_KEY, 'isEditedPostNew' )
					);
				},
			],
			[
				'yields action for selecting the current post',
				() => true,
				() => {
					const { value } = fulfillment.next( isEditedPostNew );
					expect( value ).toEqual(
						select( STORE_KEY, 'getCurrentPost' )
					);
				},
			],
			[
				'yields action for selecting the edited post content',
				() => true,
				() => {
					const { value } = fulfillment.next( currentPost() );
					expect( value ).toEqual(
						select( STORE_KEY, 'getEditedPostContent' )
					);
				},
			],
			[
				'yields action for selecting current post type slug',
				() => true,
				() => {
					const { value } = fulfillment.next( editedPostContent );
					expect( value ).toEqual(
						select( STORE_KEY, 'getCurrentPostType' )
					);
				},
			],
			[
				'yields action for selecting the post type object',
				() => true,
				() => {
					const { value } = fulfillment.next( postTypeSlug );
					expect( value ).toEqual(
						resolveSelect( 'core', 'getPostType', postTypeSlug )
					);
				},
			],
			[
				'yields action for dispatching request post update start',
				() => true,
				() => {
					const { value } = fulfillment.next( postType );
					expect( value ).toEqual(
						dispatch(
							STORE_KEY,
							'__experimentalRequestPostUpdateStart',
							{ isAutosave }
						)
					);
				},
			],
			[
				'yields action for dispatching optimistic update of post',
				() => true,
				() => {
					const { value } = fulfillment.next();
					expect( value ).toEqual(
						dispatch(
							STORE_KEY,
							'__experimentalOptimisticUpdatePost',
							editPostToSendOptimistic()
						)
					);
				},
			],
			[
				'yields action for dispatching the removal of save post notice',
				( isAutosaving ) => ! isAutosaving,
				() => {
					const { value } = fulfillment.next();
					expect( value ).toEqual(
						dispatch(
							'core/notices',
							'removeNotice',
							SAVE_POST_NOTICE_ID,
						)
					);
				},
			],
			[
				'yields action for dispatching the removal of autosave notice',
				( isAutosaving ) => ! isAutosaving,
				() => {
					const { value } = fulfillment.next();
					expect( value ).toEqual(
						dispatch(
							'core/notices',
							'removeNotice',
							'autosave-exists'
						)
					);
				},
			],
			[
				'yields action for selecting the currentUser',
				( isAutosaving ) => isAutosaving,
				() => {
					const { value } = fulfillment.next();
					expect( value ).toEqual(
						resolveSelect( 'core', 'getCurrentUser' )
					);
				},
			],
			[
				'yields action for selecting the autosavePost',
				( isAutosaving ) => isAutosaving,
				() => {
					const { value } = fulfillment.next( currentUser );
					expect( value ).toEqual(
						resolveSelect(
							'core',
							'getAutosave',
							postTypeSlug,
							postId,
							userId
						)
					);
				},
			],
		];
		const fetchErrorConditions = [
			[
				'yields action for dispatching post update failure',
				() => {
					const error = { foo: 'bar', code: 'fail' };
					apiFetchThrowError( error );
					const editsObject = edits();
					const { value } = isAutosave ?
						fulfillment.next( autoSavePost ) :
						fulfillment.next();
					if ( isAutosave ) {
						delete editsObject.foo;
					}
					expect( value ).toEqual(
						dispatch(
							STORE_KEY,
							'__experimentalRequestPostUpdateFailure',
							{
								post: currentPost(),
								edits: isEditedPostNew ?
									{ ...editsObject, status: 'draft' } :
									editsObject,
								error,
								options: { isAutosave },
							}
						)
					);
				},
			],
			[
				'yields action for dispatching an appropriate error notice',
				() => {
					const { value } = fulfillment.next( [ 'foo', 'bar' ] );
					expect( value ).toEqual(
						dispatch(
							'core/notices',
							'createErrorNotice',
							...[ 'Updating failed', { id: 'SAVE_POST_NOTICE_ID' } ]
						)
					);
				},
			],
		];
		const fetchSuccessConditions = [
			[
				'yields action for updating the post via the api',
				() => {
					apiFetchDoActual();
					rewind( isAutosave, isEditedPostNew );
					const { value } = isAutosave ?
						fulfillment.next( autoSavePost ) :
						fulfillment.next();
					const data = isAutosave ?
						autoSavePostToSend() :
						editPostToSendOptimistic();
					const path = isAutosave ? '/autosaves' : '';
					expect( value ).toEqual(
						apiFetch(
							{
								path: `/wp/v2/${ postType.rest_base }/${ editPostToSendOptimistic().id }${ path }`,
								method: isAutosave ? 'POST' : 'PUT',
								data,
							}
						)
					);
				},
			],
			[
				'yields action for dispatch the appropriate reset action',
				() => {
					const { value } = fulfillment.next( savedPost() );

					if ( isAutosave ) {
						expect( value ).toEqual( dispatch( 'core', 'receiveAutosaves', postId, savedPost() ) );
					} else {
						expect( value ).toEqual( dispatch( STORE_KEY, 'resetPost', savedPost() ) );
					}
				},
			],
			[
				'yields action for dispatching the post update success',
				() => {
					const { value } = fulfillment.next();
					expect( value ).toEqual(
						dispatch(
							STORE_KEY,
							'__experimentalRequestPostUpdateSuccess',
							{
								previousPost: currentPost(),
								post: savedPost(),
								options: { isAutosave },
								postType,
								isRevision: false,
							}
						)
					);
				},
			],
			[
				'yields dispatch action for success notification',
				() => {
					const { value } = fulfillment.next( [ 'foo', 'bar' ] );
					const expected = isAutosave ?
						undefined :
						dispatch(
							'core/notices',
							'createSuccessNotice',
							...[
								savedPostMessage,
								{ actions: [], id: 'SAVE_POST_NOTICE_ID' },
							]
						);
					expect( value ).toEqual( expected );
				},
			],
		];

		const conditionalRunTestRoutine = ( isAutosaving ) => ( [
			testDescription,
			shouldRun,
			testRoutine,
		] ) => {
			if ( shouldRun( isAutosaving ) ) {
				it( testDescription, () => {
					testRoutine();
				} );
			}
		};

		const testRunRoutine = ( [ testDescription, testRoutine ] ) => {
			it( testDescription, () => {
				testRoutine();
			} );
		};

		describe( 'yields with expected responses when edited post is not ' +
			'saveable', () => {
			it( 'yields action for selecting if edited post is saveable', () => {
				reset( false );
				const { value } = fulfillment.next();
				expect( value ).toEqual(
					select( STORE_KEY, 'isEditedPostSaveable' )
				);
			} );
			it( 'if edited post is not saveable then bails', () => {
				const { value, done } = fulfillment.next( false );
				expect( done ).toBe( true );
				expect( value ).toBeUndefined();
			} );
		} );
		describe( 'yields with expected responses for when not autosaving ' +
			'and edited post is new', () => {
			beforeEach( () => {
				isAutosave = false;
				isEditedPostNew = true;
				savedPostStatus = 'publish';
				currentPostStatus = 'draft';
				savedPostMessage = 'Post published';
			} );
			initialTestConditions.forEach( conditionalRunTestRoutine( false ) );
			describe( 'fetch action throwing an error', () => {
				fetchErrorConditions.forEach( testRunRoutine );
			} );
			describe( 'fetch action not throwing an error', () => {
				fetchSuccessConditions.forEach( testRunRoutine );
			} );
		} );

		describe( 'yields with expected responses for when not autosaving ' +
			'and edited post is not new', () => {
			beforeEach( () => {
				isAutosave = false;
				isEditedPostNew = false;
				currentPostStatus = 'publish';
				savedPostStatus = 'publish';
				savedPostMessage = 'Updated Post';
			} );
			initialTestConditions.forEach( conditionalRunTestRoutine( false ) );
			describe( 'fetch action throwing error', () => {
				fetchErrorConditions.forEach( testRunRoutine );
			} );
			describe( 'fetch action not throwing error', () => {
				fetchSuccessConditions.forEach( testRunRoutine );
			} );
		} );
		describe( 'yields with expected responses for when autosaving is true ' +
			'and edited post is not new', () => {
			beforeEach( () => {
				isAutosave = true;
				isEditedPostNew = false;
				currentPostStatus = 'autosave';
				savedPostStatus = 'publish';
				savedPostMessage = 'Post published';
			} );
			initialTestConditions.forEach( conditionalRunTestRoutine( true ) );
			describe( 'fetch action throwing error', () => {
				fetchErrorConditions.forEach( testRunRoutine );
			} );
			describe( 'fetch action not throwing error', () => {
				fetchSuccessConditions.forEach( testRunRoutine );
			} );
		} );
	} );
	describe( 'autosave()', () => {
		it( 'dispatches savePost with the correct arguments', () => {
			const fulfillment = actions.autosave();
			const { value } = fulfillment.next();
			expect( value.actionName ).toBe( 'savePost' );
			expect( value.args ).toEqual( [ { isAutosave: true } ] );
		} );
	} );
	describe( 'trashPost()', () => {
		let fulfillment;
		const currentPost = { id: 10, content: 'foo', status: 'publish' };
		const reset = () => fulfillment = actions.trashPost();
		const rewind = () => {
			reset();
			fulfillment.next();
			fulfillment.next( postTypeSlug );
			fulfillment.next( postType );
			fulfillment.next();
		};
		it( 'yields expected action for selecting the current post type slug',
			() => {
				reset();
				const { value } = fulfillment.next();
				expect( value ).toEqual( select(
					STORE_KEY,
					'getCurrentPostType',
				) );
			}
		);
		it( 'yields expected action for selecting the post type object', () => {
			const { value } = fulfillment.next( postTypeSlug );
			expect( value ).toEqual( resolveSelect(
				'core',
				'getPostType',
				postTypeSlug
			) );
		} );
		it( 'yields expected action for dispatching removing the trash notice ' +
			'for the post', () => {
			const { value } = fulfillment.next( postType );
			expect( value ).toEqual( dispatch(
				'core/notices',
				'removeNotice',
				TRASH_POST_NOTICE_ID
			) );
		} );
		it( 'yields expected action for selecting the currentPost', () => {
			const { value } = fulfillment.next();
			expect( value ).toEqual( select(
				STORE_KEY,
				'getCurrentPost'
			) );
		} );
		describe( 'expected yields when fetch throws an error', () => {
			it( 'yields expected action for dispatching an error notice', () => {
				const error = { foo: 'bar', code: 'fail' };
				apiFetchThrowError( error );
				const { value } = fulfillment.next( currentPost );
				expect( value ).toEqual( dispatch(
					'core/notices',
					'createErrorNotice',
					'Trashing failed',
					{ id: TRASH_POST_NOTICE_ID },
				) );
			} );
		} );
		describe( 'expected yields when fetch does not throw an error', () => {
			it( 'yields expected action object for the api fetch', () => {
				apiFetchDoActual();
				rewind();
				const { value } = fulfillment.next( currentPost );
				expect( value ).toEqual( apiFetch(
					{
						path: `/wp/v2/${ postType.rest_base }/${ currentPost.id }`,
						method: 'DELETE',
					}
				) );
			} );
			it( 'yields expected dispatch action for resetting the post', () => {
				const { value } = fulfillment.next();
				expect( value ).toEqual( dispatch(
					STORE_KEY,
					'resetPost',
					{ ...currentPost, status: 'trash' }
				) );
			} );
		} );
	} );
	describe( 'refreshPost()', () => {
		let fulfillment;
		const currentPost = { id: 10, content: 'foo' };
		const reset = () => fulfillment = actions.refreshPost();
		it( 'yields expected action for selecting the currentPost', () => {
			reset();
			const { value } = fulfillment.next();
			expect( value ).toEqual( select(
				STORE_KEY,
				'getCurrentPost',
			) );
		} );
		it( 'yields expected action for selecting the current post type', () => {
			const { value } = fulfillment.next( currentPost );
			expect( value ).toEqual( select(
				STORE_KEY,
				'getCurrentPostType'
			) );
		} );
		it( 'yields expected action for selecting the post type object', () => {
			const { value } = fulfillment.next( postTypeSlug );
			expect( value ).toEqual( resolveSelect(
				'core',
				'getPostType',
				postTypeSlug
			) );
		} );
		it( 'yields expected action for the api fetch call', () => {
			const { value } = fulfillment.next( postType );
			apiFetchDoActual();
			// since the timestamp is a computed value we can't do a direct comparison.
			// so we'll just see if the path has most of the value.
			expect( value.request.path ).toEqual( expect.stringContaining(
				`/wp/v2/${ postType.rest_base }/${ currentPost.id }?context=edit&_timestamp=`
			) );
		} );
		it( 'yields expected action for dispatching the reset of the post', () => {
			const { value } = fulfillment.next( currentPost );
			expect( value ).toEqual( dispatch(
				STORE_KEY,
				'resetPost',
				currentPost
			) );
		} );
	} );
} );

describe( 'Editor actions', () => {
	describe( 'setupEditor()', () => {
		let fulfillment;
		const reset = ( post, edits, template ) => fulfillment = actions
			.setupEditor(
				post,
				edits,
				template,
			);
		it( 'should yield the SETUP_EDITOR action', () => {
			reset( { content: { raw: '' }, status: 'publish' } );
			const { value } = fulfillment.next();
			expect( value ).toEqual( {
				type: 'SETUP_EDITOR',
				post: { content: { raw: '' }, status: 'publish' },
			} );
		} );
		it( 'should yield action object for resetEditorBlocks', () => {
			const { value } = fulfillment.next();
			expect( value ).toEqual( actions.resetEditorBlocks( [] ) );
		} );
		it( 'should yield action object for setupEditorState', () => {
			const { value } = fulfillment.next();
			expect( value ).toEqual(
				actions.setupEditorState(
					{ content: { raw: '' }, status: 'publish' }
				)
			);
		} );
	} );

	describe( 'resetPost', () => {
		it( 'should return the RESET_POST action', () => {
			const post = {};
			const result = actions.resetPost( post );
			expect( result ).toEqual( {
				type: 'RESET_POST',
				post,
			} );
		} );
	} );

	describe( 'requestPostUpdateStart', () => {
		it( 'should return the REQUEST_POST_UPDATE_START action', () => {
			const result = actions.__experimentalRequestPostUpdateStart();
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
			const result = actions.__experimentalRequestPostUpdateSuccess( {
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
			const result = actions.__experimentalRequestPostUpdateFailure(
				testActionData
			);
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
			const result = actions.updatePost( edits );
			expect( result ).toEqual( {
				type: 'UPDATE_POST',
				edits,
			} );
		} );
	} );

	describe( 'editPost', () => {
		it( 'should return EDIT_POST action', () => {
			const edits = { format: 'sample' };
			expect( actions.editPost( edits ) ).toEqual( {
				type: 'EDIT_POST',
				edits,
			} );
		} );
	} );

	describe( 'optimisticUpdatePost', () => {
		it( 'should return the UPDATE_POST action with optimist property', () => {
			const edits = {};
			const result = actions.__experimentalOptimisticUpdatePost( edits );
			expect( result ).toEqual( {
				type: 'UPDATE_POST',
				edits,
				optimist: { id: POST_UPDATE_TRANSACTION_ID },
			} );
		} );
	} );

	describe( 'redo', () => {
		it( 'should return REDO action', () => {
			expect( actions.redo() ).toEqual( {
				type: 'REDO',
			} );
		} );
	} );

	describe( 'undo', () => {
		it( 'should return UNDO action', () => {
			expect( actions.undo() ).toEqual( {
				type: 'UNDO',
			} );
		} );
	} );

	describe( 'fetchReusableBlocks', () => {
		it( 'should return the FETCH_REUSABLE_BLOCKS action', () => {
			expect( actions.__experimentalFetchReusableBlocks() ).toEqual( {
				type: 'FETCH_REUSABLE_BLOCKS',
			} );
		} );

		it( 'should take an optional id argument', () => {
			expect( actions.__experimentalFetchReusableBlocks( 123 ) ).toEqual( {
				type: 'FETCH_REUSABLE_BLOCKS',
				id: 123,
			} );
		} );
	} );

	describe( 'saveReusableBlock', () => {
		it( 'should return the SAVE_REUSABLE_BLOCK action', () => {
			expect( actions.__experimentalSaveReusableBlock( 123 ) ).toEqual( {
				type: 'SAVE_REUSABLE_BLOCK',
				id: 123,
			} );
		} );
	} );

	describe( 'deleteReusableBlock', () => {
		it( 'should return the DELETE_REUSABLE_BLOCK action', () => {
			expect( actions.__experimentalDeleteReusableBlock( 123 ) ).toEqual( {
				type: 'DELETE_REUSABLE_BLOCK',
				id: 123,
			} );
		} );
	} );

	describe( 'convertBlockToStatic', () => {
		it( 'should return the CONVERT_BLOCK_TO_STATIC action', () => {
			const clientId = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
			expect( actions.__experimentalConvertBlockToStatic( clientId ) ).toEqual( {
				type: 'CONVERT_BLOCK_TO_STATIC',
				clientId,
			} );
		} );
	} );

	describe( 'convertBlockToReusable', () => {
		it( 'should return the CONVERT_BLOCK_TO_REUSABLE action', () => {
			const clientId = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
			expect( actions.__experimentalConvertBlockToReusable( clientId ) ).toEqual( {
				type: 'CONVERT_BLOCK_TO_REUSABLE',
				clientIds: [ clientId ],
			} );
		} );
	} );

	describe( 'lockPostSaving', () => {
		it( 'should return the LOCK_POST_SAVING action', () => {
			const result = actions.lockPostSaving( 'test' );
			expect( result ).toEqual( {
				type: 'LOCK_POST_SAVING',
				lockName: 'test',
			} );
		} );
	} );

	describe( 'unlockPostSaving', () => {
		it( 'should return the UNLOCK_POST_SAVING action', () => {
			const result = actions.unlockPostSaving( 'test' );
			expect( result ).toEqual( {
				type: 'UNLOCK_POST_SAVING',
				lockName: 'test',
			} );
		} );
	} );
} );
