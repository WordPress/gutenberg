/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useEvent, useRefEffect } from '@wordpress/compose';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { initWaveformPlayer, updateSeekControlLabel } from './waveform-utils';

/**
 * Update the metadata of a WaveformPlayer element to reflect current props.
 *
 * `loadTrack()` owns full track swaps, but it also resets the audio element.
 * This keeps same-source metadata edits lightweight in the editor.
 *
 * @param {Object} instance          - The waveform player instance.
 * @param {Object} metadata          - The track metadata.
 * @param {string} metadata.title    - The track title.
 * @param {string} metadata.artist   - The artist name.
 * @param {string} metadata.image    - The artwork image URL.
 * @param {string} metadata.imageAlt - The artwork image alt text.
 */
function updatePlayerMetadata( instance, { title, artist, image, imageAlt } ) {
	if ( instance.titleEl ) {
		instance.titleEl.textContent = title ?? '';
	}
	updateSeekControlLabel( instance, title || __( 'Seek' ) );

	if ( typeof instance.syncArtist === 'function' ) {
		instance.syncArtist( artist || '' );
	} else if ( instance.artistEl ) {
		instance.artistEl.textContent = artist ?? '';
		instance.artistEl.style.display = artist ? '' : 'none';
	}

	if ( typeof instance.syncArtwork === 'function' ) {
		instance.syncArtwork( image || null, imageAlt || '' );
	} else if ( instance.artworkEl && image ) {
		instance.artworkEl.src = image;
		instance.artworkEl.alt = imageAlt || '';
	}
}

/**
 * A reusable WaveformPlayer component for the block editor.
 *
 * Renders an audio waveform visualization with play/pause controls.
 * Automatically inherits colors from the parent block's text color.
 *
 * @param {Object}   props               - Component props.
 * @param {string}   props.src           - The audio file URL.
 * @param {string}   props.title         - The track title.
 * @param {string}   props.artist        - The artist name.
 * @param {string}   props.image         - The artwork image URL.
 * @param {string}   props.imageAlt      - The artwork image alt text.
 * @param {string}   props.waveformStyle - Waveform style (bars, mirror, line, blocks, dots, seekbar).
 * @param {Function} props.onEnded       - Callback when the track finishes playing.
 * @return {Element} The WaveformPlayer element.
 */
export function WaveformPlayer( {
	src,
	title,
	artist,
	image,
	imageAlt,
	waveformStyle,
	onEnded,
} ) {
	// Store onEnded in a stable callback so it doesn't need to be a useRefEffect dependency.
	// The callback changes reference on every render (its dependency chain
	// includes an unstable array), which would cause useRefEffect to destroy
	// and recreate the entire player on every re-render, making it disappear
	// during editor resizes.
	const onEndedEvent = useEvent( onEnded );

	// Ref for the WaveformPlayer instance
	const playerRef = useRef();

	// WaveformPlayer needs an audio source on init, but the source may change
	// throughout its lifetime.
	const hasSrc = !! src;

	// Combined props ref for `initWaveformPlayer`, which is called
	// asynchronously after this component mounts.
	const metadataRef = useRef( { src, title, artist, image, imageAlt } );
	useEffect( () => {
		metadataRef.current = { src, title, artist, image, imageAlt };
	}, [ src, title, artist, image, imageAlt ] );

	const ref = useRefEffect(
		( element ) => {
			if ( ! hasSrc ) {
				return;
			}

			let cancelled = false;
			let playerDestroy;

			function init() {
				if ( cancelled ) {
					return;
				}
				const player = initWaveformPlayer( element, {
					src: metadataRef.current.src,
					title: metadataRef.current.title,
					artist: metadataRef.current.artist,
					image: metadataRef.current.image,
					imageAlt: metadataRef.current.imageAlt,
					waveformStyle,
					labels: {
						seek: __( 'Seek' ),
						/* translators: %1$s: current audio time, %2$s: total audio duration. */
						seekValueText: _x(
							'%1$s of %2$s',
							'audio current time of total duration'
						),
					},
					onEnded: () => onEndedEvent?.(),
				} );
				playerRef.current = player;
				const { destroy } = player;
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
				playerRef.current = undefined;
				playerDestroy?.();
			};
		},
		[ onEndedEvent, hasSrc, waveformStyle ]
	);

	useEffect( () => {
		if ( playerRef.current?.instance ) {
			const instance = playerRef.current?.instance;
			if ( instance ) {
				updatePlayerMetadata( instance, {
					title,
					artist,
					image,
					imageAlt,
				} );
			}
		}
	}, [ title, artist, image, imageAlt ] );

	useEffect( () => {
		if ( src && playerRef.current?.instance ) {
			const wasPlaying = playerRef.current.instance.isPlaying;
			const promise = playerRef.current.instance.loadTrack(
				src,
				metadataRef.current.title,
				metadataRef.current.artist,
				{
					artwork: metadataRef.current.image,
					artworkAlt: metadataRef.current.imageAlt,
				}
			);
			if ( ! wasPlaying ) {
				promise.then( () => {
					playerRef.current.instance.pause();
				} );
			}
		}
	}, [ src ] );

	return <div ref={ ref } className="wp-block-playlist__waveform-player" />;
}
