/**
 * External dependencies
 */
import { to, OKLCH } from 'colorjs.io/fn';

/**
 * Internal dependencies
 */
import './register-color-spaces';
import type { Ramp } from './types';
import { rotateHue } from './color-utils';

export const WHITE = to( 'white', OKLCH );
export const BLACK = to( 'black', OKLCH );

// Margin added to target contrasts to counter for algorithm approximations and rounding errors.
// - the `CONTRAST_EPSILON` value is 0.004, so the real contrast can be lower by this amount.
// - the max contrast between adjacent RGB values is 1.016, so 0.016 is the maximum total rounding error between two values.
// - the sum is 0.02: the margin we add to ensure that the target contrast is met after all the rounding.
export const UNIVERSAL_CONTRAST_TOPUP = 0.02;

// When enabling "lighter direction" bias, this is the amount by which
// black text contrast needs to be greater than white text contrast.
// The higher the value, the stronger the preference for white text.
// The current value has been determined empirically as the highest value
// that won't cause the algo not to be able to correctly solve all contrasts.
export const WHITE_TEXT_CONTRAST_MARGIN = 3.1;

// These values are used as thresholds when trying to match the background
// ramp's lightness while calculating an accent ramp. They prevent the accent
// scale from being pinned to lightness values in the middle of the range,
// which would cause the algorithm to struggle to satisfy the accent scale
// constraints and therefore produce unexpected results.
export const ACCENT_SCALE_BASE_LIGHTNESS_THRESHOLDS = {
	lighter: { min: 0.2, max: 0.4 },
	darker: { min: 0.75, max: 0.98 },
} as const;

// Contrast precision we aim for. Approximately 1/256, resolution of an 8-bit number.
export const CONTRAST_EPSILON = 4e-3;

export const MAX_BISECTION_ITERATIONS = 10;

// Hue rotation step for generating qualitative accent colors (in degrees).
// 60° produces 7 distinct colors when including the primary (0°).
export const QUALITATIVE_HUE_STEP = 60;

// Number of qualitative accent colors to generate (accent1 through accent6).
export const QUALITATIVE_ACCENT_COUNT = 6;

export const CONTRAST_COMBINATIONS: {
	bgs: ( keyof Ramp )[];
	fgs: ( keyof Ramp )[];
	target: number;
}[] = [
	{
		bgs: [ 'surface1', 'surface2', 'surface3' ],
		fgs: [ 'fgSurface3', 'fgSurface4' ],
		target: 4.5,
	},
	{
		bgs: [ 'surface4', 'surface5' ],
		fgs: [ 'fgSurface4' ],
		target: 4.5,
	},
	{
		bgs: [ 'bgFill1' ],
		fgs: [ 'fgFill' ],
		target: 4.5,
	},
	{
		bgs: [ 'bgFillInverted1' ],
		fgs: [ 'fgFillInverted' ],
		target: 4.5,
	},
	{
		bgs: [ 'bgFillInverted1' ],
		fgs: [ 'fgFillInverted' ],
		target: 4.5,
	},
	{
		bgs: [ 'surface1', 'surface2', 'surface3' ],
		fgs: [ 'stroke3' ],
		target: 3,
	},
];

/**
 * Converts an array of accent seed color strings into a keyed record
 * with accent1, accent2, etc. keys.
 * @param seeds Array of hex color strings.
 * @return Record with accent{N} keys.
 */
export function accentSeedsToRecord(
	seeds: string[]
): Record< string, string > {
	const result: Record< string, string > = {};
	seeds.forEach( ( seed, i ) => {
		result[ `accent${ i + 1 }` ] = seed;
	} );
	return result;
}

/**
 * Generates qualitative accent seed colors by rotating the primary hue.
 * @param primarySeed The primary seed color to rotate from.
 * @param count       Number of accents to generate (default: QUALITATIVE_ACCENT_COUNT).
 * @return Record with accent1 through accent{count} keys.
 */
export function getQualitativeSeeds(
	primarySeed: string,
	count: number = QUALITATIVE_ACCENT_COUNT
): Record< string, string > {
	const seeds: string[] = [];
	for ( let i = 1; i <= count; i++ ) {
		seeds.push( rotateHue( primarySeed, QUALITATIVE_HUE_STEP * i ) );
	}
	return accentSeedsToRecord( seeds );
}

// Base seed colors (without derived qualitative accents).
const BASE_SEED_COLORS = {
	bg: '#f8f8f8',
	primary: '#3858e9',
	info: '#0090ff',
	success: '#4ab866',
	caution: '#f0d149',
	warning: '#f0b849',
	error: '#cc1818',
};

// Default manually-specified accent seed colors.
// When empty, accents are auto-generated via hue rotation from the primary.
export const DEFAULT_ACCENT_SEEDS: string[] = [
	'#ff0080',
	'#ff00ea',
	'#9500ff',
	'#00d5ff',
	'#4db3a2',
	'#c3e619',
	'#f4800b',
];

// Used when generating the DTCG tokens and the static color ramps.
// Includes qualitative accent colors — manual if defined, otherwise hue-rotated.
export const DEFAULT_SEED_COLORS = {
	...BASE_SEED_COLORS,
	...( DEFAULT_ACCENT_SEEDS.length > 0
		? accentSeedsToRecord( DEFAULT_ACCENT_SEEDS )
		: getQualitativeSeeds( BASE_SEED_COLORS.primary ) ),
};
