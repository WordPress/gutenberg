/**
 * External dependencies
 */
import { has } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	parse,
	synchronizeBlocksWithTemplate,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	setupEditorState,
	resetEditorBlocks,
} from './actions';
import {
	fetchReusableBlocks,
	saveReusableBlocks,
	deleteReusableBlocks,
	convertBlockToReusable,
	convertBlockToStatic,
	receiveReusableBlocks,
} from './effects/reusable-blocks';
import {
	requestPostUpdate,
	requestPostUpdateSuccess,
	requestPostUpdateFailure,
	trashPost,
	trashPostFailure,
	refreshPost,
} from './effects/posts';

export default {
	REQUEST_POST_UPDATE: ( action, store ) => {
		requestPostUpdate( action, store );
	},
	REQUEST_POST_UPDATE_SUCCESS: requestPostUpdateSuccess,
	REQUEST_POST_UPDATE_FAILURE: requestPostUpdateFailure,
	TRASH_POST: ( action, store ) => {
		trashPost( action, store );
	},
	TRASH_POST_FAILURE: trashPostFailure,
	REFRESH_POST: ( action, store ) => {
		refreshPost( action, store );
	},
	SETUP_EDITOR( action ) {
		const { post, edits, template } = action;

		// In order to ensure maximum of a single parse during setup, edits are
		// included as part of editor setup action. Assume edited content as
		// canonical if provided, falling back to post.
		let content;
		if ( has( edits, [ 'content' ] ) ) {
			content = edits.content;
		} else {
			content = post.content.raw;
		}

		let blocks = parse( content );

		// Apply a template for new posts only, if exists.
		const isNewPost = post.status === 'auto-draft';
		if ( isNewPost && template ) {
			blocks = synchronizeBlocksWithTemplate( blocks, template );
		}

		return [
			resetEditorBlocks( blocks ),
			setupEditorState( post ),
		];
	},
	FETCH_REUSABLE_BLOCKS: ( action, store ) => {
		fetchReusableBlocks( action, store );
	},
	SAVE_REUSABLE_BLOCK: ( action, store ) => {
		saveReusableBlocks( action, store );
	},
	DELETE_REUSABLE_BLOCK: ( action, store ) => {
		deleteReusableBlocks( action, store );
	},
	RECEIVE_REUSABLE_BLOCKS: receiveReusableBlocks,
	CONVERT_BLOCK_TO_STATIC: convertBlockToStatic,
	CONVERT_BLOCK_TO_REUSABLE: convertBlockToReusable,
};
