/**
 * WordPress dependencies
 */
import { store, getContext, getElement } from '@wordpress/interactivity';

/**
 * Internal dependencies
 */
import {
	initWaveformPlayer,
	logPlayError,
	updateSeekControlLabel,
} from '../utils/waveform-utils';

/**
 * Store player state for each element.
 */
const playerState = new WeakMap();
const playlistPlayerState = new Map();

const { state } = store(
	'core/playlist',
	{
		state: {
			playlists: {},
			get isCurrentTrack() {
				const { currentId, trackId } = getContext();
				return currentId === trackId;
			},
			get isCurrentTrackPlaying() {
				const { currentId, isPlaying, trackId } = getContext();
				return currentId === trackId && !! isPlaying;
			},
			get trackButtonActionLabel() {
				const { labelPauseTrack, labelSelectTrack } = getContext();
				return state.isCurrentTrackPlaying
					? labelPauseTrack
					: labelSelectTrack;
			},
		},
		actions: {
			changeTrack() {
				const context = getContext();
				if ( context.currentId === context.trackId ) {
					const player = playlistPlayerState.get(
						context.playlistId
					)?.instance;
					if ( player?.isPlaying ) {
						context.isPlaying = false;
						player.pause();
					} else {
						player?.play()?.catch( logPlayError );
					}
					return;
				}

				context.isPlaying = false;
				context.currentId = context.trackId;
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
	const existing = playerState.get( ref );

	// If a player already exists, load the new track without recreating.
	if ( existing?.instance ) {
		const shouldRecreatePlayer =
			!! existing.instance.artworkEl !== !! track.image;

		if ( shouldRecreatePlayer ) {
			existing.destroy?.();
			playerState.delete( ref );
		} else {
			playlistPlayerState.set( context.playlistId, existing );
			existing.instance
				.loadTrack( track.url, track.title, track.artist, {
					artwork: track.image,
				} )
				.then( () => {
					existing.url = track.url;
					if ( existing.instance.artworkEl ) {
						existing.instance.artworkEl.alt = track.imageAlt || '';
					}
					// loadTrack() preserves the previous explicit seekLabel option.
					updateSeekControlLabel(
						existing.instance,
						track.title || ref.dataset.labelSeek
					);
					if ( shouldAutoPlay ) {
						existing.instance.play()?.catch( logPlayError );
					}
				} )
				.catch( logPlayError );
			return;
		}
	}

	// Read translated labels from server-rendered data attributes.
	const labels = {
		play: ref.dataset.labelPlay,
		pause: ref.dataset.labelPause,
		seek: ref.dataset.labelSeek,
		seekValueText: ref.dataset.labelSeekValue,
	};

	// Initialize using the shared core.
	const player = initWaveformPlayer( ref, {
		src: track.url,
		title: track.title,
		artist: track.artist,
		image: track.image,
		imageAlt: track.imageAlt,
		autoPlay: shouldAutoPlay,
		labels,
		waveformStyle: context.waveformStyle,
		onEnded: () => {
			// Advance to next track (autoPlay handles playback).
			const currentIndex = context.tracks.findIndex(
				( trackId ) => trackId === context.currentId
			);
			const nextTrack = context.tracks[ currentIndex + 1 ];
			if ( nextTrack ) {
				context.currentId = nextTrack;
			}
		},
	} );
	const setIsPlaying = ( isPlaying ) => {
		context.isPlaying = isPlaying;
	};
	const onPlay = () => setIsPlaying( true );
	const onPause = () => setIsPlaying( false );
	player.container.addEventListener( 'waveformplayer:play', onPlay );
	player.container.addEventListener( 'waveformplayer:pause', onPause );
	player.container.addEventListener( 'waveformplayer:ended', onPause );
	const destroy = () => {
		player.container.removeEventListener( 'waveformplayer:play', onPlay );
		player.container.removeEventListener( 'waveformplayer:pause', onPause );
		player.container.removeEventListener( 'waveformplayer:ended', onPause );
		player.destroy();
	};

	// Store state for cleanup, including instance for loadTrack reuse.
	const nextState = {
		url: track.url,
		instance: player.instance,
		destroy,
	};
	playerState.set( ref, nextState );
	playlistPlayerState.set( context.playlistId, nextState );
}
