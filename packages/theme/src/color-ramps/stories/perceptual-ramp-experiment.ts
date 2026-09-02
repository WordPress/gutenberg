import {
	ColorSpace,
	contrastAPCA,
	deltaEOK2,
	get,
	OKLab,
	OKLCH,
	OKLCH_sRGB as OklchSrgb,
	OKLrab,
	sRGB,
	to,
	type PlainColorObject,
} from 'colorjs.io/fn';
import { buildAccentRamp, buildBgRamp } from '../index.ts';
import { buildForegroundScale } from '../lib/build-foreground-scale';
import { clampToGamut, getColorString, getContrast } from '../lib/color-utils';
import {
	DEFAULT_SEED_COLORS,
	UNIVERSAL_CONTRAST_TOPUP,
} from '../lib/constants';
import { ACCENT_RAMP_CONFIG, BG_RAMP_CONFIG } from '../lib/ramp-configs';
import { taperChroma } from '../lib/taper-chroma';
import type { Ramp, RampResult } from '../lib/types';
import { buildRamp } from '../lib/index';
import {
	clampAccentScaleReferenceLightness,
	solveWithBisect,
} from '../lib/utils';

ColorSpace.register( sRGB );
ColorSpace.register( OKLab );
ColorSpace.register( OKLCH );
ColorSpace.register( OklchSrgb );
ColorSpace.register( OKLrab );

export const EXPERIMENTAL_RAMP_METHODS = [
	'anchored',
	'constrained-perceptual',
	'apca-all',
	'role-hybrid',
	'pinned-role-hybrid',
] as const;

export type ExperimentalRampMethod =
	( typeof EXPERIMENTAL_RAMP_METHODS )[ number ];

export type ExperimentalThemeRamps = {
	background: RampResult;
	primary: RampResult;
	error: RampResult;
};

type RampFamily = 'neutral' | 'accent';
type PerceptualMetric = 'apca' | 'delta-e';
type ChromaMode = 'absolute' | 'relative' | 'tapered';
type GetColorAtLightness = ( lightness: number ) => PlainColorObject;

const SURFACE_STEPS = [ 'surface4', 'surface5', 'surface6' ] as const;
const PINNED_SURFACE_STEPS = [
	'surface1',
	'surface3',
	'surface4',
	'surface5',
	'surface6',
] as const;
const PINNED_SURFACE_PROGRESS = [ 0.15, 0.3, 0.55, 0.75, 1 ] as const;
const STROKE_STEPS = [ 'stroke1', 'stroke2', 'stroke3', 'stroke4' ] as const;
const SURFACE_PROGRESS = [ 1 / 3, 2 / 3, 1 ] as const;
const STROKE_PROGRESS = [ 0, 1 / 3, 2 / 3, 1 ] as const;
const MINIMUM_ACTIVE_FILL_DELTA_E = 0.055;
const MINIMUM_ACTIVE_FILL_APCA = 12;
const SERIALIZED_FILL_WCAG_TARGET = BG_RAMP_CONFIG.steps.fgFill.contrast.target;
const SERIALIZED_ACTIVE_FILL_WCAG_TARGET =
	BG_RAMP_CONFIG.steps.bgFill2.contrast.target + UNIVERSAL_CONTRAST_TOPUP;
const SERIALIZED_STROKE_WCAG_TARGET =
	BG_RAMP_CONFIG.steps.stroke3.contrast.target + UNIVERSAL_CONTRAST_TOPUP;
const SERIALIZED_SURFACE_FOREGROUND_WCAG_TARGET =
	4.5 + UNIVERSAL_CONTRAST_TOPUP;

function getMetric(
	metric: PerceptualMetric,
	reference: string | PlainColorObject,
	color: string | PlainColorObject
) {
	return metric === 'apca'
		? Math.abs( contrastAPCA( reference, color ) )
		: deltaEOK2( reference, color );
}

function prepareMetricReference(
	metric: PerceptualMetric,
	reference: string | PlainColorObject
) {
	return to( clampToGamut( reference ), metric === 'apca' ? sRGB : OKLab );
}

