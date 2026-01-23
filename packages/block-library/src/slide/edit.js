/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	InnerBlocks,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

function SlideEdit( { clientId, isSelected, context } ) {
	const activeSlideIndex = context[ 'core/slider-activeSlideIndex' ] ?? 0;

	const { blockIndex, hasInnerBlocksSelected, trackHasSelectedSlide } =
		useSelect(
			( select ) => {
				const {
					getBlockRootClientId,
					getBlockIndex,
					hasSelectedInnerBlock,
				} = select( blockEditorStore );

				// Get the slider-track parent
				const trackClientId = getBlockRootClientId( clientId );

				return {
					blockIndex: getBlockIndex( clientId ),
					hasInnerBlocksSelected: hasSelectedInnerBlock(
						clientId,
						true
					),
					// Check if any slide in the track is selected (not controls)
					trackHasSelectedSlide: hasSelectedInnerBlock(
						trackClientId,
						true
					),
				};
			},
			[ clientId ]
		);

	// Determine if this slide should be visible
	const isSelectedSlide = useMemo( () => {
		// Show if this slide or its inner blocks are selected
		if ( isSelected || hasInnerBlocksSelected ) {
			return true;
		}
		// Show if this is the active slide and no other slide is selected
		if ( blockIndex === activeSlideIndex && ! trackHasSelectedSlide ) {
			return true;
		}
		return false;
	}, [
		isSelected,
		hasInnerBlocksSelected,
		blockIndex,
		activeSlideIndex,
		trackHasSelectedSlide,
	] );

	const blockProps = useBlockProps( {
		className: clsx( 'wp-block-slide', {
			'is-selected-slide': isSelectedSlide,
		} ),
		hidden: ! isSelectedSlide,
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		renderAppender: isSelectedSlide
			? InnerBlocks.ButtonBlockAppender
			: false,
	} );

	return <div { ...innerBlocksProps } />;
}

export default SlideEdit;
