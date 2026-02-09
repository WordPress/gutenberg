/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Hook to fetch the featured image for an entity record.
 *
 * @param {Object} entityRecord - The entity record containing featured_media reference
 * @return {string|null} The featured image URL or null
 */
export function useFeaturedImage( entityRecord ) {
	return useSelect(
		( select ) => {
			// Only post-type entities have featured_media
			// Taxonomies and other entities won't have this property
			if ( ! entityRecord?.featured_media ) {
				return null;
			}

			// Use string literal to avoid circular dependency with @wordpress/core-data
			// eslint-disable-next-line @wordpress/data-no-store-string-literals
			const { getEntityRecord } = select( 'core' );

			// Get the media entity to fetch the image URL
			const media = getEntityRecord(
				'postType',
				'attachment',
				entityRecord.featured_media
			);

			// Return the thumbnail or medium size URL, fallback to source_url
			return (
				media?.media_details?.sizes?.thumbnail?.source_url ||
				media?.media_details?.sizes?.medium?.source_url ||
				media?.source_url ||
				null
			);
		},
		[ entityRecord?.featured_media ]
	);
}