function createColorAtLightness(
	seed: string | PlainColorObject,
	mode: ChromaMode,
	taperOptions = BG_RAMP_CONFIG.steps.surface4.taperChromaOptions
): GetColorAtLightness {
	const parsedSeed = clampToGamut( seed );

	if ( mode === 'relative' ) {
		const relativeSeed = to( parsedSeed, OklchSrgb );
		const chroma = get( relativeSeed, [ OklchSrgb, 'c' ] );
		const hue = get( relativeSeed, [ OklchSrgb, 'h' ] );
		return ( lightness ) =>
			to(
				{
					space: OklchSrgb,
					coords: [ lightness, chroma, hue ],
					alpha: parsedSeed.alpha,
				},
				OKLCH
			);
	}

	if ( mode === 'tapered' ) {
		return ( lightness ) => {
			const tapered = taperChroma( parsedSeed, lightness, taperOptions );
			if ( 'l' in tapered && 'c' in tapered ) {
				return clampToGamut( {
					space: OKLCH,
					coords: [
						tapered.l,
						tapered.c,
						get( parsedSeed, [ OKLCH, 'h' ] ),
					],
					alpha: parsedSeed.alpha,
				} );
			}
			return clampToGamut( tapered );
		};
	}

	return ( lightness ) =>
		clampToGamut( {
			space: OKLCH,
			coords: [
				lightness,
				get( parsedSeed, [ OKLCH, 'c' ] ),
				get( parsedSeed, [ OKLCH, 'h' ] ),
			],
			alpha: parsedSeed.alpha,
		} );
}

function getPerceptualLightness( color: string | PlainColorObject ) {
	return get( color, [ OKLrab, 'l' ] );
}

