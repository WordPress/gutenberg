/**
 * External dependencies
 */
import '@arraypress/waveform-player/dist/waveform-player.css';

/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

/**
 * Internal dependencies
 */
import { initWaveformPlayer } from '../utils/waveform-utils';

/**
 * Configuration constants.
 */
const SEEK_AMOUNT = 5; // Seconds to seek with arrow keys.
const NEXT_TRACK_DELAY = 1000; // Delay in ms before auto-playing next track.

/**
 * Set up play button accessibility: aria attributes and keyboard seeking.
 *
 * @param {Element} container - The waveform container element.
 * @param {Object}  track     - The track data with ariaLabel and title.
 * @return {Function} Cleanup function to remove event listener.
 */
function setupPlayButtonAccessibility( container, track ) {
	const playBtn = container.querySelector( '.waveform-btn' );
	if ( ! playBtn ) {
		return () => {};
	}

	playBtn.setAttribute( 'aria-label', track.ariaLabel || track.title );
	playBtn.setAttribute( 'role', 'button' );

	// Add keyboard support for seeking.
	const keyboardHandler = ( event ) => {
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

	return () => {
		playBtn.removeEventListener( 'keydown', keyboardHandler );
	};
}

/**
 * Store player state for each element.
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
					initPlayer( ref, track, shouldAutoPlay, context );
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
 * @param {Object}  context        - The Interactivity API context.
 */
function initPlayer( ref, track, shouldAutoPlay, context ) {
	const existing = playerState.get( ref );

	// Double-check we haven't already initialized this URL
	// (could happen if debounced call runs after URL changed again).
	if ( existing?.url === track.url ) {
		return;
	}

	// Clean up any existing player.
	if ( existing ) {
		existing.destroy();
		playerState.delete( ref );
	}

	// Clear any DOM elements from previous player.
	ref.innerHTML = '';
	ref.removeAttribute( 'data-waveform-initialized' );

	// Initialize using the shared core.
	const player = initWaveformPlayer( ref, {
		src: track.url,
		title: track.title,
		artist: track.artist,
		image: track.image,
		onReady: ( { instance } ) => {
			// Set up accessibility after player is ready.
			const cleanupAccessibility = setupPlayButtonAccessibility(
				player.container,
				track
			);
			player.cleanupAccessibility = cleanupAccessibility;

			// Auto-play if switching tracks (user action), not on initial page load.
			if ( shouldAutoPlay ) {
				try {
					const playPromise = instance.play();
					if (
						playPromise &&
						typeof playPromise.catch === 'function'
					) {
						playPromise.catch( logPlayError );
					}
				} catch ( e ) {
					logPlayError( e );
				}
			}
		},
		onEnded: () => {
			// Advance to next track.
			const currentIndex = context.tracks.findIndex(
				( uniqueId ) => uniqueId === context.currentId
			);
			const nextTrack = context.tracks[ currentIndex + 1 ];
			if ( nextTrack ) {
				const expectedTrack = nextTrack;
				context.currentId = nextTrack;
				// Wait before playing next track to avoid jarring transition.
				setTimeout( () => {
					// Verify we're still on the expected track.
					if ( context.currentId !== expectedTrack ) {
						return;
					}
					const nextAudio = ref.querySelector( 'audio' );
					if ( nextAudio ) {
						const playPromise = nextAudio.play();
						if (
							playPromise &&
							typeof playPromise.catch === 'function'
						) {
							playPromise.catch( logPlayError );
						}
					}
				}, NEXT_TRACK_DELAY );
			}
		},
		onPlay: () => {
			context.isPlaying = true;
		},
		onPause: () => {
			context.isPlaying = false;
		},
	} );

	// Store state for cleanup.
	// Note: We pause audio before destroying to prevent AbortError when
	// destroy() interrupts a pending play() Promise.
	// TODO: Once @arraypress/waveform-player is updated with isDestroying
	// guards (PR #3), the pause-before-destroy workaround may not be needed.
	playerState.set( ref, {
		url: track.url,
		destroy: () => {
			const audio = player.container?.querySelector( 'audio' );
			if ( audio && ! audio.paused ) {
				audio.pause();
			}
			player.cleanupAccessibility?.();
			player.destroy();
		},
	} );
}

/**
 * Log play errors, filtering out expected AbortError.
 *
 * @param {Error} error - The error from play().
 */
function logPlayError( error ) {
	// AbortError is expected when play() is interrupted by pause() or track change.
	if ( error.name === 'AbortError' ) {
		return;
	}
	// eslint-disable-next-line no-console
	console.error( 'Playlist play error:', error );
}
