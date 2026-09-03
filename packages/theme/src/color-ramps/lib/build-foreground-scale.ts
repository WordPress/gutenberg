import {
	ColorSpace,
	contrastAPCA,
	get,
	OKLab,
	OKLCH,
	OKLCH_sRGB as OklchSrgb,
	sRGB,
	to,
	type PlainColorObject,
} from 'colorjs.io/fn';
import {
	clampToGamut,
	getColorString,
	getContrastFromLuminances,
	getRelativeLuminance,
} from './color-utils.ts';
import { UNIVERSAL_CONTRAST_TOPUP } from './constants.ts';
import { taperChroma } from './taper-chroma.ts';
import type {
	AccentRampResult,
	BaseRamp,
	BaseRampResult,
	Ramp,
	ForegroundScaleConfig,
	ForegroundRampStep,
	RampResult,
} from './types.ts';
import { solveWithBisect } from './utils.ts';

ColorSpace.register( sRGB );
ColorSpace.register( OKLab );
ColorSpace.register( OKLCH );
ColorSpace.register( OklchSrgb );

type GetColorForLightness = ( lightness: number ) => PlainColorObject;

const PERCEPTUAL_INTERVAL_SERIALIZATION_TOPUP = 0.25;

function getChromaPreservingColorForLightness(
	seed: PlainColorObject,
	lightness: number
) {
	return clampToGamut( {
		space: OKLCH,
		coords: [
			lightness,
			get( seed, [ OKLCH, 'c' ] ),
			get( seed, [ OKLCH, 'h' ] ),
		],
		alpha: seed.alpha,
	} );
}

/**
 * Create an OKLCH-lightness path using the configured chroma policy. Relative
 * chroma keeps the seed's proportion of the available sRGB chroma; tapering
 * retains the configured neutral treatment. The relative-chroma cache belongs
 * to this path, so its colors must be treated as read-only.
 *
 * @param seed   Color supplying hue and chroma.
 * @param config Foreground chroma policy.
 */
function createColorForLightness(
	seed: PlainColorObject,
	config: ForegroundScaleConfig
): GetColorForLightness {
	if ( config.chroma.mode === 'tapered' ) {
		const taperOptions = config.chroma.options;
		return ( lightness ) => {
			const tapered = taperChroma( seed, lightness, taperOptions );
			if ( 'l' in tapered && 'c' in tapered ) {
				return clampToGamut( {
					space: OKLCH,
					coords: [
						tapered.l,
						tapered.c,
						get( seed, [ OKLCH, 'h' ] ),
					],
					alpha: seed.alpha,
				} );
			}

			return clampToGamut( tapered );
		};
	}

	const relativeSeed = to( seed, OklchSrgb );
	const relativeChroma = get( relativeSeed, [ OklchSrgb, 'c' ] );
	const hue = get( relativeSeed, [ OklchSrgb, 'h' ] );
	const colorCache = new Map< number, PlainColorObject >();

	return ( lightness ) => {
		const cachedColor = colorCache.get( lightness );
		if ( cachedColor ) {
			return cachedColor;
		}

		const color = to(
			{
				space: OklchSrgb,
				coords: [ lightness, relativeChroma, hue ],
				alpha: seed.alpha,
			},
			OKLCH
		);
		colorCache.set( lightness, color );
		return color;
	};
}

function getPerceptualContrastMagnitude(
	background: PlainColorObject,
	foreground: string | PlainColorObject
) {
	return Math.abs( contrastAPCA( background, foreground ) );
}

function getConstraintReferenceLuminances(
	step: ForegroundScaleConfig[ 'steps' ][ number ],
	ramp: BaseRampResult,
	backgroundRamp: BaseRampResult
) {
	return Array.from(
		new Set( [
			...step.contrast.references.map( ( name ) => ramp.ramp[ name ] ),
			...step.contrast.references.map(
				( name ) => backgroundRamp.ramp[ name ]
			),
		] ),
		( reference ) => getRelativeLuminance( reference )
	);
}

