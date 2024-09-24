/* eslint no-console: [ 'error', { allow: [ 'error', 'warn' ] } ] */
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
	getBlockSupport,
	isUnmodifiedDefaultBlock,
	isUnmodifiedBlock,
} from '@wordpress/blocks';
import { speak } from '@wordpress/a11y';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { create, insert, remove, toHTMLString } from '@wordpress/rich-text';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import {
	retrieveSelectedAttribute,
	findRichTextAttributeKey,
	START_OF_SELECTED_AREA,
} from '../utils/selection';
import {
	__experimentalUpdateSettings,
	privateRemoveBlocks,
} from './private-actions';

/** @typedef {import('../components/use-on-block-drop/types').WPDropOperation} WPDropOperation */

const castArray = ( maybeArray ) =>
	Array.isArray( maybeArray ) ? maybeArray : [ maybeArray ];

/**
 * Action that resets blocks state to the specified array of blocks, taking precedence
 * over any other content reflected as an edit in state.
 *
 * @param {Array} blocks Array of blocks.
 */
export const resetBlocks =
	( blocks ) =>
	( { dispatch } ) => {
		dispatch( { type: 'RESET_BLOCKS', blocks } );
		dispatch( validateBlocksToTemplate( blocks ) );
	};

/**
 * Block validity is a function of blocks state (at the point of a
 * reset) and the template setting. As a compromise to its placement
 * across distinct parts of state, it is implemented here as a side
 * effect of the block reset action.
 *
 * @param {Array} blocks Array of blocks.
 */
export const validateBlocksToTemplate =
	( blocks ) =>
	( { select, dispatch } ) => {
		const template = select.getTemplate();
		const templateLock = select.getTemplateLock();

		// Unlocked templates are considered always valid because they act
		// as default values only.
		const isBlocksValidToTemplate =
			! template ||
			templateLock !== 'all' ||
			doBlocksMatchTemplate( blocks, template );

		// Update if validity has changed.
		const isValidTemplate = select.isValidTemplate();

		if ( isBlocksValidToTemplate !== isValidTemplate ) {
			dispatch.setTemplateValidity( isBlocksValidToTemplate );
			return isBlocksValidToTemplate;
		}
	};

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
 * A selection object.
 *
 * @typedef {Object} WPSelection
 *
 * @property {WPBlockSelection} start The selection start.
 * @property {WPBlockSelection} end   The selection end.
 */

/* eslint-disable jsdoc/valid-types */
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
	/* eslint-enable jsdoc/valid-types */
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
 * @deprecated
 *
 * @param {Object[]} blocks Array of block objects.
 *
 * @return {Object} Action object.
 */
export function receiveBlocks( blocks ) {
	deprecated( 'wp.data.dispatch( "core/block-editor" ).receiveBlocks', {
		since: '5.9',
		alternative: 'resetBlocks or insertBlocks',
	} );

	return {
		type: 'RECEIVE_BLOCKS',
		blocks,
	};
}

/**
 * Action that updates attributes of multiple blocks with the specified client IDs.
 *
 * @param {string|string[]} clientIds     Block client IDs.
 * @param {Object}          attributes    Block attributes to be merged. Should be keyed by clientIds if
 *                                        uniqueByBlock is true.
 * @param {boolean}         uniqueByBlock true if each block in clientIds array has a unique set of attributes
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
 * Action that updates the block with the specified client ID.
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

/* eslint-disable jsdoc/valid-types */
/**
 * Returns an action object used in signalling that the block with the
 * specified client ID has been selected, optionally accepting a position
 * value reflecting its selection directionality. An initialPosition of -1
 * reflects a reverse selection.
 *
 * @param {string}    clientId        Block client ID.
 * @param {0|-1|null} initialPosition Optional initial position. Pass as -1 to
 *                                    reflect reverse selection.
 *
 * @return {Object} Action object.
 */
export function selectBlock( clientId, initialPosition = 0 ) {
	/* eslint-enable jsdoc/valid-types */
	return {
		type: 'SELECT_BLOCK',
		initialPosition,
		clientId,
	};
}

/**
 * Returns an action object used in signalling that the block with the
 * specified client ID has been hovered.
 *
 * @param {string} clientId Block client ID.
 *
 * @return {Object} Action object.
 */
export function hoverBlock( clientId ) {
	return {
		type: 'HOVER_BLOCK',
		clientId,
	};
}

/**
 * Yields action objects used in signalling that the block preceding the given
 * clientId (or optionally, its first parent from bottom to top)
 * should be selected.
 *
 * @param {string}  clientId         Block client ID.
 * @param {boolean} fallbackToParent If true, select the first parent if there is no previous block.
 */
export const selectPreviousBlock =
	( clientId, fallbackToParent = false ) =>
	( { select, dispatch } ) => {
		const previousBlockClientId =
			select.getPreviousBlockClientId( clientId );
		if ( previousBlockClientId ) {
			dispatch.selectBlock( previousBlockClientId, -1 );
		} else if ( fallbackToParent ) {
			const firstParentClientId = select.getBlockRootClientId( clientId );
			if ( firstParentClientId ) {
				dispatch.selectBlock( firstParentClientId, -1 );
			}
		}
	};

/**
 * Yields action objects used in signalling that the block following the given
 * clientId should be selected.
 *
 * @param {string} clientId Block client ID.
 */
export const selectNextBlock =
	( clientId ) =>
	( { select, dispatch } ) => {
		const nextBlockClientId = select.getNextBlockClientId( clientId );
		if ( nextBlockClientId ) {
			dispatch.selectBlock( nextBlockClientId );
		}
	};

/**
 * Action that starts block multi-selection.
 *
 * @return {Object} Action object.
 */
export function startMultiSelect() {
	return {
		type: 'START_MULTI_SELECT',
	};
}

/**
 * Action that stops block multi-selection.
 *
 * @return {Object} Action object.
 */
export function stopMultiSelect() {
	return {
		type: 'STOP_MULTI_SELECT',
	};
}

/**
 * Action that changes block multi-selection.
 *
 * @param {string}      start                         First block of the multi selection.
 * @param {string}      end                           Last block of the multiselection.
 * @param {number|null} __experimentalInitialPosition Optional initial position. Pass as null to skip focus within editor canvas.
 */
export const multiSelect =
	( start, end, __experimentalInitialPosition = 0 ) =>
	( { select, dispatch } ) => {
		const startBlockRootClientId = select.getBlockRootClientId( start );
		const endBlockRootClientId = select.getBlockRootClientId( end );

		// Only allow block multi-selections at the same level.
		if ( startBlockRootClientId !== endBlockRootClientId ) {
			return;
		}

		dispatch( {
			type: 'MULTI_SELECT',
			start,
			end,
			initialPosition: __experimentalInitialPosition,
		} );

		const blockCount = select.getSelectedBlockCount();

		speak(
			sprintf(
				/* translators: %s: number of selected blocks */
				_n( '%s block selected.', '%s blocks selected.', blockCount ),
				blockCount
			),
			'assertive'
		);
	};

/**
 * Action that clears the block selection.
 *
 * @return {Object} Action object.
 */
