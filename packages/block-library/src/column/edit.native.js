/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import {
	InnerBlocks,
	BlockControls,
	BlockVerticalAlignmentToolbar,
	InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody, RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './editor.scss';

function ColumnEdit( {
	attributes: { verticalAlignment, width },
	setAttributes,
	hasChildren,
	isSelected,
	getStylesFromColorScheme,
	isParentSelected,
	contentStyle,
	parentWidth,
} ) {
	const hasWidth = Number.isFinite( width );

	const updateAlignment = ( alignment ) => {
		setAttributes( { verticalAlignment: alignment } );
	};

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
					hasWidth && {
						width: parentWidth * ( width / 100 ),
						maxWidth: parentWidth,
						minWidth: 36,
					},
				] }
			></View>
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
						label={ __( 'Percentage width' ) }
						min={ 1 }
						max={ 100 }
						step={ 0.1 }
						value={ width || 50 }
						onChange={ ( nextWidth ) => {
							setAttributes( {
								width: Number( nextWidth.toFixed( 1 ) ),
							} );
						} }
						toFixed={ 1 }
					/>
				</PanelBody>
			</InspectorControls>
			<View
				style={ [
					contentStyle,
					isSelected && hasChildren && styles.innerBlocksBottomSpace,
					hasWidth && {
						width: parentWidth * ( width / 100 ),
						maxWidth: parentWidth,
						minWidth: 36,
					},
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
		} = select( 'core/block-editor' );

		const selectedBlockClientId = getSelectedBlockClientId();
		const isSelected = selectedBlockClientId === clientId;

		const parentId = getBlockRootClientId( clientId );
		const hasChildren = !! getBlockCount( clientId );

		const isParentSelected =
			selectedBlockClientId && selectedBlockClientId === parentId;

		return {
			hasChildren,
			isParentSelected,
			isSelected,
		};
	} ),
	withPreferredColorScheme,
] )( ColumnEditWrapper );
