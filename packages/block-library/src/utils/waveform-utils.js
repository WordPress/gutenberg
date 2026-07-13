/**
 * Shared utilities for waveform audio player functionality.
 * Used by both the WaveformPlayer component (editor) and view.js (frontend).
 */

/**
 * External dependencies
 */
import { colord } from 'colord';
import WaveformPlayerLib from '@arraypress/waveform-player';

/**
 * Configuration constants.
 * Note: DEFAULT_WAVEFORM_HEIGHT should match $waveform-player-height in style.scss.
 */
const DEFAULT_WAVEFORM_HEIGHT = 120;
const DEFAULT_SEEK_LABEL = 'Seek';
export const REPEAT_MODE_NONE = 'none';
export const REPEAT_MODE_ALL = 'all';
export const REPEAT_MODE_ONE = 'one';

const REPEAT_MODES = [ REPEAT_MODE_NONE, REPEAT_MODE_ALL, REPEAT_MODE_ONE ];

function normalizeRepeatMode( repeatMode ) {
	return REPEAT_MODES.includes( repeatMode ) ? repeatMode : REPEAT_MODE_NONE;
}

/**
 * Get the next repeat mode for the repeat control.
 *
 * @param {string} repeatMode - The current repeat mode.
 * @return {string} The next repeat mode.
 */
export function getNextRepeatMode( repeatMode = REPEAT_MODE_NONE ) {
	const mode = normalizeRepeatMode( repeatMode );
	if ( mode === REPEAT_MODE_NONE ) {
		return REPEAT_MODE_ALL;
	}
	if ( mode === REPEAT_MODE_ALL ) {
		return REPEAT_MODE_ONE;
	}
	return REPEAT_MODE_NONE;
}

/**
 * Pick the next track for shuffle playback so that no track repeats until
 * every other track has played once.
 *
 * The current track is treated as already played. The next track is chosen at
 * random from the tracks not yet played in this cycle. Once every track has
 * played, a new cycle starts and the just-played track is excluded from the
 * first pick so it never plays twice in a row across the cycle boundary.
 *
 * @param {string[]} trackIds  - All track IDs, in playlist order.
 * @param {string}   currentId - The currently (or just) played track ID.
 * @param {string[]} playedIds - Track IDs already played in the current cycle.
 * @return {{nextId: string, playedIds: string[]}} The next track ID and the updated played list.
 */
export function getNextShuffledTrack( trackIds, currentId, playedIds = [] ) {
	const played = playedIds.includes( currentId )
		? playedIds
		: [ ...playedIds, currentId ];
	const remaining = trackIds.filter( ( id ) => ! played.includes( id ) );

	// Every track has played: start a new cycle, excluding the just-played
	// track so it doesn't repeat back-to-back across the cycle boundary.
	if ( remaining.length === 0 ) {
		const candidates = trackIds.filter( ( id ) => id !== currentId );
		if ( candidates.length === 0 ) {
			return { nextId: currentId, playedIds: [ currentId ] };
		}
		const nextId =
			candidates[ Math.floor( Math.random() * candidates.length ) ];
		return { nextId, playedIds: [ nextId ] };
	}

	const nextId = remaining[ Math.floor( Math.random() * remaining.length ) ];
	return { nextId, playedIds: [ ...played, nextId ] };
}

/**
 * Check whether every track has played in the current shuffle cycle.
 *
 * @param {string[]} trackIds  - All track IDs, in playlist order.
 * @param {string}   currentId - The currently (or just) played track ID.
 * @param {string[]} playedIds - Track IDs already played in the current cycle.
 * @return {boolean} True when the shuffle cycle has completed.
 */
export function isShuffleCycleComplete( trackIds, currentId, playedIds = [] ) {
	const played = playedIds.includes( currentId )
		? playedIds
		: [ ...playedIds, currentId ];

	return (
		trackIds.length > 0 && trackIds.every( ( id ) => played.includes( id ) )
	);
}

