/**
 * WordPress dependencies
 */
import { Draggable } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { getScrollContainer } from '@wordpress/dom';

const SCROLL_INACTIVE_DISTANCE_PX = 50;
const SCROLL_INTERVAL_MS = 25;
const PIXELS_PER_SECOND_PER_DISTANCE = 5;
const VELOCITY_MULTIPLIER =
	PIXELS_PER_SECOND_PER_DISTANCE * ( SCROLL_INTERVAL_MS / 1000 );

function startScrollingY( nodeRef, velocityRef ) {
	return setInterval( () => {
		if ( nodeRef.current && velocityRef.current ) {
			const newTop = nodeRef.current.scrollTop + velocityRef.current;

			nodeRef.current.scroll( {
				top: newTop,
				// behavior: 'smooth' // seems to hurt performance, better to use a small scroll interval
			} );
		}
	}, SCROLL_INTERVAL_MS );
}

function getVerticalScrollParent( node ) {
	if ( node === null ) {
		return null;
	}

	return getScrollContainer( node );
}

const BlockDraggable = ( {
	children,
	clientIds,
	cloneClassname,
	onDragStart,
	onDragEnd,
} ) => {
	const { srcRootClientId, index, isDraggable } = useSelect(
		( select ) => {
			const {
				getBlockIndex,
				getBlockRootClientId,
				getTemplateLock,
			} = select( 'core/block-editor' );
			const rootClientId =
				clientIds.length === 1
					? getBlockRootClientId( clientIds[ 0 ] )
					: null;
			const templateLock = rootClientId
				? getTemplateLock( rootClientId )
				: null;

			return {
				index: getBlockIndex( clientIds[ 0 ], rootClientId ),
				srcRootClientId: rootClientId,
				isDraggable: clientIds.length === 1 && 'all' !== templateLock,
			};
		},
		[ clientIds ]
	);
	const isDragging = useRef( false );

	// @todo - do this for horizontal scroll
	const dragStartY = useRef( null );
	const velocityY = useRef( null );
	const scrollParentY = useRef( null );

	const scrollEditorInterval = useRef( null );

	const { startDraggingBlocks, stopDraggingBlocks } = useDispatch(
		'core/block-editor'
	);

	// Stop dragging blocks if the block draggable is unmounted
	useEffect( () => {
		return () => {
			if ( isDragging.current ) {
				stopDraggingBlocks();
			}

			if ( scrollEditorInterval.current ) {
				clearInterval( scrollEditorInterval.current );
				scrollEditorInterval.current = null;
			}
		};
	}, [] );

	if ( ! isDraggable ) {
		return children( { isDraggable: false } );
	}

	const blockElementId = `block-${ clientIds[ 0 ] }`;
	const transferData = {
		type: 'block',
		srcIndex: index,
		srcClientId: clientIds[ 0 ],
		srcRootClientId,
	};

	return (
		<Draggable
			cloneClassname={ cloneClassname }
			elementId={ blockElementId }
			transferData={ transferData }
			onDragStart={ ( event ) => {
				startDraggingBlocks();
				isDragging.current = true;
				dragStartY.current = event.clientY;

				// find nearest parent(s) to scroll
				scrollParentY.current = getVerticalScrollParent(
					document.getElementById( blockElementId )
				);
				scrollEditorInterval.current = startScrollingY(
					scrollParentY,
					velocityY
				);
				if ( onDragStart ) {
					onDragStart();
				}
			} }
			onDragOver={ ( event ) => {
				const distanceY = event.clientY - dragStartY.current;
				if ( distanceY > SCROLL_INACTIVE_DISTANCE_PX ) {
					velocityY.current =
						VELOCITY_MULTIPLIER *
						( distanceY - SCROLL_INACTIVE_DISTANCE_PX );
				} else if ( distanceY < -SCROLL_INACTIVE_DISTANCE_PX ) {
					velocityY.current =
						VELOCITY_MULTIPLIER *
						( distanceY + SCROLL_INACTIVE_DISTANCE_PX );
				} else {
					velocityY.current = 0;
				}
			} }
			onDragEnd={ () => {
				stopDraggingBlocks();
				isDragging.current = false;
				dragStartY.current = null;
				scrollParentY.current = null;

				if ( scrollEditorInterval.current ) {
					clearInterval( scrollEditorInterval.current );
					scrollEditorInterval.current = null;
				}

				if ( onDragEnd ) {
					onDragEnd();
				}
			} }
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
