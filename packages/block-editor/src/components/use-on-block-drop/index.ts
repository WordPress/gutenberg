import { useCallback } from '@wordpress/element';
import {
	cloneBlock,
	createBlock,
	cloneSanitizedBlock,
	findTransform,
	getBlockTransforms,
	pasteHandler,
	store as blocksStore,
} from '@wordpress/blocks';
import { useDispatch, useSelect, useRegistry } from '@wordpress/data';
import { getFilesFromDataTransfer } from '@wordpress/dom';
import type { Block, BlockFilesTransform } from '@wordpress/blocks';
import type { DragEvent } from 'react';
import { store as blockEditorStore } from '../../store';
import type { Settings } from '../../store/types';
import type {
	BlockDropData,
	BlockDropOperation,
	InsertOrReplaceBlocks,
	MoveBlocks,
	UseOnBlockDropOptions,
} from './types';

/**
 * Retrieve the data for a block drop event.
 *
 * @param event The drop event.
 *
 * @return An object with block drag and drop data.
 */
export function parseDropEvent(
	event: DragEvent | globalThis.DragEvent
): BlockDropData {
	let result: BlockDropData = {
		srcRootClientId: null,
		srcClientIds: null,
		srcIndex: null,
		type: null,
		blocks: null,
	};

	if ( ! event.dataTransfer ) {
		return result;
	}

	try {
		result = Object.assign(
			result,
			JSON.parse( event.dataTransfer.getData( 'wp-blocks' ) )
		);
	} catch {
		return result;
	}

	return result;
}

/**
 * A function that returns an event handler function for block drop events.
 *
 * @param targetRootClientId        The root client id where the block(s) will be inserted.
 * @param targetBlockIndex          The index where the block(s) will be inserted.
 * @param getBlockIndex             A function that gets the index of a block.
 * @param getClientIdsOfDescendants A function that gets the client ids of descendant blocks.
 * @param moveBlocks                A function that moves blocks.
 * @param insertOrReplaceBlocks     A function that inserts or replaces blocks.
 * @param clearSelectedBlock        A function that clears block selection.
 * @param operation                 The type of operation to perform on drop. Could be `insert` or `replace` or `group`.
 * @param getBlock                  A function that returns a block given its client id.
 * @return The event handler for a block drop event.
 */
export function onBlockDrop(
	targetRootClientId: string | null | undefined,
	targetBlockIndex: number,
	getBlockIndex: ( clientId: string ) => number,
	getClientIdsOfDescendants: ( clientIds: string[] ) => string[],
	moveBlocks: MoveBlocks,
	insertOrReplaceBlocks: InsertOrReplaceBlocks,
	clearSelectedBlock: () => void,
	operation: BlockDropOperation,
	getBlock: ( clientId: string ) => Block | null
) {
	return ( event: DragEvent | globalThis.DragEvent ) => {
		const {
			srcRootClientId: sourceRootClientId,
			srcClientIds: sourceClientIds,
			type: dropType,
			blocks,
		} = parseDropEvent( event );

		// If the user is inserting a block.
		if ( dropType === 'inserter' ) {
			clearSelectedBlock();
			// An inserter drop carries the blocks.
			const blocksToInsert = blocks!.map( ( block ) =>
				cloneBlock( block )
			);
			insertOrReplaceBlocks( blocksToInsert, true, null );
		}

		// If the user is moving a block.
		if ( dropType === 'block' ) {
			// A block drop carries the dragged client IDs.
			const sourceBlockIndex = getBlockIndex( sourceClientIds![ 0 ] );

			// If the user is dropping to the same position, including between
			// the dragged blocks, return early.
			const lastSamePositionIndex =
				operation === 'insert'
					? sourceBlockIndex + sourceClientIds!.length
					: sourceBlockIndex;
			if (
				sourceRootClientId === targetRootClientId &&
				targetBlockIndex >= sourceBlockIndex &&
				targetBlockIndex <= lastSamePositionIndex
			) {
				return;
			}

			// If the user is attempting to drop a block within its own
			// nested blocks, return early as this would create infinite
			// recursion.
			if (
				// A drop at the root compares the dragged IDs with `undefined`.
				sourceClientIds!.includes( targetRootClientId as string ) ||
				getClientIdsOfDescendants( sourceClientIds! ).some(
					( id ) => id === targetRootClientId
				)
			) {
				return;
			}

			// If the user is dropping a block over another block, replace both blocks
			// with a group block containing them
			if ( operation === 'group' ) {
				const blocksToInsert = sourceClientIds!.map(
					// The dragged blocks exist.
					( clientId ) => getBlock( clientId )!
				);
				insertOrReplaceBlocks(
					blocksToInsert,
					true,
					null,
					sourceClientIds!
				);
				return;
			}

			const isAtSameLevel = sourceRootClientId === targetRootClientId;
			const draggedBlockCount = sourceClientIds!.length;

			// If the block is kept at the same level and moved downwards,
			// subtract to take into account that the blocks being dragged
			// were removed from the block list above the insertion point.
			const insertIndex =
				isAtSameLevel && sourceBlockIndex < targetBlockIndex
					? targetBlockIndex - draggedBlockCount
					: targetBlockIndex;

			moveBlocks( sourceClientIds!, sourceRootClientId, insertIndex );
		}
	};
}

