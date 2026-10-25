export function defaultColumnsNumber( imageCount ) {
	return imageCount ? Math.min( 3, imageCount ) : 3;
}

/**
 * Whether a value is a plain object (and not an array).
 *
 * @param {*} value The value to check.
 * @return {boolean} Whether the value is a plain object.
 */
export function isObject( value ) {
	return !! value && typeof value === 'object' && ! Array.isArray( value );
}

/**
 * Whether the Gallery should use its default Flex layout behavior.
 *
 * Gallery blocks created before layout variations existed do not have an
 * explicit layout attribute. Treat missing and malformed layout data as Flex
 * so existing galleries keep their current appearance.
 *
 * @param {*} layout The Gallery layout attribute.
 * @return {boolean} Whether the Gallery uses its Flex layout.
 */
export function isGalleryFlexLayout( layout ) {
	const layoutType = isObject( layout ) ? layout.type : undefined;

	return (
		typeof layoutType !== 'string' ||
		layoutType === '' ||
		layoutType === 'flex'
	);
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
