/**
 * External dependencies
 */
import uuid from 'uuid/v4';
import { BEGIN, COMMIT, REVERT } from 'redux-optimist';
import {
	get,
	includes,
	map,
	castArray,
	isEqual,
} from 'lodash';

/**
 * WordPress dependencies
 */
import {
	parse,
	getBlockType,
	switchToBlockType,
	createBlock,
	serialize,
	createReusableBlock,
	getDefaultBlockName,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getPostEditUrl, getWPAdminURL } from '../utils/url';
import {
	resetPost,
	setupNewPost,
	resetBlocks,
	focusBlock,
	replaceBlocks,
	createSuccessNotice,
	createErrorNotice,
	removeNotice,
	savePost,
	editPost,
	requestMetaBoxUpdates,
	updateReusableBlock,
	saveReusableBlock,
	insertBlock,
} from './actions';
import {
	getCurrentPost,
	getCurrentPostType,
	getDirtyMetaBoxes,
	getEditedPostContent,
	getPostEdits,
	isCurrentPostPublished,
	isEditedPostDirty,
	isEditedPostNew,
	isEditedPostSaveable,
	getBlock,
	getReusableBlock,
	getAnnotation,
	POST_UPDATE_TRANSACTION_ID,
	ANNOTATION_SAVE_TRANSACTION_ID,
	ANNOTATION_TRASH_TRANSACTION_ID,
} from './selectors';

/**
 * Module Constants
 */
const SAVE_POST_NOTICE_ID = 'SAVE_POST_NOTICE_ID';
const TRASH_POST_NOTICE_ID = 'TRASH_POST_NOTICE_ID';
const SAVE_REUSABLE_BLOCK_NOTICE_ID = 'SAVE_REUSABLE_BLOCK_NOTICE_ID';
const SAVE_ANNOTATION_NOTICE_ID = 'SAVE_ANNOTATION_NOTICE_ID';
const TRASH_ANNOTATION_NOTICE_ID = 'TRASH_ANNOTATION_NOTICE_ID';

