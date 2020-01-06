/**
 * External dependencies
 */
import { castArray, first, get, includes, last, some } from 'lodash';

/**
 * WordPress dependencies
 */
import { getDefaultBlockName, createBlock, hasBlockSupport, cloneBlock } from '@wordpress/blocks';
import { speak } from '@wordpress/a11y';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { select } from './controls';

/**
 * Generator which will yield a default block insert action if there
 * are no other blocks at the root of the editor. This generator should be used
 * in actions which may result in no blocks remaining in the editor (removal,
 * replacement, etc).
 */
function* ensureDefaultBlock() {
	const count = yield select(
		'core/block-editor',
		'getBlockCount',
	);

	// To avoid a focus loss when removing the last block, assure there is
	// always a default block if the last of the blocks have been removed.
	if ( count === 0 ) {
		yield insertDefaultBlock();
	}
}

/**
 * Returns an action object used in signalling that blocks state should be
 * reset to the specified array of blocks, taking precedence over any other
 * content reflected as an edit in state.
 *
 * @param {Array} blocks Array of blocks.
 *
 * @return {Object} Action object.
 */
export function resetBlocks( blocks ) {
	return {
		type: 'RESET_BLOCKS',
		blocks,
	};
}

/**
 * A block selection object.
 *
 * @typedef {Object} WPBlockSelection
 *
 * @property {string} clientId     A block client ID.
 * @property {string} attributeKey A block attribute key.
 * @property {number} offset       An attribute value offset, based on the rich
 *                                 text value. See `wp.richText.create`.
 */

/**
 * Returns an action object used in signalling that selection state should be
 * reset to the specified selection.
 *
 * @param {WPBlockSelection} selectionStart The selection start.
 * @param {WPBlockSelection} selectionEnd   The selection end.
 *
 * @return {Object} Action object.
 */
export function resetSelection( selectionStart, selectionEnd ) {
	return {
		type: 'RESET_SELECTION',
		selectionStart,
		selectionEnd,
	};
}

/**
 * Returns an action object used in signalling that blocks have been received.
 * Unlike resetBlocks, these should be appended to the existing known set, not
 * replacing.
 *
 * @param {Object[]} blocks Array of block objects.
 *
 * @return {Object} Action object.
 */
export function receiveBlocks( blocks ) {
	return {
		type: 'RECEIVE_BLOCKS',
		blocks,
	};
}

/**
 * Returns an action object used in signalling that the block attributes with
 * the specified client ID has been updated.
 *
 * @param {string} clientId   Block client ID.
 * @param {Object} attributes Block attributes to be merged.
 *
 * @return {Object} Action object.
 */
export function updateBlockAttributes( clientId, attributes ) {
	return {
		type: 'UPDATE_BLOCK_ATTRIBUTES',
		clientId,
		attributes,
	};
}

/**
 * Returns an action object used in signalling that the block with the
 * specified client ID has been updated.
 *
 * @param {string} clientId Block client ID.
 * @param {Object} updates  Block attributes to be merged.
 *
 * @return {Object} Action object.
 */
export function updateBlock( clientId, updates ) {
	return {
		type: 'UPDATE_BLOCK',
		clientId,
		updates,
	};
}

/**
 * Returns an action object used in signalling that the block with the
 * specified client ID has been selected, optionally accepting a position
 * value reflecting its selection directionality. An initialPosition of -1
 * reflects a reverse selection.
 *
 * @param {string}  clientId        Block client ID.
 * @param {?number} initialPosition Optional initial position. Pass as -1 to
 *                                  reflect reverse selection.
 *
 * @return {Object} Action object.
 */
export function selectBlock( clientId, initialPosition = null ) {
	return {
		type: 'SELECT_BLOCK',
		initialPosition,
		clientId,
	};
}

/**
 * Yields action objects used in signalling that the block preceding the given
 * clientId should be selected.
 *
 * @param {string} clientId Block client ID.
 */
export function* selectPreviousBlock( clientId ) {
	const previousBlockClientId = yield select(
		'core/block-editor',
		'getPreviousBlockClientId',
		clientId
	);

	if ( previousBlockClientId ) {
		yield selectBlock( previousBlockClientId, -1 );
	}
}

