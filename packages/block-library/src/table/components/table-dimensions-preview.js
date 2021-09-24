/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { moreHorizontal } from '@wordpress/icons';
/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * createArrayOfLength
 *
 * @param {number} length Length of array to create.
 * @return {Array} Array of length `length` with the index as the value.
 */
function createArrayOfLength( length ) {
	return Array.apply( null, Array( length ) ).map( ( x, i ) => i );
}

/**
 * TableDimensionsPreview
 *
 * this component is build for internal uses within the Table block. It renders a preview of the table cells
 * to make it easier to see how the table will look with the number or rows and columns that the user has selected.
 *
 * @typedef TableDimensionsPreviewProps
 * @property {number}                      rowCount    number of rows
 * @property {number}                      columnCount number of columns
 *
 * @param    {TableDimensionsPreviewProps} props
 */
export function TableDimensionsPreview( { rowCount, columnCount } ) {
	const containerHeight = 75;

	// after we cross the threshold we display an elispis to indicate that there are more items
	const maxDisplayColumns = 13;
	const maxDisplayRows = 9;

	const clampedColumnCount = Math.min( columnCount, maxDisplayColumns );
	const clampedRowCount = Math.min( rowCount, maxDisplayRows );

	const gapSize =
		( 1 / Math.max( clampedColumnCount, clampedRowCount ) ) * 20;

	const cellHeight = containerHeight / clampedRowCount;
	const containerWidth = cellHeight * clampedColumnCount;

	// create two arrays that have the length of the rows and columns
	// and contain the index of the individual items
	const arrayOfCellsPerRow = createArrayOfLength( clampedRowCount );
	const arrayOfCellsPerColumn = createArrayOfLength( clampedColumnCount );

	return (
		<div className="blocks-table__placeholder-preview">
			<div
				className="blocks-table__placeholder-preview-container"
				style={ {
					gridTemplateColumns: `repeat(${ clampedColumnCount }, 1fr)`,
					gridTemplateRows: `repeat(${ clampedRowCount }, 1fr)`,
					gridGap: `${ gapSize }px`,
					width: `${ containerWidth }px`,
					height: `${ containerHeight }px`,
				} }
			>
				{ arrayOfCellsPerRow.map( ( row ) =>
					arrayOfCellsPerColumn.map( ( column ) => (
						<Cell
							row={ row + 1 }
							column={ column + 1 }
							cellHeight={ cellHeight }
							rowCount={ rowCount }
							columnCount={ columnCount }
							key={ `${ row }-${ column }` }
						/>
					) )
				) }
			</div>
		</div>
	);
}

function Cell( { column, row, cellHeight, columnCount, rowCount } ) {
	const columnsThreshold = 12;
	const rowsThreshold = 8;

	const hasCrossedRowThreshold = rowCount > rowsThreshold;
	const hasCrossedColumnThreshold = columnCount > columnsThreshold;

	const shouldShowElipsis =
		( hasCrossedColumnThreshold && column === columnsThreshold ) ||
		( hasCrossedRowThreshold && row === rowsThreshold );

	return (
		<span
			style={ {
				gridColumn: column,
				gridRow: row,
			} }
			className={ classNames( 'blocks-table__placeholder-preview-cell', {
				'is-elipsis': shouldShowElipsis,
			} ) }
		>
			{ shouldShowElipsis && (
				<Icon
					icon={ moreHorizontal }
					height={ cellHeight / 2 }
					width={ cellHeight / 2 }
				/>
			) }
		</span>
	);
}
