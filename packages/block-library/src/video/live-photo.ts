/**
 * Video block attributes that decide how a video plays.
 */
type PlaybackAttributes = {
	controls?: boolean;
	loop?: boolean;
	autoplay?: boolean;
	muted?: boolean;
	playsInline?: boolean;
};

/**
 * The playback attributes of a Live photo: a muted, looping, inline video with
 * no controls that does *not* autoplay.
 */
export const LIVE_PHOTO_ATTRIBUTES = {
	controls: false,
	loop: true,
	autoplay: false,
	muted: true,
	playsInline: true,
} as const;

/**
 * Whether a set of Video block attributes describes a Live photo.
 *
 * A HEIC/HEIF image sequence (an Apple Live Photo or Android burst) uploaded
 * through the editor is converted to a video and presented with
 * LIVE_PHOTO_ATTRIBUTES, so it rests on its still frame and plays only while
 * pointed at, focused, or tapped. The absence of autoplay is what makes it
 * look like a photo rather than an animation.
 *
 * @param attributes Video block attributes.
 * @return Whether the attributes describe a Live photo.
 */
export function isLivePhoto( attributes: PlaybackAttributes = {} ): boolean {
	const { controls, loop, autoplay, muted, playsInline } = attributes;
	return ! controls && !! loop && ! autoplay && !! muted && !! playsInline;
}
