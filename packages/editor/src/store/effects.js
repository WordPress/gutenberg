/**
 * External dependencies
 */
import { compact, last, has } from 'lodash';

/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import {
	parse,
	getBlockType,
	switchToBlockType,
	doBlocksMatchTemplate,
	synchronizeBlocksWithTemplate,
} from '@wordpress/blocks';
import { _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	setupEditorState,
	replaceBlocks,
	selectBlock,
	resetBlocks,
	setTemplateValidity,
	insertDefaultBlock,
} from './actions';
import {
	getBlock,
	getBlockRootClientId,
	getBlocks,
	getBlockCount,
	getPreviousBlockClientId,
	getSelectedBlockClientId,
	getSelectedBlockCount,
	getTemplate,
	getTemplateLock,
	isValidTemplate,
} from './selectors';
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

/**
 * Block validity is a function of blocks state (at the point of a
 * reset) and the template setting. As a compromise to its placement
 * across distinct parts of state, it is implemented here as a side-
 * effect of the block reset action.
 *
 * @param {Object} action RESET_BLOCKS action.
 * @param {Object} store  Store instance.
 *
 * @return {?Object} New validity set action if validity has changed.
 */
export function validateBlocksToTemplate( action, store ) {
	const state = store.getState();
	const template = getTemplate( state );
	const templateLock = getTemplateLock( state );

	// Unlocked templates are considered always valid because they act
	// as default values only.
	const isBlocksValidToTemplate = (
		! template ||
		templateLock !== 'all' ||
		doBlocksMatchTemplate( action.blocks, template )
	);

	// Update if validity has changed.
	if ( isBlocksValidToTemplate !== isValidTemplate( state ) ) {
		return setTemplateValidity( isBlocksValidToTemplate );
	}
}

/**
 * Effect handler which will return a block select action to select the block
 * occurring before the selected block in the previous state, unless it is the
 * same block or the action includes a falsey `selectPrevious` option flag.
 *
 * @param {Object} action Action which had initiated the effect handler.
 * @param {Object} store  Store instance.
 *
 * @return {?Object} Block select action to select previous, if applicable.
 */
export function selectPreviousBlock( action, store ) {
	// if the action says previous block should not be selected don't do anything.
	if ( ! action.selectPrevious ) {
		return;
	}

	const firstRemovedBlockClientId = action.clientIds[ 0 ];
	const state = store.getState();
	const selectedBlockClientId = getSelectedBlockClientId( state );

	// recreate the state before the block was removed.
	const previousState = { ...state, editor: { present: last( state.editor.past ) } };

	// rootClientId of the removed block.
	const rootClientId = getBlockRootClientId( previousState, firstRemovedBlockClientId );

	// Client ID of the block that was before the removed block or the
	// rootClientId if the removed block was first amongst its siblings.
	const blockClientIdToSelect = getPreviousBlockClientId( previousState, firstRemovedBlockClientId ) || rootClientId;

	// Dispatch select block action if the currently selected block
	// is not already the block we want to be selected.
	if ( blockClientIdToSelect !== selectedBlockClientId ) {
		return selectBlock( blockClientIdToSelect, -1 );
	}
}

/**
 * Effect handler which will return a default block insertion action if there
 * are no other blocks at the root of the editor. This is expected to be used
 * in actions which may result in no blocks remaining in the editor (removal,
 * replacement, etc).
 *
 * @param {Object} action Action which had initiated the effect handler.
 * @param {Object} store  Store instance.
 *
 * @return {?Object} Default block insert action, if no other blocks exist.
 */
export function ensureDefaultBlock( action, store ) {
	if ( ! getBlockCount( store.getState() ) ) {
		return insertDefaultBlock();
	}
}

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
	MERGE_BLOCKS( action, store ) {
		const { dispatch } = store;
		const state = store.getState();
		const [ firstBlockClientId, secondBlockClientId ] = action.blocks;
		const blockA = getBlock( state, firstBlockClientId );
		const blockB = getBlock( state, secondBlockClientId );
		const blockType = getBlockType( blockA.name );

		// Only focus the previous block if it's not mergeable
		if ( ! blockType.merge ) {
			dispatch( selectBlock( blockA.clientId ) );
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

		dispatch( selectBlock( blockA.clientId, -1 ) );
		dispatch( replaceBlocks(
			[ blockA.clientId, blockB.clientId ],
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
	SETUP_EDITOR( action, store ) {
		const { post, edits } = action;
		const state = store.getState();

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
		const template = getTemplate( state );
		if ( isNewPost && template ) {
			blocks = synchronizeBlocksWithTemplate( blocks, template );
		}

		const setupAction = setupEditorState( post, blocks );

		return compact( [
			setupAction,

			// TODO: This is temporary, necessary only so long as editor setup
			// is a separate action from block resetting.
			//
			// See: https://github.com/WordPress/gutenberg/pull/9403
			validateBlocksToTemplate( setupAction, store ),
		] );
	},
	RESET_BLOCKS: [
		validateBlocksToTemplate,
	],
	SYNCHRONIZE_TEMPLATE( action, { getState } ) {
		const state = getState();
		const blocks = getBlocks( state );
		const template = getTemplate( state );
		const updatedBlockList = synchronizeBlocksWithTemplate( blocks, template );

		return resetBlocks( updatedBlockList );
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
	REMOVE_BLOCKS: [
		selectPreviousBlock,
		ensureDefaultBlock,
	],
	REPLACE_BLOCKS: [
		ensureDefaultBlock,
	],
	MULTI_SELECT: ( action, { getState } ) => {
		const blockCount = getSelectedBlockCount( getState() );

		/* translators: %s: number of selected blocks */
		speak( sprintf( _n( '%s block selected.', '%s blocks selected.', blockCount ), blockCount ), 'assertive' );
	},
};