/**
 * Get the played-track state after a manual track selection.
 *
 * In shuffle mode, a manually selected track starts a fresh cycle and is
 * treated as already playing. In ordered playback, no shuffle cycle state is
 * needed.
 *
 * @param {string|null} trackId    - The selected track ID.
 * @param {boolean}     isShuffled - Whether shuffle is active.
 * @return {string[]} Updated played-track state.
 */
export function getPlayedTracksAfterTrackSelection( trackId, isShuffled ) {
	return isShuffled && trackId ? [ trackId ] : [];
}

/**
 * Get the next playlist playback action for track end or skip controls.
 *
 * Repeat-one replays the current track on track end or skip. Repeat-all
 * advances through the playlist, wrapping to the start or starting a new
 * shuffle cycle when needed.
 *
 * @param {string[]} trackIds                - All track IDs, in playlist order.
 * @param {string}   currentId               - The current track ID.
 * @param {Object}   options                 - Playback state.
 * @param {string}   options.repeatMode      - Repeat mode: none, all, or one.
 * @param {boolean}  options.isShuffled      - Whether shuffle is active.
 * @param {string[]} options.playedTracks    - Shuffled tracks already played in the current cycle.
 * @param {boolean}  options.isUserInitiated - Whether this action came from a skip control.
 * @return {{action: string, nextId: (string|undefined), playedIds: string[]}} Playback action and updated shuffle state.
 */
export function getPlaylistPlaybackAction(
	trackIds,
	currentId,
	{
		repeatMode,
		isShuffled = false,
		playedTracks = [],
		isUserInitiated = false,
	} = {}
) {
	if ( ! trackIds.length || ! currentId ) {
		return { action: 'stop', nextId: undefined, playedIds: playedTracks };
	}

	const mode = normalizeRepeatMode( repeatMode );

	if ( mode === REPEAT_MODE_ONE ) {
		return { action: 'repeat', nextId: currentId, playedIds: playedTracks };
	}

	if ( isShuffled ) {
		if (
			! isUserInitiated &&
			mode !== REPEAT_MODE_ALL &&
			isShuffleCycleComplete( trackIds, currentId, playedTracks )
		) {
			return {
				action: 'stop',
				nextId: undefined,
				playedIds: playedTracks,
			};
		}
		const { nextId, playedIds } = getNextShuffledTrack(
			trackIds,
			currentId,
			playedTracks
		);
		if ( nextId === currentId && ! isUserInitiated ) {
			return { action: 'repeat', nextId, playedIds };
		}
		return { action: 'advance', nextId, playedIds };
	}

	const currentIndex = trackIds.findIndex( ( id ) => id === currentId );
	const nextId =
		trackIds[ currentIndex + 1 ] ||
		( ( isUserInitiated || mode === REPEAT_MODE_ALL ) && trackIds[ 0 ] );

	if ( nextId ) {
		if ( nextId === currentId && ! isUserInitiated ) {
			return { action: 'repeat', nextId, playedIds: playedTracks };
		}
		return { action: 'advance', nextId, playedIds: playedTracks };
	}

	return { action: 'stop', nextId: undefined, playedIds: playedTracks };
}

/**
 * Restart the current waveform player track and begin playback.
 *
 * @param {Object} instance - The WaveformPlayer library instance.
 */
export function replayWaveformPlayerTrack( instance ) {
	instance?.seekTo?.( 0 );
	instance?.play()?.catch( logPlayError );
}

/**
 * Get computed style for an element, using ownerDocument for iframe compatibility.
 *
 * @param {Element} element - The element to get styles from.
 * @return {CSSStyleDeclaration} The computed style.
 */
function getComputedStyle( element ) {
	return element.ownerDocument.defaultView.getComputedStyle( element );
}

