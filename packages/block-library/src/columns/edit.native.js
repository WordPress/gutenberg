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

	const getColumnsSliders = () => {
		const columnWidths = innerColumns.map(
			( innerColumn ) =>
				parseFloat( innerColumn.attributes.width ) || 100 / columnCount
		);

		return innerColumns.map( ( column, index ) => {
			return (
				<RangeControl
					min={ 1 }
					max={ 100 }
					step={ 0.1 }
					value={ columnWidths[ index ] }
					onChange={ ( value ) =>
						updateInnerColumnWidth( value, column.clientId )
					}
					cellContainerStyle={ styles.cellContainerStyle }
					decimalNum={ 1 }
					rangePreview={
						<ColumnsPreview
							columnWidths={ columnWidths }
							selectedColumnIndex={ index }
						/>
					}
					key={ column.clientId }
					shouldDisplayTextInput={ false }
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
				width: `${ value }%`,
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

			// Redistribute available width for existing inner blocks.
			const isAddingColumn = newColumns > previousColumns;

			if ( isAddingColumn ) {
				// Get verticalAlignment from Columns block to set the same to new Column
				const { verticalAlignment } =
					getBlockAttributes( clientId ) || {};

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
	const { columnCount, isDefaultColumns, innerColumns = [] } = useSelect(
		( select ) => {
			const { getBlockCount, getBlock } = select( 'core/block-editor' );
			const block = getBlock( clientId );
			const innerBlocks = block?.innerBlocks;
			const isContentEmpty = map(
				innerBlocks,
				( innerBlock ) => innerBlock.innerBlocks.length
			);

			return {
				columnCount: getBlockCount( clientId ),
				isDefaultColumns: ! compact( isContentEmpty ).length,
				innerColumns: innerBlocks,
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