function meetsContrastFloor(
	color: string | PlainColorObject,
	referenceLuminances: readonly number[],
	target: number
) {
	const luminance = getRelativeLuminance( color );
	return referenceLuminances.every(
		( referenceLuminance ) =>
			getContrastFromLuminances( referenceLuminance, luminance ) >= target
	);
}

/**
 * Return the smallest log contrast ratio against the padded WCAG target.
 * Zero marks the search boundary; negative values mean at least one reference
 * fails. Final output checks use the unpadded floor instead.
 *
 * @param color               Candidate foreground.
 * @param referenceLuminances Precomputed luminances of its backgrounds.
 * @param target              Unpadded WCAG contrast ratio.
 */
function getContrastTargetMargin(
	color: PlainColorObject,
	referenceLuminances: readonly number[],
	target: number
) {
	const adjustedTarget = target + UNIVERSAL_CONTRAST_TOPUP;
	const luminance = getRelativeLuminance( color );
	let minimumMargin = Infinity;
	for ( const referenceLuminance of referenceLuminances ) {
		minimumMargin = Math.min(
			minimumMargin,
			Math.log(
				getContrastFromLuminances( referenceLuminance, luminance ) /
					adjustedTarget
			)
		);
	}
	return minimumMargin;
}

function meetsContrastTarget(
	color: PlainColorObject,
	referenceLuminances: readonly number[],
	target: number
) {
	return getContrastTargetMargin( color, referenceLuminances, target ) >= 0;
}

/**
 * Search toward the stronger endpoint for the padded WCAG target. The caller
 * supplies a path whose contrast increases in that direction. If the endpoint
 * cannot meet the target, return it for the final warning check to assess.
 *
 * @param options                     Search inputs.
 * @param options.getColorAtLightness Color path indexed by OKLCH lightness.
 * @param options.weakColor           Starting foreground.
 * @param options.strongColor         Strongest allowed foreground.
 * @param options.referenceLuminances Background luminances to check together.
 * @param options.target              Unpadded WCAG contrast ratio.
 */
function findColorAtContrastTarget( {
	getColorAtLightness,
	weakColor,
	strongColor,
	referenceLuminances,
	target,
}: {
	getColorAtLightness: GetColorForLightness;
	weakColor: PlainColorObject;
	strongColor: PlainColorObject;
	referenceLuminances: readonly number[];
	target: number;
} ) {
	const weakMargin = getContrastTargetMargin(
		weakColor,
		referenceLuminances,
		target
	);
	if ( weakMargin >= 0 ) {
		return weakColor;
	}

	const strongMargin = getContrastTargetMargin(
		strongColor,
		referenceLuminances,
		target
	);
	if ( strongMargin < 0 ) {
		return strongColor;
	}

	return solveWithBisect(
		getColorAtLightness,
		( color ) =>
			getContrastTargetMargin( color, referenceLuminances, target ),
		get( weakColor, [ OKLCH, 'l' ] ),
		weakMargin,
		get( strongColor, [ OKLCH, 'l' ] ),
		strongMargin
	);
}

/**
 * Position a foreground by APCA magnitude on a single-polarity lightness path.
 * Targets outside the endpoint range use the corresponding endpoint. This
 * search does not enforce WCAG; the caller checks those constraints separately.
 *
 * @param options                     Search inputs.
 * @param options.background          Fixed background for APCA comparisons.
 * @param options.getColorAtLightness Color path indexed by OKLCH lightness.
 * @param options.weakColor           Starting foreground.
 * @param options.strongColor         Color defining the strong lightness limit.
 * @param options.target              Requested APCA magnitude in Lc.
 */
