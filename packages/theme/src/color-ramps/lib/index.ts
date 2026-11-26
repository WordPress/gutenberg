import {
	clone,
	get,
	mix,
	OKLab,
	OKLCH,
	set,
	type PlainColorObject,
} from 'colorjs.io/fn';
import {
	clampToGamut,
	getContrast,
	getColorString,
	parseSeedColor,
} from './color-utils.ts';
import { findColorMeetingRequirements } from './find-color-with-constraints.ts';
import { buildForegroundScale } from './build-foreground-scale.ts';
import { buildPerceptualSteps } from './build-perceptual-steps.ts';
import {
	sortByDependency,
	getContrastReferences,
	computeBetterFgColorDirection,
	adjustContrastTarget,
	stepsForStep,
	solveWithBisect,
} from './utils.ts';
import type {
	BaseRamp,
	BaseRampStep,
	FollowDirection,
	RampDirection,
	RampConfig,
	RampResult,
	ReferenceName,
	RampStepsConfig,
} from './types.ts';
import {
	BLACK,
	WHITE,
	CONTRAST_EPSILON,
	MAX_BISECTION_ITERATIONS,
} from './constants.ts';

/**
 * Calculate the base color ramp before perceptual reconstruction.
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
	sortedSteps: BaseRampStep[];
	config: RampStepsConfig;
	mainDir: RampDirection;
	oppDir: RampDirection;
	neutralSurface?: PlainColorObject;
	pinLightness?: {
		stepName: BaseRampStep;
		value: number;
	};
} ) {
	const rampResults = {} as BaseRamp;
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
				return {
					color,
					target,
					emitted: neutralSurface ? getColorString( color ) : '',
				};
			}
		);

		// The primary ramp keeps emitted colors that meet the actual targets.
		// Other ramps keep a reserve for rounding.
		const meetsTargets = ( candidate: PlainColorObject ) => {
			if ( ! neutralSurface ) {
				return references.every(
					( { color, target } ) =>
						getContrast( color, candidate ) >=
						adjustContrastTarget( target )
				);
			}
			const emittedCandidate = getColorString( candidate );
			return references.every(
				( { emitted, target } ) =>
					getContrast( emitted, emittedCandidate ) >= target
			);
		};

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
		// emitted. Move it toward the endpoint until it meets the targets.
		let color = searchResults.color;
		if (
			neutralSurface &&
			searchResults.reached &&
			! meetsTargets( color ) &&
			meetsTargets( endpoint )
		) {
			const towardEndpoint = ( amount: number ) =>
				mix( searchResults.color, endpoint, amount, { space: OKLab } );
			let low = 0;
			let high = 1;
			for ( let i = 0; i < MAX_BISECTION_ITERATIONS; i++ ) {
				const amount = ( low + high ) / 2;
				if ( meetsTargets( towardEndpoint( amount ) ) ) {
					high = amount;
				} else {
					low = amount;
				}
			}
			color = towardEndpoint( high );
		}

		// Store calculated color for future dependencies
		calculatedColors.set( stepName, color );

		// Add to results
		rampResults[ stepName ] = getColorString( color );
	}

	return {
		rampResults,
		maxDeficit,
		maxDeficitDirection,
		maxDeficitStep,
	};
}

type BuildRampOptions = {
	mainDirection?: RampDirection;
	neutralSurface?: string;
	pinLightness?: { stepName: BaseRampStep; value: number };
	backgroundRamp?: RampResult;
	rescaleToFitContrastTargets?: boolean;
};

/**
 * Solve base constraints, rebuild surfaces and strokes, then position the
 * foreground scale. Seed lightness may shift to make the base constraints fit.
 *
 * @param seedArg                             Original opaque sRGB seed string.
 * @param rampConfig                          Base constraints and foreground policy.
 * @param options                             Direction, seed adjustment, and background.
 * @param options.mainDirection               Main ramp direction override.
 * @param options.neutralSurface              Neutral surface with the least contrast headroom.
 * @param options.pinLightness                Optional pinned step lightness.
 * @param options.backgroundRamp              Background behind an accent ramp.
 * @param options.rescaleToFitContrastTargets Whether seed rescaling is allowed.
 * @return Generated colors, direction, and any remaining ramp warnings.
 */
