import { clone, get, OKLCH, set, type PlainColorObject } from 'colorjs.io/fn';
import {
	clampToGamut,
	getContrast,
	getColorString,
	parseSeedColor,
} from './color-utils.ts';
import { findColorMeetingRequirements } from './find-color-with-constraints.ts';
import {
	sortByDependency,
	getContrastReferences,
	computeBetterFgColorDirection,
	adjustContrastTarget,
	stepsForStep,
	solveWithBisect,
} from './utils.ts';
import type {
	FollowDirection,
	Ramp,
	RampDirection,
	RampConfig,
	RampResult,
	ReferenceName,
} from './types.ts';
import {
	BRAND_FOCUS_STEPS,
	MINIMUM_NON_TEXT_CONTRAST,
} from '../../semantic-color-contrast-pairs.ts';
import { BLACK, WHITE, CONTRAST_EPSILON } from './constants.ts';

// Surface steps are swapped for darker ramps before exposing the public tokens.
function getBrandSurfaceContrast( ramp: Ramp, mainDir: RampDirection ) {
	const brandSurface = mainDir === 'lighter' ? ramp.surface1 : ramp.surface3;
	const focusSteps = Object.keys(
		BRAND_FOCUS_STEPS
	) as ( keyof typeof BRAND_FOCUS_STEPS )[];
	return Math.min(
		...focusSteps.map( ( step ) =>
			getContrast( ramp[ step ], brandSurface )
		)
	);
}

/**
 * Calculate a complete color ramp based on the provided configuration.
 *
 * @param params                       - The calculation parameters
 * @param params.seed                  - The base color to build the ramp from
 * @param params.sortedSteps           - Steps sorted in dependency order
 * @param params.config                - Ramp configuration defining contrast requirements
 * @param params.mainDir               - Primary direction for the ramp (lighter/darker)
 * @param params.oppDir                - Opposite direction from mainDir
 * @param params.neutralSurface        - Neutral surface with the least contrast headroom
 * @param params.pinLightness          - Optional lightness override for a given step
 * @param params.pinLightness.stepName
 * @param params.pinLightness.value
 * @return Object containing ramp results and satisfaction status
 */
