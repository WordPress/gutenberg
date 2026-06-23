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

/**
 * Format a time in seconds to a "m:ss" string.
 *
 * @param {number} seconds - The time in seconds.
 * @return {string} The formatted time string.
 */
export function formatTime( seconds ) {
	const time = Number.isFinite( seconds ) && seconds > 0 ? seconds : 0;
	const mins = Math.floor( time / 60 );
	const secs = Math.floor( time % 60 );
	return `${ mins }:${ String( secs ).padStart( 2, '0' ) }`;
}

/**
 * Parse a formatted time string to seconds.
 *
 * @param {string} time - Formatted time string, such as "3:10" or "1:02:30".
 * @return {number|null} Time in seconds, or null when invalid.
 */
export function parseTime( time ) {
	if ( typeof time !== 'string' || ! time.includes( ':' ) ) {
		return null;
	}

	const parts = time.split( ':' ).map( Number );
	if (
		parts.length < 2 ||
		parts.length > 3 ||
		parts.some( ( part ) => ! Number.isFinite( part ) || part < 0 )
	) {
		return null;
	}

	return parts.reduce( ( total, part ) => total * 60 + part, 0 );
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
	const backgroundColor = getBackgroundColor( element, textColor );
	const waveformColor = colord( textColor ).alpha( 0.3 ).toRgbString();
	const progressColor = colord( backgroundColor ).alpha( 0.3 ).toRgbString();

	return { textColor, waveformColor, progressColor };
}

/**
 * Get the nearest opaque background color for an element.
 *
 * @param {Element} element   - The element to inspect.
 * @param {string}  textColor - The text color used to infer a fallback.
 * @return {string} The resolved background color.
 */
