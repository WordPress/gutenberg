/**
 * WordPress dependencies
 */
import { FilterControl } from '@wordpress/components';

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
export function backgroundImageStyles( url ) {
	return url ? { backgroundImage: `url(${ url })` } : {};
}

export const CSS_UNITS = [
	{ value: 'px', label: 'px', default: 430 },
	{ value: 'em', label: 'em', default: 20 },
	{ value: 'rem', label: 'rem', default: 20 },
	{ value: 'vw', label: 'vw', default: 20 },
	{ value: 'vh', label: 'vh', default: 50 },
];

export function dimRatioToClass( ratio ) {
	return ratio === 0 || ratio === 50 || ! ratio
		? null
		: 'has-background-dim-' + 10 * Math.round( ratio / 10 );
}

export function attributesFromMedia( setAttributes ) {
	return ( media ) => {
		if ( ! media || ! media.url ) {
			setAttributes( { url: undefined, id: undefined } );
			return;
		}
		let mediaType;
		// for media selections originated from a file upload.
		if ( media.media_type ) {
			if ( media.media_type === IMAGE_BACKGROUND_TYPE ) {
				mediaType = IMAGE_BACKGROUND_TYPE;
			} else {
				// only images and videos are accepted so if the media_type is not an image we can assume it is a video.
				// Videos contain the media type of 'file' in the object returned from the rest api.
				mediaType = VIDEO_BACKGROUND_TYPE;
			}
		} else {
			// for media selections originated from existing files in the media library.
			if (
				media.type !== IMAGE_BACKGROUND_TYPE &&
				media.type !== VIDEO_BACKGROUND_TYPE
			) {
				return;
			}
			mediaType = media.type;
		}

		setAttributes( {
			url: media.url,
			id: media.id,
			backgroundType: mediaType,
			...( mediaType === VIDEO_BACKGROUND_TYPE
				? { focalPoint: undefined, hasParallax: undefined }
				: {} ),
		} );
	};
}

export function getPositionClassName( contentPosition ) {
	if ( contentPosition === undefined ) return '';

	return POSITION_CLASSNAMES[ contentPosition ];
}

export function isContentPositionCenter( contentPosition ) {
	return (
		! contentPosition ||
		contentPosition === 'center center' ||
		contentPosition === 'center'
	);
}

export function BackgroundMedia( {
	backgroundFilter,
	backgroundType,
	focalPoint,
	hasParallax,
	videoRef,
	url,
} ) {
	const isVideoBackground = backgroundType === VIDEO_BACKGROUND_TYPE;
	const isImageBackground = backgroundType === IMAGE_BACKGROUND_TYPE;

	const backgroundStyles = isImageBackground
		? backgroundImageStyles( url )
		: {};

	if ( backgroundFilter ) {
		backgroundStyles.filter = FilterControl.createStyles(
			backgroundFilter
		).filter;
	}

	if ( isImageBackground && focalPoint && ! hasParallax ) {
		backgroundStyles.backgroundPosition = `${ focalPoint.x * 100 }% ${
			focalPoint.y * 100
		}%`;
	}

	const contentMarkup = isVideoBackground ? (
		<video
			autoPlay
			className="wp-block-cover__video-background"
			loop
			muted
			playsInline
			ref={ videoRef }
			src={ url }
			style={ backgroundStyles }
		/>
	) : (
		<div
			className="wp-block-cover__image-background-content"
			style={ backgroundStyles }
		/>
	);

	return (
		<div className="wp-block-cover__image-background">
			{ contentMarkup }
		</div>
	);
}
