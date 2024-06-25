/**
 * WordPress dependencies
 */
import { ResizableBox } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { __unstableUseBlockElement as useBlockElement } from '../block-list/use-block-props/use-block-refs';
import BlockPopoverCover from '../block-popover/cover';
import { getComputedCSS, getGridTracks, getClosestTrack } from './utils';

export function GridItemResizer( {
	clientId,
	bounds,
	onChange,
	parentLayout,
} ) {
	const blockElement = useBlockElement( clientId );
	const rootBlockElement = blockElement?.parentElement;
	const { columnCount } = parentLayout;

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
			isManualGrid={
				!! columnCount && window.__experimentalEnableGridInteractivity
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
			setEnableSide( {
				top: blockClientRect.top > rootBlockClientRect.top,
				bottom: blockClientRect.bottom < rootBlockClientRect.bottom,
				left: blockClientRect.left > rootBlockClientRect.left,
				right: blockClientRect.right < rootBlockClientRect.right,
			} );
		} );
		observer.observe( blockElement );
		return () => observer.disconnect();
	}, [ blockElement, rootBlockElement ] );

	const justification = {
		right: 'flex-start',
		left: 'flex-end',
	};

	const alignment = {
		top: 'flex-end',
		bottom: 'flex-start',
	};

	const styles = {
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
			__unstablePopoverSlot="block-toolbar"
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
				onResizeStart={ ( event, direction ) => {
					/*
					 * The container justification and alignment need to be set
					 * according to the direction the resizer is being dragged in,
					 * so that it resizes in the right direction.
					 */
					setResizeDirection( direction );

					/*
					 * The mouseup event on the resize handle doesn't trigger if the mouse
					 * isn't directly above the handle, so we try to detect if it happens
					 * outside the grid and dispatch a mouseup event on the handle.
					 */
					blockElement.ownerDocument.addEventListener(
						'mouseup',
						() => {
							event.target.dispatchEvent(
								new Event( 'mouseup', { bubbles: true } )
							);
						},
						{ once: true }
					);
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
