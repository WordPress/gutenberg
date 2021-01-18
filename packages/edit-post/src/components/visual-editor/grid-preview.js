/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

export default function GridPreview() {
	const [ gridStyles, setGridStlyes ] = useState( {
		columnWidth: 0,
		columnCount: 0,
		columnGap: 0,
		rowHeights: [],
	} );

	// Divide index by column number; the result is the zero-indexed row number
	const getHeightByIndex = ( index ) =>
		gridStyles.rowHeights[ Math.floor( index / 12 ) ];
	const rootContainer = document.querySelector(
		'.is-root-container.is-grid'
	);

	useEffect( () => {
		if ( rootContainer ) {
			const rootContainerStyles = window.getComputedStyle(
				rootContainer,
				null
			);
			const {
				columnGap,
				gridTemplateColumns,
				gridTemplateRows,
			} = rootContainerStyles;
			const columns = Array.from(
				gridTemplateColumns.matchAll( /\d+(.\d+)?px/g )
			);
			const [ [ width ] ] = columns;

			setGridStlyes( {
				columnWidth: width,
				columnCount: columns.length,
				columnGap,
				rowHeights: gridTemplateRows.split( ' ' ),
				rowCount: gridTemplateRows.split( ' ' ).length,
			} );
		}
	}, [ rootContainer ] );

	return (
		<div className="grid-preview is-grid">
			{ Array.from( {
				length: gridStyles.columnCount * gridStyles.rowCount,
			} ).map( ( _, index ) => (
				<div
					className="grid-cell-placeholder"
					style={ {
						width: gridStyles.columnWidth,
						height: getHeightByIndex( index ),
					} }
					key={ index }
				>
					{ index + 1 }
				</div>
			) ) }
		</div>
	);
}
