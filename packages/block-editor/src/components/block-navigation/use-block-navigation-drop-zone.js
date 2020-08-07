/**
 * WordPress dependencies
 */
import { __unstableUseDropZone as useDropZone } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { getDistanceToNearestEdge } from '@wordpress/dom';
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useOnHTMLDrop from '../use-block-drop-zone/use-on-html-drop';
import useOnFileDrop from '../use-block-drop-zone/use-on-file-drop';
import useOnBlockDrop from '../use-block-drop-zone/use-on-block-drop';

function getDropTargetBlocksData(
	ref,
	dragEventType,
	getRootClientId,
	getBlockIndex,
	getDraggedBlockClientIds,
	canInsertBlocks
) {
	if ( ! ref.current ) {
		return;
	}

	const isBlockDrag = dragEventType === 'default';

	const draggedBlockClientIds = isBlockDrag
		? getDraggedBlockClientIds()
		: undefined;

	const blockElements = Array.from(
		ref.current.querySelectorAll( '[data-block]' )
	);

	return blockElements.map( ( blockElement ) => {
		const clientId = blockElement.dataset.block;
		const rootClientId = getRootClientId( clientId );

		return {
			clientId,
			rootClientId,
			blockIndex: getBlockIndex( clientId, rootClientId ),
			element: blockElement,
			orientation: 'vertical',
			canInsertDraggedBlocksAsSibling: isBlockDrag
				? canInsertBlocks( draggedBlockClientIds, rootClientId )
				: true,
			canInsertDraggedBlocksAsChild: isBlockDrag
				? canInsertBlocks( draggedBlockClientIds, clientId )
				: true,
		};
	} );
}

function isPointContainedByRect( point, rect ) {
	return (
		rect.left <= point.x &&
		rect.right >= point.x &&
		rect.top <= point.y &&
		rect.bottom >= point.y
	);
}

function isDroppingToInnerBlocks( point, rect ) {
	const blockCenterX = rect.left + rect.width / 2;
	return point.x > blockCenterX;
}

// Block navigation is always a vertical list, so only allow dropping
// to the above or below a block.
const ALLOWED_DROP_EDGES = [ 'top', 'bottom' ];

function getBlockNavigationDropTarget( blocksData, position ) {
	let candidateEdge;
	let candidateBlockData;
	let candidateDistance;
	let candidateRect;

	for ( const blockData of blocksData ) {
		const rect = blockData.element.getBoundingClientRect();
		const [ distance, edge ] = getDistanceToNearestEdge(
			position,
			rect,
			ALLOWED_DROP_EDGES
		);

		if ( candidateDistance === undefined || distance < candidateDistance ) {
			candidateDistance = distance;
			candidateBlockData = blockData;
			candidateEdge = edge;
			candidateRect = rect;
		}

		// If the mouse position is within the block, break early
		// as the user would intend to drop either before or after
		// this block.
		//
		// This solves an issue where some rows in the block navigation
		// tree overlap slightly due to sub-pixel rendering.
		if ( isPointContainedByRect( position, rect ) ) {
			break;
		}
	}

	if ( ! candidateBlockData ) {
		return;
	}

	const isDraggingBelow = candidateEdge === 'bottom';

	// If the user is dragging towards the bottom of the block check whether
	// they might be inserting as a child.
	if (
		isDraggingBelow &&
		candidateBlockData.canInsertDraggedBlocksAsChild &&
		isDroppingToInnerBlocks( position, candidateRect )
	) {
		return {
			rootClientId: candidateBlockData.clientId,
			blockIndex: 0,
		};
	}

	const offset = isDraggingBelow ? 1 : 0;
	return {
		rootClientId: candidateBlockData.rootClientId,
		blockIndex: candidateBlockData.blockIndex + offset,
	};
}

export default function useBlockNavigationDropZone( ref ) {
	const {
		canInsertBlocks,
		getBlockRootClientId,
		getBlockIndex,
		getDraggedBlockClientIds,
	} = useSelect( ( select ) => {
		const {
			canInsertBlocks: _canInsertBlocks,
			getBlockRootClientId: _getBlockRootClientId,
			getBlockIndex: _getBlockIndex,
			getDraggedBlockClientIds: _getDraggedBlockClientIds,
		} = select( 'core/block-editor' );
		return {
			canInsertBlocks: _canInsertBlocks,
			getBlockRootClientId: _getBlockRootClientId,
			getBlockIndex: _getBlockIndex,
			getDraggedBlockClientIds: _getDraggedBlockClientIds,
		};
	}, [] );

	const [ target = {}, setTarget ] = useState();
	const {
		rootClientId: targetRootClientId,
		blockIndex: targetBlockIndex,
	} = target;

	const onHTMLDrop = useOnHTMLDrop( targetRootClientId, targetBlockIndex );
	const onFilesDrop = useOnFileDrop( targetRootClientId, targetBlockIndex );
	const onDrop = useOnBlockDrop( targetRootClientId, targetBlockIndex );

	const { position, type: dragEventType } = useDropZone( {
		element: ref,
		onFilesDrop,
		onHTMLDrop,
		onDrop,
		withPosition: true,
	} );

	const hasPosition = !! position;
	const blocksData = useRef();

	// When the user starts dragging, build a list of block elements.
	useEffect( () => {
		if ( hasPosition ) {
			blocksData.current = getDropTargetBlocksData(
				ref,
				dragEventType,
				getBlockRootClientId,
				getBlockIndex,
				getDraggedBlockClientIds,
				canInsertBlocks
			);
		}
	}, [ hasPosition ] );

	// Calculate the drop target based on the drag position.
	useEffect( () => {
		if ( position ) {
			const newTarget = getBlockNavigationDropTarget(
				blocksData.current,
				position
			);
			if ( target ) {
				setTarget( newTarget );
			}
		}
	}, [ position ] );

	if ( position ) {
		return target;
	}
}
