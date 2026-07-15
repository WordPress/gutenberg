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
	applyWaveformPlayerStyles,
	initWaveformPlayer,
	setupPlayButtonArtwork,
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
 * @param {Object}  player                - The waveform player.
 * @param {Object}  metadata              - The track metadata.
 * @param {string}  metadata.title        - The track title.
 * @param {string}  metadata.artist       - The artist name.
 * @param {string}  metadata.image        - The track image URL.
 * @param {string}  metadata.imageAlt     - The track image alt text.
 * @param {boolean} showPlayButtonArtwork - Whether to show artwork on the play button.
 */
function updatePlayerMetadata(
	player,
	{ title, artist, image, imageAlt },
	showPlayButtonArtwork
) {
	const { instance, container } = player;
	const playerArtwork = showPlayButtonArtwork ? undefined : image;

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
		instance.syncArtwork(
			playerArtwork || null,
			playerArtwork ? imageAlt || '' : ''
		);
	} else if ( instance.artworkEl && playerArtwork ) {
		instance.artworkEl.src = playerArtwork;
		instance.artworkEl.alt = imageAlt || '';
	}

	if ( showPlayButtonArtwork ) {
		setupPlayButtonArtwork( container, image );
	}
}

/**
 * A reusable WaveformPlayer component for the block editor.
 *
 * Renders an audio waveform with play/pause. Automatically inherits colors
 * from the parent block's text color.
 *
 * @param {Object}   props                       - Component props.
 * @param {string}   props.src                   - The audio file URL.
 * @param {string}   props.title                 - The track title.
 * @param {string}   props.artist                - The artist name.
 * @param {string}   props.image                 - The artwork image URL.
 * @param {string}   props.imageAlt              - The artwork image alt text.
 * @param {string}   props.color                 - The waveform color.
 * @param {string}   props.gradient              - The waveform gradient.
 * @param {string}   props.backgroundColor       - The waveform background color.
 * @param {string}   props.backgroundGradient    - The waveform background gradient.
 * @param {string}   props.textColor             - The player text color.
 * @param {string}   props.waveformStyle         - Waveform style (bars, mirror, etc).
 * @param {Function} props.onEnded               - Callback when the track finishes playing.
 * @param {Function} props.onNextTrack           - Callback for the Media Session next-track action.
 * @param {Function} props.onPreviousTrack       - Callback for the Media Session previous-track action.
 * @param {Function} props.onPlayerChange        - Callback when the live player instance changes.
 * @param {boolean}  props.showPlayButtonArtwork - Whether to show artwork on the play button.
 * @return {Element} The WaveformPlayer element.
 */
export function WaveformPlayer( {
	src,
	title,
	artist,
	image,
	imageAlt,
	color,
	gradient,
	backgroundColor,
	backgroundGradient,
	textColor,
	waveformStyle,
	onEnded,
	onNextTrack,
	onPreviousTrack,
	onPlayerChange,
	showPlayButtonArtwork = false,
} ) {
	// Store onEnded in a stable callback so it doesn't need to be a useRefEffect dependency.
	// The callback changes reference on every render (its dependency chain
	// includes an unstable array), which would cause useRefEffect to destroy
	// and recreate the entire player on every re-render, making it disappear
	// during editor resizes.
	const onEndedEvent = useEvent( onEnded );
	const onNextTrackEvent = useEvent( onNextTrack );
	const onPreviousTrackEvent = useEvent( onPreviousTrack );
	const onPlayerChangeEvent = useEvent( ( playerInstance ) =>
		onPlayerChange?.( playerInstance )
	);
	const metadataRef = useRef( { title, artist, image, imageAlt } );
	const stylesRef = useRef( {
		color,
		gradient,
		backgroundColor,
		backgroundGradient,
		textColor,
	} );
	const playerRef = useRef();

	// Due to how WaveformPlayer is implemented, the artwork element within the
	// player element only exists when an image was present when the player was
	// created. Recreate the player when one is added or removed so that
	// element is created or torn down.
	const hasImage = !! image;

	// WaveformPlayer needs an audio source on init, but the source may change
	// throughout its lifetime.
	const hasSrc = !! src;

	useEffect( () => {
		metadataRef.current = { title, artist, image, imageAlt };

		const player = playerRef.current;
		if ( player ) {
			updatePlayerMetadata(
				player,
				{
					title,
					artist,
					image,
					imageAlt,
				},
				showPlayButtonArtwork
			);
		}
	}, [ title, artist, image, imageAlt, showPlayButtonArtwork ] );

	useEffect( () => {
		stylesRef.current = {
			color,
			gradient,
			backgroundColor,
			backgroundGradient,
			textColor,
		};
	}, [ color, gradient, backgroundColor, backgroundGradient, textColor ] );

	useEffect( () => {
		if ( playerRef.current?.container ) {
			applyWaveformPlayerStyles( playerRef.current.container, {
				backgroundColor,
				backgroundGradient,
				textColor,
				playButtonColor: showPlayButtonArtwork ? undefined : color,
				playButtonGradient: showPlayButtonArtwork
					? undefined
					: gradient,
			} );
		}
	}, [
		backgroundColor,
		backgroundGradient,
		color,
		gradient,
		showPlayButtonArtwork,
		textColor,
	] );

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

				const metadata = metadataRef.current;
				const player = initWaveformPlayer( element, {
					src,
					...metadata,
					waveformColor: stylesRef.current.color,
					waveformGradient: stylesRef.current.gradient,
					backgroundColor: stylesRef.current.backgroundColor,
					backgroundGradient: stylesRef.current.backgroundGradient,
					textColor: stylesRef.current.textColor,
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
					},
					artist: metadata.artist || EMPTY_ARTIST_PLACEHOLDER,
					onEnded: onEndedEvent,
					onNextTrack: onNextTrackEvent,
					onPreviousTrack: onPreviousTrackEvent,
					showPlayButtonArtwork,
				} );
				playerRef.current = player;
				onPlayerChangeEvent?.( player.instance );
				updatePlayerMetadata( player, metadata, showPlayButtonArtwork );
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
				onPlayerChangeEvent?.( undefined );
				playerDestroy?.();
			};
		},
		[
			onEndedEvent,
			onNextTrackEvent,
			onPreviousTrackEvent,
			onPlayerChangeEvent,
			src,
			color,
			gradient,
			waveformStyle,
			hasImage,
			showPlayButtonArtwork,
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
