/**
 * External dependencies
 */
import clsx from 'clsx';
import '@arraypress/waveform-player/dist/waveform-player.css';

/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { initWaveformPlayer } from './waveform-utils';

/**
 * A reusable WaveformPlayer component for the block editor.
 *
 * Renders an audio waveform visualization with play/pause controls.
 * Automatically inherits colors from the parent block's text color.
 *
 * @param {Object}   props           - Component props.
 * @param {string}   props.src       - The audio file URL.
 * @param {string}   props.title     - The track title.
 * @param {string}   props.artist    - The artist name.
 * @param {string}   props.image     - The artwork image URL.
 * @param {string}   props.ariaLabel - Accessible label for the player.
 * @param {Function} props.onEnded   - Callback when the track finishes playing.
 * @param {string}   props.className - Additional CSS class names.
 * @return {Element} The WaveformPlayer element.
 */
export function WaveformPlayer( {
	src,
	title,
	artist,
	image,
	ariaLabel,
	onEnded,
	className,
} ) {
	const ref = useRefEffect(
		( element ) => {
			if ( ! src ) {
				return;
			}

			const { destroy } = initWaveformPlayer( element, {
				src,
				title,
				artist,
				image,
				onEnded,
			} );

			return destroy;
		},
		[ src, title, artist, image, onEnded ]
	);

	return (
		<div
			ref={ ref }
			className={ clsx(
				'wp-block-playlist__waveform-player',
				className
			) }
			aria-label={ ariaLabel }
		/>
	);
}
