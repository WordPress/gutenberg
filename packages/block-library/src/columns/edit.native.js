/**
 * External dependencies
 */
import { View } from 'react-native';
import { dropRight, times } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, RangeControl } from '@wordpress/components';
import {
	InspectorControls,
	InnerBlocks,
	BlockControls,
	BlockVerticalAlignmentToolbar,
} from '@wordpress/block-editor';
import { withDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState, useMemo } from '@wordpress/element';
import { useResizeObserver } from '@wordpress/compose';
import { createBlock } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import styles from './editor.scss';

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
const DEFAULT_COLUMNS = 2;
const MIN_COLUMNS_NUMBER = 1;

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
} ) {
	const [ resizeListener, sizes ] = useResizeObserver();
	const [ columnsInRow, setColumnsInRow ] = useState( MIN_COLUMNS_NUMBER );

	const { verticalAlignment } = attributes;
	const { width } = sizes || {};

	useEffect( () => {
		const newColumnCount = ! columnCount ? DEFAULT_COLUMNS : columnCount;
		updateColumns( columnCount, newColumnCount );
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
			const margins = columnsInRow * 2 * styles.columnMargin.marginLeft;
			columnWidth = ( minWidth - margins ) / columnsInRow;
		}
		return { width: columnWidth };
	}, [ width, columnsInRow ] );

	const getColumnsInRow = ( containerWidth, columnsNumber ) => {
		if ( containerWidth < BREAKPOINTS.mobile ) {
			// show only 1 Column in row for mobile breakpoint container width
			return 1;
		} else if ( containerWidth < BREAKPOINTS.large ) {
			// show 2 Column in row for large breakpoint container width
			return Math.min( Math.max( 1, columnCount ), 2 );
		}
		// show all Column in one row
		return Math.max( 1, columnsNumber );
	};

	const renderAppender = () => {
		if ( isSelected ) {
			return (
				<InnerBlocks.ButtonBlockAppender
					onAddBlock={ onAddNextColumn }
				/>
			);
		}
		return null;
	};

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
						min={ MIN_COLUMNS_NUMBER }
						max={ columnCount + 1 }
						type="stepper"
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
						__experimentalMoverDirection={
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
				const { verticalAlignment } = getBlockAttributes( clientId );

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

			innerBlocks.push( insertedBlock );

			replaceInnerBlocks( clientId, innerBlocks, true );
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
	const { clientId } = props;
	const { columnCount } = useSelect(
		( select ) => {
			const { getBlockCount } = select( 'core/block-editor' );

			return {
				columnCount: getBlockCount( clientId ),
			};
		},
		[ clientId ]
	);

	return (
		<ColumnsEditContainerWrapper columnCount={ columnCount } { ...props } />
	);
};

export default ColumnsEdit;
