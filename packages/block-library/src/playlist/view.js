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
import { initWaveformPlayer, logPlayError } from '../utils/waveform-utils';

/**
 * Configuration constants.
 */
const NEXT_TRACK_DELAY = 1000; // Delay in ms before auto-playing next track.

/**
 * Store player state for each element.
 */
const playerState = new Map();

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

				// Autoplay if we're switching from a different track (user action),
				// but not on initial page load (when existing has no URL).
				const shouldAutoPlay = !! existing?.url;

				initPlayer( ref, track, shouldAutoPlay, context );
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
	// Clean up any existing player.
	const existing = playerState.get( ref );
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
		ariaLabel: track.ariaLabel || track.title,
		autoPlay: shouldAutoPlay,
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
	} );

	// Store state for cleanup.
	playerState.set( ref, {
		url: track.url,
		destroy: player.destroy,
	} );
}
