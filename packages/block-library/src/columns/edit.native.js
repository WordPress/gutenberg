/**
 * External dependencies
 */
import { View, Dimensions } from 'react-native';
import { dropRight, times, map, compact, delay } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	RangeControl,
	FooterMessageControl,
	WIDE_ALIGNMENTS,
	ALIGNMENT_BREAKPOINTS,
} from '@wordpress/components';
import {
	InspectorControls,
	InnerBlocks,
	BlockControls,
	BlockVerticalAlignmentToolbar,
	BlockVariationPicker,
} from '@wordpress/block-editor';
import { withDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState, useMemo, useCallback } from '@wordpress/element';
import { useResizeObserver } from '@wordpress/compose';
import { createBlock } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import variations from './variations';
import styles from './editor.scss';
import {
	hasExplicitColumnWidths,
	getMappedColumnWidths,
	getRedistributedColumnWidths,
	toWidthPrecision,
	getColumnWidths,
} from './utils';
import ColumnsPreview from '../column/column-preview';

/**
 * Allowed blocks constant is passed to InnerBlocks precisely as specified here.
 * The contents of the array should never change.
 * The array should contain the name of each block that is allowed.
 * In columns block, the only block we allow is 'core/column'.
 *
 * @constant
 * @type {string[]}
 */
const ALLOWED_BLOCKS = [ 'core/column' ];

/**
 * Number of columns to assume for template in case the user opts to skip
 * template option selection.
 *
 * @type {number}
 */
const DEFAULT_COLUMNS_NUM = 2;

/**
 * Minimum number of columns in a row
 *
 * @type {number}
 */
const MIN_COLUMNS_NUM = 1;

/**
 * Maximum number of columns in a row
 *
 * @type {number}
 */
const MAX_COLUMNS_NUM_IN_ROW = 3;

const MARGIN = 16;
const MIN_WIDTH = 32;

