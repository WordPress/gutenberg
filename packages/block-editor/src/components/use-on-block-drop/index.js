/**
 * WordPress dependencies
 */
import {
	findTransform,
	getBlockTransforms,
	pasteHandler,
} from '@wordpress/blocks';
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

/**
 * A function that returns an event handler function for block drop events.
 *
 * @param {string}   targetRootClientId        The root client id where the block(s) will be inserted.
 * @param {number}   targetBlockIndex          The index where the block(s) will be inserted.
 * @param {Function} getBlockIndex             A function that gets the index of a block.
 * @param {Function} getClientIdsOfDescendants A function that gets the client ids of descendant blocks.
 * @param {Function} moveBlocksToPosition      A function that moves blocks.
 *
 * @return {Function} The event handler for a block drop event.
 */
function onBlockDrop(
	targetRootClientId,
	targetBlockIndex,
	getBlockIndex,
	getClientIdsOfDescendants,
	moveBlocksToPosition
) {
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

/**
 * A function that returns an event handler function for block-related file drop events.
 *
 * @param {string}   targetRootClientId    The root client id where the block(s) will be inserted.
 * @param {number}   targetBlockIndex      The index where the block(s) will be inserted.
 * @param {boolean}  hasUploadPermissions  Whether the user has upload permissions.
 * @param {Function} updateBlockAttributes A function that updates a block's attributes.
 * @param {Function} insertBlocks          A function that inserts blocks.
 *
 * @return {Function} The event handler for a block-related file drop event.
 */
function onFileDrop(
	targetRootClientId,
	targetBlockIndex,
	hasUploadPermissions,
	updateBlockAttributes,
	insertBlocks
) {
	return ( files ) => {
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
	};
}

/**
 * A function that returns an event handler function for block-related HTML drop events.
 *
 * @param {string}   targetRootClientId    The root client id where the block(s) will be inserted.
 * @param {number}   targetBlockIndex      The index where the block(s) will be inserted.
 * @param {Function} insertBlocks          A function that inserts blocks.
 *
 * @return {Function} The event handler for a block-related HTML drop event.
 */
function onHTMLDrop( targetRootClientId, targetBlockIndex, insertBlocks ) {
	return ( HTML ) => {
		const blocks = pasteHandler( { HTML, mode: 'BLOCKS' } );

		if ( blocks.length ) {
			insertBlocks( blocks, targetBlockIndex, targetRootClientId );
		}
	};
}

/**
 * A React hook for handling block drop events.
 *
 * @param {string}   targetRootClientId        The root client id where the block(s) will be inserted.
 * @param {number}   targetBlockIndex          The index where the block(s) will be inserted.
 *
 * @return {Function[]} An object that contains the event handlers `onDrop`, `onFileDrop` and `onHTMLDrop`.
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

	return {
		onDrop: onBlockDrop(
			targetRootClientId,
			targetBlockIndex,
			getBlockIndex,
			getClientIdsOfDescendants,
			moveBlocksToPosition
		),
		onFileDrop: onFileDrop(
			targetRootClientId,
			targetBlockIndex,
			hasUploadPermissions,
			updateBlockAttributes,
			insertBlocks
		),
		onHTMLDrop: onHTMLDrop(
			targetRootClientId,
			targetBlockIndex,
			insertBlocks
		),
	};
}
