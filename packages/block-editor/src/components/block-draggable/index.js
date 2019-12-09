/**
 * External dependencies
 */
import { castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { Draggable } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';

const BlockDraggable = ( { children, clientIds } ) => {
	const {
		srcRootClientId,
		index,
		isDraggable,
	} = useSelect( ( select ) => {
		const {
			getBlockIndex,
			getBlockRootClientId,
			getTemplateLock,
		} = select( 'core/block-editor' );
		const normalizedClientIds = castArray( clientIds );
		const rootClientId = normalizedClientIds.length === 1 ? getBlockRootClientId( normalizedClientIds[ 0 ] ) : null;
		const templateLock = rootClientId ? getTemplateLock( rootClientId ) : null;

		return {
			index: getBlockIndex( normalizedClientIds[ 0 ], rootClientId ),
			srcRootClientId: rootClientId,
			isDraggable: normalizedClientIds.length === 1 && 'all' !== templateLock,
		};
	}, [ clientIds ] );
	const isDragging = useRef( false );
	const { startDraggingBlocks, stopDraggingBlocks } = useDispatch( 'core/block-editor' );

	// Stop dragging blocks if the block draggable is unmounted
	useEffect( () => {
		return () => {
			if ( isDragging.current ) {
				stopDraggingBlocks();
			}
		};
	}, [] );

	if ( ! isDraggable ) {
		return null;
	}

	const normalizedClientIds = castArray( clientIds );
	const blockElementId = `block-${ normalizedClientIds[ 0 ] }`;
	const transferData = {
		type: 'block',
		srcIndex: index,
		srcClientId: normalizedClientIds[ 0 ],
		srcRootClientId,
	};

	return (
		<Draggable
			elementId={ blockElementId }
			transferData={ transferData }
			onDragStart={ () => {
				startDraggingBlocks();
				isDragging.current = true;
			} }
			onDragEnd={ () => {
				stopDraggingBlocks();
				isDragging.current = false;
			} }
		>
			{
				( { onDraggableStart, onDraggableEnd } ) => {
					return children( {
						onDraggableStart,
						onDraggableEnd,
					} );
				}
			}
		</Draggable>
	);
};

export default BlockDraggable;
