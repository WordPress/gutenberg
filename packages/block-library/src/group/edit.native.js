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
import { WIDE_ALIGNMENTS, ALIGNMENT_BREAKPOINTS } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './editor.scss';

const MARGIN = 16;

function GroupEdit( {
	attributes,
	hasInnerBlocks,
	isSelected,
	getStylesFromColorScheme,
	isParentSelected,
	isDeepParentSelected,
	parentsOfParents,
	parentBlockAlignment,
} ) {
	const { align } = attributes;
	const [ resizeObserver, sizes ] = useResizeObserver();
	const { width } = sizes || { width: 0 };
	const { alignments } = WIDE_ALIGNMENTS;
	const isFullWidth = align === alignments.full;
	const isParentFullWidth = parentBlockAlignment === alignments.full;
	const { width: screenWidth } = Dimensions.get( 'window' );

	const renderAppender = useCallback(
		() => (
			<View
				style={ [
					width > ALIGNMENT_BREAKPOINTS.mobile &&
						isFullWidth &&
						hasInnerBlocks &&
						styles.fullWidthAppender,
				] }
			>
				<InnerBlocks.ButtonBlockAppender />
			</View>
		),
		[ align, hasInnerBlocks, width ]
	);

	if ( ! isSelected && ! hasInnerBlocks ) {
		const shouldHaveMargin = isParentSelected && parentsOfParents;
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
					( isFullWidth || isParentFullWidth ) &&
						screenWidth < ALIGNMENT_BREAKPOINTS.mobile &&
						! isParentSelected &&
						! isDeepParentSelected && {
							marginLeft:
								! isParentSelected || shouldHaveMargin
									? -MARGIN
									: 0,
							maxWidth:
								screenWidth +
								( shouldHaveMargin ? -MARGIN : 0 ),
							width:
								screenWidth +
								( shouldHaveMargin ? -MARGIN : 0 ),
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
			] }
		>
			{ resizeObserver }
			<InnerBlocks renderAppender={ isSelected && renderAppender } />
		</View>
	);
}

export default compose( [
	withColors( 'backgroundColor' ),
	withSelect( ( select, { clientId } ) => {
		const {
			getBlockRootClientId,
			getSelectedBlockClientId,
			getBlockParents,
			__unstableGetBlockWithoutInnerBlocks,
		} = select( 'core/block-editor' );

		const { getBlock } = select( 'core/block-editor' );

		const block = getBlock( clientId );

		const selectedBlockClientId = getSelectedBlockClientId();
		const isSelected = selectedBlockClientId === clientId;

		const parentId = getBlockRootClientId( clientId );

		const isParentSelected =
			selectedBlockClientId && selectedBlockClientId === parentId;

		const parentsOfParents = !! getBlockParents( parentId ).length;

		const getDeepParentSelected = (
			columnParentId,
			isSelectedResult = false
		) => {
			if ( getBlockParents( columnParentId ).length === 0 ) {
				return isSelectedResult;
			}

			const newParentId = getBlockRootClientId( columnParentId );
			const isSelectedFinalResult =
				isSelectedResult ||
				( selectedBlockClientId &&
					selectedBlockClientId === newParentId );

			return getDeepParentSelected( newParentId, isSelectedFinalResult );
		};

		const isDeepParentSelected = getDeepParentSelected( parentId );

		const parents = getBlockParents( clientId, true );
		const hasParents = !! parents.length;
		const parentBlock = hasParents
			? __unstableGetBlockWithoutInnerBlocks( parents[ 0 ] )
			: {};
		const { align: parentBlockAlignment } = parentBlock?.attributes || {};

		return {
			isParentSelected,
			isSelected,
			parentId,
			isDeepParentSelected,
			parentsOfParents,
			parentBlockAlignment,
			hasInnerBlocks: !! ( block && block.innerBlocks.length ),
		};
	} ),
	withPreferredColorScheme,
] )( GroupEdit );
