import { FORMAT_ID } from '@terrazzo/plugin-css';
import type { Plugin } from '@terrazzo/parser';
import { to, get, OKLCH } from 'colorjs.io/fn';

import '../../src/color-ramps/lib/register-color-spaces';
import colorTokens from '../../src/prebuilt/ts/color-tokens';
import { DEFAULT_RAMPS } from '../../src/color-ramps/lib/default-ramps';
import { DEFAULT_SEED_COLORS } from '../../src/color-ramps/lib/constants';

const WP_ADMIN_THEME_COLOR_VAR = '--wp-admin-theme-color';
const PRIMARY_SEED = DEFAULT_SEED_COLORS.primary;

const PRIMARY_SEED_OKLCH = getOKLCHValues( PRIMARY_SEED );
const PRIMARY_SEED_OKLAB = oklchToOklab(
	PRIMARY_SEED_OKLCH.l,
	PRIMARY_SEED_OKLCH.c,
	PRIMARY_SEED_OKLCH.h
);

function adminColorVar(): string {
	return `var(${ WP_ADMIN_THEME_COLOR_VAR }, ${ PRIMARY_SEED })`;
}

function getOKLCHValues( hex: string ) {
	const color = to( hex, OKLCH );
	const l = get( color, [ OKLCH, 'l' ] );
	const c = get( color, [ OKLCH, 'c' ] );
	const h = get( color, [ OKLCH, 'h' ] );
	return {
		l: Number.isNaN( l ) ? 0 : l,
		c: Number.isNaN( c ) ? 0 : c,
		h: Number.isNaN( h ) ? 0 : h,
	};
}

/**
 * Converts OKLCH coordinates to OKLab coordinates for deltaE comparison.
 * @param l
 * @param c
 * @param h
 */
function oklchToOklab( l: number, c: number, h: number ) {
	const hRad = ( h * Math.PI ) / 180;
	return {
		l,
		a: c * Math.cos( hRad ),
		b: c * Math.sin( hRad ),
	};
}

/**
 * Euclidean distance in OKLab (deltaE OK).
 * @param c1
 * @param c1.l
 * @param c1.a
 * @param c1.b
 * @param c2
 * @param c2.l
 * @param c2.a
 * @param c2.b
 */
function deltaEOK(
	c1: { l: number; a: number; b: number },
	c2: { l: number; a: number; b: number }
) {
	return Math.sqrt(
		( c1.l - c2.l ) ** 2 + ( c1.a - c2.a ) ** 2 + ( c1.b - c2.b ) ** 2
	);
}

// Maximum deltaE OK for a color-mix() approximation to be accepted.
// Since fallbacks are safety nets, this is intentionally generous.
const COLOR_MIX_DELTA_E_THRESHOLD = 0.08;

/**
 * Find the optimal color-mix() percentage that minimizes deltaE OK when
 * mixing the seed with a given achromatic target (black or white).
 *
 * color-mix(in oklch, seed P%, black) produces (P*L, P*C, H) in OKLCH,
 * which in OKLab is simply P * seed_oklab.
 *
 * color-mix(in oklch, seed P%, white) produces (1 + P*(L-1), P*C, H),
 * which in OKLab is (1, 0, 0) + P * (seed_oklab - (1, 0, 0)).
 *
 * Both are linear in P, so minimizing squared deltaE yields a closed-form
 * solution via dot product projection.
 * @param seedOklab
 * @param seedOklab.l
 * @param seedOklab.a
 * @param seedOklab.b
 * @param targetOklab
 * @param targetOklab.l
 * @param targetOklab.a
 * @param targetOklab.b
 * @param mixWith
 */
function optimalMixPercentage(
	seedOklab: { l: number; a: number; b: number },
	targetOklab: { l: number; a: number; b: number },
	mixWith: 'black' | 'white'
): { roundedP: number; dE: number } {
	let p: number;

	if ( mixWith === 'black' ) {
		// Mix result = P * seed. Optimal P = dot(seed, target) / dot(seed, seed).
		const dot =
			seedOklab.l * targetOklab.l +
			seedOklab.a * targetOklab.a +
			seedOklab.b * targetOklab.b;
		const norm2 = seedOklab.l ** 2 + seedOklab.a ** 2 + seedOklab.b ** 2;
		p = norm2 > 0 ? dot / norm2 : 0;
	} else {
		// Mix result = (1,0,0) + P * (seed - (1,0,0)).
		// Let d = seed - (1,0,0), t = target - (1,0,0).
		// Optimal P = dot(d, t) / dot(d, d).
		const dL = seedOklab.l - 1;
		const tL = targetOklab.l - 1;
		const dot =
			dL * tL + seedOklab.a * targetOklab.a + seedOklab.b * targetOklab.b;
		const norm2 = dL ** 2 + seedOklab.a ** 2 + seedOklab.b ** 2;
		p = norm2 > 0 ? dot / norm2 : 0;
	}

	const roundedP = Math.round( Math.max( 0, Math.min( 1, p ) ) * 100 );
	if ( roundedP <= 0 || roundedP >= 100 ) {
		return { roundedP, dE: Infinity };
	}

	// Simulate the rounded result and compute actual deltaE.
	const rp = roundedP / 100;
	const simL =
		mixWith === 'white' ? rp * seedOklab.l + ( 1 - rp ) : rp * seedOklab.l;
	const simA = rp * seedOklab.a;
	const simB = rp * seedOklab.b;

	const dE = deltaEOK( { l: simL, a: simA, b: simB }, targetOklab );
	return { roundedP, dE };
}

