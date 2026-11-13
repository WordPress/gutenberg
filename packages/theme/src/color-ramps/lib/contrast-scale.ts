import { clone, OKLCH, set } from 'colorjs.io/fn';
import { BG_RAMP_CONFIG, ACCENT_RAMP_CONFIG } from './ramp-configs.ts';
import {
	clampToGamut,
	getColorString,
	getContrast,
	parseSeedColor,
} from './color-utils.ts';
import { BLACK, WHITE } from './constants.ts';
import type { Ramp, RampConfig, RampStepConfig } from './types.ts';

/**
 * Exponent applied to every contrast target at the lowest contrast value.
 */
export const K_MIN = 0.75;

/**
 * Exponent applied to every contrast target at the highest contrast value.
 * At 1.3, `4.5 ** 1.3` is about 7.06, so every text role reaches 7:1.
 */
export const K_MAX = 1.3;

/**
 * Below 0, strokes soften this many times faster than everything else.
 * Contrast ratios near the light end change little in perceived lightness,
 * so a shared curve leaves borders looking too strong.
 */
export const STROKE_SENSITIVITY = 3;

/**
 * Above 0, a dark background seed moves towards black this many times
 * faster than everything else, to make room for stronger text.
 */
export const BACKGROUND_SEED_SENSITIVITY = 1.5;

/**
 * The background seed never gets closer to its endpoint (black or white)
 * than this contrast, which avoids halation with pure black.
 */
export const BACKGROUND_SEED_MIN_ENDPOINT_CONTRAST = 1.08;

/**
 * Focus indicators keep at least this contrast at every value.
 */
export const FOCUS_MINIMUM_CONTRAST = 3;

const STROKE_STEPS = [ 'stroke1', 'stroke2', 'stroke3', 'stroke4' ] as const;
const FILL_TEXT_STEPS = [ 'fgFill', 'fgFillInverted', 'fgFillDark' ] as const;
// The neutral solid fill is built from the strongest text contrast, so it
// would lighten with the text below 0. It holds instead, like the accent fill,
// which is the seed itself.
const HELD_FILL_STEPS = [ 'bgFillInverted1', 'bgFillInverted2' ] as const;

// Contrast with the surface that the softer strokes never go below. The
// weakest stroke is already about 1.03:1 from that surface at 0, so it holds
// there instead of disappearing; below 1.5:1 a field without a background
// fill loses its edge.
const STROKE_SURFACE_FLOORS = {
	stroke1: 1.03,
	stroke2: 1.08,
	stroke3: 1.5,
} as const;

/**
 * Clamps a contrast value to -1..1, treats non-numbers as 0, and rounds it to
 * steps of 0.1.
 *
 * @param contrast The requested contrast value.
 * @return The quantized contrast value.
 */
export function quantizeContrast( contrast: number | undefined ): number {
	if ( typeof contrast !== 'number' || ! Number.isFinite( contrast ) ) {
		return 0;
	}
	const rounded = Math.round( Math.max( -1, Math.min( 1, contrast ) ) * 10 );
	// Avoid returning -0.
	return rounded === 0 ? 0 : rounded / 10;
}

/**
 * Maps a quantized contrast value onto the exponent applied to contrast
 * targets, piecewise linear around 1.
 *
 * @param contrast         The quantized contrast value, -1..1.
 * @param sensitivityBelow How much faster than the shared curve to move below 0.
 * @param sensitivityAbove How much faster than the shared curve to move above 0.
 * @return The exponent.
 */
export function contrastToExponent(
	contrast: number,
	sensitivityBelow = 1,
	sensitivityAbove = 1
): number {
	if ( contrast < 0 ) {
		return 1 + contrast * ( 1 - K_MIN ) * sensitivityBelow;
	}
	return 1 + contrast * ( K_MAX - 1 ) * sensitivityAbove;
}

function withContrast(
	step: RampStepConfig,
	contrast: Partial< RampStepConfig[ 'contrast' ] >,
	extra: Partial< RampStepConfig > = {}
): RampStepConfig {
	return {
		...step,
		...extra,
		contrast: { ...step.contrast, ...contrast },
	};
}

