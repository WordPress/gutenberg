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

/**
 * Pick the next track for shuffle playback so that no track repeats until
 * every other track has played once.
 *
 * The current track is treated as already played. The next track is chosen at
 * random from the tracks not yet played in this cycle. Once every track has
 * played, a new cycle starts and the just-played track is excluded from the
 * first pick so it never plays twice in a row across the cycle boundary.
 *
 * @param {string[]} trackIds  - All track unique IDs, in playlist order.
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
 * @param {string[]} trackIds  - All track unique IDs, in playlist order.
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
 * Move the waveform player's artwork image into the play button.
 *
 * @param {Element} container  - The waveform player container element.
 * @param {Object}  instance   - The WaveformPlayer library instance.
 * @param {string}  artworkUrl - The album artwork URL.
 */
export function setupPlayButtonArtwork( container, instance, artworkUrl ) {
	const playBtn = container.querySelector( '.waveform-btn' );
	if ( ! playBtn ) {
		return;
	}

	const existingButtonArtwork = playBtn.querySelector(
		'.wp-block-playlist__play-button-artwork'
	);
	let artworkEl =
		instance?.artworkEl ||
		existingButtonArtwork ||
		container.querySelector( '.waveform-artwork' );

	if ( ! artworkUrl ) {
		existingButtonArtwork?.remove();
		playBtn.classList.remove( 'has-artwork' );
		// The button background reverts from the dark artwork to its themed
		// color, so recolor the icon to keep it legible (it was forced white).
		styleSvgIcons( playBtn, getComputedStyle( playBtn ).backgroundColor );
		return;
	}

	if ( ! artworkEl ) {
		artworkEl = container.ownerDocument.createElement( 'img' );
	}

	if ( existingButtonArtwork && existingButtonArtwork !== artworkEl ) {
		existingButtonArtwork.remove();
	}

	artworkEl.src = artworkUrl;
	artworkEl.classList.add( 'wp-block-playlist__play-button-artwork' );
	artworkEl.setAttribute( 'aria-hidden', 'true' );
	artworkEl.alt = '';
	artworkEl.removeAttribute( 'width' );
	artworkEl.removeAttribute( 'height' );
	// Layout/sizing is enforced by the .wp-block-playlist__play-button-artwork
	// rule (with !important) so it overrides the library's inline styles.
	playBtn.classList.add( 'has-artwork' );
	playBtn.prepend( artworkEl );

	playBtn.querySelectorAll( 'svg path' ).forEach( ( path ) => {
		path.style.fill = '#ffffff';
	} );
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
 * Apply the current color state to a live waveform player.
 *
 * @param {Object}  instance   - The WaveformPlayer library instance.
 * @param {Element} container  - The waveform player container element.
 * @param {Object}  colorState - Current color values.
 */
function applyPlayerColors( instance, container, colorState ) {
	const { textColor, waveformColor, progressColor } = colorState;

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

	const playBtn = container.querySelector( '.waveform-btn' );
	if ( playBtn ) {
		playBtn.style.borderColor = textColor;
		playBtn.style.color = textColor;
		if ( ! playBtn.classList.contains( 'has-artwork' ) ) {
			styleSvgIcons( playBtn, textColor );
		}
	}

	instance.drawWaveform();
}

/**
 * Refresh a live waveform player after inherited block colors change.
 *
 * @param {Object}  player  - Object returned by initWaveformPlayer.
 * @param {Element} element - The element that inherits the block text color.
 * @return {boolean} Whether the player colors changed.
 */
export function refreshWaveformPlayerColors( player, element ) {
	if ( ! player?.instance || ! player?.container || ! player?.colorState ) {
		return false;
	}

	const { textColor, waveformColor, progressColor } =
		getWaveformColors( element );
	const { colorState } = player;

	if (
		textColor === colorState.textColor &&
		waveformColor === colorState.waveformColor &&
		progressColor === colorState.progressColor
	) {
		return false;
	}

	colorState.textColor = textColor;
	colorState.waveformColor = waveformColor;
	colorState.progressColor = progressColor;
	applyPlayerColors( player.instance, player.container, colorState );

	return true;
}

// SVG markup from the WordPress icon library. They are decorative; the parent
// control button carries the accessible label.
const ICON_PREV =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m17.5 18-9-6 9-6zM8 6.5v11H6.5v-11z" /></svg>';
const ICON_NEXT =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m15.5 12-9 6V6zm2 5.5H16v-11h1.5z" /></svg>';
const ICON_SHUFFLE =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M17.192 6.75L15.47 5.03l1.06-1.06 3.537 3.53-3.537 3.53-1.06-1.06 1.723-1.72h-3.19c-.602 0-.993.202-1.28.498-.309.319-.538.792-.695 1.383-.13.488-.222 1.023-.296 1.508-.034.664-.116 1.413-.303 2.117-.193.721-.513 1.467-1.068 2.04-.575.594-1.359.954-2.357.954H4v-1.5h4.003c.601 0 .993-.202 1.28-.498.308-.319.538-.792.695-1.383.149-.557.216-1.093.288-1.662l.039-.31a9.653 9.653 0 0 1 .272-1.653c.193-.722.513-1.467 1.067-2.04.576-.594 1.36-.954 2.358-.954h3.19zM8.004 6.75c.8 0 1.46.23 1.988.628a6.24 6.24 0 0 0-.684 1.396 1.725 1.725 0 0 0-.024-.026c-.287-.296-.679-.498-1.28-.498H4v-1.5h4.003zM12.699 14.726c-.161.459-.38.94-.684 1.396.527.397 1.188.628 1.988.628h3.19l-1.722 1.72 1.06 1.06L20.067 16l-3.537-3.53-1.06 1.06 1.723 1.72h-3.19c-.602 0-.993-.202-1.28-.498a1.96 1.96 0 0 1-.024-.026z" /></svg>';
const ICON_REPEAT =
	'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m14.47 11.47 1.06 1.061 1.72-1.72v4.439a.25.25 0 0 1-.25.25h-6.379l-1.5 1.5H17a1.75 1.75 0 0 0 1.75-1.75v-4.438l1.72 1.72 1.06-1.061L18 7.94zM7 7a1.75 1.75 0 0 0-1.75 1.75v4.44l-1.72-1.72-1.06 1.06L6 16.06l3.53-3.53-1.06-1.06-1.72 1.72V8.75A.25.25 0 0 1 7 8.5h6.379l1.5-1.5z" /></svg>';

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
 * Move the player metadata into the footer row below the waveform.
 *
 * @param {Element} container - The waveform player container.
 * @param {Object}  instance  - The WaveformPlayer library instance.
 * @return {Function} Cleanup function.
 */
function setupPlaylistMetadata( container, instance ) {
	const titleEl =
		instance?.titleEl || container.querySelector( '.waveform-title' );
	const subtitleEl =
		instance?.subtitleEl || container.querySelector( '.waveform-subtitle' );

	if ( ! titleEl && ! subtitleEl ) {
		return () => {};
	}

	const footerDiv = getPlaylistFooter( container );
	const metadataDiv = container.ownerDocument.createElement( 'div' );
	metadataDiv.className = 'wp-block-playlist__metadata';

	if ( titleEl ) {
		metadataDiv.appendChild( titleEl );
	}
	if ( subtitleEl ) {
		metadataDiv.appendChild( subtitleEl );
	}

	footerDiv.appendChild( metadataDiv );

	return () => {
		metadataDiv.remove();
		removeEmptyPlaylistFooter( footerDiv );
	};
}

/**
 * Create playlist control buttons (prev/next, repeat/shuffle) and insert
 * them into the waveform player container.
 *
 * @param {Element}  container                 - The waveform player container.
 * @param {Object}   callbacks                 - Button click callbacks.
 * @param {Function} callbacks.onPrev          - Called when previous is clicked.
 * @param {Function} callbacks.onNext          - Called when next is clicked.
 * @param {Function} callbacks.onShuffleToggle - Called when shuffle is toggled.
 * @param {Function} callbacks.onRepeatToggle  - Called when repeat is toggled.
 * @param {boolean}  isShuffled                - Initial shuffle state.
 * @param {boolean}  isRepeating               - Initial repeat state.
 * @param {Object}   labels                    - Translated control labels.
 * @param {string}   labels.previous           - Label for the previous-track button.
 * @param {string}   labels.next               - Label for the next-track button.
 * @param {string}   labels.shuffle            - Label for the shuffle button.
 * @param {string}   labels.repeat             - Label for the repeat button.
 * @return {Object} Object with a cleanup function.
 */
export function setupPlaylistControls(
	container,
	{ onPrev, onNext, onShuffleToggle, onRepeatToggle },
	isShuffled = false,
	isRepeating = false,
	{
		previous: previousLabel = 'Previous track',
		next: nextLabel = 'Next track',
		shuffle: shuffleLabel = 'Shuffle',
		repeat: repeatLabel = 'Repeat',
	} = {}
) {
	const doc = container.ownerDocument;
	const controlsDiv = doc.createElement( 'div' );
	controlsDiv.className = 'wp-block-playlist__controls';
	const actionGroup = doc.createElement( 'div' );
	actionGroup.className = 'wp-block-playlist__controls-group';
	const toggleGroup = doc.createElement( 'div' );
	toggleGroup.className = 'wp-block-playlist__controls-group';

	const prevBtn = doc.createElement( 'button' );
	prevBtn.type = 'button';
	prevBtn.className = 'wp-block-playlist__control-btn';
	prevBtn.setAttribute( 'aria-label', previousLabel );
	prevBtn.setAttribute( 'title', previousLabel );
	prevBtn.innerHTML = ICON_PREV;

	// Shuffle and repeat are toggle buttons, so they carry aria-pressed as the
	// single source of truth for their on/off state — it both exposes the state
	// to assistive technology and drives the toggled-on styling (see the
	// [aria-pressed="true"] rule in style.scss). Prev/next are momentary
	// actions and get no aria-pressed.
	const shuffleBtn = doc.createElement( 'button' );
	shuffleBtn.type = 'button';
	shuffleBtn.className = 'wp-block-playlist__control-btn';
	shuffleBtn.setAttribute( 'aria-label', shuffleLabel );
	shuffleBtn.setAttribute( 'title', shuffleLabel );
	shuffleBtn.setAttribute( 'aria-pressed', String( isShuffled ) );
	shuffleBtn.innerHTML = ICON_SHUFFLE;

	const repeatBtn = doc.createElement( 'button' );
	repeatBtn.type = 'button';
	repeatBtn.className = 'wp-block-playlist__control-btn';
	repeatBtn.setAttribute( 'aria-label', repeatLabel );
	repeatBtn.setAttribute( 'title', repeatLabel );
	repeatBtn.setAttribute( 'aria-pressed', String( isRepeating ) );
	repeatBtn.innerHTML = ICON_REPEAT;

	const nextBtn = doc.createElement( 'button' );
	nextBtn.type = 'button';
	nextBtn.className = 'wp-block-playlist__control-btn';
	nextBtn.setAttribute( 'aria-label', nextLabel );
	nextBtn.setAttribute( 'title', nextLabel );
	nextBtn.innerHTML = ICON_NEXT;

	actionGroup.appendChild( prevBtn );
	actionGroup.appendChild( nextBtn );
	toggleGroup.appendChild( repeatBtn );
	toggleGroup.appendChild( shuffleBtn );
	controlsDiv.appendChild( actionGroup );
	controlsDiv.appendChild( toggleGroup );

	// The library's container has tabindex="0" and focuses itself on click,
	// which would steal keyboard focus from these controls. Stop the click
	// from bubbling to it so focus stays on the button that was activated.
	const onPrevClick = ( event ) => {
		event.stopPropagation();
		onPrev?.();
	};
	const onShuffleClick = ( event ) => {
		event.stopPropagation();
		const pressed = shuffleBtn.getAttribute( 'aria-pressed' ) !== 'true';
		shuffleBtn.setAttribute( 'aria-pressed', String( pressed ) );
		onShuffleToggle?.();
	};
	const onRepeatClick = ( event ) => {
		event.stopPropagation();
		const pressed = repeatBtn.getAttribute( 'aria-pressed' ) !== 'true';
		repeatBtn.setAttribute( 'aria-pressed', String( pressed ) );
		onRepeatToggle?.();
	};
	const onNextClick = ( event ) => {
		event.stopPropagation();
		onNext?.();
	};

	prevBtn.addEventListener( 'click', onPrevClick );
	shuffleBtn.addEventListener( 'click', onShuffleClick );
	repeatBtn.addEventListener( 'click', onRepeatClick );
	nextBtn.addEventListener( 'click', onNextClick );

	const footerDiv = getPlaylistFooter( container );
	footerDiv.prepend( controlsDiv );

	return {
		cleanup: () => {
			prevBtn.removeEventListener( 'click', onPrevClick );
			shuffleBtn.removeEventListener( 'click', onShuffleClick );
			repeatBtn.removeEventListener( 'click', onRepeatClick );
			nextBtn.removeEventListener( 'click', onNextClick );
			controlsDiv.remove();
			removeEmptyPlaylistFooter( footerDiv );
		},
	};
}

/**
 * Initialize a WaveformPlayer instance on an element.
 *
 * This is the shared core logic used by both the React component (editor)
 * and the Interactivity API (frontend).
 *
 * @param {Element}  element                 - The container element (must be in DOM).
 * @param {Object}   options                 - Configuration options.
 * @param {string}   options.src             - The audio file URL.
 * @param {string}   options.title           - The track title.
 * @param {string}   options.artist          - The artist name.
 * @param {string}   options.image           - The artwork image URL.
 * @param {string}   options.imageAlt        - The artwork image alt text.
 * @param {boolean}  options.autoPlay        - Whether to auto-play when ready.
 * @param {Function} options.onEnded         - Callback when track ends.
 * @param {Object}   options.labels          - Translated button labels.
 * @param {string}   options.waveformStyle   - Waveform style (bars, mirror, line, blocks, dots, seekbar).
 * @param {Function} options.onPrev          - Callback for previous track.
 * @param {Function} options.onNext          - Callback for next track.
 * @param {Function} options.onShuffleToggle - Callback for shuffle toggle.
 * @param {Function} options.onRepeatToggle  - Callback for repeat toggle.
 * @param {boolean}  options.isShuffled      - Initial shuffle state.
 * @param {boolean}  options.isRepeating     - Initial repeat state.
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
		onPrev,
		onNext,
		onShuffleToggle,
		onRepeatToggle,
		isShuffled,
		isRepeating,
	}
) {
	// Get colors from computed styles.
	const { textColor, waveformColor, progressColor } =
		getWaveformColors( element );
	const colorState = {
		textColor,
		waveformColor,
		progressColor,
	};

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
	let cleanupControls;
	let cleanupMetadata;
	let endedTimeoutId;
	const handlers = {
		ready: () => {
			applyPlayerColors( instance, container, colorState );
			setupPlayButtonArtwork( container, instance, image );
			cleanupMetadata = setupPlaylistMetadata( container, instance );
			cleanupAccessibility = setupPlayButtonAccessibility(
				container,
				labels
			);

			// Set up playlist controls if callbacks are provided.
			if ( onPrev || onNext || onShuffleToggle || onRepeatToggle ) {
				const controls = setupPlaylistControls(
					container,
					{ onPrev, onNext, onShuffleToggle, onRepeatToggle },
					isShuffled,
					isRepeating,
					labels
				);
				cleanupControls = controls.cleanup;
			}

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
		colorState,
		destroy: () => {
			cleanupAccessibility?.();
			cleanupControls?.();
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
