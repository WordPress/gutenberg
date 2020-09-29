/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { InnerBlocks, withColors } from '@wordpress/block-editor';
import { useCallback } from '@wordpress/element';
import { WIDE_ALIGNMENTS } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './editor.scss';

function GroupEdit( {
	attributes,
	hasInnerBlocks,
	isSelected,
	getStylesFromColorScheme,
} ) {
	const { align } = attributes;
	const { alignments } = WIDE_ALIGNMENTS;
	const isFullWidth = align === alignments.full;

	const renderAppender = useCallback(
		() => (
			<View
				style={ [
					isFullWidth && hasInnerBlocks && styles.fullWidthAppender,
				] }
			>
				<InnerBlocks.ButtonBlockAppender />
			</View>
		),
		[ align, hasInnerBlocks ]
	);

	if ( ! isSelected && ! hasInnerBlocks ) {
		return (
			<View
				style={ [
					getStylesFromColorScheme(
						styles.groupPlaceholder,
						styles.groupPlaceholderDark
					),
					! hasInnerBlocks && {
						...styles.marginVerticalDense,
						...styles.marginHorizontalNone,
					},
				] }
			/>
		);
	}

	return (
		<View style={ [ isSelected && hasInnerBlocks && styles.innerBlocks ] }>
			<InnerBlocks renderAppender={ isSelected && renderAppender } />
		</View>
	);
}

export default compose( [
	withColors( 'backgroundColor' ),
	withSelect( ( select, { clientId } ) => {
		const { getBlockRootClientId, getSelectedBlockClientId } = select(
			'core/block-editor'
		);

		const { getBlock } = select( 'core/block-editor' );

		const block = getBlock( clientId );

		const selectedBlockClientId = getSelectedBlockClientId();
		const isSelected = selectedBlockClientId === clientId;

		const parentId = getBlockRootClientId( clientId );

		const isParentSelected =
			selectedBlockClientId && selectedBlockClientId === parentId;

		return {
			isParentSelected,
			isSelected,
			parentId,
			hasInnerBlocks: !! ( block && block.innerBlocks.length ),
		};
	} ),
	withPreferredColorScheme,
] )( GroupEdit );
