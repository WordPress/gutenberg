import { __ } from '@wordpress/i18n';
import { video as videoIcon } from '@wordpress/icons';

/**
 * Whether a set of Video block attributes describes a GIF-behaving video: a
 * muted, looping, autoplaying, inline video with no controls. An animated GIF
 * uploaded through the editor is converted to a video and presented with these
 * attributes so it plays like the original GIF.
 *
 * @param {Object}  attributes             Video block attributes.
 * @param {boolean} attributes.controls    Whether playback controls are shown.
 * @param {boolean} attributes.loop        Whether the video loops.
 * @param {boolean} attributes.autoplay    Whether the video autoplays.
 * @param {boolean} attributes.muted       Whether the video is muted.
 * @param {boolean} attributes.playsInline Whether the video plays inline.
 *
 * @return {boolean} Whether the attributes describe a GIF-behaving video.
 */
export const isGifVariation = ( {
	controls,
	loop,
	autoplay,
	muted,
	playsInline,
} = {} ) => ! controls && !! loop && !! autoplay && !! muted && !! playsInline;

/**
 * Whether a set of Video block attributes describes a Live photo: a muted,
 * looping, inline video with no controls that does *not* autoplay. A HEIC/HEIF
 * image sequence (an Apple Live Photo or Android burst) uploaded through the
 * editor is converted to a video and presented with these attributes, so it
 * rests on its still frame and plays only while pointed at.
 *
 * The absence of autoplay is what separates this from the GIF variation: a GIF
 * is expected to be in motion, a Live photo is expected to look like a photo.
 *
 * @param {Object}  attributes             Video block attributes.
 * @param {boolean} attributes.controls    Whether playback controls are shown.
 * @param {boolean} attributes.loop        Whether the video loops.
 * @param {boolean} attributes.autoplay    Whether the video autoplays.
 * @param {boolean} attributes.muted       Whether the video is muted.
 * @param {boolean} attributes.playsInline Whether the video plays inline.
 *
 * @return {boolean} Whether the attributes describe a Live photo.
 */
export const isLivePhotoVariation = ( {
	controls,
	loop,
	autoplay,
	muted,
	playsInline,
} = {} ) => ! controls && !! loop && ! autoplay && !! muted && !! playsInline;

const variations = [
	{
		name: 'video',
		title: __( 'Video' ),
		description: __(
			'A video with customizable playback and interaction controls.'
		),
		icon: videoIcon,
		attributes: { controls: true },
		isActive: ( blockAttributes ) =>
			! isGifVariation( blockAttributes ) &&
			! isLivePhotoVariation( blockAttributes ),
		// Not offered in the inserter; used to label a regular video and to
		// switch a GIF or Live photo back to a standard video.
		scope: [ 'block', 'transform' ],
	},
	{
		name: 'gif',
		title: __( 'GIF' ),
		description: __(
			'A muted, looping video that plays automatically like an animated GIF.'
		),
		icon: videoIcon,
		keywords: [ __( 'animated' ), 'gif' ],
		attributes: {
			controls: false,
			loop: true,
			autoplay: true,
			muted: true,
			playsInline: true,
		},
		isActive: ( blockAttributes ) => isGifVariation( blockAttributes ),
		// Created by converting an uploaded GIF, not inserted directly.
		scope: [ 'block', 'transform' ],
	},
	{
		name: 'live-photo',
		title: __( 'Live photo' ),
		description: __(
			'A muted, looping video that rests on a still frame and plays on hover.'
		),
		icon: videoIcon,
		keywords: [ __( 'live photo' ), __( 'burst' ), __( 'motion' ) ],
		attributes: {
			controls: false,
			loop: true,
			autoplay: false,
			muted: true,
			playsInline: true,
		},
		isActive: ( blockAttributes ) =>
			isLivePhotoVariation( blockAttributes ),
		// Created by converting an uploaded image sequence, not inserted
		// directly.
		scope: [ 'block', 'transform' ],
	},
];

export default variations;
