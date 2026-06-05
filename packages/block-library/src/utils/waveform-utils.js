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
const DEFAULT_WAVEFORM_HEIGHT = 100;
const DEFAULT_SEEK_LABEL = 'Seek';
export const WAVEFORM_BUTTON_WIDTH = 100;

/**
 * Format a time in seconds to a "m:ss" string.
 *
 * @param {number} seconds - The time in seconds.
 * @return {string} The formatted time string.
 */
export function formatTime( seconds ) {
	const mins = Math.floor( seconds / 60 );
	const secs = Math.floor( seconds % 60 );
	return `${ mins }:${ String( secs ).padStart( 2, '0' ) }`;
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

	const onPlay = () => playBtn.setAttribute( 'aria-label', pauseLabel );
	const onPause = () => playBtn.setAttribute( 'aria-label', playLabel );

	container.addEventListener( 'waveformplayer:play', onPlay );
	container.addEventListener( 'waveformplayer:pause', onPause );
	container.addEventListener( 'waveformplayer:ended', onPause );

	return () => {
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
 * Compute a hover color by increasing the alpha channel.
 *
 * @param {string} color      - The original rgba color string.
 * @param {number} alphaBoost - The amount to increase alpha by.
 * @return {string} The adjusted color as an rgba string.
 */
function getHoverColor( color, alphaBoost = 0.2 ) {
	const parsed = colord( color );
	if ( ! parsed.isValid() ) {
		return color;
	}
	const { r, g, b, a } = parsed.toRgb();
	const newAlpha = Math.min( a + alphaBoost, 1 );
	return colord( { r, g, b, a: newAlpha } ).toRgbString();
}

/**
 * Set up hover effect on the waveform bars area.
 * On mouseenter, increases bar color intensity; on mouseleave, restores.
 *
 * @param {Object}  instance      - The WaveformPlayer library instance.
 * @param {Element} container     - The waveform container element.
 * @param {string}  waveformColor - The original waveform bar color.
 * @param {string}  progressColor - The original progress bar color.
 * @return {Function} Cleanup function to remove listeners.
 */
function setupWaveformHover(
	instance,
	container,
	waveformColor,
	progressColor
) {
	const waveformArea = container.querySelector( '.waveform-container' );
	if ( ! waveformArea ) {
		return () => {};
	}

	const hoverWaveformColor = getHoverColor( waveformColor );
	const hoverProgressColor = getHoverColor( progressColor );

	const onMouseEnter = () => {
		instance.options.waveformColor = hoverWaveformColor;
		instance.options.progressColor = hoverProgressColor;
		instance.drawWaveform();
	};

	const onMouseLeave = () => {
		instance.options.waveformColor = waveformColor;
		instance.options.progressColor = progressColor;
		instance.drawWaveform();
	};

	waveformArea.addEventListener( 'mouseenter', onMouseEnter );
	waveformArea.addEventListener( 'mouseleave', onMouseLeave );

	return () => {
		waveformArea.removeEventListener( 'mouseenter', onMouseEnter );
		waveformArea.removeEventListener( 'mouseleave', onMouseLeave );
	};
}

// SVG paths for playlist control icons (24x24 viewBox).
const ICON_PREV = 'M6 6h2v12H6zm3.5 6l8.5 6V6z';
const ICON_NEXT = 'M6 18l8.5-6L6 6v12zm10-12v12h2V6z';
const ICON_SHUFFLE =
	'M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z';
const ICON_REPEAT =
	'M17 2l4 4-4 4V7H7a3 3 0 0 0-3 3v1H2v-1a5 5 0 0 1 5-5h10V2zM7 22l-4-4 4-4v3h10a3 3 0 0 0 3-3v-1h2v1a5 5 0 0 1-5 5H7v3z';

/**
 * Create an SVG icon element.
 *
 * @param {Document} ownerDocument - The document used to create the nodes.
 * @param {string}   pathD         - The SVG path d attribute.
 * @return {SVGElement} The SVG element.
 */
function createSvgIcon( ownerDocument, pathD ) {
	const svg = ownerDocument.createElementNS(
		'http://www.w3.org/2000/svg',
		'svg'
	);
	svg.setAttribute( 'viewBox', '0 0 24 24' );
	svg.setAttribute( 'width', '16' );
	svg.setAttribute( 'height', '16' );
	// Decorative icon: the parent control button carries the aria-label.
	// Matches the @wordpress/primitives SVG default (aria-hidden +
	// focusable="false").
	svg.setAttribute( 'aria-hidden', 'true' );
	svg.setAttribute( 'focusable', 'false' );
	const path = ownerDocument.createElementNS(
		'http://www.w3.org/2000/svg',
		'path'
	);
	path.setAttribute( 'fill', 'currentColor' );
	path.setAttribute( 'd', pathD );
	svg.appendChild( path );
	return svg;
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
 * Create playlist control buttons (prev, shuffle, repeat, next) and insert
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
 * @return {Object} Object with setShuffled function and cleanup function.
 */
function setupPlaylistControls(
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

	const prevBtn = doc.createElement( 'button' );
	prevBtn.className = 'wp-block-playlist__control-btn';
	prevBtn.setAttribute( 'aria-label', previousLabel );
	prevBtn.appendChild( createSvgIcon( doc, ICON_PREV ) );

	const shuffleBtn = doc.createElement( 'button' );
	shuffleBtn.className = 'wp-block-playlist__control-btn';
	shuffleBtn.setAttribute( 'aria-label', shuffleLabel );
	if ( isShuffled ) {
		shuffleBtn.classList.add( 'is-active' );
	}
	shuffleBtn.appendChild( createSvgIcon( doc, ICON_SHUFFLE ) );

	const repeatBtn = doc.createElement( 'button' );
	repeatBtn.className = 'wp-block-playlist__control-btn';
	repeatBtn.setAttribute( 'aria-label', repeatLabel );
	if ( isRepeating ) {
		repeatBtn.classList.add( 'is-active' );
	}
	repeatBtn.appendChild( createSvgIcon( doc, ICON_REPEAT ) );

	const nextBtn = doc.createElement( 'button' );
	nextBtn.className = 'wp-block-playlist__control-btn';
	nextBtn.setAttribute( 'aria-label', nextLabel );
	nextBtn.appendChild( createSvgIcon( doc, ICON_NEXT ) );

	controlsDiv.appendChild( prevBtn );
	controlsDiv.appendChild( shuffleBtn );
	controlsDiv.appendChild( repeatBtn );
	controlsDiv.appendChild( nextBtn );

	const onPrevClick = () => onPrev?.();
	const onShuffleClick = () => {
		shuffleBtn.classList.toggle( 'is-active' );
		onShuffleToggle?.();
	};
	const onRepeatClick = () => {
		repeatBtn.classList.toggle( 'is-active' );
		onRepeatToggle?.();
	};
	const onNextClick = () => onNext?.();

	prevBtn.addEventListener( 'click', onPrevClick );
	shuffleBtn.addEventListener( 'click', onShuffleClick );
	repeatBtn.addEventListener( 'click', onRepeatClick );
	nextBtn.addEventListener( 'click', onNextClick );

	const footerDiv = getPlaylistFooter( container );
	footerDiv.prepend( controlsDiv );

	return {
		setShuffled: ( shuffled ) => {
			shuffleBtn.classList.toggle( 'is-active', shuffled );
		},
		setRepeating: ( repeating ) => {
			repeatBtn.classList.toggle( 'is-active', repeating );
		},
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
	let cleanupHover;
	let cleanupControls;
	let cleanupMetadata;
	const handlers = {
		ready: () => {
			styleSvgIcons( container, textColor );
			setupPlayButtonArtwork( container, instance, image );
			cleanupMetadata = setupPlaylistMetadata( container, instance );
			cleanupAccessibility = setupPlayButtonAccessibility(
				container,
				labels
			);
			cleanupHover = setupWaveformHover(
				instance,
				container,
				waveformColor,
				progressColor
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
		ended: () => onEnded?.( instance ),
	};

	container.addEventListener( 'waveformplayer:ready', handlers.ready );
	container.addEventListener( 'waveformplayer:ended', handlers.ended );

	// Return instance, container, and cleanup function.
	return {
		instance,
		container,
		destroy: () => {
			cleanupAccessibility?.();
			cleanupHover?.();
			cleanupControls?.();
			cleanupMetadata?.();
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
