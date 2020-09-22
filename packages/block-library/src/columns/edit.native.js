/**
 * External dependencies
 */
import { View } from 'react-native';
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
import { useEffect, useState, useMemo } from '@wordpress/element';
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
const DELTA = 1;
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
	hasParents,
} ) {
	const [ resizeListener, sizes ] = useResizeObserver();
	const [ columnsInRow, setColumnsInRow ] = useState( MIN_COLUMNS_NUM );

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
			setColumnsInRow( getColumnsInRow( width, newColumnCount ) );
		}
	}, [ columnCount ] );

	useEffect( () => {
		if ( width ) {
			setColumnsInRow( getColumnsInRow( width, columnCount ) );
		}
	}, [ width ] );

	const getContainerWidth = ( containerWidth ) =>
		2 * MARGIN + containerWidth - columnsInRow * 2 * MARGIN - DELTA * 2;

	const columnWidths = getColumnWidths( innerColumns, columnCount );

	const columnWidthsValues = Object.values(
		getColumnWidths( innerColumns, columnCount )
	);

	const columnWidthsSum = columnWidthsValues.reduce(
		( acc, curr ) => acc + curr,
		0
	);

	const columnRatios = columnWidthsValues.map(
		( colWidth ) => colWidth / columnWidthsSum
	);

	const columnWidthsPerRatio = columnWidthsValues.map(
		( columnWidth ) =>
			( columnWidth / columnWidthsSum ) * getContainerWidth( width )
	);

	const filteredColumnWidthsPerRatio = columnWidthsPerRatio.filter(
		( columnWidthPerRatio ) => columnWidthPerRatio < MIN_WIDTH
	);

	const baseContainerWidth =
		width - filteredColumnWidthsPerRatio.length * MIN_WIDTH;

	const minPercentageRatio = MIN_WIDTH / baseContainerWidth;

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

		let columnWidth = width / columnsInRow;
		let maxColumnWidth = columnWidth;

		innerColumns.forEach(
			( { attributes: innerColumnAttributes, clientId } ) => {
				const attributeWidth =
					innerColumnAttributes.width || columnWidths[ clientId ];
				const propotionalRatio = attributeWidth / columnWidthsSum;
				const percentageRatio = attributeWidth / 100;
				const initialColumnWidth = Math.floor(
					propotionalRatio * containerWidth
				);

				if (
					columnCount === 1 &&
					width > ALIGNMENT_BREAKPOINTS.medium
				) {
					columnWidth = percentageRatio * containerWidth;
				} else if ( columnsInRow > 1 ) {
					if ( width > ALIGNMENT_BREAKPOINTS.medium ) {
						if ( initialColumnWidth <= MIN_WIDTH ) {
							columnWidth = MIN_WIDTH;
						} else if ( initialColumnWidth > MIN_WIDTH ) {
							columnWidth = Math.floor(
								( attributeWidth / largeColumnsWidthsSum ) *
									containerWidth
							);
						}

						maxColumnWidth = columnWidth;

						if ( Math.round( columnWidthsSum ) < 100 ) {
							const newColumnWidth =
								percentageRatio * containerWidth;
							if ( newColumnWidth < MIN_WIDTH ) {
								columnWidth = MIN_WIDTH;
							} else {
								columnWidth = newColumnWidth;
							}
						}

						widths[ clientId ] = {
							width: columnWidth,
							maxWidth: maxColumnWidth,
						};
					} else if ( width < ALIGNMENT_BREAKPOINTS.medium ) {
						columnWidth = Math.floor(
							getContainerWidth( width ) / columnsInRow
						);
						widths[ clientId ] = {
							width: columnWidth,
							maxWidth: maxColumnWidth,
						};
					}
				}
				widths[ clientId ] = {
					width: columnWidth,
					maxWidth: maxColumnWidth,
				};
			}
		);
		return widths;
	}, [ columnWidthsValues ] );

	const getColumnsInRow = ( containerWidth, columnsNumber ) => {
		if ( containerWidth < ALIGNMENT_BREAKPOINTS.mobile ) {
			// show only 1 Column in row for mobile breakpoint container width
			return 1;
		} else if ( containerWidth < ALIGNMENT_BREAKPOINTS.medium ) {
			// show the maximum number of columns in a row for large breakpoint container width
			return Math.min(
				Math.max( 1, columnCount ),
				MAX_COLUMNS_NUM_IN_ROW
			);
		}
		// show all Column in one row
		return Math.max( 1, columnsNumber );
	};

	const renderAppender = () => {
		const isFullWidth = align === WIDE_ALIGNMENTS.alignments.full;

		if ( isSelected ) {
			return (
				<View
					style={ [
						isFullWidth &&
							! hasParents &&
							width > ALIGNMENT_BREAKPOINTS.mobile &&
							styles.fullWidthAppender,
						columnCount === 0 && { width },
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
	};

	const getColumnsSliders = useMemo( () => {
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
	}, [ innerColumns, columnWidthsValues ] );

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
						parentWidth={ getContainerWidth( baseContainerWidth ) }
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
	} = useSelect(
		( select ) => {
			const { getBlockCount, getBlock, getBlockParents } = select(
				'core/block-editor'
			);
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
