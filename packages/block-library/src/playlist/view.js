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
	getPlaylistPlaybackAction,
	getPlayedTracksAfterTrackSelection,
	getNextRepeatMode,
	replayWaveformPlayerTrack,
} from '../utils/waveform-utils';

/**
 * Store player state for each element.
 */
const playerState = new WeakMap();
const playlistPlayerState = new Map();
const controlsState = new WeakMap();

const SVG_NS = 'http://www.w3.org/2000/svg';
const ICON_PATHS = {
	repeat: 'm14.47 11.47 1.06 1.061 1.72-1.72v4.439a.25.25 0 0 1-.25.25h-6.379l-1.5 1.5H17a1.75 1.75 0 0 0 1.75-1.75v-4.438l1.72 1.72 1.06-1.061L18 7.94zM7 7a1.75 1.75 0 0 0-1.75 1.75v4.44l-1.72-1.72-1.06 1.06L6 16.06l3.53-3.53-1.06-1.06-1.72 1.72V8.75A.25.25 0 0 1 7 8.5h6.379l1.5-1.5z',
	repeatAll:
		'M7 7a1.75 1.75 0 0 0-1.75 1.75v4.44l-1.72-1.72-1.06 1.06L6 16.06l3.53-3.53-1.06-1.06-1.72 1.72V8.75A.25.25 0 0 1 7 8.5h10a.25.25 0 0 1 .25.25v6.5a.25.25 0 0 1-.25.25h-6.379l-1.5 1.5H17a1.75 1.75 0 0 0 1.75-1.75v-6.5A1.75 1.75 0 0 0 17 7z',
	shuffle:
		'M17.192 6.75L15.47 5.03l1.06-1.06 3.537 3.53-3.537 3.53-1.06-1.06 1.723-1.72h-3.19c-.602 0-.993.202-1.28.498-.309.319-.538.792-.695 1.383-.13.488-.222 1.023-.296 1.508-.034.664-.116 1.413-.303 2.117-.193.721-.513 1.467-1.068 2.04-.575.594-1.359.954-2.357.954H4v-1.5h4.003c.601 0 .993-.202 1.28-.498.308-.319.538-.792.695-1.383.149-.557.216-1.093.288-1.662l.039-.31a9.653 9.653 0 0 1 .272-1.653c.193-.722.513-1.467 1.067-2.04.576-.594 1.36-.954 2.358-.954h3.19zM8.004 6.75c.8 0 1.46.23 1.988.628a6.24 6.24 0 0 0-.684 1.396 1.725 1.725 0 0 0-.024-.026c-.287-.296-.679-.498-1.28-.498H4v-1.5h4.003zM12.699 14.726c-.161.459-.38.94-.684 1.396.527.397 1.188.628 1.988.628h3.19l-1.722 1.72 1.06 1.06L20.067 16l-3.537-3.53-1.06 1.06 1.723 1.72h-3.19c-.602 0-.993-.202-1.28-.498a1.96 1.96 0 0 1-.024-.026z',
	skipBack: 'm17.5 18-9-6 9-6zM8 6.5v11H6.5v-11z',
	skipForward: 'm15.5 12-9 6V6zm2 5.5H16v-11h1.5z',
};

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
				context.playedTracks = getPlayedTracksAfterTrackSelection(
					context.trackId,
					context.isShuffled
				);
			},
		},
		callbacks: {
			initPlaylistControls() {
				const context = getContext();
				const { ref } = getElement();

				if (
					context.showPlaybackControls === false ||
					! ref ||
					controlsState.has( ref )
				) {
					return;
				}

				controlsState.set( ref, setupPlaylistControls( ref, context ) );
			},
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
 * Create a decorative SVG icon element.
 *
 * @param {Document} doc  - The owner document.
 * @param {string}   name - The icon name.
 * @return {SVGElement} The icon element.
 */
function createIconElement( doc, name ) {
	const svg = doc.createElementNS( SVG_NS, 'svg' );
	svg.setAttribute( 'aria-hidden', 'true' );
	svg.setAttribute( 'focusable', 'false' );
	svg.setAttribute( 'viewBox', '0 0 24 24' );
	svg.setAttribute( 'xmlns', SVG_NS );

	const path = doc.createElementNS( SVG_NS, 'path' );
	path.setAttribute( 'd', ICON_PATHS[ name ] );
	svg.appendChild( path );

	return svg;
}

/**
 * Create a playlist control button.
 *
 * @param {Document} doc      - The owner document.
 * @param {string}   label    - The accessible label.
 * @param {string}   iconName - The icon name.
 * @return {HTMLButtonElement} The button element.
 */
function createControlButton( doc, label, iconName ) {
	const button = doc.createElement( 'button' );
	button.type = 'button';
	button.className = 'wp-block-playlist__control-btn';
	button.setAttribute( 'aria-label', label );
	button.setAttribute( 'title', label );
	button.appendChild( createIconElement( doc, iconName ) );

	return button;
}

/**
 * Select the previous playlist track.
 *
 * @param {Object} context - The Interactivity API context.
 */
function selectPreviousTrack( context ) {
	const currentIndex = context.tracks.findIndex(
		( uniqueId ) => uniqueId === context.currentId
	);
	const prevTrack =
		context.tracks[ currentIndex - 1 ] ||
		context.tracks[ context.tracks.length - 1 ];
	if ( prevTrack ) {
		context.currentId = prevTrack;
		context.playedTracks = getPlayedTracksAfterTrackSelection(
			prevTrack,
			context.isShuffled
		);
	}
}

/**
 * Advance the playlist according to shuffle and repeat state.
 *
 * @param {Object}  context         - The Interactivity API context.
 * @param {boolean} isUserInitiated - Whether this action came from a skip control.
 * @param {Object}  playerInstance  - The waveform player instance.
 */
function selectNextTrack( context, isUserInitiated, playerInstance ) {
	const { action, nextId, playedIds } = getPlaylistPlaybackAction(
		context.tracks,
		context.currentId,
		{
			repeatMode: context.repeatMode,
			isShuffled: context.isShuffled,
			playedTracks: context.playedTracks,
			isUserInitiated,
		}
	);
	context.playedTracks = playedIds;
	if ( action === 'repeat' ) {
		replayWaveformPlayerTrack( playerInstance );
		return;
	}
	if ( nextId ) {
		context.currentId = nextId;
	}
}

/**
 * Set up playlist controls rendered outside the waveform player.
 *
 * @param {Element} controlsElement - The controls host element.
 * @param {Object}  context         - The Interactivity API context.
 * @return {Object} Object with a cleanup function.
 */
function setupPlaylistControls( controlsElement, context ) {
	const doc = controlsElement.ownerDocument;
	const previousLabel =
		controlsElement.dataset.labelPrevious || 'Previous track';
	const nextLabel = controlsElement.dataset.labelNext || 'Next track';
	const shuffleLabel = controlsElement.dataset.labelShuffle || 'Shuffle';
	const repeatOffLabel =
		controlsElement.dataset.labelRepeatOff || 'Repeat off';
	const repeatAllLabel =
		controlsElement.dataset.labelRepeatAll || 'Repeat playlist';
	const repeatOneLabel =
		controlsElement.dataset.labelRepeatOne || 'Repeat current track';

	const getRepeatLabel = ( mode ) => {
		if ( mode === 'one' ) {
			return repeatOneLabel;
		}
		if ( mode === 'all' ) {
			return repeatAllLabel;
		}
		return repeatOffLabel;
	};
	const getPlayerInstance = () => {
		const playerElement = controlsElement.parentElement?.querySelector(
			'.wp-block-playlist__waveform-player'
		);
		return playerElement
			? playerState.get( playerElement )?.instance
			: null;
	};
	const actionGroup = doc.createElement( 'div' );
	actionGroup.className = 'wp-block-playlist__controls-group';
	const toggleGroup = doc.createElement( 'div' );
	toggleGroup.className = 'wp-block-playlist__controls-group';

	const prevBtn = createControlButton( doc, previousLabel, 'skipBack' );
	const nextBtn = createControlButton( doc, nextLabel, 'skipForward' );
	const repeatBtn = createControlButton( doc, repeatOffLabel, 'repeatAll' );
	const shuffleBtn = createControlButton( doc, shuffleLabel, 'shuffle' );

	shuffleBtn.setAttribute( 'aria-pressed', String( context.isShuffled ) );

	const updateRepeatButton = ( mode ) => {
		const repeatMode = [ 'all', 'one' ].includes( mode ) ? mode : 'none';
		const label = getRepeatLabel( repeatMode );
		repeatBtn.replaceChildren(
			createIconElement(
				doc,
				repeatMode === 'one' ? 'repeat' : 'repeatAll'
			)
		);
		repeatBtn.dataset.repeatMode = repeatMode;
		repeatBtn.setAttribute(
			'aria-pressed',
			String( repeatMode !== 'none' )
		);
		repeatBtn.setAttribute( 'aria-label', label );
		repeatBtn.setAttribute( 'title', label );
	};
	updateRepeatButton( context.repeatMode );

	actionGroup.append( prevBtn, nextBtn );
	toggleGroup.append( repeatBtn, shuffleBtn );
	controlsElement.append( actionGroup, toggleGroup );

	const onPrevClick = () => selectPreviousTrack( context );
	const onNextClick = () =>
		selectNextTrack( context, true, getPlayerInstance() );
	const onRepeatClick = () => {
		const nextMode = getNextRepeatMode( repeatBtn.dataset.repeatMode );
		context.repeatMode = nextMode;
		updateRepeatButton( nextMode );
	};
	const onShuffleClick = () => {
		const pressed = shuffleBtn.getAttribute( 'aria-pressed' ) !== 'true';
		shuffleBtn.setAttribute( 'aria-pressed', String( pressed ) );
		context.isShuffled = pressed;
		// Start a fresh shuffle cycle whenever shuffle is toggled.
		context.playedTracks = [];
	};

	prevBtn.addEventListener( 'click', onPrevClick );
	nextBtn.addEventListener( 'click', onNextClick );
	repeatBtn.addEventListener( 'click', onRepeatClick );
	shuffleBtn.addEventListener( 'click', onShuffleClick );

	return {
		cleanup: () => {
			prevBtn.removeEventListener( 'click', onPrevClick );
			nextBtn.removeEventListener( 'click', onNextClick );
			repeatBtn.removeEventListener( 'click', onRepeatClick );
			shuffleBtn.removeEventListener( 'click', onShuffleClick );
			controlsElement.replaceChildren();
		},
	};
}

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
			selectNextTrack( context, false, player.instance );
		},
		onNextTrack: ( playerInstance ) =>
			selectNextTrack( context, true, playerInstance ),
		onPreviousTrack: () => selectPreviousTrack( context ),
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
		container: player.container,
		instance: player.instance,
		destroy,
	};
	playerState.set( ref, nextState );
	playlistPlayerState.set( context.playlistId, nextState );
}
