import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { NAVIGATION_OVERLAY_TEMPLATE_PART_AREA } from '../constants';

const EMPTY_ARRAY = [];

/**
 * The registered pattern name of an overlay: `theme/part/slug`. A value that
 * already is a pattern name is returned as is.
 *
 * @param {string} theme The active theme's stylesheet.
 * @param {string} slug  The overlay slug, as stored in the `overlay` attribute.
 * @return {string} The pattern name.
 */
export function getOverlayPatternName( theme, slug ) {
	return slug.includes( '/part/' ) ? slug : `${ theme }/part/${ slug }`;
}

/**
 * The registered patterns of the `navigation-overlay` area, normalized to a
 * `slug` (the last segment of `theme/part/slug`) and a rendered title.
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
