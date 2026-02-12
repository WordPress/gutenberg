/**
 * Internal dependencies
 */
import type { User } from '../entity-types';
import type { CollaboratorInfo } from './types';

// ----------------------------------------------------------------------------
// OKLCH color utilities
//
// Manual sRGB ↔ OKLCH conversion for perceptually uniform color manipulation.
// Uses WCAG 2.0 relative luminance for contrast checking. No external
// dependencies — the OKLAB matrices are from Björn Ottosson's original paper.
// https://bottosson.github.io/posts/oklab/
// ----------------------------------------------------------------------------

type OKLCH = [ L: number, C: number, H: number ];

function srgbToLinear( c: number ): number {
	return c <= 0.04045 ? c / 12.92 : ( ( c + 0.055 ) / 1.055 ) ** 2.4;
}

function linearToSrgb( c: number ): number {
	return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** ( 1 / 2.4 ) - 0.055;
}

function hexToRgb( hex: string ): [ number, number, number ] {
	return [
		parseInt( hex.slice( 1, 3 ), 16 ) / 255,
		parseInt( hex.slice( 3, 5 ), 16 ) / 255,
		parseInt( hex.slice( 5, 7 ), 16 ) / 255,
	];
}

function rgbToHex( rgb: [ number, number, number ] ): string {
	return (
		'#' +
		rgb
			.map( ( c ) => {
				const v = Math.round( Math.min( 1, Math.max( 0, c ) ) * 255 );
				return v.toString( 16 ).padStart( 2, '0' );
			} )
			.join( '' )
	);
}

function linearRgbToOklab(
	r: number,
	g: number,
	b: number
): [ number, number, number ] {
	const l = Math.cbrt(
		0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
	);
	const m = Math.cbrt(
		0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
	);
	const s = Math.cbrt(
		0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
	);
	return [
		0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
		1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
		0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
	];
}

function oklabToLinearRgb(
	L: number,
	a: number,
	b: number
): [ number, number, number ] {
	const l = ( L + 0.3963377774 * a + 0.2158037573 * b ) ** 3;
	const m = ( L - 0.1055613458 * a - 0.0638541728 * b ) ** 3;
	const s = ( L - 0.0894841775 * a - 1.291485548 * b ) ** 3;
	return [
		+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
	];
}

function hexToOklch( hex: string ): OKLCH {
	const [ r, g, b ] = hexToRgb( hex ).map( srgbToLinear );
	const [ L, a, bv ] = linearRgbToOklab( r, g, b );
	const C = Math.sqrt( a * a + bv * bv );
	const H = ( Math.atan2( bv, a ) * 180 ) / Math.PI;
	return [ L, C, H ];
}

function oklchToHex( L: number, C: number, H: number ): string {
	const hRad = ( H * Math.PI ) / 180;
	const a = C * Math.cos( hRad );
	const b = C * Math.sin( hRad );
	const [ lr, lg, lb ] = oklabToLinearRgb( L, a, b );
	return rgbToHex( [
		linearToSrgb( lr ),
		linearToSrgb( lg ),
		linearToSrgb( lb ),
	] );
}

/**
 * WCAG 2.0 relative luminance from a hex color.
 *
 * @param hex - The hex color.
 * @return Relative luminance between 0 and 1.
 */
