import {
	ColorSpace,
	contrastAPCA,
	deltaEOK2,
	get,
	OKLab,
	OKLCH,
	OKLrab,
	sRGB,
	to,
	type PlainColorObject,
} from 'colorjs.io/fn';
import { clampToGamut, getColorString, getContrast } from './color-utils.ts';
import {
	CONTRAST_COMBINATIONS,
	UNIVERSAL_CONTRAST_TOPUP,
} from './constants.ts';
import type { Ramp, RampResult } from './types.ts';
import { solveWithBisect } from './utils.ts';

type GetColorAtLightness = ( lightness: number ) => PlainColorObject;
type SurfaceStep =
	| 'surface1'
	| 'surface2'
	| 'surface3'
	| 'surface4'
	| 'surface5'
	| 'surface6';
type SurfaceOrderConstraint = {
	reference: string;
	direction: 'lighter' | 'darker';
};

const MINIMUM_CROSS_LANE_LIGHTNESS_GAP = 0.005;
const SERIALIZED_STROKE_WCAG_TARGET = 3.01 + UNIVERSAL_CONTRAST_TOPUP;
const SURFACE_CONSTRAINT_SEARCH_ITERATIONS = 12;

function clampUnitInterval( value: number ) {
	return Math.max( 0, Math.min( 1, value ) );
}

function getPerceptualLightness( color: string | PlainColorObject ) {
	return get( color, [ OKLrab, 'l' ] );
}

/**
 * Create a path indexed by OKLr lightness. Preserve the seed's authored
 * chroma and hue before gamut mapping, which may reduce chroma.
 *
 * @param seed Color supplying the authored chroma and hue.
 */
function createColorAtPerceptualLightness(
	seed: string | PlainColorObject
): GetColorAtLightness {
	const parsedSeed = clampToGamut( seed );
	const chroma = get( parsedSeed, [ OKLCH, 'c' ] );
	const hue = get( parsedSeed, [ OKLCH, 'h' ] );

	return ( perceptualLightness ) => {
		const oklab = to(
			{
				space: OKLrab,
				coords: [ perceptualLightness, 0, 0 ],
				alpha: 1,
			},
			OKLab
		);

		return clampToGamut( {
			space: OKLCH,
			coords: [ get( oklab, [ OKLab, 'l' ] ), chroma, hue ],
			alpha: parsedSeed.alpha,
		} );
	};
}

/**
 * Blend from the anchor's chroma to the step's authored chroma as OKLr
 * lightness advances. The step supplies the hue.
 *
 * @param options                Path inputs.
 * @param options.ramp           Ramp containing the authored stroke colors.
 * @param options.step           Stroke whose hue and final chroma are retained.
 * @param options.anchor         Color supplying the starting chroma.
 * @param options.startLightness Starting OKLr lightness.
 * @param options.endLightness   Ending OKLr lightness.
 */
function createAnchoredColorForStepAtPerceptualLightness( {
	ramp,
	step,
	anchor,
	startLightness,
	endLightness,
}: {
	ramp: Record< keyof Ramp, string >;
	step: keyof Ramp;
	anchor: string;
	startLightness: number;
	endLightness: number;
} ) {
	const stepColor = to( clampToGamut( ramp[ step ] ), OKLCH );
	const getTargetColor = createColorAtPerceptualLightness( stepColor );
	const anchorColor = to( clampToGamut( anchor ), OKLCH );
	const anchorChroma = get( anchorColor, [ OKLCH, 'c' ] );
	const stepChroma = get( stepColor, [ OKLCH, 'c' ] );
	const distance = endLightness - startLightness;

	return ( perceptualLightness: number ) => {
		const targetColor = to( getTargetColor( perceptualLightness ), OKLCH );
		const progress =
			distance === 0
				? 1
				: clampUnitInterval(
						( perceptualLightness - startLightness ) / distance
				  );

		return clampToGamut( {
			space: OKLCH,
			coords: [
				get( targetColor, [ OKLCH, 'l' ] ),
				anchorChroma + ( stepChroma - anchorChroma ) * progress,
				get( stepColor, [ OKLCH, 'h' ] ),
			],
			alpha: targetColor.alpha,
		} );
	};
}

/**
 * Search a lightness interval for an OKLab color difference in DeltaEOK2
 * units. Use the closer endpoint when the interval does not bracket the target.
 *
 * @param options                     Search inputs.
 * @param options.reference           Color from which differences are measured.
 * @param options.getColorAtLightness Color path indexed by OKLr lightness.
 * @param options.startLightness      Starting OKLr lightness.
 * @param options.endLightness        Ending OKLr lightness.
 * @param options.target              Requested DeltaEOK2 difference.
 */
