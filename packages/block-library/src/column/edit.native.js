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
} from '@wordpress/block-editor';
/**
 * Internal dependencies
 */
import styles from './editor.scss';

function ColumnEdit( {
	attributes,
	setAttributes,
	hasChildren,
	isSelected,
	getStylesFromColorScheme,
	isParentSelected,
	contentStyle,
} ) {
	const { verticalAlignment } = attributes;

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
			<View
				style={ [
					contentStyle,
					isSelected && hasChildren && styles.innerBlocksBottomSpace,
				] }
			>
				<InnerBlocks
					scrollEnabled={ false }
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
