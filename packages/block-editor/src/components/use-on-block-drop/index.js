/**
 * WordPress dependencies
 */
import {
	findTransform,
	getBlockTransforms,
	pasteHandler,
} from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';

/** @typedef {import('@wordpress/element').WPSyntheticEvent} WPSyntheticEvent */

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
	};

	if ( ! event.dataTransfer ) {
		return result;
	}

	try {
		result = Object.assign(
			result,
			JSON.parse( event.dataTransfer.getData( 'text' ) )
		);
	} catch ( err ) {
		return result;
	}

	return result;
}

/**
 * A React hook for handling block drop events.
 *
 * @param {string} targetRootClientId The root client id where the block(s) will be inserted.
 * @param {number} targetBlockIndex   The index where the block(s) will be inserted.
 *
 * @return {Object} An object that contains the event handlers `onDrop`, `onFilesDrop` and `onHTMLDrop`.
 */
export default function useOnBlockDrop( targetRootClientId, targetBlockIndex ) {
	const {
		getBlockIndex,
		getClientIdsOfDescendants,
		hasUploadPermissions,
	} = useSelect( ( select ) => {
		const {
			getBlockIndex: _getBlockIndex,
			getClientIdsOfDescendants: _getClientIdsOfDescendants,
			getSettings,
		} = select( 'core/block-editor' );

		return {
			getBlockIndex: _getBlockIndex,
			getClientIdsOfDescendants: _getClientIdsOfDescendants,
			hasUploadPermissions: getSettings().mediaUpload,
		};
	}, [] );

	const {
		insertBlocks,
		moveBlocksToPosition,
		updateBlockAttributes,
	} = useDispatch( 'core/block-editor' );

	const onDrop = useCallback(
		( event ) => {
			const {
				srcRootClientId: sourceRootClientId,
				srcClientIds: sourceClientIds,
				type: dropType,
			} = parseDropEvent( event );

			// If the user isn't dropping a block, return early.
			if ( dropType !== 'block' ) {
				return;
			}

			const sourceBlockIndex = getBlockIndex(
				sourceClientIds[ 0 ],
				sourceRootClientId
			);

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

			moveBlocksToPosition(
				sourceClientIds,
				sourceRootClientId,
				targetRootClientId,
				insertIndex
			);
		},
		[
			targetRootClientId,
			targetBlockIndex,
			getBlockIndex,
			getClientIdsOfDescendants,
			moveBlocksToPosition,
		]
	);

	const onFilesDrop = useCallback(
		( files ) => {
			if ( ! hasUploadPermissions ) {
				return;
			}

			const transformation = findTransform(
				getBlockTransforms( 'from' ),
				( transform ) =>
					transform.type === 'files' && transform.isMatch( files )
			);

			if ( transformation ) {
				const blocks = transformation.transform(
					files,
					updateBlockAttributes
				);
				insertBlocks( blocks, targetBlockIndex, targetRootClientId );
			}
		},
		[
			targetRootClientId,
			targetBlockIndex,
			hasUploadPermissions,
			updateBlockAttributes,
			insertBlocks,
		]
	);

	const onHTMLDrop = useCallback(
		( HTML ) => {
			const blocks = pasteHandler( { HTML, mode: 'BLOCKS' } );

			if ( blocks.length ) {
				insertBlocks( blocks, targetBlockIndex, targetRootClientId );
			}
		},
		[ targetRootClientId, targetBlockIndex, insertBlocks ]
	);

	return {
		onDrop,
		onFilesDrop,
		onHTMLDrop,
	};
}
