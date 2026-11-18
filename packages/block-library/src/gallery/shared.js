import { getUpdatedLinkTargetSettings } from '../image/utils';
import { getHrefAndDestination } from './utils';

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

/**
 * Returns the image attributes for a gallery aspect ratio.
 *
 * @param {string} aspectRatio The gallery aspect ratio.
 * @return {Object} The `aspectRatio` and `scale` attributes.
 */
export function getAspectRatioAttributes( aspectRatio ) {
	const hasAspectRatio = !! aspectRatio && aspectRatio !== 'auto';
	return {
		aspectRatio: hasAspectRatio ? aspectRatio : undefined,
		scale: hasAspectRatio ? 'cover' : undefined,
	};
}

/**
 * Returns the attributes that apply the gallery settings to an added image.
 *
 * @param {Object} gallery    The gallery attributes, with the resolved `linkTo`.
 * @param {Object} attributes The image block attributes.
 * @param {Object} media      The image attachment.
 * @return {Object} The attributes to set on the image block.
 */
export function getImageAttributes( gallery, attributes, media ) {
	// An image transformed from an image block keeps its own link target.
	const linkTargetAttributes =
		attributes.linkTarget || attributes.rel
			? { linkTarget: attributes.linkTarget, rel: attributes.rel }
			: getUpdatedLinkTargetSettings( gallery.linkTarget, gallery );

	return {
		...pickRelevantMediaFiles( media, gallery.sizeSlug ),
		...getHrefAndDestination(
			media,
			gallery.linkTo,
			attributes.linkDestination
		),
		...linkTargetAttributes,
		className: attributes.className || undefined,
		sizeSlug: gallery.sizeSlug,
		caption:
			attributes.caption.length > 0
				? attributes.caption
				: media.caption?.raw,
		alt: attributes.alt || media.alt_text,
		...getAspectRatioAttributes( gallery.aspectRatio ),
	};
}
