/**
 * WordPress dependencies
 */
import { select, dispatch, apiFetch } from '@wordpress/data-controls';

/**
 * Internal dependencies
 */
import * as actions from '../actions';
import {
	STORE_KEY,
	TRASH_POST_NOTICE_ID,
	POST_UPDATE_TRANSACTION_ID,
} from '../constants';

jest.mock( '@wordpress/data-controls' );

select.mockImplementation( ( ...args ) => {
	const { select: actualSelect } = jest.requireActual(
		'@wordpress/data-controls'
	);
	return actualSelect( ...args );
} );

dispatch.mockImplementation( ( ...args ) => {
	const { dispatch: actualDispatch } = jest.requireActual(
		'@wordpress/data-controls'
	);
	return actualDispatch( ...args );
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
		const { apiFetch: fetch } = jest.requireActual(
			'@wordpress/data-controls'
		);
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

describe( 'Post generator actions', () => {
	describe( 'savePost()', () => {
		let fulfillment, currentPost, currentPostStatus, isAutosave;
		beforeEach( () => {
			currentPost = () => ( {
				id: postId,
				type: postTypeSlug,
				title: 'bar',
				content: 'bar',
				excerpt: 'crackers',
				status: currentPostStatus,
			} );
		} );
		const reset = ( isAutosaving ) =>
			( fulfillment = actions.savePost( { isAutosave: isAutosaving } ) );
		const testConditions = [
			[
				'yields an action for checking if the post is saveable',
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
				'yields an action for selecting the current edited post content',
				() => true,
				() => {
					const { value } = fulfillment.next( true );
					expect( value ).toEqual(
						select( STORE_KEY, 'getEditedPostContent' )
					);
				},
			],
			[
				"yields an action for editing the post entity's content if not an autosave",
				() => true,
				() => {
					if ( ! isAutosave ) {
						const edits = { content: currentPost().content };
						const { value } = fulfillment.next( edits.content );
						expect( value ).toEqual(
							dispatch( STORE_KEY, 'editPost', edits, {
								undoIgnore: true,
							} )
						);
					}
				},
			],
			[
				'yields an action for signalling that an update to the post started',
				() => true,
				() => {
					const { value } = fulfillment.next();
					expect( value ).toEqual( {
						type: 'REQUEST_POST_UPDATE_START',
						options: { isAutosave },
					} );
				},
			],
			[
				'yields an action for selecting the current post',
				() => true,
				() => {
					const { value } = fulfillment.next();
					expect( value ).toEqual(
						select( STORE_KEY, 'getCurrentPost' )
					);
				},
			],
			[
				"yields an action for selecting the post entity's non transient edits",
				() => true,
				() => {
					const post = currentPost();
					const { value } = fulfillment.next( post );
					expect( value ).toEqual(
						select(
							'core',
							'getEntityRecordNonTransientEdits',
							'postType',
							post.type,
							post.id
						)
					);
				},
			],
			[
				'yields an action for dispatching an update to the post entity',
				() => true,
				() => {
					const post = currentPost();
					const { value } = fulfillment.next( post );
					expect( value ).toEqual(
						dispatch(
							'core',
							'saveEntityRecord',
							'postType',
							post.type,
							isAutosave ? { ...post, content: undefined } : post,
							{
								isAutosave,
							}
						)
					);
				},
			],
			[
				'yields an action for signalling that an update to the post finished',
				() => true,
				() => {
					const { value } = fulfillment.next();
					expect( value ).toEqual( {
						type: 'REQUEST_POST_UPDATE_FINISH',
						options: { isAutosave },
					} );
				},
			],
			[
				"yields an action for selecting the entity's save error",
				() => true,
				() => {
					const post = currentPost();
					const { value } = fulfillment.next();
					expect( value ).toEqual(
						select(
							'core',
							'getLastEntitySaveError',
							'postType',
							post.type,
							post.id
						)
					);
				},
			],
			[
				'yields an action for selecting the current post',
				() => true,
				() => {
					const { value } = fulfillment.next();
					expect( value ).toEqual(
						select( STORE_KEY, 'getCurrentPost' )
					);
				},
			],
			[
				'yields an action for selecting the current post type config',
				() => true,
				() => {
					const post = currentPost();
					const { value } = fulfillment.next( post );
					expect( value ).toEqual(
						select( 'core', 'getPostType', post.type )
					);
				},
			],
			[
				'yields an action for dispatching a success notice',
				() => true,
				() => {
					if ( ! isAutosave && currentPostStatus === 'publish' ) {
						const { value } = fulfillment.next( postType );
						expect( value ).toEqual(
							dispatch(
								'core/notices',
								'createSuccessNotice',
								'Updated Post',
								{
									actions: [],
									id: 'SAVE_POST_NOTICE_ID',
									type: 'snackbar',
								}
							)
						);
					}
				},
			],
			[
				'yields an action for marking the last change as persistent',
				() => true,
				() => {
					if ( ! isAutosave ) {
						const { value } = fulfillment.next();
						expect( value ).toEqual(
							dispatch(
								'core/block-editor',
								'__unstableMarkLastChangeAsPersistent'
							)
						);
					}
				},
			],
			[
				'implicitly returns undefined',
				() => true,
				() => {
					expect( fulfillment.next() ).toEqual( {
						done: true,
						value: undefined,
					} );
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

		describe( 'yields with expected responses for when not autosaving and edited post is new', () => {
			beforeEach( () => {
				isAutosave = false;
				currentPostStatus = 'draft';
			} );
			testConditions.forEach( conditionalRunTestRoutine( false ) );
		} );

		describe( 'yields with expected responses for when not autosaving and edited post is not new', () => {
			beforeEach( () => {
				isAutosave = false;
				currentPostStatus = 'publish';
			} );
			testConditions.forEach( conditionalRunTestRoutine( false ) );
		} );
		describe( 'yields with expected responses for when autosaving is true and edited post is not new', () => {
			beforeEach( () => {
				isAutosave = true;
				currentPostStatus = 'autosave';
			} );
			testConditions.forEach( conditionalRunTestRoutine( true ) );
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
		const reset = () => ( fulfillment = actions.trashPost() );
		const rewind = () => {
			reset();
			fulfillment.next();
			fulfillment.next( postTypeSlug );
			fulfillment.next( postType );
			fulfillment.next();
		};
		it( 'yields expected action for selecting the current post type slug', () => {
			reset();
			const { value } = fulfillment.next();
			expect( value ).toEqual(
				select( STORE_KEY, 'getCurrentPostType' )
			);
		} );
		it( 'yields expected action for selecting the post type object', () => {
			const { value } = fulfillment.next( postTypeSlug );
			expect( value ).toEqual(
				select( 'core', 'getPostType', postTypeSlug )
			);
		} );
		it(
			'yields expected action for dispatching removing the trash notice ' +
				'for the post',
			() => {
				const { value } = fulfillment.next( postType );
				expect( value ).toEqual(
					dispatch(
						'core/notices',
						'removeNotice',
						TRASH_POST_NOTICE_ID
					)
				);
			}
		);
		it( 'yields expected action for selecting the currentPost', () => {
			const { value } = fulfillment.next();
			expect( value ).toEqual( select( STORE_KEY, 'getCurrentPost' ) );
		} );
		describe( 'expected yields when fetch throws an error', () => {
			it( 'yields expected action for dispatching an error notice', () => {
				const error = { foo: 'bar', code: 'fail' };
				apiFetchThrowError( error );
				const { value } = fulfillment.next( currentPost );
				expect( value ).toEqual(
					dispatch(
						'core/notices',
						'createErrorNotice',
						'Trashing failed',
						{
							id: TRASH_POST_NOTICE_ID,
						}
					)
				);
			} );
		} );
		describe( 'expected yields when fetch does not throw an error', () => {
			it( 'yields expected action object for the api fetch', () => {
				apiFetchDoActual();
				rewind();
				const { value } = fulfillment.next( currentPost );
				expect( value ).toEqual(
					apiFetch( {
						path: `/wp/v2/${ postType.rest_base }/${ currentPost.id }`,
						method: 'DELETE',
					} )
				);
			} );
			it( 'yields expected dispatch action for saving the post', () => {
				const { value } = fulfillment.next();
				expect( value ).toEqual( dispatch( STORE_KEY, 'savePost' ) );
			} );
		} );
	} );
	describe( 'refreshPost()', () => {
		let fulfillment;
		const currentPost = { id: 10, content: 'foo' };
		const reset = () => ( fulfillment = actions.refreshPost() );
		it( 'yields expected action for selecting the currentPost', () => {
			reset();
			const { value } = fulfillment.next();
			expect( value ).toEqual( select( STORE_KEY, 'getCurrentPost' ) );
		} );
		it( 'yields expected action for selecting the current post type', () => {
			const { value } = fulfillment.next( currentPost );
			expect( value ).toEqual(
				select( STORE_KEY, 'getCurrentPostType' )
			);
		} );
		it( 'yields expected action for selecting the post type object', () => {
			const { value } = fulfillment.next( postTypeSlug );
			expect( value ).toEqual(
				select( 'core', 'getPostType', postTypeSlug )
			);
		} );
		it( 'yields expected action for the api fetch call', () => {
			const { value } = fulfillment.next( postType );
			apiFetchDoActual();
			// since the timestamp is a computed value we can't do a direct comparison.
			// so we'll just see if the path has most of the value.
			expect( value.request.path ).toEqual(
				expect.stringContaining(
					`/wp/v2/${ postType.rest_base }/${ currentPost.id }?context=edit&_timestamp=`
				)
			);
		} );
		it( 'yields expected action for dispatching the reset of the post', () => {
			const { value } = fulfillment.next( currentPost );
			expect( value ).toEqual(
				dispatch( STORE_KEY, 'resetPost', currentPost )
			);
		} );
	} );
} );

describe( 'Editor actions', () => {
	describe( 'setupEditor()', () => {
		const post = { content: { raw: '' }, status: 'publish' };

		let fulfillment;
		const reset = ( edits, template ) =>
			( fulfillment = actions.setupEditor( post, edits, template ) );
		beforeAll( () => {
			reset();
		} );

		it( 'should yield action object for resetPost', () => {
			const { value } = fulfillment.next();
			expect( value ).toEqual( actions.resetPost( post ) );
		} );
		it( 'should yield the SETUP_EDITOR action', () => {
			const { value } = fulfillment.next();
			expect( value ).toEqual( {
				type: 'SETUP_EDITOR',
				post: { content: { raw: '' }, status: 'publish' },
			} );
		} );
		it( 'should yield action object for resetEditorBlocks', () => {
			const { value } = fulfillment.next();
			expect( Object.keys( value ) ).toEqual( [] );
		} );
		it( 'should yield action object for setupEditorState', () => {
			const { value } = fulfillment.next();
			expect( value ).toEqual(
				actions.setupEditorState( {
					content: { raw: '' },
					status: 'publish',
				} )
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
				options: {},
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
		it( 'should edit the relevant entity record', () => {
			const edits = { format: 'sample' };
			const fulfillment = actions.editPost( edits );
			expect( fulfillment.next() ).toEqual( {
				done: false,
				value: select( STORE_KEY, 'getCurrentPost' ),
			} );
			const post = { id: 1, type: 'post' };
			expect( fulfillment.next( post ) ).toEqual( {
				done: false,
				value: dispatch(
					'core',
					'editEntityRecord',
					'postType',
					post.type,
					post.id,
					edits,
					undefined
				),
			} );
			expect( fulfillment.next() ).toEqual( {
				done: true,
				value: undefined,
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
		it( 'should yield the REDO action', () => {
			const fulfillment = actions.redo();
			expect( fulfillment.next() ).toEqual( {
				done: false,
				value: dispatch( 'core', 'redo' ),
			} );
			expect( fulfillment.next() ).toEqual( {
				done: true,
				value: undefined,
			} );
		} );
	} );

	describe( 'undo', () => {
		it( 'should yield the UNDO action', () => {
			const fulfillment = actions.undo();
			expect( fulfillment.next() ).toEqual( {
				done: false,
				value: dispatch( 'core', 'undo' ),
			} );
			expect( fulfillment.next() ).toEqual( {
				done: true,
				value: undefined,
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
			expect( actions.__experimentalFetchReusableBlocks( 123 ) ).toEqual(
				{
					type: 'FETCH_REUSABLE_BLOCKS',
					id: 123,
				}
			);
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
			expect( actions.__experimentalDeleteReusableBlock( 123 ) ).toEqual(
				{
					type: 'DELETE_REUSABLE_BLOCK',
					id: 123,
				}
			);
		} );
	} );

	describe( 'convertBlockToStatic', () => {
		it( 'should return the CONVERT_BLOCK_TO_STATIC action', () => {
			const clientId = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
			expect(
				actions.__experimentalConvertBlockToStatic( clientId )
			).toEqual( {
				type: 'CONVERT_BLOCK_TO_STATIC',
				clientId,
			} );
		} );
	} );

	describe( 'convertBlockToReusable', () => {
		it( 'should return the CONVERT_BLOCK_TO_REUSABLE action', () => {
			const clientId = '358b59ee-bab3-4d6f-8445-e8c6971a5605';
			expect(
				actions.__experimentalConvertBlockToReusable( clientId )
			).toEqual( {
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

	describe( 'lockPostAutosaving', () => {
		it( 'should return the LOCK_POST_AUTOSAVING action', () => {
			const result = actions.lockPostAutosaving( 'test' );
			expect( result ).toEqual( {
				type: 'LOCK_POST_AUTOSAVING',
				lockName: 'test',
			} );
		} );
	} );

	describe( 'unlockPostAutosaving', () => {
		it( 'should return the UNLOCK_POST_AUTOSAVING action', () => {
			const result = actions.unlockPostAutosaving( 'test' );
			expect( result ).toEqual( {
				type: 'UNLOCK_POST_AUTOSAVING',
				lockName: 'test',
			} );
		} );
	} );
} );