function findColorAtPerceptualContrast( {
	background,
	getColorAtLightness,
	weakColor,
	strongColor,
	target,
}: {
	background: PlainColorObject;
	getColorAtLightness: GetColorForLightness;
	weakColor: PlainColorObject;
	strongColor: PlainColorObject;
	target: number;
} ) {
	const weakContrast = getPerceptualContrastMagnitude(
		background,
		weakColor
	);
	if ( target <= weakContrast ) {
		return weakColor;
	}

	const strongLightness = get( strongColor, [ OKLCH, 'l' ] );
	const scaleStrongColor = getColorAtLightness( strongLightness );
	const strongContrast = getPerceptualContrastMagnitude(
		background,
		scaleStrongColor
	);
	if ( target >= strongContrast ) {
		return scaleStrongColor;
	}

	return solveWithBisect(
		getColorAtLightness,
		( color ) =>
			getPerceptualContrastMagnitude( background, color ) - target,
		get( weakColor, [ OKLCH, 'l' ] ),
		weakContrast - target,
		strongLightness,
		strongContrast - target
	);
}

/**
 * Correct a WCAG shortfall introduced by color serialization. Search only
 * toward the supplied strong color, then fall back to it if no sampled color
 * passes. The caller must still validate the returned color for warnings.
 *
 * @param options                     Serialization inputs.
 * @param options.color               Foreground before serialization.
 * @param options.getColorAtLightness Color path indexed by OKLCH lightness.
 * @param options.getStrongColor      Resolve the strongest allowed fallback.
 * @param options.referenceLuminances Background luminances to check together.
 * @param options.target              Unpadded WCAG contrast floor.
 */
function serializeColorMeetingContrast( {
	color,
	getColorAtLightness,
	getStrongColor,
	referenceLuminances,
	target,
}: {
	color: PlainColorObject;
	getColorAtLightness: GetColorForLightness;
	getStrongColor: () => PlainColorObject;
	referenceLuminances: readonly number[];
	target: number;
} ) {
	const serializedColor = getColorString( color );
	if ( meetsContrastFloor( serializedColor, referenceLuminances, target ) ) {
		return serializedColor;
	}

	const strongColor = getStrongColor();
	const colorLightness = get( color, [ OKLCH, 'l' ] );
	const strongLightness = get( strongColor, [ OKLCH, 'l' ] );
	const direction = Math.sign( strongLightness - colorLightness );
	const maximumOffset = Math.abs( strongLightness - colorLightness );

	for ( let offset = 0.00025; offset < maximumOffset; offset += 0.00025 ) {
		const strengthened = getColorString(
			getColorAtLightness( colorLightness + direction * offset )
		);
		if ( meetsContrastFloor( strengthened, referenceLuminances, target ) ) {
			return strengthened;
		}
	}

	return getColorString( strongColor );
}

/**
 * Restore the preferred FGS4-to-FGS5 APCA gap after serialization, without
 * moving FGS4. Only extend FGS5 when the endpoint can meet both the gap and
 * WCAG floor; otherwise retain the already compressed interaction color.
 *
 * @param options                     Serialization inputs.
 * @param options.background          Fixed background for APCA comparisons.
 * @param options.normalColor         Serialized FGS4.
 * @param options.strongColor         Serialized FGS5, already checked for WCAG.
 * @param options.strongEndpoint      Endpoint allowed by the foreground path.
 * @param options.getColorAtLightness Color path indexed by OKLCH lightness.
 * @param options.referenceLuminances Background luminances to check together.
 * @param options.wcagTarget          Unpadded WCAG contrast floor.
 * @param options.perceptualTarget    Preferred APCA gap in Lc.
 */
