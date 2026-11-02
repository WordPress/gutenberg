import { OKLCH, type PlainColorObject } from 'colorjs.io/fn';
import type { Ramp } from './types.ts';

export const WHITE: PlainColorObject = {
	space: OKLCH,
	coords: [ 1, 0, 0 ],
	alpha: 1,
};
export const BLACK: PlainColorObject = {
	space: OKLCH,
	coords: [ 0, 0, 0 ],
	alpha: 1,
};

// Reserve room for rounding both generated colors to 8-bit sRGB:
// - A channel rounds by up to half a step, 0.5 / 255. Across the 256 rounding
//   intervals, sRGB linearization gives a maximum factor of about 1.00792 in
//   (linear channel value + 0.05). Relative luminance is a weighted sum of
//   channels, so the same bound applies to (luminance + 0.05) for one color.
// - Contrast divides the lighter color's (luminance + 0.05) by the darker
//   color's. Rounding both can compound those factors: 1.00792 ** 2 is about
//   1.0159, close to the 1.016:1 maximum between adjacent 8-bit gray levels.
// - This is a relative error, not a loss of 0.016 contrast points. Reserve 2%
//   of the target ratio; adjustContrastTarget multiplies the target by 1.02.
//   It accounts for the logarithmic search tolerance separately.
export const CONTRAST_ROUNDING_MARGIN = 0.02;

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

// Convergence tolerance for log(achieved contrast / target contrast).
// A converged result can be as low as target * exp(-0.004), about 99.6% of
// the target. This is not an absolute error of 0.004 contrast points.
// adjustContrastTarget compensates by multiplying by exp(0.004), about 1.00401.
export const CONTRAST_EPSILON = 4e-3;

export const MAX_BISECTION_ITERATIONS = 10;

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
		bgs: [ 'bgFill1', 'bgFill2' ],
		fgs: [ 'fgFill' ],
		target: 4.5,
	},
	{
		bgs: [ 'bgFillInverted1', 'bgFillInverted2' ],
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
	background: '#fcfcfc',
	primary: '#3858e9',
	info: '#0090ff',
	success: '#4ab866',
	caution: '#f0d149',
	warning: '#f0b849',
	error: '#cc1818',
};
