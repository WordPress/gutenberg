import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { NAVIGATION_OVERLAY_TEMPLATE_PART_AREA } from '../constants';

const EMPTY_ARRAY = [];
const USER_PATTERNS_QUERY = { per_page: -1 };

/**
 * The overlays a Navigation block can use, each with a `slug` (the value of
 * the `overlay` attribute) and a rendered title: the registered patterns of
 * the `navigation-overlay` area (`theme/part/slug`, `pattern` and `name`
 * set) and the user patterns filed under that area (`id` and `isUser` set).
 *
 * @return {{overlays: Object[], isResolving: boolean, hasResolved: boolean}} Overlays.
 */
export default function useOverlayPatterns() {
	return useSelect( ( select ) => {
		const {
			getBlockPatterns,
			getEntityRecords,
			isResolving,
			hasFinishedResolution,
		} = select( coreStore );

		const patterns = getBlockPatterns();
		const registered = patterns?.length
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

		const records = getEntityRecords(
			'postType',
			'wp_block',
			USER_PATTERNS_QUERY
		);
		const user = records?.length
			? records
					.filter(
						( record ) =>
							record.meta?.wp_pattern_area ===
								NAVIGATION_OVERLAY_TEMPLATE_PART_AREA &&
							! record.meta?.wp_pattern_slug
					)
					.map( ( record ) => ( {
						id: record.id,
						slug: record.slug,
						title: {
							rendered:
								record.title?.rendered ??
								record.title?.raw ??
								'',
						},
						isUser: true,
					} ) )
			: EMPTY_ARRAY;

		const userPatternsArgs = [
			'postType',
			'wp_block',
			USER_PATTERNS_QUERY,
		];
		return {
			overlays:
				registered.length || user.length
					? [ ...registered, ...user ]
					: EMPTY_ARRAY,
			isResolving:
				isResolving( 'getBlockPatterns' ) ||
				isResolving( 'getEntityRecords', userPatternsArgs ),
			hasResolved:
				hasFinishedResolution( 'getBlockPatterns' ) &&
				hasFinishedResolution( 'getEntityRecords', userPatternsArgs ),
		};
	}, [] );
}
