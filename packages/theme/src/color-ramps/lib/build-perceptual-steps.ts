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
import { UNIVERSAL_CONTRAST_TOPUP } from './constants.ts';
import type { AccentRampPurpose, BaseRamp, BaseRampResult } from './types.ts';
import { solveWithBisect } from './utils.ts';

ColorSpace.register( sRGB );
ColorSpace.register( OKLab );
ColorSpace.register( OKLCH );
ColorSpace.register( OKLrab );

type GetColorAtLightness = ( lightness: number ) => PlainColorObject;

const MINIMUM_CROSS_LANE_LIGHTNESS_GAP = 0.005;
// The configured 3.01 target leaves room for the 3:1 hard gate after sRGB
// serialization. The universal top-up covers the solver tolerance.
const SERIALIZED_STROKE_WCAG_TARGET = 3.01 + UNIVERSAL_CONTRAST_TOPUP;

function clampUnitInterval( value: number ) {
	return Math.max( 0, Math.min( 1, value ) );
}

function getPerceptualLightness( color: string | PlainColorObject ) {
	return get( color, [ OKLrab, 'l' ] );
}

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

function getColorForPerceptualLightness(
	color: string,
	perceptualLightness: number
) {
	return getColorString(
		createColorAtPerceptualLightness( color )(
			clampUnitInterval( perceptualLightness )
		)
	);
}

function createAnchoredColorForStepAtPerceptualLightness( {
	ramp,
	step,
	anchor,
	startLightness,
	endLightness,
}: {
	ramp: Record< keyof BaseRamp, string >;
	step: keyof BaseRamp;
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

function rebuildSurfaces( ramp: BaseRampResult, purpose: AccentRampPurpose ) {
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
	const elevationGap = Math.max(
		0.001,
		Math.min(
			authoredElevationGap,
			surface2Lightness - 0.001,
			1 - surface2Lightness - 0.001
		)
	);
	const targetSurface1Lightness = surface2Lightness - elevationGap;
	const targetSurface3Lightness = surface2Lightness + elevationGap;
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
	const targetLightnesses = {
		surface1: targetSurface1Lightness,
		surface2: surface2Lightness,
		surface3: targetSurface3Lightness,
		surface4: surface4Lightness,
		surface5: surface5Lightness,
		surface6: surface6Lightness,
	} as const;

	for ( const [ step, lightness ] of Object.entries( targetLightnesses ) ) {
		// Keep SF6's spacing anchor above, but avoid its unused output conversion.
		if ( purpose !== 'full' && step === 'surface6' ) {
			continue;
		}
		nextRamp[ step as keyof typeof targetLightnesses ] =
			getColorForPerceptualLightness(
				ramp.ramp[ step as keyof typeof targetLightnesses ],
				lightness
			);
	}

	return nextRamp;
}

function getStrokeReferences(
	ramp: Record< keyof BaseRamp, string >,
	backgroundRamp: BaseRampResult
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

function rebuildStrokes(
	ramp: BaseRampResult,
	backgroundRamp: BaseRampResult,
	purpose: AccentRampPurpose
) {
	const nextRamp = { ...ramp.ramp };
	const references = getStrokeReferences( nextRamp, backgroundRamp );
	nextRamp.stroke3 = findColorMeetingWcag( {
		color: nextRamp.stroke3,
		references,
		target: SERIALIZED_STROKE_WCAG_TARGET,
	} );

	const stroke3Lightness = getPerceptualLightness( nextRamp.stroke3 );
	if ( purpose === 'full' ) {
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
	}
	if ( purpose === 'status' ) {
		return nextRamp;
	}

	const stroke3Contrast = Math.abs(
		contrastAPCA( nextRamp.surface3, nextRamp.stroke3 )
	);
	const stroke4Contrast = Math.abs(
		contrastAPCA( nextRamp.surface3, nextRamp.stroke4 )
	);
	if (
		stroke4Contrast >= stroke3Contrast &&
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
 * @param purpose        Which accent steps need their final reconstruction.
 */
export function buildPerceptualSteps(
	ramp: BaseRampResult,
	backgroundRamp?: BaseRampResult,
	purpose: AccentRampPurpose = 'full'
): BaseRampResult {
	const surfaceResult = {
		...ramp,
		ramp: rebuildSurfaces( ramp, purpose ),
	};

	return {
		...surfaceResult,
		ramp: rebuildStrokes(
			surfaceResult,
			backgroundRamp ?? surfaceResult,
			purpose
		),
	};
}
