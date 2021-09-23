/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { moreHorizontal } from '@wordpress/icons';

export function TablePlaceholderPreview( props ) {
	const { rowCount, columnCount } = props;

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
	const arrayOfBoxesPerRow = Array.apply(
		null,
		Array( clampedRowCount )
	).map( ( x, i ) => i );
	const arrayOfBoxesPerColumn = Array.apply(
		null,
		Array( clampedColumnCount )
	).map( ( x, i ) => i );

	return (
		<div
			className="blocks-table__placeholder-preview"
			style={ {
				width: '100%',
				height: '96px',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				backgroundColor: '#EDEFF0',
				marginBlockEnd: '1em',
				borderRadius: '2px',
			} }
		>
			<div
				style={ {
					display: 'grid',
					gridTemplateColumns: `repeat(${ clampedColumnCount }, 1fr)`,
					gridTemplateRows: `repeat(${ clampedRowCount }, 1fr)`,
					gridGap: `${ gapSize }px`,
					width: `${ containerWidth }px`,
					maxWidth: '75%',
					height: `${ containerHeight }px`,
				} }
			>
				{ arrayOfBoxesPerRow.map( ( row ) =>
					arrayOfBoxesPerColumn.map( ( column ) => (
						<Box
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

function Box( { column, row, cellHeight, columnCount, rowCount } ) {
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
				backgroundColor: shouldShowElipsis ? 'transparent' : '#fff',
				border: shouldShowElipsis ? 'none' : '1px solid #000000',
				gridColumn: column,
				gridRow: row,
				alignSelf: 'center',
				justifyItems: 'center',
				justifySelf: 'center',
				height: '100%',
				width: '100%',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			} }
			className="blocks-table__placeholder-preview-item"
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
