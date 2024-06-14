/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useState, useEffect, forwardRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { __experimentalUseDropZone as useDropZone } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { __unstableUseBlockElement as useBlockElement } from '../block-list/use-block-props/use-block-refs';
import BlockPopoverCover from '../block-popover/cover';
import { range, GridRect, getGridInfo } from './utils';
import { store as blockEditorStore } from '../../store';
import { useGetNumberOfBlocksBeforeCell } from './use-get-number-of-blocks-before-cell';

export function GridVisualizer( { clientId, contentRef, parentLayout } ) {
	const isDistractionFree = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings().isDistractionFree,
		[]
	);
	const gridElement = useBlockElement( clientId );

	if ( isDistractionFree || ! gridElement ) {
		return null;
	}

	const isManualGrid =
		parentLayout?.columnCount &&
		window.__experimentalEnableGridInteractivity;
	return (
		<GridVisualizerGrid
			clientId={ clientId }
			gridElement={ gridElement }
			isManualGrid={ isManualGrid }
			ref={ contentRef }
		/>
	);
} );

const GridVisualizerGrid = forwardRef(
	( { clientId, gridElement, isManualGrid }, ref ) => {
		const [ gridInfo, setGridInfo ] = useState( () =>
			getGridInfo( gridElement )
		);
		const [ isDroppingAllowed, setIsDroppingAllowed ] = useState( false );
		const [ highlightedRect, setHighlightedRect ] = useState( null );

		useEffect( () => {
			const observers = [];
			for ( const element of [ gridElement, ...gridElement.children ] ) {
				const observer = new window.ResizeObserver( () => {
					setGridInfo( getGridInfo( gridElement ) );
				} );
				observer.observe( element );
				observers.push( observer );
			}
			return () => {
				for ( const observer of observers ) {
					observer.disconnect();
				}
			};
		}, [ gridElement ] );

		useEffect( () => {
			function onGlobalDrag() {
				setIsDroppingAllowed( true );
			}
			function onGlobalDragEnd() {
				setIsDroppingAllowed( false );
			}
			document.addEventListener( 'drag', onGlobalDrag );
			document.addEventListener( 'dragend', onGlobalDragEnd );
			return () => {
				document.removeEventListener( 'drag', onGlobalDrag );
				document.removeEventListener( 'dragend', onGlobalDragEnd );
			};
		}, [] );

		return (
			<BlockPopoverCover
				className={ clsx( 'block-editor-grid-visualizer', {
					'is-dropping-allowed': isDroppingAllowed,
				} ) }
				clientId={ clientId }
				__unstablePopoverSlot="block-toolbar"
			>
				<div
					ref={ ref }
					className="block-editor-grid-visualizer__grid"
					style={ gridInfo.style }
				>
					{ isManualGrid
						? range( 1, gridInfo.numRows ).map( ( row ) =>
								range( 1, gridInfo.numColumns ).map(
									( column ) => (
										<GridVisualizerCell
											key={ `${ row }-${ column }` }
											color={ gridInfo.currentColor }
										>
											<GridVisualizerDropZone
												column={ column }
												row={ row }
												gridClientId={ clientId }
												gridInfo={ gridInfo }
												highlightedRect={
													highlightedRect
												}
												setHighlightedRect={
													setHighlightedRect
												}
											/>
										</GridVisualizerCell>
									)
								)
						  )
						: Array.from(
								{ length: gridInfo.numItems },
								( _, i ) => (
									<GridVisualizerCell
										key={ i }
										color={ gridInfo.currentColor }
									/>
								)
						  ) }
				</div>
			</BlockPopoverCover>
		);
	}
);

function GridVisualizerCell( { color, children } ) {
	return (
		<div
			className="block-editor-grid-visualizer__cell"
			style={ {
				boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${ color } 20%, #0000)`,
			} }
		>
			{ children }
		</div>
	);
}

function GridVisualizerDropZone( {
	column,
	row,
	gridClientId,
	gridInfo,
	highlightedRect,
	setHighlightedRect,
} ) {
	const { getBlockAttributes } = useSelect( blockEditorStore );
	const {
		updateBlockAttributes,
		moveBlocksToPosition,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );

	const getNumberOfBlocksBeforeCell = useGetNumberOfBlocksBeforeCell(
		gridClientId,
		gridInfo.numColumns
	);

	const ref = useDropZoneWithValidation( {
		validateDrag( srcClientId ) {
			const attributes = getBlockAttributes( srcClientId );
			const rect = new GridRect( {
				columnStart: column,
				rowStart: row,
				columnSpan: attributes.style?.layout?.columnSpan,
				rowSpan: attributes.style?.layout?.rowSpan,
			} );
			const isInBounds = new GridRect( {
				columnSpan: gridInfo.numColumns,
				rowSpan: gridInfo.numRows,
			} ).containsRect( rect );
			return isInBounds;
		},
		onDragEnter( srcClientId ) {
			const attributes = getBlockAttributes( srcClientId );
			setHighlightedRect(
				new GridRect( {
					columnStart: column,
					rowStart: row,
					columnSpan: attributes.style?.layout?.columnSpan,
					rowSpan: attributes.style?.layout?.rowSpan,
				} )
			);
		},
		onDragLeave() {
			// onDragEnter can be called before onDragLeave if the user moves
			// their mouse quickly, so only clear the highlight if it was set
			// by this cell.
			setHighlightedRect( ( prevHighlightedRect ) =>
				prevHighlightedRect?.columnStart === column &&
				prevHighlightedRect?.rowStart === row
					? null
					: prevHighlightedRect
			);
		},
		onDrop( srcClientId ) {
			setHighlightedRect( null );
			const attributes = getBlockAttributes( srcClientId );
			updateBlockAttributes( srcClientId, {
				style: {
					...attributes.style,
					layout: {
						...attributes.style?.layout,
						columnStart: column,
						rowStart: row,
					},
				},
			} );
			__unstableMarkNextChangeAsNotPersistent();
			moveBlocksToPosition(
				[ srcClientId ],
				gridClientId,
				gridClientId,
				getNumberOfBlocksBeforeCell( column, row )
			);
		},
	} );

	const isHighlighted = highlightedRect?.contains( column, row ) ?? false;

	return (
		<div
			ref={ ref }
			className={ clsx( 'block-editor-grid-visualizer__drop-zone', {
				'is-highlighted': isHighlighted,
			} ) }
		/>
	);
}

function useDropZoneWithValidation( {
	validateDrag,
	onDragEnter,
	onDragLeave,
	onDrop,
	color,
} ) {
	const { getDraggedBlockClientIds } = useSelect( blockEditorStore );
	return useDropZone( {
		onDragEnter() {
			const [ srcClientId ] = getDraggedBlockClientIds();
			if ( srcClientId && validateDrag( srcClientId ) ) {
				onDragEnter( srcClientId );
			}
		},
		onDragLeave() {
			onDragLeave();
		},
		onDrop() {
			const [ srcClientId ] = getDraggedBlockClientIds();
			if ( srcClientId && validateDrag( srcClientId ) ) {
				onDrop( srcClientId );
			}
		},
	} );
}