function findColorAtDeltaE( {
	reference,
	getColorAtLightness,
	startLightness,
	endLightness,
	target,
}: {
	reference: PlainColorObject;
	getColorAtLightness: GetColorAtLightness;
	startLightness: number;
	endLightness: number;
	target: number;
} ) {
	const getDifference = ( color: PlainColorObject ) =>
		deltaEOK2( reference, color );
	const startColor = getColorAtLightness( startLightness );
	const endColor = getColorAtLightness( endLightness );
	const startDelta = getDifference( startColor ) - target;
	const endDelta = getDifference( endColor ) - target;

	if ( Math.sign( startDelta ) === Math.sign( endDelta ) ) {
		return Math.abs( startDelta ) <= Math.abs( endDelta )
			? startColor
			: endColor;
	}

	return solveWithBisect(
		getColorAtLightness,
		( color ) => getDifference( color ) - target,
		startLightness,
		startDelta,
		endLightness,
		endDelta
	);
}

/**
 * Keep a passing stroke or move it toward the endpoint with the best minimum
 * contrast across all references.
 *
 * @param options            Search inputs.
 * @param options.color      Authored stroke color.
 * @param options.references Surfaces the stroke must contrast with.
 * @param options.target     WCAG ratio, including the safety margin.
 */
function findColorMeetingWcag( {
	color,
	references,
	target,
}: {
	color: string;
	references: readonly string[];
	target: number;
} ) {
	if (
		references.every(
			( reference ) => getContrast( reference, color ) >= target
		)
	) {
		return color;
	}

	const getColorAtLightness = createColorAtPerceptualLightness( color );
	const endpoints = [ 0, 1 ].map( ( lightness ) => {
		const endpoint = getColorAtLightness( lightness );
		return {
			color: endpoint,
			lightness,
			margin: Math.min(
				...references.map( ( reference ) =>
					Math.log( getContrast( reference, endpoint ) / target )
				)
			),
		};
	} );
	const strongest = endpoints.reduce( ( best, candidate ) =>
		candidate.margin > best.margin ? candidate : best
	);

	if ( strongest.margin < 0 ) {
		return getColorString( strongest.color );
	}

	const colorLightness = getPerceptualLightness( color );
	const weakColor = getColorAtLightness( colorLightness );
	const weakMargin = Math.min(
		...references.map( ( reference ) =>
			Math.log( getContrast( reference, weakColor ) / target )
		)
	);
	if ( weakMargin >= 0 ) {
		return getColorString( weakColor );
	}

	return getColorString(
		solveWithBisect(
			getColorAtLightness,
			( candidate ) =>
				Math.min(
					...references.map( ( reference ) =>
						Math.log( getContrast( reference, candidate ) / target )
					)
				),
			colorLightness,
			weakMargin,
			strongest.lightness,
			strongest.margin
		)
	);
}

function getSurfaceForegroundRequirements(
	step: SurfaceStep,
	ramp: Record< keyof Ramp, string >
) {
	return CONTRAST_COMBINATIONS.flatMap( ( requirement ) =>
		requirement.bgs.includes( step )
			? requirement.fgs
					.filter( ( foreground ) => foreground !== 'stroke3' )
					.map( ( foreground ) => ( {
						color: ramp[ foreground ],
						target: requirement.target,
					} ) )
			: []
	);
}

function surfaceMeetsForegroundRequirements(
	color: string,
	requirements: ReturnType< typeof getSurfaceForegroundRequirements >
) {
	return requirements.every(
		( requirement ) =>
			getContrast( color, requirement.color ) >= requirement.target
	);
}

function surfaceMeetsOrderConstraint(
	color: string,
	constraint?: SurfaceOrderConstraint
) {
	if ( ! constraint ) {
		return true;
	}

	const lightness = getPerceptualLightness( color );
	const referenceLightness = getPerceptualLightness( constraint.reference );

	return constraint.direction === 'lighter'
		? lightness >= referenceLightness
		: lightness <= referenceLightness;
}

/**
 * Move a surface toward its perceptual target without crossing an existing
 * foreground contrast floor. The original base-solver color is the fallback.
 *
 * @param ramp            Base ramp before surface reconstruction.
 * @param step            Surface to move.
 * @param targetLightness Requested OKLr lightness.
 * @param orderConstraint Required semantic ordering against another surface.
 */
