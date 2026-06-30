/**
 * WordPress dependencies
 */
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

const variations = [
	{
		name: 'video',
		title: __( 'Video' ),
		description: __(
			'Embed a video from your media library or upload a new one.'
		),
		icon: videoIcon,
		attributes: { controls: true },
		isActive: ( blockAttributes ) => ! isGifVariation( blockAttributes ),
		// Not offered in the inserter; used to label a regular video and to
		// switch a GIF back to a standard video.
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
];

export default variations;
