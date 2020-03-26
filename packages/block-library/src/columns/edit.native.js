/**
 * External dependencies
 */
import { View } from 'react-native';
import { dropRight, times } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, StepperControl } from '@wordpress/components';
import {
	InspectorControls,
	InnerBlocks,
	BlockControls,
	BlockVerticalAlignmentToolbar,
} from '@wordpress/block-editor';
import { withDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
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

function ColumnsEditContainer( {
	attributes,
	updateAlignment,
	updateColumns,
	columnCount,
	isSelected,
	onAddNextColumn,
	onDelete,
} ) {
	const [ resizeListener, sizes ] = useResizeObserver();
	const [ columnsSettings, setColumnsSettings ] = useState( {
		columnsInRow: MIN_COLUMNS_NUMBER,
	} );

	const { verticalAlignment } = attributes;
	const { width } = sizes || {};

	useEffect( () => {
		const newColumnCount = ! columnCount ? DEFAULT_COLUMNS : columnCount;
		updateColumns( columnCount, newColumnCount );
		setColumnsSettings( {
			...columnsSettings,
			columnsInRow: getColumnsInRow( width, newColumnCount ),
		} );
	}, [ columnCount ] );

	useEffect( () => {
		setColumnsSettings( {
			columnsInRow: getColumnsInRow( width, columnCount ),
			width,
		} );
	}, [ width ] );

	const getColumnsInRow = ( containerWidth, columnsNumber ) => {
		if ( containerWidth < 480 ) {
			return 1;
		}
		if ( containerWidth >= 480 && containerWidth < 768 ) {
			return Math.min( columnCount, 2 );
		}
		return columnsNumber;
	};

	const renderAppender = () => {
		if ( isSelected ) {
			return (
				<InnerBlocks.ButtonBlockAppender
					customOnAdd={ onAddNextColumn }
				/>
			);
		}
		return null;
	};

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Columns Settings' ) }>
					<StepperControl
						label={ __( 'Number of columns' ) }
						icon="columns"
						value={ columnCount }
						onChange={ ( value ) =>
							updateColumns( columnCount, value )
						}
						min={ MIN_COLUMNS_NUMBER }
						max={ columnCount + 1 }
						separatorType={ 'none' }
					/>
				</PanelBody>
			</InspectorControls>
			<BlockControls>
				<BlockVerticalAlignmentToolbar
					onChange={ updateAlignment }
					value={ verticalAlignment }
					isCollapsed={ false }
				/>
			</BlockControls>
			<View style={ isSelected && styles.innerBlocksSelected }>
				{ resizeListener }
				<InnerBlocks
					renderAppender={ renderAppender }
					__experimentalMoverDirection={
						getColumnsInRow( width, columnCount ) > 1
							? 'horizontal'
							: undefined
					}
					flatListProps={ {
						contentContainerStyle: styles.columnsContainer,
						horizontal: true,
						scrollEnabled: false,
						style: styles.innerBlocks,
					} }
					allowedBlocks={ ALLOWED_BLOCKS }
					customBlockProps={ {
						...columnsSettings,
						readableContentViewStyle: { flex: 1 },
						customOnAdd: onAddNextColumn,
						customOnDelete:
							columnCount === 1 ? onDelete : undefined,
					} }
				/>
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
		onDelete: () => {
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
