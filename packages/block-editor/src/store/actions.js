/**
 * External dependencies
 */
import { castArray, findKey, first, isObject, last, some } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	cloneBlock,
	__experimentalCloneSanitizedBlock,
	createBlock,
	doBlocksMatchTemplate,
	getBlockType,
	getDefaultBlockName,
	hasBlockSupport,
	switchToBlockType,
	synchronizeBlocksWithTemplate,
} from '@wordpress/blocks';
import { speak } from '@wordpress/a11y';
import { __, _n, sprintf } from '@wordpress/i18n';
import { controls } from '@wordpress/data';
import { create, insert, remove, toHTMLString } from '@wordpress/rich-text';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { __unstableMarkAutomaticChangeFinalControl } from '../store/controls';
import { STORE_NAME as blockEditorStoreName } from './constants';

/**
 * Generator which will yield a default block insert action if there
 * are no other blocks at the root of the editor. This generator should be used
 * in actions which may result in no blocks remaining in the editor (removal,
 * replacement, etc).
 */
function* ensureDefaultBlock() {
	const count = yield controls.select(
		blockEditorStoreName,
		'getBlockCount'
	);

	// To avoid a focus loss when removing the last block, assure there is
	// always a default block if the last of the blocks have been removed.
	if ( count === 0 ) {
		return yield insertDefaultBlock();
	}
}

/**
 * Returns an action object used in signalling that blocks state should be
 * reset to the specified array of blocks, taking precedence over any other
 * content reflected as an edit in state.
 *
 * @param {Array} blocks Array of blocks.
 */
export function* resetBlocks( blocks ) {
	yield {
		type: 'RESET_BLOCKS',
		blocks,
	};
	return yield* validateBlocksToTemplate( blocks );
}

/**
 * Block validity is a function of blocks state (at the point of a
 * reset) and the template setting. As a compromise to its placement
 * across distinct parts of state, it is implemented here as a side-
 * effect of the block reset action.
 *
 * @param {Array} blocks Array of blocks.
 */