/**
 * Yields action objects used in signalling that the block following the given
 * clientId should be selected.
 *
 * @param {string} clientId Block client ID.
 */
export function* selectNextBlock( clientId ) {
	const nextBlockClientId = yield select(
		'core/block-editor',
		'getNextBlockClientId',
		clientId
	);

	if ( nextBlockClientId ) {
		yield selectBlock( nextBlockClientId );
	}
}

/**
 * Returns an action object used in signalling that a block multi-selection has started.
 *
 * @return {Object} Action object.
 */
export function startMultiSelect() {
	return {
		type: 'START_MULTI_SELECT',
	};
}

/**
 * Returns an action object used in signalling that block multi-selection stopped.
 *
 * @return {Object} Action object.
 */
export function stopMultiSelect() {
	return {
		type: 'STOP_MULTI_SELECT',
	};
}

/**
 * Returns an action object used in signalling that block multi-selection changed.
 *
 * @param {string} start First block of the multi selection.
 * @param {string} end   Last block of the multiselection.
 *
 * @return {Object} Action object.
 */
export function multiSelect( start, end ) {
	return {
		type: 'MULTI_SELECT',
		start,
		end,
	};
}

/**
 * Returns an action object used in signalling that the block selection is cleared.
 *
 * @return {Object} Action object.
 */
export function clearSelectedBlock() {
	return {
		type: 'CLEAR_SELECTED_BLOCK',
	};
}

/**
 * Returns an action object that enables or disables block selection.
 *
 * @param {boolean} [isSelectionEnabled=true] Whether block selection should
 *                                            be enabled.
 *
 * @return {Object} Action object.
 */
export function toggleSelection( isSelectionEnabled = true ) {
	return {
		type: 'TOGGLE_SELECTION',
		isSelectionEnabled,
	};
}

function getBlocksWithDefaultStylesApplied( blocks, blockEditorSettings ) {
	const preferredStyleVariations = get(
		blockEditorSettings,
		[ '__experimentalPreferredStyleVariations', 'value' ],
		{}
	);
	return blocks.map( ( block ) => {
		const blockName = block.name;
		if ( ! preferredStyleVariations[ blockName ] ) {
			return block;
		}
		const className = get( block, [ 'attributes', 'className' ] );
		if ( includes( className, 'is-style-' ) ) {
			return block;
		}
		const { attributes = {} } = block;
		const blockStyle = preferredStyleVariations[ blockName ];
		return {
			...block,
			attributes: {
				...attributes,
				className: `${ ( className || '' ) } is-style-${ blockStyle }`.trim(),
			},
		};
	} );
}

/**
 * Returns an action object signalling that a blocks should be replaced with
 * one or more replacement blocks.
 *
 * @param {(string|string[])} clientIds     Block client ID(s) to replace.
 * @param {(Object|Object[])} blocks        Replacement block(s).
 * @param {number}            indexToSelect Index of replacement block to
 *                                          select.
 *
 * @yield {Object} Action object.
 */
export function* replaceBlocks( clientIds, blocks, indexToSelect ) {
	clientIds = castArray( clientIds );
	blocks = getBlocksWithDefaultStylesApplied(
		castArray( blocks ),
		yield select(
			'core/block-editor',
			'getSettings',
		)
	);
	const rootClientId = yield select(
		'core/block-editor',
		'getBlockRootClientId',
		first( clientIds )
	);
	// Replace is valid if the new blocks can be inserted in the root block.
	for ( let index = 0; index < blocks.length; index++ ) {
		const block = blocks[ index ];
		const canInsertBlock = yield select(
			'core/block-editor',
			'canInsertBlockType',
			block.name,
			rootClientId
		);
		if ( ! canInsertBlock ) {
			return;
		}
	}
	yield {
		type: 'REPLACE_BLOCKS',
		clientIds,
		blocks,
		time: Date.now(),
		indexToSelect,
	};
	yield* ensureDefaultBlock();
}

