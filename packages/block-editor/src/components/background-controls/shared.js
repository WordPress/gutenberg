export const IMAGE_BACKGROUND_TYPE = 'image';
export const VIDEO_BACKGROUND_TYPE = 'video';
export const COVER_MIN_HEIGHT = 50;
export const ALLOWED_MEDIA_TYPES = [ IMAGE_BACKGROUND_TYPE, VIDEO_BACKGROUND_TYPE ];

export function backgroundImageStyles( url ) {
	return url ?
		{ backgroundImage: `url(${ url })` } :
		{};
}

export function dimRatioToClass( ratio ) {
	return ( ratio === 0 || ratio === 50 ) ?
		null :
		'has-background-dim-' + ( 10 * Math.round( ratio / 10 ) );
}
