/**
 * External dependencies
 */
import { View } from 'react-native';
import { findIndex } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { InnerBlocks } from '@wordpress/block-editor';
import { useCallback } from '@wordpress/element';
import { WIDE_ALIGNMENTS } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './editor.scss';

function GroupEdit( {
	attributes,
	hasInnerBlocks,
	isInnerBlockSelected,
	isSelected,
	isLastInnerBlock,
	getStylesFromColorScheme,
	mergedStyle,
} ) {
	const { align } = attributes;
	const isFullWidth = align === WIDE_ALIGNMENTS.alignments.full;

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
		<View
			style={ [
				isSelected && hasInnerBlocks && styles.innerBlocks,
				isSelected &&
					! hasInnerBlocks &&
					isFullWidth &&
					styles.fullWidth,
				mergedStyle,
				isSelected &&
					hasInnerBlocks &&
					mergedStyle?.backgroundColor && {
						paddingBottom:
							styles.hasBackgroundAppender.paddingBottom,
					},
				hasInnerBlocks &&
					isInnerBlockSelected &&
					isLastInnerBlock &&
					mergedStyle?.backgroundColor && {
						paddingBottom: 0,
					},
			] }
		>
			<InnerBlocks renderAppender={ isSelected && renderAppender } />
		</View>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const {
			getBlock,
			hasSelectedInnerBlock,
			getSelectedBlockClientId,
		} = select( 'core/block-editor' );

		const block = getBlock( clientId );
		const hasInnerBlocks = !! ( block && block.innerBlocks.length );
		const isInnerBlockSelected =
			hasInnerBlocks && hasSelectedInnerBlock( clientId );
		let isLastInnerBlock = hasInnerBlocks;

		if ( hasInnerBlocks && isInnerBlockSelected ) {
			const { innerBlocks } = block;
			const selectedBlockClientId = getSelectedBlockClientId();
			const totalInnerBlocks = innerBlocks.length - 1;
			const selectedInnerBlockIndex = findIndex(
				innerBlocks,
				( innerBlock ) => innerBlock.clientId === selectedBlockClientId
			);
			isLastInnerBlock = totalInnerBlocks === selectedInnerBlockIndex;
		}

		return {
			hasInnerBlocks,
			isInnerBlockSelected,
			isLastInnerBlock,
		};
	} ),
	withPreferredColorScheme,
] )( GroupEdit );