function ColumnsEditContainer( {
	attributes,
	updateAlignment,
	updateColumns,
	columnCount,
	isSelected,
	onDeleteBlock,
	innerColumns,
	updateInnerColumnWidth,
	parentBlockAlignment,
	parentWidth,
	editorSidebarOpened,
} ) {
	const [ resizeListener, sizes ] = useResizeObserver();
	const [ columnsInRow, setColumnsInRow ] = useState( MIN_COLUMNS_NUM );
	const screenWidth = Math.floor( Dimensions.get( 'window' ).width );

	const { verticalAlignment, align } = attributes;
	const { width } = sizes || {};

	const newColumnCount = columnCount || DEFAULT_COLUMNS_NUM;

	useEffect( () => {
		if ( columnCount === 0 ) {
			updateColumns( columnCount, newColumnCount );
		}
	}, [] );

	useEffect( () => {
		if ( width ) {
			if ( getColumnsInRow !== columnsInRow ) {
				setColumnsInRow( getColumnsInRow );
			}
		}
	}, [ width, columnCount ] );

	const getContainerWidth = ( containerWidth ) =>
		2 * MARGIN + containerWidth - columnsInRow * 2 * MARGIN;

	const columnWidths = getColumnWidths( innerColumns, columnCount );

	// Array of column width attribute values
	const columnWidthsValues = Object.values(
		getColumnWidths( innerColumns, columnCount )
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
		( columnRatio ) => columnRatio * getContainerWidth( width )
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
	const minPercentageRatio = MIN_WIDTH / getContainerWidth( width );

	// The sum of column widths which ratio is higher than `minPercentageRatio`
	const largeColumnsWidthsSum = columnRatios
		.map( ( ratio, index ) => {
			if ( ratio > minPercentageRatio ) {
				return columnWidthsValues[ index ];
			}
			return 0;
		} )
		.reduce( ( acc, curr ) => acc + curr, 0 );

	const calculateWidths = useMemo( () => {
		const widths = {};
		const containerWidth = getContainerWidth( baseContainerWidth );

		let columnWidth = getContainerWidth( width ) / columnsInRow;
		let maxColumnWidth = columnWidth;

		innerColumns.forEach(
			( { attributes: innerColumnAttributes, clientId } ) => {
				const attributeWidth =
					innerColumnAttributes.width || columnWidths[ clientId ];
				const proportionalRatio = attributeWidth / columnWidthsSum;
				const percentageRatio = attributeWidth / 100;
				const initialColumnWidth = proportionalRatio * containerWidth;

				if (
					columnCount === 1 &&
					width > ALIGNMENT_BREAKPOINTS.medium
				) {
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

						if ( Math.round( columnWidthsSum ) < 100 ) {
							// In case that column width attribute values does not exceed 100, each column
							// should have attribute percentage of container width
							const newColumnWidth =
								percentageRatio * containerWidth;
							if ( newColumnWidth <= MIN_WIDTH ) {
								columnWidth = MIN_WIDTH;
							} else {
								columnWidth = newColumnWidth;
							}
						}
					} else if ( width < ALIGNMENT_BREAKPOINTS.medium ) {
						// On the breakpoint lower than medium each column inside columns
						// has to take equal part of container width
						columnWidth = getContainerWidth( width ) / columnsInRow;
					}
				}
				widths[ clientId ] = {
					width: Math.floor( columnWidth ),
					maxWidth: Math.floor( maxColumnWidth ),
				};
			}
		);
		return widths;
	}, [ columnWidthsValues ] );

	const getColumnsInRow = useMemo( () => {
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
			// show all Column in one row
			return Math.max( 1, innerColumns.length, columnCount );
		}
	}, [ width, innerColumns.length ] );

	const renderAppender = useCallback( () => {
		const isFullWidth = align === WIDE_ALIGNMENTS.alignments.full;
		const isParentFullWidth =
			parentBlockAlignment === WIDE_ALIGNMENTS.alignments.full;
		const isEqualWidth = width === screenWidth;

		if ( isSelected ) {
			return (
				<View
					style={ [
						( isFullWidth || isParentFullWidth || isEqualWidth ) &&
							styles.columnAppender,
						columnCount === 0 && {
							width,
						},
					] }
				>
					<InnerBlocks.ButtonBlockAppender
						onAddBlock={ () =>
							updateColumns( columnCount, columnCount + 1 )
						}
					/>
				</View>
			);
		}
		return null;
	}, [ isSelected, width, screenWidth, parentWidth, columnCount ] );

	const getColumnsSliders = useMemo( () => {
		if ( ! editorSidebarOpened || ! isSelected ) {
			return null;
		}

		return innerColumns.map( ( column, index ) => (
			<RangeControl
				min={ 1 }
				max={ 100 }
				step={ 0.1 }
				value={ columnWidthsValues[ index ] }
				onChange={ ( value ) =>
					updateInnerColumnWidth( value, column.clientId )
				}
				cellContainerStyle={ styles.cellContainerStyle }
				toFixed={ 1 }
				rangePreview={
					<ColumnsPreview
						columnWidths={ columnWidthsValues }
						selectedColumnIndex={ index }
					/>
				}
				key={ `${ column.clientId }-${ columnWidthsValues.length }` }
				shouldDisplayTextInput={ false }
			/>
		) );
	}, [ innerColumns, columnWidthsValues, editorSidebarOpened ] );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Columns Settings' ) }>
					<RangeControl
						label={ __( 'Number of columns' ) }
						icon="columns"
						value={ columnCount }
						onChange={ ( value ) =>
							updateColumns( columnCount, value )
						}
						min={ MIN_COLUMNS_NUM }
						max={ columnCount + 1 }
						type="stepper"
					/>
					{ getColumnsSliders }
				</PanelBody>
				<PanelBody>
					<FooterMessageControl
						label={ __(
							'Note: Column layout may vary between themes and screen sizes'
						) }
					/>
				</PanelBody>
			</InspectorControls>
			<BlockControls>
				<BlockVerticalAlignmentToolbar
					onChange={ updateAlignment }
					value={ verticalAlignment }
				/>
			</BlockControls>
			<View style={ isSelected && styles.innerBlocksSelected }>
				{ resizeListener }
				{ width && (
					<InnerBlocks
						renderAppender={ renderAppender }
						orientation={
							columnsInRow > 1 ? 'horizontal' : undefined
						}
						horizontal={ true }
						allowedBlocks={ ALLOWED_BLOCKS }
						contentResizeMode="stretch"
						onAddBlock={ () =>
							updateColumns( columnCount, columnCount + 1 )
						}
						onDeleteBlock={
							columnCount === 1 ? onDeleteBlock : undefined
						}
						blockWidth={ width }
						contentStyle={ calculateWidths }
						parentWidth={
							align === WIDE_ALIGNMENTS.alignments.full &&
							columnCount === 0
								? screenWidth
								: getContainerWidth( baseContainerWidth )
						}
					/>
				) }
			</View>
		</>
	);
}

