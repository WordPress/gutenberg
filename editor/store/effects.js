/**
 * External dependencies
 */
import { BEGIN, COMMIT, REVERT } from 'redux-optimist';
import { get, has, includes, map, castArray, uniqueId, reduce, values, some } from 'lodash';

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
	isReusableBlock,
	getDefaultBlockName,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';

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
	metaBoxUpdatesSuccess,
	updateReusableBlock,
	saveReusableBlock,
	insertBlock,
	setMetaBoxSavedData,
} from './actions';
import {
	getCurrentPost,
	getCurrentPostType,
	getEditedPostContent,
	getPostEdits,
	isCurrentPostPublished,
	isEditedPostDirty,
	isEditedPostNew,
	isEditedPostSaveable,
	getBlock,
	getBlocks,
	getReusableBlock,
	getMetaBoxes,
	POST_UPDATE_TRANSACTION_ID,
} from './selectors';
import { getMetaBoxContainer } from '../utils/meta-boxes';

/**
 * Module Constants
 */
const SAVE_POST_NOTICE_ID = 'SAVE_POST_NOTICE_ID';
const TRASH_POST_NOTICE_ID = 'TRASH_POST_NOTICE_ID';
const REUSABLE_BLOCK_NOTICE_ID = 'REUSABLE_BLOCK_NOTICE_ID';

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
		const { dispatch } = store;

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
				{ id: SAVE_POST_NOTICE_ID, spokenMessage: noticeMessage }
			) );
		}

		// Update dirty meta boxes.
		dispatch( requestMetaBoxUpdates() );

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

		window.location.href = getWPAdminURL( 'edit.php', {
			trashed: 1,
			post_type: postType,
			ids: postId,
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

		// Include auto draft title in edits while not flagging post as dirty
		if ( post.status === 'auto-draft' ) {
			effects.push( setupNewPost( {
				title: post.title.raw,
			} ) );
		}

		// Resetting post should occur after blocks have been reset, since it's
		// the post reset that restarts history (used in dirty detection).
		effects.push( resetPost( post ) );

		return effects;
	},
	FETCH_REUSABLE_BLOCKS( action, store ) {
		// TODO: these are potentially undefined, this fix is in place
		// until there is a filter to not use reusable blocks if undefined
		if ( ! has( wp, 'api.models.Blocks' ) && ! has( wp, 'api.collections.Blocks' ) ) {
			return;
		}
		const { id } = action;
		const { dispatch } = store;

		let result;
		if ( id ) {
			result = new wp.api.models.Blocks( { id } ).fetch();
		} else {
			result = new wp.api.collections.Blocks().fetch();
		}

		result.then(
			( reusableBlockOrBlocks ) => {
				dispatch( {
					type: 'FETCH_REUSABLE_BLOCKS_SUCCESS',
					id,
					reusableBlocks: castArray( reusableBlockOrBlocks ).map( ( { id: itemId, title, content } ) => {
						const [ { name: type, attributes } ] = parse( content );
						return { id: itemId, title, type, attributes };
					} ),
				} );
			},
			( error ) => {
				dispatch( {
					type: 'FETCH_REUSABLE_BLOCKS_FAILURE',
					id,
					error: error.responseJSON || {
						code: 'unknown_error',
						message: __( 'An unknown error occurred.' ),
					},
				} );
			}
		);
	},
	SAVE_REUSABLE_BLOCK( action, store ) {
		// TODO: these are potentially undefined, this fix is in place
		// until there is a filter to not use reusable blocks if undefined
		if ( ! has( wp, 'api.models.Blocks' ) ) {
			return;
		}

		const { id } = action;
		const { getState, dispatch } = store;

		const { title, type, attributes, isTemporary } = getReusableBlock( getState(), id );
		const content = serialize( createBlock( type, attributes ) );
		const requestData = isTemporary ? { title, content } : { id, title, content };

		new wp.api.models.Blocks( requestData ).save().then(
			( updatedReusableBlock ) => {
				dispatch( {
					type: 'SAVE_REUSABLE_BLOCK_SUCCESS',
					updatedId: updatedReusableBlock.id,
					id,
				} );
				const message = isTemporary ? __( 'Block created.' ) : __( 'Block updated.' );
				dispatch( createSuccessNotice( message, { id: REUSABLE_BLOCK_NOTICE_ID } ) );
			},
			( error ) => {
				dispatch( { type: 'SAVE_REUSABLE_BLOCK_FAILURE', id } );
				const message = __( 'An unknown error occured.' );
				dispatch( createErrorNotice( get( error.responseJSON, 'message', message ), {
					id: REUSABLE_BLOCK_NOTICE_ID,
					spokenMessage: message,
				} ) );
			}
		);
	},
	DELETE_REUSABLE_BLOCK( action, store ) {
		// TODO: these are potentially undefined, this fix is in place
		// until there is a filter to not use reusable blocks if undefined
		if ( ! has( wp, 'api.models.Blocks' ) ) {
			return;
		}

		const { id } = action;
		const { getState, dispatch } = store;

		// Don't allow a reusable block with a temporary ID to be deleted
		const reusableBlock = getReusableBlock( getState(), id );
		if ( ! reusableBlock || reusableBlock.isTemporary ) {
			return;
		}

		// Remove any other blocks that reference this reusable block
		const allBlocks = getBlocks( getState() );
		const associatedBlocks = allBlocks.filter( block => isReusableBlock( block ) && block.attributes.ref === id );
		const associatedBlockUids = associatedBlocks.map( block => block.uid );

		const transactionId = uniqueId();

		dispatch( {
			type: 'REMOVE_REUSABLE_BLOCK',
			id,
			associatedBlockUids,
			optimist: { type: BEGIN, id: transactionId },
		} );

		new wp.api.models.Blocks( { id } ).destroy().then(
			() => {
				dispatch( {
					type: 'DELETE_REUSABLE_BLOCK_SUCCESS',
					id,
					optimist: { type: COMMIT, id: transactionId },
				} );
				const message = __( 'Block deleted.' );
				dispatch( createSuccessNotice( message, { id: REUSABLE_BLOCK_NOTICE_ID } ) );
			},
			( error ) => {
				dispatch( {
					type: 'DELETE_REUSABLE_BLOCK_FAILURE',
					id,
					optimist: { type: REVERT, id: transactionId },
				} );
				const message = __( 'An unknown error occured.' );
				dispatch( createErrorNotice( get( error.responseJSON, 'message', message ), {
					id: REUSABLE_BLOCK_NOTICE_ID,
					spokenMessage: message,
				} ) );
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
		const newBlock = createBlock( 'core/block', {
			ref: reusableBlock.id,
			layout: oldBlock.attributes.layout,
		} );
		dispatch( updateReusableBlock( reusableBlock.id, reusableBlock ) );
		dispatch( saveReusableBlock( reusableBlock.id ) );
		dispatch( replaceBlocks( [ oldBlock.uid ], [ newBlock ] ) );
	},
	APPEND_DEFAULT_BLOCK( action ) {
		const { attributes, rootUID } = action;
		const block = createBlock( getDefaultBlockName(), attributes );

		return insertBlock( block, undefined, rootUID );
	},
	CREATE_NOTICE( { notice: { content, spokenMessage } } ) {
		const message = spokenMessage || content;
		speak( message, 'assertive' );
	},
	INITIALIZE_META_BOX_STATE( action, store ) {
		// Allow toggling metaboxes panels
		if ( some( action.metaBoxes ) ) {
			window.postboxes.add_postbox_toggles( 'post' );
		}
		const dataPerLocation = reduce( action.metaBoxes, ( memo, isActive, location ) => {
			if ( isActive ) {
				memo[ location ] = jQuery( getMetaBoxContainer( location ) ).serialize();
			}
			return memo;
		}, {} );
		store.dispatch( setMetaBoxSavedData( dataPerLocation ) );
	},
	REQUEST_META_BOX_UPDATES( action, store ) {
		const dataPerLocation = reduce( getMetaBoxes( store.getState() ), ( memo, metabox, location ) => {
			if ( metabox.isActive ) {
				memo[ location ] = jQuery( getMetaBoxContainer( location ) ).serialize();
			}
			return memo;
		}, {} );
		store.dispatch( setMetaBoxSavedData( dataPerLocation ) );

		// To save the metaboxes, we serialize each one of the location forms and combine them
		// We also add the "common" hidden fields from the base .metabox-base-form
		const formData = values( dataPerLocation ).concat(
			jQuery( '.metabox-base-form' ).serialize()
		).join( '&' );
		const fetchOptions = {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: formData,
			credentials: 'include',
		};

		// Save the metaboxes
		window.fetch( window._wpMetaBoxUrl, fetchOptions )
			.then( () => store.dispatch( metaBoxUpdatesSuccess() ) );
	},
};