export function clearSelectedBlock() {
	return {
		type: 'CLEAR_SELECTED_BLOCK',
	};
}

/**
 * Action that enables or disables block selection.
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

/* eslint-disable jsdoc/valid-types */
/**
 * Action that replaces given blocks with one or more replacement blocks.
 *
 * @param {(string|string[])} clientIds       Block client ID(s) to replace.
 * @param {(Object|Object[])} blocks          Replacement block(s).
 * @param {number}            indexToSelect   Index of replacement block to select.
 * @param {0|-1|null}         initialPosition Index of caret after in the selected block after the operation.
 * @param {?Object}           meta            Optional Meta values to be passed to the action object.
 *
 * @return {Object} Action object.
 */
export const replaceBlocks =
	( clientIds, blocks, indexToSelect, initialPosition = 0, meta ) =>
	( { select, dispatch, registry } ) => {
		/* eslint-enable jsdoc/valid-types */
		clientIds = castArray( clientIds );
		blocks = castArray( blocks );
		const rootClientId = select.getBlockRootClientId( clientIds[ 0 ] );
		// Replace is valid if the new blocks can be inserted in the root block.
		for ( let index = 0; index < blocks.length; index++ ) {
			const block = blocks[ index ];
			const canInsertBlock = select.canInsertBlockType(
				block.name,
				rootClientId
			);
			if ( ! canInsertBlock ) {
				return;
			}
		}
		// We're batching these two actions because an extra `undo/redo` step can
		// be created, based on whether we insert a default block or not.
		registry.batch( () => {
			dispatch( {
				type: 'REPLACE_BLOCKS',
				clientIds,
				blocks,
				time: Date.now(),
				indexToSelect,
				initialPosition,
				meta,
			} );
			// To avoid a focus loss when removing the last block, assure there is
			// always a default block if the last of the blocks have been removed.
			dispatch.ensureDefaultBlock();
		} );
	};

/**
 * Action that replaces a single block with one or more replacement blocks.
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
const createOnMove =
	( type ) =>
	( clientIds, rootClientId ) =>
	( { select, dispatch } ) => {
		// If one of the blocks is locked or the parent is locked, we cannot move any block.
		const canMoveBlocks = select.canMoveBlocks( clientIds );
		if ( ! canMoveBlocks ) {
			return;
		}

		dispatch( { type, clientIds: castArray( clientIds ), rootClientId } );
	};

export const moveBlocksDown = createOnMove( 'MOVE_BLOCKS_DOWN' );
export const moveBlocksUp = createOnMove( 'MOVE_BLOCKS_UP' );

/**
 * Action that moves given blocks to a new position.
 *
 * @param {?string} clientIds        The client IDs of the blocks.
 * @param {?string} fromRootClientId Root client ID source.
 * @param {?string} toRootClientId   Root client ID destination.
 * @param {number}  index            The index to move the blocks to.
 */
export const moveBlocksToPosition =
	( clientIds, fromRootClientId = '', toRootClientId = '', index ) =>
	( { select, dispatch } ) => {
		const canMoveBlocks = select.canMoveBlocks( clientIds );

		// If one of the blocks is locked or the parent is locked, we cannot move any block.
		if ( ! canMoveBlocks ) {
			return;
		}

		// If moving inside the same root block the move is always possible.
		if ( fromRootClientId !== toRootClientId ) {
			const canRemoveBlocks = select.canRemoveBlocks( clientIds );

			// If we're moving to another block, it means we're deleting blocks from
			// the original block, so we need to check if removing is possible.
			if ( ! canRemoveBlocks ) {
				return;
			}

			const canInsertBlocks = select.canInsertBlocks(
				clientIds,
				toRootClientId
			);

			// If moving to other parent block, the move is possible if we can insert a block of the same type inside the new parent block.
			if ( ! canInsertBlocks ) {
				return;
			}
		}

		dispatch( {
			type: 'MOVE_BLOCKS_TO_POSITION',
			fromRootClientId,
			toRootClientId,
			clientIds,
			index,
		} );
	};

/**
 * Action that moves given block to a new position.
 *
 * @param {?string} clientId         The client ID of the block.
 * @param {?string} fromRootClientId Root client ID source.
 * @param {?string} toRootClientId   Root client ID destination.
 * @param {number}  index            The index to move the block to.
 */
export function moveBlockToPosition(
	clientId,
	fromRootClientId = '',
	toRootClientId = '',
	index
) {
	return moveBlocksToPosition(
		[ clientId ],
		fromRootClientId,
		toRootClientId,
		index
	);
}

/**
 * Action that inserts a single block, optionally at a specific index respective a root block list.
 *
 * Only allowed blocks are inserted. The action may fail silently for blocks that are not allowed or if
 * a templateLock is active on the block list.
 *
 * @param {Object}   block           Block object to insert.
 * @param {?number}  index           Index at which block should be inserted.
 * @param {?string}  rootClientId    Optional root client ID of block list on which to insert.
 * @param {?boolean} updateSelection If true block selection will be updated. If false, block selection will not change. Defaults to true.
 * @param {?Object}  meta            Optional Meta values to be passed to the action object.
 *
 * @return {Object} Action object.
 */
