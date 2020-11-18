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
	UnitControl,
	getValueAndUnit,
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
import { columns } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import variations from './variations';
import styles from './editor.scss';
import {
	hasExplicitPercentColumnWidths,
	getMappedColumnWidths,
	getRedistributedColumnWidths,
	toWidthPrecision,
	getWidths,
	getWidthWithUnit,
	CSS_UNITS,
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

const BREAKPOINTS = {
	mobile: 480,
	large: 768,
};

function ColumnsEditContainer( {
	attributes,
	updateAlignment,
	updateColumns,
	columnCount,
	isSelected,
	onAddNextColumn,
	onDeleteBlock,
	innerColumns,
	updateInnerColumnWidth,
} ) {
	const [ resizeListener, sizes ] = useResizeObserver();
	const [ columnsInRow, setColumnsInRow ] = useState( MIN_COLUMNS_NUM );

	const { verticalAlignment } = attributes;
	const { width } = sizes || {};

	const newColumnCount = columnCount || DEFAULT_COLUMNS_NUM;

	useEffect( () => {
		updateColumns( columnCount, newColumnCount );
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

	const contentStyle = useMemo( () => {
		const minWidth = Math.min( width, styles.columnsContainer.maxWidth );
		const columnBaseWidth = minWidth / columnsInRow;

		let columnWidth = columnBaseWidth;
		if ( columnsInRow > 1 ) {
			const margins =
				columnsInRow *
				Math.min( columnsInRow, MAX_COLUMNS_NUM_IN_ROW ) *
				styles.columnMargin.marginLeft;
			columnWidth = ( minWidth - margins ) / columnsInRow;
		}
		return { width: columnWidth };
	}, [ width, columnsInRow ] );

	const getColumnsInRow = ( containerWidth, columnsNumber ) => {
		if ( containerWidth < BREAKPOINTS.mobile ) {
			// show only 1 Column in row for mobile breakpoint container width
			return 1;
		} else if ( containerWidth < BREAKPOINTS.large ) {
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
		if ( isSelected ) {
			return (
				<View style={ columnCount === 0 && { width } }>
					<InnerBlocks.ButtonBlockAppender
						onAddBlock={ onAddNextColumn }
					/>
				</View>
			);
		}
		return null;
	};

	const onChangeWidth = ( nextWidth, valueUnit, columnId ) => {
		const widthWithUnit = getWidthWithUnit( nextWidth, valueUnit );

		updateInnerColumnWidth( widthWithUnit, columnId );
	};

	const onChangeUnit = ( nextUnit, index, columnId ) => {
		const tempWidth = parseFloat( getWidths( innerColumns )[ index ] );
		const widthWithUnit = getWidthWithUnit( tempWidth, nextUnit );

		updateInnerColumnWidth( widthWithUnit, columnId );
	};

	const getColumnsSliders = () => {
		return innerColumns.map( ( column, index ) => {
			const { valueUnit = '%' } =
				getValueAndUnit( column.attributes.width ) || {};
			return (
				<UnitControl
					label={ `Column ${ index + 1 }` }
					key={ `${ column.clientId }-${
						getWidths( innerColumns ).length
					}` }
					min={ 1 }
					max={ valueUnit === '%' || ! valueUnit ? 100 : undefined }
					decimalNum={ 1 }
					value={ getWidths( innerColumns )[ index ] }
					onChange={ ( nextWidth ) => {
						onChangeWidth( nextWidth, valueUnit, column.clientId );
					} }
					onUnitChange={ ( nextUnit ) =>
						onChangeUnit( nextUnit, index, column.clientId )
					}
					unit={ valueUnit }
					units={ CSS_UNITS }
					preview={
						<ColumnsPreview
							columnWidths={ getWidths( innerColumns, false ) }
							selectedColumnIndex={ index }
						/>
					}
				/>
			);
		} );
	};

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Columns Settings' ) }>
					<RangeControl
						label={ __( 'Number of columns' ) }
						icon={ columns }
						value={ columnCount }
						onChange={ ( value ) =>
							updateColumns( columnCount, value )
						}
						min={ MIN_COLUMNS_NUM }
						max={ columnCount + 1 }
						type="stepper"
					/>
					{ getColumnsSliders() }
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
						onAddBlock={ onAddNextColumn }
						onDeleteBlock={
							columnCount === 1 ? onDeleteBlock : undefined
						}
						contentStyle={ contentStyle }
						parentWidth={ width }
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
			const { getBlocks, getBlockAttributes } = registry.select(
				'core/block-editor'
			);

			let innerBlocks = getBlocks( clientId );
			const hasExplicitWidths = hasExplicitPercentColumnWidths(
				innerBlocks
			);

			// Redistribute available width for existing inner blocks.
			const isAddingColumn = newColumns > previousColumns;

			// Get verticalAlignment from Columns block to set the same to new Column
			const { verticalAlignment } = getBlockAttributes( clientId ) || {};

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
							verticalAlignment,
						} );
					} ),
				];
			} else if ( isAddingColumn ) {
				innerBlocks = [
					...innerBlocks,
					...times( newColumns - previousColumns, () => {
						return createBlock( 'core/column', {
							verticalAlignment,
						} );
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

			replaceInnerBlocks( clientId, innerBlocks );
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