/**
 * Compute the fallback expression for a brand token.
 *
 * Returns one of:
 * - `var(--wp-admin-theme-color, <hex>)` if the color matches the seed.
 * - `color-mix(in oklch, var(...) N%, black/white)` for derived shades.
 * - The plain hex value if color-mix() cannot approximate it well enough.
 * @param stepHex
 */
export function computeBrandFallback( stepHex: string ): string {
	const hexDigits = stepHex.replace( /^#/, '' );
	if ( hexDigits.length === 8 || hexDigits.length === 4 ) {
		throw new Error(
			`computeBrandFallback does not support colors with alpha: ${ stepHex }. ` +
				'The color-mix() fallback strategy does not model transparency.'
		);
	}

	if ( stepHex.toLowerCase() === PRIMARY_SEED.toLowerCase() ) {
		return adminColorVar();
	}

	const target = getOKLCHValues( stepHex );
	const targetOklab = oklchToOklab( target.l, target.c, target.h );

	// Try both black and white mixing and pick the closer result.
	const withBlack = optimalMixPercentage(
		PRIMARY_SEED_OKLAB,
		targetOklab,
		'black'
	);
	const withWhite = optimalMixPercentage(
		PRIMARY_SEED_OKLAB,
		targetOklab,
		'white'
	);

	const best = withBlack.dE <= withWhite.dE ? withBlack : withWhite;
	const mixWith = withBlack.dE <= withWhite.dE ? 'black' : 'white';

	if ( best.dE > COLOR_MIX_DELTA_E_THRESHOLD ) {
		return stepHex;
	}

	return `color-mix(in oklch, ${ adminColorVar() } ${
		best.roundedP
	}%, ${ mixWith })`;
}

export default function pluginDsTokenFallbacks( {
	filename = 'js/design-token-fallbacks.mjs',
} = {} ): Plugin {
	return {
		name: '@wordpress/terrazzo-plugin-ds-token-fallbacks',
		async build( { getTransforms, outputFile } ) {
			// Step 1: Collect all tokens and their default-mode values.
			const tokenDefaultValues: Record< string, string > = {};

			for ( const token of getTransforms( {
				format: FORMAT_ID,
				id: '*',
			} ) ) {
				if ( ! token.localID ) {
					continue;
				}
				// Only use the default mode value (always a string).
				if ( token.mode === '.' ) {
					tokenDefaultValues[ token.localID ] =
						typeof token.value === 'string' ? token.value : '';
				}
			}

			// Step 2: Build a mapping from semantic token CSS variable name
			// to the primary ramp step's hex value. Only tokens derived from
			// the primary (brand) ramp get special fallback treatment.
			const brandTokenStepHex: Record< string, string > = {};
			const primaryRamp = DEFAULT_RAMPS.primary.ramp;

			for ( const [ rampKey, tokenNames ] of Object.entries(
				colorTokens
			) ) {
				if ( ! rampKey.startsWith( 'primary-' ) ) {
					continue;
				}

				const stepName = rampKey.replace(
					'primary-',
					''
				) as keyof typeof primaryRamp;
				const stepHex = primaryRamp[ stepName ];
				if ( ! stepHex ) {
					continue;
				}

				for ( const tokenName of tokenNames ) {
					brandTokenStepHex[ `--wpds-color-${ tokenName }` ] =
						stepHex;
				}
			}

			// Step 3: Compute fallback expressions for all tokens.
			const fallbacks: Record< string, string > = {};

			for ( const [ localID, value ] of Object.entries(
				tokenDefaultValues
			) ) {
				const brandStepHex = brandTokenStepHex[ localID ];

				if ( brandStepHex ) {
					// Brand token — compute a dynamic fallback expression.
					fallbacks[ localID ] = computeBrandFallback( brandStepHex );
				} else {
					// Non-brand token — use the literal default value.
					fallbacks[ localID ] = value;
				}
			}

			// Step 4: Apply hard-coded overrides for tokens that need
			// special fallback treatment.
			const overrides: Record< string, string > = {
				// These foreground tokens sit on a strong brand background.
				// White is the safest fallback regardless of admin theme color.
				'--wpds-color-fg-interactive-brand-strong': '#fff',
				'--wpds-color-fg-interactive-brand-strong-active': '#fff',
				// Prefer the WP admin focus width when available.
				'--wpds-border-width-focus':
					'var(--wp-admin-border-width-focus, 2px)',
			};

			for ( const [ key, value ] of Object.entries( overrides ) ) {
				if ( key in fallbacks ) {
					fallbacks[ key ] = value;
				}
			}

			// Sort keys for stable, readable output.
			const sorted = Object.fromEntries(
				Object.entries( fallbacks ).sort( ( [ a ], [ b ] ) =>
					a.localeCompare( b )
				)
			);

			outputFile(
				filename,
				[
					'/*',
					' * This file is generated by the @wordpress/terrazzo-plugin-ds-token-fallbacks plugin.',
					' * Do not edit this file directly.',
					' */',
					'',
					`export default ${ JSON.stringify( sorted, null, '\t' ) }`,
					'',
				].join( '\n' )
			);
		},
	};
}