export default {
	REQUEST_POST_UPDATE( action, store ) {
		const { dispatch, getState } = store;
		const state = getState();
		const post = getCurrentPost( state );
		const edits = getPostEdits( state );
		const toSend = {
			...edits,
			content: getEditedPostContent( state ),
			id: post.id,
		};

		dispatch( {
			type: 'UPDATE_POST',
			edits: toSend,
			optimist: { type: BEGIN, id: POST_UPDATE_TRANSACTION_ID },
		} );
		dispatch( removeNotice( SAVE_POST_NOTICE_ID ) );
		const Model = wp.api.getPostTypeModel( getCurrentPostType( state ) );
		new Model( toSend ).save().done( ( newPost ) => {
			dispatch( {
				type: 'RESET_POST',
				post: newPost,
			} );
			dispatch( {
				type: 'REQUEST_POST_UPDATE_SUCCESS',
				previousPost: post,
				post: newPost,
				optimist: { type: COMMIT, id: POST_UPDATE_TRANSACTION_ID },
			} );
		} ).fail( ( err ) => {
			dispatch( {
				type: 'REQUEST_POST_UPDATE_FAILURE',
				error: get( err, 'responseJSON', {
					code: 'unknown_error',
					message: __( 'An unknown error occurred.' ),
				} ),
				post,
				edits,
				optimist: { type: REVERT, id: POST_UPDATE_TRANSACTION_ID },
			} );
		} );
	},
	REQUEST_POST_UPDATE_SUCCESS( action, store ) {
		const { previousPost, post } = action;
		const { dispatch, getState } = store;

		const publishStatus = [ 'publish', 'private', 'future' ];
		const isPublished = includes( publishStatus, previousPost.status );
		const willPublish = includes( publishStatus, post.status );

		let noticeMessage;
		let shouldShowLink = true;
		if ( ! isPublished && ! willPublish ) {
			// If saving a non published post, don't show any notice
			noticeMessage = null;
		} else if ( isPublished && ! willPublish ) {
			// If undoing publish status, show specific notice
			noticeMessage = __( 'Post reverted to draft.' );
			shouldShowLink = false;
		} else if ( ! isPublished && willPublish ) {
			// If publishing or scheduling a post, show the corresponding
			// publish message
			noticeMessage = {
				publish: __( 'Post published!' ),
				private: __( 'Post published privately!' ),
				future: __( 'Post scheduled!' ),
			}[ post.status ];
		} else {
			// Generic fallback notice
			noticeMessage = __( 'Post updated!' );
		}

		if ( noticeMessage ) {
			dispatch( createSuccessNotice(
				<p>
					<span>{ noticeMessage }</span>
					{ ' ' }
					{ shouldShowLink && <a href={ post.link }>{ __( 'View post' ) }</a> }
				</p>,
				{ id: SAVE_POST_NOTICE_ID }
			) );
		}

		// Update dirty meta boxes.
		dispatch( requestMetaBoxUpdates( getDirtyMetaBoxes( getState() ) ) );

		if ( get( window.history.state, 'id' ) !== post.id ) {
			window.history.replaceState(
				{ id: post.id },
				'Post ' + post.id,
				getPostEditUrl( post.id )
			);
		}
	},
	REQUEST_POST_UPDATE_FAILURE( action, store ) {
		const { post, edits } = action;
		const { dispatch } = store;

		const publishStatus = [ 'publish', 'private', 'future' ];
		const isPublished = publishStatus.indexOf( post.status ) !== -1;
		// If the post was being published, we show the corresponding publish error message
		// Unless we publish an "updating failed" message
		const messages = {
			publish: __( 'Publishing failed' ),
			private: __( 'Publishing failed' ),
			future: __( 'Scheduling failed' ),
		};
		const noticeMessage = ! isPublished && publishStatus.indexOf( edits.status ) !== -1 ?
			messages[ edits.status ] :
			__( 'Updating failed' );
		dispatch( createErrorNotice( noticeMessage, { id: SAVE_POST_NOTICE_ID } ) );
	},
	TRASH_POST( action, store ) {
		const { dispatch, getState } = store;
		const { postId } = action;
		const Model = wp.api.getPostTypeModel( getCurrentPostType( getState() ) );
		dispatch( removeNotice( TRASH_POST_NOTICE_ID ) );
		new Model( { id: postId } ).destroy().then(
			() => {
				dispatch( {
					...action,
					type: 'TRASH_POST_SUCCESS',
				} );
			},
			( err ) => {
				dispatch( {
					...action,
					type: 'TRASH_POST_FAILURE',
					error: get( err, 'responseJSON', {
						code: 'unknown_error',
						message: __( 'An unknown error occurred.' ),
					} ),
				} );
			}
		);
	},
	TRASH_POST_SUCCESS( action ) {
		const { postId, postType } = action;

		// Delay redirect to ensure store has been updated with the successful trash.
		setTimeout( () => {
			window.location.href = getWPAdminURL( 'edit.php', {
				trashed: 1,
				post_type: postType,
				ids: postId,
			} );
		} );
	},
	TRASH_POST_FAILURE( action, store ) {
		const message = action.error.message && action.error.code !== 'unknown_error' ? action.error.message : __( 'Trashing failed' );
		store.dispatch( createErrorNotice( message, { id: TRASH_POST_NOTICE_ID } ) );
	},
	MERGE_BLOCKS( action, store ) {
		const { dispatch } = store;
		const [ blockA, blockB ] = action.blocks;
		const blockType = getBlockType( blockA.name );

		// Only focus the previous block if it's not mergeable
		if ( ! blockType.merge ) {
			dispatch( focusBlock( blockA.uid ) );
			return;
		}

		// We can only merge blocks with similar types
		// thus, we transform the block to merge first
		const blocksWithTheSameType = blockA.name === blockB.name ?
			[ blockB ] :
			switchToBlockType( blockB, blockA.name );

		// If the block types can not match, do nothing
		if ( ! blocksWithTheSameType || ! blocksWithTheSameType.length ) {
			return;
		}

		// Calling the merge to update the attributes and remove the block to be merged
		const updatedAttributes = blockType.merge(
			blockA.attributes,
			blocksWithTheSameType[ 0 ].attributes
		);

		dispatch( focusBlock( blockA.uid, { offset: -1 } ) );
		dispatch( replaceBlocks(
			[ blockA.uid, blockB.uid ],
			[
				{
					...blockA,
					attributes: {
						...blockA.attributes,
						...updatedAttributes,
					},
				},
				...blocksWithTheSameType.slice( 1 ),
			]
		) );
	},
	AUTOSAVE( action, store ) {
		const { getState, dispatch } = store;
		const state = getState();
		if ( ! isEditedPostSaveable( state ) ) {
			return;
		}

		if ( ! isEditedPostNew( state ) && ! isEditedPostDirty( state ) ) {
			return;
		}

		if ( isCurrentPostPublished( state ) ) {
			// TODO: Publish autosave.
			//  - Autosaves are created as revisions for published posts, but
			//    the necessary REST API behavior does not yet exist
			//  - May need to check for whether the status of the edited post
			//    has changed from the saved copy (i.e. published -> pending)
			return;
		}

		// Change status from auto-draft to draft
		if ( isEditedPostNew( state ) ) {
			dispatch( editPost( { status: 'draft' } ) );
		}

		dispatch( savePost() );
	},
	SETUP_EDITOR( action ) {
		const { post, settings } = action;
		const effects = [];

		// Parse content as blocks
		if ( post.content.raw ) {
			effects.push( resetBlocks( parse( post.content.raw ) ) );
		} else if ( settings.template ) {
			const blocks = map( settings.template, ( [ name, attributes ] ) => {
				const block = createBlock( name );
				block.attributes = {
					...block.attributes,
					...attributes,
				};
				return block;
			} );
			effects.push( resetBlocks( blocks ) );
		}

		// Resetting post should occur after blocks have been reset, since it's
		// the post reset that restarts history (used in dirty detection).
		effects.push( resetPost( post ) );

		// Include auto draft title in edits while not flagging post as dirty
		if ( post.status === 'auto-draft' ) {
			effects.push( setupNewPost( {
				title: post.title.raw,
			} ) );
		}

		return effects;
	},
	FETCH_REUSABLE_BLOCKS( action, store ) {
		const { id } = action;
		const { dispatch } = store;

		let result;
		if ( id ) {
			result = new wp.api.models.ReusableBlocks( { id } ).fetch();
		} else {
			result = new wp.api.collections.ReusableBlocks().fetch();
		}

		result.then(
			( reusableBlockOrBlocks ) => {
				dispatch( {
					type: 'FETCH_REUSABLE_BLOCKS_SUCCESS',
					reusableBlocks: castArray( reusableBlockOrBlocks ).map( ( { id: itemId, name, content } ) => {
						const [ { name: type, attributes } ] = parse( content );
						return { id: itemId, name, type, attributes };
					} ),
				} );
			},
			( error ) => {
				dispatch( {
					type: 'FETCH_REUSABLE_BLOCKS_FAILURE',
					error: error.responseJSON || {
						code: 'unknown_error',
						message: __( 'An unknown error occurred.' ),
					},
				} );
			}
		);
	},
	SAVE_REUSABLE_BLOCK( action, store ) {
		const { id } = action;
		const { getState, dispatch } = store;

		const { name, type, attributes, isTemporary } = getReusableBlock( getState(), id );
		const content = serialize( createBlock( type, attributes ) );
		const requestData = isTemporary ? { name, content } : { id, name, content };
		new wp.api.models.ReusableBlocks( requestData ).save().then(
			( updatedReusableBlock ) => {
				dispatch( {
					type: 'SAVE_REUSABLE_BLOCK_SUCCESS',
					updatedId: updatedReusableBlock.id,
					id,
				} );
				dispatch( createSuccessNotice(
					__( 'Block updated.' ),
					{ id: SAVE_REUSABLE_BLOCK_NOTICE_ID }
				) );
			},
			( error ) => {
				dispatch( { type: 'SAVE_REUSABLE_BLOCK_FAILURE', id } );
				dispatch( createErrorNotice(
					get( error.responseJSON, 'message', __( 'An unknown error occured.' ) ),
					{ id: SAVE_REUSABLE_BLOCK_NOTICE_ID }
				) );
			}
		);
	},
	CONVERT_BLOCK_TO_STATIC( action, store ) {
		const { getState, dispatch } = store;

		const oldBlock = getBlock( getState(), action.uid );
		const reusableBlock = getReusableBlock( getState(), oldBlock.attributes.ref );
		const newBlock = createBlock( reusableBlock.type, reusableBlock.attributes );
		dispatch( replaceBlocks( [ oldBlock.uid ], [ newBlock ] ) );
	},
	CONVERT_BLOCK_TO_REUSABLE( action, store ) {
		const { getState, dispatch } = store;

		const oldBlock = getBlock( getState(), action.uid );
		const reusableBlock = createReusableBlock( oldBlock.name, oldBlock.attributes );
		const newBlock = createBlock( 'core/block', { ref: reusableBlock.id } );
		dispatch( updateReusableBlock( reusableBlock.id, reusableBlock ) );
		dispatch( saveReusableBlock( reusableBlock.id ) );
		dispatch( replaceBlocks( [ oldBlock.uid ], [ newBlock ] ) );
	},
	APPEND_DEFAULT_BLOCK() {
		return insertBlock( createBlock( getDefaultBlockName() ) );
	},

	/*
	 * Fetch annotations.
	 */
	FETCH_ANNOTATIONS( action, store ) {
		const { id, params = {} } = action;
		const { dispatch, getState } = store;

		/*
		 * This helper is used below to wrap a backbone fetch().
		 * It's capable of fetching an entire collection recursively.
		 * It also handles the dispatch of subsequent action callbacks.
		 */
		const doFetch = ( jqXHR, { fetchAll, collection } = {} ) => {
			jqXHR.then(
				( fetchedData ) => {
					dispatch( {
						type: 'FETCH_ANNOTATIONS_SUCCESS',
						fetchedData, // Single annotation or an array.
						id, // In the case of fetching just a single ID.
					} );
					if ( ! id && fetchAll && collection && collection.hasMore() ) {
						dispatch( { ...action, type: 'FETCH_MORE_ANNOTATIONS' } );
						doFetch( collection.more(), { fetchAll, collection } );
					}
				}
			)
				.fail(
					( jqXHRError ) => {
						dispatch( {
							type: 'FETCH_ANNOTATIONS_FAILURE',
							error: get( jqXHRError, 'responseJSON', {
								code: 'unknown_error',
								message: __( 'An unknown error occurred.' ),
							} ),
							id, // In the case of fetching just a single ID.
						} );
					}
				);
		};

		if ( id ) { // One.
			const model = new wp.api.models.Annotations( { id } );
			doFetch( model.fetch( { data: { context: 'edit' } } ) );
		} else { // Collection.
			const state = getState();
			const post = getCurrentPost( state );
			const collection = new wp.api.collections.Annotations();

			// Defaults to open annotations only.
			const substatus = params.substatus || [ '' ];

			// Only fetch all recursively if querying open annotations.
			const fetchAll = isEqual( substatus, [ '' ] );

			// If fetching all open annotations, retrieve 25 at a time for faster incremental rendering.
			// If not fetching all, make one request for up to 100 max; e.g., archived annotations from the past.
			const perPage = fetchAll ? 25 : 100; // @TODO support more than 100 archived annotations.

			doFetch( collection.fetch( {
				data: {
					context: 'edit',
					parent_post_id: post.id,
					hierarchical: 'flat',
					status: [ 'publish' ],
					substatus: substatus,
					orderby: 'date',
					order: 'desc',
					per_page: perPage,
				},
			}, { fetchAll, collection } ) );
		}
	},

	/*
	 * Save annotations.
	 */
	REQUEST_ANNOTATION_SAVE( action, store ) {
		const { newData } = action;
		const { dispatch, getState } = store;

		const state = getState();
		const post = getCurrentPost( state );

		const isNew = newData.id ? false : true;
		const tempId = newData.id ? '' : uuid();
		const id = newData.id || tempId;

		const oldData = getAnnotation( state, id );

		newData.parent_post_id = post.id; // Enforce this.

		dispatch( removeNotice( SAVE_ANNOTATION_NOTICE_ID ) );
		dispatch( { type: 'SAVE_ANNOTATION', id } );

		dispatch( { // Add/update optimistically.
			type: isNew ? 'ADD_ANNOTATION' : 'UPDATE_ANNOTATION',
			newData: { ...newData, id },
			optimist: { type: BEGIN, id: ANNOTATION_SAVE_TRANSACTION_ID },
		} );

		new wp.api.models.Annotations( newData ).save().then(
			( annotation ) => {
				dispatch( {
					type: 'REQUEST_ANNOTATION_SAVE_SUCCESS',

					id: annotation.id,
					replacesTempId: tempId,

					oldData,
					newData: annotation,

					optimist: { type: COMMIT, id: ANNOTATION_SAVE_TRANSACTION_ID },
				} );
			}
		)
			.fail( ( jqXHRError ) => {
				dispatch( {
					type: 'REQUEST_ANNOTATION_SAVE_FAILURE',

					id,
					tempId,

					error: get( jqXHRError, 'responseJSON', {
						code: 'unknown_error',
						message: __( 'An unknown error occurred.' ),
					} ),
					optimist: { type: REVERT, id: ANNOTATION_SAVE_TRANSACTION_ID },
				} );
			} );
	},

	REQUEST_ANNOTATION_SAVE_SUCCESS( action, store ) {
		const { oldData, newData } = action;
		const { dispatch } = store;

		let message = __( 'Annotation saved.' );

		if ( newData.status === 'publish' ) {
			if ( ! oldData ) {
				message = __( 'Annotation added.' );
			} else if ( newData.substatus === 'archive' && newData.substatus !== oldData.substatus ) {
				message = __( 'Annotation archived.' );
			}
		} else if ( newData.status === 'trash' ) {
			message = __( 'Annotation trashed.' );
		}

		dispatch( { ...action, type: 'SAVE_ANNOTATION_SUCCESS' } );
		dispatch( createSuccessNotice( message, { id: SAVE_ANNOTATION_NOTICE_ID } ) );
	},

	REQUEST_ANNOTATION_SAVE_FAILURE( action, store ) {
		const { error } = action;
		const { dispatch } = store;

		dispatch( { ...action, type: 'SAVE_ANNOTATION_FAILURE' } );
		dispatch( createErrorNotice(
			get( error, 'message', __( 'An unknown error occured.' ) ),
			{ id: SAVE_ANNOTATION_NOTICE_ID }
		) );
	},

	/*
	 * Trash annotations.
	 */
	REQUEST_ANNOTATION_TRASH( action, store ) {
		const { id } = action;
		const { dispatch } = store;

		dispatch( removeNotice( TRASH_ANNOTATION_NOTICE_ID ) );

		dispatch( { // Optimistically.
			id, type: 'TRASH_ANNOTATION',
			optimist: { type: BEGIN, id: ANNOTATION_TRASH_TRANSACTION_ID },
		} );

		new wp.api.models.Annotations( { id } ).destroy().then(
			() => {
				dispatch( {
					id, type: 'REQUEST_ANNOTATION_TRASH_SUCCESS',
					optimist: { type: COMMIT, id: ANNOTATION_TRASH_TRANSACTION_ID },
				} );
			}
		)
			.fail( ( jqXHRError ) => {
				dispatch( {
					id, type: 'REQUEST_ANNOTATION_TRASH_FAILURE',
					error: get( jqXHRError, 'responseJSON', {
						code: 'unknown_error',
						message: __( 'An unknown error occurred.' ),
					} ),
					optimist: { type: REVERT, id: ANNOTATION_TRASH_TRANSACTION_ID },
				} );
			} );
	},

	REQUEST_ANNOTATION_TRASH_SUCCESS( action, store ) {
		const { dispatch } = store;
		const message = __( 'Annotation trashed.' );

		dispatch( { ...action, type: 'TRASH_ANNOTATION_SUCCESS' } );
		dispatch( createSuccessNotice( message, { id: TRASH_ANNOTATION_NOTICE_ID } ) );
	},

	REQUEST_ANNOTATION_TRASH_FAILURE( action, store ) {
		const { error } = action;
		const { dispatch } = store;

		dispatch( { ...action, type: 'TRASH_ANNOTATION_FAILURE' } );
		dispatch( createErrorNotice(
			get( error, 'message', __( 'An unknown error occured.' ) ),
			{ id: TRASH_ANNOTATION_NOTICE_ID }
		) );
	},
};