/**
 * Returns an action object signalling that a single block should be replaced
 * with one or more replacement blocks.
 *
 * @param {(string|string[])} clientId Block client ID to replace.
 * @param {(Object|Object[])} block    Replacement block(s).
 *
 * @return {Object} Action object.
 */
export function replaceBlock( clientId, block ) {
	return replaceBlocks( clientId, block );
}

/**
 * Higher-order action creator which, given the action type to dispatch creates
 * an action creator for managing block movement.
 *
 * @param {string} type Action type to dispatch.
 *
 * @return {Function} Action creator.
 */
function createOnMove( type ) {
	return ( clientIds, rootClientId ) => {
		return {
			clientIds: castArray( clientIds ),
			type,
			rootClientId,
		};
	};
}

export const moveBlocksDown = createOnMove( 'MOVE_BLOCKS_DOWN' );
export const moveBlocksUp = createOnMove( 'MOVE_BLOCKS_UP' );

/**
 * Returns an action object signalling that an indexed block should be moved
 * to a new index.
 *
 * @param  {?string} clientId         The client ID of the block.
 * @param  {?string} fromRootClientId Root client ID source.
 * @param  {?string} toRootClientId   Root client ID destination.
 * @param  {number}  index            The index to move the block into.
 *
 * @yield {Object} Action object.
 */
export function* moveBlockToPosition( clientId, fromRootClientId = '', toRootClientId = '', index ) {
	const templateLock = yield select(
		'core/block-editor',
		'getTemplateLock',
		fromRootClientId
	);

	// If locking is equal to all on the original clientId (fromRootClientId),
	// it is not possible to move the block to any other position.
	if ( templateLock === 'all' ) {
		return;
	}

	const action = {
		type: 'MOVE_BLOCK_TO_POSITION',
		fromRootClientId,
		toRootClientId,
		clientId,
		index,
	};
	// If moving inside the same root block the move is always possible.
	if ( fromRootClientId === toRootClientId ) {
		yield action;
		return;
	}

	// If templateLock is insert we can not remove the block from the parent.
	// Given that here we know that we are moving the block to a different parent, the move should not be possible if the condition is true.
	if ( templateLock === 'insert' ) {
		return;
	}

	const blockName = yield select(
		'core/block-editor',
		'getBlockName',
		clientId
	);

	const canInsertBlock = yield select(
		'core/block-editor',
		'canInsertBlockType',
		blockName,
		toRootClientId
	);

	// If moving to other parent block, the move is possible if we can insert a block of the same type inside the new parent block.
	if ( canInsertBlock ) {
		yield action;
	}
}

/**
 * Returns an action object used in signalling that a single block should be
 * inserted, optionally at a specific index respective a root block list.
 *
 * @param {Object}  block            Block object to insert.
 * @param {?number} index            Index at which block should be inserted.
 * @param {?string} rootClientId     Optional root client ID of block list on which to insert.
 * @param {?boolean} updateSelection If true block selection will be updated. If false, block selection will not change. Defaults to true.
 *
 * @return {Object} Action object.
 */
export function insertBlock(
	block,
	index,
	rootClientId,
	updateSelection = true,
) {
	return insertBlocks(
		[ block ],
		index,
		rootClientId,
		updateSelection
	);
}

/**
 * Returns an action object used in signalling that an array of blocks should
 * be inserted, optionally at a specific index respective a root block list.
 *
 * @param {Object[]} blocks          Block objects to insert.
 * @param {?number}  index           Index at which block should be inserted.
 * @param {?string}  rootClientId    Optional root client ID of block list on which to insert.
 * @param {?boolean} updateSelection If true block selection will be updated.  If false, block selection will not change. Defaults to true.
 *
 *  @return {Object} Action object.
 */
export function* insertBlocks(
	blocks,
	index,
	rootClientId,
	updateSelection = true
) {
	blocks = getBlocksWithDefaultStylesApplied(
		castArray( blocks ),
		yield select(
			'core/block-editor',
			'getSettings',
		)
	);
	const allowedBlocks = [];
	for ( const block of blocks ) {
		const isValid = yield select(
			'core/block-editor',
			'canInsertBlockType',
			block.name,
			rootClientId
		);
		if ( isValid ) {
			allowedBlocks.push( block );
		}
	}
	if ( allowedBlocks.length ) {
		return {
			type: 'INSERT_BLOCKS',
			blocks: allowedBlocks,
			index,
			rootClientId,
			time: Date.now(),
			updateSelection,
		};
	}
}