/**
 * Get all colors needed for the waveform player based on the element's styles.
 *
 * @param {Element} element - The element to derive colors from.
 * @return {Object} Object containing textColor, waveformColor, progressColor.
 */
export function getWaveformColors( element ) {
	const textColor = getComputedStyle( element ).color;
	const waveformColor = colord( textColor ).alpha( 0.3 ).toRgbString();
	const progressColor = colord( textColor ).alpha( 0.6 ).toRgbString();

	return { textColor, waveformColor, progressColor };
}

/**
 * Create a waveform container element with the specified attributes.
 *
 * @param {Object} options               - The options for the container.
 * @param {string} options.url           - The audio URL.
 * @param {string} options.title         - The track title.
 * @param {string} options.artist        - The track artist.
 * @param {string} options.artwork       - The album artwork URL.
 * @param {string} options.waveformColor - The waveform bar color.
 * @param {string} options.progressColor - The progress indicator color.
 * @param {string} options.buttonColor   - The play button color.
 * @param {string} options.seekLabel     - Accessible label for the seek control.
 * @param {string} options.seekValueText - Accessible value-text template for the seek control (e.g. '%1$s of %2$s').
 * @param {number} options.height        - The waveform height in pixels.
 * @param {string} options.waveformStyle - The visualization style (bars, mirror, line, blocks, dots, seekbar).
 * @return {Element} The configured container element.
 */
export function createWaveformContainer( {
	url,
	title,
	artist,
	artwork,
	waveformColor,
	progressColor,
	buttonColor,
	seekLabel,
	seekValueText,
	height = DEFAULT_WAVEFORM_HEIGHT,
	waveformStyle = 'bars',
} ) {
	const container = document.createElement( 'div' );
	container.setAttribute( 'data-waveform-player', '' );
	container.setAttribute( 'data-url', url );
	container.setAttribute( 'data-height', String( height ) );
	container.setAttribute( 'data-waveform-style', waveformStyle );
	container.setAttribute( 'data-waveform-color', waveformColor );
	container.setAttribute( 'data-progress-color', progressColor );
	container.setAttribute( 'data-button-color', buttonColor );
	container.setAttribute(
		'data-seek-label',
		getSeekControlLabel( seekLabel )
	);
	// The library formats the current time and duration and interpolates them
	// into this translated template for the seek slider's aria-valuetext.
	if ( seekValueText ) {
		container.setAttribute( 'data-seek-value-text', seekValueText );
	}
	container.setAttribute( 'data-text-color', buttonColor );
	container.setAttribute( 'data-text-secondary-color', buttonColor );

	if ( title ) {
		container.setAttribute( 'data-title', title );
	}
	if ( artist ) {
		container.setAttribute( 'data-artist', artist );
	}
	if ( artwork ) {
		container.setAttribute( 'data-artwork', artwork );
	}
	return container;
}

/**
 * Apply contrasting color to SVG icon paths for visibility.
 * The icons should contrast with the button background (which uses textColor).
 *
 * @param {Element} container   - The waveform container element.
 * @param {string}  buttonColor - The button background color (textColor).
 */
export function styleSvgIcons( container, buttonColor ) {
	// Compute a contrasting color for the icons based on button brightness.
	const isButtonDark = colord( buttonColor ).isDark();
	const iconColor = isButtonDark ? '#ffffff' : '#000000';

	const svgPaths = container.querySelectorAll( 'svg path' );
	svgPaths.forEach( ( path ) => {
		path.style.fill = iconColor;
	} );
}

/**
 * Set up play button accessibility: aria-label that toggles on play/pause.
 *
 * @param {Element} container    - The waveform container element.
 * @param {Object}  labels       - Button labels.
 * @param {string}  labels.play  - Label for the play state.
 * @param {string}  labels.pause - Label for the pause state.
 */
