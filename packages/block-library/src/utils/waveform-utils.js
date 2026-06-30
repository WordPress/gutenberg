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
const DEFAULT_SEEK_VALUE_TEXT = '%1$s of %2$s';
const DEFAULT_WAVEFORM_BACKGROUND_COLOR = '#ffffff';

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
 * Get the icon color that contrasts with the play button background.
 *
 * @param {string} buttonColor - The play button background color.
 * @return {string} The icon color.
 */
function getButtonIconColor( buttonColor ) {
	return colord( buttonColor ).isDark() ? '#ffffff' : '#000000';
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
	let backgroundColor = getComputedStyle( element ).backgroundColor;
	let backgroundNode = element.parentElement;

	while (
		colord( backgroundColor ).alpha() === 0 &&
		backgroundNode instanceof element.ownerDocument.defaultView.Element
	) {
		backgroundColor = getComputedStyle( backgroundNode ).backgroundColor;
		backgroundNode = backgroundNode.parentElement;
	}

	if ( colord( backgroundColor ).alpha() === 0 ) {
		backgroundColor = DEFAULT_WAVEFORM_BACKGROUND_COLOR;
	}

	return { textColor, waveformColor, progressColor, backgroundColor };
}

/**
 * Create a waveform container element with the specified attributes.
 *
 * @param {Object} options                 - The options for the container.
 * @param {string} options.url             - The audio URL.
 * @param {string} options.title           - The track title.
 * @param {string} options.artist          - The track artist.
 * @param {string} options.artwork         - The album artwork URL.
 * @param {string} options.waveformColor   - The waveform bar color.
 * @param {string} options.progressColor   - The progress indicator color.
 * @param {string} options.buttonColor     - The play button color.
 * @param {string} options.backgroundColor - The waveform background color.
 * @param {string} options.seekLabel       - Accessible label for the seek control.
 * @param {number} options.height          - The waveform height in pixels.
 * @param {string} options.waveformStyle   - The visualization style (bars, mirror, line, blocks, dots, seekbar).
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
	backgroundColor = DEFAULT_WAVEFORM_BACKGROUND_COLOR,
	seekLabel,
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
	container.setAttribute( 'data-background-color', backgroundColor );
	container.setAttribute(
		'data-seek-label',
		getSeekControlLabel( seekLabel )
	);
	container.setAttribute( 'data-text-color', buttonColor );
	container.setAttribute( 'data-text-secondary-color', buttonColor );
	container.style.setProperty(
		'--wp--playlist--waveform-bar-color',
		waveformColor
	);
	container.style.setProperty(
		'--wp--playlist--waveform-background-color',
		backgroundColor
	);
	container.style.setProperty(
		'--wp--playlist--waveform-button-background-color',
		buttonColor
	);
	container.style.setProperty(
		'--wp--playlist--waveform-button-icon-color',
		getButtonIconColor( buttonColor )
	);
	if ( title ) {
		container.setAttribute( 'data-title', title );
	}
	if ( artist ) {
		container.setAttribute( 'data-subtitle', artist );
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
	const iconColor = getButtonIconColor( buttonColor );

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
 * Format a duration in seconds as a human-readable timestamp.
 *
 * @param {number} seconds - Time in seconds.
 * @return {string} Formatted timestamp.
 */
function formatTimestamp( seconds ) {
	// Round rather than floor: media durations are often fractional (e.g.
	// 11.999s), and flooring would announce them as one second short.
	const normalizedSeconds = Math.max( 0, Math.round( seconds || 0 ) );
	const hours = Math.floor( normalizedSeconds / 3600 );
	const minutes = Math.floor( ( normalizedSeconds % 3600 ) / 60 );
	const remainingSeconds = normalizedSeconds % 60;
	const paddedSeconds = String( remainingSeconds ).padStart( 2, '0' );

	if ( hours ) {
		return `${ hours }:${ String( minutes ).padStart(
			2,
			'0'
		) }:${ paddedSeconds }`;
	}

	return `${ minutes }:${ paddedSeconds }`;
}

/**
 * Get a finite audio time value.
 *
 * @param {number} value - Time value.
 * @return {number} The normalized time value.
 */