export function insertBlock(
	block,
	index,
	rootClientId,
	updateSelection,
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

/* eslint-disable jsdoc/valid-types */
/**
 * Action that inserts an array of blocks, optionally at a specific index respective a root block list.
 *
 * Only allowed blocks are inserted. The action may fail silently for blocks that are not allowed or if
 * a templateLock is active on the block list.
 *
 * @param {Object[]}  blocks          Block objects to insert.
 * @param {?number}   index           Index at which block should be inserted.
 * @param {?string}   rootClientId    Optional root client ID of block list on which to insert.
 * @param {?boolean}  updateSelection If true block selection will be updated.  If false, block selection will not change. Defaults to true.
 * @param {0|-1|null} initialPosition Initial focus position. Setting it to null prevent focusing the inserted block.
 * @param {?Object}   meta            Optional Meta values to be passed to the action object.
 *
 * @return {Object} Action object.
 */
export const insertBlocks =
	(
		blocks,
		index,
		rootClientId,
		updateSelection = true,
		initialPosition = 0,
		meta
	) =>
	( { select, dispatch } ) => {
		/* eslint-enable jsdoc/valid-types */
		if ( initialPosition !== null && typeof initialPosition === 'object' ) {
			meta = initialPosition;
			initialPosition = 0;
			deprecated(
				"meta argument in wp.data.dispatch('core/block-editor')",
				{
					since: '5.8',
					hint: 'The meta argument is now the 6th argument of the function',
				}
			);
		}

		blocks = castArray( blocks );
		const allowedBlocks = [];
		for ( const block of blocks ) {
			const isValid = select.canInsertBlockType(
				block.name,
				rootClientId
			);
			if ( isValid ) {
				allowedBlocks.push( block );
			}
		}
		if ( allowedBlocks.length ) {
			dispatch( {
				type: 'INSERT_BLOCKS',
				blocks: allowedBlocks,
				index,
				rootClientId,
				time: Date.now(),
				updateSelection,
				initialPosition: updateSelection ? initialPosition : null,
				meta,
			} );
		}
	};

/**
 * Action that shows the insertion point.
 *
 * @param    {?string}         rootClientId           Optional root client ID of block list on
 *                                                    which to insert.
 * @param    {?number}         index                  Index at which block should be inserted.
 * @param    {?Object}         __unstableOptions      Additional options.
 * @property {boolean}         __unstableWithInserter Whether or not to show an inserter button.
 * @property {WPDropOperation} operation              The operation to perform when applied,
 *                                                    either 'insert' or 'replace' for now.
 *
 * @return {Object} Action object.
 */
export function showInsertionPoint(
	rootClientId,
	index,
	__unstableOptions = {}
) {
	const { __unstableWithInserter, operation, nearestSide } =
		__unstableOptions;
	return {
		type: 'SHOW_INSERTION_POINT',
		rootClientId,
		index,
		__unstableWithInserter,
		operation,
		nearestSide,
	};
}
/**
 * Action that hides the insertion point.
 */
export const hideInsertionPoint =
	() =>
	( { select, dispatch } ) => {
		if ( ! select.isBlockInsertionPointVisible() ) {
			return;
		}
		dispatch( {
			type: 'HIDE_INSERTION_POINT',
		} );
	};

/**
 * Action that resets the template validity.
 *
 * @param {boolean} isValid template validity flag.
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
 * Action that synchronizes the template with the list of blocks.
 *
 * @return {Object} Action object.
 */
export const synchronizeTemplate =
	() =>
	( { select, dispatch } ) => {
		dispatch( { type: 'SYNCHRONIZE_TEMPLATE' } );
		const blocks = select.getBlocks();
		const template = select.getTemplate();
		const updatedBlockList = synchronizeBlocksWithTemplate(
			blocks,
			template
		);

		dispatch.resetBlocks( updatedBlockList );
	};

/**
 * Delete the current selection.
 *
 * @param {boolean} isForward
 */
export const __unstableDeleteSelection =
	( isForward ) =>
	( { registry, select, dispatch } ) => {
		const selectionAnchor = select.getSelectionStart();
		const selectionFocus = select.getSelectionEnd();

		if ( selectionAnchor.clientId === selectionFocus.clientId ) {
			return;
		}

		// It's not mergeable if there's no rich text selection.
		if (
			! selectionAnchor.attributeKey ||
			! selectionFocus.attributeKey ||
			typeof selectionAnchor.offset === 'undefined' ||
			typeof selectionFocus.offset === 'undefined'
		) {
			return false;
		}

		const anchorRootClientId = select.getBlockRootClientId(
			selectionAnchor.clientId
		);
		const focusRootClientId = select.getBlockRootClientId(
			selectionFocus.clientId
		);

		// It's not mergeable if the selection doesn't start and end in the same
		// block list. Maybe in the future it should be allowed.
		if ( anchorRootClientId !== focusRootClientId ) {
			return;
		}

		const blockOrder = select.getBlockOrder( anchorRootClientId );
		const anchorIndex = blockOrder.indexOf( selectionAnchor.clientId );
		const focusIndex = blockOrder.indexOf( selectionFocus.clientId );

		// Reassign selection start and end based on order.
		let selectionStart, selectionEnd;

		if ( anchorIndex > focusIndex ) {
			selectionStart = selectionFocus;
			selectionEnd = selectionAnchor;
		} else {
			selectionStart = selectionAnchor;
			selectionEnd = selectionFocus;
		}

		const targetSelection = isForward ? selectionEnd : selectionStart;
		const targetBlock = select.getBlock( targetSelection.clientId );
		const targetBlockType = getBlockType( targetBlock.name );

		if ( ! targetBlockType.merge ) {
			return;
		}

		const selectionA = selectionStart;
		const selectionB = selectionEnd;

		const blockA = select.getBlock( selectionA.clientId );
		const blockB = select.getBlock( selectionB.clientId );

		const htmlA = blockA.attributes[ selectionA.attributeKey ];
		const htmlB = blockB.attributes[ selectionB.attributeKey ];

		let valueA = create( { html: htmlA } );
		let valueB = create( { html: htmlB } );

		valueA = remove( valueA, selectionA.offset, valueA.text.length );
		valueB = insert( valueB, START_OF_SELECTED_AREA, 0, selectionB.offset );

		// Clone the blocks so we don't manipulate the original.
		const cloneA = cloneBlock( blockA, {
			[ selectionA.attributeKey ]: toHTMLString( { value: valueA } ),
		} );
		const cloneB = cloneBlock( blockB, {
			[ selectionB.attributeKey ]: toHTMLString( { value: valueB } ),
		} );

		const followingBlock = isForward ? cloneA : cloneB;

		// We can only merge blocks with similar types
		// thus, we transform the block to merge first
		const blocksWithTheSameType =
			blockA.name === blockB.name
				? [ followingBlock ]
				: switchToBlockType( followingBlock, targetBlockType.name );

		// If the block types can not match, do nothing
		if ( ! blocksWithTheSameType || ! blocksWithTheSameType.length ) {
			return;
		}

		let updatedAttributes;

		if ( isForward ) {
			const blockToMerge = blocksWithTheSameType.pop();
			updatedAttributes = targetBlockType.merge(
				blockToMerge.attributes,
				cloneB.attributes
			);
		} else {
			const blockToMerge = blocksWithTheSameType.shift();
			updatedAttributes = targetBlockType.merge(
				cloneA.attributes,
				blockToMerge.attributes
			);
		}

		const newAttributeKey = retrieveSelectedAttribute( updatedAttributes );

		const convertedHtml = updatedAttributes[ newAttributeKey ];
		const convertedValue = create( { html: convertedHtml } );
		const newOffset = convertedValue.text.indexOf( START_OF_SELECTED_AREA );
		const newValue = remove( convertedValue, newOffset, newOffset + 1 );
		const newHtml = toHTMLString( { value: newValue } );

		updatedAttributes[ newAttributeKey ] = newHtml;

		const selectedBlockClientIds = select.getSelectedBlockClientIds();
		const replacement = [
			...( isForward ? blocksWithTheSameType : [] ),
			{
				// Preserve the original client ID.
				...targetBlock,
				attributes: {
					...targetBlock.attributes,
					...updatedAttributes,
				},
			},
			...( isForward ? [] : blocksWithTheSameType ),
		];

		registry.batch( () => {
			dispatch.selectionChange(
				targetBlock.clientId,
				newAttributeKey,
				newOffset,
				newOffset
			);

			dispatch.replaceBlocks(
				selectedBlockClientIds,
				replacement,
				0, // If we don't pass the `indexToSelect` it will default to the last block.
				select.getSelectedBlocksInitialCaretPosition()
			);
		} );
	};

/**
 * Split the current selection.
 * @param {?Array} blocks
 */
export const __unstableSplitSelection =
	( blocks = [] ) =>
	( { registry, select, dispatch } ) => {
		const selectionAnchor = select.getSelectionStart();
		const selectionFocus = select.getSelectionEnd();
		const anchorRootClientId = select.getBlockRootClientId(
			selectionAnchor.clientId
		);
		const focusRootClientId = select.getBlockRootClientId(
			selectionFocus.clientId
		);

		// It's not splittable if the selection doesn't start and end in the same
		// block list. Maybe in the future it should be allowed.
		if ( anchorRootClientId !== focusRootClientId ) {
			return;
		}

		const blockOrder = select.getBlockOrder( anchorRootClientId );
		const anchorIndex = blockOrder.indexOf( selectionAnchor.clientId );
		const focusIndex = blockOrder.indexOf( selectionFocus.clientId );

		// Reassign selection start and end based on order.
		let selectionStart, selectionEnd;

		if ( anchorIndex > focusIndex ) {
			selectionStart = selectionFocus;
			selectionEnd = selectionAnchor;
		} else {
			selectionStart = selectionAnchor;
			selectionEnd = selectionFocus;
		}

		const selectionA = selectionStart;
		const selectionB = selectionEnd;
		const blockA = select.getBlock( selectionA.clientId );
		const blockB = select.getBlock( selectionB.clientId );
		const blockAType = getBlockType( blockA.name );
		const blockBType = getBlockType( blockB.name );
		const attributeKeyA =
			typeof selectionA.attributeKey === 'string'
				? selectionA.attributeKey
				: findRichTextAttributeKey( blockAType );
		const attributeKeyB =
			typeof selectionB.attributeKey === 'string'
				? selectionB.attributeKey
				: findRichTextAttributeKey( blockBType );
		const blockAttributes = select.getBlockAttributes(
			selectionA.clientId
		);
		const bindings = blockAttributes?.metadata?.bindings;

		// If the attribute is bound, don't split the selection and insert a new block instead.
		if ( bindings?.[ attributeKeyA ] ) {
			// Show warning if user tries to insert a block into another block with bindings.
			if ( blocks.length ) {
				const { createWarningNotice } =
					registry.dispatch( noticesStore );
				createWarningNotice(
					__(
						"Blocks can't be inserted into other blocks with bindings"
					),
					{
						type: 'snackbar',
					}
				);
				return;
			}
			dispatch.insertAfterBlock( selectionA.clientId );
			return;
		}

		// Can't split if the selection is not set.
		if (
			! attributeKeyA ||
			! attributeKeyB ||
			typeof selectionAnchor.offset === 'undefined' ||
			typeof selectionFocus.offset === 'undefined'
		) {
			return;
		}

		// We can do some short-circuiting if the selection is collapsed.
		if (
			selectionA.clientId === selectionB.clientId &&
			attributeKeyA === attributeKeyB &&
			selectionA.offset === selectionB.offset
		) {
			// If an unmodified default block is selected, replace it. We don't
			// want to be converting into a default block.
			if ( blocks.length ) {
				if ( isUnmodifiedDefaultBlock( blockA ) ) {
					dispatch.replaceBlocks(
						[ selectionA.clientId ],
						blocks,
						blocks.length - 1,
						-1
					);
					return;
				}
			}

			// If selection is at the start or end, we can simply insert an
			// empty block, provided this block has no inner blocks.
			else if ( ! select.getBlockOrder( selectionA.clientId ).length ) {
				function createEmpty() {
					const defaultBlockName = getDefaultBlockName();
					return select.canInsertBlockType(
						defaultBlockName,
						anchorRootClientId
					)
						? createBlock( defaultBlockName )
						: createBlock(
								select.getBlockName( selectionA.clientId )
						  );
				}

				const length = blockAttributes[ attributeKeyA ].length;

				if ( selectionA.offset === 0 && length ) {
					dispatch.insertBlocks(
						[ createEmpty() ],
						select.getBlockIndex( selectionA.clientId ),
						anchorRootClientId,
						false
					);
					return;
				}

				if ( selectionA.offset === length ) {
					dispatch.insertBlocks(
						[ createEmpty() ],
						select.getBlockIndex( selectionA.clientId ) + 1,
						anchorRootClientId
					);
					return;
				}
			}
		}

		const htmlA = blockA.attributes[ attributeKeyA ];
		const htmlB = blockB.attributes[ attributeKeyB ];

		let valueA = create( { html: htmlA } );
		let valueB = create( { html: htmlB } );

		valueA = remove( valueA, selectionA.offset, valueA.text.length );
		valueB = remove( valueB, 0, selectionB.offset );

		let head = {
			// Preserve the original client ID.
			...blockA,
			// If both start and end are the same, should only copy innerBlocks
			// once.
			innerBlocks:
				blockA.clientId === blockB.clientId ? [] : blockA.innerBlocks,
			attributes: {
				...blockA.attributes,
				[ attributeKeyA ]: toHTMLString( { value: valueA } ),
			},
		};

		let tail = {
			...blockB,
			// Only preserve the original client ID if the end is different.
			clientId:
				blockA.clientId === blockB.clientId
					? createBlock( blockB.name ).clientId
					: blockB.clientId,
			attributes: {
				...blockB.attributes,
				[ attributeKeyB ]: toHTMLString( { value: valueB } ),
			},
		};

		// When splitting a block, attempt to convert the tail block to the
		// default block type. For example, when splitting a heading block, the
		// tail block will be converted to a paragraph block. Note that for
		// blocks such as a list item and button, this will be skipped because
		// the default block type cannot be inserted.
		const defaultBlockName = getDefaultBlockName();
		if (
			// A block is only split when the selection is within the same
			// block.
			blockA.clientId === blockB.clientId &&
			defaultBlockName &&
			tail.name !== defaultBlockName &&
			select.canInsertBlockType( defaultBlockName, anchorRootClientId )
		) {
			const switched = switchToBlockType( tail, defaultBlockName );
			if ( switched?.length === 1 ) {
				tail = switched[ 0 ];
			}
		}

		if ( ! blocks.length ) {
			dispatch.replaceBlocks( select.getSelectedBlockClientIds(), [
				head,
				tail,
			] );
			return;
		}

		let selection;
		const output = [];
		const clonedBlocks = [ ...blocks ];
		const firstBlock = clonedBlocks.shift();
		const headType = getBlockType( head.name );
		const firstBlocks =
			headType.merge && firstBlock.name === headType.name
				? [ firstBlock ]
				: switchToBlockType( firstBlock, headType.name );

		if ( firstBlocks?.length ) {
			const first = firstBlocks.shift();
			head = {
				...head,
				attributes: {
					...head.attributes,
					...headType.merge( head.attributes, first.attributes ),
				},
			};
			output.push( head );
			selection = {
				clientId: head.clientId,
				attributeKey: attributeKeyA,
				offset: create( { html: head.attributes[ attributeKeyA ] } )
					.text.length,
			};
			clonedBlocks.unshift( ...firstBlocks );
		} else {
			if ( ! isUnmodifiedBlock( head ) ) {
				output.push( head );
			}
			output.push( firstBlock );
		}

		const lastBlock = clonedBlocks.pop();
		const tailType = getBlockType( tail.name );

		if ( clonedBlocks.length ) {
			output.push( ...clonedBlocks );
		}

		if ( lastBlock ) {
			const lastBlocks =
				tailType.merge && tailType.name === lastBlock.name
					? [ lastBlock ]
					: switchToBlockType( lastBlock, tailType.name );

			if ( lastBlocks?.length ) {
				const last = lastBlocks.pop();
				output.push( {
					...tail,
					attributes: {
						...tail.attributes,
						...tailType.merge( last.attributes, tail.attributes ),
					},
				} );
				output.push( ...lastBlocks );
				selection = {
					clientId: tail.clientId,
					attributeKey: attributeKeyB,
					offset: create( {
						html: last.attributes[ attributeKeyB ],
					} ).text.length,
				};
			} else {
				output.push( lastBlock );
				if ( ! isUnmodifiedBlock( tail ) ) {
					output.push( tail );
				}
			}
		} else if ( ! isUnmodifiedBlock( tail ) ) {
			output.push( tail );
		}

		registry.batch( () => {
			dispatch.replaceBlocks(
				select.getSelectedBlockClientIds(),
				output,
				output.length - 1,
				0
			);
			if ( selection ) {
				dispatch.selectionChange(
					selection.clientId,
					selection.attributeKey,
					selection.offset,
					selection.offset
				);
			}
		} );
	};

/**
 * Expand the selection to cover the entire blocks, removing partial selection.
 */
export const __unstableExpandSelection =
	() =>
	( { select, dispatch } ) => {
		const selectionAnchor = select.getSelectionStart();
		const selectionFocus = select.getSelectionEnd();
		dispatch.selectionChange( {
			start: { clientId: selectionAnchor.clientId },
			end: { clientId: selectionFocus.clientId },
		} );
	};

/**
 * Action that merges two blocks.
 *
 * @param {string} firstBlockClientId  Client ID of the first block to merge.
 * @param {string} secondBlockClientId Client ID of the second block to merge.
 */
export const mergeBlocks =
	( firstBlockClientId, secondBlockClientId ) =>
	( { registry, select, dispatch } ) => {
		const clientIdA = firstBlockClientId;
		const clientIdB = secondBlockClientId;
		const blockA = select.getBlock( clientIdA );
		const blockAType = getBlockType( blockA.name );

		if ( ! blockAType ) {
			return;
		}

		const blockB = select.getBlock( clientIdB );

		if (
			! blockAType.merge &&
			getBlockSupport( blockA.name, '__experimentalOnMerge' )
		) {
			// If there's no merge function defined, attempt merging inner
			// blocks.
			const blocksWithTheSameType = switchToBlockType(
				blockB,
				blockAType.name
			);
			// Only focus the previous block if it's not mergeable.
			if ( blocksWithTheSameType?.length !== 1 ) {
				dispatch.selectBlock( blockA.clientId );
				return;
			}
			const [ blockWithSameType ] = blocksWithTheSameType;
			if ( blockWithSameType.innerBlocks.length < 1 ) {
				dispatch.selectBlock( blockA.clientId );
				return;
			}

			registry.batch( () => {
				dispatch.insertBlocks(
					blockWithSameType.innerBlocks,
					undefined,
					clientIdA
				);
				dispatch.removeBlock( clientIdB );
				dispatch.selectBlock(
					blockWithSameType.innerBlocks[ 0 ].clientId
				);

				// Attempt to merge the next block if it's the same type and
				// same attributes. This is useful when merging a paragraph into
				// a list, and the next block is also a list. If we don't merge,
				// it looks like one list, but it's actually two lists. The same
				// applies to other blocks such as a group with the same
				// attributes.
				const nextBlockClientId =
					select.getNextBlockClientId( clientIdA );

				if (
					nextBlockClientId &&
					select.getBlockName( clientIdA ) ===
						select.getBlockName( nextBlockClientId )
				) {
					const rootAttributes =
						select.getBlockAttributes( clientIdA );
					const previousRootAttributes =
						select.getBlockAttributes( nextBlockClientId );

					if (
						Object.keys( rootAttributes ).every(
							( key ) =>
								rootAttributes[ key ] ===
								previousRootAttributes[ key ]
						)
					) {
						dispatch.moveBlocksToPosition(
							select.getBlockOrder( nextBlockClientId ),
							nextBlockClientId,
							clientIdA
						);
						dispatch.removeBlock( nextBlockClientId, false );
					}
				}
			} );
			return;
		}

		if ( isUnmodifiedDefaultBlock( blockA ) ) {
			dispatch.removeBlock(
				clientIdA,
				select.isBlockSelected( clientIdA )
			);
			return;
		}

		if ( isUnmodifiedDefaultBlock( blockB ) ) {
			dispatch.removeBlock(
				clientIdB,
				select.isBlockSelected( clientIdB )
			);
			return;
		}

		if ( ! blockAType.merge ) {
			dispatch.selectBlock( blockA.clientId );
			return;
		}

		const blockBType = getBlockType( blockB.name );
		const { clientId, attributeKey, offset } = select.getSelectionStart();
		const selectedBlockType =
			clientId === clientIdA ? blockAType : blockBType;
		const attributeDefinition =
			selectedBlockType.attributes[ attributeKey ];
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

		// Clone the blocks so we don't insert the character in a "live" block.
		const cloneA = cloneBlock( blockA );
		const cloneB = cloneBlock( blockB );

		if ( canRestoreTextSelection ) {
			const selectedBlock = clientId === clientIdA ? cloneA : cloneB;
			const html = selectedBlock.attributes[ attributeKey ];
			const value = insert(
				create( { html } ),
				START_OF_SELECTED_AREA,
				offset,
				offset
			);

			selectedBlock.attributes[ attributeKey ] = toHTMLString( {
				value,
			} );
		}

		// We can only merge blocks with similar types
		// thus, we transform the block to merge first.
		const blocksWithTheSameType =
			blockA.name === blockB.name
				? [ cloneB ]
				: switchToBlockType( cloneB, blockA.name );

		// If the block types can not match, do nothing.
		if ( ! blocksWithTheSameType || ! blocksWithTheSameType.length ) {
			return;
		}

		// Calling the merge to update the attributes and remove the block to be merged.
		const updatedAttributes = blockAType.merge(
			cloneA.attributes,
			blocksWithTheSameType[ 0 ].attributes
		);

		if ( canRestoreTextSelection ) {
			const newAttributeKey =
				retrieveSelectedAttribute( updatedAttributes );
			const convertedHtml = updatedAttributes[ newAttributeKey ];
			const convertedValue = create( { html: convertedHtml } );
			const newOffset = convertedValue.text.indexOf(
				START_OF_SELECTED_AREA
			);
			const newValue = remove( convertedValue, newOffset, newOffset + 1 );
			const newHtml = toHTMLString( { value: newValue } );

			updatedAttributes[ newAttributeKey ] = newHtml;

			dispatch.selectionChange(
				blockA.clientId,
				newAttributeKey,
				newOffset,
				newOffset
			);
		}

		dispatch.replaceBlocks(
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
			],
			0 // If we don't pass the `indexToSelect` it will default to the last block.
		);
	};

