/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { moreHorizontal } from '@wordpress/icons';

export function TablePlaceholderPreview( props ) {
	const { rowCount, columnCount } = props;

	const heightValue = 75;

	const maxColumns = 13;
	const maxRows = 9;

	const clampedColumnCount = Math.min( columnCount, maxColumns );
	const clampedRowCount = Math.min( rowCount, maxRows );

	const gapValue =
		( 1 / Math.max( clampedColumnCount, clampedRowCount ) ) * 20;

	const blockHeight = heightValue / clampedRowCount;
	const widthValue = blockHeight * clampedColumnCount;

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
					gridGap: `${ gapValue }px`,
					width: `${ widthValue }px`,
					maxWidth: '75%',
					height: `${ heightValue }px`,
				} }
			>
				{ arrayOfBoxesPerRow.map( ( row ) =>
					arrayOfBoxesPerColumn.map( ( column ) => (
						<Box
							row={ row + 1 }
							column={ column + 1 }
							blockHeight={ blockHeight }
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

function Box( { column, row, blockHeight, columnCount, rowCount } ) {
	const maxColumns = 12;
	const maxRows = 8;

	const hasCrossedRowThreshold = rowCount > maxRows;
	const hasCrossedColumnThreshold = columnCount > maxColumns;

	if ( hasCrossedColumnThreshold && column === maxColumns ) {
		return (
			<BoxWithElipsis
				row={ row }
				column={ column }
				blockHeight={ blockHeight }
				paradigm={ 'row' }
			/>
		);
	}

	if ( hasCrossedRowThreshold && row === maxRows ) {
		return (
			<BoxWithElipsis
				row={ row }
				column={ column }
				blockHeight={ blockHeight }
				paradigm={ 'column' }
			/>
		);
	}

	return (
		<span
			style={ {
				backgroundColor: '#fff',
				border: '1px solid #000000',
				aspectRatio: 1,
				gridColumn: column,
				gridRow: row,
			} }
			className="blocks-table__placeholder-preview-item"
		/>
	);
}

const BoxWithElipsis = ( { row, column, blockHeight } ) => {
	return (
		<span
			style={ {
				aspectRatio: 1,
				gridColumn: column,
				gridRow: row,
				alignSelf: 'center',
				justifyItems: 'center',
				justifySelf: 'center',
				lineHeight: 0,
			} }
			className="blocks-table__placeholder-preview-item"
		>
			<Icon
				icon={ moreHorizontal }
				height={ blockHeight / 2 }
				width={ blockHeight / 2 }
			/>
		</span>
	);
};
