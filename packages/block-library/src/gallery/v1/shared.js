export const pickRelevantMediaFiles = ( image, sizeSlug = 'large' ) => {
	const imageProps = Object.fromEntries(
		Object.entries( image ?? {} ).filter( ( [ key ] ) =>
			[ 'alt', 'id', 'link', 'caption' ].includes( key )
		)
	);

	imageProps.url =
		image?.sizes?.[ sizeSlug ]?.url ||
		image?.media_details?.sizes?.[ sizeSlug ]?.source_url ||
		image?.url;
	const fullUrl =
		image?.sizes?.full?.url ||
		image?.media_details?.sizes?.full?.source_url;
	if ( fullUrl ) {
		imageProps.fullUrl = fullUrl;
	}
	return imageProps;
};