const ColumnsEditContainerWrapper = withDispatch(
	( dispatch, ownProps, registry ) => ( {
		/**
		 * Update all child Column blocks with a new vertical alignment setting
		 * based on whatever alignment is passed in. This allows change to parent
		 * to overide anything set on a individual column basis.
		 *
		 * @param {string} verticalAlignment the vertical alignment setting
		 */
		updateAlignment( verticalAlignment ) {
			const { clientId, setAttributes } = ownProps;
			const { updateBlockAttributes } = dispatch( 'core/block-editor' );
			const { getBlockOrder } = registry.select( 'core/block-editor' );

			// Update own alignment.
			setAttributes( { verticalAlignment } );

			// Update all child Column Blocks to match
			const innerBlockClientIds = getBlockOrder( clientId );
			innerBlockClientIds.forEach( ( innerBlockClientId ) => {
				updateBlockAttributes( innerBlockClientId, {
					verticalAlignment,
				} );
			} );
		},
		updateInnerColumnWidth( value, columnId ) {
			const { updateBlockAttributes } = dispatch( 'core/block-editor' );

			updateBlockAttributes( columnId, {
				width: value,
			} );
		},
		updateBlockSettings( settings ) {
			const { clientId } = ownProps;
			const { updateBlockListSettings } = dispatch( 'core/block-editor' );
			updateBlockListSettings( clientId, settings );
		},
		/**
		 * Updates the column columnCount, including necessary revisions to child Column
		 * blocks to grant required or redistribute available space.
		 *
		 * @param {number} previousColumns Previous column columnCount.
		 * @param {number} newColumns      New column columnCount.
		 */
		updateColumns( previousColumns, newColumns ) {
			const { clientId } = ownProps;
			const { replaceInnerBlocks } = dispatch( 'core/block-editor' );
			const { getBlocks } = registry.select( 'core/block-editor' );

			let innerBlocks = getBlocks( clientId );
			const hasExplicitWidths = hasExplicitColumnWidths( innerBlocks );

			// Redistribute available width for existing inner blocks.
			const isAddingColumn = newColumns > previousColumns;

			if ( isAddingColumn && hasExplicitWidths ) {
				// If adding a new column, assign width to the new column equal to
				// as if it were `1 / columns` of the total available space.
				const newColumnWidth = toWidthPrecision( 100 / newColumns );

				// Redistribute in consideration of pending block insertion as
				// constraining the available working width.
				const widths = getRedistributedColumnWidths(
					innerBlocks,
					100 - newColumnWidth
				);

				innerBlocks = [
					...getMappedColumnWidths( innerBlocks, widths ),
					...times( newColumns - previousColumns, () => {
						return createBlock( 'core/column', {
							width: newColumnWidth,
						} );
					} ),
				];
			} else if ( isAddingColumn ) {
				innerBlocks = [
					...innerBlocks,
					...times( newColumns - previousColumns, () => {
						return createBlock( 'core/column' );
					} ),
				];
			} else {
				// The removed column will be the last of the inner blocks.
				innerBlocks = dropRight(
					innerBlocks,
					previousColumns - newColumns
				);

				if ( hasExplicitWidths ) {
					// Redistribute as if block is already removed.
					const widths = getRedistributedColumnWidths(
						innerBlocks,
						100
					);

					innerBlocks = getMappedColumnWidths( innerBlocks, widths );
				}
			}

			replaceInnerBlocks( clientId, innerBlocks, false );
		},
		onAddNextColumn: () => {
			const { clientId } = ownProps;
			const { replaceInnerBlocks, selectBlock } = dispatch(
				'core/block-editor'
			);
			const { getBlocks, getBlockAttributes } = registry.select(
				'core/block-editor'
			);

			// Get verticalAlignment from Columns block to set the same to new Column
			const { verticalAlignment } = getBlockAttributes( clientId );

			const innerBlocks = getBlocks( clientId );

			const insertedBlock = createBlock( 'core/column', {
				verticalAlignment,
			} );

			replaceInnerBlocks(
				clientId,
				[ ...innerBlocks, insertedBlock ],
				true
			);
			selectBlock( insertedBlock.clientId );
		},
		onDeleteBlock: () => {
			const { clientId } = ownProps;
			const { removeBlock } = dispatch( 'core/block-editor' );
			removeBlock( clientId );
		},
	} )
)( ColumnsEditContainer );

const ColumnsEdit = ( props ) => {
	const { clientId, isSelected } = props;
	const {
		columnCount,
		isDefaultColumns,
		innerColumns = [],
		hasParents,
		parentBlockAlignment,
		editorSidebarOpened,
	} = useSelect(
		( select ) => {
			const {
				getBlockCount,
				getBlock,
				getBlockParents,
				getBlockAttributes,
			} = select( 'core/block-editor' );
			const { isEditorSidebarOpened } = select( 'core/edit-post' );
			const block = getBlock( clientId );
			const innerBlocks = block?.innerBlocks;
			const isContentEmpty = map(
				innerBlocks,
				( innerBlock ) => innerBlock.innerBlocks.length
			);
			const parents = getBlockParents( clientId, true );

			return {
				columnCount: getBlockCount( clientId ),
				isDefaultColumns: ! compact( isContentEmpty ).length,
				innerColumns: innerBlocks,
				hasParents: !! parents.length,
				parentBlockAlignment: getBlockAttributes( parents[ 0 ] )?.align,
				editorSidebarOpened: isEditorSidebarOpened(),
			};
		},
		[ clientId ]
	);

	const [ isVisible, setIsVisible ] = useState( false );

	useEffect( () => {
		if ( isSelected && isDefaultColumns ) {
			delay( () => setIsVisible( true ), 100 );
		}
	}, [] );

	return (
		<>
			<ColumnsEditContainerWrapper
				columnCount={ columnCount }
				innerColumns={ innerColumns }
				hasParents={ hasParents }
				parentBlockAlignment={ parentBlockAlignment }
				editorSidebarOpened={ editorSidebarOpened }
				{ ...props }
			/>
			<BlockVariationPicker
				variations={ variations }
				onClose={ () => setIsVisible( false ) }
				clientId={ clientId }
				isVisible={ isVisible }
			/>
		</>
	);
};

export default ColumnsEdit;
