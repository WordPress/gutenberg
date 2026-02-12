/**
 * External dependencies
 */
import clsx from 'clsx';
import WaveformPlayerLib from '@arraypress/waveform-player';
import '@arraypress/waveform-player/dist/waveform-player.css';

/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import {
	getWaveformColors,
	createWaveformContainer,
	styleSvgIcons,
} from './waveform-utils';

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
	// Initialize WaveformPlayer when the element mounts or track changes.
	// useRefEffect ensures styles are applied before initialization
	// (important for iframed editor).
	const ref = useRefEffect(
		( element ) => {
			if ( ! src ) {
				return;
			}

			// Get colors for styling (CSS is applied when useRefEffect runs).
			const { textColor, waveformColor, progressColor } =
				getWaveformColors( element );

			// Create waveform container with correct colors.
			const container = createWaveformContainer( {
				url: src,
				title,
				artist,
				artwork: image,
				waveformColor,
				progressColor,
				buttonColor: textColor,
			} );
			element.appendChild( container );

			// Create WaveformPlayer instance.
			const instance = new WaveformPlayerLib( container );

			// Apply contrasting color to SVG icons once WaveformPlayer is ready.
			const handleReady = () => {
				container.removeEventListener(
					'waveformplayer:ready',
					handleReady
				);
				styleSvgIcons( container, textColor );
			};
			container.addEventListener( 'waveformplayer:ready', handleReady );

			// Handle track end event.
			const handleEnded = () => {
				if ( onEnded ) {
					onEnded();
				}
			};
			container.addEventListener( 'waveformplayer:ended', handleEnded );

			return () => {
				container.removeEventListener(
					'waveformplayer:ready',
					handleReady
				);
				container.removeEventListener(
					'waveformplayer:ended',
					handleEnded
				);
				instance.destroy();
			};
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
