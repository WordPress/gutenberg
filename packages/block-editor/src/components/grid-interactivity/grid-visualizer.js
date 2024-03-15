/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { __experimentalUseDropZone as useDropZone } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { __unstableUseBlockElement as useBlockElement } from '../block-list/use-block-props/use-block-refs';
import BlockPopoverCover from '../block-popover/cover';
import { getComputedCSS } from './utils';
import { parseDropEvent } from '../use-on-block-drop';
import { store as blockEditorStore } from '../../store';

export function GridVisualizer( { clientId } ) {
	const blockElement = useBlockElement( clientId );
	if ( ! blockElement ) {
		return null;
	}
	return (
		<GridVisualizerGrid
			clientId={ clientId }
			blockElement={ blockElement }
		/>
	);
}

function getGridInfo( blockElement ) {
	const gridTemplateColumns = getComputedCSS(
		blockElement,
		'grid-template-columns'
	);
	const gridTemplateRows = getComputedCSS(
		blockElement,
		'grid-template-rows'
	);
	const numColumns = gridTemplateColumns.split( ' ' ).length;
	const numRows = gridTemplateRows.split( ' ' ).length;
	const numItems = numColumns * numRows;
	return {
		numColumns,
		numRows,
		numItems,
		style: {
			gridTemplateColumns,
			gridTemplateRows,
			gap: getComputedCSS( blockElement, 'gap' ),
			padding: getComputedCSS( blockElement, 'padding' ),
		},
	};
}

function range( start, length ) {
	return Array.from( { length }, ( _, i ) => start + i );
}

function GridVisualizerGrid( { clientId, blockElement } ) {
	const [ gridInfo, setGridInfo ] = useState( () =>
		getGridInfo( blockElement )
	);
	const [ isDroppingAllowed, setIsDroppingAllowed ] = useState( false );

	useEffect( () => {
		const observers = [];
		for ( const element of [ blockElement, ...blockElement.children ] ) {
			const observer = new window.ResizeObserver( () => {
				setGridInfo( getGridInfo( blockElement ) );
			} );
			observer.observe( element );
			observers.push( observer );
		}
		return () => {
			for ( const observer of observers ) {
				observer.disconnect();
			}
		};
	}, [ blockElement ] );

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
			className={ classnames( 'block-editor-grid-visualizer', {
				'is-dropping-allowed': isDroppingAllowed,
			} ) }
			clientId={ clientId }
			__unstablePopoverSlot="block-toolbar"
		>
			<div
				className="block-editor-grid-visualizer__grid"
				style={ gridInfo.style }
			>
				{ range( 1, gridInfo.numRows ).map( ( row ) =>
					range( 1, gridInfo.numColumns ).map( ( column ) => (
						<GridVisualizerCell
							key={ `${ row }-${ column }` }
							column={ column }
							row={ row }
						/>
					) )
				) }
			</div>
		</BlockPopoverCover>
	);
}

function GridVisualizerCell( { column, row } ) {
	const [ isDraggingOver, setIsDraggingOver ] = useState( false );
	const { getBlockAttributes } = useSelect( blockEditorStore );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const ref = useDropZone( {
		onDragEnter() {
			setIsDraggingOver( true );
		},
		onDragLeave() {
			setIsDraggingOver( false );
		},
		onDrop( event ) {
			setIsDraggingOver( false );
			const {
				srcClientIds: [ srcClientId ],
			} = parseDropEvent( event );
			if ( ! srcClientId ) {
				return;
			}
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
		},
	} );

	return (
		<div className="block-editor-grid-visualizer__cell">
			<div
				ref={ ref }
				className={ classnames(
					'block-editor-grid-visualizer__drop-zone',
					{
						'is-dragging-over': isDraggingOver,
					}
				) }
			/>
		</div>
	);
}