/**
 * Returns an action object used in signalling that the insertion point should
 * be shown.
 *
 * @param {?string} rootClientId Optional root client ID of block list on
 *                               which to insert.
 * @param {?number} index        Index at which block should be inserted.
 *
 * @return {Object} Action object.
 */
export function showInsertionPoint( rootClientId, index ) {
	return {
		type: 'SHOW_INSERTION_POINT',
		rootClientId,
		index,
	};
}

/**
 * Returns an action object hiding the insertion point.
 *
 * @return {Object} Action object.
 */
export function hideInsertionPoint() {
	return {
		type: 'HIDE_INSERTION_POINT',
	};
}

/**
 * Returns an action object resetting the template validity.
 *
 * @param {boolean}  isValid  template validity flag.
 *
 * @return {Object} Action object.
 */
export function setTemplateValidity( isValid ) {
	return {
		type: 'SET_TEMPLATE_VALIDITY',
		isValid,
	};
}

/**
 * Returns an action object synchronize the template with the list of blocks
 *
 * @return {Object} Action object.
 */
export function synchronizeTemplate() {
	return {
		type: 'SYNCHRONIZE_TEMPLATE',
	};
}

/**
 * Returns an action object used in signalling that two blocks should be merged
 *
 * @param {string} firstBlockClientId  Client ID of the first block to merge.
 * @param {string} secondBlockClientId Client ID of the second block to merge.
 *
 * @return {Object} Action object.
 */
export function mergeBlocks( firstBlockClientId, secondBlockClientId ) {
	return {
		type: 'MERGE_BLOCKS',
		blocks: [ firstBlockClientId, secondBlockClientId ],
	};
}

/**
 * Yields action objects used in signalling that the blocks corresponding to
 * the set of specified client IDs are to be removed.
 *
 * @param {string|string[]} clientIds      Client IDs of blocks to remove.
 * @param {boolean}         selectPrevious True if the previous block should be
 *                                         selected when a block is removed.
 */
export function* removeBlocks( clientIds, selectPrevious = true ) {
	if ( ! clientIds || ! clientIds.length ) {
		return;
	}

	clientIds = castArray( clientIds );
	const rootClientId = yield select( 'core/block-editor', 'getBlockRootClientId', clientIds[ 0 ] );
	const isLocked = yield select( 'core/block-editor', 'getTemplateLock', rootClientId );
	if ( isLocked ) {
		return;
	}

	if ( selectPrevious ) {
		yield selectPreviousBlock( clientIds[ 0 ] );
	}

	yield {
		type: 'REMOVE_BLOCKS',
		clientIds,
	};

	// To avoid a focus loss when removing the last block, assure there is
	// always a default block if the last of the blocks have been removed.
	yield* ensureDefaultBlock();
}

/**
 * Returns an action object used in signalling that the block with the
 * specified client ID is to be removed.
 *
 * @param {string}  clientId       Client ID of block to remove.
 * @param {boolean} selectPrevious True if the previous block should be
 *                                 selected when a block is removed.
 *
 * @return {Object} Action object.
 */
export function removeBlock( clientId, selectPrevious ) {
	return removeBlocks( [ clientId ], selectPrevious );
}

/**
 * Returns an action object used in signalling that the inner blocks with the
 * specified client ID should be replaced.
 *
 * @param {string}   rootClientId    Client ID of the block whose InnerBlocks will re replaced.
 * @param {Object[]} blocks          Block objects to insert as new InnerBlocks
 * @param {?boolean} updateSelection If true block selection will be updated. If false, block selection will not change. Defaults to true.
 *
 * @return {Object} Action object.
 */
export function replaceInnerBlocks( rootClientId, blocks, updateSelection = true ) {
	return {
		type: 'REPLACE_INNER_BLOCKS',
		rootClientId,
		blocks,
		updateSelection,
		time: Date.now(),
	};
}

