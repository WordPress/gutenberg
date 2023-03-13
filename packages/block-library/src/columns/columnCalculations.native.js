/**
 * WordPress dependencies
 */
import {
	ALIGNMENT_BREAKPOINTS,
	convertUnitToMobile,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getColumnWidths, getWidths } from './utils';
import styles from './editor.scss';

/**
 * Maximum number of columns in a row
 *
 * @type {number}
 */
const MAX_COLUMNS_NUM_IN_ROW = 3;

/**
 * Minimum width of column
 *
 * @type {number}
 */
const MIN_WIDTH = styles.columnsContainer?.minWidth;

/**
 * Container margin value
 *
 * @type {number}
 */
const MARGIN = styles.columnsContainer?.marginLeft;

export const getColumnsInRow = ( width, columnCount ) => {
	if ( width ) {
		if ( width < ALIGNMENT_BREAKPOINTS.mobile ) {
			// show only 1 Column in row for mobile breakpoint container width
			return 1;
		} else if ( width <= ALIGNMENT_BREAKPOINTS.medium ) {
			// show the maximum number of columns in a row for large breakpoint container width
			return Math.min(
				Math.max( 1, columnCount ),
				MAX_COLUMNS_NUM_IN_ROW
			);
		}
		// Show all Column in one row.
		return columnCount;
	}
};

export const calculateContainerWidth = ( containerWidth, columnsInRow ) =>
	2 * MARGIN + containerWidth - columnsInRow * 2 * MARGIN;

export const getContentWidths = (
	columnsInRow,
	width,
	columnCount,
	innerColumns,
	globalStyles
) => {
	const widths = {};
	const columnWidthsWithUnits = getWidths( innerColumns, false );
	const columnWidths = getColumnWidths( innerColumns, columnCount );

	// Array of column width attribute values
	const columnWidthsValues = columnWidthsWithUnits.map( ( v ) =>
		convertUnitToMobile( { width }, globalStyles, v )
	);

	// The sum of column width attribute values
	const columnWidthsSum = columnWidthsValues.reduce(
		( acc, curr ) => acc + curr,
		0
	);

	// Array of ratios of each column width attribute value to their sum
	const columnRatios = columnWidthsValues.map(
		( colWidth ) => colWidth / columnWidthsSum
	);

	// Array of calculated column width for its ratio
	const columnWidthsPerRatio = columnRatios.map(
		( columnRatio ) =>
			columnRatio * calculateContainerWidth( width, columnsInRow )
	);

	//  Array of columns whose calculated width is lower than minimum width value
	const filteredColumnWidthsPerRatio = columnWidthsPerRatio.filter(
		( columnWidthPerRatio ) => columnWidthPerRatio <= MIN_WIDTH
	);

	// Container width to be divided. If there are some results within `filteredColumnWidthsPerRatio`
	// there is a need to reduce the main width by multiplying number
	// of results in `filteredColumnWidthsPerRatio` and minimum width value
	const baseContainerWidth =
		width - filteredColumnWidthsPerRatio.length * MIN_WIDTH;

	// The minimum percentage ratio for which column width is equal minimum width value
	const minPercentageRatio =
		MIN_WIDTH / calculateContainerWidth( width, columnsInRow );

	// The sum of column widths which ratio is higher than `minPercentageRatio`
	const largeColumnsWidthsSum = columnRatios
		.map( ( ratio, index ) => {
			if ( ratio > minPercentageRatio ) {
				return columnWidthsValues[ index ];
			}
			return 0;
		} )
		.reduce( ( acc, curr ) => acc + curr, 0 );

	const containerWidth = calculateContainerWidth(
		baseContainerWidth,
		columnsInRow
	);

	let columnWidth =
		calculateContainerWidth( width, columnsInRow ) / columnsInRow;
	let maxColumnWidth = columnWidth;

	innerColumns.forEach(
		( { attributes: innerColumnAttributes, clientId } ) => {
			const attributeWidth = convertUnitToMobile(
				{ width },
				globalStyles,
				innerColumnAttributes.width || columnWidths[ clientId ]
			);
			const proportionalRatio = attributeWidth / columnWidthsSum;
			const percentageRatio = attributeWidth / width;
			const initialColumnWidth = proportionalRatio * containerWidth;

			if ( columnCount === 1 && width > ALIGNMENT_BREAKPOINTS.medium ) {
				// Exactly one column inside columns on the breakpoint higher than medium
				// has to take a percentage of the full width
				columnWidth = percentageRatio * containerWidth;
			} else if ( columnsInRow > 1 ) {
				if ( width > ALIGNMENT_BREAKPOINTS.medium ) {
					if ( initialColumnWidth <= MIN_WIDTH ) {
						// Column width cannot be lower than minimum 32px
						columnWidth = MIN_WIDTH;
					} else if ( initialColumnWidth > MIN_WIDTH ) {
						// Column width has to be the result of multiplying the container width and
						// the ratio of attribute and the sum of widths of columns wider than 32px
						columnWidth =
							( attributeWidth / largeColumnsWidthsSum ) *
							containerWidth;
					}

					maxColumnWidth = columnWidth;

					if ( Math.round( columnWidthsSum ) < width ) {
						// In case that column width attribute values does not exceed 100, each column
						// should have attribute percentage of container width
						const newColumnWidth = percentageRatio * containerWidth;
						if ( newColumnWidth <= MIN_WIDTH ) {
							columnWidth = MIN_WIDTH;
						} else {
							columnWidth = newColumnWidth;
						}
					}
				} else if ( width < ALIGNMENT_BREAKPOINTS.medium ) {
					// On the breakpoint lower than medium each column inside columns
					// has to take equal part of container width
					columnWidth =
						calculateContainerWidth( width, columnsInRow ) /
						columnsInRow;
				}
			}
			widths[ clientId ] = {
				width: Math.floor( columnWidth ),
				maxWidth: Math.floor( maxColumnWidth ),
			};
		}
	);
	return widths;
};
