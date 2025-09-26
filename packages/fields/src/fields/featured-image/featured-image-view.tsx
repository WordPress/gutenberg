/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { DataViewRenderFieldProps } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { BasePost } from '../../types';

export const FeaturedImageView = ( {
	item,
	config,
}: DataViewRenderFieldProps< BasePost > ) => {
	const mediaId = item.featured_media;

	const media = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );
			return mediaId
				? getEntityRecord( 'postType', 'attachment', mediaId )
				: null;
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
				srcSet={
					media?.media_details?.sizes
						? Object.values( media.media_details.sizes )
								.map(
									( size: any ) =>
										`${ size.source_url } ${ size.width }w`
								)
								.join( ', ' )
						: undefined
				}
				sizes={ config?.sizes || '100vw' }
			/>
		);
	}

	return <span className="fields-controls__featured-image-placeholder" />;
};
