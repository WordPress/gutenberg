/**
 * External dependencies
 */
import {
	clone,
	get,
	OKLCH,
	set,
	type ColorTypes,
	type PlainColorObject,
} from 'colorjs.io/fn';

/**
 * Internal dependencies
 */
import './register-color-spaces';
import { clampToGamut, getContrast, getColorString } from './color-utils';
import { findColorMeetingRequirements } from './find-color-with-constraints';
import {
	sortByDependency,
	computeBetterFgColorDirection,
	adjustContrastTarget,
	stepsForStep,
	solveWithBisect,
} from './utils';

import type {
	FollowDirection,
	Ramp,
	RampDirection,
	RampConfig,
	RampResult,
} from './types';
import { CONTRAST_EPSILON } from './constants';

/**
 * Calculate a complete color ramp based on the provided configuration.
 *
 * @param params                       - The calculation parameters
 * @param params.seed                  - The base color to build the ramp from
 * @param params.sortedSteps           - Steps sorted in dependency order
 * @param params.config                - Ramp configuration defining contrast requirements
 * @param params.mainDir               - Primary direction for the ramp (lighter/darker)
 * @param params.oppDir                - Opposite direction from mainDir
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
	pinLightness,
}: {
	seed: PlainColorObject;
	sortedSteps: ( keyof Ramp )[];
	config: RampConfig;
	mainDir: RampDirection;
	oppDir: RampDirection;
	pinLightness?: {
		stepName: keyof Ramp;
		value: number;
	};
} ) {
	const rampResults = {} as Record< keyof Ramp, string >;
	let warnings: string[] | undefined;
	let maxDeficit = -Infinity;
	let maxDeficitDirection: RampDirection = 'lighter';
	let maxDeficitStep;

	// Keep track of the calculated colors, as they are going to be useful
	// when other colors reference them.
	const calculatedColors = new Map< keyof Ramp | 'seed', PlainColorObject >();
	calculatedColors.set( 'seed', seed );

	for ( const stepName of sortedSteps ) {
		const {
			contrast,
			lightness: stepLightnessConstraint,
			taperChromaOptions,
			sameAsIfPossible,
		} = config[ stepName ];

		const referenceColor = calculatedColors.get( contrast.reference );
		if ( ! referenceColor ) {
			throw new Error(
				`Reference color for step ${ stepName } not found: ${ contrast.reference }`
			);
		}

		// Check if we can reuse color from the `sameAsIfPossible` config option
		if ( sameAsIfPossible ) {
			const candidateColor = calculatedColors.get( sameAsIfPossible );
			if ( ! candidateColor ) {
				throw new Error(
					`Same-as color for step ${ stepName } not found: ${ sameAsIfPossible }`
				);
			}

			const candidateContrast = getContrast(
				referenceColor,
				candidateColor
			);
			const adjustedTarget = adjustContrastTarget( contrast.target );
			// If the candidate meets the contrast requirement, use it
			if ( candidateContrast >= adjustedTarget ) {
				// Store the reused color
				calculatedColors.set( stepName, candidateColor );
				rampResults[ stepName ] = getColorString( candidateColor );

				continue; // Skip to next step
			}
		}

		function computeDirection(
			color: ColorTypes,
			followDirection: FollowDirection
		): RampDirection {
			if ( followDirection === 'main' ) {
				return mainDir;
			}

			if ( followDirection === 'opposite' ) {
				return oppDir;
			}

			if ( followDirection === 'best' ) {
				return computeBetterFgColorDirection(
					color,
					contrast.preferLighter
				).better;
			}

			return followDirection;
		}

		const computedDir = computeDirection(
			referenceColor,
			contrast.followDirection
		);

		const adjustedTarget = adjustContrastTarget( contrast.target );

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

		// Store calculated color for future dependencies
		calculatedColors.set( stepName, searchResults.color );

		// Add to results
		rampResults[ stepName ] = getColorString( searchResults.color );

		if ( ! searchResults.reached && ! contrast.ignoreWhenAdjustingSeed ) {
			warnings ??= [];
			warnings.push( stepName );
		}
	}

	return {
		rampResults,
		warnings,
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
		pinLightness,
		rescaleToFitContrastTargets = true,
	}: {
		mainDirection?: RampDirection;
		pinLightness?: {
			stepName: keyof Ramp;
			value: number;
		};
		rescaleToFitContrastTargets?: boolean;
	} = {}
): RampResult {
	let seed: PlainColorObject;
	try {
		seed = clampToGamut( seedArg );
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
	const {
		rampResults,
		warnings,
		maxDeficit,
		maxDeficitDirection,
		maxDeficitStep,
	} = calculateRamp( {
		seed,
		sortedSteps,
		config,
		mainDir,
		oppDir,
		pinLightness,
	} );

	let bestRamp = rampResults;

	if ( maxDeficit > CONTRAST_EPSILON && rescaleToFitContrastTargets ) {
		const iterSteps = stepsForStep( maxDeficitStep!, config );

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
				pinLightness,
			} );

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
		const upperSeedL = get( seed, [ OKLCH, 'l' ] );
		const upperDeficit = maxDeficit;

		const bestSeed = solveWithBisect(
			getSeedForL,
			getDeficitForSeed,
			lowerSeedL,
			lowerDeficit,
			upperSeedL,
			upperDeficit
		);

		// Calculate the final ramp with adjusted seed.
		bestRamp = calculateRamp( {
			seed: bestSeed,
			sortedSteps,
			config,
			mainDir,
			oppDir,
			pinLightness,
		} ).rampResults;
	}

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
		warnings,
		direction: mainDir,
	};
}
