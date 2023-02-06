/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import {
	cloneBlock,
	findTransform,
	getBlockTransforms,
	pasteHandler,
} from '@wordpress/blocks';
import { useDispatch, useSelect, useRegistry } from '@wordpress/data';
import { getFilesFromDataTransfer } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

/** @typedef {import('@wordpress/element').WPSyntheticEvent} WPSyntheticEvent */
/** @typedef {import('./types').WPDropOperation} WPDropOperation */

/**
 * Retrieve the data for a block drop event.
 *
 * @param {WPSyntheticEvent} event The drop event.
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
 * @return {Function} The event handler for a block drop event.
 */
export function onBlockDrop(
	targetRootClientId,
	targetBlockIndex,
	getBlockIndex,
	getClientIdsOfDescendants,
	moveBlocks,
	insertOrReplaceBlocks,
	clearSelectedBlock
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
 * @param {number}   targetBlockIndex      The index where the block(s) will be inserted.
 * @param {boolean}  hasUploadPermissions  Whether the user has upload permissions.
 * @param {Function} updateBlockAttributes A function that updates a block's attributes.
 * @param {Function} canInsertBlockType    A function that returns checks whether a block type can be inserted.
 * @param {Function} insertOrReplaceBlocks A function that inserts or replaces blocks.
 *
 * @return {Function} The event handler for a block-related file drop event.
 */
export function onFilesDrop(
	targetRootClientId,
	targetBlockIndex,
	hasUploadPermissions,
	updateBlockAttributes,
	canInsertBlockType,
	insertOrReplaceBlocks
) {
	return ( files ) => {
		if ( ! hasUploadPermissions ) {
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
 * @param {string}   targetRootClientId    The root client id where the block(s) will be inserted.
 * @param {number}   targetBlockIndex      The index where the block(s) will be inserted.
 * @param {Function} insertOrReplaceBlocks A function that inserts or replaces blocks.
 *
 * @return {Function} The event handler for a block-related HTML drop event.
 */
export function onHTMLDrop(
	targetRootClientId,
	targetBlockIndex,
	insertOrReplaceBlocks
) {
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
	const { operation = 'insert' } = options;
	const hasUploadPermissions = useSelect(
		( select ) => select( blockEditorStore ).getSettings().mediaUpload,
		[]
	);
	const {
		canInsertBlockType,
		getBlockIndex,
		getClientIdsOfDescendants,
		getBlockOrder,
		getBlocksByClientId,
	} = useSelect( blockEditorStore );
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
		( blocks, updateSelection = true, initialPosition = 0 ) => {
			if ( operation === 'replace' ) {
				const clientIds = getBlockOrder( targetRootClientId );
				const clientId = clientIds[ targetBlockIndex ];

				replaceBlocks( clientId, blocks, undefined, initialPosition );
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
			operation,
			getBlockOrder,
			insertBlocks,
			replaceBlocks,
			targetBlockIndex,
			targetRootClientId,
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
			insertBlocks,
			moveBlocksToPosition,
			removeBlocks,
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
		clearSelectedBlock
	);
	const _onFilesDrop = onFilesDrop(
		targetRootClientId,
		targetBlockIndex,
		hasUploadPermissions,
		updateBlockAttributes,
		canInsertBlockType,
		insertOrReplaceBlocks
	);
	const _onHTMLDrop = onHTMLDrop(
		targetRootClientId,
		targetBlockIndex,
		insertOrReplaceBlocks
	);

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
