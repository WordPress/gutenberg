/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { useEvent, useRefEffect } from '@wordpress/compose';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	initWaveformPlayer,
	refreshWaveformPlayerColors,
	updateSeekControlLabel,
} from './waveform-utils';

const EMPTY_ARTIST_PLACEHOLDER = '\u00a0';

/**
 * Update the DOM of a WaveformPlayer element to reflect current props.
 *
 * The @arraypress/waveform-player library currently offers no public method to
 * do this, hence the workaround. Context:
 *
 * - The title and artist elements are guaranteed to exist based on
 *   `initWaveformPlayer` and implementation details of the library.
 *
 * - The image/artwork element may not exist if the track loaded upon init had
 *   no defined artwork, but in these cases we create the entire WaveformPlayer
 *   instance. See `hasImage`.
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
	if ( instance.artistEl ) {
		instance.artistEl.textContent = artist ?? '';
		instance.artistEl.style.display = artist ? '' : 'none';
	}
	if ( instance.artworkEl && image ) {
		instance.artworkEl.src = image;
		instance.artworkEl.alt = imageAlt || '';
	}
}

/**
 * A reusable WaveformPlayer component for the block editor.
 *
 * Renders an audio waveform with play/pause and prev/shuffle/repeat/next
 * controls. Automatically inherits colors from the parent block's text color.
 *
 * @param {Object}   props                 - Component props.
 * @param {string}   props.src             - The audio file URL.
 * @param {string}   props.title           - The track title.
 * @param {string}   props.artist          - The artist name.
 * @param {string}   props.image           - The artwork image URL.
 * @param {string}   props.imageAlt        - The artwork image alt text.
 * @param {string}   props.waveformStyle   - Waveform style (bars, mirror, etc).
 * @param {Function} props.onEnded         - Callback when the track finishes playing.
 * @param {Function} props.onPrev          - Callback for previous track.
 * @param {Function} props.onNext          - Callback for next track.
 * @param {Function} props.onShuffleToggle - Callback for shuffle toggle.
 * @param {Function} props.onRepeatToggle  - Callback for repeat toggle.
 * @param {boolean}  props.isShuffled      - Whether shuffle is active.
 * @param {string}   props.repeatMode      - Current repeat mode.
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
	onPrev,
	onNext,
	onShuffleToggle,
	onRepeatToggle,
	isShuffled,
	repeatMode,
} ) {
	// Store onEnded in a stable callback so it doesn't need to be a useRefEffect dependency.
	// The callback changes reference on every render (its dependency chain
	// includes an unstable array), which would cause useRefEffect to destroy
	// and recreate the entire player on every re-render, making it disappear
	// during editor resizes.
	const onEndedEvent = useEvent( onEnded );
	const elementRef = useRef();
	const playerRef = useRef();

	// Due to how WaveformPlayer is implemented, the artwork element within the
	// player element only exists when an image was present when the player was
	// created. Recreate the player when one is added or removed so that
	// element is created or torn down.
	const hasImage = !! image;

	// WaveformPlayer needs an audio source on init, but the source may change
	// throughout its lifetime.
	const hasSrc = !! src;

	// Combined props ref for `initWaveformPlayer`, which is called
	// asynchronously after this component mounts.
	const metadataRef = useRef( { src, title, artist, image, imageAlt } );
	useEffect( () => {
		metadataRef.current = { src, title, artist, image, imageAlt };

		const instance = playerRef.current?.instance;
		if ( instance ) {
			updatePlayerMetadata( instance, {
				title,
				artist,
				image,
				imageAlt,
			} );
		}
	}, [ src, title, artist, image, imageAlt ] );

	// The block color controls update the parent figure's classes/styles, not
	// this player component's props. Refresh the canvas colors after each
	// editor render so the live player follows inherited color changes.
	useEffect( () => {
		if ( elementRef.current && playerRef.current ) {
			refreshWaveformPlayerColors(
				playerRef.current,
				elementRef.current
			);
		}
	} );

	// Wrap callbacks and state reads in stable event handlers so the player
	// isn't recreated when they change, while always seeing the latest value.
	const onPrevEvent = useEvent( () => onPrev?.() );
	const onNextEvent = useEvent( () => onNext?.() );
	const onShuffleToggleEvent = useEvent( () => onShuffleToggle?.() );
	const onRepeatToggleEvent = useEvent( ( nextMode ) =>
		onRepeatToggle?.( nextMode )
	);
	const getIsShuffled = useEvent( () => isShuffled );
	const getRepeatMode = useEvent( () => repeatMode );

	const ref = useRefEffect(
		( element ) => {
			elementRef.current = element;

			if ( ! hasSrc ) {
				return () => {
					elementRef.current = undefined;
				};
			}

			let cancelled = false;
			let playerDestroy;

			function init() {
				if ( cancelled ) {
					return;
				}

				const metadata = metadataRef.current;
				const player = initWaveformPlayer( element, {
					src,
					...metadata,
					waveformStyle,
					labels: {
						play: __( 'Play' ),
						pause: __( 'Pause' ),
						seek: __( 'Seek' ),
						/* translators: %1$s: current audio time, %2$s: total audio duration. */
						seekValueText: _x(
							'%1$s of %2$s',
							'audio current time of total duration'
						),
						previous: __( 'Previous track' ),
						next: __( 'Next track' ),
						shuffle: __( 'Shuffle' ),
						repeatOff: __( 'Repeat off' ),
						repeatAll: __( 'Repeat playlist' ),
						repeatOne: __( 'Repeat current track' ),
					},
					artist: metadata.artist || EMPTY_ARTIST_PLACEHOLDER,
					onEnded: onEndedEvent,
					onPrev: onPrevEvent,
					onNext: onNextEvent,
					onShuffleToggle: onShuffleToggleEvent,
					onRepeatToggle: onRepeatToggleEvent,
					isShuffled: getIsShuffled(),
					repeatMode: getRepeatMode(),
				} );
				playerRef.current = player;
				updatePlayerMetadata( player.instance, metadata );
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
				elementRef.current = undefined;
				playerDestroy?.();
			};
		},
		[
			onEndedEvent,
			onPrevEvent,
			onNextEvent,
			onShuffleToggleEvent,
			onRepeatToggleEvent,
			getIsShuffled,
			getRepeatMode,
			src,
			waveformStyle,
			hasImage,
		]
	);

	return (
		<div
			ref={ ref }
			className="wp-block-playlist__waveform-player"
			data-waveform-style={ waveformStyle || 'bars' }
		/>
	);
}
