/**
 * External dependencies
 */
import { get } from 'lodash';
import { parse, stringify } from 'querystring';

/**
 * WordPress dependencies
 */
import { getBlockSettings, switchToBlockType } from 'blocks';
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import { focusBlock, replaceBlocks } from './actions';

export default {
	REQUEST_POST_UPDATE( action, store ) {
		const { dispatch } = store;
		const { postId, edits } = action;
		const isNew = ! postId;
		const toSend = postId ? { id: postId, ...edits } : edits;

		new wp.api.models.Post( toSend ).save().done( ( newPost ) => {
			dispatch( {
				type: 'REQUEST_POST_UPDATE_SUCCESS',
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
				isNew,
			} );
		} );
	},
	REQUEST_POST_UPDATE_SUCCESS( action ) {
		const { post } = action;
		const [ baseUrl, query ] = window.location.href.split( '?' );
		const qs = parse( query || '' );
		if ( qs.post_id === post.id ) {
			return;
		}

		const newUrl = baseUrl + '?' + stringify( {
			...qs,
			post_id: post.id,
		} );
		window.history.replaceState( {}, 'Post ' + post.id, newUrl );
	},
	TRASH_POST( action, store ) {
		const { dispatch } = store;
		const { postId } = action;
		new wp.api.models.Post( { id: postId } ).destroy().done( () => {
			dispatch( {
				...action,
				type: 'TRASH_POST_SUCCESS',
			} );
		} );
	},
	TRASH_POST_SUCCESS( action ) {
		const { postId, postType } = action;
		window.location.href = 'edit.php?' + stringify( {
			trashed: 1,
			post_type: postType,
			ids: postId,
		} );
	},
	MERGE_BLOCKS( action, store ) {
		const { dispatch } = store;
		const [ blockA, blockB ] = action.blocks;
		const blockASettings = getBlockSettings( blockA.blockType );

		// Only focus the previous block if it's not mergeable
		if ( ! blockASettings.merge ) {
			dispatch( focusBlock( blockA.uid ) );
			return;
		}

		// We can only merge blocks with similar types
		// thus, we transform the block to merge first
		const blocksWithTheSameType = blockA.blockType === blockB.blockType
			? [ blockB ]
			: switchToBlockType( blockB, blockA.blockType );

		// If the block types can not match, do nothing
		if ( ! blocksWithTheSameType || ! blocksWithTheSameType.length ) {
			return;
		}

		// Calling the merge to update the attributes and remove the block to be merged
		const updatedAttributes = blockASettings.merge(
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
