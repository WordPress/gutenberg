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

			const { destroy } = initWaveformPlayer( element, {
				src,
				title,
				artist,
				image,
				onEnded: () => onEndedRef.current?.(),
			} );

			return destroy;
		},
		[ src, title, artist, image ]
	);

	return <div ref={ ref } className="wp-block-playlist__waveform-player" />;
}