function getBackgroundColor( element, textColor ) {
	let currentElement = element;

	while ( currentElement ) {
		const backgroundColor =
			getComputedStyle( currentElement ).backgroundColor;
		const parsedBackgroundColor = colord( backgroundColor );

		if ( parsedBackgroundColor.toRgb().a > 0 ) {
			return parsedBackgroundColor.alpha( 1 ).toRgbString();
		}

		currentElement = currentElement.parentElement;
	}

	return colord( textColor ).isDark() ? '#ffffff' : '#000000';
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
 * Check whether an audio duration can be used for marker positioning.
 *
 * @param {number} duration - The audio duration.
 * @return {boolean} Whether the duration is usable.
 */
function hasDuration( duration ) {
	return Number.isFinite( duration ) && duration > 0;
}

/**
 * Clamp a number to the supplied range.
 *
 * @param {number} value - The value to clamp.
 * @param {number} min   - The minimum value.
 * @param {number} max   - The maximum value.
 * @return {number} The clamped value.
 */
function clamp( value, min, max ) {
	return Math.max( min, Math.min( max, value ) );
}

/**
 * Convert a color to the same RGB color without transparency.
 *
 * @param {string} color - The source color.
 * @return {string} The color with full alpha.
 */
function toOpaqueColor( color ) {
	return colord( color ).alpha( 1 ).toRgbString();
}

/**
 * Get a 2D canvas context when available.
 *
 * @param {HTMLCanvasElement} canvas - The canvas element.
 * @return {CanvasRenderingContext2D|null} The canvas context.
 */
function getCanvasContext( canvas ) {
	try {
		return canvas.getContext?.( '2d' ) ?? null;
	} catch {
		return null;
	}
}

/**
 * Create a positioned timestamp marker for the waveform.
 *
 * @param {Document} documentRef - Document used to create elements.
 * @param {string}   type        - Marker type class suffix.
 * @return {Element} The marker element.
 */
function createTimeMarker( documentRef, type ) {
	const marker = documentRef.createElement( 'button' );
	marker.className = `waveform-marker wp-block-playlist__time-marker wp-block-playlist__time-marker--${ type }`;
	marker.setAttribute( 'aria-hidden', 'true' );
	marker.tabIndex = -1;

	const label = documentRef.createElement( 'span' );
	label.className = 'waveform-marker-tooltip';
	marker.appendChild( label );

	return marker;
}

/**
 * Set a marker's position and label.
 *
 * @param {Element} marker  - The marker element.
 * @param {number}  percent - Marker position between 0 and 1.
 * @param {string}  label   - Marker label.
 */
function setTimeMarker( marker, percent, label ) {
	const position = clamp( percent, 0, 1 );

	marker.style.left = `${ position * 100 }%`;
	marker.querySelector( '.waveform-marker-tooltip' ).textContent = label;
	marker.classList.add( 'is-visible' );

	if ( position < 0.05 ) {
		marker.style.setProperty(
			'--wp-playlist-time-marker-label-offset',
			'0'
		);
	} else {
		marker.style.setProperty(
			'--wp-playlist-time-marker-label-offset',
			'calc(-100% - 0.35rem)'
		);
	}
}

/**
 * Set up current, hover, and duration timestamp markers on the waveform.
 *
 * @param {Object}  instance  - The WaveformPlayer library instance.
 * @param {Element} container - The waveform container element.
 * @return {Function} Cleanup function to remove listeners and marker elements.
 */
export function setupWaveformTimeMarkers( instance, container ) {
	const waveformArea = container.querySelector( '.waveform-container' );
	const markersContainer = container.querySelector( '.waveform-markers' );

	if ( ! waveformArea || ! markersContainer || ! instance?.audio ) {
		return () => {};
	}

	const documentRef = container.ownerDocument;
	const progressRegion = documentRef.createElement( 'div' );
	progressRegion.className = 'wp-block-playlist__waveform-progress-region';
	waveformArea.prepend( progressRegion );

	const hoverRegion = documentRef.createElement( 'div' );
	hoverRegion.className = 'wp-block-playlist__waveform-hover-region';
	waveformArea.prepend( hoverRegion );

	const hoverCanvas = documentRef.createElement( 'canvas' );
	hoverCanvas.className = 'wp-block-playlist__waveform-hover-canvas';
	hoverCanvas.setAttribute( 'aria-hidden', 'true' );
	waveformArea.append( hoverCanvas );

	const currentMarker = createTimeMarker( documentRef, 'current' );
	const endMarker = createTimeMarker( documentRef, 'end' );
	const hoverMarker = createTimeMarker( documentRef, 'hover' );
	let hoverPercent = null;
	let hideHoverMarkerTimeout;

	markersContainer.append( currentMarker, endMarker, hoverMarker );

	const ensureTimeMarkers = () => {
		[ currentMarker, endMarker, hoverMarker ].forEach( ( marker ) => {
			if ( ! marker.parentElement ) {
				markersContainer.append( marker );
			}
		} );
	};

	const getDuration = () => {
		if ( hasDuration( instance.audio.duration ) ) {
			return instance.audio.duration;
		}

		const fallbackDuration = instance.options.durationFallback;

		return hasDuration( fallbackDuration ) ? fallbackDuration : null;
	};

	const getMarkerColor = () => {
		return (
			instance.options.buttonColor ||
			instance.options.waveformColor ||
			instance.options.progressColor
		);
	};

	const getSectionMarkerColor = ( percent, progress ) => {
		const color =
			percent <= progress
				? instance.options.progressColor || getMarkerColor()
				: instance.options.waveformColor || getMarkerColor();

		return toOpaqueColor( color );
	};

	const clearHoverWaveform = () => {
		hoverCanvas.style.clipPath = 'inset(0 100% 0 0)';

		const context = getCanvasContext( hoverCanvas );
		context?.clearRect( 0, 0, hoverCanvas.width, hoverCanvas.height );
	};

	const updateHoverWaveform = ( percent ) => {
		const sourceCanvas = instance.canvas;

		hoverCanvas.style.clipPath = `inset(0 ${ ( 1 - percent ) * 100 }% 0 0)`;

		if ( ! sourceCanvas ) {
			return;
		}

		const width = sourceCanvas.width;
		const height = sourceCanvas.height;
		const context = getCanvasContext( hoverCanvas );

		if ( ! width || ! height || ! context ) {
			return;
		}

		if ( hoverCanvas.width !== width ) {
			hoverCanvas.width = width;
		}
		if ( hoverCanvas.height !== height ) {
			hoverCanvas.height = height;
		}

		try {
			context.clearRect( 0, 0, width, height );
			context.drawImage( sourceCanvas, 0, 0 );

			const imageData = context.getImageData( 0, 0, width, height );
			const { data } = imageData;

			for ( let index = 3; index < data.length; index += 4 ) {
				if ( data[ index ] > 0 ) {
					data[ index ] = 255;
				}
			}

			context.putImageData( imageData, 0, 0 );
		} catch {
			context.clearRect( 0, 0, width, height );
		}
	};

	const updateTimeMarkers = () => {
		const durationSeconds = getDuration();
		const currentTime = Number.isFinite( instance.audio.currentTime )
			? instance.audio.currentTime
			: 0;
		const progress = durationSeconds
			? clamp( currentTime / durationSeconds, 0, 1 )
			: 0;

		currentMarker.style.color = durationSeconds
			? getSectionMarkerColor( progress, progress )
			: toOpaqueColor( instance.options.waveformColor );
		endMarker.style.color = getSectionMarkerColor( 1, progress );
		progressRegion.style.backgroundColor = toOpaqueColor(
			instance.options.buttonColor
		);
		progressRegion.style.width = `${ progress * 100 }%`;
		ensureTimeMarkers();

		if ( hoverPercent !== null ) {
			updateHoverWaveform( hoverPercent );
		}

		if ( ! durationSeconds ) {
			setTimeMarker( currentMarker, 0, formatTime( currentTime ) );
			endMarker.classList.remove( 'is-visible' );
			return;
		}

		setTimeMarker(
			currentMarker,
			progress,
			formatTime( clamp( currentTime, 0, durationSeconds ) )
		);
		setTimeMarker( endMarker, 1, formatTime( durationSeconds ) );
	};

	const updateHoverMarker = ( event ) => {
		const durationSeconds = getDuration();

		if ( ! durationSeconds ) {
			return;
		}

		const rect = waveformArea.getBoundingClientRect();
		const percent = clamp(
			( event.clientX - rect.left ) / rect.width,
			0,
			1
		);
		const currentTime = Number.isFinite( instance.audio.currentTime )
			? instance.audio.currentTime
			: 0;
		const progress = clamp( currentTime / durationSeconds, 0, 1 );

		hoverPercent = percent;
		waveformArea.classList.add( 'is-hovering' );
		hoverRegion.style.width = `${ percent * 100 }%`;
		hoverMarker.style.color = getSectionMarkerColor( percent, progress );
		updateHoverWaveform( percent );
		ensureTimeMarkers();
		setTimeMarker(
			hoverMarker,
			percent,
			formatTime( durationSeconds * percent )
		);
	};

	const hideHoverMarkerAfterSeek = () => {
		clearTimeout( hideHoverMarkerTimeout );
		hideHoverMarkerTimeout = setTimeout( () => {
			hoverMarker.classList.remove( 'is-visible' );
		}, 0 );
	};

	const hideHoverMarker = () => {
		waveformArea.classList.remove( 'is-hovering' );
		hoverMarker.classList.remove( 'is-visible' );
		hoverPercent = null;
		hoverRegion.style.width = '0';
		clearHoverWaveform();
	};

	const previousOnTimeUpdate = instance.options.onTimeUpdate;
	instance.options.onTimeUpdate = ( currentTime, trackDuration, player ) => {
		previousOnTimeUpdate?.( currentTime, trackDuration, player );
		updateTimeMarkers();
	};

	waveformArea.addEventListener( 'mousemove', updateHoverMarker );
	waveformArea.addEventListener( 'click', hideHoverMarkerAfterSeek );
	waveformArea.addEventListener( 'mouseleave', hideHoverMarker );
	instance.audio.addEventListener( 'loadedmetadata', updateTimeMarkers );
	instance.audio.addEventListener( 'durationchange', updateTimeMarkers );
	container.addEventListener( 'waveformplayer:ended', updateTimeMarkers );

	updateTimeMarkers();

	return () => {
		clearTimeout( hideHoverMarkerTimeout );
		waveformArea.removeEventListener( 'mousemove', updateHoverMarker );
		waveformArea.removeEventListener( 'click', hideHoverMarkerAfterSeek );
		waveformArea.removeEventListener( 'mouseleave', hideHoverMarker );
		instance.audio.removeEventListener(
			'loadedmetadata',
			updateTimeMarkers
		);
		instance.audio.removeEventListener(
			'durationchange',
			updateTimeMarkers
		);
		container.removeEventListener(
			'waveformplayer:ended',
			updateTimeMarkers
		);
		clearHoverWaveform();
		instance.options.onTimeUpdate = previousOnTimeUpdate;
		markersContainer
			.querySelectorAll( '.wp-block-playlist__time-marker' )
			.forEach( ( marker ) => marker.remove() );
		hoverMarker.remove();
		hoverRegion.remove();
		hoverCanvas.remove();
		progressRegion.remove();
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
 * @param {boolean}  options.autoPlay      - Whether to auto-play when ready.
 * @param {string}   options.duration      - Fallback formatted duration.
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
		duration,
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
		waveformStyle,
	} );
	element.appendChild( container );

	// Initialize the WaveformPlayer library. The played/total time is hidden
	// because the waveform timestamp markers already show this information.
	const instance = new WaveformPlayerLib( container, { showTime: false } );
	instance.options.durationFallback = parseTime( duration );
	const cleanupTimeMarkers = setupWaveformTimeMarkers( instance, container );

	// Set up event handlers.
	let cleanupAccessibility;
	const handlers = {
		ready: () => {
			styleSvgIcons( container, textColor );
			cleanupAccessibility = setupPlayButtonAccessibility(
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
			cleanupAccessibility?.();
			cleanupTimeMarkers();
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
