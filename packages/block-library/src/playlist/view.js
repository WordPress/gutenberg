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
 * Store player state for each element.
 */
const playerState = new WeakMap();

const { state } = store(
	'core/playlist',
	{
		state: {
			playlists: {},
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

	// Initialize using the shared core.
	const player = initWaveformPlayer( ref, {
		src: track.url,
		title: track.title,
		artist: track.artist,
		image: track.image,
		ariaLabel: track.ariaLabel || track.title,
		autoPlay: shouldAutoPlay,
		onEnded: () => {
			// Advance to next track (autoPlay handles playback).
			const currentIndex = context.tracks.findIndex(
				( uniqueId ) => uniqueId === context.currentId
			);
			const nextTrack = context.tracks[ currentIndex + 1 ];
			if ( nextTrack ) {
				context.currentId = nextTrack;
			}
		},
	} );

	// Store state for cleanup.
	playerState.set( ref, {
		url: track.url,
		destroy: player.destroy,
	} );
}