export function setupPlayButtonAccessibility(
	container,
	{ play: playLabel = 'Play', pause: pauseLabel = 'Pause' } = {}
) {
	const playBtn = container.querySelector( '.waveform-btn' );
	if ( ! playBtn ) {
		return;
	}

	playBtn.setAttribute( 'aria-label', playLabel );
	playBtn.setAttribute( 'title', playLabel );

	const setLabel = ( label ) => {
		playBtn.setAttribute( 'aria-label', label );
		playBtn.setAttribute( 'title', label );
	};
	const onPlay = () => setLabel( pauseLabel );
	const onPause = () => setLabel( playLabel );

	container.addEventListener( 'waveformplayer:play', onPlay );
	container.addEventListener( 'waveformplayer:pause', onPause );
	container.addEventListener( 'waveformplayer:ended', onPause );

	// The library's container has tabindex="0" and focuses itself on click,
	// which would steal keyboard focus from the play button. The library owns
	// the play button's click handler, so add our own listener to stop the
	// click bubbling to the container — focus stays on the play button.
	// stopPropagation (not stopImmediatePropagation) leaves the library's own
	// click handler on the same element intact.
	const onPlayBtnClick = ( event ) => event.stopPropagation();
	playBtn.addEventListener( 'click', onPlayBtnClick );

	return () => {
		playBtn.removeEventListener( 'click', onPlayBtnClick );
		container.removeEventListener( 'waveformplayer:play', onPlay );
		container.removeEventListener( 'waveformplayer:pause', onPause );
		container.removeEventListener( 'waveformplayer:ended', onPause );
	};
}

/**
 * Get the accessible label for the waveform seek control.
 *
 * @param {string} label - Accessible label for the seek control.
 * @return {string} The provided label or translated fallback.
 */
function getSeekControlLabel( label ) {
	return label || DEFAULT_SEEK_LABEL;
}

/**
 * Update the waveform seek control label.
 *
 * @param {Object} instance - The WaveformPlayer instance.
 * @param {string} label    - Accessible label for the seek control.
 */
export function updateSeekControlLabel( instance, label ) {
	const seekLabel = getSeekControlLabel( label );
	instance.options.seekLabel = seekLabel;
	instance.applySeekLabel?.( seekLabel );

	const seekControl = instance?.container?.querySelector(
		'.waveform-container'
	);

	if ( seekControl ) {
		seekControl.setAttribute( 'aria-label', seekLabel );
	}
}

/**
 * Log play errors, filtering out expected AbortError.
 *
 * @param {Error} error - The error from play().
 */
export function logPlayError( error ) {
	// The browser throws AbortError when a play() promise is interrupted
	// by a subsequent pause() or a new audio source load (track change).
	// This is normal during rapid user interaction and safe to ignore.
	if ( error.name === 'AbortError' ) {
		return;
	}
	// eslint-disable-next-line no-console
	console.error( 'Playlist play error:', error );
}

/**
 * Apply the initial color state to a live waveform player.
 *
 * @param {Object}  instance             - The WaveformPlayer library instance.
 * @param {Element} container            - The waveform player container element.
 * @param {Object}  colors               - Current color values.
 * @param {string}  colors.textColor     - The computed text color.
 * @param {string}  colors.waveformColor - The waveform color.
 * @param {string}  colors.progressColor - The progress color.
 */
function applyPlayerColors(
	instance,
	container,
	{ textColor, waveformColor, progressColor }
) {
	instance.options.waveformColor = waveformColor;
	instance.options.progressColor = progressColor;
	instance.options.buttonColor = textColor;
	instance.options.textColor = textColor;
	instance.options.textSecondaryColor = textColor;

	container.dataset.waveformColor = waveformColor;
	container.dataset.progressColor = progressColor;
	container.dataset.buttonColor = textColor;
	container.dataset.textColor = textColor;
	container.dataset.textSecondaryColor = textColor;
	container.style.setProperty(
		'--wp-playlist-active-icon-color',
		colord( textColor ).isDark() ? '#ffffff' : '#000000'
	);
	container
		.closest( '.wp-block-playlist' )
		?.style.setProperty(
			'--wp-playlist-active-icon-color',
			colord( textColor ).isDark() ? '#ffffff' : '#000000'
		);

	const playBtn = container.querySelector( '.waveform-btn' );
	if ( playBtn ) {
		playBtn.style.borderColor = textColor;
		playBtn.style.color = textColor;
		styleSvgIcons( playBtn, textColor );
	}

	instance.drawWaveform();
}

