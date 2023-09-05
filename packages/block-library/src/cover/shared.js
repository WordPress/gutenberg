/**
 * External dependencies
 */
import { FastAverageColor } from 'fast-average-color';
import { colord } from 'colord';

/**
 * WordPress dependencies
 */
import { getBlobTypeByURL, isBlobURL } from '@wordpress/blob';
import { applyFilters } from '@wordpress/hooks';

const POSITION_CLASSNAMES = {
	'top left': 'is-position-top-left',
	'top center': 'is-position-top-center',
	'top right': 'is-position-top-right',
	'center left': 'is-position-center-left',
	'center center': 'is-position-center-center',
	center: 'is-position-center-center',
	'center right': 'is-position-center-right',
	'bottom left': 'is-position-bottom-left',
	'bottom center': 'is-position-bottom-center',
	'bottom right': 'is-position-bottom-right',
};

export const IMAGE_BACKGROUND_TYPE = 'image';
export const VIDEO_BACKGROUND_TYPE = 'video';
export const COVER_MIN_HEIGHT = 50;
export const COVER_MAX_HEIGHT = 1000;
export const COVER_DEFAULT_HEIGHT = 300;
export const DEFAULT_FOCAL_POINT = { x: 0.5, y: 0.5 };
export const ALLOWED_MEDIA_TYPES = [ 'image', 'video' ];

export function mediaPosition( { x, y } = DEFAULT_FOCAL_POINT ) {
	return `${ Math.round( x * 100 ) }% ${ Math.round( y * 100 ) }%`;
}

export function dimRatioToClass( ratio ) {
	return ratio === 50 || ! ratio === undefined
		? null
		: 'has-background-dim-' + 10 * Math.round( ratio / 10 );
}

export function attributesFromMedia( setAttributes, dimRatio ) {
	return ( media, isDark ) => {
		if ( ! media || ! media.url ) {
			setAttributes( { url: undefined, id: undefined, isDark } );
			return;
		}

		if ( isBlobURL( media.url ) ) {
			media.type = getBlobTypeByURL( media.url );
		}

		let mediaType;
		// For media selections originated from a file upload.
		if ( media.media_type ) {
			if ( media.media_type === IMAGE_BACKGROUND_TYPE ) {
				mediaType = IMAGE_BACKGROUND_TYPE;
			} else {
				// only images and videos are accepted so if the media_type is not an image we can assume it is a video.
				// Videos contain the media type of 'file' in the object returned from the rest api.
				mediaType = VIDEO_BACKGROUND_TYPE;
			}
		} else {
			// For media selections originated from existing files in the media library.
			if (
				media.type !== IMAGE_BACKGROUND_TYPE &&
				media.type !== VIDEO_BACKGROUND_TYPE
			) {
				return;
			}
			mediaType = media.type;
		}

		setAttributes( {
			isDark,
			dimRatio: dimRatio === 100 ? 50 : dimRatio,
			url: media.url,
			id: media.id,
			alt: media?.alt,
			backgroundType: mediaType,
			focalPoint: undefined,
			...( mediaType === VIDEO_BACKGROUND_TYPE
				? { hasParallax: undefined }
				: {} ),
		} );
	};
}

/**
 * Checks of the contentPosition is the center (default) position.
 *
 * @param {string} contentPosition The current content position.
 * @return {boolean} Whether the contentPosition is center.
 */
export function isContentPositionCenter( contentPosition ) {
	return (
		! contentPosition ||
		contentPosition === 'center center' ||
		contentPosition === 'center'
	);
}

/**
 * Retrieves the className for the current contentPosition.
 * The default position (center) will not have a className.
 *
 * @param {string} contentPosition The current content position.
 * @return {string} The className assigned to the contentPosition.
 */
export function getPositionClassName( contentPosition ) {
	/*
	 * Only render a className if the contentPosition is not center (the default).
	 */
	if ( isContentPositionCenter( contentPosition ) ) return '';

	return POSITION_CLASSNAMES[ contentPosition ];
}

/**
 * Performs a Porter Duff composite source over operation on two rgba colors.
 *
 * @see https://www.w3.org/TR/compositing-1/#porterduffcompositingoperators_srcover
 *
 * @param {import('colord').RgbaColor} source Source color.
 * @param {import('colord').RgbaColor} dest   Destination color.
 * @return {import('colord').RgbaColor} Composite color.
 */
function compositeSourceOver( source, dest ) {
	return {
		r: source.r * source.a + dest.r * dest.a * ( 1 - source.a ),
		g: source.g * source.a + dest.g * dest.a * ( 1 - source.a ),
		b: source.b * source.a + dest.b * dest.a * ( 1 - source.a ),
		a: source.a + dest.a * ( 1 - source.a ),
	};
}

function retrieveFastAverageColor() {
	if ( ! retrieveFastAverageColor.fastAverageColor ) {
		retrieveFastAverageColor.fastAverageColor = new FastAverageColor();
	}
	return retrieveFastAverageColor.fastAverageColor;
}

/**
 * This method evaluates if the cover block's background is dark or not and this boolean
 * can then be applied to the relevant attribute to help ensure that text is visible by default.
 * This needs to be recalculated in all of the following Cover block scenarios:
 * - When an overlay image is added, changed or removed
 * - When the featured image is selected as the overlay image, or removed from the overlay
 * - When the overlay color is changed
 * - When the overlay color is removed
 * - When the dimRatio is changed
 *
 * See the comments below for more details about which aspects take priority when
 * calculating the relative darkness of the Cover.
 *
 * @param {string} url
 * @param {number} dimRatio
 * @param {string} overlayColor
 * @return {Promise<boolean>} True if cover should be considered to be dark.
 */
export async function getCoverIsDark( url, dimRatio = 50, overlayColor ) {
	const overlay = colord( overlayColor )
		.alpha( dimRatio / 100 )
		.toRgb();

	if ( url ) {
		try {
			const imgCrossOrigin = applyFilters(
				'media.crossOrigin',
				undefined,
				url
			);
			const {
				value: [ r, g, b, a ],
			} = await retrieveFastAverageColor().getColorAsync( url, {
				// Previously the default color was white, but that changed
				// in v6.0.0 so it has to be manually set now.
				defaultColor: [ 255, 255, 255, 255 ],
				// Errors that come up don't reject the promise, so error
				// logging has to be silenced with this option.
				silent: process.env.NODE_ENV === 'production',
				crossOrigin: imgCrossOrigin,
			} );
			// FAC uses 0-255 for alpha, but colord expects 0-1.
			const media = { r, g, b, a: a / 255 };
			const composite = compositeSourceOver( overlay, media );
			return colord( composite ).isDark();
		} catch ( error ) {
			// If there's an error, just assume the image is dark.
			return true;
		}
	}

	// Assume a white background because it isn't easy to get the actual
	// parent background color.
	const background = { r: 255, g: 255, b: 255, a: 1 };
	const composite = compositeSourceOver( overlay, background );
	return colord( composite ).isDark();
}
