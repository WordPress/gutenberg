import {
	ColorSpace,
	contrastAPCA,
	deltaEOK2,
	get,
	OKLCH,
	sRGB,
} from 'colorjs.io/fn';
import { buildRamp } from './lib/index.ts';
import {
	clampAccentScaleReferenceLightness,
	computeBetterFgColorDirection,
} from './lib/utils.ts';
import { BG_RAMP_CONFIG, ACCENT_RAMP_CONFIG } from './lib/ramp-configs.ts';
import type {
	AccentRampPurpose,
	AccentRampResult,
	RampResult as InternalRampResult,
	RampDirection,
	Ramp,
} from './lib/types.ts';
import { getContrast } from './lib/color-utils.ts';
import { BLACK, CONTRAST_COMBINATIONS, WHITE } from './lib/constants.ts';
export { DEFAULT_SEED_COLORS } from './lib/constants.ts';

// Only solve both polarities near the black/white WCAG crossover. This keeps
// light and dark seeds keep their initial direction without a second solve.
const MAXIMUM_AMBIGUOUS_ENDPOINT_CONTRAST_DIFFERENCE = 1;
// Allow the alternate direction only when its semantic anchor remains nearly
// as faithful to the supplied seed as the initially preferred direction.
const MAXIMUM_ALTERNATE_POLARITY_DELTA_E_DRIFT = 0.02;
// Do not switch direction for APCA rounding noise when neither candidate can
// fit the full interaction-state interval.
const MINIMUM_ALTERNATE_POLARITY_APCA_IMPROVEMENT = 1;

function getInteractionStateInterval( ramp: InternalRampResult ) {
	ColorSpace.register( sRGB );
	const background =
		ramp.ramp[ BG_RAMP_CONFIG.foregroundScale.perceptualReference ];
	return (
		Math.abs( contrastAPCA( background, ramp.ramp.fgSurface5 ) ) -
		Math.abs( contrastAPCA( background, ramp.ramp.fgSurface4 ) )
	);
}

function passesBackgroundWcagGates( ramp: InternalRampResult ) {
	return (
		ramp.warnings === undefined &&
		checkAccessibleCombinations( { bgRamp: ramp } ).length === 0
	);
}

function hasAmbiguousEndpointContrast( seed: string ) {
	return (
		Math.abs( getContrast( seed, BLACK ) - getContrast( seed, WHITE ) ) <=
		MAXIMUM_AMBIGUOUS_ENDPOINT_CONTRAST_DIFFERENCE
	);
}

/**
 * Try the opposite direction only near the black/white contrast crossover
 * when the preferred ramp fails WCAG or lacks interaction-state spacing.
 * Switching requires a passing alternate within the seed-drift allowance and
 * either repaired WCAG failures or a useful improvement in the APCA gap.
 *
 * @param seed      Original background seed used to compare color drift.
 * @param preferred Ramp built in the initially preferred direction.
 */
function selectBackgroundRampPolarity(
	seed: string,
	preferred: InternalRampResult
) {
	const target =
		BG_RAMP_CONFIG.foregroundScale.perceptualTargets.normalToActive;
	const preferredInterval = getInteractionStateInterval( preferred );
	const preferredPasses = passesBackgroundWcagGates( preferred );
	if (
		( preferredPasses && preferredInterval >= target ) ||
		! hasAmbiguousEndpointContrast( seed )
	) {
		return preferred;
	}

	const alternateDirection = computeBetterFgColorDirection( seed ).worse;
	const alternate = buildRamp( seed, BG_RAMP_CONFIG, {
		mainDirection: alternateDirection,
	} );
	if ( ! passesBackgroundWcagGates( alternate ) ) {
		return preferred;
	}

	const preferredDrift = deltaEOK2( seed, preferred.ramp.surface2 );
	const alternateDrift = deltaEOK2( seed, alternate.ramp.surface2 );
	if (
		alternateDrift >
		preferredDrift + MAXIMUM_ALTERNATE_POLARITY_DELTA_E_DRIFT
	) {
		return preferred;
	}

	const alternateInterval = getInteractionStateInterval( alternate );
	if (
		! preferredPasses ||
		( preferredInterval < target && alternateInterval >= target ) ||
		alternateInterval >=
			preferredInterval + MINIMUM_ALTERNATE_POLARITY_APCA_IMPROVEMENT
	) {
		return alternate;
	}

	return preferred;
}

/**
 * Build the neutral ramp, including seed adjustment and a bounded comparison
 * of foreground directions near the black/white contrast crossover.
 *
 * @param seed Opaque sRGB seed for the background.
 */
