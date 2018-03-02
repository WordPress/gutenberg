/**
 * External dependencies
 */
import { BEGIN, COMMIT, REVERT } from 'redux-optimist';
import { get, includes, map, castArray, uniqueId } from 'lodash';

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
	getDefaultBlockForPostFormat,
} from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import { getPostEditUrl, getWPAdminURL } from '../utils/url';
import {
	setupEditorState,
	resetPost,
	replaceBlocks,
	createSuccessNotice,
	createErrorNotice,
	removeNotice,
	savePost,
	updateReusableBlock,
	saveReusableBlock,
	insertBlock,
	selectBlock,
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
	getBlockCount,
	getBlocks,
	getReusableBlock,
	POST_UPDATE_TRANSACTION_ID,
} from './selectors';

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
		const basePath = wp.api.getPostTypeRoute( getCurrentPostType( state ) );
		wp.apiRequest( { path: `/wp/v2/${ basePath }/${ post.id }`, method: 'PUT', data: toSend } ).done( ( newPost ) => {
			dispatch( resetPost( newPost ) );
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
		const basePath = wp.api.getPostTypeRoute( getCurrentPostType( getState() ) );
		dispatch( removeNotice( TRASH_POST_NOTICE_ID ) );
		wp.apiRequest( { path: `/wp/v2/${ basePath }/${ postId }`, method: 'DELETE' } ).then(
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
		const state = store.getState();
		const [ blockAUid, blockBUid ] = action.blocks;
		const blockA = getBlock( state, blockAUid );
		const blockB = getBlock( state, blockBUid );
		const blockType = getBlockType( blockA.name );

		// Only focus the previous block if it's not mergeable
		if ( ! blockType.merge ) {
			dispatch( selectBlock( blockA.uid ) );
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

		dispatch( selectBlock( blockA.uid, -1 ) );
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

		dispatch( savePost() );
	},
	SETUP_EDITOR( action ) {
		const { post, settings } = action;

		// Parse content as blocks
		let blocks;
		if ( post.content.raw ) {
			blocks = parse( post.content.raw );
		} else if ( settings.template ) {
			const createBlocksFromTemplate = ( template ) => {
				return map( template, ( [ name, attributes, innerBlocksTemplate ] ) => {
					return createBlock(
						name,
						attributes,
						createBlocksFromTemplate( innerBlocksTemplate )
					);
				} );
			};
			blocks = createBlocksFromTemplate( settings.template );
		} else if ( getDefaultBlockForPostFormat( post.format ) ) {
			blocks = [ createBlock( getDefaultBlockForPostFormat( post.format ) ) ];
		} else {
			blocks = [];
		}

		// Include auto draft title in edits while not flagging post as dirty
		const edits = {};
		if ( post.status === 'auto-draft' ) {
			edits.title = post.title.raw;
			edits.status = 'draft';
		}

		return setupEditorState( post, blocks, edits );
	},
	FETCH_REUSABLE_BLOCKS( action, store ) {
		// TODO: these are potentially undefined, this fix is in place
		// until there is a filter to not use reusable blocks if undefined
		const basePath = wp.api.getPostTypeRoute( 'wp_block' );
		if ( ! basePath ) {
			return;
		}
		const { id } = action;
		const { dispatch } = store;
		let result;
		if ( id ) {
			result = wp.apiRequest( { path: `/wp/v2/${ basePath }/${ id }` } );
		} else {
			result = wp.apiRequest( { path: `/wp/v2/${ basePath }` } );
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
		const basePath = wp.api.getPostTypeRoute( 'wp_block' );
		if ( ! basePath ) {
			return;
		}

		const { id } = action;
		const { getState, dispatch } = store;

		const { title, type, attributes, isTemporary } = getReusableBlock( getState(), id );
		const content = serialize( createBlock( type, attributes ) );

		const data = isTemporary ? { title, content } : { id, title, content };
		const path = isTemporary ? `/wp/v2/${ basePath }` : `/wp/v2/${ basePath }/${ id }`;
		const method = isTemporary ? 'POST' : 'PUT';

		wp.apiRequest( { path, data, method } ).then(
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
		const basePath = wp.api.getPostTypeRoute( 'wp_block' );
		if ( ! basePath ) {
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

		wp.apiRequest( { path: `/wp/v2/${ basePath }/${ id }`, method: 'DELETE' } ).then(
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
	INSERT_DEFAULT_BLOCK( action ) {
		const { attributes, rootUID, index } = action;
		const block = createBlock( getDefaultBlockName(), attributes );

		return insertBlock( block, index, rootUID );
	},
	CREATE_NOTICE( { notice: { content, spokenMessage } } ) {
		const message = spokenMessage || content;
		speak( message, 'assertive' );
	},

	EDIT_POST( action, { getState } ) {
		const format = get( action, 'edits.format' );
		if ( ! format ) {
			return;
		}
		const blockName = getDefaultBlockForPostFormat( format );
		if ( blockName && getBlockCount( getState() ) === 0 ) {
			return insertBlock( createBlock( blockName ) );
		}
	},
};
