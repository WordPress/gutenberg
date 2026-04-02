/**
 * WordPress dependencies
 */
import type { DataViewRenderFieldProps } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { BasePostWithEmbeddedFeaturedMedia } from '../../types';

export const FeaturedImageView = ( {
	item,
	config,
}: DataViewRenderFieldProps< BasePostWithEmbeddedFeaturedMedia > ) => {
	const media = item?._embedded?.[ 'wp:featuredmedia' ]?.[ 0 ];
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