/**
 * Yields action objects used in signalling that the blocks corresponding to
 * the set of specified client IDs are to be removed.
 *
 * @param {string|string[]} clientIds      Client IDs of blocks to remove.
 * @param {boolean}         selectPrevious True if the previous block
 *                                         or the immediate parent
 *                                         (if no previous block exists)
 *                                         should be selected
 *                                         when a block is removed.
 */
export const removeBlocks = ( clientIds, selectPrevious = true ) =>
	privateRemoveBlocks( clientIds, selectPrevious );

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

/* eslint-disable jsdoc/valid-types */
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
	/* eslint-enable jsdoc/valid-types */
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
 * @deprecated
 *
 * @return {Object} Action object.
 */
export function enterFormattedText() {
	deprecated( 'wp.data.dispatch( "core/block-editor" ).enterFormattedText', {
		since: '6.1',
		version: '6.3',
	} );
	return {
		type: 'DO_NOTHING',
	};
}

/**
 * Returns an action object used in signalling that the user caret has exited formatted text.
 *
 * @deprecated
 *
 * @return {Object} Action object.
 */
export function exitFormattedText() {
	deprecated( 'wp.data.dispatch( "core/block-editor" ).exitFormattedText', {
		since: '6.1',
		version: '6.3',
	} );
	return {
		type: 'DO_NOTHING',
	};
}

