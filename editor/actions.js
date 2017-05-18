/**
 * External dependencies
 */
import { get } from 'lodash';
import { parse, stringify } from 'querystring';

export function focusBlock( uid, config ) {
	return {
		type: 'UPDATE_FOCUS',
		uid,
		config,
	};
}

export function deselectBlock( uid ) {
	return {
		type: 'TOGGLE_BLOCK_SELECTED',
		selected: false,
		uid,
	};
}

export function replaceBlocks( uids, blocks ) {
	return {
		type: 'REPLACE_BLOCKS',
		uids,
		blocks,
	};
}

export function insertBlock( block, after ) {
	return {
		type: 'INSERT_BLOCK',
		block,
		after,
	};
}

export function editPost( edits ) {
	return {
		type: 'EDIT_POST',
		edits,
	};
}

export function savePost( dispatch, postId, edits ) {
	const toSend = postId ? { id: postId, ...edits } : edits;
	const isNew = ! postId;

	dispatch( {
		type: 'REQUEST_POST_UPDATE',
		edits,
		isNew,
	} );

	new wp.api.models.Post( toSend ).save().done( ( newPost ) => {
		dispatch( {
			type: 'REQUEST_POST_UPDATE_SUCCESS',
			post: newPost,
			isNew,
		} );
		if ( isNew && window.history.replaceState ) {
			const [ baseUrl, query ] = window.location.href.split( '?' );
			const qs = parse( query || '' );
			const newUrl = baseUrl + '?' + stringify( {
				...qs,
				post_id: newPost.id,
			} );
			window.history.replaceState( {}, 'Post ' + newPost.id, newUrl );
		}
	} ).fail( ( err ) => {
		dispatch( {
			type: 'REQUEST_POST_UPDATE_FAILURE',
			error: get( err, 'responseJSON', {
				code: 'unknown_error',
				message: wp.i18n.__( 'An unknown error occurred.' ),
			} ),
			edits,
			isNew,
		} );
	} );
}

export function mergeBlocks( dispatch, blockA, blockB ) {
	const blockASettings = wp.blocks.getBlockSettings( blockA.blockType );

	// Only focus the previous block if it's not mergeable
	if ( ! blockASettings.merge ) {
		dispatch( focusBlock( blockA.uid ) );
		return;
	}

	// We can only merge blocks with similar types
	// thus, we transform the block to merge first
	const blocksWithTheSameType = blockA.blockType === blockB.blockType
		? [ blockB ]
		: wp.blocks.switchToBlockType( blockB, blockA.blockType );

	// If the block types can not match, do nothing
	if ( ! blocksWithTheSameType || ! blocksWithTheSameType.length ) {
		return;
	}

	// Calling the merge to update the attributes and remove the block to be merged
	const updatedAttributes = blockASettings.merge( blockA.attributes, blocksWithTheSameType[ 0 ].attributes );

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
}
