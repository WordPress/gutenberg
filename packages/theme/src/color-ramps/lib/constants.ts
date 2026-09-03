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

// Empirical WCAG ratio margin for search and rounding error. Final serialized
// colors still need contrast checks; this margin alone is not a guarantee.
export const UNIVERSAL_CONTRAST_TOPUP = 0.02;

// With preferLighter, choose black only when its minimum contrast exceeds
// white's by this amount. This changes the choice, not the required contrast.
export const WHITE_TEXT_CONTRAST_MARGIN = 3.1;

// Keep the accent SF2 anchor out of the middle-lightness range, where there
// is little contrast room for either foreground direction.
export const ACCENT_SCALE_BASE_LIGHTNESS_THRESHOLDS = {
	lighter: { min: 0.2, max: 0.4 },
	darker: { min: 0.75, max: 0.98 },
} as const;

// Signed search-error tolerance. Its units depend on the caller's metric.
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
