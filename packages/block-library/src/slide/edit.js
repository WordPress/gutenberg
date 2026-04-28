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

function SlideEdit( { clientId, isSelected } ) {
	const { blockIndex, hasInnerBlocksSelected, trackHasSelectedInnerBlock } =
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
					trackHasSelectedInnerBlock: hasSelectedInnerBlock(
						trackClientId,
						true
					),
				};
			},
			[ clientId ]
		);

	// Show this slide if it is selected, has selected inner blocks,
	// or is the first slide and nothing else in the track is selected.
	const isSelectedSlide =
		isSelected ||
		hasInnerBlocksSelected ||
		( blockIndex === 0 && ! trackHasSelectedInnerBlock );

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