/**
 * A function that returns an event handler function for block-related file drop events.
 *
 * @param targetRootClientId    The root client id where the block(s) will be inserted.
 * @param getSettings           A function that gets the block editor settings.
 * @param updateBlockAttributes A function that updates a block's attributes.
 * @param canInsertBlockType    A function that returns checks whether a block type can be inserted.
 * @param insertOrReplaceBlocks A function that inserts or replaces blocks.
 *
 * @return The event handler for a block-related file drop event.
 */
export function onFilesDrop(
	targetRootClientId: string | null | undefined,
	getSettings: () => Settings,
	updateBlockAttributes: (
		clientId: string,
		attributes: Record< string, unknown >
	) => void,
	canInsertBlockType: (
		blockName: string,
		rootClientId?: string | null
	) => boolean,
	insertOrReplaceBlocks: InsertOrReplaceBlocks
) {
	return ( files: File[] ) => {
		if ( ! getSettings().mediaUpload ) {
			return;
		}

		const transformation = findTransform(
			getBlockTransforms( 'from' ),
			( transform ) =>
				transform.type === 'files' &&
				canInsertBlockType( transform.blockName, targetRootClientId ) &&
				// Files transforms define a matcher.
				transform.isMatch!( files )
		);

		if ( transformation ) {
			// The predicate only matches files transforms, which transform.
			const blocks = ( transformation as BlockFilesTransform ).transform!(
				files,
				updateBlockAttributes
			);
			insertOrReplaceBlocks( blocks );
		}
	};
}

/**
 * A function that returns an event handler function for block-related HTML drop events.
 *
 * @param insertOrReplaceBlocks A function that inserts or replaces blocks.
 *
 * @return The event handler for a block-related HTML drop event.
 */
export function onHTMLDrop( insertOrReplaceBlocks: InsertOrReplaceBlocks ) {
	return ( HTML: string ) => {
		const blocks = pasteHandler( { HTML, mode: 'BLOCKS' } );

		if ( blocks.length ) {
			// The `BLOCKS` mode returns blocks.
			insertOrReplaceBlocks( blocks as Block[] );
		}
	};
}

/**
 * A React hook for handling block drop events.
 *
 * @param targetRootClientId  The root client id where the block(s) will be inserted.
 * @param targetBlockIndex    The index where the block(s) will be inserted.
 * @param options             The optional options.
 * @param options.operation   The type of operation to perform on drop. Could be `insert`, `replace` or `group`.
 * @param options.nearestSide The side of the target block a grouped block is placed on.
 *
 * @return A function to be passed to the onDrop handler.
 */
