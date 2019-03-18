/**
 * External dependencies
 */
import { BEGIN, COMMIT, REVERT } from 'redux-optimist';
import uuid from 'uuid/v4';

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
	REUSABLE_BLOCK_NOTICE_ID,
} from '../constants';

/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	unregisterBlockType,
	createBlock,
	serialize,
} from '@wordpress/blocks';

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
const postTypeSlug = 'post';

describe( 'Post generator actions', () => {
	describe( 'savePost()', () => {
		let fulfillment,
			edits,
			currentPost,
			currentPostStatus,
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
				id: 44,
				title: 'bar',
				content: 'bar',
				excerpt: 'crackers',
				status: currentPostStatus,
			} );
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
			autoSavePostToSend = () => (
				{
					...editPostToSendOptimistic(),
					bar: 'foo',
					status: 'autosave',
				}
			);
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
				'yield action for selecting the autoSavePost',
				( isAutosaving ) => isAutosaving,
				() => {
					const { value } = fulfillment.next();
					expect( value ).toEqual(
						select(
							STORE_KEY,
							'getAutosave'
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
					expect( value ).toEqual(
						dispatch(
							STORE_KEY,
							isAutosave ? 'resetAutosave' : 'resetPost',
							savedPost()
						)
					);
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
		it( 'should yield dispatch action for resetEditorBlocks', () => {
			const { value } = fulfillment.next();
			expect( value.type ).toBe( 'DISPATCH' );
			expect( value.storeKey ).toBe( STORE_KEY );
			expect( value.actionName ).toBe( 'resetEditorBlocks' );
			expect( value.args ).toEqual( [ [] ] );
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

	describe( 'resetAutosave', () => {
		it( 'should return the RESET_AUTOSAVE action', () => {
			const post = {};
			const result = actions.resetAutosave( post );
			expect( result ).toEqual( {
				type: 'RESET_AUTOSAVE',
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

describe( 'Reusable block actions', () => {
	beforeAll( () => {
		registerBlockType( 'core/test-block', {
			title: 'Test block',
			category: 'common',
			save: () => null,
			attributes: {
				name: { type: 'string' },
			},
		} );

		registerBlockType( 'core/block', {
			title: 'Reusable Block',
			category: 'common',
			save: () => null,
			attributes: {
				ref: { type: 'string' },
			},
		} );

		registerBlockType( 'core/template', {
			title: 'Reusable Block',
			category: 'common',
			save: () => null,
			attributes: {
				ref: { type: 'string' },
			},
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/test-block' );
		unregisterBlockType( 'core/block' );
		unregisterBlockType( 'core/template' );
	} );
	const postTypeResponse = { slug: 'wp_block', rest_base: 'blocks' };
	describe( 'fetchReusableBlocks()', () => {
		let fulfillment;
		const reset = ( id ) => fulfillment = actions
			.__experimentalFetchReusableBlocks( id );
		const sampleBlock = {
			id: 123,
			status: 'publish',
			title: {
				raw: 'My cool block',
			},
			content: {
				raw: '<!-- wp:test-block {"name":"Big Bird"} /-->',
				protected: false,
			},
		};
		it( 'should yield the FETCH_REUSABLE_BLOCKS action', () => {
			reset();
			const { value } = fulfillment.next();
			expect( value ).toEqual( {
				type: 'FETCH_REUSABLE_BLOCKS',
			} );
		} );

		it( 'should take an optional id argument', () => {
			reset( 123 );
			const { value } = fulfillment.next();
			expect( value ).toEqual( {
				type: 'FETCH_REUSABLE_BLOCKS',
				id: 123,
			} );
		} );

		it( 'should yield action for fetch block post type', () => {
			const { value } = fulfillment.next();
			apiFetchDoActual();
			expect( value ).toEqual( apiFetch(
				{ path: '/wp/v2/types/wp_block' }
			) );
		} );

		it( 'should bail if post type retrieval fails', () => {
			const { value, done } = fulfillment.next( undefined );
			expect( value ).toBeUndefined();
			expect( done ).toBe( true );
		} );

		it( 'should yield FETCH_REUSABLE_BLOCKS_FAILURE action if fetch throws ' +
			'error', () => {
			reset( 123 );
			apiFetchDoActual();
			fulfillment.next();
			fulfillment.next();
			apiFetchThrowError( 'error' );
			const { value } = fulfillment.next( postTypeResponse );
			expect( value ).toEqual( {
				type: 'FETCH_REUSABLE_BLOCKS_FAILURE',
				id: 123,
				error: 'error',
			} );
		} );

		it( 'should yield specific block fetch action if id is provided', () => {
			reset( 123 );
			apiFetchDoActual();
			fulfillment.next();
			fulfillment.next();
			const { value } = fulfillment.next( postTypeResponse );
			expect( value ).toEqual(
				apiFetch(
					{ path: `/wp/v2/blocks/123` }
				)
			);
		} );

		it( 'should yield general blocks fetch action if id not provided', () => {
			reset();
			apiFetchDoActual();
			fulfillment.next();
			fulfillment.next();
			const { value } = fulfillment.next( postTypeResponse );
			expect( value ).toEqual(
				apiFetch(
					{ path: `/wp/v2/blocks?per_page=-1` }
				)
			);
		} );

		it( 'should yield dispatch action for receiving multiple reusable ' +
			'blocks', () => {
			const { value } = fulfillment.next( [
				{ ...sampleBlock, status: 'publish' },
			] );

			expect( value ).toEqual(
				dispatch(
					STORE_KEY,
					'__experimentalReceiveReusableBlocks',
					[
						{
							reusableBlock: {
								id: 123,
								title: 'My cool block',
							},
							parsedBlock: expect.objectContaining( {
								name: 'core/test-block',
								attributes: { name: 'Big Bird' },
							} ),
						},
					]
				)
			);
		} );

		it( 'should yield dispatch action for receiving single reusable ' +
			'block', () => {
			reset( 123 );
			apiFetchDoActual();
			fulfillment.next();
			fulfillment.next();
			fulfillment.next( postTypeResponse );
			const { value } = fulfillment.next(
				{ ...sampleBlock, status: 'publish' }
			);
			expect( value ).toEqual(
				dispatch(
					STORE_KEY,
					'__experimentalReceiveReusableBlocks',
					[
						{
							reusableBlock: {
								id: 123,
								title: 'My cool block',
							},
							parsedBlock: expect.objectContaining( {
								name: 'core/test-block',
								attributes: { name: 'Big Bird' },
							} ),
						},
					]
				)
			);
		} );

		it( 'should yield action for successful fetch', () => {
			const { value } = fulfillment.next();
			expect( value ).toEqual( {
				type: 'FETCH_REUSABLE_BLOCKS_SUCCESS',
				id: 123,
			} );
		} );

		it( 'should ignore reusable blocks with a trashed post status', () => {
			const testBlock = {
				id: 123,
				status: 'trash',
				title: {
					raw: 'My cool block',
				},
				content: {
					raw: '<!-- wp:test-block {"name":"Big Bird"} /-->',
					protected: false,
				},
			};
			reset( 123 );
			apiFetchDoActual();
			fulfillment.next();
			fulfillment.next();
			fulfillment.next( postTypeResponse );
			const { value } = fulfillment.next( testBlock );
			expect( value ).toEqual( {
				type: 'FETCH_REUSABLE_BLOCKS_SUCCESS',
				id: 123,
			} );
		} );
	} );

	describe( 'receiveReusableBlocks()', () => {
		let fulfillment;
		const reset = () => fulfillment = actions
			.__experimentalReceiveReusableBlocks(
				[ { reusableBlock: [], parsedBlock: {} } ]
			);
		it( 'yields action for RECEIVE_REUSABLE_BLOCKS', () => {
			reset();
			const { value } = fulfillment.next();
			expect( value ).toEqual( {
				type: 'RECEIVE_REUSABLE_BLOCKS',
				results: [ { reusableBlock: [], parsedBlock: {} } ],
			} );
		} );
		it( 'yields dispatch action for receiveBlocks on core/block-editor ' +
			'store', () => {
			const { value } = fulfillment.next();
			expect( value ).toEqual(
				dispatch(
					'core/block-editor',
					'receiveBlocks',
					[ {} ]
				)
			);
		} );
	} );

	describe( 'saveReusableBlock', () => {
		let fulfillment;
		const reset = () => fulfillment = actions
			.__experimentalSaveReusableBlock( 123 );
		const reusableBlock = {
			id: 123,
			title: 'My cool block',
			clientId: uuid(),
			isTemporary: false,
		};
		it( 'should yield the SAVE_REUSABLE_BLOCK action', () => {
			reset();
			const { value } = fulfillment.next();
			expect( value ).toEqual( {
				type: 'SAVE_REUSABLE_BLOCK',
				id: 123,
			} );
		} );
		it( 'should yield api action for block post type', () => {
			apiFetchDoActual();
			const { value } = fulfillment.next();
			expect( value ).toEqual(
				apiFetch(
					{ path: '/wp/v2/types/wp_block' }
				)
			);
		} );
		it( 'returns undefined if the post type is not available', () => {
			const { value, done } = fulfillment.next( undefined );
			expect( value ).toBeUndefined();
			expect( done ).toBe( true );
		} );
		it( 'yields select action for getting reusable block for the id', () => {
			reset();
			fulfillment.next();
			apiFetchDoActual();
			fulfillment.next();
			const { value } = fulfillment.next( postTypeResponse );
			expect( value ).toEqual(
				select(
					STORE_KEY,
					'__experimentalGetReusableBlock',
					123
				)
			);
		} );
		it( 'yields select action for getBlock from core/block-editor ' +
			'store', () => {
			const { value } = fulfillment.next( reusableBlock );
			expect( value ).toEqual(
				select(
					'core/block-editor',
					'getBlock',
					reusableBlock.clientId
				)
			);
		} );
		it( 'yields expected fetch action when reusable block is not ' +
			'temporary', () => {
			const parsedBlock = createBlock( 'core/test-block', { name: 'Big Bird' } );
			apiFetchDoActual();
			const { value } = fulfillment.next( parsedBlock );
			expect( value ).toEqual(
				apiFetch(
					{
						path: '/wp/v2/blocks/123',
						data: {
							id: 123,
							title: 'My cool block',
							content: serialize( parsedBlock ),
							status: 'publish',
						},
						method: 'PUT',
					}
				)
			);
		} );
		it( 'yields expected fetch action when reusable block is temporary', () => {
			const parsedBlock = createBlock( 'core/test-block', { name: 'Big Bird' } );
			apiFetchDoActual();
			reset();
			fulfillment.next();
			fulfillment.next();
			fulfillment.next( postTypeResponse );
			fulfillment.next( { ...reusableBlock, isTemporary: true } );
			const { value } = fulfillment.next( parsedBlock );
			expect( value ).toEqual(
				apiFetch( {
					path: '/wp/v2/blocks',
					data: {
						title: 'My cool block',
						content: serialize( parsedBlock ),
						status: 'publish',
					},
					method: 'POST',
				} )
			);
		} );
		it( 'yields expected success action for successful update fetch', () => {
			const { value } = fulfillment.next( { id: 456 } );
			expect( value ).toEqual( {
				type: 'SAVE_REUSABLE_BLOCK_SUCCESS',
				updatedId: 456,
				id: 123,
			} );
		} );
		it( 'yields expected dispatch action for success notice', () => {
			const { value } = fulfillment.next();
			expect( value ).toEqual(
				dispatch(
					'core/notices',
					'createSuccessNotice',
					'Block created.',
					{ id: REUSABLE_BLOCK_NOTICE_ID }
				)
			);
		} );
		it( 'yields expected dispatch action for saving reusable block on the ' +
			'core/block-editor store', () => {
			const { value } = fulfillment.next();
			expect( value ).toEqual(
				dispatch(
					'core/block-editor',
					'__unstableSaveReusableBlock',
					123,
					456,
				)
			);
			// it is done
			const { done } = fulfillment.next();
			expect( done ).toBe( true );
		} );

		it( 'yields expected failure action (and notice dispatch) when api ' +
			'fetch for updating block fails', () => {
			const parsedBlock = createBlock( 'core/test-block', { name: 'Big Bird' } );
			apiFetchDoActual();
			reset();
			fulfillment.next();
			fulfillment.next();
			fulfillment.next( postTypeResponse );
			apiFetchThrowError( { message: 'fail' } );
			fulfillment.next( reusableBlock );
			const { value } = fulfillment.next( parsedBlock );
			expect( value ).toEqual(
				{
					type: 'SAVE_REUSABLE_BLOCK_FAILURE',
					id: 123,
				}
			);
			const { value: noticeDispatchAction } = fulfillment.next();
			expect( noticeDispatchAction ).toEqual(
				dispatch(
					'core/notices',
					'createErrorNotice',
					'fail',
					{ id: REUSABLE_BLOCK_NOTICE_ID }
				)
			);
		} );
	} );

	describe( 'deleteReusableBlock', () => {
		let fulfillment;
		const sampleBlock = {
			id: 123,
			clientId: 'clientid1',
			status: 'publish',
			title: {
				raw: 'My cool block',
			},
			content: {
				raw: '<!-- wp:test-block {"name":"Big Bird"} /-->',
				protected: false,
			},
		};
		const reset = () => fulfillment = actions
			.__experimentalDeleteReusableBlock( 123 );
		it( 'should yield apiFetch action for blocks post type', () => {
			reset();
			apiFetchDoActual();
			const { value } = fulfillment.next();
			expect( value ).toEqual(
				apiFetch(
					{ path: '/wp/v2/types/wp_block' }
				)
			);
		} );
		it( 'should return undefined if retrieved post type is not ' +
			'available', () => {
			const { value, done } = fulfillment.next();
			expect( value ).toBeUndefined();
			expect( done ).toBe( true );
		} );
		it( 'should yield select action for __experimentalGetReusableBlock', () => {
			reset();
			apiFetchDoActual();
			fulfillment.next();
			const { value } = fulfillment.next( postTypeResponse );
			expect( value ).toEqual(
				select(
					STORE_KEY,
					'__experimentalGetReusableBlock',
					123
				)
			);
		} );
		it( 'should return undefined if there is no reusable block for the given' +
			'id or it is temporary', () => {
			const { value: nonBlock, done: nonBlockDone } = fulfillment.next();
			expect( nonBlock ).toBeUndefined();
			expect( nonBlockDone ).toBe( true );

			reset();
			apiFetchDoActual();
			fulfillment.next();
			fulfillment.next( postTypeResponse );
			const { value: tempBlock, done: tempBlockDone } = fulfillment.next(
				{
					...sampleBlock,
					isTemporary: true,
				}
			);
			expect( tempBlock ).toBeUndefined();
			expect( tempBlockDone ).toBe( true );
		} );
		it( 'should return select action for getBlocks selector on the ' +
			'core/block-editor store', () => {
			reset();
			apiFetchDoActual();
			fulfillment.next();
			fulfillment.next( postTypeResponse );
			const { value } = fulfillment.next( sampleBlock );
			expect( value ).toEqual(
				select(
					'core/block-editor',
					'getBlocks'
				)
			);
		} );
		it( 'should yield action for removing reusable block', () => {
			const { value } = fulfillment.next( [ {
				...sampleBlock,
				clientId: 'clientid2',
			} ] );
			expect( value.type ).toBe( 'REMOVE_REUSABLE_BLOCK' );
			expect( value.id ).toBe( 123 );
			expect( value.optimist.type ).toBe( BEGIN );
		} );
		it( 'should yield dispatch action for removeBlocks on the ' +
			'core/block-editor store', () => {
			const { value } = fulfillment.next();
			expect( value ).toEqual(
				dispatch(
					'core/block-editor',
					'removeBlocks',
					[ 'clientid1' ]
				)
			);
		} );
		it( 'should yield the apiFetch action for deleting the block', () => {
			const { value } = fulfillment.next();
			expect( value ).toEqual(
				apiFetch(
					{
						path: `/wp/v2/blocks/123`,
						method: 'DELETE',
					}
				)
			);
		} );
		it( 'should yield the action for DELETE_REUSABLE_BLOCK_SUCCESS', () => {
			const { value } = fulfillment.next();
			expect( value.type ).toBe( 'DELETE_REUSABLE_BLOCK_SUCCESS' );
			expect( value.id ).toBe( 123 );
			expect( value.optimist.type ).toBe( COMMIT );
		} );
		it( 'should yield dispatch action for creating a success notice and be ' +
			'complete', () => {
			const { value } = fulfillment.next();
			expect( value ).toEqual(
				dispatch(
					'core/notices',
					'createSuccessNotice',
					'Block deleted.',
					{ id: REUSABLE_BLOCK_NOTICE_ID }
				)
			);
			const { done } = fulfillment.next();
			expect( done ).toBe( true );
		} );
		it( 'should yield expected error action and notice if delete request ' +
			'errors', () => {
			reset();
			apiFetchDoActual();
			fulfillment.next();
			fulfillment.next( postTypeResponse );
			fulfillment.next( sampleBlock );
			fulfillment.next( [ { ...sampleBlock, clientId: 'clientid2' } ] );
			fulfillment.next();
			apiFetchThrowError( { message: 'error' } );
			const { value } = fulfillment.next();
			expect( value.type ).toBe( 'DELETE_REUSABLE_BLOCK_FAILURE' );
			expect( value.id ).toBe( 123 );
			expect( value.optimist.type ).toBe( REVERT );

			const { value: noticeAction } = fulfillment.next();
			expect( noticeAction ).toEqual(
				dispatch(
					'core/notices',
					'error',
					{ id: REUSABLE_BLOCK_NOTICE_ID }
				)
			);

			const { done } = fulfillment.next();
			expect( done ).toBe( true );
		} );
	} );

	describe( 'convertBlockToStatic', () => {
		const clientId = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
		let fulfillment;
		const reset = () => fulfillment = actions
			.__experimentalConvertBlockToStatic( clientId );
		const createAssociatedBlock = () => createBlock(
			'core/block',
			{ ref: 123 }
		);
		const reusableBlock = { id: 123, title: 'My cool block', clientId };
		const createParsedBlock = () => createBlock(
			'core/test-block',
			{ name: 'Big Bird' }
		);
		it( 'should yield the getBlock selector for the core/block-editor ' +
			'store', () => {
			reset();
			const { value } = fulfillment.next();
			expect( value ).toEqual(
				select(
					'core/block-editor',
					'getBlock',
					clientId
				)
			);
		} );
		it( 'should yield the select action for ' +
			'__experimentalGetReusableBlock', () => {
			const { value } = fulfillment.next( createAssociatedBlock() );
			expect( value ).toEqual(
				select(
					STORE_KEY,
					'__experimentalGetReusableBlock',
					123
				)
			);
		} );
		it( 'should yield the select action for getBlock from the ' +
			'core/block-editor store', () => {
			const { value } = fulfillment.next( reusableBlock );
			expect( value ).toEqual(
				select(
					'core/block-editor',
					'getBlock',
					clientId,
				)
			);
		} );
		it( 'should yield dispatch action for the replaceBlocks dispatch action ' +
			'in the core/block-editor store', () => {
			const associatedBlock = createAssociatedBlock();
			const parsedBlock = createParsedBlock();
			reset();
			fulfillment.next();
			fulfillment.next( associatedBlock );
			fulfillment.next( reusableBlock );
			const { value } = fulfillment.next( parsedBlock );
			expect( value ).toEqual(
				dispatch(
					'core/block-editor',
					'replaceBlocks',
					associatedBlock.clientId,
					[
						expect.objectContaining( {
							name: 'core/test-block',
							attributes: { name: 'Big Bird' },
						} ),
					]
				)
			);
			// should be done
			const { done } = fulfillment.next();
			expect( done ).toBe( true );
		} );

		it( 'should convert a reusable block with nested blocks into a static ' +
			'block', () => {
			const associatedBlock = createBlock( 'core/block', { ref: 123 } );
			const parsedBlock = createBlock(
				'core/test-block',
				{ name: 'Big Bird' },
				[
					createBlock( 'core/test-block', { name: 'Oscar the Grouch' } ),
					createBlock( 'core/test-block', { name: 'Cookie Monster' } ),
				]
			);
			reset();
			fulfillment.next();
			fulfillment.next( associatedBlock );
			fulfillment.next( reusableBlock );
			const { value } = fulfillment.next( parsedBlock );
			expect( value ).toEqual(
				dispatch(
					'core/block-editor',
					'replaceBlocks',
					associatedBlock.clientId,
					[
						expect.objectContaining( {
							name: 'core/test-block',
							attributes: { name: 'Big Bird' },
							innerBlocks: [
								expect.objectContaining( {
									attributes: { name: 'Oscar the Grouch' },
								} ),
								expect.objectContaining( {
									attributes: { name: 'Cookie Monster' },
								} ),
							],
						} ),
					]
				)
			);
			// should be done
			const { done } = fulfillment.next();
			expect( done ).toBe( true );
		} );
	} );

	describe( 'convertBlockToReusable', () => {
		const createStaticBlock = () => createBlock( 'core/block', { ref: 123 } );
		let fulfillment;
		const reset = ( id ) => fulfillment = actions
			.__experimentalConvertBlockToReusable( id );
		describe( 'yielded actions when only one client id is passed in', () => {
			it( 'yields select action for the getBlock selector from the ' +
				'core/block-editor store', () => {
				reset( 123 );
				const { value } = fulfillment.next();
				expect( value ).toEqual(
					select(
						'core/block-editor',
						'getBlock',
						123
					)
				);
			} );
			it( 'yields dispatch action for ' +
				'__experimentalReceiveReusableBlocks', () => {
				const staticBlock = createStaticBlock();
				const { value } = fulfillment.next( staticBlock );
				expect( value ).toEqual(
					dispatch(
						STORE_KEY,
						'__experimentalReceiveReusableBlocks',
						[
							{
								parsedBlock: staticBlock,
								reusableBlock: {
									id: expect.stringMatching( /^reusable/ ),
									clientId: staticBlock.clientId,
									title: 'Untitled Reusable Block',
								},
							},
						]
					)
				);
			} );
			it( 'yields dispatch action for the replaceBlocks action on the ' +
				'core/block-editor store', () => {
				const staticBlock = createStaticBlock();
				reset( staticBlock.clientId );
				fulfillment.next();
				fulfillment.next( staticBlock );
				const { value } = fulfillment.next();
				expect( value ).toEqual(
					dispatch(
						'core/block-editor',
						'replaceBlocks',
						[ staticBlock.clientId ],
						expect.objectContaining(
							{
								name: 'core/block',
								attributes: {
									ref: expect.stringMatching( /^reusable/ ),
								},
							}
						)
					)
				);
			} );
			it( 'yields the receiveBlocks action on the core/block-editor ' +
				'store', () => {
				const staticBlock = createStaticBlock();
				reset( staticBlock.clientId );
				fulfillment.next();
				fulfillment.next( staticBlock );
				fulfillment.next();
				const { value } = fulfillment.next();
				expect( value ).toEqual(
					dispatch(
						'core/block-editor',
						'receiveBlocks',
						[ staticBlock ]
					)
				);
			} );
			it( 'yields dispatch action for the __experimentalSaveReusableBlock ' +
				'selector on the core/editor store', () => {
				const { value } = fulfillment.next();
				expect( value ).toEqual(
					dispatch(
						STORE_KEY,
						'__experimentalSaveReusableBlock',
						expect.stringMatching( /^reusable/ ),
					)
				);
				const { done } = fulfillment.next();
				expect( done ).toBe( true );
			} );
		} );
		describe( 'yielded actions when multiple client ids are passed in', () => {
			it( 'should yield select action for the getBlocksByClientId selector ' +
				'on the core/block-editor store', () => {
				reset( [ 123, 456 ] );
				const { value } = fulfillment.next();
				expect( value ).toEqual(
					select(
						'core/block-editor',
						'getBlocksByClientId',
						[ 123, 456 ]
					)
				);
			} );
			it( 'should yield dispatch action for receiveBlocks', () => {
				const staticBlock = createStaticBlock();
				const { value } = fulfillment.next( staticBlock );
				expect( value ).toEqual(
					dispatch(
						'core/block-editor',
						'receiveBlocks',
						[
							expect.objectContaining( {
								name: 'core/template',
								innerBlocks: staticBlock,
							} ),
						]
					)
				);
			} );
		} );
	} );
} );