function rebuildSurfaceWithinConstraints(
	ramp: Record< keyof Ramp, string >,
	step: SurfaceStep,
	targetLightness: number,
	orderConstraint?: SurfaceOrderConstraint
) {
	const original = ramp[ step ];
	const requirements = getSurfaceForegroundRequirements( step, ramp );
	const getColorAtLightness = createColorAtPerceptualLightness( original );
	const getSerializedColor = ( lightness: number ) =>
		getColorString( getColorAtLightness( lightness ) );
	const target = getSerializedColor( targetLightness );

	const isValid = ( color: string ) =>
		surfaceMeetsForegroundRequirements( color, requirements ) &&
		surfaceMeetsOrderConstraint( color, orderConstraint );

	if ( isValid( target ) ) {
		return target;
	}

	if ( ! isValid( original ) ) {
		return original;
	}

	let passingLightness = getPerceptualLightness( original );
	let failingLightness = targetLightness;
	for (
		let index = 0;
		index < SURFACE_CONSTRAINT_SEARCH_ITERATIONS;
		index++
	) {
		const candidateLightness = ( passingLightness + failingLightness ) / 2;
		const candidate = getSerializedColor( candidateLightness );

		if ( isValid( candidate ) ) {
			passingLightness = candidateLightness;
		} else {
			failingLightness = candidateLightness;
		}
	}

	return getSerializedColor( passingLightness );
}

/**
 * Balance surface1 and surface3 around surface2 in OKLr lightness. Space
 * surface4 through surface6 beyond the elevation steps in the ramp direction.
 *
 * @param ramp Base ramp with surface1 through surface3 ordered by elevation.
 */
function rebuildSurfaces( ramp: RampResult ) {
	const nextRamp = { ...ramp.ramp };
	const surface1Lightness = getPerceptualLightness( ramp.ramp.surface1 );
	const surface2Lightness = getPerceptualLightness( ramp.ramp.surface2 );
	const surface3Lightness = getPerceptualLightness( ramp.ramp.surface3 );
	const authoredElevationGap =
		( surface2Lightness -
			surface1Lightness +
			surface3Lightness -
			surface2Lightness ) /
		2;
	const elevationGap = Math.max( 0.001, authoredElevationGap );
	const targetSurface1Lightness = clampUnitInterval(
		surface2Lightness - elevationGap
	);
	const targetSurface3Lightness = clampUnitInterval(
		surface2Lightness + elevationGap
	);
	const emphasisDirection = ramp.direction === 'lighter' ? 1 : -1;
	const sameDirectionElevationLightness =
		ramp.direction === 'lighter'
			? targetSurface3Lightness
			: targetSurface1Lightness;
	const authoredSurface6Distance = Math.abs(
		getPerceptualLightness( ramp.ramp.surface6 ) - surface2Lightness
	);
	const maximumEmphasisDistance =
		ramp.direction === 'lighter'
			? 1 - surface2Lightness
			: surface2Lightness;
	const minimumEmphasisDistance =
		Math.abs( sameDirectionElevationLightness - surface2Lightness ) +
		MINIMUM_CROSS_LANE_LIGHTNESS_GAP * 3;
	const surface6Distance = Math.min(
		maximumEmphasisDistance,
		Math.max( authoredSurface6Distance, minimumEmphasisDistance )
	);
	const surface6Lightness =
		surface2Lightness + emphasisDirection * surface6Distance;
	const availableAfterElevation = Math.abs(
		surface6Lightness - sameDirectionElevationLightness
	);
	const crossLaneGap = Math.min(
		MINIMUM_CROSS_LANE_LIGHTNESS_GAP,
		availableAfterElevation / 3
	);
	const minimumSurface4Lightness =
		sameDirectionElevationLightness + emphasisDirection * crossLaneGap;
	const evenlySpacedSurface4Lightness =
		surface2Lightness + emphasisDirection * ( surface6Distance / 3 );
	const surface4Lightness =
		ramp.direction === 'lighter'
			? Math.max(
					evenlySpacedSurface4Lightness,
					minimumSurface4Lightness
			  )
			: Math.min(
					evenlySpacedSurface4Lightness,
					minimumSurface4Lightness
			  );
	const surface5Lightness =
		surface4Lightness + ( surface6Lightness - surface4Lightness ) / 2;
	nextRamp.surface1 = rebuildSurfaceWithinConstraints(
		ramp.ramp,
		'surface1',
		targetSurface1Lightness,
		{ reference: nextRamp.surface2, direction: 'darker' }
	);
	nextRamp.surface3 = rebuildSurfaceWithinConstraints(
		ramp.ramp,
		'surface3',
		targetSurface3Lightness,
		{ reference: nextRamp.surface2, direction: 'lighter' }
	);
	nextRamp.surface4 = rebuildSurfaceWithinConstraints(
		ramp.ramp,
		'surface4',
		surface4Lightness,
		{
			reference:
				ramp.direction === 'lighter'
					? nextRamp.surface3
					: nextRamp.surface1,
			direction: ramp.direction,
		}
	);
	nextRamp.surface5 = rebuildSurfaceWithinConstraints(
		ramp.ramp,
		'surface5',
		surface5Lightness,
		{ reference: nextRamp.surface4, direction: ramp.direction }
	);
	nextRamp.surface6 = rebuildSurfaceWithinConstraints(
		ramp.ramp,
		'surface6',
		surface6Lightness,
		{ reference: nextRamp.surface5, direction: ramp.direction }
	);

	return nextRamp;
}

