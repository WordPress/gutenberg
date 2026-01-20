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

	const {
		blockIndex,
		hasInnerBlocksSelected,
		sliderHasSelectedBlock,
		isSliderSelected,
	} = useSelect(
		( select ) => {
			const {
				getBlockRootClientId,
				getBlockIndex,
				isBlockSelected,
				hasSelectedInnerBlock,
			} = select( blockEditorStore );

			// Get the slider-track parent, then slider grandparent
			const trackClientId = getBlockRootClientId( clientId );
			const _sliderClientId = getBlockRootClientId( trackClientId );

			return {
				blockIndex: getBlockIndex( clientId ),
				hasInnerBlocksSelected: hasSelectedInnerBlock( clientId, true ),
				sliderHasSelectedBlock: hasSelectedInnerBlock(
					_sliderClientId,
					true
				),
				sliderClientId: _sliderClientId,
				isSliderSelected: isBlockSelected( _sliderClientId ),
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
		// Show if this is the active slide and slider itself is selected (no specific slide selected)
		if (
			blockIndex === activeSlideIndex &&
			isSliderSelected &&
			! sliderHasSelectedBlock
		) {
			return true;
		}
		// Show if this is the active slide and nothing in slider is selected
		if ( blockIndex === activeSlideIndex && ! sliderHasSelectedBlock ) {
			return true;
		}
		return false;
	}, [
		isSelected,
		hasInnerBlocksSelected,
		blockIndex,
		activeSlideIndex,
		isSliderSelected,
		sliderHasSelectedBlock,
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
