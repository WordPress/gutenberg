/**
 * External dependencies
 */
import Color from 'colorjs.io';

/**
 * Internal dependencies
 */
import type { Ramp } from './types';

export const WHITE = new Color( '#fff' ).to( 'oklch' );
export const BLACK = new Color( '#000' ).to( 'oklch' );

// Margin added to target contrasts to counter for algorithm approximations
// and rounding errors.
export const UNIVERSAL_CONTRAST_TOPUP = 0.05;

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

// Minimum lightness difference noticed by the algorithm.
export const LIGHTNESS_EPSILON = 1e-3;

export const MAX_BISECTION_ITERATIONS = 25;

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

// Used when generating the DTCG tokens and the static color ramps.
export const DEFAULT_SEED_COLORS = {
	bg: '#f8f8f8',
	primary: '#3858e9',
	info: '#0090ff',
	success: '#4ab866',
	caution: '#f0d149',
	warning: '#f0b849',
	error: '#cc1818',
};
