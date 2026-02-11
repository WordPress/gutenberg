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

	// Clean up any existing player state.
	if ( existing ) {
		const {
			container: existingContainer,
			playBtn,
			keyboardHandler,
			eventHandlers,
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

		// Remove WaveformPlayer event listeners.
		if ( eventHandlers && existingContainer ) {
			existingContainer.removeEventListener(
				'waveformplayer:ended',
				eventHandlers.handleEnded
			);
			existingContainer.removeEventListener(
				'waveformplayer:play',
				eventHandlers.handlePlay
			);
			existingContainer.removeEventListener(
				'waveformplayer:pause',
				eventHandlers.handlePause
			);
		}

		// TODO: Once @arraypress/waveform-player is updated with the isDestroying
		// guards (PR #3), simplify this to just: existing.instance.destroy()
		// For now, don't call destroy() as it can cause AbortError if there's a
		// pending play() Promise. The DOM is already cleared via ref.innerHTML = '',
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

	// Create event handlers using WaveformPlayer's custom events.
	// Events are dispatched on the container element.
	const handleEnded = () => {
		// Advance to next track.
		const currentIndex = context.tracks.findIndex(
			( uniqueId ) => uniqueId === context.currentId
		);
		const nextTrack = context.tracks[ currentIndex + 1 ];
		if ( nextTrack ) {
			context.currentId = nextTrack;
			// Wait before playing next track to avoid jarring transition.
			setTimeout( () => {
				const nextAudio = ref.querySelector( 'audio' );
				if ( nextAudio ) {
					nextAudio.play();
				}
			}, NEXT_TRACK_DELAY );
		}
	};
	const handlePlay = () => {
		context.isPlaying = true;
	};
	const handlePause = () => {
		context.isPlaying = false;
	};

	container.addEventListener( 'waveformplayer:ended', handleEnded );
	container.addEventListener( 'waveformplayer:play', handlePlay );
	container.addEventListener( 'waveformplayer:pause', handlePause );

	const eventHandlers = { handleEnded, handlePlay, handlePause };

	// Store state for cleanup.
	playerState.set( ref, {
		url: track.url,
		instance,
		container,
		playBtn,
		keyboardHandler,
		eventHandlers,
	} );

	// Auto-play if switching tracks (user action), not on initial page load.
	// Wait for the ready event to ensure WaveformPlayer is fully initialized.
	if ( shouldAutoPlay ) {
		const handleReady = () => {
			container.removeEventListener(
				'waveformplayer:ready',
				handleReady
			);
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
		};
		container.addEventListener( 'waveformplayer:ready', handleReady );
	}
}
