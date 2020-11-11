/**
 * WordPress dependencies
 */
import { Draggable } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useContext, useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockDraggableChip from './draggable-chip';
import useScrollWhenDragging from './use-scroll-when-dragging';
import { BlockNodes } from '../block-list/root-container';

const BlockDraggable = ( {
	children,
	clientIds,
	cloneClassname,
	onDragStart,
	onDragEnd,
	elementId,
} ) => {
	const { srcRootClientId, isDraggable } = useSelect(
		( select ) => {
			const { getBlockRootClientId, getTemplateLock } = select(
				'core/block-editor'
			);
			const rootClientId = getBlockRootClientId( clientIds[ 0 ] );
			const templateLock = rootClientId
				? getTemplateLock( rootClientId )
				: null;

			return {
				srcRootClientId: rootClientId,
				isDraggable: 'all' !== templateLock,
			};
		},
		[ clientIds ]
	);
	const isDragging = useRef( false );
	const [
		startScrolling,
		scrollOnDragOver,
		stopScrolling,
	] = useScrollWhenDragging();

	const { startDraggingBlocks, stopDraggingBlocks } = useDispatch(
		'core/block-editor'
	);

	// Stop dragging blocks if the block draggable is unmounted
	useEffect( () => {
		return () => {
			if ( isDragging.current ) {
				stopDraggingBlocks();
			}
		};
	}, [] );

	const blockNodes = useContext( BlockNodes );

	if ( ! isDraggable ) {
		return children( { isDraggable: false } );
	}

	const element = elementId
		? document.getElementById( elementId )
		: blockNodes[ clientIds[ 0 ] ];
	const transferData = {
		type: 'block',
		srcClientIds: clientIds,
		srcRootClientId,
	};

	return (
		<Draggable
			cloneClassname={ cloneClassname }
			element={ element }
			transferData={ transferData }
			onDragStart={ ( event ) => {
				startDraggingBlocks( clientIds );
				isDragging.current = true;

				startScrolling( event );

				if ( onDragStart ) {
					onDragStart();
				}
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
				<BlockDraggableChip clientIds={ clientIds } />
			}
		>
			{ ( { onDraggableStart, onDraggableEnd } ) => {
				return children( {
					isDraggable: true,
					onDraggableStart,
					onDraggableEnd,
				} );
			} }
		</Draggable>
	);
};

export default BlockDraggable;
