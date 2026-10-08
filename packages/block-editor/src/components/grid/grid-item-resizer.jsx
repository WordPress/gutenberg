import { ResizableBox } from '@wordpress/components';
import { useState, useEffect, useMemo } from '@wordpress/element';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import BlockPopoverCover from '../block-popover/cover';
import { getComputedCSS, getGridTracks, getClosestTrack } from './utils';
import { useRotatedOverlayStyle } from './use-rotated-overlay-style';

const justification = {
	right: 'left',
	left: 'right',
};

const alignment = {
	top: 'flex-end',
	bottom: 'flex-start',
};

export function GridItemResizer( {
	clientId,
	bounds,
	onChange,
	parentLayout,
	angle = 0,
} ) {
	const blockElement = useBlockElement( clientId );
	const rootBlockElement = blockElement?.parentElement;
	const { isManualPlacement } = parentLayout;

	if ( ! blockElement || ! rootBlockElement ) {
		return null;
	}

	return (
		<GridItemResizerInner
			clientId={ clientId }
			bounds={ bounds }
			blockElement={ blockElement }
			rootBlockElement={ rootBlockElement }
			onChange={ onChange }
			angle={ angle }
			isManualGrid={
				isManualPlacement &&
				window.__experimentalEnableGridInteractivity
			}
		/>
	);
}

function GridItemResizerInner( {
	clientId,
	bounds,
	blockElement,
	rootBlockElement,
	onChange,
	isManualGrid,
	angle,
} ) {
	const [ resizeDirection, setResizeDirection ] = useState( null );
	const [ enableSide, setEnableSide ] = useState( {
		top: false,
		bottom: false,
		left: false,
		right: false,
	} );

	useEffect( () => {
		const observer = new window.ResizeObserver( () => {
			const blockClientRect = blockElement.getBoundingClientRect();
			const rootBlockClientRect =
				rootBlockElement.getBoundingClientRect();

			const topAvailable = blockClientRect.top > rootBlockClientRect.top;
			const bottomAvailable =
				blockClientRect.bottom < rootBlockClientRect.bottom;
			const leftAvailable =
				blockClientRect.left > rootBlockClientRect.left;
			const rightAvailable =
				blockClientRect.right < rootBlockClientRect.right;

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
		} );
		observer.observe( blockElement );
		return () => observer.disconnect();
	}, [ blockElement, rootBlockElement, isManualGrid ] );

	const styles = useMemo(
		() => ( {
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			...( justification[ resizeDirection ] && {
				justifyContent: justification[ resizeDirection ],
			} ),
			...( alignment[ resizeDirection ] && {
				alignItems: alignment[ resizeDirection ],
			} ),
		} ),
		[ resizeDirection ]
	);
	// Keep the handles on the block's edges when it is rotated.
	const overlayStyles = useRotatedOverlayStyle( blockElement, angle, styles );

	return (
		<BlockPopoverCover
			className="block-editor-grid-item-resizer"
			clientId={ clientId }
			__unstablePopoverSlot="__unstable-block-tools-after"
			additionalStyles={ overlayStyles }
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
					const columnGap = parseFloat(
						getComputedCSS( rootBlockElement, 'column-gap' )
					);
					const rowGap = parseFloat(
						getComputedCSS( rootBlockElement, 'row-gap' )
					);
					const gridColumnTracks = getGridTracks(
						getComputedCSS(
							rootBlockElement,
							'grid-template-columns'
						),
						columnGap
					);
					const gridRowTracks = getGridTracks(
						getComputedCSS(
							rootBlockElement,
							'grid-template-rows'
						),
						rowGap
					);
					const rect = new window.DOMRect(
						blockElement.offsetLeft + boxElement.offsetLeft,
						blockElement.offsetTop + boxElement.offsetTop,
						boxElement.offsetWidth,
						boxElement.offsetHeight
					);
					const columnStart =
						getClosestTrack( gridColumnTracks, rect.left ) + 1;
					const rowStart =
						getClosestTrack( gridRowTracks, rect.top ) + 1;
					const columnEnd =
						getClosestTrack( gridColumnTracks, rect.right, 'end' ) +
						1;
					const rowEnd =
						getClosestTrack( gridRowTracks, rect.bottom, 'end' ) +
						1;
					onChange( {
						columnSpan: columnEnd - columnStart + 1,
						rowSpan: rowEnd - rowStart + 1,
						columnStart: isManualGrid ? columnStart : undefined,
						rowStart: isManualGrid ? rowStart : undefined,
					} );
				} }
			/>
		</BlockPopoverCover>
	);
}