/**
 * Get or create the row displayed below the waveform.
 *
 * @param {Element} container - The waveform player container.
 * @return {Element} The footer row.
 */
function getPlaylistFooter( container ) {
	let footerDiv = container.querySelector( '.wp-block-playlist__footer' );
	if ( footerDiv ) {
		return footerDiv;
	}

	footerDiv = container.ownerDocument.createElement( 'div' );
	footerDiv.className = 'wp-block-playlist__footer';

	const waveformTrack = container.querySelector( '.waveform-track' );
	if ( waveformTrack ) {
		waveformTrack.after( footerDiv );
	} else {
		container.appendChild( footerDiv );
	}

	return footerDiv;
}

/**
 * Remove the footer row when all custom footer content has been removed.
 *
 * @param {Element} footerDiv - The footer row.
 */
function removeEmptyPlaylistFooter( footerDiv ) {
	if ( footerDiv.children.length === 0 ) {
		footerDiv.remove();
	}
}

/**
 * Normalize the library's time markup to a compact current/total display.
 *
 * @param {Element} timeEl - The waveform time element.
 */
function normalizeWaveformTime( timeEl ) {
	const currentTimeEl = timeEl.querySelector( '.time-current' );
	const totalTimeEl = timeEl.querySelector( '.time-total' );

	if ( ! currentTimeEl || ! totalTimeEl ) {
		return;
	}

	timeEl.replaceChildren( currentTimeEl, '/', totalTimeEl );
}

/**
 * Move the player metadata into the footer row below the waveform.
 *
 * @param {Element} container - The waveform player container.
 * @param {Object}  instance  - The WaveformPlayer library instance.
 * @return {Function} Cleanup function.
 */
export function setupPlaylistMetadata( container, instance ) {
	const artworkEl =
		instance?.artworkEl || container.querySelector( '.waveform-artwork' );
	const titleEl =
		instance?.titleEl || container.querySelector( '.waveform-title' );
	const subtitleEl =
		instance?.subtitleEl || container.querySelector( '.waveform-subtitle' );
	const timeEl = container.querySelector( '.waveform-time' );

	if ( ! artworkEl && ! titleEl && ! subtitleEl && ! timeEl ) {
		return () => {};
	}

	const infoEl = container.querySelector( '.waveform-info' );
	const footerDiv = getPlaylistFooter( container );
	const metadataDiv = container.ownerDocument.createElement( 'div' );
	metadataDiv.className = 'wp-block-playlist__metadata';
	const metadataTextDiv = container.ownerDocument.createElement( 'div' );
	metadataTextDiv.className = 'wp-block-playlist__metadata-text';
	const titleRowDiv = container.ownerDocument.createElement( 'div' );
	titleRowDiv.className = 'wp-block-playlist__metadata-title-row';

	if ( artworkEl ) {
		metadataDiv.appendChild( artworkEl );
	}
	if ( titleEl ) {
		titleRowDiv.appendChild( titleEl );
	}
	if ( timeEl ) {
		normalizeWaveformTime( timeEl );
		titleRowDiv.appendChild( timeEl );
	}
	metadataTextDiv.appendChild( titleRowDiv );
	if ( subtitleEl ) {
		metadataTextDiv.appendChild( subtitleEl );
	}
	metadataDiv.appendChild( metadataTextDiv );

	footerDiv.appendChild( metadataDiv );
	if (
		infoEl &&
		! infoEl.querySelector(
			'.waveform-artwork, .waveform-title, .waveform-subtitle, .waveform-time, .waveform-bpm, .waveform-speed'
		)
	) {
		infoEl.remove();
	}

	return () => {
		metadataDiv.remove();
		removeEmptyPlaylistFooter( footerDiv );
	};
}

