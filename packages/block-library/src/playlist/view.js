/**
 * External dependencies
 */
import WaveformPlayer from '@arraypress/waveform-player';
import '@arraypress/waveform-player/dist/waveform-player.css';

/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

/**
 * Internal dependencies
 */
import {
	getWaveformColors,
	createWaveformContainer,
	styleSvgIcons,
} from './utils';

/**
 * Configuration constants.
 */
const SEEK_AMOUNT = 5; // Seconds to seek with arrow keys.
const NEXT_TRACK_DELAY = 1000; // Delay in ms before auto-playing next track.

/**
 * Store player state for each element (instance, url, event listeners).
 */
const playerState = new Map();

/**
 * Store pending initialization timeouts for debouncing rapid track changes.
 */
const pendingInit = new Map();

const { state } = store(
	'core/playlist',
	{
		state: {
			playlists: {},
			get currentTrack() {
				const { currentId, playlistId } = getContext();
				if ( ! currentId || ! playlistId ) {
					return {};
				}
				const playlist = state.playlists[ playlistId ];
				if ( ! playlist ) {
					return {};
				}
				return playlist.tracks[ currentId ] || {};
			},
			get isCurrentTrack() {
				const { currentId, uniqueId } = getContext();
				return currentId === uniqueId;
			},
		},
		actions: {
			changeTrack() {
				const context = getContext();
				context.currentId = context.uniqueId;
				context.isPlaying = true;
			},
			isPlaying() {
				const context = getContext();
				context.isPlaying = true;
			},
			isPaused() {
				const context = getContext();
				context.isPlaying = false;
			},
			nextSong( event ) {
				const { ref } = getElement();

				// Check if this event is for this specific player instance.
				if ( event?.detail?.element && event.detail.element !== ref ) {
					return;
				}

				const context = getContext();
				const currentIndex = context.tracks.findIndex(
					( uniqueId ) => uniqueId === context.currentId
				);
				const nextTrack = context.tracks[ currentIndex + 1 ];
				if ( nextTrack ) {
					context.currentId = nextTrack;
					// Waits a moment before changing the track, since
					// immediately changing the track can be jarring.
					setTimeout( () => {
						const audio = ref.querySelector( 'audio' );
						if ( audio ) {
							audio.play();
						}
					}, NEXT_TRACK_DELAY );
				}
			},
		},
		callbacks: {
			initWaveformPlayer() {
				const context = getContext();
				const { ref } = getElement();

				if ( ! context.currentId || ! ref ) {
					return;
				}

				const track =
					state.playlists[ context.playlistId ]?.tracks[
						context.currentId
					];
				if ( ! track?.url ) {
					return;
				}

				const existing = playerState.get( ref );

				// Skip if we already initialized with this exact URL.
				if ( existing?.url === track.url ) {
					return;
				}

				// Cancel any pending initialization to debounce rapid clicks.
				const pendingTimeout = pendingInit.get( ref );
				if ( pendingTimeout ) {
					clearTimeout( pendingTimeout );
				}

				// Autoplay if we're switching from a different track (user action),
				// but not on initial page load (when existing has no URL).
				const shouldAutoPlay = !! existing?.url;

				// Debounce initialization to handle rapid track changes.
				// This ensures only the last clicked track gets initialized.
				const timeoutId = setTimeout( () => {
					pendingInit.delete( ref );
					initPlayer( ref, track, shouldAutoPlay );
				}, 50 );

				pendingInit.set( ref, timeoutId );
			},
		},
	},
	{ lock: true }
);

/**
 * Initialize the waveform player for a given element.
 *
 * @param {Element} ref            - The container element.
 * @param {Object}  track          - The track data.
 * @param {boolean} shouldAutoPlay - Whether to auto-play after initialization.
 */
