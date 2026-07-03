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
import type { Block } from '@wordpress/blocks';
import { speak } from '@wordpress/a11y';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { create, insert, remove, toHTMLString } from '@wordpress/rich-text';
import deprecated from '@wordpress/deprecated';
import { store as preferencesStore } from '@wordpress/preferences';

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
	editContentOnlySection,
} from './private-actions';
import type { BlockEditingMode, InserterMediaCategory } from './types';

/**
 * A block selection object.
 *
 * This type is duplicated to avoid creating circular dependencies.
 *
 * @see {import("@wordpress/block-editor/src/store/selectors").WPBlockSelection}
 * @see {import("@wordpress/core-data/src/types").WPBlockSelection}
 * @see {import("@wordpress/editor/src/store/selectors").WPBlockSelection}
 */
export interface WPBlockSelection {
	/** A block client ID. */
	clientId: string;
	/** A block attribute key. */
	attributeKey?: string;
	/**
	 * An attribute value offset, based on the rich
	 * text value. See `wp.richText.create`.
	 */
	offset?: number;
}

/**
 * A selection object.
 */
export interface WPSelection {
	/** The selection start. */
	start: WPBlockSelection;
	/** The selection end. */
	end: WPBlockSelection;
}

/** @typedef {import('../components/use-on-block-drop/types').WPDropOperation} WPDropOperation */
export type WPDropOperation = 'insert' | 'replace';

const castArray = < T >( maybeArray: T | T[] ): T[] =>
	Array.isArray( maybeArray ) ? maybeArray : [ maybeArray ];

/**
 * Action that resets blocks state to the specified array of blocks, taking precedence
 * over any other content reflected as an edit in state.
 *
 * @param blocks Array of blocks.
 */
export const resetBlocks =
	( blocks: Block[] ) =>
	( { dispatch }: any ) => {
		dispatch( { type: 'RESET_BLOCKS', blocks } );
		dispatch( validateBlocksToTemplate( blocks ) );
	};

/**
 * Block validity is a function of blocks state (at the point of a
 * reset) and the template setting. As a compromise to its placement
 * across distinct parts of state, it is implemented here as a side
 * effect of the block reset action.
 *
 * @param blocks Array of blocks.
 */
