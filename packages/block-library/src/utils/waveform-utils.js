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
const SEEK_STEP_SECONDS = 5;
const SEEK_LARGE_STEP_SECONDS = 10;
const VOLUME_STEP = 0.1;
const VOLUME_LARGE_STEP = 0.2;

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
	container.setAttribute( 'data-text-color', buttonColor );
	container.setAttribute( 'data-text-secondary-color', buttonColor );
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
 * Set up waveform seek control accessibility.
 *
 * This is a shim over `@arraypress/waveform-player`, which does not expose the
 * waveform as a keyboard-operable slider with ARIA semantics. We add the
 * `slider` role and value attributes, make it focusable, mirror the bundled
 * keyboard shortcuts while focus is on the slider, and add common slider
 * shortcuts. Once the library exposes this natively, this can be reduced to
 * just localizing the accessible name.
 * See https://github.com/arraypress/waveform-player/issues/8.
 *
 * @param {Element} container         - The waveform player container element.
 * @param {Object}  instance          - The WaveformPlayer instance.
 * @param {Object}  options           - Accessibility options.
 * @param {string}  options.label     - Accessible label for the seek control.
 * @param {string}  options.valueText - Accessible value text template.
 * @return {Function|undefined} Cleanup function.
 */
export function setupSeekControlAccessibility(
	container,
	instance,
	{ label, valueText } = {}
) {
	const seekControl = container.querySelector( '.waveform-container' );
	const { audio } = instance;

	if ( ! seekControl || ! audio ) {
		return;
	}

	// Position overlays. The playhead marks the current position while the
	// slider has keyboard focus; the hover indicator previews the spot a click
	// would seek to. Visibility is driven by CSS (`:focus-visible` and the
	// `is-seek-hovering` class) — here we only build and position them.
	const createOverlay = ( className ) => {
		const bar = document.createElement( 'div' );
		bar.className = className;
		bar.setAttribute( 'aria-hidden', 'true' );
		const tooltip = document.createElement( 'span' );
		tooltip.className = 'waveform-seek-tooltip';
		bar.appendChild( tooltip );
		seekControl.appendChild( bar );
		return { bar, tooltip };
	};
	const playhead = createOverlay( 'waveform-seek-playhead' );
	const hover = createOverlay( 'waveform-seek-hover' );
	let isPlaying = ! audio.paused;
	let playheadTime = 0;
	let shouldRedirectContainerFocus = false;

	const positionOverlay = ( overlay, seconds, duration ) => {
		const ratio = duration
			? Math.min( 1, Math.max( 0, seconds ) / duration )
			: 0;
		overlay.bar.style.left = `${ ratio * 100 }%`;
		overlay.tooltip.textContent = formatTimestamp( seconds );
	};

	const updateSeekControl = ( {
		syncPlayhead = isPlaying,
		currentTimeOverride,
		// The announced value attributes (aria-valuenow/valuetext) are only
		// refreshed for discrete events — a user seek, metadata load, or the
		// slider gaining focus (default true). Passive playback ticks pass
		// `false`: the value must not change continuously, because browser
		// focus lingers on the slider after a screen reader's virtual cursor
		// moves away, and any value change on a focused slider is announced.
		syncAria = true,
	} = {} ) => {
		const duration = getFiniteTime( audio.duration );
		const currentTime = Math.min(
			getFiniteTime( currentTimeOverride ?? audio.currentTime ),
			duration
		);
		if ( syncPlayhead ) {
			playheadTime = currentTime;
		}

		if ( syncAria ) {
			seekControl.setAttribute( 'aria-valuemax', String( duration ) );
			seekControl.setAttribute( 'aria-valuenow', String( currentTime ) );
			seekControl.setAttribute(
				'aria-valuetext',
				formatSeekValueText(
					valueText,
					formatTimestamp( currentTime ),
					formatTimestamp( duration )
				)
			);
		}

		positionOverlay( playhead, playheadTime, duration );
	};

	seekControl.setAttribute( 'tabindex', '0' );
	seekControl.setAttribute( 'role', 'slider' );
	seekControl.setAttribute( 'aria-label', getSeekControlLabel( label ) );
	seekControl.setAttribute( 'aria-valuemin', '0' );
	updateSeekControl();

	const originalOnTimeUpdate = instance.options.onTimeUpdate;
	const onTimeUpdate = ( currentTime, duration, player ) => {
		updateSeekControl( {
			syncPlayhead: true,
			currentTimeOverride: currentTime,
			// Never announce during passive playback (see syncAria above); the
			// playhead overlay still tracks the position visually.
			syncAria: false,
		} );
		originalOnTimeUpdate?.( currentTime, duration, player );
	};
	instance.options.onTimeUpdate = onTimeUpdate;

	// Refresh the announced value when focus lands on the slider, so a screen
	// reader reads the live position rather than a stale one left over from
	// before playback advanced while unfocused.
	const onSeekFocus = () => {
		updateSeekControl( { syncPlayhead: false } );
	};

	const seekTo = ( seconds ) => {
		playheadTime = Math.max(
			0,
			Math.min( getFiniteTime( audio.duration ), seconds )
		);
		instance.seekTo( playheadTime );
		updateSeekControl( {
			syncPlayhead: false,
			currentTimeOverride: playheadTime,
		} );
	};

	const seekToPercent = ( percent ) => {
		const normalizedPercent = Math.min( 1, Math.max( 0, percent ) );
		playheadTime = getFiniteTime( audio.duration ) * normalizedPercent;
		instance.seekToPercent?.( normalizedPercent );
		updateSeekControl( {
			syncPlayhead: false,
			currentTimeOverride: playheadTime,
		} );
	};

	const onKeyDown = ( event ) => {
		const currentTime = getFiniteTime( audio.currentTime );
		const duration = getFiniteTime( audio.duration );
		const seekStep = event.shiftKey
			? SEEK_LARGE_STEP_SECONDS
			: SEEK_STEP_SECONDS;
		const volumeStep = event.shiftKey ? VOLUME_LARGE_STEP : VOLUME_STEP;
		const actions = {
			// Mirror the bundled WaveformPlayer keyboard shortcuts when focus is
			// on our slider instead of the wrapper the library listens to.
			' ': () => instance.togglePlay?.(),
			ArrowLeft: () => seekTo( currentTime - seekStep ),
			ArrowRight: () => seekTo( currentTime + seekStep ),
			ArrowUp: () =>
				instance.setVolume?.(
					Math.min( 1, audio.volume + volumeStep )
				),
			ArrowDown: () =>
				instance.setVolume?.(
					Math.max( 0, audio.volume - volumeStep )
				),
			m: () => {
				audio.muted = ! audio.muted;
			},
			M: () => {
				audio.muted = ! audio.muted;
			},
			// Add standard slider shortcuts that the bundled player lacks.
			PageDown: () => seekTo( currentTime - SEEK_LARGE_STEP_SECONDS ),
			PageUp: () => seekTo( currentTime + SEEK_LARGE_STEP_SECONDS ),
			Home: () => seekTo( 0 ),
			End: () => seekTo( duration ),
		};

		if ( event.key >= '0' && event.key <= '9' ) {
			event.preventDefault();
			seekToPercent( parseInt( event.key, 10 ) / 10 );
			return;
		}

		if ( ! actions[ event.key ] ) {
			return;
		}

		event.preventDefault();
		actions[ event.key ]();
	};

	const onContainerClickCapture = ( event ) => {
		shouldRedirectContainerFocus = seekControl.contains( event.target );
	};

	const onContainerClick = ( event ) => {
		container.setAttribute( 'tabindex', '-1' );

		if ( ! seekControl.contains( event.target ) ) {
			shouldRedirectContainerFocus = false;
			return;
		}

		seekControl.focus();
		const seconds = getPointedSeconds( event );
		if ( seconds !== undefined ) {
			playheadTime = seconds;
			updateSeekControl( {
				syncPlayhead: false,
				currentTimeOverride: playheadTime,
			} );
		}
		shouldRedirectContainerFocus = false;
	};

	// The library focuses the outer wrapper on click and can leave it in the
	// tab order. Redirect focus onto the accessible slider only when the click
	// that caused wrapper focus originated in the waveform seek control.
	const onContainerFocusIn = ( event ) => {
		if ( event.target === container && shouldRedirectContainerFocus ) {
			seekControl.focus();
			shouldRedirectContainerFocus = false;
		}
	};

	const getPointedSeconds = ( event ) => {
		const rect = seekControl.getBoundingClientRect();
		if ( ! rect.width ) {
			return;
		}
		const duration = getFiniteTime( audio.duration );
		const ratio = Math.min(
			1,
			Math.max( 0, ( event.clientX - rect.left ) / rect.width )
		);
		return ratio * duration;
	};

	const onPointerMove = ( event ) => {
		const seconds = getPointedSeconds( event );
		if ( seconds === undefined ) {
			return;
		}
		const duration = getFiniteTime( audio.duration );
		positionOverlay( hover, seconds, duration );
		seekControl.classList.add( 'is-seek-hovering' );
	};

	const onPointerLeave = () => {
		seekControl.classList.remove( 'is-seek-hovering' );
	};

	const onPlay = () => {
		isPlaying = true;
		// Keep the playhead overlay and internal state current, but don't
		// announce — only focus and user seeks should speak (see syncAria).
		updateSeekControl( { syncAria: false } );
	};
	const onPause = () => {
		isPlaying = false;
	};
	const onEnded = () => {
		isPlaying = false;
		playheadTime = 0;
		updateSeekControl( {
			syncPlayhead: false,
			currentTimeOverride: playheadTime,
			syncAria: false,
		} );
	};

	seekControl.addEventListener( 'focus', onSeekFocus );
	seekControl.addEventListener( 'keydown', onKeyDown );
	container.addEventListener( 'click', onContainerClickCapture, true );
	container.addEventListener( 'click', onContainerClick );
	container.addEventListener( 'focusin', onContainerFocusIn );
	seekControl.addEventListener( 'pointermove', onPointerMove );
	seekControl.addEventListener( 'pointerleave', onPointerLeave );
	container.addEventListener( 'waveformplayer:play', onPlay );
	container.addEventListener( 'waveformplayer:pause', onPause );
	container.addEventListener( 'waveformplayer:ended', onEnded );
	audio.addEventListener( 'durationchange', updateSeekControl );
	audio.addEventListener( 'loadedmetadata', updateSeekControl );

	return () => {
		seekControl.removeEventListener( 'focus', onSeekFocus );
		seekControl.removeEventListener( 'keydown', onKeyDown );
		container.removeEventListener( 'click', onContainerClickCapture, true );
		container.removeEventListener( 'click', onContainerClick );
		container.removeEventListener( 'focusin', onContainerFocusIn );
		seekControl.removeEventListener( 'pointermove', onPointerMove );
		seekControl.removeEventListener( 'pointerleave', onPointerLeave );
		container.removeEventListener( 'waveformplayer:play', onPlay );
		container.removeEventListener( 'waveformplayer:pause', onPause );
		container.removeEventListener( 'waveformplayer:ended', onEnded );
		audio.removeEventListener( 'durationchange', updateSeekControl );
		audio.removeEventListener( 'loadedmetadata', updateSeekControl );
		playhead.bar.remove();
		hover.bar.remove();
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
	const seekControl = instance?.container?.querySelector(
		'.waveform-container'
	);

	if ( seekControl ) {
		seekControl.setAttribute( 'aria-label', getSeekControlLabel( label ) );
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
		waveformStyle,
	} );
	element.appendChild( container );

	// Initialize the WaveformPlayer library.
	const instance = new WaveformPlayerLib( container );

	// Set up event handlers.
	const cleanupSeekControlAccessibility = setupSeekControlAccessibility(
		container,
		instance,
		{
			label: labels?.seek || title,
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
			cleanupSeekControlAccessibility?.();
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
