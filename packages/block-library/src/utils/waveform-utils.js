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

function getTopLevelGradientParts( gradientValue ) {
	const match = gradientValue?.trim().match( /^[\w-]+-gradient\((.*)\)$/i );
	if ( ! match ) {
		return [];
	}

	const parts = [];
	let depth = 0;
	let current = '';

	for ( const character of match[ 1 ] ) {
		if ( character === '(' ) {
			++depth;
		} else if ( character === ')' ) {
			--depth;
		}

		if ( character === ',' && depth === 0 ) {
			parts.push( current.trim() );
			current = '';
			continue;
		}

		current += character;
	}

	if ( current.trim() ) {
		parts.push( current.trim() );
	}

	return parts;
}

function getLeadingColorFunction( value ) {
	const match = value.match( /^([\w-]+)\(/ );
	if ( ! match ) {
		return;
	}

	const supportedFunctions = [
		'color',
		'color-mix',
		'hsl',
		'hsla',
		'hwb',
		'lab',
		'lch',
		'oklab',
		'oklch',
		'rgb',
		'rgba',
		'var',
	];
	if ( ! supportedFunctions.includes( match[ 1 ].toLowerCase() ) ) {
		return;
	}

	let depth = 0;
	let foundOpeningParenthesis = false;
	for ( let index = 0; index < value.length; index++ ) {
		const character = value[ index ];
		if ( character === '(' ) {
			foundOpeningParenthesis = true;
			++depth;
		} else if ( character === ')' ) {
			--depth;
		}

		if ( foundOpeningParenthesis && depth === 0 ) {
			return value.slice( 0, index + 1 );
		}
	}
}

function getColorStopValue( gradientPart ) {
	const colorFunction = getLeadingColorFunction( gradientPart );
	if ( colorFunction ) {
		return colorFunction;
	}

	const [ possibleColor ] = gradientPart.split( /\s+/ );
	if ( colord( possibleColor ).isValid() ) {
		return possibleColor;
	}
}

function getWaveformGradientDirection( gradientValue ) {
	const parts = getTopLevelGradientParts( gradientValue );
	const direction = parts[ 0 ];
	const angleMatch = direction?.match( /^(-?\d+(?:\.\d+)?)deg$/i );
	if ( angleMatch ) {
		const angle = ( ( Number( angleMatch[ 1 ] ) % 360 ) + 360 ) % 360;
		if ( angle === 90 || angle === 270 ) {
			return 'horizontal';
		}
		if ( angle === 0 || angle === 180 ) {
			return 'vertical';
		}
		return 'diagonal';
	}

	if ( ! direction?.startsWith( 'to ' ) ) {
		return undefined;
	}

	const sideOrCorner = direction.toLowerCase().replace( /^to\s+/, '' );
	const hasHorizontalSide =
		sideOrCorner.includes( 'left' ) || sideOrCorner.includes( 'right' );
	const hasVerticalSide =
		sideOrCorner.includes( 'top' ) || sideOrCorner.includes( 'bottom' );

	if ( hasHorizontalSide && hasVerticalSide ) {
		return 'diagonal';
	}
	if ( hasHorizontalSide ) {
		return 'horizontal';
	}
	if ( hasVerticalSide ) {
		return 'vertical';
	}
}

function resolveColorValue( element, colorValue ) {
	if ( ! colorValue || colord( colorValue ).isValid() ) {
		return colorValue;
	}

	const colorResolver = element.ownerDocument.createElement( 'span' );
	colorResolver.style.color = colorValue;
	if ( ! colorResolver.style.color ) {
		return colorValue;
	}
	element.appendChild( colorResolver );

	const resolvedColor = getComputedStyle( colorResolver ).color;
	colorResolver.remove();

	return resolvedColor && colord( resolvedColor ).isValid()
		? resolvedColor
		: colorValue;
}

function getResolvedGradientStops( element, gradientValue ) {
	const stops = getWaveformGradientStops( gradientValue )
		?.map( ( colorValue ) => resolveColorValue( element, colorValue ) )
		.filter( ( colorValue ) => colord( colorValue ).isValid() );

	return stops?.length > 1 ? stops : undefined;
}

function applyAlpha( colorValue, alpha ) {
	if ( Array.isArray( colorValue ) ) {
		return colorValue.map( ( color ) =>
			colord( color ).alpha( alpha ).toRgbString()
		);
	}
	return colord( colorValue ).alpha( alpha ).toRgbString();
}

function getRepresentativeColor( colorValue ) {
	if ( Array.isArray( colorValue ) ) {
		return colorValue[ colorValue.length - 1 ];
	}
	return colorValue;
}

export function getWaveformGradientStops( gradientValue ) {
	const stops = getTopLevelGradientParts( gradientValue )
		.map( getColorStopValue )
		.filter( Boolean );

	return stops.length > 1 ? stops : undefined;
}

function serializeColorValue( colorValue ) {
	return Array.isArray( colorValue )
		? JSON.stringify( colorValue )
		: colorValue;
}

/**
 * Get all colors needed for the waveform player based on the element's styles.
 *
 * @param {Element} element               - The element to derive colors from.
 * @param {string}  waveformColorValue    - The base waveform color value to use.
 * @param {string}  textColorValue        - The text color value to use.
 * @param {string}  waveformGradientValue - The waveform gradient value to use.
 * @return {Object} Object containing textColor, waveformColor, progressColor.
 */
export function getWaveformColors(
	element,
	waveformColorValue,
	textColorValue,
	waveformGradientValue
) {
	const textColor = textColorValue || getComputedStyle( element ).color;
	const waveformGradientStops = getResolvedGradientStops(
		element,
		waveformGradientValue
	);
	const waveformBaseColor =
		waveformGradientStops || waveformColorValue || textColor;
	const waveformColor = applyAlpha( waveformBaseColor, 0.3 );
	const progressColor = applyAlpha( waveformBaseColor, 0.6 );
	const waveformGradient = waveformGradientStops
		? getWaveformGradientDirection( waveformGradientValue )
		: undefined;

	return {
		textColor,
		waveformColor,
		progressColor,
		...( waveformGradient && { waveformGradient } ),
	};
}

/**
 * Create a waveform container element with the specified attributes.
 *
 * @param {Object} options                  - The options for the container.
 * @param {string} options.url              - The audio URL.
 * @param {string} options.title            - The track title.
 * @param {string} options.artist           - The track artist.
 * @param {string} options.artwork          - The album artwork URL.
 * @param {string} options.artworkAlt       - The album artwork alt text.
 * @param {string} options.waveformColor    - The waveform bar color.
 * @param {string} options.progressColor    - The progress indicator color.
 * @param {string} options.waveformGradient - The waveform gradient direction.
 * @param {string} options.buttonColor      - The play button color.
 * @param {string} options.seekLabel        - Accessible label for the seek control.
 * @param {string} options.seekValueText    - Accessible value-text template for the seek control (e.g. '%1$s of %2$s').
 * @param {string} options.playLabel        - Accessible label for the play/pause button.
 * @param {number} options.height           - The waveform height in pixels.
 * @param {string} options.waveformStyle    - The visualization style (bars, mirror, line, blocks, dots, seekbar).
 * @return {Element} The configured container element.
 */
export function createWaveformContainer( {
	url,
	title,
	artist,
	artwork,
	artworkAlt,
	waveformColor,
	progressColor,
	waveformGradient,
	buttonColor,
	seekLabel,
	seekValueText,
	playLabel,
	height = DEFAULT_WAVEFORM_HEIGHT,
	waveformStyle = 'bars',
} ) {
	const container = document.createElement( 'div' );
	container.setAttribute( 'data-waveform-player', '' );
	container.setAttribute( 'data-url', url );
	container.setAttribute( 'data-height', String( height ) );
	container.setAttribute( 'data-waveform-style', waveformStyle );
	container.setAttribute(
		'data-waveform-color',
		serializeColorValue( waveformColor )
	);
	container.setAttribute(
		'data-progress-color',
		serializeColorValue( progressColor )
	);
	if ( waveformGradient ) {
		container.setAttribute( 'data-waveform-gradient', waveformGradient );
	}
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
	if ( playLabel ) {
		container.setAttribute( 'data-play-pause-label', playLabel );
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
	if ( artworkAlt ) {
		container.setAttribute( 'data-artwork-alt', artworkAlt );
	}
	return container;
}

/**
 * Apply custom styles to a generated waveform player.
 *
 * @param {Element} container                 - The generated player container.
 * @param {Object}  styles                    - The player styles.
 * @param {string}  styles.backgroundColor    - The waveform area background color.
 * @param {string}  styles.backgroundGradient - The waveform area background gradient.
 * @param {string}  styles.textColor          - The player text color.
 * @param {string}  styles.playButtonColor    - The play button color.
 * @param {string}  styles.playButtonGradient - The play button gradient.
 */
export function applyWaveformPlayerStyles(
	container,
	{
		backgroundColor,
		backgroundGradient,
		textColor,
		playButtonColor,
		playButtonGradient,
	} = {}
) {
	const waveformContainer = container.querySelector( '.waveform-container' );
	const playButton = container.querySelector( '.waveform-btn' );
	const playButtonBaseColor = getRepresentativeColor(
		getResolvedGradientStops( container, playButtonGradient ) ||
			playButtonColor
	);

	if ( playButtonBaseColor ) {
		container.style.setProperty(
			'--wfp-button-color',
			playButtonBaseColor
		);
	} else {
		container.style.removeProperty( '--wfp-button-color' );
	}

	if ( textColor ) {
		container.style.setProperty( '--wfp-text-color', textColor );
		container.style.setProperty( '--wfp-text-secondary-color', textColor );
	} else {
		container.style.removeProperty( '--wfp-text-color' );
		container.style.removeProperty( '--wfp-text-secondary-color' );
	}

	if ( playButton ) {
		if ( playButtonGradient ) {
			playButton.style.background = playButtonGradient;
		} else {
			playButton.style.removeProperty( 'background' );
		}
	}

	if ( waveformContainer ) {
		if ( backgroundGradient ) {
			waveformContainer.style.background = backgroundGradient;
		} else if ( backgroundColor ) {
			waveformContainer.style.removeProperty( 'background' );
			waveformContainer.style.backgroundColor = backgroundColor;
		} else {
			waveformContainer.style.removeProperty( 'background' );
			waveformContainer.style.removeProperty( 'background-color' );
		}
	}
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
 * Show the current artwork as the play button background.
 *
 * @param {Element} container  - The waveform player container element.
 * @param {string}  artworkUrl - The track image URL.
 */
export function setupPlayButtonArtwork( container, artworkUrl ) {
	if ( ! artworkUrl ) {
		container.classList.remove( 'has-play-button-artwork' );
		container.style.removeProperty( '--wp--playlist--play-button-artwork' );
		return;
	}

	container.classList.add( 'has-play-button-artwork' );
	container.style.setProperty(
		'--wp--playlist--play-button-artwork',
		`url(${ JSON.stringify( artworkUrl ) })`
	);
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
 * @param {Element}  element                       - The container element (must be in DOM).
 * @param {Object}   options                       - Configuration options.
 * @param {string}   options.src                   - The audio file URL.
 * @param {string}   options.title                 - The track title.
 * @param {string}   options.artist                - The artist name.
 * @param {string}   options.image                 - The artwork image URL.
 * @param {string}   options.imageAlt              - The artwork image alt text.
 * @param {string}   options.waveformColor         - The waveform color.
 * @param {string}   options.waveformGradient      - The waveform gradient.
 * @param {string}   options.textColor             - The player text color.
 * @param {string}   options.backgroundColor       - The player background color.
 * @param {string}   options.backgroundGradient    - The player background gradient.
 * @param {boolean}  options.autoPlay              - Whether to auto-play when ready.
 * @param {Function} options.onEnded               - Callback when track ends.
 * @param {Object}   options.labels                - Translated button labels.
 * @param {string}   options.waveformStyle         - Waveform style (bars, mirror, line, blocks, dots, seekbar).
 * @param {Function} options.onNextTrack           - Callback for the Media Session next-track action.
 * @param {Function} options.onPreviousTrack       - Callback for the Media Session previous-track action.
 * @param {boolean}  options.showPlayButtonArtwork - Whether to show artwork on the play button.
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
		waveformColor: waveformColorValue,
		waveformGradient: waveformGradientValue,
		textColor: textColorValue,
		backgroundColor,
		backgroundGradient,
		autoPlay,
		onEnded,
		labels,
		waveformStyle,
		onNextTrack,
		onPreviousTrack,
		showPlayButtonArtwork = false,
	}
) {
	const playerArtwork = showPlayButtonArtwork ? undefined : image;

	// Get colors from computed styles.
	const { textColor, waveformColor, progressColor, waveformGradient } =
		getWaveformColors(
			element,
			waveformColorValue,
			textColorValue,
			waveformGradientValue
		);
	const waveformGradientStops = getResolvedGradientStops(
		element,
		waveformGradientValue
	);
	const waveformButtonColor = getRepresentativeColor(
		waveformGradientStops || waveformColorValue
	);

	// Create the waveform container.
	const container = createWaveformContainer( {
		url: src,
		title,
		artist,
		artwork: playerArtwork,
		waveformColor,
		progressColor,
		waveformGradient,
		buttonColor: textColor,
		seekLabel: title || labels?.seek,
		seekValueText: labels?.seekValueText,
		playLabel: labels?.play,
		artworkAlt: imageAlt,
		waveformStyle,
	} );
	element.appendChild( container );

	// Initialize the WaveformPlayer library. It owns track loading, artwork
	// alt text, localized seek labels, Media Session controls, and the ended
	// lifecycle callback.
	const instance = new WaveformPlayerLib( container, {
		url: src,
		title,
		artist,
		artwork: playerArtwork,
		artworkAlt: imageAlt || '',
		waveformColor,
		progressColor,
		waveformGradient,
		waveformStyle,
		seekLabel: title || labels?.seek,
		seekValueText: labels?.seekValueText,
		playPauseLabel: labels?.play,
		onEnd: onEnded,
		onNextTrack,
		onPreviousTrack,
	} );
	applyWaveformPlayerStyles( container, {
		backgroundColor,
		backgroundGradient,
		textColor,
		playButtonColor: showPlayButtonArtwork
			? undefined
			: waveformButtonColor,
		playButtonGradient: showPlayButtonArtwork
			? undefined
			: waveformGradientValue,
	} );

	// Set up event handlers.
	let cleanupAccessibility;
	let cleanupMetadata;
	const handlers = {
		ready: () => {
			applyPlayerColors( instance, container, {
				textColor,
				waveformColor,
				progressColor,
			} );
			applyWaveformPlayerStyles( container, {
				backgroundColor,
				backgroundGradient,
				textColor,
				playButtonColor: showPlayButtonArtwork
					? undefined
					: waveformButtonColor,
				playButtonGradient: showPlayButtonArtwork
					? undefined
					: waveformGradientValue,
			} );
			styleSvgIcons( container, waveformButtonColor || textColor );
			if ( showPlayButtonArtwork ) {
				setupPlayButtonArtwork( container, image );
			}
			cleanupMetadata = setupPlaylistMetadata( container, instance );
			cleanupAccessibility = setupPlayButtonAccessibility(
				container,
				labels
			);

			if ( autoPlay ) {
				instance.play()?.catch( logPlayError );
			}
		},
	};

	container.addEventListener( 'waveformplayer:ready', handlers.ready );

	// Return instance, container, and cleanup function.
	return {
		instance,
		container,
		destroy: () => {
			cleanupAccessibility?.();
			cleanupMetadata?.();
			container.removeEventListener(
				'waveformplayer:ready',
				handlers.ready
			);
			instance.destroy();
			container.remove();
		},
	};
}
