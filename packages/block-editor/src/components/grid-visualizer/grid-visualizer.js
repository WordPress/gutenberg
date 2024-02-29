/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { DropZone } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';

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
	const [ isDisabled, setIsDisabled ] = useState( true );

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
			setIsDisabled( false );
		}

		function onGlobalDragEnd() {
			setIsDisabled( true );
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
				'is-disabled': isDisabled,
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
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	function onDrop( event ) {
		const { srcClientIds } = parseDropEvent( event );
		if ( ! srcClientIds?.length ) {
			return;
		}
		updateBlockAttributes( srcClientIds, {
			style: {
				layout: {
					columnStart: column,
					rowStart: row,
				},
			},
		} );
	}

	return (
		<div className="block-editor-grid-visualizer__cell">
			<DropZone label={ 'Drop to pin block' } onDrop={ onDrop } />
		</div>
	);
}
