/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useEvent, useRefEffect } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { initWaveformPlayer } from './waveform-utils';

const EMPTY_ARTIST_PLACEHOLDER = '\u00a0';

/**
 * Update a live waveform player's metadata elements in place.
 *
 * The title element always exists, so the title is updated in place. The
 * subtitle element is seeded during editor player creation, so it can be
 * updated in place and hidden when the track has no artist. The artwork
 * element only exists when the track had an image when the player was created,
 * so its value is updated in place here; adding or removing an image (which
 * creates or tears down that element) is instead handled by recreating the
 * player, keyed on the `hasImage` dependency.
 *
 * The library's only metadata API is `loadTrack()`, which re-fetches and
 * re-decodes the audio and regenerates the waveform (resetting playback), so
 * it's unsuitable for live metadata edits. We instead write to the title,
 * subtitle, and artwork elements directly, which is what `loadTrack()` itself
 * does internally for these fields.
 *
 * @param {Object} instance        - The waveform player instance.
 * @param {Object} metadata        - The track metadata.
 * @param {string} metadata.title  - The track title.
 * @param {string} metadata.artist - The artist name.
 * @param {string} metadata.image  - The artwork image URL.
 */
function updatePlayerMetadata( instance, { title, artist, image } ) {
	if ( instance.titleEl ) {
		instance.titleEl.textContent = title ?? '';
	}
	if ( instance.subtitleEl ) {
		instance.subtitleEl.textContent = artist ?? '';
		instance.subtitleEl.style.display = artist ? '' : 'none';
	}
	if ( instance.artworkEl && image ) {
		instance.artworkEl.src = image;
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
 * @param {string}   props.waveformStyle - Waveform style (bars, mirror, line, blocks, dots, seekbar).
 * @param {Function} props.onEnded       - Callback when the track finishes playing.
 * @return {Element} The WaveformPlayer element.
 */
export function WaveformPlayer( {
	src,
	title,
	artist,
	image,
	waveformStyle,
	onEnded,
} ) {
	// Store onEnded in a stable callback so it doesn't need to be a useRefEffect dependency.
	// The callback changes reference on every render (its dependency chain
	// includes an unstable array), which would cause useRefEffect to destroy
	// and recreate the entire player on every re-render, making it disappear
	// during editor resizes.
	const onEndedEvent = useEvent( onEnded );
	const metadataRef = useRef( { title, artist, image } );
	const playerRef = useRef();

	// The artwork element only exists when an image was present when the
	// player was created. Recreate the player when one is added or removed so
	// that element is created or torn down; value changes to an existing
	// element are applied in place below.
	const hasImage = !! image;

	// Keep the freshest metadata available to init() (which runs on a
	// deferred timeout) and update the live player in place when metadata
	// changes. Updating in place avoids destroying and recreating the
	// player, which would flash it on every keystroke while editing a
	// track's title or artist.
	useEffect( () => {
		metadataRef.current = { title, artist, image };

		const instance = playerRef.current?.instance;
		if ( instance ) {
			updatePlayerMetadata( instance, { title, artist, image } );
		}
	}, [ title, artist, image ] );

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
				const player = initWaveformPlayer( element, {
					src,
					...metadataRef.current,
					waveformStyle,
					artist:
						metadataRef.current.artist || EMPTY_ARTIST_PLACEHOLDER,
					onEnded: () => onEndedEvent?.(),
				} );
				playerRef.current = player;
				updatePlayerMetadata( player.instance, metadataRef.current );
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
		[ onEndedEvent, src, waveformStyle, hasImage ]
	);

	return <div ref={ ref } className="wp-block-playlist__waveform-player" />;
}
