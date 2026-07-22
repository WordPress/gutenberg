/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useLayoutEffect } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';

const SLIDE_BLOCK = 'core/slide';

/**
 * Returns the total slide count and the client ID of the currently-selected
 * slide for the given slider block.
 *
 * @param {string} clientId The slider block's client ID.
 * @return {Object} An object with `totalSlides` (number) and
 *                  `selectedSlideClientId` (string|null).
 */
function useSliderEditorState( clientId ) {
	return useSelect(
		( select ) => {
			const {
				getBlockOrder,
				getBlockName,
				getBlockParents,
				getBlockRootClientId,
				getSelectedBlockClientId,
			} = select( blockEditorStore );

			const totalSlides = getBlockOrder( clientId ).filter(
				( id ) => getBlockName( id ) === SLIDE_BLOCK
			).length;

			// Resolve the selected block back to a direct-child slide.
			const selectedBlockClientId = getSelectedBlockClientId();
			let selectedSlideClientId = null;

			if ( selectedBlockClientId ) {
				const name = getBlockName( selectedBlockClientId );
				const candidate =
					name === SLIDE_BLOCK
						? selectedBlockClientId
						: getBlockParents( selectedBlockClientId, true ).find(
								( id ) => getBlockName( id ) === SLIDE_BLOCK
						  );

				if (
					candidate &&
					getBlockRootClientId( candidate ) === clientId
				) {
					selectedSlideClientId = candidate;
				}
			}

			return { totalSlides, selectedSlideClientId };
		},
		[ clientId ]
	);
}

/**
 * Smoothly scrolls the selected slide into view within the track element.
 *
 * @param {Object}      trackRef              A ref object attached to the scroll container.
 * @param {string|null} selectedSlideClientId The client ID of the active slide, or null.
 */
function useScrollToSelectedSlide( trackRef, selectedSlideClientId ) {
	useLayoutEffect( () => {
		if ( ! selectedSlideClientId || ! trackRef.current ) {
			return;
		}
		trackRef.current
			.querySelector( `[data-block="${ selectedSlideClientId }"]` )
			?.scrollIntoView( {
				behavior: 'smooth',
				inline: 'start',
				block: 'nearest',
			} );
	}, [ selectedSlideClientId, trackRef ] );
}

export { useSliderEditorState, useScrollToSelectedSlide };