export function buildRamp(
	seedArg: string,
	rampConfig: RampConfig,
	{
		mainDirection,
		neutralSurface: neutralSurfaceColor,
		pinLightness,
		backgroundRamp,
		rescaleToFitContrastTargets = true,
	}: BuildRampOptions = {}
): RampResult {
	const { steps: config, foregroundScale } = rampConfig;
	// Parse and validate here: the single point where user-supplied color strings enter.
	const parsedSeed = parseSeedColor( seedArg );
	const neutralSurface = neutralSurfaceColor
		? clampToGamut( parseSeedColor( neutralSurfaceColor ) )
		: undefined;

	let seed: PlainColorObject;
	try {
		seed = clampToGamut( parsedSeed );
		// Seed trials for the primary ramp use emitted colors. Start from one.
		if ( neutralSurface ) {
			seed = clampToGamut( parseSeedColor( getColorString( seed ) ) );
		}
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

	function getWarnings(
		ramp: BaseRamp,
		candidate: PlainColorObject,
		steps = sortedSteps
	) {
		const emitted = {
			...ramp,
			seed: getColorString( candidate ),
			neutralSurface: neutralSurfaceColor,
		};
		return steps.filter( ( stepName ) => {
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

	let bestRamp = rampResults;

	if (
		maxDeficit > CONTRAST_EPSILON &&
		rescaleToFitContrastTargets &&
		// A rounding reserve helps the numerical search. An already emitted
		// primary ramp only needs to meet the actual contrast targets.
		( ! neutralSurface || getWarnings( rampResults, seed ).length > 0 )
	) {
		const iterSteps = neutralSurface
			? sortedSteps
			: stepsForStep( maxDeficitStep!, config );

		const seedL = get( seed, [ OKLCH, 'l' ] );
		let passing: { seed: PlainColorObject; ramp: BaseRamp } | undefined;

		function getSeedForL( l: number ): PlainColorObject {
			const color = clampToGamut(
				set( clone( seed ), [ OKLCH, 'l' ], l )
			);
			// Primary trials use the emitted seed, so seeds that emit the same
			// color produce the same ramp.
			return neutralSurface
				? clampToGamut( parseSeedColor( getColorString( color ) ) )
				: color;
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

			// A passing primary sample ends the search. The refinement below
			// then moves it back toward the supplied seed.
			if (
				neutralSurface &&
				getWarnings( iterationResults.rampResults, s ).length === 0
			) {
				passing = { seed: s, ramp: iterationResults.rampResults };
				return 0;
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
			const searched = passing;
			// The first passing sample can be far from the supplied seed. Narrow
			// the gap to the closest passing seed, checking only `steps`.
			const refine = ( steps: BaseRampStep[] ) => {
				let closest = searched;
				let failingL = seedL;
				let passingL = get( closest.seed, [ OKLCH, 'l' ] );
				let failingColor = getColorString( seed );
				for ( let i = 0; i < MAX_BISECTION_ITERATIONS; i++ ) {
					const l = ( failingL + passingL ) / 2;
					const candidate = getSeedForL( l );
					// Trials emitting the same seed as an end produce its ramp.
					const emitted = getColorString( candidate );
					if (
						emitted === failingColor ||
						emitted === getColorString( closest.seed )
					) {
						break;
					}
					const { rampResults: ramp } = calculateRamp( {
						seed: candidate,
						sortedSteps: steps,
						config,
						mainDir,
						oppDir,
						neutralSurface,
						pinLightness,
					} );
					if ( getWarnings( ramp, candidate, steps ).length === 0 ) {
						closest = { seed: candidate, ramp };
						passingL = l;
					} else {
						failingL = l;
						failingColor = emitted;
					}
				}
				return closest;
			};

			// Refine only the steps that failed at the supplied seed, then
			// check the complete ramp. Refine every step if that check fails.
			const failedSteps = new Set(
				getWarnings( rampResults, seed ).flatMap( ( step ) =>
					stepsForStep( step, config )
				)
			);
			const refined = refine(
				sortedSteps.filter( ( step ) => failedSteps.has( step ) )
			);
			const { rampResults: refinedRamp } = calculateRamp( {
				seed: refined.seed,
				sortedSteps,
				config,
				mainDir,
				oppDir,
				neutralSurface,
				pinLightness,
			} );
			passing =
				getWarnings( refinedRamp, refined.seed ).length === 0
					? { seed: refined.seed, ramp: refinedRamp }
					: refine( sortedSteps );
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

	const rampResult = buildPerceptualSteps(
		{
			ramp: bestRamp,
			warnings: warnings.length ? warnings : undefined,
			direction: mainDir,
		},
		backgroundRamp
	);

	return buildForegroundScale(
		rampResult,
		backgroundRamp ?? rampResult,
		foregroundScale
	);
}
