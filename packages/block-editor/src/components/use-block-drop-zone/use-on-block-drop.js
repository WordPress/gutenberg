/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';

/** @typedef {import('@wordpress/element').WPSyntheticEvent} WPSyntheticEvent */

/**
 * Retrieve the data for a block drop event.
 *
 * @param {WPSyntheticEvent} event The drop event.
 *
 * @return {Object} An object with block drag and drop data.
 */
function parseDropEvent( event ) {
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

export default function useOnBlockDrop( targetRootClientId, targetBlockIndex ) {
	const { getBlockIndex, getClientIdsOfDescendants } = useSelect(
		( select ) => {
			const {
				getBlockIndex: _getBlockIndex,
				getClientIdsOfDescendants: _getClientIdsOfDescendants,
			} = select( 'core/block-editor' );

			return {
				_getBlockIndex,
				_getClientIdsOfDescendants,
			};
		},
		[]
	);

	const { moveBlocksToPosition } = useDispatch( 'core/block-editor' );

	return ( event ) => {
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
	};
}
