/**
 * WordPress dependencies
 */
import { ResizableBox } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import BlockPopoverCover from '../block-popover/cover';
import {
	getGridContentClientRect,
	getGridItemAreaClientRect,
	getGridOffsetRect,
	getGridRect,
} from './utils';

export function GridItemResizer( {
	clientId,
	bounds,
	layout,
	onChange,
	parentLayout,
} ) {
	const blockElement = useBlockElement( clientId );
	const rootBlockElement = blockElement?.parentElement;
	const { isManualPlacement, justifyContent, verticalAlignment } =
		parentLayout;

	if ( ! blockElement || ! rootBlockElement ) {
		return null;
	}

	return (
		<GridItemResizerInner
			clientId={ clientId }
			bounds={ bounds }
			blockElement={ blockElement }
			rootBlockElement={ rootBlockElement }
			layout={ layout }
			onChange={ onChange }
			isManualGrid={
				isManualPlacement &&
				window.__experimentalEnableGridInteractivity
			}
			justifyContent={ justifyContent }
			verticalAlignment={ verticalAlignment }
		/>
	);
}

function GridItemResizerInner( {
	clientId,
	bounds,
	blockElement,
	rootBlockElement,
	layout,
	onChange,
	isManualGrid,
	justifyContent,
	verticalAlignment,
} ) {
	const [ resizeDirection, setResizeDirection ] = useState( null );
	const [ enableSide, setEnableSide ] = useState( {
		top: false,
		bottom: false,
		left: false,
		right: false,
	} );
	const [ gridAreaStyles, setGridAreaStyles ] = useState( {} );

	useEffect( () => {
		const updateGridArea = () => {
			const gridItemAreaClientRect =
				getGridItemAreaClientRect( blockElement );
			const blockClientRect = blockElement.getBoundingClientRect();
			const gridContentClientRect =
				getGridContentClientRect( rootBlockElement );

			setGridAreaStyles( {
				width: gridItemAreaClientRect.width,
				height: gridItemAreaClientRect.height,
				transform: `translate(${
					gridItemAreaClientRect.left - blockClientRect.left
				}px, ${ gridItemAreaClientRect.top - blockClientRect.top }px)`,
			} );

			const topAvailable =
				gridItemAreaClientRect.top > gridContentClientRect.top;
			const bottomAvailable =
				gridItemAreaClientRect.bottom < gridContentClientRect.bottom;
			const leftAvailable =
				gridItemAreaClientRect.left > gridContentClientRect.left;
			const rightAvailable =
				gridItemAreaClientRect.right < gridContentClientRect.right;

			setEnableSide( {
				top: !! isManualGrid
					? topAvailable
					: ! bottomAvailable && topAvailable,
				bottom: bottomAvailable,
				left: !! isManualGrid
					? leftAvailable
					: ! rightAvailable && leftAvailable,
				right: rightAvailable,
			} );
		};

		updateGridArea();

		const observer = new window.ResizeObserver( () => {
			updateGridArea();
		} );
		observer.observe( blockElement, { box: 'border-box' } );
		observer.observe( rootBlockElement, { box: 'border-box' } );
		return () => observer.disconnect();
	}, [
		blockElement,
		rootBlockElement,
		isManualGrid,
		justifyContent,
		verticalAlignment,
		layout?.columnStart,
		layout?.rowStart,
		layout?.columnSpan,
		layout?.rowSpan,
	] );

	const justification = {
		right: 'left',
		left: 'right',
	};

	const alignment = {
		top: 'flex-end',
		bottom: 'flex-start',
	};

	const styles = {
		...gridAreaStyles,
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		...( justification[ resizeDirection ] && {
			justifyContent: justification[ resizeDirection ],
		} ),
		...( alignment[ resizeDirection ] && {
			alignItems: alignment[ resizeDirection ],
		} ),
	};

	return (
		<BlockPopoverCover
			className="block-editor-grid-item-resizer"
			clientId={ clientId }
			__unstablePopoverSlot="__unstable-block-tools-after"
			additionalStyles={ styles }
		>
			<ResizableBox
				className="block-editor-grid-item-resizer__box"
				size={ {
					width: '100%',
					height: '100%',
				} }
				enable={ {
					bottom: enableSide.bottom,
					bottomLeft: false,
					bottomRight: false,
					left: enableSide.left,
					right: enableSide.right,
					top: enableSide.top,
					topLeft: false,
					topRight: false,
				} }
				bounds={ bounds }
				boundsByDirection
				onPointerDown={ ( { target, pointerId } ) => {
					/*
					 * Captures the pointer to avoid hiccups while dragging over objects
					 * like iframes and ensures that the event to end the drag is
					 * captured by the target (resize handle) whether or not it’s under
					 * the pointer.
					 */
					target.setPointerCapture( pointerId );
				} }
				onResizeStart={ ( event, direction ) => {
					/*
					 * The container justification and alignment need to be set
					 * according to the direction the resizer is being dragged in,
					 * so that it resizes in the right direction.
					 */
					setResizeDirection( direction );
				} }
				onResizeStop={ ( event, direction, boxElement ) => {
					const rect = getGridOffsetRect(
						rootBlockElement,
						boxElement.getBoundingClientRect()
					);
					const gridRect = getGridRect( rootBlockElement, rect );

					onChange( {
						columnSpan: gridRect.columnSpan,
						rowSpan: gridRect.rowSpan,
						columnStart: isManualGrid
							? gridRect.columnStart
							: undefined,
						rowStart: isManualGrid ? gridRect.rowStart : undefined,
					} );
				} }
			/>
		</BlockPopoverCover>
	);
}
