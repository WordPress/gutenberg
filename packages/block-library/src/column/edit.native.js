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
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './editor.scss';
import ColumnsPreview from './column-preview';
import { getColumnWidths } from '../columns/utils';

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

	const columnWidths = Object.values(
		getColumnWidths( columns, columnCount )
	);

	const columnSum = columnWidths.reduce( ( acc, curr ) => acc + curr );

	const hasWidth = Number.isFinite( attributes.width );

	const percentageRatio = attributes.width / columnSum;

	const y = columnWidths
		.map(
			( aw ) =>
				( aw / columnSum ) *
				( 16 + parentWidth - columnWidths.length * 2 * 8 )
		)
		.filter( ( z ) => z < 32 );

	const newParentWidth = parentWidth - y.length * 32;

	const columnWidth = Math.floor(
		percentageRatio * ( 16 + parentWidth - columnWidths.length * 2 * 8 )
	);

	const newColumnWidth =
		columnWidth < 32
			? 32
			: Math.floor(
					percentageRatio *
						( 16 + newParentWidth - columnWidths.length * 2 * 8 )
			  );

	const x = hasWidth && { width: newColumnWidth };

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
					x,
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
					x,
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