function relativeLuminance( hex: string ): number {
	const [ r, g, b ] = hexToRgb( hex ).map( srgbToLinear );
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG 2.0 contrast ratio between two hex colors.
 *
 * @param hex1 - First hex color.
 * @param hex2 - Second hex color.
 * @return Contrast ratio between 1 and 21.
 */
function contrastRatio( hex1: string, hex2: string ): number {
	const l1 = relativeLuminance( hex1 );
	const l2 = relativeLuminance( hex2 );
	const lighter = Math.max( l1, l2 );
	const darker = Math.min( l1, l2 );
	return ( lighter + 0.05 ) / ( darker + 0.05 );
}

// ----------------------------------------------------------------------------
// Collaborator color system
// ----------------------------------------------------------------------------

/**
 * Minimum WCAG 2.0 contrast ratio for UI components (borders, non-text indicators)
 * against a white background. Per WCAG 2.1 SC 1.4.11.
 */
const STROKE_CONTRAST_RATIO = 3.1;

/**
 * Minimum WCAG 2.0 contrast ratio for normal-sized white text on a colored
 * background. Per WCAG 2.1 SC 1.4.3 (AA).
 */
const BACKGROUND_CONTRAST_RATIO = 7;

/**
 * The seed color palette for collaborator highlights. Each seed is used to derive
 * a stroke color (for borders/highlights) and a background color (for cursor labels).
 */
const COLOR_PALETTE = [
	'#3858E9', // blueberry
	'#9500FF', // purple
	'#FF0080', // pink
	'#F4800B', // orange
	'#FF00EA', // magenta
	'#C3E619', // green
	'#4DB3A2', // teal
	'#00D5FF', // cyan
];

/**
 * Darken a color in OKLCH space until it meets a minimum WCAG 2.0 contrast
 * ratio against white. Preserves chroma and hue, adjusting only lightness.
 *
 * @param hex              - The seed hex color.
 * @param minContrastRatio - The minimum contrast ratio to achieve against white.
 * @return The adjusted hex color meeting the contrast requirement.
 */
function adjustForContrast( hex: string, minContrastRatio: number ): string {
	if ( contrastRatio( hex, '#ffffff' ) >= minContrastRatio ) {
		return hex;
	}

	let [ L, C, H ] = hexToOklch( hex );

	while ( L > 0 ) {
		L = Math.max( 0, L - 0.005 );
		const adjusted = oklchToHex( L, C, H );
		if ( contrastRatio( adjusted, '#ffffff' ) >= minContrastRatio ) {
			return adjusted;
		}
	}

	return oklchToHex( 0, C, H );
}

/**
 * Derive stroke and background colors from a seed color. The stroke color meets
 * a 3.1:1 contrast ratio against white (for borders and highlights). The background
 * color meets a 7:1 ratio (for white text on the color as a background).
 *
 * @param seedColor - The seed hex color.
 * @return An object containing the stroke and background hex colors.
 */
function deriveCollaboratorColors( seedColor: string ): {
	strokeColor: string;
	backgroundColor: string;
} {
	return {
		strokeColor: adjustForContrast( seedColor, STROKE_CONTRAST_RATIO ),
		backgroundColor: adjustForContrast(
			seedColor,
			BACKGROUND_CONTRAST_RATIO
		),
	};
}

/**
 * Generate a random integer between min and max, inclusive.
 *
 * @param min - The minimum value.
 * @param max - The maximum value.
 * @return A random integer between min and max.
 */
function generateRandomInt( min: number, max: number ): number {
	return Math.floor( Math.random() * ( max - min + 1 ) ) + min;
}

/**
 * Get a unique collaborator seed color from the palette, or generate a new one
 * by hue-rotating an existing palette color if all are taken.
 *
 * @param existingColors - Seed colors that are already in use.
 * @return The new seed color, in hex format.
 */
function getNewCollaboratorColor( existingColors: string[] ): string {
	const availableColors = COLOR_PALETTE.filter(
		( color ) => ! existingColors.includes( color )
	);

	if ( availableColors.length > 0 ) {
		const randomIndex = generateRandomInt( 0, availableColors.length - 1 );
		return availableColors[ randomIndex ];
	}

	// All seed colors are in use — hue-rotate a random palette color in OKLCH space.
	const randomIndex = generateRandomInt( 0, COLOR_PALETTE.length - 1 );
	const [ L, C, H ] = hexToOklch( COLOR_PALETTE[ randomIndex ] );
	const rotation = generateRandomInt( 20, 340 );
	return oklchToHex( L, C, ( H + rotation ) % 360 );
}

/**
 * Get the browser name from the user agent.
 * @return The browser name.
 */
function getBrowserName(): string {
	const userAgent = window.navigator.userAgent;
	let browserName = 'Unknown';

	if ( userAgent.includes( 'Firefox' ) ) {
		browserName = 'Firefox';
	} else if ( userAgent.includes( 'Edg' ) ) {
		browserName = 'Microsoft Edge';
	} else if (
		userAgent.includes( 'Chrome' ) &&
		! userAgent.includes( 'Edg' )
	) {
		browserName = 'Chrome';
	} else if (
		userAgent.includes( 'Safari' ) &&
		! userAgent.includes( 'Chrome' )
	) {
		browserName = 'Safari';
	} else if (
		userAgent.includes( 'MSIE' ) ||
		userAgent.includes( 'Trident' )
	) {
		browserName = 'Internet Explorer';
	} else if ( userAgent.includes( 'Opera' ) || userAgent.includes( 'OPR' ) ) {
		browserName = 'Opera';
	}

	return browserName;
}

export function areMapsEqual< Key, Value >(
	map1: Map< Key, Value >,
	map2: Map< Key, Value >,
	comparatorFn: ( value1: Value, value2: Value ) => boolean
): boolean {
	if ( map1.size !== map2.size ) {
		return false;
	}

	for ( const [ key, value1 ] of map1.entries() ) {
		if ( ! map2.has( key ) ) {
			return false;
		}

		if ( ! comparatorFn( value1, map2.get( key )! ) ) {
			return false;
		}
	}

	return true;
}

/**
 * Check if two collaborator infos are equal.
 *
 * @param collaboratorInfo1 - The first collaborator info.
 * @param collaboratorInfo2 - The second collaborator info.
 * @return True if the collaborator infos are equal, false otherwise.
 */
export function areCollaboratorInfosEqual(
	collaboratorInfo1?: CollaboratorInfo,
	collaboratorInfo2?: CollaboratorInfo
): boolean {
	if ( ! collaboratorInfo1 || ! collaboratorInfo2 ) {
		return collaboratorInfo1 === collaboratorInfo2;
	}

	if (
		Object.keys( collaboratorInfo1 ).length !==
		Object.keys( collaboratorInfo2 ).length
	) {
		return false;
	}

	return Object.entries( collaboratorInfo1 ).every( ( [ key, value ] ) => {
		// Update this function with any non-primitive fields added to CollaboratorInfo.
		return value === collaboratorInfo2[ key as keyof CollaboratorInfo ];
	} );
}

/**
 * Generate a collaborator info object from a current collaborator and a list of existing colors.
 *
 * @param currentCollaborator - The current collaborator.
 * @param existingColors      - The existing colors.
 * @return The collaborator info object.
 */
export function generateCollaboratorInfo(
	currentCollaborator: User< 'view' >,
	existingColors: string[]
): CollaboratorInfo {
	const color = getNewCollaboratorColor( existingColors );
	const { strokeColor, backgroundColor } = deriveCollaboratorColors( color );
	// eslint-disable-next-line camelcase
	const { avatar_urls, id, name, slug } = currentCollaborator;
	return {
		avatar_urls, // eslint-disable-line camelcase
		browserType: getBrowserName(),
		color,
		strokeColor,
		backgroundColor,
		enteredAt: Date.now(),
		id,
		name,
		slug,
	};
}

export function getRecordValue< RecordType, Key extends keyof RecordType >(
	obj: unknown,
	key: Key
): RecordType[ Key ] | null {
	if ( 'object' === typeof obj && null !== obj && key in obj ) {
		return ( obj as RecordType )[ key ];
	}

	return null;
}

export function getTypedKeys< T extends object >( obj: T ): Array< keyof T > {
	return Object.keys( obj ) as Array< keyof T >;
}