export function* validateBlocksToTemplate( blocks ) {
	const template = yield controls.select(
		blockEditorStoreName,
		'getTemplate'
	);
	const templateLock = yield controls.select(
		blockEditorStoreName,
		'getTemplateLock'
	);

	// Unlocked templates are considered always valid because they act
	// as default values only.
	const isBlocksValidToTemplate =
		! template ||
		templateLock !== 'all' ||
		doBlocksMatchTemplate( blocks, template );

	// Update if validity has changed.
	const isValidTemplate = yield controls.select(
		blockEditorStoreName,
		'isValidTemplate'
	);

	if ( isBlocksValidToTemplate !== isValidTemplate ) {
		yield setTemplateValidity( isBlocksValidToTemplate );
		return isBlocksValidToTemplate;
	}
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
 * @param {WPBlockSelection} selectionStart  The selection start.
 * @param {WPBlockSelection} selectionEnd    The selection end.
 * @param {0|-1|null}        initialPosition Initial block position.
 *
 * @return {Object} Action object.
 */
export function resetSelection(
	selectionStart,
	selectionEnd,
	initialPosition
) {
	return {
		type: 'RESET_SELECTION',
		selectionStart,
		selectionEnd,
		initialPosition,
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
 * Returns an action object used in signalling that the multiple blocks'
 * attributes with the specified client IDs have been updated.
 *
 * @param {string|string[]} clientIds  Block client IDs.
 * @param {Object}          attributes Block attributes to be merged. Should be keyed by clientIds if
 * uniqueByBlock is true.
 * @param {boolean}          uniqueByBlock true if each block in clientIds array has a unique set of attributes
 * @return {Object} Action object.
 */
export function updateBlockAttributes(
	clientIds,
	attributes,
	uniqueByBlock = false
) {
	return {
		type: 'UPDATE_BLOCK_ATTRIBUTES',
		clientIds: castArray( clientIds ),
		attributes,
		uniqueByBlock,
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
 * @param {string}    clientId        Block client ID.
 * @param {0|-1|null} initialPosition Optional initial position. Pass as -1 to
 *                                  reflect reverse selection.
 *
 * @return {Object} Action object.
 */
export function selectBlock( clientId, initialPosition = 0 ) {
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
	const previousBlockClientId = yield controls.select(
		blockEditorStoreName,
		'getPreviousBlockClientId',
		clientId
	);

	if ( previousBlockClientId ) {
		yield selectBlock( previousBlockClientId, -1 );
		return [ previousBlockClientId ];
	}
}

/**
 * Yields action objects used in signalling that the block following the given
 * clientId should be selected.
 *
 * @param {string} clientId Block client ID.
 */
export function* selectNextBlock( clientId ) {
	const nextBlockClientId = yield controls.select(
		blockEditorStoreName,
		'getNextBlockClientId',
		clientId
	);

	if ( nextBlockClientId ) {
		yield selectBlock( nextBlockClientId );
		return [ nextBlockClientId ];
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
 */
export function* multiSelect( start, end ) {
	yield {
		type: 'MULTI_SELECT',
		start,
		end,
	};

	const blockCount = yield controls.select(
		blockEditorStoreName,
		'getSelectedBlockCount'
	);

	speak(
		sprintf(
			/* translators: %s: number of selected blocks */
			_n( '%s block selected.', '%s blocks selected.', blockCount ),
			blockCount
		),
		'assertive'
	);
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
	const preferredStyleVariations =
		blockEditorSettings?.__experimentalPreferredStyleVariations?.value ??
		{};
	return blocks.map( ( block ) => {
		const blockName = block.name;
		if ( ! hasBlockSupport( blockName, 'defaultStylePicker', true ) ) {
			return block;
		}
		if ( ! preferredStyleVariations[ blockName ] ) {
			return block;
		}
		const className = block.attributes?.className;
		if ( className?.includes( 'is-style-' ) ) {
			return block;
		}
		const { attributes = {} } = block;
		const blockStyle = preferredStyleVariations[ blockName ];
		return {
			...block,
			attributes: {
				...attributes,
				className: `${
					className || ''
				} is-style-${ blockStyle }`.trim(),
			},
		};
	} );
}

/**
 * Returns an action object signalling that a blocks should be replaced with
 * one or more replacement blocks.
 *
 * @param {(string|string[])} clientIds       Block client ID(s) to replace.
 * @param {(Object|Object[])} blocks          Replacement block(s).
 * @param {number}            indexToSelect   Index of replacement block to select.
 * @param {0|-1|null}         initialPosition Index of caret after in the selected block after the operation.
 * @param {?Object}           meta            Optional Meta values to be passed to the action object.
 *
 * @yield {Object} Action object.
 */
export function* replaceBlocks(
	clientIds,
	blocks,
	indexToSelect,
	initialPosition = 0,
	meta
) {
	clientIds = castArray( clientIds );
	blocks = getBlocksWithDefaultStylesApplied(
		castArray( blocks ),
		yield controls.select( blockEditorStoreName, 'getSettings' )
	);
	const rootClientId = yield controls.select(
		blockEditorStoreName,
		'getBlockRootClientId',
		first( clientIds )
	);
	// Replace is valid if the new blocks can be inserted in the root block.
	for ( let index = 0; index < blocks.length; index++ ) {
		const block = blocks[ index ];
		const canInsertBlock = yield controls.select(
			blockEditorStoreName,
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
		initialPosition,
		meta,
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
 * Returns an action object signalling that the given blocks should be moved to
 * a new position.
 *
 * @param  {?string} clientIds        The client IDs of the blocks.
 * @param  {?string} fromRootClientId Root client ID source.
 * @param  {?string} toRootClientId   Root client ID destination.
 * @param  {number}  index            The index to move the blocks to.
 *
 * @yield {Object} Action object.
 */
export function* moveBlocksToPosition(
	clientIds,
	fromRootClientId = '',
	toRootClientId = '',
	index
) {
	const templateLock = yield controls.select(
		blockEditorStoreName,
		'getTemplateLock',
		fromRootClientId
	);

	// If locking is equal to all on the original clientId (fromRootClientId),
	// it is not possible to move the block to any other position.
	if ( templateLock === 'all' ) {
		return;
	}

	const action = {
		type: 'MOVE_BLOCKS_TO_POSITION',
		fromRootClientId,
		toRootClientId,
		clientIds,
		index,
	};

	// If moving inside the same root block the move is always possible.
	if ( fromRootClientId === toRootClientId ) {
		yield action;
		return;
	}

	// If templateLock is insert we can not remove the block from the parent.
	// Given that here we know that we are moving the block to a different
	// parent, the move should not be possible if the condition is true.
	if ( templateLock === 'insert' ) {
		return;
	}

	const canInsertBlocks = yield controls.select(
		blockEditorStoreName,
		'canInsertBlocks',
		clientIds,
		toRootClientId
	);

	// If moving to other parent block, the move is possible if we can insert a block of the same type inside the new parent block.
	if ( canInsertBlocks ) {
		yield action;
	}
}

/**
 * Returns an action object signalling that the given block should be moved to a
 * new position.
 *
 * @param  {?string} clientId         The client ID of the block.
 * @param  {?string} fromRootClientId Root client ID source.
 * @param  {?string} toRootClientId   Root client ID destination.
 * @param  {number}  index            The index to move the block to.
 *
 * @yield {Object} Action object.
 */
export function* moveBlockToPosition(
	clientId,
	fromRootClientId = '',
	toRootClientId = '',
	index
) {
	yield moveBlocksToPosition(
		[ clientId ],
		fromRootClientId,
		toRootClientId,
		index
	);
}

/**
 * Returns an action object used in signalling that a single block should be
 * inserted, optionally at a specific index respective a root block list.
 *
 * @param {Object}  block            Block object to insert.
 * @param {?number} index            Index at which block should be inserted.
 * @param {?string} rootClientId     Optional root client ID of block list on which to insert.
 * @param {?boolean} updateSelection If true block selection will be updated. If false, block selection will not change. Defaults to true.
 * @param {?Object} meta             Optional Meta values to be passed to the action object.
 *
 * @return {Object} Action object.
 */
export function insertBlock(
	block,
	index,
	rootClientId,
	updateSelection = true,
	meta
) {
	return insertBlocks(
		[ block ],
		index,
		rootClientId,
		updateSelection,
		0,
		meta
	);
}

/**
 * Returns an action object used in signalling that an array of blocks should
 * be inserted, optionally at a specific index respective a root block list.
 *
 * @param {Object[]}  blocks          Block objects to insert.
 * @param {?number}   index           Index at which block should be inserted.
 * @param {?string}   rootClientId    Optional root client ID of block list on which to insert.
 * @param {?boolean}  updateSelection If true block selection will be updated.  If false, block selection will not change. Defaults to true.
 * @param {0|-1|null} initialPosition Initial focus position. Setting it to null prevent focusing the inserted block.
 * @param {?Object}   meta            Optional Meta values to be passed to the action object.
 * @return {Object} Action object.
 */
export function* insertBlocks(
	blocks,
	index,
	rootClientId,
	updateSelection = true,
	initialPosition = 0,
	meta
) {
	if ( isObject( initialPosition ) ) {
		meta = initialPosition;
		initialPosition = 0;
		deprecated( "meta argument in wp.data.dispatch('core/block-editor')", {
			since: '10.1',
			plugin: 'Gutenberg',
			hint: 'The meta argument is now the 6th argument of the function',
		} );
	}

	blocks = getBlocksWithDefaultStylesApplied(
		castArray( blocks ),
		yield controls.select( blockEditorStoreName, 'getSettings' )
	);
	const allowedBlocks = [];
	for ( const block of blocks ) {
		const isValid = yield controls.select(
			blockEditorStoreName,
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
			initialPosition: updateSelection ? initialPosition : null,
			meta,
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
export function* synchronizeTemplate() {
	yield {
		type: 'SYNCHRONIZE_TEMPLATE',
	};
	const blocks = yield controls.select( blockEditorStoreName, 'getBlocks' );
	const template = yield controls.select(
		blockEditorStoreName,
		'getTemplate'
	);
	const updatedBlockList = synchronizeBlocksWithTemplate( blocks, template );

	return yield resetBlocks( updatedBlockList );
}

/**
 * Returns an action object used in signalling that two blocks should be merged
 *
 * @param {string} firstBlockClientId  Client ID of the first block to merge.
 * @param {string} secondBlockClientId Client ID of the second block to merge.
 */
export function* mergeBlocks( firstBlockClientId, secondBlockClientId ) {
	const blocks = [ firstBlockClientId, secondBlockClientId ];
	yield {
		type: 'MERGE_BLOCKS',
		blocks,
	};

	const [ clientIdA, clientIdB ] = blocks;
	const blockA = yield controls.select(
		blockEditorStoreName,
		'getBlock',
		clientIdA
	);
	const blockAType = getBlockType( blockA.name );

	// Only focus the previous block if it's not mergeable
	if ( ! blockAType.merge ) {
		yield selectBlock( blockA.clientId );
		return;
	}

	const blockB = yield controls.select(
		blockEditorStoreName,
		'getBlock',
		clientIdB
	);
	const blockBType = getBlockType( blockB.name );
	const { clientId, attributeKey, offset } = yield controls.select(
		blockEditorStoreName,
		'getSelectionStart'
	);
	const selectedBlockType = clientId === clientIdA ? blockAType : blockBType;
	const attributeDefinition = selectedBlockType.attributes[ attributeKey ];
	const canRestoreTextSelection =
		( clientId === clientIdA || clientId === clientIdB ) &&
		attributeKey !== undefined &&
		offset !== undefined &&
		// We cannot restore text selection if the RichText identifier
		// is not a defined block attribute key. This can be the case if the
		// fallback intance ID is used to store selection (and no RichText
		// identifier is set), or when the identifier is wrong.
		!! attributeDefinition;

	if ( ! attributeDefinition ) {
		if ( typeof attributeKey === 'number' ) {
			window.console.error(
				`RichText needs an identifier prop that is the block attribute key of the attribute it controls. Its type is expected to be a string, but was ${ typeof attributeKey }`
			);
		} else {
			window.console.error(
				'The RichText identifier prop does not match any attributes defined by the block.'
			);
		}
	}

	// A robust way to retain selection position through various transforms
	// is to insert a special character at the position and then recover it.
	const START_OF_SELECTED_AREA = '\u0086';

	// Clone the blocks so we don't insert the character in a "live" block.
	const cloneA = cloneBlock( blockA );
	const cloneB = cloneBlock( blockB );

	if ( canRestoreTextSelection ) {
		const selectedBlock = clientId === clientIdA ? cloneA : cloneB;
		const html = selectedBlock.attributes[ attributeKey ];
		const {
			multiline: multilineTag,
			__unstableMultilineWrapperTags: multilineWrapperTags,
			__unstablePreserveWhiteSpace: preserveWhiteSpace,
		} = attributeDefinition;
		const value = insert(
			create( {
				html,
				multilineTag,
				multilineWrapperTags,
				preserveWhiteSpace,
			} ),
			START_OF_SELECTED_AREA,
			offset,
			offset
		);

		selectedBlock.attributes[ attributeKey ] = toHTMLString( {
			value,
			multilineTag,
			preserveWhiteSpace,
		} );
	}

	// We can only merge blocks with similar types
	// thus, we transform the block to merge first
	const blocksWithTheSameType =
		blockA.name === blockB.name
			? [ cloneB ]
			: switchToBlockType( cloneB, blockA.name );

	// If the block types can not match, do nothing
	if ( ! blocksWithTheSameType || ! blocksWithTheSameType.length ) {
		return;
	}

	// Calling the merge to update the attributes and remove the block to be merged
	const updatedAttributes = blockAType.merge(
		cloneA.attributes,
		blocksWithTheSameType[ 0 ].attributes
	);

	if ( canRestoreTextSelection ) {
		const newAttributeKey = findKey(
			updatedAttributes,
			( v ) =>
				typeof v === 'string' &&
				v.indexOf( START_OF_SELECTED_AREA ) !== -1
		);
		const convertedHtml = updatedAttributes[ newAttributeKey ];
		const {
			multiline: multilineTag,
			__unstableMultilineWrapperTags: multilineWrapperTags,
			__unstablePreserveWhiteSpace: preserveWhiteSpace,
		} = blockAType.attributes[ newAttributeKey ];
		const convertedValue = create( {
			html: convertedHtml,
			multilineTag,
			multilineWrapperTags,
			preserveWhiteSpace,
		} );
		const newOffset = convertedValue.text.indexOf( START_OF_SELECTED_AREA );
		const newValue = remove( convertedValue, newOffset, newOffset + 1 );
		const newHtml = toHTMLString( {
			value: newValue,
			multilineTag,
			preserveWhiteSpace,
		} );

		updatedAttributes[ newAttributeKey ] = newHtml;

		yield selectionChange(
			blockA.clientId,
			newAttributeKey,
			newOffset,
			newOffset
		);
	}

	yield* replaceBlocks(
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
	);
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
	const rootClientId = yield controls.select(
		blockEditorStoreName,
		'getBlockRootClientId',
		clientIds[ 0 ]
	);
	const isLocked = yield controls.select(
		blockEditorStoreName,
		'getTemplateLock',
		rootClientId
	);
	if ( isLocked ) {
		return;
	}

	let previousBlockId;
	if ( selectPrevious ) {
		previousBlockId = yield selectPreviousBlock( clientIds[ 0 ] );
	} else {
		previousBlockId = yield controls.select(
			blockEditorStoreName,
			'getPreviousBlockClientId',
			clientIds[ 0 ]
		);
	}

	yield {
		type: 'REMOVE_BLOCKS',
		clientIds,
	};

	// To avoid a focus loss when removing the last block, assure there is
	// always a default block if the last of the blocks have been removed.
	const defaultBlockId = yield* ensureDefaultBlock();
	return [ previousBlockId || defaultBlockId ];
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
 * @param {string}    rootClientId    Client ID of the block whose InnerBlocks will re replaced.
 * @param {Object[]}  blocks          Block objects to insert as new InnerBlocks
 * @param {?boolean}  updateSelection If true block selection will be updated. If false, block selection will not change. Defaults to false.
 * @param {0|-1|null} initialPosition Initial block position.
 * @return {Object} Action object.
 */
export function replaceInnerBlocks(
	rootClientId,
	blocks,
	updateSelection = false,
	initialPosition = 0
) {
	return {
		type: 'REPLACE_INNER_BLOCKS',
		rootClientId,
		blocks,
		updateSelection,
		initialPosition: updateSelection ? initialPosition : null,
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
 * @param {string[]} clientIds An array of client ids being dragged
 *
 * @return {Object} Action object.
 */
export function startDraggingBlocks( clientIds = [] ) {
	return {
		type: 'START_DRAGGING_BLOCKS',
		clientIds,
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
export function selectionChange(
	clientId,
	attributeKey,
	startOffset,
	endOffset
) {
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

/**
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
 * Returns an action object used in signalling that the last block change should be marked explicitly as persistent.
 *
 * @return {Object} Action object.
 */
export function __unstableMarkLastChangeAsPersistent() {
	return { type: 'MARK_LAST_CHANGE_AS_PERSISTENT' };
}

/**
 * Returns an action object used in signalling that the next block change should be marked explicitly as not persistent.
 *
 * @return {Object} Action object.
 */
export function __unstableMarkNextChangeAsNotPersistent() {
	return { type: 'MARK_NEXT_CHANGE_AS_NOT_PERSISTENT' };
}

/**
 * Returns an action object used in signalling that the last block change is
 * an automatic change, meaning it was not performed by the user, and can be
 * undone using the `Escape` and `Backspace` keys. This action must be called
 * after the change was made, and any actions that are a consequence of it, so
 * it is recommended to be called at the next idle period to ensure all
 * selection changes have been recorded.
 */
export function* __unstableMarkAutomaticChange() {
	yield { type: 'MARK_AUTOMATIC_CHANGE' };
	yield __unstableMarkAutomaticChangeFinalControl();
}

export function __unstableMarkAutomaticChangeFinal() {
	return {
		type: 'MARK_AUTOMATIC_CHANGE_FINAL',
	};
}

/**
 * Generators that triggers an action used to enable or disable the navigation mode.
 *
 * @param {string} isNavigationMode Enable/Disable navigation mode.
 */
export function* setNavigationMode( isNavigationMode = true ) {
	yield {
		type: 'SET_NAVIGATION_MODE',
		isNavigationMode,
	};

	if ( isNavigationMode ) {
		speak(
			__(
				'You are currently in navigation mode. Navigate blocks using the Tab key and Arrow keys. Use Left and Right Arrow keys to move between nesting levels. To exit navigation mode and edit the selected block, press Enter.'
			)
		);
	} else {
		speak(
			__(
				'You are currently in edit mode. To return to the navigation mode, press Escape.'
			)
		);
	}
}

/**
 * Generator that triggers an action used to enable or disable the block moving mode.
 *
 * @param {string|null} hasBlockMovingClientId Enable/Disable block moving mode.
 */
export function* setBlockMovingClientId( hasBlockMovingClientId = null ) {
	yield {
		type: 'SET_BLOCK_MOVING_MODE',
		hasBlockMovingClientId,
	};

	if ( hasBlockMovingClientId ) {
		speak(
			__(
				'Use the Tab key and Arrow keys to choose new block location. Use Left and Right Arrow keys to move between nesting levels. Once location is selected press Enter or Space to move the block.'
			)
		);
	}
}

/**
 * Generator that triggers an action used to duplicate a list of blocks.
 *
 * @param {string[]} clientIds
 * @param {boolean} updateSelection
 */
export function* duplicateBlocks( clientIds, updateSelection = true ) {
	if ( ! clientIds && ! clientIds.length ) {
		return;
	}
	const blocks = yield controls.select(
		blockEditorStoreName,
		'getBlocksByClientId',
		clientIds
	);
	const rootClientId = yield controls.select(
		blockEditorStoreName,
		'getBlockRootClientId',
		clientIds[ 0 ]
	);
	// Return early if blocks don't exist.
	if ( some( blocks, ( block ) => ! block ) ) {
		return;
	}
	const blockNames = blocks.map( ( block ) => block.name );
	// Return early if blocks don't support multiple usage.
	if (
		some(
			blockNames,
			( blockName ) => ! hasBlockSupport( blockName, 'multiple', true )
		)
	) {
		return;
	}

	const lastSelectedIndex = yield controls.select(
		blockEditorStoreName,
		'getBlockIndex',
		last( castArray( clientIds ) ),
		rootClientId
	);
	const clonedBlocks = blocks.map( ( block ) =>
		__experimentalCloneSanitizedBlock( block )
	);
	yield insertBlocks(
		clonedBlocks,
		lastSelectedIndex + 1,
		rootClientId,
		updateSelection
	);
	if ( clonedBlocks.length > 1 && updateSelection ) {
		yield multiSelect(
			first( clonedBlocks ).clientId,
			last( clonedBlocks ).clientId
		);
	}
	return clonedBlocks.map( ( block ) => block.clientId );
}

/**
 * Generator used to insert an empty block after a given block.
 *
 * @param {string} clientId
 */
export function* insertBeforeBlock( clientId ) {
	if ( ! clientId ) {
		return;
	}
	const rootClientId = yield controls.select(
		blockEditorStoreName,
		'getBlockRootClientId',
		clientId
	);
	const isLocked = yield controls.select(
		blockEditorStoreName,
		'getTemplateLock',
		rootClientId
	);
	if ( isLocked ) {
		return;
	}

	const firstSelectedIndex = yield controls.select(
		blockEditorStoreName,
		'getBlockIndex',
		clientId,
		rootClientId
	);
	return yield insertDefaultBlock( {}, rootClientId, firstSelectedIndex );
}

/**
 * Generator used to insert an empty block before a given block.
 *
 * @param {string} clientId
 */
export function* insertAfterBlock( clientId ) {
	if ( ! clientId ) {
		return;
	}
	const rootClientId = yield controls.select(
		blockEditorStoreName,
		'getBlockRootClientId',
		clientId
	);
	const isLocked = yield controls.select(
		blockEditorStoreName,
		'getTemplateLock',
		rootClientId
	);
	if ( isLocked ) {
		return;
	}

	const firstSelectedIndex = yield controls.select(
		blockEditorStoreName,
		'getBlockIndex',
		clientId,
		rootClientId
	);
	return yield insertDefaultBlock( {}, rootClientId, firstSelectedIndex + 1 );
}

/**
 * Returns an action object that toggles the highlighted block state.
 *
 * @param {string} clientId The block's clientId.
 * @param {boolean} isHighlighted The highlight state.
 */
export function toggleBlockHighlight( clientId, isHighlighted ) {
	return {
		type: 'TOGGLE_BLOCK_HIGHLIGHT',
		clientId,
		isHighlighted,
	};
}

/**
 * Yields action objects used in signalling that the block corresponding to the
 * given clientId should appear to "flash" by rhythmically highlighting it.
 *
 * @param {string} clientId Target block client ID.
 */
export function* flashBlock( clientId ) {
	yield toggleBlockHighlight( clientId, true );
	yield {
		type: 'SLEEP',
		duration: 150,
	};
	yield toggleBlockHighlight( clientId, false );
}

/**
 * Returns an action object that sets whether the block has controlled innerblocks.
 *
 * @param {string} clientId The block's clientId.
 * @param {boolean} hasControlledInnerBlocks True if the block's inner blocks are controlled.
 */
export function setHasControlledInnerBlocks(
	clientId,
	hasControlledInnerBlocks
) {
	return {
		type: 'SET_HAS_CONTROLLED_INNER_BLOCKS',
		hasControlledInnerBlocks,
		clientId,
	};
}
