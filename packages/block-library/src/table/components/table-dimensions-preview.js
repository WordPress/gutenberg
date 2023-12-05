/**
 * WordPress dependencies
 */
import { Icon } from '@wordpress/components';
import { moreHorizontal } from '@wordpress/icons';
import {
	useRef,
	useLayoutEffect,
	useState,
	useEffect,
} from '@wordpress/element';
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
	const previewAreaRef = useRef();
	const previewContainerRef = useRef();

	// after we cross the threshold we display an elispis to indicate that there are more items
	const maxDisplayColumns = 13;
	const maxDisplayRows = 9;

	const clampedColumnCount = Math.min( columnCount, maxDisplayColumns );
	const clampedRowCount = Math.min( rowCount, maxDisplayRows );

	const gapSize = Math.max(
		( 1 / Math.max( clampedColumnCount, clampedRowCount ) ) * 20,
		2.5
	);

	function calculatePreviewAreaStyles() {
		if ( previewAreaRef.current ) {
			setPreviewAreaStyles(
				window.getComputedStyle( previewAreaRef.current )
			);
		}
	}

	const [ previewAreaStyles, setPreviewAreaStyles ] = useState( null );

	useEffect( () => {
		calculatePreviewAreaStyles();
	}, [ previewAreaRef ] );

	useLayoutEffect( () => {
		if (
			previewAreaRef.current &&
			previewAreaStyles &&
			previewContainerRef.current
		) {
			window.addEventListener( 'resize', calculatePreviewAreaStyles );

			const maxCellHeight = 25;

			const previewAreaRect = previewAreaRef.current.getBoundingClientRect();
			const previewAreaVerticalPadding =
				previewAreaRef.current &&
				parseInt(
					previewAreaStyles
						.getPropertyValue( 'padding-top' )
						.substring( 0, 2 )
				);
			const previewAreaHorizontalPadding =
				previewAreaRef.current &&
				parseInt(
					previewAreaStyles
						.getPropertyValue( 'padding-left' )
						.substring( 0, 2 )
				);
			const previewAreaUsableHeight =
				previewAreaRect.height - 2 * previewAreaVerticalPadding;

			const combinedVerticalGaps = gapSize * ( clampedRowCount - 1 );
			const containerHeight = Math.min(
				maxCellHeight * clampedRowCount + combinedVerticalGaps,
				previewAreaUsableHeight
			);

			const combinedHorizontalGaps = gapSize * ( clampedColumnCount - 1 );
			const cellHeight =
				( containerHeight - combinedVerticalGaps ) / clampedRowCount;
			const containerWidth = Math.min(
				cellHeight * clampedColumnCount + combinedHorizontalGaps,
				previewAreaRect.width + 2 * previewAreaHorizontalPadding
			);

			previewContainerRef.current.style.height = `${ containerHeight }px`;
			previewContainerRef.current.style.width = `${ containerWidth }px`;
		}

		return () => {
			window.removeEventListener( 'resize', calculatePreviewAreaStyles );
		};
	}, [
		previewAreaRef.current,
		clampedRowCount,
		clampedColumnCount,
		previewAreaStyles,
	] );

	// create two arrays that have the length of the rows and columns
	// and contain the index of the individual items
	const arrayOfCellsPerRow = createArrayOfLength( clampedRowCount );
	const arrayOfCellsPerColumn = createArrayOfLength( clampedColumnCount );

	return (
		<div className="blocks-table__dimension-preview" ref={ previewAreaRef }>
			<div
				className="blocks-table__dimension-preview-container"
				style={ {
					gridTemplateColumns: `repeat(${ clampedColumnCount }, 1fr)`,
					gridTemplateRows: `repeat(${ clampedRowCount }, 1fr)`,
					gridGap: `${ gapSize }px`,
				} }
				ref={ previewContainerRef }
			>
				{ arrayOfCellsPerRow.map( ( row ) =>
					arrayOfCellsPerColumn.map( ( column ) => (
						<Cell
							row={ row + 1 }
							column={ column + 1 }
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

function Cell( { column, row, columnCount, rowCount } ) {
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
			className={ classNames( 'blocks-table__dimension-preview-cell', {
				'is-elipsis': shouldShowElipsis,
			} ) }
		>
			{ shouldShowElipsis && (
				<Icon
					icon={ moreHorizontal }
					height={ '50%' }
					width={ '50%' }
				/>
			) }
		</span>
	);
}