function scaleConfig(
	base: RampConfig,
	contrast: number,
	focusFloor: boolean
): RampConfig {
	const k = contrastToExponent( contrast );
	const strokeK = contrastToExponent( contrast, STROKE_SENSITIVITY );
	// Text on solid fills keeps its standard contrast below 0.
	const fillTextK = contrastToExponent( contrast, 0 );

	const config = {} as RampConfig;
	for ( const [ name, step ] of Object.entries( base ) as [
		keyof Ramp,
		RampStepConfig,
	][] ) {
		let stepK = k;
		if ( ( STROKE_STEPS as readonly string[] ).includes( name ) ) {
			stepK = strokeK;
		} else if (
			( FILL_TEXT_STEPS as readonly string[] ).includes( name ) ||
			( HELD_FILL_STEPS as readonly string[] ).includes( name )
		) {
			stepK = fillTextK;
		}

		config[ name ] = withContrast(
			step,
			{
				target: step.contrast.target ** stepK,
				// Below 0, a held label that can't reach its target on a
				// softened fill gets as close as it can, instead of adjusting
				// the seed. Above 0, the strongest stroke can run out of room
				// on dark backgrounds; adjusting the seed for it would drain
				// the hue from the whole ramp.
				...( ( ( contrast < 0 &&
					( FILL_TEXT_STEPS as readonly string[] ).includes(
						name
					) ) ||
					( contrast > 0 && name === 'stroke4' ) ) && {
					skipSeedAdjustment: true,
				} ),
			},
			step.lightness ? { lightnessExponent: stepK } : {}
		);
	}

	if ( contrast < 0 ) {
		// Scale the stroke chain against the surface. `stroke1` and `stroke2`
		// are defined as steps back from `stroke3`; once `stroke3` is held by
		// a floor, scaling those steps directly would pull them towards
		// `stroke3` and make them stronger as contrast decreases.
		const baseStroke3 = base.stroke3.contrast.target;
		const stroke3Target = Math.max(
			baseStroke3 ** strokeK,
			focusFloor ? FOCUS_MINIMUM_CONTRAST : STROKE_SURFACE_FLOORS.stroke3
		);
		config.stroke3 = withContrast( config.stroke3, {
			target: stroke3Target,
		} );
		for ( const name of [ 'stroke1', 'stroke2' ] as const ) {
			const surfaceContrast =
				( baseStroke3 / base[ name ].contrast.target ) ** strokeK;
			config[ name ] = withContrast(
				config[ name ],
				{ target: Math.max( stroke3Target / surfaceContrast, 1 ) },
				{
					minimumContrastWith: {
						step: base.stroke3.contrast.reference as keyof Ramp,
						target: STROKE_SURFACE_FLOORS[ name ],
					},
				}
			);
		}
	} else if ( focusFloor ) {
		config.stroke3 = withContrast( config.stroke3, {
			target: Math.max(
				config.stroke3.contrast.target,
				FOCUS_MINIMUM_CONTRAST
			),
		} );
	}

	return config;
}

const configCache = new Map< number, { bg: RampConfig; accent: RampConfig } >();

/**
 * Returns the background and accent ramp configs for a quantized contrast
 * value. At 0 the original config objects are returned unchanged. Results are
 * memoized, so object identity is stable for each value.
 *
 * @param contrast The quantized contrast value, -1..1.
 * @return The background and accent ramp configs.
 */
export function getRampConfigs( contrast: number ): {
	bg: RampConfig;
	accent: RampConfig;
} {
	if ( contrast === 0 ) {
		return { bg: BG_RAMP_CONFIG, accent: ACCENT_RAMP_CONFIG };
	}
	const cached = configCache.get( contrast );
	if ( cached ) {
		return cached;
	}

	const bg = scaleConfig( BG_RAMP_CONFIG, contrast, false );
	// `stroke-focus` and `stroke-interactive-brand` come from the accent
	// `stroke3`, so it keeps the focus minimum at every value.
	const accent = scaleConfig( ACCENT_RAMP_CONFIG, contrast, true );
	// The accent `surface2` copies the background `bgFill1` target.
	accent.surface2 = withContrast( accent.surface2, {
		target: bg.bgFill1.contrast.target,
	} );

	const configs = { bg, accent };
	configCache.set( contrast, configs );
	return configs;
}

const BACKGROUND_SEED_ITERATIONS = 30;

/**
 * Moves the background seed towards its nearest endpoint (black for a dark
 * seed, white for a light one) above 0, keeping its hue. The seed's contrast
 * with that endpoint is divided by the exponent, so a dark page gets darker
 * and leaves more room for text and strokes. A near-white seed barely moves.
 * At 0 and below the seed is returned unchanged.
 *
 * @param seed     The background seed color.
 * @param contrast The quantized contrast value, -1..1.
 * @return The seed to build the background ramp from.
 */
export function scaleBackgroundSeed( seed: string, contrast: number ): string {
	if ( contrast <= 0 ) {
		return seed;
	}
	const parsedSeed = clampToGamut( parseSeedColor( seed ) );
	const toBlack = getContrast( parsedSeed, BLACK );
	const toWhite = getContrast( parsedSeed, WHITE );
	const towardsBlack = toBlack < toWhite;
	const endpoint = towardsBlack ? BLACK : WHITE;
	const endpointContrast = Math.min( toBlack, toWhite );
	const target = Math.max(
		endpointContrast **
			( 1 /
				contrastToExponent(
					contrast,
					1,
					BACKGROUND_SEED_SENSITIVITY
				) ),
		Math.min( BACKGROUND_SEED_MIN_ENDPOINT_CONTRAST, endpointContrast )
	);
	if ( target >= endpointContrast ) {
		return seed;
	}

	const colorForL = ( l: number ) =>
		clampToGamut( set( clone( parsedSeed ), [ OKLCH, 'l' ], l ) );
	// Contrast with black grows with lightness; with white, it shrinks.
	let lower = 0;
	let upper = 1;
	for ( let i = 0; i < BACKGROUND_SEED_ITERATIONS; i++ ) {
		const middle = ( lower + upper ) / 2;
		const isBelowTarget =
			getContrast( colorForL( middle ), endpoint ) < target;
		if ( isBelowTarget === towardsBlack ) {
			lower = middle;
		} else {
			upper = middle;
		}
	}
	return getColorString( colorForL( ( lower + upper ) / 2 ) );
}

/**
 * Minimum contrasts used to check semantic color pairs at a contrast value.
 *
 * @param contrast The quantized contrast value, -1..1.
 * @return The text, fill text, and focus minimums.
 */
export function getContrastThresholds( contrast: number ): {
	text: number;
	fillText: number;
	focus: number;
} {
	const k = contrastToExponent( contrast );
	return {
		text: 4.5 ** k,
		fillText: 4.5 ** contrastToExponent( contrast, 0 ),
		focus: Math.max( 3 ** k, FOCUS_MINIMUM_CONTRAST ),
	};
}