export default function useOnBlockDrop(
	targetRootClientId: string | null | undefined,
	targetBlockIndex: number,
	options: UseOnBlockDropOptions = {}
) {
	const { operation = 'insert', nearestSide = 'right' } = options;
	const {
		canInsertBlockType,
		getBlockIndex,
		getClientIdsOfDescendants,
		getBlockOrder,
		getBlocksByClientId,
		getSettings,
		getBlock,
	} = useSelect( blockEditorStore );
	const { getGroupingBlockName } = useSelect( blocksStore );
	const {
		insertBlocks,
		moveBlocksToPosition,
		updateBlockAttributes,
		clearSelectedBlock,
		replaceBlocks,
		removeBlocks,
	} = useDispatch( blockEditorStore );
	const registry = useRegistry();

	const insertOrReplaceBlocks = useCallback(
		(
			blocks: Block | Block[],
			updateSelection = true,
			initialPosition: 0 | -1 | null = 0,
			clientIdsToReplace: string[] = []
		) => {
			if ( ! Array.isArray( blocks ) ) {
				blocks = [ blocks ];
			}
			const clientIds = getBlockOrder( targetRootClientId );
			const clientId = clientIds[ targetBlockIndex ];
			if ( operation === 'replace' ) {
				replaceBlocks( clientId, blocks, undefined, initialPosition );
			} else if ( operation === 'group' ) {
				// The drop target block exists.
				const targetBlock = getBlock( clientId )!;
				if ( nearestSide === 'left' ) {
					blocks.push( targetBlock );
				} else {
					blocks.unshift( targetBlock );
				}

				const groupInnerBlocks = blocks.map( ( block ) =>
					cloneSanitizedBlock( block )
				);

				const areAllImages = blocks.every( ( block ) => {
					return block.name === 'core/image';
				} );

				const galleryBlock = canInsertBlockType(
					'core/gallery',
					targetRootClientId
				);

				const wrappedBlocks = createBlock(
					areAllImages && galleryBlock
						? 'core/gallery'
						: // A grouping block type is registered.
							getGroupingBlockName()!,
					{
						layout: {
							type: 'flex',
							flexWrap:
								areAllImages && galleryBlock ? null : 'nowrap',
						},
					},
					groupInnerBlocks
				);
				// Need to make sure both the target block and the block being dragged are replaced
				// otherwise the dragged block will be duplicated.
				replaceBlocks(
					[ clientId, ...clientIdsToReplace ],
					wrappedBlocks,
					undefined,
					initialPosition
				);
			} else {
				insertBlocks(
					blocks,
					targetBlockIndex,
					targetRootClientId,
					updateSelection,
					initialPosition
				);
			}
		},
		[
			getBlockOrder,
			targetRootClientId,
			targetBlockIndex,
			operation,
			replaceBlocks,
			getBlock,
			nearestSide,
			canInsertBlockType,
			getGroupingBlockName,
			insertBlocks,
		]
	);

	const moveBlocks = useCallback(
		(
			sourceClientIds: string[],
			sourceRootClientId: string | null,
			insertIndex: number
		) => {
			if ( operation === 'replace' ) {
				// The dragged blocks exist.
				const sourceBlocks = getBlocksByClientId(
					sourceClientIds
				) as Block[];
				const targetBlockClientIds =
					getBlockOrder( targetRootClientId );
				const targetBlockClientId =
					targetBlockClientIds[ targetBlockIndex ];

				registry.batch( () => {
					// Remove the source blocks.
					removeBlocks( sourceClientIds, false );
					// Replace the target block with the source blocks.
					replaceBlocks(
						targetBlockClientId,
						sourceBlocks,
						undefined,
						0
					);
				} );
			} else {
				moveBlocksToPosition(
					sourceClientIds,
					sourceRootClientId,
					targetRootClientId,
					insertIndex
				);
			}
		},
		[
			operation,
			getBlockOrder,
			getBlocksByClientId,
			moveBlocksToPosition,
			registry,
			removeBlocks,
			replaceBlocks,
			targetBlockIndex,
			targetRootClientId,
		]
	);

	const _onDrop = onBlockDrop(
		targetRootClientId,
		targetBlockIndex,
		getBlockIndex,
		getClientIdsOfDescendants,
		moveBlocks,
		insertOrReplaceBlocks,
		clearSelectedBlock,
		operation,
		getBlock
	);
	const _onFilesDrop = onFilesDrop(
		targetRootClientId,
		getSettings,
		updateBlockAttributes,
		canInsertBlockType,
		insertOrReplaceBlocks
	);
	const _onHTMLDrop = onHTMLDrop( insertOrReplaceBlocks );

	return ( event: DragEvent | globalThis.DragEvent ) => {
		// Drop events carry a data transfer.
		const files = getFilesFromDataTransfer( event.dataTransfer! );
		const html = event.dataTransfer!.getData( 'text/html' );

		/**
		 * From Windows Chrome 96, the `event.dataTransfer` returns both file object and HTML.
		 * The order of the checks is important to recognise the HTML drop.
		 */
		if ( html ) {
			_onHTMLDrop( html );
		} else if ( files.length ) {
			_onFilesDrop( files );
		} else {
			_onDrop( event );
		}
	};
}