/**
 * Action that changes the position of the user caret.
 *
 * @param {string|WPSelection} clientId     The selected block client ID.
 * @param {string}             attributeKey The selected block attribute key.
 * @param {number}             startOffset  The start offset.
 * @param {number}             endOffset    The end offset.
 *
 * @return {Object} Action object.
 */
export function selectionChange(
	clientId,
	attributeKey,
	startOffset,
	endOffset
) {
	if ( typeof clientId === 'string' ) {
		return {
			type: 'SELECTION_CHANGE',
			clientId,
			attributeKey,
			startOffset,
			endOffset,
		};
	}

	return { type: 'SELECTION_CHANGE', ...clientId };
}

/**
 * Action that adds a new block of the default type to the block list.
 *
 * @param {?Object} attributes   Optional attributes of the block to assign.
 * @param {?string} rootClientId Optional root client ID of block list on which
 *                               to append.
 * @param {?number} index        Optional index where to insert the default block.
 */
export const insertDefaultBlock =
	( attributes, rootClientId, index ) =>
	( { dispatch } ) => {
		// Abort if there is no default block type (if it has been unregistered).
		const defaultBlockName = getDefaultBlockName();
		if ( ! defaultBlockName ) {
			return;
		}

		const block = createBlock( defaultBlockName, attributes );

		return dispatch.insertBlock( block, index, rootClientId );
	};

