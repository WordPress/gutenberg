/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import {
	cloneBlock,
	createBlock,
	findTransform,
	getBlockTransforms,
	pasteHandler,
	store as blocksStore,
} from '@wordpress/blocks';
import { useDispatch, useSelect, useRegistry } from '@wordpress/data';
import { getFilesFromDataTransfer } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/** @typedef {import('react').SyntheticEvent} SyntheticEvent */
/** @typedef {import('./types').WPDropOperation} WPDropOperation */

/**
 * Retrieve the data for a block drop event.
 *
 * @param {SyntheticEvent} event The drop event.
 *
 * @return {Object} An object with block drag and drop data.
 */
export function parseDropEvent( event ) {
	let result = {
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
	} catch ( err ) {
		return result;
	}

	return result;
}

/**
 * A function that returns an event handler function for block drop events.
 *
 * @param {string}   targetRootClientId        The root client id where the block(s) will be inserted.
 * @param {number}   targetBlockIndex          The index where the block(s) will be inserted.
 * @param {Function} getBlockIndex             A function that gets the index of a block.
 * @param {Function} getClientIdsOfDescendants A function that gets the client ids of descendant blocks.
 * @param {Function} moveBlocks                A function that moves blocks.
 * @param {Function} insertOrReplaceBlocks     A function that inserts or replaces blocks.
 * @param {Function} clearSelectedBlock        A function that clears block selection.
 * @param {string}   operation                 The type of operation to perform on drop. Could be `insert` or `replace` or `group`.
 * @param {Function} getBlock                  A function that returns a block given its client id.
 * @return {Function} The event handler for a block drop event.
 */
export function onBlockDrop(
	targetRootClientId,
	targetBlockIndex,
	getBlockIndex,
	getClientIdsOfDescendants,
	moveBlocks,
	insertOrReplaceBlocks,
	clearSelectedBlock,
	operation,
	getBlock
) {
	return ( event ) => {
		const {
			srcRootClientId: sourceRootClientId,
			srcClientIds: sourceClientIds,
			type: dropType,
			blocks,
		} = parseDropEvent( event );

		// If the user is inserting a block.
		if ( dropType === 'inserter' ) {
			clearSelectedBlock();
			const blocksToInsert = blocks.map( ( block ) =>
				cloneBlock( block )
			);
			insertOrReplaceBlocks( blocksToInsert, true, null );
		}

		// If the user is moving a block.
		if ( dropType === 'block' ) {
			const sourceBlockIndex = getBlockIndex( sourceClientIds[ 0 ] );

			// If the user is dropping to the same position, return early.
			if (
				sourceRootClientId === targetRootClientId &&
				sourceBlockIndex === targetBlockIndex
			) {
				return;
			}

			// If the user is attempting to drop a block within its own
			// nested blocks, return early as this would create infinite
			// recursion.
			if (
				sourceClientIds.includes( targetRootClientId ) ||
				getClientIdsOfDescendants( sourceClientIds ).some(
					( id ) => id === targetRootClientId
				)
			) {
				return;
			}

			// If the user is dropping a block over another block, replace both blocks
			// with a group block containing them
			if ( operation === 'group' ) {
				const blocksToInsert = sourceClientIds.map( ( clientId ) =>
					getBlock( clientId )
				);
				insertOrReplaceBlocks(
					blocksToInsert,
					true,
					null,
					sourceClientIds
				);
				return;
			}

			const isAtSameLevel = sourceRootClientId === targetRootClientId;
			const draggedBlockCount = sourceClientIds.length;

			// If the block is kept at the same level and moved downwards,
			// subtract to take into account that the blocks being dragged
			// were removed from the block list above the insertion point.
			const insertIndex =
				isAtSameLevel && sourceBlockIndex < targetBlockIndex
					? targetBlockIndex - draggedBlockCount
					: targetBlockIndex;

			moveBlocks( sourceClientIds, sourceRootClientId, insertIndex );
		}
	};
}

/**
 * A function that returns an event handler function for block-related file drop events.
 *
 * @param {string}   targetRootClientId    The root client id where the block(s) will be inserted.
 * @param {Function} getSettings           A function that gets the block editor settings.
 * @param {Function} updateBlockAttributes A function that updates a block's attributes.
 * @param {Function} canInsertBlockType    A function that returns checks whether a block type can be inserted.
 * @param {Function} insertOrReplaceBlocks A function that inserts or replaces blocks.
 *
 * @return {Function} The event handler for a block-related file drop event.
 */
export function onFilesDrop(
	targetRootClientId,
	getSettings,
	updateBlockAttributes,
	canInsertBlockType,
	insertOrReplaceBlocks
) {
	return ( files ) => {
		if ( ! getSettings().mediaUpload ) {
			return;
		}

		const transformation = findTransform(
			getBlockTransforms( 'from' ),
			( transform ) =>
				transform.type === 'files' &&
				canInsertBlockType( transform.blockName, targetRootClientId ) &&
				transform.isMatch( files )
		);

		if ( transformation ) {
			const blocks = transformation.transform(
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
 * @param {Function} insertOrReplaceBlocks A function that inserts or replaces blocks.
 *
 * @return {Function} The event handler for a block-related HTML drop event.
 */
export function onHTMLDrop( insertOrReplaceBlocks ) {
	return ( HTML ) => {
		const blocks = pasteHandler( { HTML, mode: 'BLOCKS' } );

		if ( blocks.length ) {
			insertOrReplaceBlocks( blocks );
		}
	};
}

/**
 * A React hook for handling block drop events.
 *
 * @param {string}          targetRootClientId  The root client id where the block(s) will be inserted.
 * @param {number}          targetBlockIndex    The index where the block(s) will be inserted.
 * @param {Object}          options             The optional options.
 * @param {WPDropOperation} [options.operation] The type of operation to perform on drop. Could be `insert` or `replace` for now.
 *
 * @return {Function} A function to be passed to the onDrop handler.
 */
export default function useOnBlockDrop(
	targetRootClientId,
	targetBlockIndex,
	options = {}
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
			blocks,
			updateSelection = true,
			initialPosition = 0,
			clientIdsToReplace = []
		) => {
			if ( ! Array.isArray( blocks ) ) {
				blocks = [ blocks ];
			}
			const clientIds = getBlockOrder( targetRootClientId );
			const clientId = clientIds[ targetBlockIndex ];
			if ( operation === 'replace' ) {
				replaceBlocks( clientId, blocks, undefined, initialPosition );
			} else if ( operation === 'group' ) {
				const targetBlock = getBlock( clientId );
				if ( nearestSide === 'left' ) {
					blocks.push( targetBlock );
				} else {
					blocks.unshift( targetBlock );
				}

				const groupInnerBlocks = blocks.map( ( block ) => {
					return createBlock(
						block.name,
						block.attributes,
						block.innerBlocks
					);
				} );

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
						: getGroupingBlockName(),
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
		( sourceClientIds, sourceRootClientId, insertIndex ) => {
			if ( operation === 'replace' ) {
				const sourceBlocks = getBlocksByClientId( sourceClientIds );
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

	return ( event ) => {
		const files = getFilesFromDataTransfer( event.dataTransfer );
		const html = event.dataTransfer.getData( 'text/html' );

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
