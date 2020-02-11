export const IMAGE_BACKGROUND_TYPE = 'image';
export const VIDEO_BACKGROUND_TYPE = 'video';
export const COVER_MIN_HEIGHT = 50;
export function backgroundImageStyles( url ) {
	return url ? { backgroundImage: `url(${ url })` } : {};
}

export function dimRatioToClass( ratio ) {
	return ratio === 0 || ratio === 50 || ! ratio
		? null
		: 'has-background-dim-' + 10 * Math.round( ratio / 10 );
}