/**
 * @typedef {Object< string, Object >} SettingsByClientId
 */

/**
 * Action that changes the nested settings of the given block(s).
 *
 * @param {string | SettingsByClientId} clientId Client ID of the block whose
 *                                               nested setting are being
 *                                               received, or object of settings
 *                                               by client ID.
 * @param {Object}                      settings Object with the new settings
 *                                               for the nested block.
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
 * Action that updates the block editor settings.
 *
 * @param {Object} settings Updated settings
 *
 * @return {Object} Action object
 */
export function updateSettings( settings ) {
	return __experimentalUpdateSettings( settings, {
		stripExperimentalSettings: true,
	} );
}

/**
 * Action that signals that a temporary reusable block has been saved
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
 * Action that marks the last block change explicitly as persistent.
 *
 * @return {Object} Action object.
 */
export function __unstableMarkLastChangeAsPersistent() {
	return { type: 'MARK_LAST_CHANGE_AS_PERSISTENT' };
}

/**
 * Action that signals that the next block change should be marked explicitly as not persistent.
 *
 * @return {Object} Action object.
 */
export function __unstableMarkNextChangeAsNotPersistent() {
	return { type: 'MARK_NEXT_CHANGE_AS_NOT_PERSISTENT' };
}

/**
 * Action that marks the last block change as an automatic change, meaning it was not
 * performed by the user, and can be undone using the `Escape` and `Backspace` keys.
 * This action must be called after the change was made, and any actions that are a
 * consequence of it, so it is recommended to be called at the next idle period to ensure all
 * selection changes have been recorded.
 */
export const __unstableMarkAutomaticChange =
	() =>
	( { dispatch } ) => {
		dispatch( { type: 'MARK_AUTOMATIC_CHANGE' } );
		const { requestIdleCallback = ( cb ) => setTimeout( cb, 100 ) } =
			window;
		requestIdleCallback( () => {
			dispatch( { type: 'MARK_AUTOMATIC_CHANGE_FINAL' } );
		} );
	};

/**
 * Action that enables or disables the navigation mode.
 *
 * @param {boolean} isNavigationMode Enable/Disable navigation mode.
 */
export const setNavigationMode =
	( isNavigationMode = true ) =>
	( { dispatch } ) => {
		dispatch.__unstableSetEditorMode(
			isNavigationMode ? 'navigation' : 'edit'
		);
	};

/**
 * Action that sets the editor mode
 *
 * @param {string} mode Editor mode
 */
export const __unstableSetEditorMode =
	( mode ) =>
	( { dispatch, select } ) => {
		// When switching to zoom-out mode, we need to select the parent section
		if ( mode === 'zoom-out' ) {
			const firstSelectedClientId = select.getBlockSelectionStart();

			const sectionRootClientId = select.getSectionRootClientId();

			if ( firstSelectedClientId ) {
				let sectionClientId;

				if ( sectionRootClientId ) {
					const sectionClientIds =
						select.getBlockOrder( sectionRootClientId );

					// If the selected block is a section block, use it.
					if ( sectionClientIds?.includes( firstSelectedClientId ) ) {
						sectionClientId = firstSelectedClientId;
					} else {
						// If the selected block is not a section block, find
						// the parent section that contains the selected block.
						sectionClientId = select
							.getBlockParents( firstSelectedClientId )
							.find( ( parent ) =>
								sectionClientIds.includes( parent )
							);
					}
				} else {
					sectionClientId = select.getBlockHierarchyRootClientId(
						firstSelectedClientId
					);
				}

				if ( sectionClientId ) {
					dispatch.selectBlock( sectionClientId );
				} else {
					dispatch.clearSelectedBlock();
				}
			}
		}

		dispatch( { type: 'SET_EDITOR_MODE', mode } );

		if ( mode === 'navigation' ) {
			speak(
				__(
					'You are currently in navigation mode. Navigate blocks using the Tab key and Arrow keys. Use Left and Right Arrow keys to move between nesting levels. To exit navigation mode and edit the selected block, press Enter.'
				)
			);
		} else if ( mode === 'edit' ) {
			speak(
				__(
					'You are currently in edit mode. To return to the navigation mode, press Escape.'
				)
			);
		} else if ( mode === 'zoom-out' ) {
			speak( __( 'You are currently in zoom-out mode.' ) );
		}
	};

/**
 * Action that enables or disables the block moving mode.
 *
 * @param {string|null} hasBlockMovingClientId Enable/Disable block moving mode.
 */
export const setBlockMovingClientId =
	( hasBlockMovingClientId = null ) =>
	( { dispatch } ) => {
		dispatch( { type: 'SET_BLOCK_MOVING_MODE', hasBlockMovingClientId } );

		if ( hasBlockMovingClientId ) {
			speak(
				__(
					'Use the Tab key and Arrow keys to choose new block location. Use Left and Right Arrow keys to move between nesting levels. Once location is selected press Enter or Space to move the block.'
				)
			);
		}
	};