function serializeColorMeetingPerceptualInterval( {
	background,
	normalColor,
	strongColor,
	strongEndpoint,
	getColorAtLightness,
	referenceLuminances,
	wcagTarget,
	perceptualTarget,
}: {
	background: PlainColorObject;
	normalColor: string;
	strongColor: string;
	strongEndpoint: PlainColorObject;
	getColorAtLightness: GetColorForLightness;
	referenceLuminances: readonly number[];
	wcagTarget: number;
	perceptualTarget: number;
} ) {
	const normalContrast = getPerceptualContrastMagnitude(
		background,
		normalColor
	);
	const requiredStrongContrast = normalContrast + perceptualTarget;
	const strongContrast = getPerceptualContrastMagnitude(
		background,
		strongColor
	);
	if ( strongContrast >= requiredStrongContrast ) {
		return strongColor;
	}

	const serializedEndpoint = getColorString( strongEndpoint );
	if (
		getPerceptualContrastMagnitude( background, serializedEndpoint ) <
			requiredStrongContrast ||
		! meetsContrastFloor(
			serializedEndpoint,
			referenceLuminances,
			wcagTarget
		)
	) {
		return strongColor;
	}

	const strongLightness = get( clampToGamut( strongColor ), [ OKLCH, 'l' ] );
	const endpointLightness = get( strongEndpoint, [ OKLCH, 'l' ] );
	const direction = Math.sign( endpointLightness - strongLightness );
	if ( direction === 0 ) {
		return strongColor;
	}
	const maximumOffset = Math.abs( endpointLightness - strongLightness );

	for ( let offset = 0.00025; offset <= maximumOffset; offset += 0.00025 ) {
		const strengthened = getColorString(
			getColorAtLightness( strongLightness + direction * offset )
		);
		if (
			getPerceptualContrastMagnitude( background, strengthened ) >=
				requiredStrongContrast &&
			meetsContrastFloor( strengthened, referenceLuminances, wcagTarget )
		) {
			return strengthened;
		}
	}

	return serializedEndpoint;
}

/**
 * Rebuild the foreground part of an otherwise complete ramp. APCA positions
 * the intermediate steps within the visible contrast range, while WCAG ratios
 * remain hard floors across the surfaces where each step is used.
 *
 * @param ramp                    Ramp whose foreground steps will be rebuilt.
 * @param backgroundRamp          Background ramp on which the colors will appear.
 * @param config                  Foreground scale anchors, targets, and constraints.
 * @param includeInteractionState Whether FGS5 is needed as an output color.
 */