function getStrokeReferences(
	ramp: Record< keyof Ramp, string >,
	backgroundRamp: RampResult
) {
	return Array.from(
		new Set( [
			ramp.surface1,
			ramp.surface2,
			ramp.surface3,
			backgroundRamp.ramp.surface1,
			backgroundRamp.ramp.surface2,
			backgroundRamp.ramp.surface3,
		] )
	);
}

/**
 * Repair stroke3 against the rebuilt surfaces, then reposition stroke2 and
 * stroke4. WCAG correction takes precedence over perceptual spacing.
 *
 * @param ramp           Ramp with its surfaces already rebuilt.
 * @param backgroundRamp Additional surfaces behind accent strokes.
 */
function rebuildStrokes( ramp: RampResult, backgroundRamp: RampResult ) {
	const nextRamp = { ...ramp.ramp };
	const references = getStrokeReferences( nextRamp, backgroundRamp );
	nextRamp.stroke3 = findColorMeetingWcag( {
		color: nextRamp.stroke3,
		references,
		target: SERIALIZED_STROKE_WCAG_TARGET,
	} );

	const stroke3Lightness = getPerceptualLightness( nextRamp.stroke3 );
	const stroke1Reference = to( clampToGamut( nextRamp.stroke1 ), OKLab );
	const stroke1To3Difference = deltaEOK2(
		stroke1Reference,
		nextRamp.stroke3
	);
	const authoredStroke2Difference = deltaEOK2(
		stroke1Reference,
		ramp.ramp.stroke2
	);
	const stroke1Lightness = getPerceptualLightness( nextRamp.stroke1 );
	const getStroke2AtLightness =
		createAnchoredColorForStepAtPerceptualLightness( {
			ramp: nextRamp,
			step: 'stroke2',
			anchor: nextRamp.stroke1,
			startLightness: stroke1Lightness,
			endLightness: stroke3Lightness,
		} );
	nextRamp.stroke2 = getColorString(
		findColorAtDeltaE( {
			reference: stroke1Reference,
			getColorAtLightness: getStroke2AtLightness,
			startLightness: stroke1Lightness,
			endLightness: stroke3Lightness,
			target: Math.min(
				authoredStroke2Difference,
				stroke1To3Difference * 0.95
			),
		} )
	);

	const stroke3Strength = Math.abs(
		contrastAPCA( nextRamp.surface3, nextRamp.stroke3 )
	);
	const stroke4Strength = Math.abs(
		contrastAPCA( nextRamp.surface3, nextRamp.stroke4 )
	);
	if (
		stroke4Strength >= stroke3Strength &&
		references.every(
			( reference ) =>
				getContrast( reference, nextRamp.stroke4 ) >=
				SERIALIZED_STROKE_WCAG_TARGET
		)
	) {
		return nextRamp;
	}

	const stroke3Reference = to( clampToGamut( nextRamp.stroke3 ), OKLab );
	const minimumActiveDifference = deltaEOK2(
		stroke3Reference,
		ramp.ramp.stroke4
	);
	const stroke4EndLightness = ramp.direction === 'lighter' ? 1 : 0;
	const getStroke4AtLightness =
		createAnchoredColorForStepAtPerceptualLightness( {
			ramp: nextRamp,
			step: 'stroke4',
			anchor: nextRamp.stroke3,
			startLightness: stroke3Lightness,
			endLightness: stroke4EndLightness,
		} );
	const stroke4Candidate = getColorString(
		findColorAtDeltaE( {
			reference: stroke3Reference,
			getColorAtLightness: getStroke4AtLightness,
			startLightness: stroke3Lightness,
			endLightness: stroke4EndLightness,
			target: minimumActiveDifference,
		} )
	);
	nextRamp.stroke4 = findColorMeetingWcag( {
		color: stroke4Candidate,
		references,
		target: SERIALIZED_STROKE_WCAG_TARGET,
	} );

	return nextRamp;
}

/**
 * Rebalance surface lightness and stroke strength without replacing the
 * chroma policy established by the base ramp configuration.
 *
 * @param ramp           Base ramp to adjust.
 * @param backgroundRamp Background surfaces used by accent strokes.
 */
export function buildPerceptualSteps(
	ramp: RampResult,
	backgroundRamp?: RampResult
): RampResult {
	ColorSpace.register( sRGB );
	const surfaceResult = {
		...ramp,
		ramp: rebuildSurfaces( ramp ),
	};

	return {
		...surfaceResult,
		ramp: rebuildStrokes( surfaceResult, backgroundRamp ?? surfaceResult ),
	};
}
