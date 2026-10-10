import clsx from 'clsx';
import type {
	ComponentProps,
	ComponentType,
	HTMLAttributes,
	PointerEvent,
} from 'react';
import { ResizableBox } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { _n, sprintf } from '@wordpress/i18n';
import { useBlockElement } from '../block-list/use-block-props/use-block-refs';
import BlockPopoverCover from '../block-popover/cover';
import { getGridTrackPositions, getComputedCSS } from './utils';
import { getRowDeltaFromDistance } from './get-grid-row-resize';
import { useResizeGridRows } from './use-resize-grid-rows';

interface GridRowResizerProps {
	/** Client ID of the grid. */
	clientId: string;
}

type Edge = 'top' | 'bottom';

// `ResizableBox` passes props it doesn't declare on to its element, but its
// types don't include pointer events.
const ResizableBoxWithPointerEvents = ResizableBox as ComponentType<
	ComponentProps< typeof ResizableBox > &
		Pick< HTMLAttributes< HTMLDivElement >, 'onPointerDown' >
>;

/**
 * Handles on the top and bottom edges of a selected manual grid, for adding
 * and removing rows. The grid's height snaps to whole rows when the handle is
 * released. Rows that blocks are in can't be removed.
 */
export function GridRowResizer( { clientId }: GridRowResizerProps ) {
	const gridElement = useBlockElement( clientId ) as HTMLElement | null;
	const { getRowCount, resizeRows } = useResizeGridRows( clientId );
	const [ resize, setResize ] = useState< {
		edge: Edge;
		rowDelta: number;
	} | null >( null );

	if ( ! gridElement ) {
		return null;
	}

	// The handles are drawn outside the canvas, which may be zoomed out.
	function getRowDelta( distance: number ) {
		if ( ! gridElement ) {
			return 0;
		}
		const scale =
			gridElement.offsetHeight /
				gridElement.getBoundingClientRect().height || 1;
		return getRowDeltaFromDistance(
			getGridTrackPositions( gridElement ).rowTracks,
			distance * scale,
			parseFloat( getComputedCSS( gridElement, 'row-gap' ) ) || 0
		);
	}

	return (
		<BlockPopoverCover
			className="block-editor-grid-row-resizer"
			clientId={ clientId }
			__unstablePopoverSlot="__unstable-block-tools-after"
			additionalStyles={ {
				display: 'flex',
				flexDirection: 'column',
				// Keep the opposite edge in place while resizing.
				justifyContent:
					resize?.edge === 'top' ? 'flex-end' : 'flex-start',
			} }
		>
			<ResizableBoxWithPointerEvents
				className={ clsx( 'block-editor-grid-row-resizer__box', {
					'is-resizing': !! resize,
				} ) }
				size={ { width: '100%', height: '100%' } }
				enable={ {
					top: true,
					bottom: true,
					left: false,
					right: false,
					topLeft: false,
					topRight: false,
					bottomLeft: false,
					bottomRight: false,
				} }
				onPointerDown={ ( {
					target,
					pointerId,
				}: PointerEvent< HTMLDivElement > ) => {
					// Keeps the drag going over the canvas iframe.
					( target as Element ).setPointerCapture( pointerId );
				} }
				onResizeStart={ ( _event, direction ) => {
					setResize( { edge: direction as Edge, rowDelta: 0 } );
				} }
				onResize={ ( _event, direction, _element, delta ) => {
					setResize( {
						edge: direction as Edge,
						rowDelta: getRowDelta( delta.height ),
					} );
				} }
				onResizeStop={ ( _event, direction, _element, delta ) => {
					setResize( null );
					resizeRows(
						direction as Edge,
						getRowDelta( delta.height )
					);
				} }
			>
				{ resize && (
					<GridRowCountLabel
						edge={ resize.edge }
						rowCount={ getRowCount( resize.edge, resize.rowDelta ) }
					/>
				) }
			</ResizableBoxWithPointerEvents>
		</BlockPopoverCover>
	);
}

function GridRowCountLabel( {
	edge,
	rowCount,
}: {
	edge: Edge;
	rowCount: number;
} ) {
	return (
		<div
			className={ clsx(
				'block-editor-grid-row-resizer__label',
				`is-${ edge }`
			) }
		>
			{ sprintf(
				/* translators: %d: Number of rows in a grid. */
				_n( '%d row', '%d rows', rowCount ),
				rowCount
			) }
		</div>
	);
}
