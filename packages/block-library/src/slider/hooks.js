/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useLayoutEffect } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';

const SLIDE_BLOCK = 'core/slide';
const PAGINATION_BLOCK = 'core/slider-pagination';

/**
 * Returns the child blocks of the slider, including the ordered list of all
 * children, the total slide count, and the client ID of the currently-selected slide.
 *
 * @param {string} clientId The slider block's client ID.
 * @return {Object} An object with `childBlocks` (array of {clientId, name}),
 *                  `totalSlides` (number), and `selectedSlideClientId` (string|null).
 */
function useSliderChildren( clientId ) {
	return useSelect(
		( select ) => {
			const {
				getBlocks,
				getBlockOrder,
				getBlockName,
				getBlockParents,
				getBlockRootClientId,
				getSelectedBlockClientId,
			} = select( blockEditorStore );

			const orderedClientIds = getBlockOrder( clientId );
			const childBlocks = orderedClientIds.map( ( id ) => ( {
				clientId: id,
				name: getBlockName( id ),
			} ) );

			const totalSlides = getBlocks( clientId ).filter(
				( b ) => b.name === SLIDE_BLOCK
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

			return { childBlocks, totalSlides, selectedSlideClientId };
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

/**
 * Ensures the pagination block is never positioned between slide blocks.
 * If pagination is detected between the first and last slide, it is
 * automatically moved to whichever end (start or end) is closer.
 * Placing pagination before or after all slides is always allowed.
 *
 * @param {string} clientId The slider block's client ID.
 */
function usePaginationPlacement( clientId ) {
	const { moveBlocksToPosition } = useDispatch( blockEditorStore );

	// Compute correction data inside useSelect so we get stable primitives
	// that only change when the actual block order changes — not on every render.
	const { paginationClientId, needsCorrection, destinationIndex } = useSelect(
		( select ) => {
			const { getBlockOrder, getBlockName } = select( blockEditorStore );
			const orderedIds = getBlockOrder( clientId );

			let foundPaginationId = null;
			let paginationPos = -1;
			const slidePositions = [];

			for ( let i = 0; i < orderedIds.length; i++ ) {
				const name = getBlockName( orderedIds[ i ] );
				if ( name === PAGINATION_BLOCK ) {
					foundPaginationId = orderedIds[ i ];
					paginationPos = i;
				} else if ( name === SLIDE_BLOCK ) {
					slidePositions.push( i );
				}
			}

			if ( ! foundPaginationId || slidePositions.length < 2 ) {
				return {
					paginationClientId: null,
					needsCorrection: false,
					destinationIndex: 0,
				};
			}

			const firstSlide = slidePositions[ 0 ];
			const lastSlide = slidePositions[ slidePositions.length - 1 ];
			const isBetweenSlides =
				paginationPos > firstSlide && paginationPos < lastSlide;

			if ( ! isBetweenSlides ) {
				return {
					paginationClientId: foundPaginationId,
					needsCorrection: false,
					destinationIndex: 0,
				};
			}

			const moveToStart =
				paginationPos - firstSlide <= lastSlide - paginationPos;

			return {
				paginationClientId: foundPaginationId,
				needsCorrection: true,
				destinationIndex: moveToStart ? 0 : orderedIds.length,
			};
		},
		[ clientId ]
	);

	useEffect( () => {
		if ( ! needsCorrection || ! paginationClientId ) {
			return;
		}
		moveBlocksToPosition(
			[ paginationClientId ],
			clientId,
			clientId,
			destinationIndex
		);
	}, [
		needsCorrection,
		paginationClientId,
		destinationIndex,
		clientId,
		moveBlocksToPosition,
	] );
}

export { useSliderChildren, useScrollToSelectedSlide, usePaginationPlacement };
