/**
 * External dependencies
 */
import Color from 'colorjs.io';

/**
 * Internal dependencies
 */
import { getCachedContrast, getColorString } from './cache-utils';
import { findColorMeetingRequirements } from './find-color-with-constraints';
import {
	clampToGamut,
	sortByDependency,
	computeBetterFgColorDirection,
	adjustContrastTarget,
} from './utils';

import type {
	FollowDirection,
	Ramp,
	RampDirection,
	RampConfig,
	RampResult,
} from './types';
import { LIGHTNESS_EPSILON, MAX_BISECTION_ITERATIONS } from './constants';

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
	seed: Color;
	sortedSteps: ( keyof Ramp )[];
	config: RampConfig;
	mainDir: RampDirection;
	oppDir: RampDirection;
	pinLightness?: {
		stepName: keyof Ramp;
		value: number;
	};
} ) {
	const rampResults = {} as Record<
		keyof Ramp,
		{ color: string; warning: boolean }
	>;
	let SATISFIED_ALL_CONTRAST_REQUIREMENTS = true;
	let UNSATISFIED_DIRECTION: RampDirection = 'lighter';
	let MAX_WEIGHTED_DEFICIT = 0;

	// Keep track of the calculated colors, as they are going to be useful
	// when other colors reference them.
	const calculatedColors = new Map< keyof Ramp | 'seed', Color >();
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
			if ( candidateColor ) {
				const candidateContrast = getCachedContrast(
					referenceColor,
					candidateColor
				);
				const adjustedTarget = adjustContrastTarget( contrast.target );
				// If the candidate meets the contrast requirement, use it
				if ( candidateContrast >= adjustedTarget ) {
					// Store the reused color
					calculatedColors.set( stepName, candidateColor );
					rampResults[ stepName ] = {
						color: getColorString( candidateColor ),
						warning: false,
					};

					continue; // Skip to next step
				}
			}
		}

		function computeDirection(
			color: Color,
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
				strict: false,
				lightnessConstraint,
				taperChromaOptions,
			}
		);

		// When the target contrast is not met, take note of it and use
		// that information to guide the ramp calculation bisection.
		if ( ! searchResults.reached && ! contrast.ignoreWhenAdjustingSeed ) {
			SATISFIED_ALL_CONTRAST_REQUIREMENTS = false;

			// Calculate constraint failure severity for seed optimization
			// Use the relative deficit size, weighted by how changing the seed would impact this constraint
			const deficitVsTarget = adjustedTarget - searchResults.achieved;

			// Weight the deficit by how much seed adjustment would help this constraint
			// If seed has low contrast vs reference, adjusting seed has high impact
			// If seed has high contrast vs reference, adjusting seed has low impact
			const impactWeight = 1 / getCachedContrast( seed, referenceColor );
			const weightedDeficit = deficitVsTarget * impactWeight;

			// Track the most impactful failure for seed optimization
			if ( weightedDeficit > MAX_WEIGHTED_DEFICIT ) {
				MAX_WEIGHTED_DEFICIT = weightedDeficit;
				UNSATISFIED_DIRECTION = computedDir;
			}
		}

		// Store calculated color for future dependencies
		calculatedColors.set( stepName, searchResults.color );

		// Add to results
		rampResults[ stepName ] = {
			color: getColorString( searchResults.color ),
			warning:
				! contrast.ignoreWhenAdjustingSeed && ! searchResults.reached,
		};
	}

	return {
		rampResults,
		SATISFIED_ALL_CONTRAST_REQUIREMENTS,
		UNSATISFIED_DIRECTION,
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
	let seed: Color;
	try {
		seed = clampToGamut( new Color( seedArg ) );
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
		SATISFIED_ALL_CONTRAST_REQUIREMENTS,
		UNSATISFIED_DIRECTION,
	} = calculateRamp( {
		seed,
		sortedSteps,
		config,
		mainDir,
		oppDir,
		pinLightness,
	} );
	const toReturn = {
		ramp: rampResults,
		direction: mainDir,
	} as RampResult;

	if (
		! SATISFIED_ALL_CONTRAST_REQUIREMENTS &&
		rescaleToFitContrastTargets
	) {
		let worseSeedL = seed.oklch.l;
		// For a scale with the "lighter" direction, the contrast can be improved
		// by darkening the seed. For "darker" direction, by lightening the seed.
		let betterSeedL = UNSATISFIED_DIRECTION === 'lighter' ? 0 : 1;

		// Binary search: try a new seed and recompute the whole ramp
		// (TODO: try a smarter approach?)
		for (
			let i = 0;
			i < MAX_BISECTION_ITERATIONS &&
			Math.abs( betterSeedL - worseSeedL ) > LIGHTNESS_EPSILON;
			i++
		) {
			const newSeed = clampToGamut(
				seed.clone().set( {
					l: ( worseSeedL + betterSeedL ) / 2,
				} )
			);

			const iterationResults = calculateRamp( {
				seed: newSeed,
				sortedSteps,
				config,
				mainDir,
				oppDir,
				pinLightness,
			} );

			if ( iterationResults.SATISFIED_ALL_CONTRAST_REQUIREMENTS ) {
				betterSeedL = newSeed.oklch.l;
				// Only update toReturn when the ramp satisfies all constraints.
				toReturn.ramp = iterationResults.rampResults;
			} else if ( UNSATISFIED_DIRECTION !== mainDir ) {
				// Failing constraint is in opposite direction to main ramp direction
				// We've moved too far in mainDir, constrain the search
				betterSeedL = newSeed.oklch.l;
			} else {
				// Failing constraint is in same direction as main ramp direction
				// We haven't moved far enough in mainDir, continue searching
				worseSeedL = newSeed.oklch.l;
			}
		}
	}

	// Swap surface1 and surface3 for darker ramps to maintain visual elevation hierarchy.
	// This ensures surface1 appears "behind" surface2, and surface3 appears "in front",
	// regardless of the ramp's main direction.
	if ( mainDir === 'darker' ) {
		const tmpSurface1 = toReturn.ramp.surface1;
		toReturn.ramp.surface1 = toReturn.ramp.surface3;
		toReturn.ramp.surface3 = tmpSurface1;
	}

	return toReturn;
}