export function buildBgRamp( seed: string ) {
	if ( typeof seed !== 'string' || seed.trim() === '' ) {
		throw new Error( 'Seed color must be a non-empty string' );
	}

	return selectBackgroundRampPolarity(
		seed,
		buildRamp( seed, BG_RAMP_CONFIG )
	);
}

const STEP_TO_PIN = 'surface2';
function getBgRampInfo( ramp: InternalRampResult ): {
	mainDirection: RampDirection;
	backgroundRamp: InternalRampResult;
	pinLightness: {
		stepName: typeof STEP_TO_PIN;
		value: number;
	};
} {
	ColorSpace.register( sRGB );
	return {
		mainDirection: ramp.direction,
		backgroundRamp: ramp,
		pinLightness: {
			stepName: STEP_TO_PIN,
			value: clampAccentScaleReferenceLightness(
				get( ramp.ramp[ STEP_TO_PIN ], [ OKLCH, 'l' ] ),
				ramp.direction
			),
		},
	};
}

/**
 * Build an accent ramp. When a background is supplied, inherit its direction
 * and pin accent SF2 to a bounded version of the background's SF2 lightness.
 *
 * @param seed    Opaque sRGB seed for the accent.
 * @param bgRamp  Completed background ramp on which the accent appears.
 * @param purpose Internal profile selected by the caller's semantic usage.
 */
export function buildAccentRamp(
	seed: string,
	bgRamp?: InternalRampResult,
	purpose?: 'full'
): InternalRampResult;
export function buildAccentRamp(
	seed: string,
	bgRamp: InternalRampResult | undefined,
	purpose: AccentRampPurpose
): AccentRampResult;
export function buildAccentRamp(
	seed: string,
	bgRamp?: InternalRampResult,
	purpose: AccentRampPurpose = 'full'
): AccentRampResult {
	if ( typeof seed !== 'string' || seed.trim() === '' ) {
		throw new Error( 'Seed color must be a non-empty string' );
	}

	const bgRampInfo = bgRamp ? getBgRampInfo( bgRamp ) : undefined;
	return buildRamp( seed, ACCENT_RAMP_CONFIG, {
		...bgRampInfo,
		purpose,
	} );
}

/**
 * Report WCAG failures in the full-ramp diagnostic matrix, within each ramp
 * and for accent foregrounds against background-ramp colors. Includes pairs
 * that semantic tokens may not use. This check does not repair colors.
 *
 * @param params             Full ramps to inspect.
 * @param params.bgRamp      Background ramp.
 * @param params.accentRamps Accent ramps; purpose-pruned outputs are not supported.
 */
export function checkAccessibleCombinations( {
	bgRamp,
	accentRamps = [],
}: {
	bgRamp: InternalRampResult;
	accentRamps?: InternalRampResult[];
} ) {
	const unmetTargets: {
		bgName: keyof Ramp;
		bgColor: string;
		fgName: keyof Ramp;
		fgColor: string;
		unmetContrast: number;
		achievedContrast: number;
	}[] = [];

	// Assess combinations within each ramp
	[ bgRamp, ...accentRamps ].forEach( ( ramp ) => {
		CONTRAST_COMBINATIONS.forEach( ( { bgs, fgs, target } ) => {
			for ( const bg of bgs ) {
				for ( const fg of fgs ) {
					const bgColor = ramp.ramp[ bg ];
					const fgColor = ramp.ramp[ fg ];
					const achievedContrast = getContrast( bgColor, fgColor );
					if ( achievedContrast < target ) {
						unmetTargets.push( {
							bgName: bg,
							bgColor,
							fgName: fg,
							fgColor,
							unmetContrast: target,
							achievedContrast,
						} );
					}
				}
			}
		} );
	} );
	// Assess each accent ramp's fg color against bg ramp
	accentRamps.forEach( ( ramp ) => {
		CONTRAST_COMBINATIONS.forEach( ( { bgs, fgs, target } ) => {
			for ( const bg of bgs ) {
				for ( const fg of fgs ) {
					const bgColor = bgRamp.ramp[ bg ];
					const fgColor = ramp.ramp[ fg ];
					const achievedContrast = getContrast( bgColor, fgColor );
					if ( achievedContrast < target ) {
						unmetTargets.push( {
							bgName: bg,
							bgColor,
							fgName: fg,
							fgColor,
							unmetContrast: target,
							achievedContrast,
						} );
					}
				}
			}
		} );
	} );

	return unmetTargets;
}

export type RampResult = InternalRampResult;
