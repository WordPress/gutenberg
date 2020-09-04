/**
 * WordPress dependencies
 */
import {
	findTransform,
	getBlockTransforms,
	pasteHandler,
} from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';

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

export function handleBlockDrop(
	droppedBlocks,
	targetRootClientId,
	targetBlockIndex,
	getBlockIndex,
	getClientIdsOfDescendants,
	moveBlocksToPosition
) {
	const {
		srcRootClientId: sourceRootClientId,
		srcClientIds: sourceClientIds,
		type: dropType,
	} = droppedBlocks;

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
}

export function handleFilesDrop(
	droppedFiles,
	targetRootClientId,
	targetBlockIndex,
	hasUploadPermissions,
	updateBlockAttributes,
	insertBlocks
) {
	if ( ! hasUploadPermissions ) {
		return;
	}

	const transformation = findTransform(
		getBlockTransforms( 'from' ),
		( transform ) =>
			transform.type === 'files' && transform.isMatch( droppedFiles )
	);

	if ( transformation ) {
		const blocks = transformation.transform(
			droppedFiles,
			updateBlockAttributes
		);
		insertBlocks( blocks, targetBlockIndex, targetRootClientId );
	}
}

export function handleHTMLDrop(
	droppedHTML,
	targetRootClientId,
	targetBlockIndex,
	insertBlocks
) {
	const blocks = pasteHandler( { droppedHTML, mode: 'BLOCKS' } );

	if ( blocks.length ) {
		insertBlocks( blocks, targetBlockIndex, targetRootClientId );
	}
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
	const [ droppedBlocks, setDroppedBlocks ] = useState( null );
	const [ droppedFiles, setDroppedFiles ] = useState( null );
	const [ droppedHTML, setDroppedHTML ] = useState( null );

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

	useEffect( () => {
		if ( droppedBlocks ) {
			handleBlockDrop(
				droppedBlocks,
				targetRootClientId,
				targetBlockIndex,
				getBlockIndex,
				getClientIdsOfDescendants,
				moveBlocksToPosition
			);
			setDroppedBlocks( null );
		}
	}, [
		droppedBlocks,
		setDroppedBlocks,
		targetRootClientId,
		targetBlockIndex,
		getBlockIndex,
		getClientIdsOfDescendants,
		moveBlocksToPosition,
	] );

	useEffect( () => {
		if ( droppedFiles ) {
			handleFilesDrop(
				droppedFiles,
				targetRootClientId,
				targetBlockIndex,
				hasUploadPermissions,
				updateBlockAttributes,
				insertBlocks
			);
			setDroppedFiles( null );
		}
	}, [
		droppedFiles,
		setDroppedFiles,
		targetBlockIndex,
		targetRootClientId,
		findTransform,
		getBlockTransforms,
		insertBlocks,
	] );

	useEffect( () => {
		if ( droppedHTML ) {
			handleHTMLDrop(
				droppedHTML,
				targetRootClientId,
				targetBlockIndex,
				insertBlocks
			);
			setDroppedHTML( null );
		}
	}, [
		droppedHTML,
		setDroppedHTML,
		targetRootClientId,
		targetBlockIndex,
		insertBlocks,
	] );

	// Optimization: callback dependency lists are kept as small as possible
	// with the actual drop event handled in an effect. This is because
	// whenever the callback function changes referentially, useDropZone
	// removes and re-adds the drop zone, causing a performance issue
	// when dragging.
	const onDrop = useCallback(
		( event ) => {
			const parsedEvent = parseDropEvent( event );
			if ( parsedEvent.type === 'block' ) {
				setDroppedBlocks( parsedEvent );
			}
		},
		[ parseDropEvent, setDroppedBlocks ]
	);

	const onFilesDrop = useCallback(
		( files ) => {
			setDroppedFiles( files );
		},
		[ setDroppedFiles ]
	);

	const onHTMLDrop = useCallback(
		( HTML ) => {
			setDroppedHTML( HTML );
		},
		[ setDroppedHTML ]
	);

	return {
		onDrop,
		onFilesDrop,
		onHTMLDrop,
	};
}