export function buildForegroundScale(
	ramp: BaseRampResult,
	backgroundRamp: BaseRampResult,
	config: ForegroundScaleConfig,
	includeInteractionState?: true
): RampResult;
export function buildForegroundScale(
	ramp: BaseRampResult,
	backgroundRamp: BaseRampResult,
	config: ForegroundScaleConfig,
	includeInteractionState: boolean
): AccentRampResult;
export function buildForegroundScale(
	ramp: BaseRampResult,
	backgroundRamp: BaseRampResult,
	config: ForegroundScaleConfig,
	includeInteractionState = true
): AccentRampResult {
	const seed = clampToGamut( ramp.ramp[ config.seed ] );
	const getColorAtLightness = createColorForLightness( seed, config );
	// Parse and convert this once. APCA evaluates it for every intermediate
	// foreground candidate.
	const displayBackground = to(
		clampToGamut( backgroundRamp.ramp[ config.perceptualReference ] ),
		sRGB
	);
	const steps = Object.fromEntries(
		config.steps.map( ( step ) => [ step.name, step ] )
	) as Record<
		ForegroundRampStep,
		ForegroundScaleConfig[ 'steps' ][ number ]
	>;
	const referenceLuminances = Object.fromEntries(
		config.steps.map( ( step ) => [
			step.name,
			getConstraintReferenceLuminances( step, ramp, backgroundRamp ),
		] )
	) as Record< ForegroundRampStep, number[] >;
	const strongStep = steps.fgSurface5;
	const strongEndpoint = getColorAtLightness(
		ramp.direction === 'lighter' ? 1 : 0
	);
	const colors = new Map< ForegroundRampStep, PlainColorObject >();

	for ( const step of config.steps.filter(
		( stepConfig ) => stepConfig.preserveAnchor === true
	) ) {
		const currentColor = clampToGamut( ramp.ramp[ step.name ] );
		colors.set(
			step.name,
			meetsContrastTarget(
				currentColor,
				referenceLuminances[ step.name ],
				step.contrast.target
			)
				? currentColor
				: findColorAtContrastTarget( {
						getColorAtLightness: ( lightness ) =>
							getChromaPreservingColorForLightness(
								currentColor,
								lightness
							),
						weakColor: currentColor,
						strongColor: strongEndpoint,
						referenceLuminances: referenceLuminances[ step.name ],
						target: step.contrast.target,
				  } )
		);
	}

	const fgSurface2 = colors.get( 'fgSurface2' )!;
	const fgSurface3 = findColorAtContrastTarget( {
		getColorAtLightness,
		weakColor: getColorAtLightness( get( fgSurface2, [ OKLCH, 'l' ] ) ),
		strongColor: strongEndpoint,
		referenceLuminances: referenceLuminances.fgSurface3,
		target: steps.fgSurface3.contrast.target,
	} );
	const fgSurface3Contrast = getPerceptualContrastMagnitude(
		displayBackground,
		fgSurface3
	);
	const minimumFgSurface4 = findColorAtContrastTarget( {
		getColorAtLightness,
		weakColor: fgSurface3,
		strongColor: strongEndpoint,
		referenceLuminances: referenceLuminances.fgSurface4,
		target: steps.fgSurface4.contrast.target,
	} );
	const minimumFgSurface4Contrast = getPerceptualContrastMagnitude(
		displayBackground,
		minimumFgSurface4
	);
	const maximumStrongContrast = getPerceptualContrastMagnitude(
		displayBackground,
		strongEndpoint
	);
	const {
		normalContrast: preferredNormalContrast,
		endpointReserve,
		weakToNormal,
		normalToActive,
	} = config.perceptualTargets;
	const weakToNormalTarget =
		weakToNormal + PERCEPTUAL_INTERVAL_SERIALIZATION_TOPUP;
	const normalToActiveTarget =
		normalToActive + PERCEPTUAL_INTERVAL_SERIALIZATION_TOPUP;
	const minimumNormalContrast = Math.max(
		minimumFgSurface4Contrast,
		fgSurface3Contrast + weakToNormalTarget
	);
	const preferredActiveContrast = Math.max(
		fgSurface3Contrast,
		maximumStrongContrast - endpointReserve
	);
	const maximumPreferredNormalContrast =
		preferredActiveContrast - normalToActiveTarget;
	const maximumAbsoluteNormalContrast =
		maximumStrongContrast - normalToActiveTarget;
	let requestedNormalContrast: number;
	if ( minimumNormalContrast <= maximumPreferredNormalContrast ) {
		requestedNormalContrast = Math.max(
			minimumNormalContrast,
			Math.min( preferredNormalContrast, maximumPreferredNormalContrast )
		);
	} else if ( minimumNormalContrast <= maximumAbsoluteNormalContrast ) {
		// Spend the endpoint reserve only when the semantic intervals need it.
		requestedNormalContrast = minimumNormalContrast;
	} else {
		// Both preferred intervals do not fit. Keep FGS4 at its WCAG floor so
		// every remaining bit of perceptual range belongs to FGS5.
		requestedNormalContrast = Math.min(
			maximumStrongContrast,
			minimumFgSurface4Contrast
		);
	}
	let normalColor = findColorAtPerceptualContrast( {
		background: displayBackground,
		getColorAtLightness,
		weakColor: minimumFgSurface4,
		strongColor: strongEndpoint,
		target: requestedNormalContrast,
	} );
	if (
		! meetsContrastTarget(
			normalColor,
			referenceLuminances.fgSurface4,
			steps.fgSurface4.contrast.target
		)
	) {
		normalColor = findColorAtContrastTarget( {
			getColorAtLightness,
			weakColor: normalColor,
			strongColor: strongEndpoint,
			referenceLuminances: referenceLuminances.fgSurface4,
			target: steps.fgSurface4.contrast.target,
		} );
	}
	// Status ramps need the spacing budget above, but only need this color as
	// a bound when serialization requires correction. Reuse it across corrections.
	let strongColor: PlainColorObject | undefined;
	function getStrongColor(): PlainColorObject {
		if ( strongColor ) {
			return strongColor;
		}

		const normalContrast = getPerceptualContrastMagnitude(
			displayBackground,
			normalColor
		);
		const requestedStrongContrast = Math.min(
			maximumStrongContrast,
			Math.max(
				normalContrast + normalToActiveTarget,
				preferredActiveContrast
			)
		);
		strongColor = findColorAtPerceptualContrast( {
			background: displayBackground,
			getColorAtLightness,
			weakColor: normalColor,
			strongColor: strongEndpoint,
			target: requestedStrongContrast,
		} );
		if (
			! meetsContrastTarget(
				strongColor,
				referenceLuminances.fgSurface5,
				strongStep.contrast.target
			)
		) {
			strongColor = findColorAtContrastTarget( {
				getColorAtLightness,
				weakColor: strongColor,
				strongColor: strongEndpoint,
				referenceLuminances: referenceLuminances.fgSurface5,
				target: strongStep.contrast.target,
			} );
		}
		return strongColor;
	}

	colors.set( 'fgSurface3', fgSurface3 );
	colors.set( 'fgSurface4', normalColor );
	if ( includeInteractionState ) {
		colors.set( 'fgSurface5', getStrongColor() );
	}

	const outputSteps = includeInteractionState
		? config.steps
		: config.steps.filter( ( step ) => step.name !== 'fgSurface5' );
	function serializeStep( step: ForegroundScaleConfig[ 'steps' ][ number ] ) {
		const color = colors.get( step.name )!;
		return serializeColorMeetingContrast( {
			color,
			getColorAtLightness:
				step.preserveAnchor && step !== strongStep
					? ( lightness ) =>
							getChromaPreservingColorForLightness(
								color,
								lightness
							)
					: getColorAtLightness,
			getStrongColor,
			referenceLuminances: referenceLuminances[ step.name ],
			target: step.contrast.target,
		} );
	}
	const nextRamp: BaseRamp & { fgSurface4: string; fgSurface5?: string } = {
		...ramp.ramp,
		fgSurface4: serializeStep( steps.fgSurface4 ),
	};
	for ( const step of outputSteps ) {
		if ( step.name !== 'fgSurface4' ) {
			nextRamp[ step.name ] = serializeStep( step );
		}
	}
	if ( includeInteractionState ) {
		nextRamp.fgSurface5 = serializeColorMeetingPerceptualInterval( {
			background: displayBackground,
			normalColor: nextRamp.fgSurface4,
			strongColor: nextRamp.fgSurface5!,
			strongEndpoint,
			getColorAtLightness,
			referenceLuminances: referenceLuminances.fgSurface5,
			wcagTarget: strongStep.contrast.target,
			perceptualTarget: normalToActive,
		} );
	}

	const foregroundStepNames = new Set< keyof Ramp >(
		config.steps.map( ( { name } ) => name )
	);
	const warnings = ( ramp.warnings ?? [] ).filter(
		( step ) => ! foregroundStepNames.has( step )
	);
	for ( const step of outputSteps ) {
		if (
			! meetsContrastFloor(
				nextRamp[ step.name ]!,
				referenceLuminances[ step.name ],
				step.contrast.target
			)
		) {
			warnings.push( step.name );
		}
	}

	return {
		...ramp,
		ramp: nextRamp,
		warnings: warnings.length > 0 ? warnings : undefined,
	};
}
