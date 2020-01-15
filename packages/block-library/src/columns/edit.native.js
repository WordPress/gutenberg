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
	// __experimentalBlockPatternPicker,
	BlockVerticalAlignmentToolbar,
} from '@wordpress/block-editor';
import {
	withDispatch,
	// useDispatch,
	useSelect,
} from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { createBlock } from '@wordpress/blocks';
import { withViewportMatch } from '@wordpress/viewport';

/**
 * Internal dependencies
 */
import {
	hasExplicitColumnWidths,
	getMappedColumnWidths,
	getRedistributedColumnWidths,
	toWidthPrecision,
} from './utils';

import styles from './editor.scss';
import Icon from './icon';

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
	updateAlignment,
	updateColumns,
	clientId,
	isSmallScreen,
	isLargeScreen,
	isMediumScreen,
} ) {
	const { verticalAlignment } = attributes;

	const { count } = useSelect( ( select ) => {
		return {
			count: select( 'core/block-editor' ).getBlockCount( clientId ),
		};
	} );

	const getColumnsInRow = ( columnsCount ) => {
		if ( isSmallScreen ) {
			return 1;
		}
		if ( isMediumScreen && ! isLargeScreen ) {
			return 2;
		}
		return columnsCount;
	};

	const columnsInRow = getColumnsInRow( count );
	const columnsWidth = `${ 100 / columnsInRow }%`;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Columns Settings' ) }>
					<StepperControl
						label={ __( 'Number of columns' ) }
						icon="columns"
						value={ count }
						defaultValue={ DEFAULT_COLUMNS }
						onChangeValue={ ( value ) => updateColumns( count, value ) }
						minValue={ MIN_COLUMNS_NUMBER }
						maxValue={ MAX_COLUMNS_NUMBER }
					/>
				</PanelBody>
			</InspectorControls>
			<BlockControls>
				<Toolbar>
					<ToolbarButton
						title={ __( 'ColumnsButton' ) }
						icon={ <Icon width={ 20 } height={ 20 } /> }
						onClick={ () => console.log( 'click' ) }
					/>
				</Toolbar>
				<BlockVerticalAlignmentToolbar
					onChange={ updateAlignment }
					value={ verticalAlignment }
				/>
			</BlockControls>
			<InnerBlocks
				containerStyle={ ! isSmallScreen ? styles.columnsContainer : undefined }
				itemStyle={ { width: columnsWidth } }
				allowedBlocks={ ALLOWED_BLOCKS }
			/>
		</>
	);
}

const ColumnsEditContainerWrapper = withDispatch( ( dispatch, ownProps, registry ) => ( {
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

	/**
	 * Updates the column count, including necessary revisions to child Column
	 * blocks to grant required or redistribute available space.
	 *
	 * @param {number} previousColumns Previous column count.
	 * @param {number} newColumns      New column count.
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
			const widths = getRedistributedColumnWidths( innerBlocks, 100 - newColumnWidth );

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
			innerBlocks = dropRight( innerBlocks, previousColumns - newColumns );

			if ( hasExplicitWidths ) {
				// Redistribute as if block is already removed.
				const widths = getRedistributedColumnWidths( innerBlocks, 100 );

				innerBlocks = getMappedColumnWidths( innerBlocks, widths );
			}
		}

		replaceInnerBlocks( clientId, innerBlocks, false );
	},
} ) )( ColumnsEditContainer );

const ColumnsEdit = ( props ) => {
	const { clientId, name, isSelected, getStylesFromColorScheme } = props;
	// const { blockType, defaultPattern, hasInnerBlocks, patterns } = useSelect( ( select ) => {
	const { hasInnerBlocks } = useSelect( ( select ) => {
		const {
			__experimentalGetBlockPatterns,
			getBlockType,
			__experimentalGetDefaultBlockPattern,
		} = select( 'core/blocks' );

		return {
			blockType: getBlockType( name ),
			defaultPattern: __experimentalGetDefaultBlockPattern( name ),
			hasInnerBlocks: select( 'core/block-editor' ).getBlocks( clientId ).length > 0,
			patterns: __experimentalGetBlockPatterns( name ),
		};
	}, [ clientId, name ] );

	// TODO: make sure if columns should reder placeholder if block is not selected
	if ( ! isSelected && ! hasInnerBlocks ) {
		return (
			<View style={ [
				getStylesFromColorScheme( styles.columnsPlaceholder, styles.columnsPlaceholderDark ),
				! hasInnerBlocks && { ...styles.marginVerticalDense, ...styles.marginHorizontalNone },
			] } />
		);
	}

	return (
		<ColumnsEditContainerWrapper { ...props } />
	);
};

export default compose( [
	withViewportMatch( { isSmallScreen: '< small', isLargeScreen: '>= large', isMediumScreen: '>= small' } ),
	withPreferredColorScheme,
] )( ColumnsEdit );
