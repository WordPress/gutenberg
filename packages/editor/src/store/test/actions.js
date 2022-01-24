/**
 * WordPress dependencies
 */
import { apiFetch } from '@wordpress/data-controls';
import { controls } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import * as actions from '../actions';
import { STORE_NAME, TRASH_POST_NOTICE_ID } from '../constants';

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
						controls.select( STORE_NAME, 'isEditedPostSaveable' )
					);
				},
			],
			[
				'yields an action for selecting the current edited post content',
				() => true,
				() => {
					const { value } = fulfillment.next( true );
					expect( value ).toEqual(
						controls.select( STORE_NAME, 'getEditedPostContent' )
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
							controls.dispatch( STORE_NAME, 'editPost', edits, {
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
						controls.select( STORE_NAME, 'getCurrentPost' )
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
						controls.select(
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
						controls.dispatch(
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
						controls.select(
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
						controls.select( STORE_NAME, 'getCurrentPost' )
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
						controls.resolveSelect(
							'core',
							'getPostType',
							post.type
						)
					);
				},
			],
			[
				'yields an action for dispatching a success notice',
				() => true,
				() => {
					if ( ! isAutosave ) {
						const { value } = fulfillment.next( postType );
						expect( value ).toEqual(
							controls.dispatch(
								noticesStore,
								'createSuccessNotice',
								currentPostStatus === 'publish'
									? 'Updated Post'
									: 'Draft saved',
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
							controls.dispatch(
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
				// eslint-disable-next-line jest/valid-title
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
			fulfillment.next( currentPost );
		};
		it( 'yields expected action for selecting the current post type slug', () => {
			reset();
			const { value } = fulfillment.next();
			expect( value ).toEqual(
				controls.select( STORE_NAME, 'getCurrentPostType' )
			);
		} );
		it( 'yields expected action for selecting the post type object', () => {
			const { value } = fulfillment.next( postTypeSlug );
			expect( value ).toEqual(
				controls.resolveSelect( 'core', 'getPostType', postTypeSlug )
			);
		} );
		it(
			'yields expected action for dispatching removing the trash notice ' +
				'for the post',
			() => {
				const { value } = fulfillment.next( postType );
				expect( value ).toEqual(
					controls.dispatch(
						noticesStore,
						'removeNotice',
						TRASH_POST_NOTICE_ID
					)
				);
			}
		);
		it( 'yields expected action for selecting the currentPost', () => {
			const { value } = fulfillment.next();
			expect( value ).toEqual(
				controls.select( STORE_NAME, 'getCurrentPost' )
			);
		} );
		it( 'yields expected action object for the api fetch', () => {
			const { value } = fulfillment.next( currentPost );
			expect( value ).toEqual(
				apiFetch( {
					path: `/wp/v2/${ postType.rest_base }/${ currentPost.id }`,
					method: 'DELETE',
				} )
			);
		} );
		describe( 'expected yields when fetch throws an error', () => {
			it( 'yields expected action for dispatching an error notice', () => {
				const error = { foo: 'bar', code: 'fail' };
				const { value } = fulfillment.throw( error );
				expect( value ).toEqual(
					controls.dispatch(
						noticesStore,
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
			it( 'yields expected dispatch action for saving the post', () => {
				rewind();
				const { value } = fulfillment.next();
				expect( value ).toEqual(
					controls.dispatch( STORE_NAME, 'savePost' )
				);
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
			expect( value ).toEqual(
				controls.select( STORE_NAME, 'getCurrentPost' )
			);
		} );
		it( 'yields expected action for selecting the current post type', () => {
			const { value } = fulfillment.next( currentPost );
			expect( value ).toEqual(
				controls.select( STORE_NAME, 'getCurrentPostType' )
			);
		} );
		it( 'yields expected action for selecting the post type object', () => {
			const { value } = fulfillment.next( postTypeSlug );
			expect( value ).toEqual(
				controls.resolveSelect( 'core', 'getPostType', postTypeSlug )
			);
		} );
		it( 'yields expected action for the api fetch call', () => {
			const { value } = fulfillment.next( postType );
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
				controls.dispatch( STORE_NAME, 'resetPost', currentPost )
			);
		} );
	} );
} );

describe( 'Editor actions', () => {
	describe( 'setupEditor()', () => {
		it( 'should yield the setup editor actions but not reset blocks when the template is empty', () => {
			const post = { content: { raw: '' }, status: 'publish' };
			const fulfillment = actions.setupEditor( post );
			let { value } = fulfillment.next();
			expect( value ).toEqual( actions.resetPost( post ) );
			value = fulfillment.next().value;
			expect( value ).toEqual( {
				type: 'SETUP_EDITOR',
				post: { content: { raw: '' }, status: 'publish' },
			} );
			value = fulfillment.next().value;
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

	describe( 'editPost', () => {
		it( 'should edit the relevant entity record', () => {
			const edits = { format: 'sample' };
			const fulfillment = actions.editPost( edits );
			expect( fulfillment.next() ).toEqual( {
				done: false,
				value: controls.select( STORE_NAME, 'getCurrentPost' ),
			} );
			const post = { id: 1, type: 'post' };
			expect( fulfillment.next( post ) ).toEqual( {
				done: false,
				value: controls.dispatch(
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

	describe( 'redo', () => {
		it( 'should yield the REDO action', () => {
			const fulfillment = actions.redo();
			expect( fulfillment.next() ).toEqual( {
				done: false,
				value: controls.dispatch( 'core', 'redo' ),
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
				value: controls.dispatch( 'core', 'undo' ),
			} );
			expect( fulfillment.next() ).toEqual( {
				done: true,
				value: undefined,
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
