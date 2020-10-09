/**
 * External dependencies
 */
import { View, Dimensions } from 'react-native';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import {
	compose,
	withPreferredColorScheme,
	useResizeObserver,
} from '@wordpress/compose';
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
	parentBlockAlignment,
} ) {
	const { align } = attributes;
	const [ resizeObserver, sizes ] = useResizeObserver();
	const { width } = sizes || { width: 0 };
	const { alignments } = WIDE_ALIGNMENTS;
	const screenWidth = Math.floor( Dimensions.get( 'window' ).width );
	const isFullWidth = align === alignments.full;
	const isParentFullWidth = parentBlockAlignment === alignments.full;
	const isEqualWidth = width === screenWidth;

	const renderAppender = useCallback(
		() => (
			<View
				style={ [
					( isEqualWidth || isFullWidth || isParentFullWidth ) &&
						( hasInnerBlocks
							? styles.groupAppender
							: styles.wideGroupAppender ),
				] }
			>
				<InnerBlocks.ButtonBlockAppender />
			</View>
		),
		[ align, hasInnerBlocks, width ]
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
			{ resizeObserver }
			<InnerBlocks
				renderAppender={ isSelected && renderAppender }
				parentWidth={ isFullWidth ? screenWidth : width }
			/>
		</View>
	);
}

export default compose( [
	withColors( 'backgroundColor' ),
	withSelect( ( select, { clientId } ) => {
		const {
			getBlockRootClientId,
			getSelectedBlockClientId,
			getBlockAttributes,
		} = select( 'core/block-editor' );

		const { getBlock } = select( 'core/block-editor' );

		const block = getBlock( clientId );

		const selectedBlockClientId = getSelectedBlockClientId();
		const isSelected = selectedBlockClientId === clientId;

		const parentId = getBlockRootClientId( clientId );
		const parentBlockAlignment = getBlockAttributes( parentId )?.align;

		return {
			isSelected,
			hasInnerBlocks: !! ( block && block.innerBlocks.length ),
			parentBlockAlignment,
		};
	} ),
	withPreferredColorScheme,
] )( GroupEdit );