function calculateRamp( {
	seed,
	sortedSteps,
	config,
	mainDir,
	oppDir,
	neutralSurface,
	pinLightness,
}: {
	seed: PlainColorObject;
	sortedSteps: ( keyof Ramp )[];
	config: RampConfig;
	mainDir: RampDirection;
	oppDir: RampDirection;
	neutralSurface?: PlainColorObject;
	pinLightness?: {
		stepName: keyof Ramp;
		value: number;
	};
} ) {
	const rampResults = {} as Record< keyof Ramp, string >;
	let maxDeficit = -Infinity;
	let maxDeficitDirection: RampDirection = 'lighter';
	let maxDeficitStep;

	// Keep track of the calculated colors, as they are going to be useful
	// when other colors reference them.
	const calculatedColors = new Map< ReferenceName, PlainColorObject >();
	calculatedColors.set( 'seed', seed );
	if ( neutralSurface ) {
		calculatedColors.set( 'neutralSurface', neutralSurface );
	}

	for ( const stepName of sortedSteps ) {
		const {
			contrast,
			lightness: stepLightnessConstraint,
			taperChromaOptions,
			sameAsIfPossible,
		} = config[ stepName ];

		const references = getContrastReferences( contrast ).map(
			( { reference, target } ) => {
				const color = calculatedColors.get( reference );
				if ( ! color ) {
					throw new Error(
						`Reference color for step ${ stepName } not found: ${ reference }`
					);
				}
				return { color, target };
			}
		);

		// The primary ramp keeps emitted colors that meet the actual targets.
		// Other ramps keep a reserve for rounding.
		const meetsTargets = ( candidate: PlainColorObject ) =>
			references.every( ( { color, target } ) =>
				neutralSurface
					? getContrast(
							getColorString( color ),
							getColorString( candidate )
						) >= target
					: getContrast( color, candidate ) >=
						adjustContrastTarget( target )
			);

		// Check if we can reuse color from the `sameAsIfPossible` config option
		if ( sameAsIfPossible ) {
			const candidateColor = calculatedColors.get( sameAsIfPossible );
			if ( ! candidateColor ) {
				throw new Error(
					`Same-as color for step ${ stepName } not found: ${ sameAsIfPossible }`
				);
			}

			// If the candidate meets every contrast requirement, use it.
			if ( meetsTargets( candidateColor ) ) {
				// Store the reused color
				calculatedColors.set( stepName, candidateColor );
				rampResults[ stepName ] = getColorString( candidateColor );

				continue; // Skip to next step
			}
		}

		function computeDirection(
			colors: readonly PlainColorObject[],
			followDirection: FollowDirection
		): RampDirection {
			if ( followDirection === 'main' ) {
				return mainDir;
			}

			if ( followDirection === 'opposite' ) {
				return oppDir;
			}

			if ( followDirection === 'best' ) {
				const { better, worse } = computeBetterFgColorDirection(
					colors,
					contrast.preferLighter
				);
				if ( neutralSurface && stepName === 'fgFill' ) {
					// Keep the preferred text direction if it fits both fills. If
					// neither fits, the seed search needs to move away from the surface.
					for ( const direction of [ better, worse ] ) {
						if (
							meetsTargets(
								direction === 'lighter' ? WHITE : BLACK
							)
						) {
							return direction;
						}
					}
					return oppDir;
				}
				return better;
			}

			return followDirection;
		}

		const computedDir = computeDirection(
			references.map( ( { color } ) => color ),
			contrast.followDirection
		);
		const endpoint = computedDir === 'lighter' ? WHITE : BLACK;
		// Less contrast headroom relative to the target means a stricter reference.
		const { color: referenceColor, target } = references.reduce(
			( worst, next ) =>
				getContrast( next.color, endpoint ) / next.target <
				getContrast( worst.color, endpoint ) / worst.target
					? next
					: worst
		);
		const adjustedTarget = adjustContrastTarget( target );

		// Define the lightness constraint, if needed.
		let lightnessConstraint;
		if ( pinLightness?.stepName === stepName ) {
			lightnessConstraint = {
				value: pinLightness.value,
				type: 'force',
			} as const;
		} else if ( stepLightnessConstraint ) {
			lightnessConstraint = {
				value: stepLightnessConstraint( computedDir ),
				type: 'onlyIfSucceeds',
			} as const;
		}

		// Calculate the color meeting the requirements
		const searchResults = findColorMeetingRequirements(
			referenceColor,
			seed,
			adjustedTarget,
			computedDir,
			{
				lightnessConstraint,
				taperChromaOptions,
			}
		);

		// When the target contrast is not met, take note of it and use
		// that information to guide the ramp calculation bisection.
		if (
			! contrast.ignoreWhenAdjustingSeed &&
			searchResults.deficit &&
			searchResults.deficit > maxDeficit
		) {
			maxDeficit = searchResults.deficit;
			maxDeficitDirection = computedDir;
			maxDeficitStep = stepName;
		}

		// Gamut mapping can push a color that reached its target below it once
		// emitted. Use the endpoint instead when it still meets the targets.
		const color =
			neutralSurface &&
			searchResults.reached &&
			! meetsTargets( searchResults.color ) &&
			meetsTargets( endpoint )
				? endpoint
				: searchResults.color;

		// Store calculated color for future dependencies
		calculatedColors.set( stepName, color );

		// Add to results
		rampResults[ stepName ] = getColorString( color );
	}

	// The brand surface depends on the fill seed. Check their relationship
	// after both exist so seed bisection can resolve it without a cycle.
	if ( neutralSurface ) {
		const contrast = getBrandSurfaceContrast( rampResults, mainDir );
		const deficit = Math.log(
			adjustContrastTarget( MINIMUM_NON_TEXT_CONTRAST ) / contrast
		);
		if ( deficit > maxDeficit ) {
			maxDeficit = deficit;
			maxDeficitDirection = oppDir;
			maxDeficitStep = 'bgFill1' as const;
		}
	}

	return {
		rampResults,
		maxDeficit,
		maxDeficitDirection,
		maxDeficitStep,
	};
}

