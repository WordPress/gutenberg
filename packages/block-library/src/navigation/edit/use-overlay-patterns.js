import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { NAVIGATION_OVERLAY_TEMPLATE_PART_AREA } from '../constants';

const EMPTY_ARRAY = [];

/**
 * Whether template parts are registered patterns here (Gutenberg plugin).
 *
 * @return {boolean} True when overlays are patterns of the overlay area.
 */
export function areTemplatePartsPatterns() {
	return !! window?.__wpTemplatePartsAsPatterns;
}

/**
 * The registered patterns of the `navigation-overlay` area, normalized to
 * the shape the overlay selector expects from template parts: a `slug`
 * (the last segment of `theme/part/slug`) and a rendered title.
 *
 * @return {{overlays: Object[], isResolving: boolean, hasResolved: boolean}} Overlays.
 */
export default function useOverlayPatterns() {
	return useSelect( ( select ) => {
		const { getBlockPatterns, isResolving, hasFinishedResolution } =
			select( coreStore );
		const patterns = getBlockPatterns();
		const overlays = patterns?.length
			? patterns
					.filter(
						( pattern ) =>
							pattern.area ===
								NAVIGATION_OVERLAY_TEMPLATE_PART_AREA &&
							pattern.name.includes( '/part/' )
					)
					.map( ( pattern ) => ( {
						pattern,
						name: pattern.name,
						slug: pattern.name.split( '/part/' )[ 1 ],
						title: { rendered: pattern.title },
					} ) )
			: EMPTY_ARRAY;
		return {
			overlays,
			isResolving: isResolving( 'getBlockPatterns' ),
			hasResolved: hasFinishedResolution( 'getBlockPatterns' ),
		};
	}, [] );
}
