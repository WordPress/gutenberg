/**
 * WordPress dependencies
 */
import { useState, useEffect, forwardRef } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { __unstableUseBlockElement as useBlockElement } from '../block-list/use-block-props/use-block-refs';
import BlockPopoverCover from '../block-popover/cover';
import { store as blockEditorStore } from '../../store';
import { getComputedCSS } from './utils';

export function GridVisualizer( { clientId, contentRef } ) {
	const isDistractionFree = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings().isDistractionFree,
		[]
	);
	const blockElement = useBlockElement( clientId );

	if ( isDistractionFree || ! blockElement ) {
		return null;
	}

	return (
		<BlockPopoverCover
			className="block-editor-grid-visualizer"
			clientId={ clientId }
			__unstablePopoverSlot="block-toolbar"
		>
			<GridVisualizerGrid
				ref={ contentRef }
				blockElement={ blockElement }
			/>
		</BlockPopoverCover>
	);
}

const GridVisualizerGrid = forwardRef( ( { blockElement }, ref ) => {
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
			ref={ ref }
			className="block-editor-grid-visualizer__grid"
			style={ gridInfo.style }
		>
			{ Array.from( { length: gridInfo.numItems }, ( _, i ) => (
				<div
					key={ i }
					className="block-editor-grid-visualizer__item"
					style={ {
						boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${ gridInfo.currentColor } 20%, #0000)`,
					} }
				/>
			) ) }
		</div>
	);
} );

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
		currentColor: getComputedCSS( blockElement, 'color' ),
		style: {
			gridTemplateColumns,
			gridTemplateRows,
			gap: getComputedCSS( blockElement, 'gap' ),
			padding: getComputedCSS( blockElement, 'padding' ),
		},
	};
}