/**
 * Action that duplicates a list of blocks.
 *
 * @param {string[]} clientIds
 * @param {boolean}  updateSelection
 */
export const duplicateBlocks =
	( clientIds, updateSelection = true ) =>
	( { select, dispatch } ) => {
		if ( ! clientIds || ! clientIds.length ) {
			return;
		}

		// Return early if blocks don't exist.
		const blocks = select.getBlocksByClientId( clientIds );
		if ( blocks.some( ( block ) => ! block ) ) {
			return;
		}

		// Return early if blocks don't support multiple usage.
		const blockNames = blocks.map( ( block ) => block.name );
		if (
			blockNames.some(
				( blockName ) =>
					! hasBlockSupport( blockName, 'multiple', true )
			)
		) {
			return;
		}

		const rootClientId = select.getBlockRootClientId( clientIds[ 0 ] );
		const clientIdsArray = castArray( clientIds );
		const lastSelectedIndex = select.getBlockIndex(
			clientIdsArray[ clientIdsArray.length - 1 ]
		);
		const clonedBlocks = blocks.map( ( block ) =>
			__experimentalCloneSanitizedBlock( block )
		);
		dispatch.insertBlocks(
			clonedBlocks,
			lastSelectedIndex + 1,
			rootClientId,
			updateSelection
		);
		if ( clonedBlocks.length > 1 && updateSelection ) {
			dispatch.multiSelect(
				clonedBlocks[ 0 ].clientId,
				clonedBlocks[ clonedBlocks.length - 1 ].clientId
			);
		}
		return clonedBlocks.map( ( block ) => block.clientId );
	};

/**
 * Action that inserts a default block before a given block.
 *
 * @param {string} clientId
 */
export const insertBeforeBlock =
	( clientId ) =>
	( { select, dispatch } ) => {
		if ( ! clientId ) {
			return;
		}
		const rootClientId = select.getBlockRootClientId( clientId );
		const isLocked = select.getTemplateLock( rootClientId );
		if ( isLocked ) {
			return;
		}

		const blockIndex = select.getBlockIndex( clientId );
		const directInsertBlock = rootClientId
			? select.getDirectInsertBlock( rootClientId )
			: null;

		if ( ! directInsertBlock ) {
			return dispatch.insertDefaultBlock( {}, rootClientId, blockIndex );
		}

		const copiedAttributes = {};
		if ( directInsertBlock.attributesToCopy ) {
			const attributes = select.getBlockAttributes( clientId );
			directInsertBlock.attributesToCopy.forEach( ( key ) => {
				if ( attributes[ key ] ) {
					copiedAttributes[ key ] = attributes[ key ];
				}
			} );
		}

		const block = createBlock( directInsertBlock.name, {
			...directInsertBlock.attributes,
			...copiedAttributes,
		} );
		return dispatch.insertBlock( block, blockIndex, rootClientId );
	};

/**
 * Action that inserts a default block after a given block.
 *
 * @param {string} clientId
 */
export const insertAfterBlock =
	( clientId ) =>
	( { select, dispatch } ) => {
		if ( ! clientId ) {
			return;
		}
		const rootClientId = select.getBlockRootClientId( clientId );
		const isLocked = select.getTemplateLock( rootClientId );
		if ( isLocked ) {
			return;
		}

		const blockIndex = select.getBlockIndex( clientId );
		const directInsertBlock = rootClientId
			? select.getDirectInsertBlock( rootClientId )
			: null;

		if ( ! directInsertBlock ) {
			return dispatch.insertDefaultBlock(
				{},
				rootClientId,
				blockIndex + 1
			);
		}

		const copiedAttributes = {};
		if ( directInsertBlock.attributesToCopy ) {
			const attributes = select.getBlockAttributes( clientId );
			directInsertBlock.attributesToCopy.forEach( ( key ) => {
				if ( attributes[ key ] ) {
					copiedAttributes[ key ] = attributes[ key ];
				}
			} );
		}

		const block = createBlock( directInsertBlock.name, {
			...directInsertBlock.attributes,
			...copiedAttributes,
		} );
		return dispatch.insertBlock( block, blockIndex + 1, rootClientId );
	};

/**
 * Action that toggles the highlighted block state.
 *
 * @param {string}  clientId      The block's clientId.
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
 * Action that "flashes" the block with a given `clientId` by rhythmically highlighting it.
 *
 * @param {string} clientId Target block client ID.
 */
export const flashBlock =
	( clientId ) =>
	async ( { dispatch } ) => {
		dispatch( toggleBlockHighlight( clientId, true ) );
		await new Promise( ( resolve ) => setTimeout( resolve, 150 ) );
		dispatch( toggleBlockHighlight( clientId, false ) );
	};

/**
 * Action that sets whether a block has controlled inner blocks.
 *
 * @param {string}  clientId                 The block's clientId.
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

/**
 * Action that sets whether given blocks are visible on the canvas.
 *
 * @param {Record<string,boolean>} updates For each block's clientId, its new visibility setting.
 */
export function setBlockVisibility( updates ) {
	return {
		type: 'SET_BLOCK_VISIBILITY',
		updates,
	};
}

/**
 * Action that sets whether a block is being temporarily edited as blocks.
 *
 * DO-NOT-USE in production.
 * This action is created for internal/experimental only usage and may be
 * removed anytime without any warning, causing breakage on any plugin or theme invoking it.
 *
 * @param {?string} temporarilyEditingAsBlocks The block's clientId being temporarily edited as blocks.
 * @param {?string} focusModeToRevert          The focus mode to revert after temporarily edit as blocks finishes.
 */
export function __unstableSetTemporarilyEditingAsBlocks(
	temporarilyEditingAsBlocks,
	focusModeToRevert
) {
	return {
		type: 'SET_TEMPORARILY_EDITING_AS_BLOCKS',
		temporarilyEditingAsBlocks,
		focusModeToRevert,
	};
}

/**
 * Interface for inserter media requests.
 *
 * @typedef {Object} InserterMediaRequest
 * @property {number} per_page How many items to fetch per page.
 * @property {string} search   The search term to use for filtering the results.
 */

/**
 * Interface for inserter media responses. Any media resource should
 * map their response to this interface, in order to create the core
 * WordPress media blocks (image, video, audio).
 *
 * @typedef {Object} InserterMediaItem
 * @property {string}        title        The title of the media item.
 * @property {string}        url          The source url of the media item.
 * @property {string}        [previewUrl] The preview source url of the media item to display in the media list.
 * @property {number}        [id]         The WordPress id of the media item.
 * @property {number|string} [sourceId]   The id of the media item from external source.
 * @property {string}        [alt]        The alt text of the media item.
 * @property {string}        [caption]    The caption of the media item.
 */

