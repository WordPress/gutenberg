/**
 * Shared utilities for waveform audio player functionality.
 * Used by both the WaveformPlayer component (editor) and view.js (frontend).
 */
import { colord } from 'colord';
import WaveformPlayerLib from '@arraypress/waveform-player/no-autoinit';
import type {
	InitializedWaveformPlayer,
	InitWaveformPlayerOptions,
	WaveformContainerOptions,
	WaveformPlayerInstance,
	WaveformPlayerLabels,
	WaveformPlayerStyles,
} from './types';

/**
 * Configuration constants.
 * Note: DEFAULT_WAVEFORM_HEIGHT should match $waveform-player-height in style.scss.
 */
const DEFAULT_WAVEFORM_HEIGHT = 100;
const DEFAULT_SEEK_LABEL = 'Seek';

/**
 * Get computed style for an element, using ownerDocument for iframe compatibility.
 *
 * @param element - The element to get styles from.
 * @return The computed style.
 */
function getComputedStyle( element: Element ): CSSStyleDeclaration {
	return element.ownerDocument.defaultView!.getComputedStyle( element );
}

function getTopLevelGradientParts( gradientValue?: string ) {
	const match = gradientValue?.trim().match( /^[\w-]+-gradient\((.*)\)$/i );
	if ( ! match ) {
		return [];
	}

	const parts: string[] = [];
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

function getLeadingColorFunction( value: string ) {
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
	return undefined;
}

function getColorStopValue( gradientPart: string ) {
	const colorFunction = getLeadingColorFunction( gradientPart );
	if ( colorFunction ) {
		return colorFunction;
	}

	const [ possibleColor ] = gradientPart.split( /\s+/ );
	if ( colord( possibleColor ).isValid() ) {
		return possibleColor;
	}
	return undefined;
}

function getWaveformGradientDirection( gradientValue?: string ) {
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
	return undefined;
}

function resolveColorValue( element: Element, colorValue: string ) {
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

function getResolvedGradientStops( element: Element, gradientValue?: string ) {
	const stops = getWaveformGradientStops( gradientValue )
		?.map( ( colorValue ) => resolveColorValue( element, colorValue ) )
		.filter( ( colorValue ) => colord( colorValue ).isValid() );

	return stops && stops.length > 1 ? stops : undefined;
}

function applyAlpha( colorValue: string | string[], alpha: number ) {
	if ( Array.isArray( colorValue ) ) {
		return colorValue.map( ( color ) =>
			colord( color ).alpha( alpha ).toRgbString()
		);
	}
	return colord( colorValue ).alpha( alpha ).toRgbString();
}

function getRepresentativeColor( colorValue?: string | string[] ) {
	if ( Array.isArray( colorValue ) ) {
		return colorValue[ colorValue.length - 1 ];
	}
	return colorValue;
}

export function getWaveformGradientStops( gradientValue?: string ) {
	const stops = getTopLevelGradientParts( gradientValue )
		.map( getColorStopValue )
		.filter( ( stop ): stop is string => Boolean( stop ) );

	return stops.length > 1 ? stops : undefined;
}

function serializeColorValue( colorValue: string | string[] ) {
	return Array.isArray( colorValue )
		? JSON.stringify( colorValue )
		: colorValue;
}

/**
 * Get all colors needed for the waveform player based on the element's styles.
 *
 * @param element               - The element to derive colors from.
 * @param waveformColorValue    - The base waveform color value to use.
 * @param textColorValue        - The text color value to use.
 * @param waveformGradientValue - The waveform gradient value to use.
 * @return Object containing textColor, waveformColor, progressColor.
 */
export function getWaveformColors(
	element: Element,
	waveformColorValue?: string,
	textColorValue?: string,
	waveformGradientValue?: string
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
 * @param options                  - The options for the container.
 * @param options.url              - The audio URL.
 * @param options.title            - The track title.
 * @param options.artist           - The track artist.
 * @param options.artwork          - The track image URL.
 * @param options.waveformColor    - The waveform bar color.
 * @param options.progressColor    - The progress indicator color.
 * @param options.waveformGradient - The waveform gradient direction.
 * @param options.buttonColor      - The play button color.
 * @param options.seekLabel        - Accessible label for the seek control.
 * @param options.seekValueText    - Accessible value-text template for the seek control (e.g. '%1$s of %2$s').
 * @param options.height           - The waveform height in pixels.
 * @param options.waveformStyle    - The visualization style (bars, mirror, line, blocks, dots, seekbar).
 * @return The configured container element.
 */
export function createWaveformContainer( {
	url,
	title,
	artist,
	artwork,
	waveformColor,
	progressColor,
	waveformGradient,
	buttonColor,
	seekLabel,
	seekValueText,
	height = DEFAULT_WAVEFORM_HEIGHT,
	waveformStyle = 'bars',
}: WaveformContainerOptions ) {
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
 * Apply custom styles to a generated waveform player.
 *
 * @param container                 - The generated player container.
 * @param styles                    - The player styles.
 * @param styles.backgroundColor    - The waveform area background color.
 * @param styles.backgroundGradient - The waveform area background gradient.
 * @param styles.textColor          - The player text color.
 * @param styles.playButtonColor    - The play button color.
 * @param styles.playButtonGradient - The play button gradient.
 */
export function applyWaveformPlayerStyles(
	container: HTMLElement,
	{
		backgroundColor,
		backgroundGradient,
		textColor,
		playButtonColor,
		playButtonGradient,
	}: WaveformPlayerStyles = {}
) {
	const waveformContainer = container.querySelector< HTMLElement >(
		'.waveform-container'
	);
	const playButton =
		container.querySelector< HTMLElement >( '.waveform-btn' );
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
 * The icons should contrast with the button background.
 *
 * @param container   - The waveform container element.
 * @param buttonColor - The button background color.
 */
export function styleSvgIcons( container: Element, buttonColor: string ) {
	// Compute a contrasting color for the icons based on button brightness.
	const isButtonDark = colord( buttonColor ).isDark();
	const iconColor = isButtonDark ? '#ffffff' : '#000000';

	const svgPaths = container.querySelectorAll< SVGPathElement >( 'svg path' );
	svgPaths.forEach( ( path ) => {
		path.style.fill = iconColor;
	} );
}

/**
 * Set up play button accessibility: aria-label that toggles on play/pause.
 *
 * @param container    - The waveform container element.
 * @param labels       - Button labels.
 * @param labels.play  - Label for the play state.
 * @param labels.pause - Label for the pause state.
 */
export function setupPlayButtonAccessibility(
	container: Element,
	{
		play: playLabel = 'Play',
		pause: pauseLabel = 'Pause',
	}: WaveformPlayerLabels = {}
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
 * @param label - Accessible label for the seek control.
 * @return The provided label or translated fallback.
 */
function getSeekControlLabel( label?: string ) {
	return label || DEFAULT_SEEK_LABEL;
}

/**
 * Update the waveform seek control label.
 *
 * @param instance - The WaveformPlayer instance.
 * @param label    - Accessible label for the seek control.
 */
export function updateSeekControlLabel(
	instance: WaveformPlayerInstance,
	label?: string
) {
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
 * @param container  - The waveform player container element.
 * @param artworkUrl - The track image URL.
 */
export function setupPlayButtonArtwork(
	container: HTMLElement,
	artworkUrl?: string
) {
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
 * @param error - The error from play().
 */
export function logPlayError( error: Error ) {
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
 * @param element                       - The container element (must be in DOM).
 * @param options                       - Configuration options.
 * @param options.src                   - The audio file URL.
 * @param options.title                 - The track title.
 * @param options.artist                - The artist name.
 * @param options.image                 - The track image URL.
 * @param options.imageAlt              - The track image alt text.
 * @param options.waveformColor         - The waveform color.
 * @param options.waveformGradient      - The waveform gradient.
 * @param options.textColor             - The player text color.
 * @param options.backgroundColor       - The player background color.
 * @param options.backgroundGradient    - The player background gradient.
 * @param options.autoPlay              - Whether to auto-play when ready.
 * @param options.onEnded               - Callback when track ends.
 * @param options.labels                - Translated button labels.
 * @param options.waveformStyle         - Waveform style (bars, mirror, line, blocks, dots, seekbar).
 * @param options.showPlayButtonArtwork - Whether to show artwork on the play button.
 * @return Object with instance, container, and destroy function.
 */
export function initWaveformPlayer(
	element: Element,
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
		showPlayButtonArtwork = false,
	}: InitWaveformPlayerOptions
): InitializedWaveformPlayer {
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
		waveformStyle,
	} );
	element.appendChild( container );

	// Initialize the WaveformPlayer library. The library reads the translated
	// seek label and value-text templates from the container's data attributes
	// and owns the seek slider's accessible label and value text.
	const instance = new WaveformPlayerLib(
		container
	) as WaveformPlayerInstance;
	if ( instance.artworkEl ) {
		instance.artworkEl.alt = imageAlt || '';
	}
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
	let cleanupPlayButtonAccessibility: ( () => void ) | undefined;
	const handlers = {
		ready: () => {
			styleSvgIcons( container, waveformButtonColor || textColor );
			if ( showPlayButtonArtwork ) {
				setupPlayButtonArtwork( container, image );
			}
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
