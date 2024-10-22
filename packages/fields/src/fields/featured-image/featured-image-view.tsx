/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';
import type { DataViewRenderFieldProps } from '@wordpress/dataviews';

export const FeaturedImageView = ( {
	item,
}: DataViewRenderFieldProps< BasePost > ) => {
	const mediaId = item.featured_media;

	const media = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );
			return mediaId ? getEntityRecord( 'root', 'media', mediaId ) : null;
		},
		[ mediaId ]
	);
	const url = media?.source_url;

	if ( url ) {
		return (
			<img
				className="fields-controls__featured-image-image"
				src={ url }
				alt=""
			/>
		);
	}

	return <span className="fields-controls__featured-image-placeholder" />;
};