function createColorAtPerceptualLightness(
	seed: string | PlainColorObject,
	mode: ChromaMode,
	taperOptions?: Parameters< typeof taperChroma >[ 2 ]
): GetColorAtLightness {
	const getColorAtLightness = createColorAtLightness(
		seed,
		mode,
		taperOptions
	);

	return ( perceptualLightness ) => {
		const oklab = to(
			{
				space: OKLrab,
				coords: [ perceptualLightness, 0, 0 ],
				alpha: 1,
			},
			OKLab
		);
		return getColorAtLightness( get( oklab, [ OKLab, 'l' ] ) );
	};
}

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
	const getTargetColor = createColorAtPerceptualLightness(
		stepColor,
		'absolute'
	);
	const anchorColor = to( clampToGamut( anchor ), OKLCH );
	const anchorChroma = get( anchorColor, [ OKLCH, 'c' ] );
	const stepChroma = get( stepColor, [ OKLCH, 'c' ] );
	const distance = endLightness - startLightness;

	return ( perceptualLightness: number ) => {
		const targetColor = to( getTargetColor( perceptualLightness ), OKLCH );
		const progress =
			distance === 0
				? 1
				: Math.min(
						1,
						Math.max(
							0,
							( perceptualLightness - startLightness ) / distance
						)
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

function getClosestBoundary(
	target: number,
	first: { color: PlainColorObject; value: number },
	second: { color: PlainColorObject; value: number }
) {
	return Math.abs( first.value - target ) <= Math.abs( second.value - target )
		? first.color
		: second.color;
}

function findColorAtMetric( {
	metric,
	reference,
	getColorAtLightness,
	startLightness,
	endLightness,
	target,
}: {
	metric: PerceptualMetric;
	reference: string | PlainColorObject;
	getColorAtLightness: GetColorAtLightness;
	startLightness: number;
	endLightness: number;
	target: number;
} ) {
	const startColor = getColorAtLightness( startLightness );
	const endColor = getColorAtLightness( endLightness );
	const startValue = getMetric( metric, reference, startColor );
	const endValue = getMetric( metric, reference, endColor );
	const lower = { color: startColor, value: startValue };
	const upper = { color: endColor, value: endValue };
	const minimumValue = Math.min( startValue, endValue );
	const maximumValue = Math.max( startValue, endValue );

	if ( target <= minimumValue || target >= maximumValue ) {
		return getClosestBoundary( target, lower, upper );
	}

	const startDelta = startValue - target;
	const endDelta = endValue - target;
	if ( Math.sign( startDelta ) === Math.sign( endDelta ) ) {
		return getClosestBoundary( target, lower, upper );
	}

	return solveWithBisect(
		getColorAtLightness,
		( color ) => getMetric( metric, reference, color ) - target,
		startLightness,
		startDelta,
		endLightness,
		endDelta
	);
}

function getRampChromaMode(
	method: Exclude< ExperimentalRampMethod, 'anchored' >,
	family: RampFamily
): ChromaMode {
	if ( family === 'neutral' ) {
		return 'tapered';
	}
	return method === 'role-hybrid' || method === 'pinned-role-hybrid'
		? 'relative'
		: 'absolute';
}

function rebuildProgression( {
	ramp,
	referenceName,
	steps,
	progress,
	metric,
	seed,
	mode,
	taperOptions,
}: {
	ramp: Record< keyof Ramp, string >;
	referenceName: keyof Ramp;
	steps: readonly ( keyof Ramp )[];
	progress: readonly number[];
	metric: PerceptualMetric;
	seed: string;
	mode: ChromaMode;
	taperOptions?: Parameters< typeof taperChroma >[ 2 ];
} ) {
	const nextRamp = { ...ramp };
	const reference = prepareMetricReference( metric, ramp[ referenceName ] );
	const firstStep = steps[ 0 ];
	const lastStep = steps.at( -1 )!;
	const startLightness = get( ramp[ firstStep ], [ OKLCH, 'l' ] );
	const endLightness = get( ramp[ lastStep ], [ OKLCH, 'l' ] );
	const seedForScale = mode === 'absolute' ? ramp[ lastStep ] : seed;
	const getColorAtLightness = createColorAtLightness(
		seedForScale,
		mode,
		taperOptions
	);
	const startValue = getMetric(
		metric,
		reference,
		getColorAtLightness( startLightness )
	);
	const endValue = getMetric(
		metric,
		reference,
		getColorAtLightness( endLightness )
	);

	steps.forEach( ( step, index ) => {
		const target =
			startValue + ( endValue - startValue ) * progress[ index ];
		nextRamp[ step ] = getColorString(
			findColorAtMetric( {
				metric,
				reference,
				getColorAtLightness,
				startLightness,
				endLightness,
				target,
			} )
		);
	} );

	return nextRamp;
}

function findColorMeetingWcag( {
	color,
	references,
	target,
	seed,
	mode,
}: {
	color: string;
	references: readonly string[];
	target: number;
	seed: string;
	mode: ChromaMode;
} ) {
	if (
		references.every(
			( reference ) => getContrast( reference, color ) >= target
		)
	) {
		return color;
	}

	const getColorAtLightness = createColorAtLightness( seed, mode );
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
	const colorLightness = get( color, [ OKLCH, 'l' ] );
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

function rebuildConstrainedSurfaces( { ramp }: { ramp: RampResult } ) {
	const nextRamp = { ...ramp.ramp };
	const surfaceReference = prepareMetricReference(
		'delta-e',
		ramp.ramp.surface2
	);
	const elevationTarget = Math.max(
		getMetric( 'delta-e', surfaceReference, ramp.ramp.surface1 ),
		getMetric( 'delta-e', surfaceReference, ramp.ramp.surface3 )
	);
	const surface2Lightness = getPerceptualLightness( ramp.ramp.surface2 );

	for ( const step of [ 'surface1', 'surface3' ] as const ) {
		const endLightness = step === 'surface1' ? 0 : 1;
		const getColorAtLightness = createColorAtPerceptualLightness(
			ramp.ramp[ step ],
			'absolute'
		);
		nextRamp[ step ] = getColorString(
			findColorAtMetric( {
				metric: 'delta-e',
				reference: surfaceReference,
				getColorAtLightness,
				startLightness: surface2Lightness,
				endLightness,
				target: elevationTarget,
			} )
		);
	}

	const surface6Difference = getMetric(
		'delta-e',
		surfaceReference,
		ramp.ramp.surface6
	);
	const surface6Lightness = getPerceptualLightness( ramp.ramp.surface6 );
	for ( const [ index, step ] of SURFACE_STEPS.entries() ) {
		if ( step === 'surface6' ) {
			continue;
		}
		const getColorAtLightness = createColorAtPerceptualLightness(
			ramp.ramp[ step ],
			'absolute'
		);
		const minimumDifference = getMetric(
			'delta-e',
			surfaceReference,
			getColorAtLightness( surface2Lightness )
		);
		nextRamp[ step ] = getColorString(
			findColorAtMetric( {
				metric: 'delta-e',
				reference: surfaceReference,
				getColorAtLightness,
				startLightness: surface2Lightness,
				endLightness: surface6Lightness,
				target:
					minimumDifference +
					( surface6Difference - minimumDifference ) *
						SURFACE_PROGRESS[ index ],
			} )
		);
	}

	return nextRamp;
}

function rebuildConstrainedStrokes( {
	ramp,
	backgroundRamp,
}: {
	ramp: RampResult;
	backgroundRamp: RampResult;
} ) {
	const nextRamp = { ...ramp.ramp };
	const references = getStrokeReferences( nextRamp, backgroundRamp );

	// ST3 is the accessibility boundary. Preserve the production color whenever
	// it meets every required 3:1 contrast pair.
	nextRamp.stroke3 = findColorMeetingWcag( {
		color: nextRamp.stroke3,
		references,
		target: SERIALIZED_STROKE_WCAG_TARGET,
		seed: nextRamp.stroke3,
		mode: 'absolute',
	} );

	const stroke1Reference = prepareMetricReference(
		'delta-e',
		nextRamp.stroke1
	);
	const stroke1To3Difference = getMetric(
		'delta-e',
		stroke1Reference,
		nextRamp.stroke3
	);
	const authoredStroke2Difference = getMetric(
		'delta-e',
		stroke1Reference,
		ramp.ramp.stroke2
	);
	const stroke1Lightness = getPerceptualLightness( nextRamp.stroke1 );
	const stroke3Lightness = getPerceptualLightness( nextRamp.stroke3 );
	const getStroke2AtLightness =
		createAnchoredColorForStepAtPerceptualLightness( {
			ramp: nextRamp,
			step: 'stroke2',
			anchor: nextRamp.stroke1,
			startLightness: stroke1Lightness,
			endLightness: stroke3Lightness,
		} );
	nextRamp.stroke2 = getColorString(
		findColorAtMetric( {
			metric: 'delta-e',
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

	const stroke3Reference = prepareMetricReference(
		'delta-e',
		nextRamp.stroke3
	);
	const minimumActiveDifference = getMetric(
		'delta-e',
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
		findColorAtMetric( {
			metric: 'delta-e',
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
		seed: stroke4Candidate,
		mode: 'absolute',
	} );

	return nextRamp;
}

function darkenUntilContrast( {
	color,
	reference,
	seed,
	mode,
	target,
}: {
	color: string;
	reference: string;
	seed: string;
	mode: ChromaMode;
	target: number;
} ) {
	if ( getContrast( reference, color ) >= target ) {
		return color;
	}

	const getColorAtLightness = createColorAtLightness( seed, mode );
	const endpoint = getColorAtLightness( 0 );
	const endpointDelta = Math.log(
		getContrast( reference, endpoint ) / target
	);
	if ( endpointDelta < 0 ) {
		return getColorString( endpoint );
	}
	const colorLightness = get( color, [ OKLCH, 'l' ] );
	const weakColor = getColorAtLightness( colorLightness );
	const colorDelta = Math.log( getContrast( reference, weakColor ) / target );
	if ( colorDelta >= 0 ) {
		return getColorString( weakColor );
	}

	return getColorString(
		solveWithBisect(
			getColorAtLightness,
			( candidate ) =>
				Math.log( getContrast( reference, candidate ) / target ),
			colorLightness,
			colorDelta,
			0,
			endpointDelta
		)
	);
}

function rebuildElevationPair( {
	ramp,
	metric,
	seed,
	mode,
}: {
	ramp: Record< keyof Ramp, string >;
	metric: PerceptualMetric;
	seed: string;
	mode: ChromaMode;
} ) {
	const nextRamp = { ...ramp };
	const reference = ramp.surface2;
	const metricReference = prepareMetricReference( metric, reference );
	const target = Math.max(
		getMetric( metric, metricReference, ramp.surface1 ),
		getMetric( metric, metricReference, ramp.surface3 )
	);

	for ( const step of [ 'surface1', 'surface3' ] as const ) {
		const original = ramp[ step ];
		const getColorAtLightness = createColorAtLightness(
			mode === 'absolute' ? original : seed,
			mode,
			BG_RAMP_CONFIG.steps[ step ].taperChromaOptions
		);
		nextRamp[ step ] = getColorString(
			findColorAtMetric( {
				metric,
				reference: metricReference,
				getColorAtLightness,
				startLightness: get( reference, [ OKLCH, 'l' ] ),
				endLightness: get( original, [ OKLCH, 'l' ] ),
				target,
			} )
		);
	}

	return nextRamp;
}

function rebuildPinnedSurfaceLane( {
	ramp,
	direction,
	seed,
	mode,
}: {
	ramp: Record< keyof Ramp, string >;
	direction: RampResult[ 'direction' ];
	seed: string;
	mode: ChromaMode;
} ) {
	const getColorAtLightness = createColorAtLightness( seed, mode );
	const foregroundEndpoint = getColorAtLightness(
		direction === 'lighter' ? 1 : 0
	);
	const constrainedSurfaces = [
		'surface1',
		'surface2',
		'surface3',
		'surface4',
		'surface5',
	] as const;

	if (
		constrainedSurfaces.every(
			( step ) =>
				getContrast( ramp[ step ], foregroundEndpoint ) >=
				SERIALIZED_SURFACE_FOREGROUND_WCAG_TARGET
		)
	) {
		return ramp;
	}

	const reference = prepareMetricReference( 'delta-e', ramp.surface2 );
	const startLightness = get( ramp.surface2, [ OKLCH, 'l' ] );
	const endLightness = direction === 'lighter' ? 0 : 1;
	const maximumDifference = Math.max(
		...PINNED_SURFACE_STEPS.map( ( step ) =>
			getMetric( 'delta-e', reference, ramp[ step ] )
		)
	);
	const nextRamp = { ...ramp };

	PINNED_SURFACE_STEPS.forEach( ( step, index ) => {
		nextRamp[ step ] = getColorString(
			findColorAtMetric( {
				metric: 'delta-e',
				reference,
				getColorAtLightness,
				startLightness,
				endLightness,
				target: maximumDifference * PINNED_SURFACE_PROGRESS[ index ],
			} )
		);
	} );

	return nextRamp;
}

function findColorAtWcagContrast( {
	reference,
	getColorAtLightness,
	startLightness,
	endLightness,
	target,
}: {
	reference: string;
	getColorAtLightness: GetColorAtLightness;
	startLightness: number;
	endLightness: number;
	target: number;
} ) {
	const startColor = getColorAtLightness( startLightness );
	const startDelta = Math.log(
		getContrast( reference, startColor ) / target
	);

	if ( startDelta >= 0 ) {
		return startColor;
	}

	const endColor = getColorAtLightness( endLightness );
	const endDelta = Math.log( getContrast( reference, endColor ) / target );
	if ( endDelta < 0 ) {
		return endColor;
	}

	return solveWithBisect(
		getColorAtLightness,
		( color ) => Math.log( getContrast( reference, color ) / target ),
		startLightness,
		startDelta,
		endLightness,
		endDelta
	);
}

function createRoomForDarkerActiveFill( {
	ramp,
	seed,
	mode,
}: {
	ramp: Record< keyof Ramp, string >;
	seed: string;
	mode: ChromaMode;
} ) {
	if (
		getContrast( ramp.bgFill1, ramp.bgFill2 ) >=
		SERIALIZED_ACTIVE_FILL_WCAG_TARGET
	) {
		return ramp;
	}

	const getColorAtLightness = createColorAtLightness( seed, mode );
	const nextRamp = { ...ramp };
	nextRamp.bgFill1 = getColorString(
		findColorAtWcagContrast( {
			reference: ramp.surface2,
			getColorAtLightness,
			startLightness: get( ramp.surface2, [ OKLCH, 'l' ] ),
			endLightness: 1,
			target:
				BG_RAMP_CONFIG.steps.bgFill1.contrast.target +
				UNIVERSAL_CONTRAST_TOPUP,
		} )
	);
	nextRamp.bgFill2 = nextRamp.bgFill1;

	return nextRamp;
}

function rebuildActiveFill( {
	ramp,
	method,
	seed,
	mode,
}: {
	ramp: Record< keyof Ramp, string >;
	method: Exclude< ExperimentalRampMethod, 'anchored' >;
	seed: string;
	mode: ChromaMode;
} ) {
	const nextRamp = { ...ramp };
	const metric: PerceptualMetric = method === 'apca-all' ? 'apca' : 'delta-e';
	const metricReference = prepareMetricReference( metric, ramp.bgFill1 );
	const currentMetric = getMetric( metric, metricReference, ramp.bgFill2 );
	const target = Math.max(
		currentMetric,
		metric === 'apca'
			? MINIMUM_ACTIVE_FILL_APCA
			: MINIMUM_ACTIVE_FILL_DELTA_E
	);
	const getColorAtLightness = createColorAtLightness(
		mode === 'absolute' ? ramp.bgFill2 : seed,
		mode
	);
	const candidate = getColorString(
		findColorAtMetric( {
			metric,
			reference: metricReference,
			getColorAtLightness,
			startLightness: get( ramp.bgFill1, [ OKLCH, 'l' ] ),
			endLightness: 0,
			target,
		} )
	);
	nextRamp.bgFill2 = darkenUntilContrast( {
		color: candidate,
		reference: ramp.bgFill1,
		seed: mode === 'absolute' ? ramp.bgFill2 : seed,
		mode,
		// Leave enough room for 8-bit sRGB serialization.
		target: SERIALIZED_ACTIVE_FILL_WCAG_TARGET,
	} );
	nextRamp.fgFill = findColorMeetingWcag( {
		color: ramp.fgFill,
		references: [ nextRamp.bgFill1, nextRamp.bgFill2 ],
		target: SERIALIZED_FILL_WCAG_TARGET,
		seed: ramp.fgFill,
		mode: 'tapered',
	} );

	return nextRamp;
}

function getStrokeReferences(
	ramp: Record< keyof Ramp, string >,
	backgroundRamp: RampResult
) {
	return [
		ramp.surface1,
		ramp.surface2,
		ramp.surface3,
		backgroundRamp.ramp.surface1,
		backgroundRamp.ramp.surface2,
		backgroundRamp.ramp.surface3,
	];
}

function rebuildRamp( {
	ramp,
	backgroundRamp,
	method,
	family,
	seed,
}: {
	ramp: RampResult;
	backgroundRamp: RampResult;
	method: Exclude< ExperimentalRampMethod, 'anchored' >;
	family: RampFamily;
	seed: string;
} ) {
	const config = family === 'neutral' ? BG_RAMP_CONFIG : ACCENT_RAMP_CONFIG;

	if ( method === 'constrained-perceptual' ) {
		let nextRamp = rebuildConstrainedSurfaces( {
			ramp,
		} );
		const surfaceResult: RampResult = {
			...ramp,
			ramp: nextRamp,
			warnings: undefined,
		};
		nextRamp = rebuildConstrainedStrokes( {
			ramp: surfaceResult,
			backgroundRamp,
		} );
		nextRamp = rebuildActiveFill( {
			ramp: nextRamp,
			method,
			seed,
			mode: getRampChromaMode( method, family ),
		} );

		return buildForegroundScale(
			{
				...ramp,
				ramp: nextRamp,
				warnings: undefined,
			},
			backgroundRamp,
			config.foregroundScale
		);
	}

	const metric: PerceptualMetric = method === 'apca-all' ? 'apca' : 'delta-e';
	const mode = getRampChromaMode( method, family );
	let nextRamp = rebuildElevationPair( {
		ramp: ramp.ramp,
		metric,
		seed,
		mode,
	} );
	nextRamp = rebuildProgression( {
		ramp: nextRamp,
		referenceName: 'surface2',
		steps: SURFACE_STEPS,
		progress: SURFACE_PROGRESS,
		metric,
		seed,
		mode,
		taperOptions: BG_RAMP_CONFIG.steps.surface4.taperChromaOptions,
	} );
	if ( method === 'pinned-role-hybrid' ) {
		nextRamp = rebuildPinnedSurfaceLane( {
			ramp: nextRamp,
			direction: ramp.direction,
			seed,
			mode,
		} );
	}
	nextRamp = rebuildProgression( {
		ramp: nextRamp,
		referenceName: 'surface3',
		steps: STROKE_STEPS,
		progress: STROKE_PROGRESS,
		metric,
		seed,
		mode,
		taperOptions: BG_RAMP_CONFIG.steps.stroke3.taperChromaOptions,
	} );
	nextRamp.stroke3 = findColorMeetingWcag( {
		color: nextRamp.stroke3,
		references: getStrokeReferences( nextRamp, backgroundRamp ),
		target: SERIALIZED_STROKE_WCAG_TARGET,
		seed: nextRamp.stroke3,
		mode,
	} );
	nextRamp = rebuildActiveFill( {
		ramp: nextRamp,
		method,
		seed,
		mode,
	} );
	if ( method === 'pinned-role-hybrid' && family === 'neutral' ) {
		const fillRamp = createRoomForDarkerActiveFill( {
			ramp: nextRamp,
			seed,
			mode,
		} );
		if ( fillRamp !== nextRamp ) {
			nextRamp = rebuildActiveFill( {
				ramp: fillRamp,
				method,
				seed,
				mode,
			} );
		}
	}

	const intermediateResult: RampResult = {
		...ramp,
		ramp: nextRamp,
		warnings: undefined,
	};
	return buildForegroundScale(
		intermediateResult,
		backgroundRamp,
		config.foregroundScale
	);
}

function getNeutralSeed( ramp: RampResult ) {
	return ramp.ramp.surface2;
}

function buildExperimentalBackground(
	method: ExperimentalRampMethod,
	background: string
) {
	const anchored =
		method === 'pinned-role-hybrid'
			? buildRamp( background, BG_RAMP_CONFIG, {
					rescaleToFitContrastTargets: false,
			  } )
			: buildBgRamp( background );
	if ( method === 'anchored' ) {
		return anchored;
	}
	return rebuildRamp( {
		ramp: anchored,
		backgroundRamp: anchored,
		method,
		family: 'neutral',
		seed: getNeutralSeed( anchored ),
	} );
}

function buildExperimentalAccent(
	method: ExperimentalRampMethod,
	seed: string,
	backgroundRamp: RampResult
) {
	const anchored =
		method === 'pinned-role-hybrid'
			? buildRamp( seed, ACCENT_RAMP_CONFIG, {
					backgroundRamp,
					mainDirection: backgroundRamp.direction,
					pinLightness: {
						stepName: 'surface2',
						value: clampAccentScaleReferenceLightness(
							get( backgroundRamp.ramp.surface2, [ OKLCH, 'l' ] ),
							backgroundRamp.direction
						),
					},
					rescaleToFitContrastTargets: false,
			  } )
			: buildAccentRamp( seed, backgroundRamp );
	if ( method === 'anchored' ) {
		return anchored;
	}
	return rebuildRamp( {
		ramp: anchored,
		backgroundRamp,
		method,
		family: 'accent',
		seed: anchored.ramp.bgFill1,
	} );
}

/**
 * Builds complete private comparison ramps. These methods are Storybook-only
 * and do not change ThemeProvider or the package's public entrypoint.
 */
export function buildExperimentalThemeRamps( {
	method,
	background,
	primary,
	error = DEFAULT_SEED_COLORS.error,
}: {
	method: ExperimentalRampMethod;
	background: string;
	primary: string;
	error?: string;
} ): ExperimentalThemeRamps {
	const backgroundRamp = buildExperimentalBackground( method, background );

	return {
		background: backgroundRamp,
		primary: buildExperimentalAccent( method, primary, backgroundRamp ),
		error: buildExperimentalAccent( method, error, backgroundRamp ),
	};
}

export function getExperimentalChroma( color: string ) {
	return get( color, [ OklchSrgb, 'c' ] );
}
