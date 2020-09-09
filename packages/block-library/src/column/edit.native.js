/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';
import {
	InnerBlocks,
	BlockControls,
	BlockVerticalAlignmentToolbar,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	PanelBody,
	RangeControl,
	FooterMessageControl,
	ALIGNMENT_BREAKPOINTS,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './editor.scss';
import ColumnsPreview from './column-preview';
import { getColumnWidths } from '../columns/utils';

const MIN_WIDTH = 32;
const MARGIN = 8;

function ColumnEdit( {
	attributes,
	setAttributes,
	hasChildren,
	isSelected,
	getStylesFromColorScheme,
	isParentSelected,
	contentStyle,
	columns,
	columnCount,
	selectedColumnIndex,
	parentAlignment,
	parentWidth,
} ) {
	const { verticalAlignment } = attributes;

	const updateAlignment = ( alignment ) => {
		setAttributes( { verticalAlignment: alignment } );
	};

	useEffect( () => {
		if ( ! verticalAlignment && parentAlignment ) {
			updateAlignment( parentAlignment );
		}
	}, [] );

	const onWidthChange = ( width ) => {
		setAttributes( {
			width,
		} );
	};

	const getContainerWidth = ( containerWidth ) => {
		return 2 * MARGIN + containerWidth - columnWidths.length * 2 * MARGIN;
	};

	const hasWidth = Number.isFinite( attributes.width );

	const columnWidths = Object.values(
		getColumnWidths( columns, columnCount )
	);

	const columnWidthsSum = columnWidths.reduce(
		( acc, curr ) => acc + curr,
		0
	);

	const percentageRatio = attributes.width / columnWidthsSum;

	const minPercentageRatio = MIN_WIDTH / getContainerWidth( parentWidth );

	const columnWidthsPerRatio = columnWidths.map(
		( columnWidth ) =>
			( columnWidth / columnWidthsSum ) * getContainerWidth( parentWidth )
	);

	const filteredColumnWidthsPerRatio = columnWidthsPerRatio.filter(
		( columnWidthPerRatio ) => columnWidthPerRatio < MIN_WIDTH
	);

	const columnsRatio = columnWidths.map(
		( columnWidth ) => columnWidth / columnWidthsSum
	);

	const largeColumnsWidthsSum = columnsRatio
		.map( ( ratio, index ) => {
			if ( ratio > minPercentageRatio ) {
				return columnWidths[ index ];
			}
			return 0;
		} )
		.reduce( ( acc, curr ) => acc + curr, 0 );

	const newParentWidth =
		parentWidth - filteredColumnWidthsPerRatio.length * MIN_WIDTH;

	const columnWidth = Math.floor(
		percentageRatio * getContainerWidth( parentWidth )
	);

	const newColumnWidth =
		columnWidth < MIN_WIDTH
			? MIN_WIDTH
			: Math.floor(
					( attributes.width / largeColumnsWidthsSum ) *
						getContainerWidth( newParentWidth )
			  );

	const finalWidth = parentWidth > ALIGNMENT_BREAKPOINTS.medium &&
		hasWidth && { width: newColumnWidth };

	if ( ! isSelected && ! hasChildren ) {
		return (
			<View
				style={ [
					! isParentSelected &&
						getStylesFromColorScheme(
							styles.columnPlaceholder,
							styles.columnPlaceholderDark
						),
					contentStyle,
					styles.columnPlaceholderNotSelected,
					finalWidth,
				] }
			/>
		);
	}

	return (
		<>
			<BlockControls>
				<BlockVerticalAlignmentToolbar
					onChange={ updateAlignment }
					value={ verticalAlignment }
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Column settings' ) }>
					<RangeControl
						label={ __( 'Width' ) }
						min={ 1 }
						max={ 100 }
						value={ columnWidths[ selectedColumnIndex ] }
						onChange={ onWidthChange }
						toFixed={ 1 }
						rangePreview={
							<ColumnsPreview
								columnWidths={ columnWidths }
								selectedColumnIndex={ selectedColumnIndex }
							/>
						}
					/>
				</PanelBody>
				<PanelBody>
					<FooterMessageControl
						label={ __(
							'Note: Column layout may vary between themes and screen sizes'
						) }
					/>
				</PanelBody>
			</InspectorControls>
			<View
				style={ [
					contentStyle,
					isSelected && hasChildren && styles.innerBlocksBottomSpace,
					finalWidth,
				] }
			>
				<InnerBlocks
					renderAppender={
						isSelected && InnerBlocks.ButtonBlockAppender
					}
				/>
			</View>
		</>
	);
}

function ColumnEditWrapper( props ) {
	const { verticalAlignment } = props.attributes;

	const getVerticalAlignmentRemap = ( alignment ) => {
		if ( ! alignment ) return styles.flexBase;
		return {
			...styles.flexBase,
			...styles[ `is-vertically-aligned-${ alignment }` ],
		};
	};

	return (
		<View style={ getVerticalAlignmentRemap( verticalAlignment ) }>
			<ColumnEdit { ...props } />
		</View>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const {
			getBlockCount,
			getBlockRootClientId,
			getSelectedBlockClientId,
			getBlocks,
			getBlockOrder,
			getBlockAttributes,
		} = select( 'core/block-editor' );

		const selectedBlockClientId = getSelectedBlockClientId();
		const isSelected = selectedBlockClientId === clientId;

		const parentId = getBlockRootClientId( clientId );
		const hasChildren = !! getBlockCount( clientId );
		const isParentSelected =
			selectedBlockClientId && selectedBlockClientId === parentId;

		const blockOrder = getBlockOrder( parentId );

		const selectedColumnIndex = blockOrder.indexOf( clientId );
		const columnCount = getBlockCount( parentId );
		const columns = getBlocks( parentId );

		const parentAlignment = getBlockAttributes( parentId )
			?.verticalAlignment;

		return {
			hasChildren,
			isParentSelected,
			isSelected,
			selectedColumnIndex,
			columns,
			columnCount,
			parentAlignment,
		};
	} ),
	withPreferredColorScheme,
] )( ColumnEditWrapper );
