/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { __unstableUseBlockElement as useBlockElement } from '../block-list/use-block-props/use-block-refs';
import BlockPopoverCover from '../block-popover/cover';
import { getComputedCSS } from './utils';

export function GridVisualizer( { clientId } ) {
	const blockElement = useBlockElement( clientId );
	if ( ! blockElement ) {
		return null;
	}
	return (
		<BlockPopoverCover
			className="block-editor-grid-visualizer"
			clientId={ clientId }
			__unstablePopoverSlot="block-toolbar"
		>
			<GridVisualizerGrid blockElement={ blockElement } />
		</BlockPopoverCover>
	);
}

function GridVisualizerGrid( { blockElement } ) {
	const [ gridInfo, setGridInfo ] = useState( () =>
		getGridInfo( blockElement )
	);
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
	return (
		<div
			className="block-editor-grid-visualizer__grid"
			style={ gridInfo.style }
		>
			{ Array.from( { length: gridInfo.numItems }, ( _, i ) => (
				<div key={ i } className="block-editor-grid-visualizer__item" />
			) ) }
		</div>
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
		numItems,
		style: {
			gridTemplateColumns,
			gridTemplateRows,
			gap: getComputedCSS( blockElement, 'gap' ),
			padding: getComputedCSS( blockElement, 'padding' ),
		},
	};
}
