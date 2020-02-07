/**
 * External dependencies
 */
import { View } from 'react-native';
import { dropRight, times } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	PanelBody,
	StepperControl,
	Toolbar,
	ToolbarButton,
} from '@wordpress/components';
import {
	InspectorControls,
	InnerBlocks,
	BlockControls,
	BlockVerticalAlignmentToolbar,
} from '@wordpress/block-editor';
import { withDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { createBlock } from '@wordpress/blocks';
import { withViewportMatch } from '@wordpress/viewport';
import { columns as icon } from '@wordpress/icons';
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
const MIN_COLUMNS_NUMBER = 2;
const MAX_COLUMNS_NUMBER = 6;

function ColumnsEditContainer( {
	attributes,
	updateBlockSettings,
	blockListSettings,
	updateAlignment,
	updateColumns,
	clientId,
	isMobile,
} ) {
	const { verticalAlignment } = attributes;
	const { width } = blockListSettings;

	const { columnCount } = useSelect( ( select ) => {
		return {
			columnCount: select( 'core/block-editor' ).getBlockCount(
				clientId
			),
		};
	} );

	useEffect( () => {
		updateColumns(
			columnCount,
			Math.min( MAX_COLUMNS_NUMBER, columnCount || DEFAULT_COLUMNS )
		);
	}, [] );

	const getColumnsInRow = ( containerWidth, columnsNumber ) => {
		if ( containerWidth < 480 ) {
			return 1;
		}
		if ( containerWidth >= 480 && containerWidth < 768 ) {
			return 2;
		}
		return columnsNumber;
	};

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Columns Settings' ) }>
					<StepperControl
						label={ __( 'Number of columns' ) }
						icon="columns"
						value={ columnCount }
						defaultValue={ DEFAULT_COLUMNS }
						onChangeValue={ ( value ) =>
							updateColumns( columnCount, value )
						}
						minValue={ MIN_COLUMNS_NUMBER }
						maxValue={ MAX_COLUMNS_NUMBER }
					/>
				</PanelBody>
			</InspectorControls>
			<BlockControls>
				<Toolbar>
					<ToolbarButton
						title={ __( 'ColumnsButton' ) }
						icon={ icon }
						onClick={ () => {} }
					/>
				</Toolbar>
				<BlockVerticalAlignmentToolbar
					onChange={ updateAlignment }
					value={ verticalAlignment }
					isCollapsed={ false }
				/>
			</BlockControls>
			<View
				onLayout={ ( event ) => {
					const { width: newWidth } = event.nativeEvent.layout;
					if ( newWidth !== width ) {
						updateBlockSettings( {
							...blockListSettings,
							columnsInRow: getColumnsInRow(
								newWidth,
								columnCount
							),
							width: newWidth,
						} );
					}
				} }
			>
				<InnerBlocks
					containerStyle={
						! isMobile ? styles.columnsContainer : undefined
					}
					allowedBlocks={ ALLOWED_BLOCKS }
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
			const { getBlocks } = registry.select( 'core/block-editor' );

			let innerBlocks = getBlocks( clientId );

			// Redistribute available width for existing inner blocks.
			const isAddingColumn = newColumns > previousColumns;

			if ( isAddingColumn ) {
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
			}

			replaceInnerBlocks( clientId, innerBlocks, false );
		},
	} )
)( ColumnsEditContainer );

const ColumnsEdit = ( props ) => {
	const { clientId, isSelected, getStylesFromColorScheme } = props;
	const { hasChildren, blockListSettings } = useSelect(
		( select ) => {
			const { getBlocks, getBlockListSettings } = select(
				'core/block-editor'
			);

			return {
				hasChildren: getBlocks( clientId ).length > 0,
				blockListSettings: getBlockListSettings( clientId ) || {},
			};
		},
		[ clientId ]
	);

	if ( ! isSelected && ! hasChildren ) {
		return (
			<View
				style={ [
					getStylesFromColorScheme(
						styles.columnsPlaceholder,
						styles.columnsPlaceholderDark
					),
					! hasChildren && {
						...styles.marginVerticalDense,
						...styles.marginHorizontalNone,
					},
				] }
			/>
		);
	}

	return (
		<ColumnsEditContainerWrapper
			blockListSettings={ blockListSettings }
			{ ...props }
		/>
	);
};

export default compose( [
	withViewportMatch( { isMobile: '< mobile' } ),
	withPreferredColorScheme,
] )( ColumnsEdit );
