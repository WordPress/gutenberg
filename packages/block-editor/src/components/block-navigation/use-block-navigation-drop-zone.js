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

function getDropTargetBlocksData( ref, getRootClientId, getBlockIndex ) {
	if ( ! ref.current ) {
		return;
	}

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
		};
	} );
}

// Block navigation is always a vertical list, so only allow dropping
// to the above or below a block.
const ALLOWED_DROP_EDGES = [ 'top', 'bottom' ];

function getBlockNavigationDropTarget( blocksData, position ) {
	let offset;
	let candidateBlockData;
	let candidateDistance;

	blocksData.forEach( ( blockData ) => {
		const rect = blockData.element.getBoundingClientRect();
		const [ distance, edge ] = getDistanceToNearestEdge(
			position,
			rect,
			ALLOWED_DROP_EDGES
		);

		if ( candidateDistance === undefined || distance < candidateDistance ) {
			candidateDistance = distance;
			candidateBlockData = blockData;
			offset = edge === 'bottom' ? 1 : 0;
		}
	} );

	if ( ! candidateBlockData ) {
		return;
	}

	return {
		rootClientId: candidateBlockData.rootClientId,
		blockIndex: candidateBlockData.blockIndex + offset,
	};
}

export default function useBlockNavigationDropZone( ref ) {
	const { getBlockRootClientId, getBlockIndex } = useSelect( ( select ) => {
		const {
			getBlockRootClientId: _getBlockRootClientId,
			getBlockIndex: _getBlockIndex,
		} = select( 'core/block-editor' );
		return {
			getBlockRootClientId: _getBlockRootClientId,
			getBlockIndex: _getBlockIndex,
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

	const { position } = useDropZone( {
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
				getBlockRootClientId,
				getBlockIndex
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
