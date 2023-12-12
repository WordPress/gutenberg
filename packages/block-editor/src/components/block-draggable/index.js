/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { Draggable } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockDraggableChip from './draggable-chip';
import useScrollWhenDragging from './use-scroll-when-dragging';
import { store as blockEditorStore } from '../../store';
import { __unstableUseBlockRef as useBlockRef } from '../block-list/use-block-props/use-block-refs';
import { useIsDropTargetValid } from '../use-block-drop-zone';

const BlockDraggable = ( {
	children,
	clientIds,
	cloneClassname,
	onDragStart,
	onDragEnd,
} ) => {
	const { srcRootClientId, isDraggable, icon, getBlockListSettings } =
		useSelect(
			( select ) => {
				const {
					canMoveBlocks,
					getBlockRootClientId,
					getBlockName,
					getBlockAttributes,
					getBlockListSettings: _getBlockListSettings,
				} = select( blockEditorStore );
				const { getBlockType, getActiveBlockVariation } =
					select( blocksStore );
				const rootClientId = getBlockRootClientId( clientIds[ 0 ] );
				const blockName = getBlockName( clientIds[ 0 ] );
				const variation = getActiveBlockVariation(
					blockName,
					getBlockAttributes( clientIds[ 0 ] )
				);

				return {
					srcRootClientId: rootClientId,
					isDraggable: canMoveBlocks( clientIds, rootClientId ),
					icon: variation?.icon || getBlockType( blockName )?.icon,
					getBlockListSettings: _getBlockListSettings,
				};
			},
			[ clientIds ]
		);

	const [ targetClientId, setTargetClientId ] = useState( null );

	const isDropTargetValid = useIsDropTargetValid( clientIds, targetClientId );

	const isDragging = useRef( false );
	const [ startScrolling, scrollOnDragOver, stopScrolling ] =
		useScrollWhenDragging();

	const { startDraggingBlocks, stopDraggingBlocks } =
		useDispatch( blockEditorStore );

	// Stop dragging blocks if the block draggable is unmounted.
	useEffect( () => {
		return () => {
			if ( isDragging.current ) {
				stopDraggingBlocks();
			}
		};
	}, [] );

	const blockRef = useBlockRef( clientIds[ 0 ] );
	const editorRoot = blockRef.current?.closest( 'body' );

	// Add a dragover event listener to the editor root to track the blocks being dragged over.
	// The listener has to be inside the editor iframe otherwise the target isn't accessible.
	// Check if the dragged blocks are allowed inside the target. If not, grey out the draggable.
	useEffect( () => {
		if ( ! editorRoot ) {
			return;
		}

		const onDragOver = ( event ) => {
			if ( ! event.target.closest( '[data-block]' ) ) {
				return;
			}

			const newTargetClientId = event.target
				.closest( '[data-block]' )
				.getAttribute( 'data-block' );
			//Only update targetClientId if it has changed
			// and if it's a container block
			if (
				targetClientId !== newTargetClientId &&
				getBlockListSettings( newTargetClientId )
			) {
				setTargetClientId( newTargetClientId );
			}
			// Update the body class to reflect if drop target is valid.
			// This has to be done on the document body because the draggable
			// chip is rendered outside of the editor iframe.
			if ( isDropTargetValid ) {
				window?.document?.body?.classList?.remove(
					'block-draggable-invalid-drag-token'
				);
			} else {
				window?.document?.body?.classList?.add(
					'block-draggable-invalid-drag-token'
				);
			}
		};

		editorRoot.addEventListener( 'dragover', onDragOver );

		return () => {
			editorRoot.removeEventListener( 'dragover', onDragOver );
		};
	} );

	if ( ! isDraggable ) {
		return children( { draggable: false } );
	}

	const transferData = {
		type: 'block',
		srcClientIds: clientIds,
		srcRootClientId,
	};

	return (
		<Draggable
			cloneClassname={ cloneClassname }
			__experimentalTransferDataType="wp-blocks"
			transferData={ transferData }
			onDragStart={ ( event ) => {
				// Defer hiding the dragged source element to the next
				// frame to enable dragging.
				window.requestAnimationFrame( () => {
					startDraggingBlocks( clientIds );
					isDragging.current = true;

					startScrolling( event );

					if ( onDragStart ) {
						onDragStart();
					}
				} );
			} }
			onDragOver={ scrollOnDragOver }
			onDragEnd={ () => {
				stopDraggingBlocks();
				isDragging.current = false;

				stopScrolling();

				if ( onDragEnd ) {
					onDragEnd();
				}
			} }
			__experimentalDragComponent={
				<BlockDraggableChip
					count={ clientIds.length }
					icon={ icon }
					clientIds={ clientIds }
					targetClientId={ targetClientId }
				/>
			}
			isValid={ isDropTargetValid }
		>
			{ ( { onDraggableStart, onDraggableEnd } ) => {
				return children( {
					draggable: true,
					onDragStart: onDraggableStart,
					onDragEnd: onDraggableEnd,
				} );
			} }
		</Draggable>
	);
};

export default BlockDraggable;
