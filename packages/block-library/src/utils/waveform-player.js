/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
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
 * @param {Object}   props         - Component props.
 * @param {string}   props.src     - The audio file URL.
 * @param {string}   props.title   - The track title.
 * @param {string}   props.artist  - The artist name.
 * @param {string}   props.image   - The artwork image URL.
 * @param {Function} props.onEnded - Callback when the track finishes playing.
 * @return {Element} The WaveformPlayer element.
 */
export function WaveformPlayer( { src, title, artist, image, onEnded } ) {
	// Store onEnded in a ref so it doesn't need to be a useRefEffect dependency.
	// The callback changes reference on every render (its dependency chain
	// includes an unstable array), which would cause useRefEffect to destroy
	// and recreate the entire player on every re-render, making it disappear
	// during editor resizes.
	const onEndedRef = useRef( onEnded );
	onEndedRef.current = onEnded;

	const ref = useRefEffect(
		( element ) => {
			if ( ! src ) {
				return;
			}

			let cancelled = false;
			let playerDestroy;

			function init() {
				if ( cancelled ) {
					return;
				}
				const { destroy } = initWaveformPlayer( element, {
					src,
					title,
					artist,
					image,
					onEnded: () => onEndedRef.current?.(),
				} );
				playerDestroy = destroy;
			}

			// Defer initialization so the element inherits the correct
			// text color, which is used to derive waveform colors. In the
			// editor iframe, theme styles (CSS custom properties) are
			// injected dynamically, so getComputedStyle may return the
			// default black on first render.
			// Using a requestAnimationFrame loop isn't sufficient to solve the issue.
			// TODO - find a better option than a setTimeout, so we're not relying on an arbitrary number.
			const timeoutId = setTimeout( init, 100 );

			return () => {
				cancelled = true;
				clearTimeout( timeoutId );
				playerDestroy?.();
			};
		},
		[ src, title, artist, image ]
	);

	return <div ref={ ref } className="wp-block-playlist__waveform-player" />;
}
