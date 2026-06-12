/**
 * WordPress dependencies
 */
import {
	BlockControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { chevronLeft, chevronRight, plus, trash } from '@wordpress/icons';

const SLIDE_BLOCK_NAME = 'core/slide';
const PARAGRAPH_BLOCK_NAME = 'core/paragraph';

function createSlideBlock() {
	return createBlock( SLIDE_BLOCK_NAME, {}, [
		createBlock( PARAGRAPH_BLOCK_NAME, {
			placeholder: __( 'Type / to choose a block' ),
		} ),
	] );
}

export function getSlideSelectionClientId( slide ) {
	return slide?.innerBlocks?.[ 0 ]?.clientId || slide?.clientId;
}

function getSelectedSlideClientId( select, sliderClientId, slides ) {
	const {
		getBlockName,
		getBlockParentsByBlockName,
		getBlockRootClientId,
		getSelectedBlockClientId,
	} = select( blockEditorStore );
	const selectedBlockClientId = getSelectedBlockClientId();

	if ( ! selectedBlockClientId ) {
		return null;
	}

	if (
		getBlockName( selectedBlockClientId ) === SLIDE_BLOCK_NAME &&
		getBlockRootClientId( selectedBlockClientId ) === sliderClientId
	) {
		return selectedBlockClientId;
	}

	const slideParents = getBlockParentsByBlockName(
		selectedBlockClientId,
		SLIDE_BLOCK_NAME
	);
	const slideClientId = slideParents.find(
		( parentClientId ) =>
			getBlockRootClientId( parentClientId ) === sliderClientId
	);

	if (
		slideClientId &&
		slides.some( ( slide ) => slide.clientId === slideClientId )
	) {
		return slideClientId;
	}

	return null;
}

export function useSliderSlides( sliderClientId ) {
	return useSelect(
		( select ) => {
			if ( ! sliderClientId ) {
				return {
					activeSlideIndex: 0,
					slides: [],
				};
			}

			const { getBlockAttributes, getBlocks } =
				select( blockEditorStore );
			const slides = getBlocks( sliderClientId ).filter(
				( block ) => block.name === SLIDE_BLOCK_NAME
			);
			const selectedSlideClientId = getSelectedSlideClientId(
				select,
				sliderClientId,
				slides
			);
			const selectedSlideIndex = slides.findIndex(
				( slide ) => slide.clientId === selectedSlideClientId
			);
			const sliderAttributes = getBlockAttributes( sliderClientId );
			const fallbackIndex = sliderAttributes?.editorActiveSlideIndex ?? 0;
			const activeSlideIndex =
				selectedSlideIndex >= 0 ? selectedSlideIndex : fallbackIndex;

			return {
				activeSlideIndex: Math.max(
					0,
					Math.min( activeSlideIndex, slides.length - 1 )
				),
				slides,
			};
		},
		[ sliderClientId ]
	);
}

export default function SliderControls( { sliderClientId } ) {
	const { activeSlideIndex, slides } = useSliderSlides( sliderClientId );
	const {
		insertBlock,
		removeBlock,
		selectBlock,
		updateBlockAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	} = useDispatch( blockEditorStore );
	const slideCount = slides.length;
	const activeSlideClientId = slides[ activeSlideIndex ]?.clientId;
	const canSelectPrevious = activeSlideIndex > 0;
	const canSelectNext = activeSlideIndex < slideCount - 1;

	if ( ! sliderClientId ) {
		return null;
	}

	const setEditorActiveSlideIndex = ( nextIndex ) => {
		__unstableMarkNextChangeAsNotPersistent();
		updateBlockAttributes( sliderClientId, {
			editorActiveSlideIndex: nextIndex,
		} );
	};

	const selectSlide = ( nextIndex ) => {
		const clampedIndex = Math.max(
			0,
			Math.min( nextIndex, slideCount - 1 )
		);
		const nextSlide = slides[ clampedIndex ];

		if ( ! nextSlide ) {
			return;
		}

		setEditorActiveSlideIndex( clampedIndex );
		selectBlock( nextSlide.clientId );
	};

	const addSlide = () => {
		const newSlide = createSlideBlock();
		const insertionIndex =
			slideCount > 0 ? activeSlideIndex + 1 : undefined;

		insertBlock( newSlide, insertionIndex, sliderClientId, false );
		setEditorActiveSlideIndex(
			insertionIndex === undefined ? 0 : insertionIndex
		);
		selectBlock( getSlideSelectionClientId( newSlide ) );
	};

	const removeSlide = () => {
		if ( ! activeSlideClientId || slideCount <= 1 ) {
			return;
		}

		const nextIndex =
			activeSlideIndex >= slideCount - 1
				? activeSlideIndex - 1
				: activeSlideIndex;
		const nextSlide =
			activeSlideIndex >= slideCount - 1
				? slides[ activeSlideIndex - 1 ]
				: slides[ activeSlideIndex + 1 ];
		const nextSlideClientId =
			getSlideSelectionClientId( nextSlide ) || sliderClientId;

		setEditorActiveSlideIndex( nextIndex );
		removeBlock( activeSlideClientId, false );
		selectBlock( nextSlideClientId );
	};

	return (
		<BlockControls group="other" __experimentalShareWithChildBlocks>
			<ToolbarGroup>
				<ToolbarButton
					icon={ chevronLeft }
					label={ __( 'Previous slide' ) }
					onClick={ () => selectSlide( activeSlideIndex - 1 ) }
					disabled={ ! canSelectPrevious }
				/>
				<ToolbarButton
					icon={ chevronRight }
					label={ __( 'Next slide' ) }
					onClick={ () => selectSlide( activeSlideIndex + 1 ) }
					disabled={ ! canSelectNext }
				/>
				<ToolbarButton
					icon={ plus }
					label={ __( 'Add slide' ) }
					onClick={ addSlide }
				/>
				<ToolbarButton
					icon={ trash }
					label={ __( 'Remove slide' ) }
					onClick={ removeSlide }
					disabled={ slideCount <= 1 || ! activeSlideClientId }
				/>
			</ToolbarGroup>
		</BlockControls>
	);
}