/**
 * Registers a new inserter media category. Once registered, the media category is
 * available in the inserter's media tab.
 *
 * The following interfaces are used:
 *
 * _Type Definition_
 *
 * - _InserterMediaRequest_ `Object`: Interface for inserter media requests.
 *
 * _Properties_
 *
 * - _per_page_ `number`: How many items to fetch per page.
 * - _search_ `string`: The search term to use for filtering the results.
 *
 * _Type Definition_
 *
 * - _InserterMediaItem_ `Object`: Interface for inserter media responses. Any media resource should
 * map their response to this interface, in order to create the core
 * WordPress media blocks (image, video, audio).
 *
 * _Properties_
 *
 * - _title_ `string`: The title of the media item.
 * - _url_ `string: The source url of the media item.
 * - _previewUrl_ `[string]`: The preview source url of the media item to display in the media list.
 * - _id_ `[number]`: The WordPress id of the media item.
 * - _sourceId_ `[number|string]`: The id of the media item from external source.
 * - _alt_ `[string]`: The alt text of the media item.
 * - _caption_ `[string]`: The caption of the media item.
 *
 * @param    {InserterMediaCategory}                                  category                       The inserter media category to register.
 *
 * @example
 * ```js
 *
 * wp.data.dispatch('core/block-editor').registerInserterMediaCategory( {
 * 	 name: 'openverse',
 * 	 labels: {
 * 	 	name: 'Openverse',
 * 	 	search_items: 'Search Openverse',
 * 	 },
 * 	 mediaType: 'image',
 * 	 async fetch( query = {} ) {
 * 	 	const defaultArgs = {
 * 	 		mature: false,
 * 	 		excluded_source: 'flickr,inaturalist,wikimedia',
 * 	 		license: 'pdm,cc0',
 * 	 	};
 * 	 	const finalQuery = { ...query, ...defaultArgs };
 * 	 	// Sometimes you might need to map the supported request params according to `InserterMediaRequest`.
 * 	 	// interface. In this example the `search` query param is named `q`.
 * 	 	const mapFromInserterMediaRequest = {
 * 	 		per_page: 'page_size',
 * 	 		search: 'q',
 * 	 	};
 * 	 	const url = new URL( 'https://api.openverse.org/v1/images/' );
 * 	 	Object.entries( finalQuery ).forEach( ( [ key, value ] ) => {
 * 	 		const queryKey = mapFromInserterMediaRequest[ key ] || key;
 * 	 		url.searchParams.set( queryKey, value );
 * 	 	} );
 * 	 	const response = await window.fetch( url, {
 * 	 		headers: {
 * 	 			'User-Agent': 'WordPress/inserter-media-fetch',
 * 	 		},
 * 	 	} );
 * 	 	const jsonResponse = await response.json();
 * 	 	const results = jsonResponse.results;
 * 	 	return results.map( ( result ) => ( {
 * 	 		...result,
 * 	 		// If your response result includes an `id` prop that you want to access later, it should
 * 	 		// be mapped to `InserterMediaItem`'s `sourceId` prop. This can be useful if you provide
 * 	 		// a report URL getter.
 * 	 		// Additionally you should always clear the `id` value of your response results because
 * 	 		// it is used to identify WordPress media items.
 * 	 		sourceId: result.id,
 * 	 		id: undefined,
 * 	 		caption: result.caption,
 * 	 		previewUrl: result.thumbnail,
 * 	 	} ) );
 * 	 },
 * 	 getReportUrl: ( { sourceId } ) =>
 * 	 	`https://wordpress.org/openverse/image/${ sourceId }/report/`,
 * 	 isExternalResource: true,
 * } );
 * ```
 *
 * @typedef {Object} InserterMediaCategory Interface for inserter media category.
 * @property {string}                                                 name                           The name of the media category, that should be unique among all media categories.
 * @property {Object}                                                 labels                         Labels for the media category.
 * @property {string}                                                 labels.name                    General name of the media category. It's used in the inserter media items list.
 * @property {string}                                                 [labels.search_items='Search'] Label for searching items. Default is ‘Search Posts’ / ‘Search Pages’.
 * @property {('image'|'audio'|'video')}                              mediaType                      The media type of the media category.
 * @property {(InserterMediaRequest) => Promise<InserterMediaItem[]>} fetch                          The function to fetch media items for the category.
 * @property {(InserterMediaItem) => string}                          [getReportUrl]                 If the media category supports reporting media items, this function should return
 *                                                                                                   the report url for the media item. It accepts the `InserterMediaItem` as an argument.
 * @property {boolean}                                                [isExternalResource]           If the media category is an external resource, this should be set to true.
 *                                                                                                   This is used to avoid making a request to the external resource when the user
 */
export const registerInserterMediaCategory =
	( category ) =>
	( { select, dispatch } ) => {
		if ( ! category || typeof category !== 'object' ) {
			console.error(
				'Category should be an `InserterMediaCategory` object.'
			);
			return;
		}
		if ( ! category.name ) {
			console.error(
				'Category should have a `name` that should be unique among all media categories.'
			);
			return;
		}
		if ( ! category.labels?.name ) {
			console.error( 'Category should have a `labels.name`.' );
			return;
		}
		if ( ! [ 'image', 'audio', 'video' ].includes( category.mediaType ) ) {
			console.error(
				'Category should have `mediaType` property that is one of `image|audio|video`.'
			);
			return;
		}
		if ( ! category.fetch || typeof category.fetch !== 'function' ) {
			console.error(
				'Category should have a `fetch` function defined with the following signature `(InserterMediaRequest) => Promise<InserterMediaItem[]>`.'
			);
			return;
		}
		const registeredInserterMediaCategories =
			select.getRegisteredInserterMediaCategories();
		if (
			registeredInserterMediaCategories.some(
				( { name } ) => name === category.name
			)
		) {
			console.error(
				`A category is already registered with the same name: "${ category.name }".`
			);
			return;
		}
		if (
			registeredInserterMediaCategories.some(
				( { labels: { name } = {} } ) => name === category.labels?.name
			)
		) {
			console.error(
				`A category is already registered with the same labels.name: "${ category.labels.name }".`
			);
			return;
		}
		// `inserterMediaCategories` is a private block editor setting, which means it cannot
		// be updated through the public `updateSettings` action. We preserve this setting as
		// private, so extenders can only add new inserter media categories and don't have any
		// control over the core media categories.
		dispatch( {
			type: 'REGISTER_INSERTER_MEDIA_CATEGORY',
			category: { ...category, isExternalResource: true },
		} );
	};

/**
 * @typedef {import('../components/block-editing-mode').BlockEditingMode} BlockEditingMode
 */

/**
 * Sets the block editing mode for a given block.
 *
 * @see useBlockEditingMode
 *
 * @param {string}           clientId The block client ID, or `''` for the root container.
 * @param {BlockEditingMode} mode     The block editing mode. One of `'disabled'`,
 *                                    `'contentOnly'`, or `'default'`.
 *
 * @return {Object} Action object.
 */
export function setBlockEditingMode( clientId = '', mode ) {
	return {
		type: 'SET_BLOCK_EDITING_MODE',
		clientId,
		mode,
	};
}

/**
 * Clears the block editing mode for a given block.
 *
 * @see useBlockEditingMode
 *
 * @param {string} clientId The block client ID, or `''` for the root container.
 *
 * @return {Object} Action object.
 */
export function unsetBlockEditingMode( clientId = '' ) {
	return {
		type: 'UNSET_BLOCK_EDITING_MODE',
		clientId,
	};
}