export function buildRamp(
	seedArg: string,
	config: RampConfig,
	{
		mainDirection,
		neutralSurface: neutralSurfaceColor,
		pinLightness,
		rescaleToFitContrastTargets = true,
	}: {
		mainDirection?: RampDirection;
		neutralSurface?: string;
		pinLightness?: {
			stepName: keyof Ramp;
			value: number;
		};
		rescaleToFitContrastTargets?: boolean;
	} = {}
): RampResult {
	// Parse and validate here: the single point where user-supplied color strings enter.
	const parsedSeed = parseSeedColor( seedArg );
	const neutralSurface = neutralSurfaceColor
		? clampToGamut( parseSeedColor( neutralSurfaceColor ) )
		: undefined;

	let seed: PlainColorObject;
	try {
		seed = clampToGamut( parsedSeed );
	} catch ( error ) {
		throw new Error(
			`Invalid seed color "${ seedArg }": ${
				error instanceof Error ? error.message : 'Unknown error'
			}`
		);
	}

	let mainDir: RampDirection = 'lighter';
	let oppDir: RampDirection = 'darker';

	if ( mainDirection ) {
		mainDir = mainDirection;
		oppDir = mainDirection === 'darker' ? 'lighter' : 'darker';
	} else {
		const { better, worse } = computeBetterFgColorDirection( seed );
		mainDir = better;
		oppDir = worse;
	}

	// Get the correct calculation order based on dependencies
	const sortedSteps = sortByDependency( config );

	// Calculate the ramp with the initial seed.
	const { rampResults, maxDeficit, maxDeficitDirection, maxDeficitStep } =
		calculateRamp( {
			seed,
			sortedSteps,
			config,
			mainDir,
			oppDir,
			neutralSurface,
			pinLightness,
		} );

	function getWarnings( ramp: Ramp, candidate: PlainColorObject ) {
		const emitted = {
			...ramp,
			seed: getColorString( candidate ),
			neutralSurface: neutralSurfaceColor,
		};
		return sortedSteps.filter( ( stepName ) => {
			const { contrast } = config[ stepName ];
			return (
				! contrast.ignoreWhenAdjustingSeed &&
				getContrastReferences( contrast ).some(
					( { reference, target } ) =>
						getContrast( ramp[ stepName ], emitted[ reference ]! ) <
						target
				)
			);
		} );
	}

	function meetsEmittedTargets( ramp: Ramp, candidate: PlainColorObject ) {
		return (
			getBrandSurfaceContrast( ramp, mainDir ) >=
				MINIMUM_NON_TEXT_CONTRAST &&
			getWarnings( ramp, candidate ).length === 0
		);
	}

	let bestRamp = rampResults;

	if (
		maxDeficit > CONTRAST_EPSILON &&
		rescaleToFitContrastTargets &&
		// A rounding reserve helps the numerical search. An already emitted
		// primary ramp only needs to meet the actual contrast targets.
		( ! neutralSurface || ! meetsEmittedTargets( rampResults, seed ) )
	) {
		const iterSteps = neutralSurface
			? sortedSteps
			: stepsForStep( maxDeficitStep!, config );

		const seedL = get( seed, [ OKLCH, 'l' ] );
		// Keep the passing sample closest to the supplied seed. The search can
		// end on a farther or failing one.
		let passing: { seed: PlainColorObject; ramp: Ramp } | undefined;

		function getSeedForL( l: number ): PlainColorObject {
			return clampToGamut( set( clone( seed ), [ OKLCH, 'l' ], l ) );
		}

		function getDeficitForSeed( s: PlainColorObject ): number {
			const iterationResults = calculateRamp( {
				seed: s,
				sortedSteps: iterSteps,
				config,
				mainDir,
				oppDir,
				neutralSurface,
				pinLightness,
			} );

			if (
				neutralSurface &&
				meetsEmittedTargets( iterationResults.rampResults, s ) &&
				( ! passing ||
					Math.abs( get( s, [ OKLCH, 'l' ] ) - seedL ) <
						Math.abs(
							get( passing.seed, [ OKLCH, 'l' ] ) - seedL
						) )
			) {
				passing = { seed: s, ramp: iterationResults.rampResults };
			}

			// If the constraints start failing in the opposite direction to the original
			// iteration's direction, that means we've moved too far away from the target.
			// Don't use the `maxDeficit` value because it's not related to our search,
			// and might even be positive, which would confuse the bisection algorithm.
			return iterationResults.maxDeficitDirection === maxDeficitDirection
				? iterationResults.maxDeficit
				: -maxDeficit;
		}

		// For a scale with the "lighter" direction, the contrast can be improved
		// by darkening the seed. For "darker" direction, by lightening the seed.
		const lowerSeedL = maxDeficitDirection === 'lighter' ? 0 : 1;
		const lowerDeficit = -maxDeficit;
		const upperSeedL = seedL;
		const upperDeficit = maxDeficit;

		const bestSeed = solveWithBisect(
			getSeedForL,
			getDeficitForSeed,
			lowerSeedL,
			lowerDeficit,
			upperSeedL,
			upperDeficit
		);

		if ( passing ) {
			// Primary samples already hold the complete ramp.
			bestRamp = passing.ramp;
			seed = passing.seed;
		} else {
			// Calculate the final ramp with adjusted seed.
			bestRamp = calculateRamp( {
				seed: bestSeed,
				sortedSteps,
				config,
				mainDir,
				oppDir,
				neutralSurface,
				pinLightness,
			} ).rampResults;
			seed = bestSeed;
		}
	}

	// Check emitted colors, including reused steps. Numerical search results
	// alone cannot establish their contrast after serialization.
	const warnings = getWarnings( bestRamp, seed );

	// Swap surface1 and surface3 for darker ramps to maintain visual elevation hierarchy.
	// This ensures surface1 appears "behind" surface2, and surface3 appears "in front",
	// regardless of the ramp's main direction.
	if ( mainDir === 'darker' ) {
		const tmpSurface1 = bestRamp.surface1;
		bestRamp.surface1 = bestRamp.surface3;
		bestRamp.surface3 = tmpSurface1;
	}

	return {
		ramp: bestRamp,
		warnings: warnings.length ? warnings : undefined,
		direction: mainDir,
	};
}