function initPlayer( ref, track, shouldAutoPlay ) {
	const existing = playerState.get( ref );

	// Double-check we haven't already initialized this URL
	// (could happen if debounced call runs after URL changed again).
	if ( existing?.url === track.url ) {
		return;
	}

	// Clean up any existing player state.
	if ( existing ) {
		const {
			container: existingContainer,
			handlers,
			playBtn,
			keyboardHandler,
		} = existing;

		// Pause the old audio first to prevent AbortError
		// when destroy() interrupts a pending play() Promise.
		const oldAudio = existingContainer?.querySelector( 'audio' );
		if ( oldAudio && ! oldAudio.paused ) {
			oldAudio.pause();
		}

		if ( playBtn && keyboardHandler ) {
			playBtn.removeEventListener( 'keydown', keyboardHandler );
		}
		if ( existingContainer && handlers ) {
			existingContainer.removeEventListener(
				'waveformplayer:ended',
				handlers.ended
			);
			existingContainer.removeEventListener(
				'waveformplayer:play',
				handlers.play
			);
			existingContainer.removeEventListener(
				'waveformplayer:pause',
				handlers.pause
			);
		}
		// Don't call destroy() as it can cause AbortError if there's a pending
		// play() Promise. The DOM is already cleared via ref.innerHTML = '',
		// and the old instance will be garbage collected.
		playerState.delete( ref );
	}

	// Clear any DOM elements from previous player.
	ref.innerHTML = '';

	// Remove the initialized flag so WaveformPlayer creates fresh.
	ref.removeAttribute( 'data-waveform-initialized' );

	// Get colors from computed styles for proper inheritance.
	const { textColor, waveformColor, progressColor } =
		getWaveformColors( ref );

	// Create the waveform container.
	const container = createWaveformContainer( {
		url: track.url,
		title: track.title,
		artist: track.artist,
		artwork: track.image,
		waveformColor,
		progressColor,
		buttonColor: textColor,
	} );
	ref.appendChild( container );

	// Create WaveformPlayer instance.
	const instance = new WaveformPlayer( container );

	// Apply contrasting color to SVG icons for visibility.
	styleSvgIcons( container, textColor );

	// Enhance play button accessibility.
	const playBtn = container.querySelector( '.waveform-btn' );
	let keyboardHandler = null;
	if ( playBtn ) {
		playBtn.setAttribute( 'aria-label', track.ariaLabel || track.title );
		playBtn.setAttribute( 'role', 'button' );

		// Add keyboard support for seeking.
		keyboardHandler = ( event ) => {
			const audio = container.querySelector( 'audio' );
			if ( ! audio ) {
				return;
			}

			switch ( event.key ) {
				case 'ArrowLeft':
					event.preventDefault();
					audio.currentTime = Math.max(
						0,
						audio.currentTime - SEEK_AMOUNT
					);
					break;
				case 'ArrowRight':
					event.preventDefault();
					audio.currentTime = Math.min(
						audio.duration,
						audio.currentTime + SEEK_AMOUNT
					);
					break;
			}
		};

		playBtn.addEventListener( 'keydown', keyboardHandler );
	}

	// Create event handlers for WaveformPlayer events.
	const handleEnded = () => {
		ref.dispatchEvent(
			new CustomEvent( 'waveform-ended', {
				bubbles: true,
				detail: { element: ref },
			} )
		);
	};

	const handlePlay = () => {
		ref.dispatchEvent(
			new CustomEvent( 'waveform-play', {
				bubbles: true,
				detail: { element: ref },
			} )
		);
	};

	const handlePause = () => {
		ref.dispatchEvent(
			new CustomEvent( 'waveform-pause', {
				bubbles: true,
				detail: { element: ref },
			} )
		);
	};

	// Add event listeners.
	container.addEventListener( 'waveformplayer:ended', handleEnded );
	container.addEventListener( 'waveformplayer:play', handlePlay );
	container.addEventListener( 'waveformplayer:pause', handlePause );

	// Store all state for cleanup.
	playerState.set( ref, {
		url: track.url,
		instance,
		container,
		playBtn,
		keyboardHandler,
		handlers: {
			ended: handleEnded,
			play: handlePlay,
			pause: handlePause,
		},
	} );

	// Auto-play if switching tracks (user action), not on initial page load.
	// Use setTimeout to let WaveformPlayer fully initialize before playing.
	// Without the setTimeout, play() can sometimes be called before the player is ready,
	// and the pause button doesn't render.
	if ( shouldAutoPlay && instance ) {
		setTimeout( () => {
			try {
				const playPromise = instance.play();
				if ( playPromise && typeof playPromise.catch === 'function' ) {
					playPromise.catch( () => {
						// Silently ignore play errors.
					} );
				}
			} catch ( e ) {
				// Silently ignore errors.
			}
		}, 100 );
	}
}