/**
 * Returns an action object used to toggle the block editing mode between
 * visual and HTML modes.
 *
 * @param {string} clientId Block client ID.
 *
 * @return {Object} Action object.
 */
export function toggleBlockMode( clientId ) {
	return {
		type: 'TOGGLE_BLOCK_MODE',
		clientId,
	};
}

/**
 * Returns an action object used in signalling that the user has begun to type.
 *
 * @return {Object} Action object.
 */
export function startTyping() {
	return {
		type: 'START_TYPING',
	};
}

/**
 * Returns an action object used in signalling that the user has stopped typing.
 *
 * @return {Object} Action object.
 */
export function stopTyping() {
	return {
		type: 'STOP_TYPING',
	};
}

/**
 * Returns an action object used in signalling that the user has begun to drag blocks.
 *
 * @return {Object} Action object.
 */
export function startDraggingBlocks() {
	return {
		type: 'START_DRAGGING_BLOCKS',
	};
}

/**
 * Returns an action object used in signalling that the user has stopped dragging blocks.
 *
 * @return {Object} Action object.
 */
export function stopDraggingBlocks() {
	return {
		type: 'STOP_DRAGGING_BLOCKS',
	};
}

/**
 * Returns an action object used in signalling that the caret has entered formatted text.
 *
 * @return {Object} Action object.
 */
export function enterFormattedText() {
	return {
		type: 'ENTER_FORMATTED_TEXT',
	};
}

/**
 * Returns an action object used in signalling that the user caret has exited formatted text.
 *
 * @return {Object} Action object.
 */
export function exitFormattedText() {
	return {
		type: 'EXIT_FORMATTED_TEXT',
	};
}

/**
 * Returns an action object used in signalling that the user caret has changed
 * position.
 *
 * @param {string} clientId     The selected block client ID.
 * @param {string} attributeKey The selected block attribute key.
 * @param {number} startOffset  The start offset.
 * @param {number} endOffset    The end offset.
 *
 * @return {Object} Action object.
 */
export function selectionChange( clientId, attributeKey, startOffset, endOffset ) {
	return {
		type: 'SELECTION_CHANGE',
		clientId,
		attributeKey,
		startOffset,
		endOffset,
	};
}

/**
 * Returns an action object used in signalling that a new block of the default
 * type should be added to the block list.
 *
 * @param {?Object} attributes   Optional attributes of the block to assign.
 * @param {?string} rootClientId Optional root client ID of block list on which
 *                               to append.
 * @param {?number} index        Optional index where to insert the default block
 *
 * @return {Object} Action object
 */
export function insertDefaultBlock( attributes, rootClientId, index ) {
	// Abort if there is no default block type (if it has been unregistered).
	const defaultBlockName = getDefaultBlockName();
	if ( ! defaultBlockName ) {
		return;
	}

	const block = createBlock( defaultBlockName, attributes );

	return insertBlock( block, index, rootClientId );
}

/**
 * Returns an action object that changes the nested settings of a given block.
 *
 * @param {string} clientId Client ID of the block whose nested setting are
 *                          being received.
 * @param {Object} settings Object with the new settings for the nested block.
 *
 * @return {Object} Action object
 */
export function updateBlockListSettings( clientId, settings ) {
	return {
		type: 'UPDATE_BLOCK_LIST_SETTINGS',
		clientId,
		settings,
	};
}

/*
 * Returns an action object used in signalling that the block editor settings have been updated.
 *
 * @param {Object} settings Updated settings
 *
 * @return {Object} Action object
 */
export function updateSettings( settings ) {
	return {
		type: 'UPDATE_SETTINGS',
		settings,
	};
}

/**
 * Returns an action object used in signalling that a temporary reusable blocks have been saved
 * in order to switch its temporary id with the real id.
 *
 * @param {string} id        Reusable block's id.
 * @param {string} updatedId Updated block's id.
 *
 * @return {Object} Action object.
 */
export function __unstableSaveReusableBlock( id, updatedId ) {
	return {
		type: 'SAVE_REUSABLE_BLOCK_SUCCESS',
		id,
		updatedId,
	};
}

