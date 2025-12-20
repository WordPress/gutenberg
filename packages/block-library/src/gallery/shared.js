export function defaultColumnsNumber( imageCount ) {
	return imageCount ? Math.min( 3, imageCount ) : 3;
}

export const pickRelevantMediaFiles = ( image, sizeSlug = 'large' ) => {
	const imageProps = Object.fromEntries(
		Object.entries( image ?? {} ).filter( ( [ key ] ) =>
			[ 'alt', 'id', 'link' ].includes( key )
		)
	);

	imageProps.url =
		image?.sizes?.[ sizeSlug ]?.url ||
		image?.media_details?.sizes?.[ sizeSlug ]?.source_url ||
		image?.url ||
		image?.source_url;
	const fullUrl =
		image?.sizes?.full?.url ||
		image?.media_details?.sizes?.full?.source_url;
	if ( fullUrl ) {
		imageProps.fullUrl = fullUrl;
	}
	return imageProps;
};
