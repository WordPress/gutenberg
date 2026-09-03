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

// Rounding reserve for 8-bit sRGB:
// - Channels round by up to 0.5/255. Linearizing all 256 rounding intervals
//   gives a maximum factor of about 1.00792 in (linear channel value + 0.05).
//   The weighted luminance sum obeys the same bound for (luminance + 0.05).
// - Contrast is (lighter luminance + 0.05) / (darker luminance + 0.05).
//   Both colors' errors can compound: 1.00792 ** 2 is about 1.0159, close to
//   the 1.016:1 maximum contrast between adjacent 8-bit gray levels.
// - This is relative error, not 0.016 contrast points. adjustContrastTarget
//   multiplies the target by 1.02 for a 2% reserve; log tolerance is separate.
export const CONTRAST_ROUNDING_MARGIN = 0.02;

// With preferLighter, choose black only when its minimum contrast exceeds
// white's by this amount. This changes the choice, not the required contrast.
export const WHITE_TEXT_CONTRAST_MARGIN = 3.1;

// Keep the accent SF2 anchor out of the middle-lightness range, where there
// is little contrast room for either foreground direction.
export const ACCENT_SCALE_BASE_LIGHTNESS_THRESHOLDS = {
	lighter: { min: 0.2, max: 0.4 },
	darker: { min: 0.75, max: 0.98 },
} as const;

// Convergence allows log(achieved/target) >= -0.004: achieved can be as low as
// target * exp(-0.004), about 99.6% of target. This is relative, not 0.004
// contrast points. adjustContrastTarget multiplies by exp(0.004), about 1.00401.
export const CONTRAST_EPSILON = 4e-3;

export const MAX_BISECTION_ITERATIONS = 10;

// Full-ramp diagnostic pairs, broader than the semantic token pair checks.
export const CONTRAST_COMBINATIONS: {
	bgs: ( keyof Ramp )[];
	fgs: ( keyof Ramp )[];
	target: number;
}[] = [
	{
		bgs: [ 'surface1', 'surface2', 'surface3' ],
		fgs: [ 'fgSurface3', 'fgSurface4', 'fgSurface5' ],
		target: 4.5,
	},
	{
		bgs: [ 'surface4', 'surface5' ],
		fgs: [ 'fgSurface4', 'fgSurface5' ],
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

// Shared defaults for token generation and runtime ThemeProvider calculations.
export const DEFAULT_SEED_COLORS = {
	background: '#fcfcfc',
	primary: '#3858e9',
	info: '#0090ff',
	success: '#4ab866',
	caution: '#f0d149',
	warning: '#f0b849',
	error: '#cc1818',
};
