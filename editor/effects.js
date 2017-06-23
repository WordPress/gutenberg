/**
 * External dependencies
 */
import { BEGIN, COMMIT, REVERT } from 'redux-optimist';
import { get, uniqueId } from 'lodash';

/**
 * WordPress dependencies
 */
import { serialize, getBlockType, switchToBlockType } from 'blocks';
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import { getGutenbergURL, getWPAdminURL } from './utils/url';
import { focusBlock, replaceBlocks } from './actions';
import {
	getCurrentPostId,
	getCurrentPostType,
	getBlocks,
	getPostEdits,
} from './selectors';

export default {
	REQUEST_POST_UPDATE( action, store ) {
		const { dispatch, getState } = store;
		const state = getState();
		const postId = getCurrentPostId( state );
		const isNew = ! postId;
		const edits = getPostEdits( state );
		const toSend = {
			...edits,
			content: serialize( getBlocks( state ) ),
		};
		const transactionId = uniqueId();

		if ( ! isNew ) {
			toSend.id = postId;
		}

		dispatch( {
			type: 'CLEAR_POST_EDITS',
			optimist: { type: BEGIN, id: transactionId },
		} );
		dispatch( {
			type: 'UPDATE_POST',
			edits: toSend,
			optimist: { id: transactionId },
		} );
		const Model = wp.api.getPostTypeModel( getCurrentPostType( state ) );
		new Model( toSend ).save().done( ( newPost ) => {
			dispatch( {
				type: 'REQUEST_POST_UPDATE_SUCCESS',
				post: newPost,
				isNew,
				optimist: { type: COMMIT, id: transactionId },
			} );
			dispatch( {
				type: 'RESET_POST',
				post: newPost,
			} );
		} ).fail( ( err ) => {
			dispatch( {
				type: 'REQUEST_POST_UPDATE_FAILURE',
				error: get( err, 'responseJSON', {
					code: 'unknown_error',
					message: __( 'An unknown error occurred.' ),
				} ),
				edits,
				optimist: { type: REVERT, id: transactionId },
			} );
		} );
	},
	REQUEST_POST_UPDATE_SUCCESS( action ) {
		const { post, isNew } = action;
		if ( ! isNew ) {
			return;
		}
		const newURL = getGutenbergURL( {
			post_id: post.id,
		} );
		window.history.replaceState( {}, 'Post ' + post.id, newURL );
	},
	TRASH_POST( action, store ) {
		const { dispatch, getState } = store;
		const { postId } = action;
		const Model = wp.api.getPostTypeModel( getCurrentPostType( getState() ) );
		new Model( { id: postId } ).destroy().done( () => {
			dispatch( {
				...action,
				type: 'TRASH_POST_SUCCESS',
			} );
		} );
	},
	TRASH_POST_SUCCESS( action ) {
		const { postId, postType } = action;
		window.location.href = getWPAdminURL( 'edit.php', {
			trashed: 1,
			post_type: postType,
			ids: postId,
		} );
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
		const blocksWithTheSameType = blockA.name === blockB.name
			? [ blockB ]
			: switchToBlockType( blockB, blockA.name );

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
};
