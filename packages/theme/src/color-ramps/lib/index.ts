import { clone, get, OKLCH, set, type PlainColorObject } from 'colorjs.io/fn';
import {
	assertValidSeedColor,
	clampToGamut,
	getContrast,
	getColorString,
} from './color-utils.ts';
import { findColorMeetingRequirements } from './find-color-with-constraints.ts';
import { buildForegroundScale } from './build-foreground-scale.ts';
import { buildPerceptualSteps } from './build-perceptual-steps.ts';
import {
	sortByDependency,
	computeBetterFgColorDirection,
	adjustContrastTarget,
	stepsForStep,
	solveWithBisect,
} from './utils.ts';
import type {
	AccentRampPurpose,
	AccentRampResult,
	BaseRamp,
	BaseRampStep,
	FollowDirection,
	Ramp,
	RampDirection,
	RampConfig,
	RampResult,
	RampStepsConfig,
} from './types.ts';
import { BLACK, WHITE, CONTRAST_EPSILON } from './constants.ts';

/**
 * Solve the base steps and track the largest constraint deficit for seed
 * adjustment. Perceptual reconstruction happens after this pass.
 *
 * @param params                       Base-pass inputs.
 * @param params.seed                  OKLCH seed, possibly adjusted by a prior search.
 * @param params.sortedSteps           Steps to build, with dependencies first.
 * @param params.config                Base contrast and chroma settings.
 * @param params.mainDir               Ramp's foreground direction.
 * @param params.oppDir                Opposite of mainDir.
 * @param params.pinLightness          Lightness override, even if contrast fails.
 * @param params.pinLightness.stepName Step to pin.
 * @param params.pinLightness.value    Pinned OKLCH lightness.
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
	sortedSteps: BaseRampStep[];
	config: RampStepsConfig;
	mainDir: RampDirection;
	oppDir: RampDirection;
	pinLightness?: {
		stepName: BaseRampStep;
		value: number;
	};
} ) {
	const rampResults = {} as BaseRamp;
	let warnings: ( keyof Ramp )[] | undefined;
	let maxDeficit = -Infinity;
	let maxDeficitDirection: RampDirection = 'lighter';
	let maxDeficitStep;

	// Dependencies use unrounded colors; only the output ramp is serialized.
	const calculatedColors = new Map< keyof Ramp | 'seed', PlainColorObject >();
	calculatedColors.set( 'seed', seed );

	for ( const stepName of sortedSteps ) {
		const {
			contrast,
			lightness: stepLightnessConstraint,
			taperChromaOptions,
			sameAsIfPossible,
		} = config[ stepName ];

		const referenceNames = [
			contrast.reference,
			...( contrast.additionalReferences ?? [] ),
		];
		const referenceColors = referenceNames.map( ( referenceName ) => {
			const referenceColor = calculatedColors.get( referenceName );
			if ( ! referenceColor ) {
				throw new Error(
					`Reference color for step ${ stepName } not found: ${ referenceName }`
				);
			}
			return referenceColor;
		} );

		if ( sameAsIfPossible ) {
			const candidateColor = calculatedColors.get( sameAsIfPossible );
			if ( ! candidateColor ) {
				throw new Error(
					`Same-as color for step ${ stepName } not found: ${ sameAsIfPossible }`
				);
			}

			const adjustedTarget = adjustContrastTarget( contrast.target );
			const candidateMeetsTarget = referenceColors.every(
				( referenceColor ) =>
					getContrast( referenceColor, candidateColor ) >=
					adjustedTarget
			);
			if ( candidateMeetsTarget ) {
				calculatedColors.set( stepName, candidateColor );
				rampResults[ stepName ] = getColorString( candidateColor );

				continue;
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
				return computeBetterFgColorDirection(
					colors,
					contrast.preferLighter
				).better;
			}

			return followDirection;
		}

		const computedDir = computeDirection(
			referenceColors,
			contrast.followDirection
		);
		const endpoint = computedDir === 'lighter' ? WHITE : BLACK;
		const referenceColor = referenceColors.reduce( ( tightest, current ) =>
			getContrast( current, endpoint ) < getContrast( tightest, endpoint )
				? current
				: tightest
		);

		const adjustedTarget = adjustContrastTarget( contrast.target );

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

		// The tightest constraint guides seed adjustment; negative deficits
		// describe unused contrast room.
		if (
			! contrast.ignoreWhenAdjustingSeed &&
			searchResults.deficit &&
			searchResults.deficit > maxDeficit
		) {
			maxDeficit = searchResults.deficit;
			maxDeficitDirection = computedDir;
			maxDeficitStep = stepName;
		}

		calculatedColors.set( stepName, searchResults.color );

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

type BuildRampOptions = {
	mainDirection?: RampDirection;
	pinLightness?: { stepName: BaseRampStep; value: number };
	backgroundRamp?: RampResult;
	rescaleToFitContrastTargets?: boolean;
	purpose?: AccentRampPurpose;
};

/**
 * Solve base constraints, rebuild surfaces and strokes, then position the
 * foreground scale. Seed lightness may shift to make the base constraints fit.
 * Purpose-specific outputs omit unused steps only after preserving their
 * constraint dependencies and spacing contributions.
 *
 * @param seedArg Original opaque sRGB seed string.
 * @param config  Base constraints and foreground policy.
 * @param options Direction, seed adjustment, background, and output profile.
 * @return Generated colors, direction, and any remaining ramp warnings.
 */