export const validateBlocksToTemplate =
	( blocks: Block[] ) =>
	( { select, dispatch }: any ) => {
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
 * Returns an action object used in signalling that selection state should be
 * reset to the specified selection.
 *
 * @param selectionStart  The selection start.
 * @param selectionEnd    The selection end.
 * @param initialPosition Initial block position.
 *
 * @return Action object.
 */
export function resetSelection(
	selectionStart: WPBlockSelection,
	selectionEnd: WPBlockSelection,
	initialPosition: 0 | -1 | null
) {
	return {
		type: 'RESET_SELECTION' as const,
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
 * @param blocks Array of block objects.
 *
 * @return Action object.
 */
export function receiveBlocks( blocks: Block[] ) {
	deprecated( 'wp.data.dispatch( "core/block-editor" ).receiveBlocks', {
		since: '5.9',
		alternative: 'resetBlocks or insertBlocks',
	} );

	return {
		type: 'RECEIVE_BLOCKS' as const,
		blocks,
	};
}

/**
 * Action that updates attributes of multiple blocks with the specified client IDs.
 *
 * @param clientIds             Block client IDs.
 * @param attributes            Block attributes to be merged. Should be keyed by clientIds if `options.uniqueByBlock` is true.
 * @param options               Updating options.
 * @param options.uniqueByBlock Whether each block in clientIds array has a unique set of attributes.
 * @return Action object.
 */
export function updateBlockAttributes(
	clientIds: string | string[],
	attributes: Record< string, unknown >,
	options: { uniqueByBlock?: boolean } | boolean = {
		uniqueByBlock: false,
	}
) {
	if ( typeof options === 'boolean' ) {
		options = { uniqueByBlock: options };
	}

	return {
		type: 'UPDATE_BLOCK_ATTRIBUTES' as const,
		clientIds: castArray( clientIds ),
		attributes,
		options,
	};
}

/**
 * Action that updates the block with the specified client ID.
 *
 * @param clientId Block client ID.
 * @param updates  Block attributes to be merged.
 *
 * @return Action object.
 */
export function updateBlock(
	clientId: string,
	updates: Record< string, unknown >
) {
	return {
		type: 'UPDATE_BLOCK' as const,
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
 * @param clientId        Block client ID.
 * @param initialPosition Optional initial position. Pass -1 to reflect reverse selection
 *                        or `null` to prevent focusing the block.
 *
 * @return Action object.
 */
export function selectBlock(
	clientId: string,
	initialPosition: 0 | -1 | null = 0
) {
	return {
		type: 'SELECT_BLOCK' as const,
		initialPosition,
		clientId,
	};
}

/**
 * Returns an action object used in signalling that the block with the
 * specified client ID has been hovered.
 *
 * @deprecated
 */
export function hoverBlock() {
	deprecated( 'wp.data.dispatch( "core/block-editor" ).hoverBlock', {
		since: '6.9',
		version: '7.1',
	} );
	return {
		type: 'DO_NOTHING' as const,
	};
}

/**
 * Yields action objects used in signalling that the block preceding the given
 * clientId (or optionally, its first parent from bottom to top)
 * should be selected.
 *
 * @param clientId         Block client ID.
 * @param fallbackToParent If true, select the first parent if there is no previous block.
 */
export const selectPreviousBlock =
	( clientId: string, fallbackToParent = false ) =>
	( { select, dispatch }: any ) => {
		const previousBlockClientId =
			select.getPreviousBlockClientId( clientId );
		if ( previousBlockClientId ) {
			dispatch.selectBlock( previousBlockClientId, -1 );
		} else if ( fallbackToParent ) {
			const firstParentClientId = select.getBlockRootClientId( clientId );
			if ( firstParentClientId ) {
				dispatch.selectBlock( firstParentClientId, -1 );
			} else {
				// Fallback to next block when no previous block and no parent
				const nextBlockClientId =
					select.getNextBlockClientId( clientId );
				if ( nextBlockClientId ) {
					dispatch.selectBlock( nextBlockClientId, 0 );
				}
			}
		}
	};

/**
 * Yields action objects used in signalling that the block following the given
 * clientId should be selected.
 *
 * @param clientId Block client ID.
 */
export const selectNextBlock =
	( clientId: string ) =>
	( { select, dispatch }: any ) => {
		const nextBlockClientId = select.getNextBlockClientId( clientId );
		if ( nextBlockClientId ) {
			dispatch.selectBlock( nextBlockClientId );
		}
	};

/**
 * Action that starts block multi-selection.
 *
 * @return Action object.
 */
export function startMultiSelect() {
	return {
		type: 'START_MULTI_SELECT' as const,
	};
}

/**
 * Action that stops block multi-selection.
 *
 * @return Action object.
 */
export function stopMultiSelect() {
	return {
		type: 'STOP_MULTI_SELECT' as const,
	};
}

/**
 * Action that changes block multi-selection.
 *
 * @param start                         First block of the multi selection.
 * @param end                           Last block of the multiselection.
 * @param __experimentalInitialPosition Optional initial position. Pass as null to skip focus within editor canvas.
 */
export const multiSelect =
	(
		start: string,
		end: string,
		__experimentalInitialPosition: number | null = 0
	) =>
	( { select, dispatch }: any ) => {
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
 * @return Action object.
 */
export function clearSelectedBlock() {
	return {
		type: 'CLEAR_SELECTED_BLOCK' as const,
	};
}

/**
 * Action that enables or disables block selection.
 *
 * @param isSelectionEnabled Whether block selection should be enabled.
 *
 * @return Action object.
 */
export function toggleSelection( isSelectionEnabled = true ) {
	return {
		type: 'TOGGLE_SELECTION' as const,
		isSelectionEnabled,
	};
}

/**
 * Action that replaces given blocks with one or more replacement blocks.
 *
 * @param clientIds       Block client ID(s) to replace.
 * @param blocks          Replacement block(s).
 * @param indexToSelect   Index of replacement block to select.
 * @param initialPosition Index of caret after in the selected block after the operation.
 * @param meta            Optional Meta values to be passed to the action object.
 *
 * @return Action object.
 */
export const replaceBlocks =
	(
		clientIds: string | string[],
		blocks: Block | Block[],
		indexToSelect?: number,
		initialPosition: 0 | -1 | null = 0,
		meta?: Record< string, unknown >
	) =>
	( { select, dispatch, registry }: any ) => {
		const castClientIds = castArray( clientIds );
		const castBlocks = castArray( blocks );
		const rootClientId = select.getBlockRootClientId( castClientIds[ 0 ] );
		// Replace is valid if the new blocks can be inserted in the root block.
		for ( let index = 0; index < castBlocks.length; index++ ) {
			const block = castBlocks[ index ];
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
				clientIds: castClientIds,
				blocks: castBlocks,
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
 * @param clientId Block client ID to replace.
 * @param block    Replacement block(s).
 *
 * @return Action object.
 */
export function replaceBlock(
	clientId: string | string[],
	block: Block | Block[]
) {
	return replaceBlocks( clientId, block );
}

/**
 * Higher-order action creator which, given the action type to dispatch creates
 * an action creator for managing block movement.
 *
 * @param type Action type to dispatch.
 *
 * @return Action creator.
 */
const createOnMove =
	( type: string ) =>
	( clientIds: string | string[], rootClientId?: string ) =>
	( { select, dispatch }: any ) => {
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
 * @param clientIds        The client IDs of the blocks.
 * @param fromRootClientId Root client ID source.
 * @param toRootClientId   Root client ID destination.
 * @param index            The index to move the blocks to.
 */
export const moveBlocksToPosition =
	(
		clientIds: string[],
		fromRootClientId = '',
		toRootClientId = '',
		index?: number
	) =>
	( { select, dispatch }: any ) => {
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
 * @param clientId         The client ID of the block.
 * @param fromRootClientId Root client ID source.
 * @param toRootClientId   Root client ID destination.
 * @param index            The index to move the block to.
 */
export function moveBlockToPosition(
	clientId: string,
	fromRootClientId = '',
	toRootClientId = '',
	index?: number
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
 * @param block           Block object to insert.
 * @param index           Index at which block should be inserted.
 * @param rootClientId    Optional root client ID of block list on which to insert.
 * @param updateSelection If true block selection will be updated. If false, block selection will not change. Defaults to true.
 * @param initialPosition Initial focus position. Setting it to null prevent focusing the inserted block.
 * @param meta            Optional Meta values to be passed to the action object.
 *
 * @return Action object.
 */
export function insertBlock(
	block: Block,
	index?: number,
	rootClientId?: string,
	updateSelection?: boolean,
	initialPosition?: 0 | -1 | null,
	meta?: Record< string, unknown >
) {
	return insertBlocks(
		[ block ],
		index,
		rootClientId,
		updateSelection,
		initialPosition,
		meta
	);
}

/**
 * Action that inserts an array of blocks, optionally at a specific index respective a root block list.
 *
 * Only allowed blocks are inserted. The action may fail silently for blocks that are not allowed or if
 * a templateLock is active on the block list.
 *
 * @param blocks          Block objects to insert.
 * @param index           Index at which block should be inserted.
 * @param rootClientId    Optional root client ID of block list on which to insert.
 * @param updateSelection If true block selection will be updated.  If false, block selection will not change. Defaults to true.
 * @param initialPosition Initial focus position. Setting it to null prevent focusing the inserted block.
 * @param meta            Optional Meta values to be passed to the action object.
 *
 * @return Action object.
 */
export const insertBlocks =
	(
		blocks: Block | Block[],
		index?: number,
		rootClientId?: string,
		updateSelection = true,
		initialPosition: 0 | -1 | null | Record< string, unknown > = 0,
		meta?: Record< string, unknown >
	) =>
	( { select, dispatch }: any ) => {
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

		const castBlocks = castArray( blocks );
		const allowedBlocks: Block[] = [];
		for ( const block of castBlocks ) {
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
 * @param rootClientId                             Optional root client ID of block list on
 *                                                 which to insert.
 * @param index                                    Index at which block should be inserted.
 * @param __unstableOptions                        Additional options.
 * @param __unstableOptions.__unstableWithInserter Whether or not to show an inserter button.
 * @param __unstableOptions.operation              The operation to perform when applied,
 *                                                 either 'insert' or 'replace' for now.
 * @param __unstableOptions.nearestSide            The nearest side of the block being hovered.
 *
 * @return Action object.
 */
export function showInsertionPoint(
	rootClientId?: string,
	index?: number,
	__unstableOptions: {
		__unstableWithInserter?: boolean;
		operation?: WPDropOperation;
		nearestSide?: string;
	} = {}
) {
	const { __unstableWithInserter, operation, nearestSide } =
		__unstableOptions;
	return {
		type: 'SHOW_INSERTION_POINT' as const,
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
	( { select, dispatch }: any ) => {
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
 * @param isValid template validity flag.
 *
 * @return Action object.
 */
export function setTemplateValidity( isValid: boolean ) {
	return {
		type: 'SET_TEMPLATE_VALIDITY' as const,
		isValid,
	};
}

/**
 * Action that synchronizes the template with the list of blocks.
 *
 * @return Action object.
 */
export const synchronizeTemplate =
	() =>
	( { select, dispatch }: any ) => {
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
 * @param isForward
 */
export const __unstableDeleteSelection =
	( isForward: boolean ) =>
	( { registry, select, dispatch }: any ) => {
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

		if ( ! targetBlockType || ! targetBlockType.merge ) {
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
			const blockToMerge = blocksWithTheSameType.pop()!;
			updatedAttributes = targetBlockType.merge(
				blockToMerge.attributes,
				cloneB.attributes
			);
		} else {
			const blockToMerge = blocksWithTheSameType.shift()!;
			updatedAttributes = targetBlockType.merge(
				cloneA.attributes,
				blockToMerge.attributes
			);
		}

		// The attribute is guaranteed to be found since the marker character
		// was just inserted into one of the block's attributes above.
		const newAttributeKey = retrieveSelectedAttribute( updatedAttributes )!;

		const convertedHtml = updatedAttributes[ newAttributeKey ];
		const convertedValue = create( { html: convertedHtml } as {
			html: string;
		} );
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
				// Block A's inner blocks sit inside the selection; only B's survive.
				innerBlocks: blockB.innerBlocks,
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
 * @param blocks
 */
export const __unstableSplitSelection =
	( blocks: Block[] = [] ) =>
	( { registry, select, dispatch }: any ) => {
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
				: findRichTextAttributeKey( blockAType! );
		const attributeKeyB =
			typeof selectionB.attributeKey === 'string'
				? selectionB.attributeKey
				: findRichTextAttributeKey( blockBType! );
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
				if ( isUnmodifiedDefaultBlock( blockA, 'content' ) ) {
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
					return defaultBlockName &&
						select.canInsertBlockType(
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

		let head: any = {
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

		let tail: any = {
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

		let selection:
			| { clientId: string; attributeKey: string; offset: number }
			| undefined;
		const output: Block[] = [];
		const clonedBlocks = [ ...blocks ];
		// `blocks.length` was already confirmed non-zero above.
		const firstBlock = clonedBlocks.shift()!;
		// `head.name` always refers to an already registered block type.
		const headType = getBlockType( head.name )!;
		const firstBlocks =
			headType.merge && firstBlock.name === headType.name
				? [ firstBlock ]
				: switchToBlockType( firstBlock, headType.name );

		if ( firstBlocks?.length ) {
			const first = firstBlocks.shift()!;
			head = {
				...head,
				attributes: {
					...head.attributes,
					...headType.merge!( head.attributes, first.attributes ),
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
		// `tail.name` always refers to an already registered block type.
		const tailType = getBlockType( tail.name )!;

		if ( clonedBlocks.length ) {
			output.push( ...clonedBlocks );
		}

		if ( lastBlock ) {
			const lastBlocks =
				tailType.merge && tailType.name === lastBlock.name
					? [ lastBlock ]
					: switchToBlockType( lastBlock, tailType.name );

			if ( lastBlocks?.length ) {
				const last = lastBlocks.pop()!;
				output.push( {
					...tail,
					attributes: {
						...tail.attributes,
						...tailType.merge!( last.attributes, tail.attributes ),
					},
				} );
				output.push( ...lastBlocks );
				selection = {
					clientId: tail.clientId,
					attributeKey: attributeKeyB,
					offset: create( {
						html: last.attributes[ attributeKeyB ] as
							| string
							| undefined,
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
	( { select, dispatch }: any ) => {
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
 * @param firstBlockClientId  Client ID of the first block to merge.
 * @param secondBlockClientId Client ID of the second block to merge.
 */
export const mergeBlocks =
	( firstBlockClientId: string, secondBlockClientId: string ) =>
	( { registry, select, dispatch }: any ) => {
		const clientIdA = firstBlockClientId;
		const clientIdB = secondBlockClientId;
		const blockA = select.getBlock( clientIdA );
		const blockAType = getBlockType( blockA.name );

		if (
			! blockAType ||
			select.getBlockEditingMode( clientIdA ) === 'disabled' ||
			select.getBlockEditingMode( clientIdB ) === 'disabled'
		) {
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
			if ( isUnmodifiedBlock( blockB, 'content' ) ) {
				dispatch.removeBlock(
					clientIdB,
					select.isBlockSelected( clientIdB )
				);
			} else {
				dispatch.selectBlock( blockA.clientId );
			}
			return;
		}

		const blockBType = getBlockType( blockB.name );
		const { clientId, attributeKey, offset } = select.getSelectionStart();
		const selectedBlockType =
			clientId === clientIdA ? blockAType : blockBType;
		const attributeDefinition =
			selectedBlockType?.attributes[ attributeKey ];
		const canRestoreTextSelection =
			( clientId === clientIdA || clientId === clientIdB ) &&
			attributeKey !== undefined &&
			offset !== undefined &&
			// We cannot restore text selection if the RichText identifier
			// is not a defined block attribute key. This can be the case if the
			// fallback instance ID is used to store selection (and no RichText
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
				create( { html } as { html: string } ),
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
				retrieveSelectedAttribute( updatedAttributes )!;
			const convertedHtml = updatedAttributes[ newAttributeKey ];
			const convertedValue = create( { html: convertedHtml } as {
				html: string;
			} );
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
 * @param clientIds      Client IDs of blocks to remove.
 * @param selectPrevious True if the previous block
 *                       or the immediate parent
 *                       (if no previous block exists)
 *                       should be selected
 *                       when a block is removed.
 */
export const removeBlocks = (
	clientIds: string | string[],
	selectPrevious = true
) => privateRemoveBlocks( clientIds as string[], selectPrevious );

/**
 * Returns an action object used in signalling that the block with the
 * specified client ID has been removed.
 *
 * @param clientId       Client ID of block to remove.
 * @param selectPrevious True if the previous block should be selected when a block is removed.
 *
 * @return Action object.
 */
export function removeBlock( clientId: string, selectPrevious?: boolean ) {
	return removeBlocks( [ clientId ], selectPrevious );
}

/**
 * Returns an action object used in signalling that the inner blocks with the
 * specified client ID should be replaced.
 *
 * @param rootClientId    Client ID of the block whose InnerBlocks will re replaced.
 * @param blocks          Block objects to insert as new InnerBlocks
 * @param updateSelection If true block selection will be updated. If false, block selection will not change. Defaults to false.
 * @param initialPosition Initial block position.
 * @return Action object.
 */
export function replaceInnerBlocks(
	rootClientId: string,
	blocks: Block[],
	updateSelection = false,
	initialPosition: 0 | -1 | null = 0
) {
	return {
		type: 'REPLACE_INNER_BLOCKS' as const,
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
 * @param clientId Block client ID.
 *
 * @return Action object.
 */
export function toggleBlockMode( clientId: string ) {
	return {
		type: 'TOGGLE_BLOCK_MODE' as const,
		clientId,
	};
}

/**
 * Returns an action object used in signalling that the user has begun to type.
 *
 * @return Action object.
 */
export function startTyping() {
	return {
		type: 'START_TYPING' as const,
	};
}

/**
 * Returns an action object used in signalling that the user has stopped typing.
 *
 * @return Action object.
 */
export function stopTyping() {
	return {
		type: 'STOP_TYPING' as const,
	};
}

/**
 * Returns an action object used in signalling that the user has begun to drag blocks.
 *
 * @param clientIds An array of client ids being dragged
 *
 * @return Action object.
 */
export function startDraggingBlocks( clientIds: string[] = [] ) {
	return {
		type: 'START_DRAGGING_BLOCKS' as const,
		clientIds,
	};
}

/**
 * Returns an action object used in signalling that the user has stopped dragging blocks.
 *
 * @return Action object.
 */
export function stopDraggingBlocks() {
	return {
		type: 'STOP_DRAGGING_BLOCKS' as const,
	};
}

/**
 * Returns an action object used in signalling that the caret has entered formatted text.
 *
 * @deprecated
 *
 * @return Action object.
 */
export function enterFormattedText() {
	deprecated( 'wp.data.dispatch( "core/block-editor" ).enterFormattedText', {
		since: '6.1',
		version: '6.3',
	} );
	return {
		type: 'DO_NOTHING' as const,
	};
}

/**
 * Returns an action object used in signalling that the user caret has exited formatted text.
 *
 * @deprecated
 *
 * @return Action object.
 */
export function exitFormattedText() {
	deprecated( 'wp.data.dispatch( "core/block-editor" ).exitFormattedText', {
		since: '6.1',
		version: '6.3',
	} );
	return {
		type: 'DO_NOTHING' as const,
	};
}

/**
 * Action that changes the position of the user caret.
 *
 * @param clientId     The selected block client ID, or a WPSelection object.
 * @param attributeKey The selected block attribute key.
 * @param startOffset  The start offset.
 * @param endOffset    The end offset.
 *
 * @return Action object.
 */
export function selectionChange(
	clientId: string | WPSelection,
	attributeKey?: string,
	startOffset?: number,
	endOffset?: number
) {
	if ( typeof clientId === 'string' ) {
		return {
			type: 'SELECTION_CHANGE' as const,
			clientId,
			attributeKey,
			startOffset,
			endOffset,
		};
	}

	return { type: 'SELECTION_CHANGE' as const, ...clientId };
}

/**
 * Action that adds a new block of the default type to the block list.
 *
 * @param attributes   Optional attributes of the block to assign.
 * @param rootClientId Optional root client ID of block list on which
 *                     to append.
 * @param index        Optional index where to insert the default block.
 */
export const insertDefaultBlock =
	(
		attributes?: Record< string, unknown >,
		rootClientId?: string,
		index?: number
	) =>
	( { dispatch }: any ) => {
		// Abort if there is no default block type (if it has been unregistered).
		const defaultBlockName = getDefaultBlockName();
		if ( ! defaultBlockName ) {
			return;
		}

		const block = createBlock( defaultBlockName, attributes );

		return dispatch.insertBlock( block, index, rootClientId );
	};

export type SettingsByClientId = Record< string, Record< string, unknown > >;

/**
 * Action that changes the nested settings of the given block(s).
 *
 * @param clientId Client ID of the block whose
 *                 nested setting are being
 *                 received, or object of settings
 *                 by client ID.
 * @param settings Object with the new settings
 *                 for the nested block.
 *
 * @return Action object
 */
export function updateBlockListSettings(
	clientId: string | SettingsByClientId,
	settings: Record< string, unknown >
) {
	return {
		type: 'UPDATE_BLOCK_LIST_SETTINGS' as const,
		clientId,
		settings,
	};
}

/**
 * Action that updates the block editor settings.
 *
 * @param settings Updated settings
 *
 * @return Action object
 */
export function updateSettings( settings: Record< string, unknown > ) {
	return __experimentalUpdateSettings( settings, {
		stripExperimentalSettings: true,
	} );
}

/**
 * Action that signals that a temporary reusable block has been saved
 * in order to switch its temporary id with the real id.
 *
 * @deprecated
 */
export function __unstableSaveReusableBlock() {
	deprecated(
		'wp.data.dispatch( "core/block-editor" ).__unstableSaveReusableBlock',
		{
			since: '7.1',
		}
	);
	return {
		type: 'DO_NOTHING' as const,
	};
}

/**
 * Action that marks the last block change explicitly as persistent.
 *
 * @return Action object.
 */
export function __unstableMarkLastChangeAsPersistent() {
	return { type: 'MARK_LAST_CHANGE_AS_PERSISTENT' as const };
}

/**
 * Action that signals that the next block change should be marked explicitly
 * as not persistent.
 *
 * By default, non-persistent changes may still merge into undo history. Use
 * `history: 'ignore'` for derived changes that should never be captured by undo.
 *
 * @param options         Options object.
 * @param options.history How the change should interact with history.
 * @return Action object.
 */
export function __unstableMarkNextChangeAsNotPersistent( {
	history = 'merge',
}: { history?: string } = {} ) {
	return { type: 'MARK_NEXT_CHANGE_AS_NOT_PERSISTENT' as const, history };
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
	( { dispatch }: any ) => {
		dispatch( { type: 'MARK_AUTOMATIC_CHANGE' } );
		const {
			requestIdleCallback = ( cb: () => void ) => setTimeout( cb, 100 ),
		} = window as any;
		requestIdleCallback( () => {
			dispatch( { type: 'MARK_AUTOMATIC_CHANGE_FINAL' } );
		} );
	};

/**
 * Action that sets the editor mode
 *
 * @param mode Editor mode
 */
export const __unstableSetEditorMode =
	( mode: string ) =>
	( { registry }: any ) => {
		registry.dispatch( preferencesStore ).set( 'core', 'editorTool', mode );

		if ( mode === 'navigation' ) {
			speak( __( 'You are currently in Write mode.' ) );
		} else if ( mode === 'edit' ) {
			speak( __( 'You are currently in Design mode.' ) );
		}
	};

/**
 * Set the block moving client ID.
 *
 * @deprecated
 *
 * @return Action object.
 */
export function setBlockMovingClientId() {
	deprecated(
		'wp.data.dispatch( "core/block-editor" ).setBlockMovingClientId',
		{
			since: '6.7',
			hint: 'Block moving mode feature has been removed',
		}
	);
	return {
		type: 'DO_NOTHING' as const,
	};
}

/**
 * Action that duplicates a list of blocks.
 *
 * @param clientIds
 * @param updateSelection
 */
export const duplicateBlocks =
	( clientIds: string[], updateSelection = true ) =>
	( { select, dispatch }: any ) => {
		if ( ! clientIds || ! clientIds.length ) {
			return;
		}

		// Return early if blocks don't exist.
		const blocks = select.getBlocksByClientId( clientIds );
		if ( blocks.some( ( block: Block ) => ! block ) ) {
			return;
		}

		// Return early if blocks don't support multiple usage.
		const blockNames = blocks.map( ( block: Block ) => block.name );
		if (
			blockNames.some(
				( blockName: string ) =>
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
		const clonedBlocks = blocks.map( ( block: Block ) =>
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
		return clonedBlocks.map( ( block: Block ) => block.clientId );
	};

/**
 * Action that inserts a default block before a given block.
 *
 * @param clientId
 */
export const insertBeforeBlock =
	( clientId: string ) =>
	( { select, dispatch }: any ) => {
		if ( ! clientId ) {
			return;
		}
		const rootClientId = select.getBlockRootClientId( clientId );

		const blockIndex = select.getBlockIndex( clientId );
		const { defaultBlock: directInsertBlock } = rootClientId
			? select.getBlockListSettings( rootClientId ) ?? {}
			: {};

		if ( ! directInsertBlock ) {
			return dispatch.insertDefaultBlock( {}, rootClientId, blockIndex );
		}

		const copiedAttributes: Record< string, unknown > = {};
		if ( directInsertBlock.attributesToCopy ) {
			const attributes = select.getBlockAttributes( clientId );
			directInsertBlock.attributesToCopy.forEach( ( key: string ) => {
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
 * @param clientId
 */
export const insertAfterBlock =
	( clientId: string ) =>
	( { select, dispatch }: any ) => {
		if ( ! clientId ) {
			return;
		}
		const rootClientId = select.getBlockRootClientId( clientId );

		const blockIndex = select.getBlockIndex( clientId );
		const { defaultBlock: directInsertBlock } = rootClientId
			? select.getBlockListSettings( rootClientId ) ?? {}
			: {};

		if ( ! directInsertBlock ) {
			return dispatch.insertDefaultBlock(
				{},
				rootClientId,
				blockIndex + 1
			);
		}

		const copiedAttributes: Record< string, unknown > = {};
		if ( directInsertBlock.attributesToCopy ) {
			const attributes = select.getBlockAttributes( clientId );
			directInsertBlock.attributesToCopy.forEach( ( key: string ) => {
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
 * @param clientId      The block's clientId.
 * @param isHighlighted The highlight state.
 */
export function toggleBlockHighlight(
	clientId: string,
	isHighlighted: boolean
) {
	return {
		type: 'TOGGLE_BLOCK_HIGHLIGHT' as const,
		clientId,
		isHighlighted,
	};
}

/**
 * Action that "flashes" the block with a given `clientId` by rhythmically highlighting it.
 *
 * @param clientId Target block client ID.
 * @param timeout  Duration in milliseconds to keep the highlight. Defaults to 150ms.
 */
export const flashBlock =
	( clientId: string, timeout = 150 ) =>
	async ( { dispatch }: any ) => {
		dispatch( toggleBlockHighlight( clientId, true ) );
		await new Promise( ( resolve ) => setTimeout( resolve, timeout ) );
		dispatch( toggleBlockHighlight( clientId, false ) );
	};

/**
 * Action that sets whether a block has controlled inner blocks.
 *
 * @param clientId                 The block's clientId.
 * @param hasControlledInnerBlocks True if the block's inner blocks are controlled.
 */
export function setHasControlledInnerBlocks(
	clientId: string,
	hasControlledInnerBlocks: boolean
) {
	return {
		type: 'SET_HAS_CONTROLLED_INNER_BLOCKS' as const,
		hasControlledInnerBlocks,
		clientId,
	};
}

/**
 * Action that sets whether given blocks are visible on the canvas.
 *
 * @param updates For each block's clientId, its new visibility setting.
 */
export function setBlockVisibility( updates: Record< string, boolean > ) {
	return {
		type: 'SET_BLOCK_VISIBILITY' as const,
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
 * @param clientId The clientId of the block being temporarily edited.
 */
export function __unstableSetTemporarilyEditingAsBlocks( clientId?: string ) {
	deprecated(
		"wp.data.dispatch( 'core/block-editor' ).__unstableSetTemporarilyEditingAsBlocks",
		{
			since: '7.0',
		}
	);
	if ( ! clientId ) {
		return;
	}
	return editContentOnlySection( clientId );
}

/**
 * Registers a new inserter media category. Once registered, the media category is
 * available in the inserter's media tab.
 *
 * @param category The inserter media category to register.
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
 */
export const registerInserterMediaCategory =
	( category: InserterMediaCategory ) =>
	( { select, dispatch }: any ) => {
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
				( { name }: InserterMediaCategory ) => name === category.name
			)
		) {
			console.error(
				`A category is already registered with the same name: "${ category.name }".`
			);
			return;
		}
		if (
			registeredInserterMediaCategories.some(
				( { labels: { name } = {} as { name?: string } } ) =>
					name === category.labels?.name
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
 * Sets the block editing mode for a given block.
 *
 * @see useBlockEditingMode
 *
 * @param clientId The block client ID, or `''` for the root container.
 * @param mode     The block editing mode. One of `'disabled'`,
 *                 `'contentOnly'`, or `'default'`.
 *
 * @return Action object.
 */
export function setBlockEditingMode( clientId = '', mode: BlockEditingMode ) {
	return {
		type: 'SET_BLOCK_EDITING_MODE' as const,
		clientId,
		mode,
	};
}

/**
 * Clears the block editing mode for a given block.
 *
 * @see useBlockEditingMode
 *
 * @param clientId The block client ID, or `''` for the root container.
 *
 * @return Action object.
 */
export function unsetBlockEditingMode( clientId = '' ) {
	return {
		type: 'UNSET_BLOCK_EDITING_MODE' as const,
		clientId,
	};
}

/**
 * Sets which List View panel should be opened.
 *
 * @param clientId The client ID of the panel to open, or null to close all.
 * @return Action object.
 */
export function __unstableSetOpenListViewPanel( clientId: string | null ) {
	return {
		type: 'SET_OPEN_LIST_VIEW_PANEL' as const,
		clientId,
	};
}

/**
 * Sets all List View panels to be opened.
 *
 * @return Action object.
 */
export function __unstableSetAllListViewPanelsOpen() {
	return {
		type: 'SET_ALL_LIST_VIEW_PANELS_OPEN' as const,
	};
}

/**
 * Toggles a List View panel open/closed state.
 *
 * @param clientId The client ID of the panel to toggle.
 * @param isOpen   Whether the panel should be open.
 * @return Action object.
 */
export function __unstableToggleListViewPanel(
	clientId: string,
	isOpen: boolean
) {
	return {
		type: 'TOGGLE_LIST_VIEW_PANEL' as const,
		clientId,
		isOpen,
	};
}

/**
 * Increments the List View expand revision to force re-render.
 *
 * This action increments a counter that is used in the ListView component's key prop.
 * When the key changes, the component will remount with a fresh expanded state,
 * ensuring parent blocks show their children. For example, after click-through
 * navigation.
 *
 * @return Action object.
 */
export function __unstableIncrementListViewExpandRevision() {
	return {
		type: 'INCREMENT_LIST_VIEW_EXPAND_REVISION' as const,
	};
}