/**
 * Returns an action object used in signalling that the last block change should be marked explicitely as persistent.
 *
 * @return {Object} Action object.
 */
export function __unstableMarkLastChangeAsPersistent() {
	return { type: 'MARK_LAST_CHANGE_AS_PERSISTENT' };
}

/**
 * Returns an action object used in signalling that the last block change is
 * an automatic change, meaning it was not performed by the user, and can be
 * undone using the `Escape` and `Backspace` keys. This action must be called
 * after the change was made, and any actions that are a consequence of it, so
 * it is recommended to be called at the next idle period to ensure all
 * selection changes have been recorded.
 *
 * @return {Object} Action object.
 */
export function __unstableMarkAutomaticChange() {
	return { type: 'MARK_AUTOMATIC_CHANGE' };
}

/**
 * Generators that triggers an action used to enable or disable the navigation mode.
 *
 * @param {string} isNavigationMode Enable/Disable navigation mode.
 */
export function * setNavigationMode( isNavigationMode = true ) {
	yield {
		type: 'SET_NAVIGATION_MODE',
		isNavigationMode,
	};

	if ( isNavigationMode ) {
		speak( __( 'You are currently in navigation mode. Navigate blocks using the Tab key. To exit navigation mode and edit the selected block, press Enter.' ) );
	} else {
		speak( __( 'You are currently in edit mode. To return to the navigation mode, press Escape.' ) );
	}
}

/**
 * Generator that triggers an action used to duplicate a list of blocks.
 *
 * @param {string[]} clientIds
 */
export function * duplicateBlocks( clientIds ) {
	if ( ! clientIds && ! clientIds.length ) {
		return;
	}
	const blocks = yield select( 'core/block-editor', 'getBlocksByClientId', clientIds );
	const rootClientId = yield select( 'core/block-editor', 'getBlockRootClientId', clientIds[ 0 ] );
	// Return early if blocks don't exist.
	if ( some( blocks, ( block ) => ! block ) ) {
		return;
	}
	const blockNames = blocks.map( ( block ) => block.name );
	// Return early if blocks don't support multipe  usage.
	if ( some( blockNames, ( blockName ) => ! hasBlockSupport( blockName, 'multiple', true ) ) ) {
		return;
	}

	const lastSelectedIndex = yield select(
		'core/block-editor',
		'getBlockIndex',
		last( castArray( clientIds ) ),
		rootClientId
	);
	const clonedBlocks = blocks.map( ( block ) => cloneBlock( block ) );
	yield insertBlocks(
		clonedBlocks,
		lastSelectedIndex + 1,
		rootClientId
	);
	if ( clonedBlocks.length > 1 ) {
		yield multiSelect(
			first( clonedBlocks ).clientId,
			last( clonedBlocks ).clientId
		);
	}
}

/**
 * Generator used to insert an empty block after a given block.
 *
 * @param {string} clientId
 */
export function * insertBeforeBlock( clientId ) {
	if ( ! clientId ) {
		return;
	}
	const rootClientId = yield select( 'core/block-editor', 'getBlockRootClientId', clientId );
	const isLocked = yield select( 'core/block-editor', 'getTemplateLock', rootClientId );
	if ( isLocked ) {
		return;
	}

	const firstSelectedIndex = yield select( 'core/block-editor', 'getBlockIndex', clientId, rootClientId );
	yield insertDefaultBlock( {}, rootClientId, firstSelectedIndex );
}

/**
 * Generator used to insert an empty block before a given block.
 *
 * @param {string} clientId
 */
export function * insertAfterBlock( clientId ) {
	if ( ! clientId ) {
		return;
	}
	const rootClientId = yield select( 'core/block-editor', 'getBlockRootClientId', clientId );
	const isLocked = yield select( 'core/block-editor', 'getTemplateLock', rootClientId );
	if ( isLocked ) {
		return;
	}

	const firstSelectedIndex = yield select( 'core/block-editor', 'getBlockIndex', clientId, rootClientId );
	yield insertDefaultBlock( {}, rootClientId, firstSelectedIndex + 1 );
}
