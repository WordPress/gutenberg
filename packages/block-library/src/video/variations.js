import { __ } from '@wordpress/i18n';
import { video as videoIcon } from '@wordpress/icons';

/**
 * Whether a set of Video block attributes describes a GIF variation.
 * Uses an explicit `isGif` flag instead of inferring from autoplay/loop/controls
 * attributes so manually setting those options does not reclassify a regular video.
 *
 * @param {Object}  attributes       Video block attributes.
 * @param {boolean} [attributes.isGif] Whether the block is a GIF variation.
 *
 * @return {boolean} Whether the attributes describe a GIF-behaving video.
 */
export const isGifVariation = ( { isGif } = {} ) => !! isGif;

const variations = [
	{
		name: 'video',
		title: __( 'Video' ),
		description: __(
			'A video with customizable playback and interaction controls.'
		),
		icon: videoIcon,
		attributes: { controls: true, isGif: false },
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
			isGif: true,
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