export function buildRamp(
	seedArg: string,
	config: RampConfig,
	options?: BuildRampOptions & { purpose?: 'full' }
): RampResult;
export function buildRamp(
	seedArg: string,
	config: RampConfig,
	options: BuildRampOptions
): AccentRampResult;
export function buildRamp(
	seedArg: string,
	config: RampConfig,
	{
		mainDirection,
		pinLightness,
		backgroundRamp,
		rescaleToFitContrastTargets = true,
		purpose = 'full',
	}: BuildRampOptions = {}
): AccentRampResult {
	// Validate here: the single point where user-supplied color strings enter.
	// Internal seed-adjustment passes use already validated color objects.
	assertValidSeedColor( seedArg );

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

	const sortedSteps = sortByDependency( config.steps );

	const {
		rampResults,
		warnings,
		maxDeficit,
		maxDeficitDirection,
		maxDeficitStep,
	} = calculateRamp( {
		seed,
		sortedSteps,
		config: config.steps,
		mainDir,
		oppDir,
		pinLightness,
	} );

	let bestRamp = rampResults;
	let bestWarnings = warnings;

	if ( maxDeficit > CONTRAST_EPSILON && rescaleToFitContrastTargets ) {
		const iterSteps = stepsForStep( maxDeficitStep!, config.steps );

		function getSeedForL( l: number ): PlainColorObject {
			return clampToGamut( set( clone( seed ), [ OKLCH, 'l' ], l ) );
		}

		function getDeficitForSeed( s: PlainColorObject ): number {
			const iterationResults = calculateRamp( {
				seed: s,
				sortedSteps: iterSteps,
				config: config.steps,
				mainDir,
				oppDir,
				pinLightness,
			} );

			// Opposing failures mean the search has gone too far. Reverse the
			// error sign instead of treating that unrelated deficit as progress.
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
		const finalResult = calculateRamp( {
			seed: bestSeed,
			sortedSteps,
			config: config.steps,
			mainDir,
			oppDir,
			pinLightness,
		} );
		bestRamp = finalResult.rampResults;
		bestWarnings = finalResult.warnings;
	}

	// Elevation always runs from darker SF1 to lighter SF3, independent of the
	// foreground direction used to solve the base constraints.
	if ( mainDir === 'darker' ) {
		const tmpSurface1 = bestRamp.surface1;
		bestRamp.surface1 = bestRamp.surface3;
		bestRamp.surface3 = tmpSurface1;
	}

	const rampResult = buildPerceptualSteps(
		{
			ramp: bestRamp,
			warnings: bestWarnings,
			direction: mainDir,
		},
		backgroundRamp,
		purpose
	);

	if ( purpose === 'full' ) {
		return buildForegroundScale(
			rampResult,
			backgroundRamp ?? rampResult,
			config.foregroundScale
		);
	}
	const foregroundResult = buildForegroundScale(
		rampResult,
		backgroundRamp ?? rampResult,
		config.foregroundScale,
		purpose !== 'status'
	);
	// Do not expose base colors whose final reconstruction was intentionally
	// skipped. Their base constraints and spacing contributions remain intact.
	const pruned: AccentRampResult = {
		...foregroundResult,
		ramp: { ...foregroundResult.ramp },
	};
	delete pruned.ramp.surface6;
	delete pruned.ramp.stroke2;
	if ( purpose === 'status' ) {
		delete pruned.ramp.stroke4;
		delete pruned.ramp.fgSurface5;
	}
	return pruned;
}