/**
 * Initialize a WaveformPlayer instance on an element.
 *
 * This is the shared core logic used by both the React component (editor)
 * and the Interactivity API (frontend).
 *
 * @param {Element}  element               - The container element (must be in DOM).
 * @param {Object}   options               - Configuration options.
 * @param {string}   options.src           - The audio file URL.
 * @param {string}   options.title         - The track title.
 * @param {string}   options.artist        - The artist name.
 * @param {string}   options.image         - The artwork image URL.
 * @param {string}   options.imageAlt      - The artwork image alt text.
 * @param {boolean}  options.autoPlay      - Whether to auto-play when ready.
 * @param {Function} options.onEnded       - Callback when track ends.
 * @param {Object}   options.labels        - Translated button labels.
 * @param {string}   options.waveformStyle - Waveform style (bars, mirror, line, blocks, dots, seekbar).
 * @return {Object} Object with instance, container, and destroy function.
 */
export function initWaveformPlayer(
	element,
	{
		src,
		title,
		artist,
		image,
		imageAlt,
		autoPlay,
		onEnded,
		labels,
		waveformStyle,
	}
) {
	// Get colors from computed styles.
	const { textColor, waveformColor, progressColor } =
		getWaveformColors( element );

	// Create the waveform container.
	const container = createWaveformContainer( {
		url: src,
		title,
		artist,
		artwork: image,
		waveformColor,
		progressColor,
		buttonColor: textColor,
		seekLabel: title || labels?.seek,
		seekValueText: labels?.seekValueText,
		waveformStyle,
	} );
	element.appendChild( container );

	// Initialize the WaveformPlayer library. The library reads the translated
	// seek label and value-text templates from the container's data attributes
	// and owns the seek slider's accessible label and value text.
	const instance = new WaveformPlayerLib( container );
	if ( instance.artworkEl ) {
		instance.artworkEl.alt = imageAlt || '';
	}

	// Set up event handlers.
	let cleanupAccessibility;
	let cleanupMetadata;
	let endedTimeoutId;
	const handlers = {
		ready: () => {
			applyPlayerColors( instance, container, {
				textColor,
				waveformColor,
				progressColor,
			} );
			cleanupMetadata = setupPlaylistMetadata( container, instance );
			cleanupAccessibility = setupPlayButtonAccessibility(
				container,
				labels
			);

			if ( autoPlay ) {
				instance.play()?.catch( logPlayError );
			}
		},
		ended: () => {
			// The underlying library dispatches this event before its own
			// pause cleanup. Defer playlist behavior so repeat playback is not
			// immediately overwritten by that cleanup.
			endedTimeoutId = container.ownerDocument.defaultView.setTimeout(
				() => {
					endedTimeoutId = undefined;
					onEnded?.( instance );
				},
				0
			);
		},
	};

	container.addEventListener( 'waveformplayer:ready', handlers.ready );
	container.addEventListener( 'waveformplayer:ended', handlers.ended );

	// Return instance, container, and cleanup function.
	return {
		instance,
		container,
		destroy: () => {
			cleanupAccessibility?.();
			cleanupMetadata?.();
			if ( endedTimeoutId !== undefined ) {
				container.ownerDocument.defaultView.clearTimeout(
					endedTimeoutId
				);
			}
			container.removeEventListener(
				'waveformplayer:ready',
				handlers.ready
			);
			container.removeEventListener(
				'waveformplayer:ended',
				handlers.ended
			);
			instance.destroy();
			container.remove();
		},
	};
}