function getFiniteTime( value ) {
	return Number.isFinite( value ) ? Math.max( 0, value ) : 0;
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
 * Format the accessible seek value text.
 *
 * @param {string} template    - Value text template.
 * @param {string} currentTime - Current audio time.
 * @param {string} duration    - Total audio duration.
 * @return {string} Formatted seek value text.
 */
function formatSeekValueText( template, currentTime, duration ) {
	const args = [ currentTime, duration ];
	let sequentialIndex = 0;
	// Substitute both positional (%1$s/%2$s) and non-positional (%s)
	// placeholders, replacing every occurrence, so any printf-style
	// translation of the template resolves the same way PHP sprintf would.
	return ( template || DEFAULT_SEEK_VALUE_TEXT ).replace(
		/%(?:(\d+)\$)?s/g,
		( match, position ) => {
			const index = position ? Number( position ) - 1 : sequentialIndex++;
			return args[ index ] ?? match;
		}
	);
}

/**
 * Localize the library-owned waveform seek control.
 *
 * `@arraypress/waveform-player` exposes `.waveform-container` as a keyboard
 * operable ARIA slider. Gutenberg only layers on translation support for the
 * accessible label and value text.
 *
 * @param {Element} container         - The waveform player container element.
 * @param {Object}  instance          - The WaveformPlayer instance.
 * @param {Object}  options           - Localization options.
 * @param {string}  options.label     - Accessible label for the seek control.
 * @param {string}  options.valueText - Accessible value text template.
 * @return {Function|undefined} Cleanup function.
 */
export function setupSeekControlLocalization(
	container,
	instance,
	{ label, valueText } = {}
) {
	const seekControl = container.querySelector( '.waveform-container' );
	const { audio } = instance;

	if ( ! seekControl ) {
		return;
	}

	const updateSeekValueText = ( currentTimeOverride, durationOverride ) => {
		const duration = getFiniteTime( durationOverride ?? audio?.duration );
		const currentTime = Math.min(
			getFiniteTime( currentTimeOverride ?? audio?.currentTime ),
			duration
		);
		seekControl.setAttribute(
			'aria-valuetext',
			formatSeekValueText(
				valueText,
				formatTimestamp( currentTime ),
				formatTimestamp( duration )
			)
		);
	};

	updateSeekControlLabel( instance, label );
	updateSeekValueText();

	const originalOnTimeUpdate = instance.options.onTimeUpdate;
	const onTimeUpdate = ( currentTime, duration, player ) => {
		updateSeekValueText( currentTime, duration );
		originalOnTimeUpdate?.( currentTime, duration, player );
	};
	instance.options.onTimeUpdate = onTimeUpdate;

	const onMetadataChange = () => updateSeekValueText();
	const onEnded = () => updateSeekValueText( 0, audio?.duration );

	audio?.addEventListener( 'durationchange', onMetadataChange );
	audio?.addEventListener( 'loadedmetadata', onMetadataChange );
	container.addEventListener( 'waveformplayer:ended', onEnded );

	return () => {
		audio?.removeEventListener( 'durationchange', onMetadataChange );
		audio?.removeEventListener( 'loadedmetadata', onMetadataChange );
		container.removeEventListener( 'waveformplayer:ended', onEnded );
		if ( instance.options.onTimeUpdate === onTimeUpdate ) {
			instance.options.onTimeUpdate = originalOnTimeUpdate;
		}
	};
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
 * @param {boolean}  options.autoPlay      - Whether to auto-play when ready.
 * @param {Function} options.onEnded       - Callback when track ends.
 * @param {Object}   options.labels        - Translated button labels.
 * @param {string}   options.waveformStyle - Waveform style (bars, mirror, line, blocks, dots, seekbar).
 * @return {Object} Object with instance, container, and destroy function.
 */
export function initWaveformPlayer(
	element,
	{ src, title, artist, image, autoPlay, onEnded, labels, waveformStyle }
) {
	// Get colors from computed styles.
	const { textColor, waveformColor, progressColor, backgroundColor } =
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
		backgroundColor,
		seekLabel: title || labels?.seek,
		waveformStyle,
	} );
	element.appendChild( container );

	// Initialize the WaveformPlayer library.
	const instance = new WaveformPlayerLib( container );

	// Set up event handlers.
	const cleanupSeekControlLocalization = setupSeekControlLocalization(
		container,
		instance,
		{
			label: title || labels?.seek,
			valueText: labels?.seekValueText,
		}
	);
	let cleanupPlayButtonAccessibility;
	const handlers = {
		ready: () => {
			styleSvgIcons( container, textColor );
			cleanupPlayButtonAccessibility = setupPlayButtonAccessibility(
				container,
				labels
			);
			if ( autoPlay ) {
				instance.play()?.catch( logPlayError );
			}
		},
		ended: () => onEnded?.(),
	};

	container.addEventListener( 'waveformplayer:ready', handlers.ready );
	container.addEventListener( 'waveformplayer:ended', handlers.ended );

	// Return instance, container, and cleanup function.
	return {
		instance,
		container,
		destroy: () => {
			cleanupPlayButtonAccessibility?.();
			cleanupSeekControlLocalization?.();
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
