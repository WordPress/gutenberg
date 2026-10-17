import {
	ColorSpace,
	deltaEOK2,
	get,
	OKLab,
	OKLCH,
	OKLCH_sRGB as OklchSrgb,
	Okhsl,
	parse,
	sRGB,
	contrastAPCA,
	to,
	type PlainColorObject,
} from 'colorjs.io/fn';
import { clampToGamut, getColorString, getContrast } from '../lib/color-utils';
import { UNIVERSAL_CONTRAST_TOPUP } from '../lib/constants';
import { BG_RAMP_CONFIG } from '../lib/ramp-configs';
import { taperChroma } from '../lib/taper-chroma';
import type { RampResult } from '../lib/types';
import { solveWithBisect } from '../lib/utils';

export const EXPERIMENTAL_FOREGROUND_METHODS = [
	'current',
	'uniform',
	'semantic-anchors',
	'eased',
	'uniform-free-endpoint',
	'state-skewed',
	'state-skewed-relative-chroma',
	'state-skewed-okhsl',
	'anchored-state-skewed-relative-chroma',
] as const;

export type ExperimentalForegroundMethod =
	( typeof EXPERIMENTAL_FOREGROUND_METHODS )[ number ];

export type ExperimentalForegroundScaleType = 'neutral' | 'accent';

export type ExperimentalForegroundScale = {
	colors: readonly [ string, string, string, string, string ];
	minimumContrasts: readonly [ number, number, number, number, number ];
	contrastTargets: readonly [ number, number, number, number, number ];
	meetsContrastTargets: boolean;
};

const FOREGROUND_CONTRAST_TARGETS = [ 2, 3, 4.5, 4.5, 4.5 ] as const;
const EASED_SPACING_POWER = 1.35;
const FREE_ENDPOINT_MINIMUM_APCA_INTERVAL = 7;
const STATE_SKEWED_PROGRESS = [ 0, 0.2, 0.4, 0.6, 1 ] as const;

ColorSpace.register( sRGB );
ColorSpace.register( OKLab );
ColorSpace.register( OKLCH );
ColorSpace.register( OklchSrgb );
ColorSpace.register( Okhsl );

/**
 * APCA is used only as an experimental perceptual coordinate. WCAG 2.1
 * contrast ratios measure the hard per-step role targets. The lower role
 * targets are not general WCAG text-conformance thresholds.
 */
export function getSignedPerceptualContrast(
	background: string | PlainColorObject,
	foreground: string | PlainColorObject
) {
	return contrastAPCA( background, foreground );
}

export function getPerceptualContrastMagnitude(
	background: string | PlainColorObject,
	foreground: string | PlainColorObject
) {
	return Math.abs( getSignedPerceptualContrast( background, foreground ) );
}

export function getGamutRelativeChroma( color: string | PlainColorObject ) {
	return get( color, [ OklchSrgb, 'c' ] );
}

export function getOkhslSaturation( color: string | PlainColorObject ) {
	return get( color, [ Okhsl, 's' ] );
}

export function getStateColorDifference(
	colors: ExperimentalForegroundScale[ 'colors' ]
) {
	return deltaEOK2( parse( colors[ 3 ] ), parse( colors[ 4 ] ) );
}

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

function createGamutRelativeColorForLightness(
	seed: PlainColorObject
): GetColorForLightness {
	const relativeSeed = to( seed, OklchSrgb );
	const relativeChroma = get( relativeSeed, [ OklchSrgb, 'c' ] );
	const hue = get( relativeSeed, [ OklchSrgb, 'h' ] );
	const colorCache = new Map< number, PlainColorObject >();

	return ( _, lightness ) => {
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

function createOkhslColorForLightness(
	seed: PlainColorObject
): GetColorForLightness {
	const okhslSeed = to( seed, Okhsl );
	const saturation = get( okhslSeed, [ Okhsl, 's' ] );
	const hue = get( okhslSeed, [ Okhsl, 'h' ] );
	const colorCache = new Map< number, PlainColorObject >();

	return ( _, lightness ) => {
		const cachedColor = colorCache.get( lightness );
		if ( cachedColor ) {
			return cachedColor;
		}

		// The solver works in OKLCH lightness. Convert the same neutral
		// lightness to OKHSL's toe-adjusted lightness before restoring the
		// seed saturation and hue. These direct base-space conversions avoid
		// repeating Color.js's full conversion-path lookup in the solver loop.
		const okhslLightness = Okhsl.fromBase!( [ lightness, 0, 0 ] )[ 2 ];
		const color = {
			space: OKLab,
			coords: Okhsl.toBase!( [ hue, saturation, okhslLightness ] ),
			alpha: seed.alpha,
		};
		colorCache.set( lightness, color );
		return color;
	};
}

function getNeutralColorForLightness(
	seed: PlainColorObject,
	lightness: number
) {
	const taperOptions = BG_RAMP_CONFIG.fgSurface1.taperChromaOptions;
	if ( ! taperOptions ) {
		return getChromaPreservingColorForLightness( seed, lightness );
	}

	const tapered = taperChroma( seed, lightness, taperOptions );
	if ( 'l' in tapered && 'c' in tapered ) {
		return clampToGamut( {
			space: OKLCH,
			coords: [ tapered.l, tapered.c, get( seed, [ OKLCH, 'h' ] ) ],
			alpha: seed.alpha,
		} );
	}

	return clampToGamut( tapered );
}

type GetColorForLightness = (
	seed: PlainColorObject,
	lightness: number
) => PlainColorObject;

function getForegroundConstraintReferences(
	stepIndex: number,
	ramp: RampResult,
	backgroundRamp: RampResult
) {
	let surfaceNames: readonly ( keyof RampResult[ 'ramp' ] )[];
	if ( stepIndex < 2 ) {
		surfaceNames = [ 'surface3' ];
	} else if ( stepIndex < 4 ) {
		surfaceNames = [ 'surface1', 'surface2', 'surface3' ];
	} else {
		surfaceNames = [
			'surface1',
			'surface2',
			'surface3',
			'surface4',
			'surface5',
		];
	}

	return Array.from(
		new Set( [
			...surfaceNames.map( ( name ) => ramp.ramp[ name ] ),
			...surfaceNames.map( ( name ) => backgroundRamp.ramp[ name ] ),
		] )
	);
}

function getContrastTargetMargin(
	color: PlainColorObject,
	references: readonly string[],
	target: number
) {
	const adjustedTarget = target + UNIVERSAL_CONTRAST_TOPUP;
	return Math.min(
		...references.map( ( reference ) =>
			Math.log( getContrast( reference, color ) / adjustedTarget )
		)
	);
}

function findColorAtPerceptualContrast( {
	displayBackground,
	getColorAtLightness,
	seed,
	weakColor,
	strongColor,
	target,
}: {
	displayBackground: string;
	getColorAtLightness: GetColorForLightness;
	seed: PlainColorObject;
	weakColor: PlainColorObject;
	strongColor: PlainColorObject;
	target: number;
} ) {
	const weakContrast = getPerceptualContrastMagnitude(
		displayBackground,
		weakColor
	);
	if ( target <= weakContrast ) {
		return weakColor;
	}

	const strongContrast = getPerceptualContrastMagnitude(
		displayBackground,
		strongColor
	);
	if ( target >= strongContrast ) {
		return strongColor;
	}

	const solvedColor = solveWithBisect(
		( lightness ) => getColorAtLightness( seed, lightness ),
		( color ) =>
			getPerceptualContrastMagnitude( displayBackground, color ) - target,
		get( weakColor, [ OKLCH, 'l' ] ),
		weakContrast - target,
		get( strongColor, [ OKLCH, 'l' ] ),
		strongContrast - target
	);

	// The theme ultimately emits 8-bit hex values. Search the immediate
	// lightness neighborhood so serialization does not undo the APCA spacing.
	const solvedLightness = get( solvedColor, [ OKLCH, 'l' ] );
	const weakLightness = get( weakColor, [ OKLCH, 'l' ] );
	const strongLightness = get( strongColor, [ OKLCH, 'l' ] );
	const minimumLightness = Math.min( weakLightness, strongLightness );
	const maximumLightness = Math.max( weakLightness, strongLightness );
	let bestColor = solvedColor;
	let bestDifference = Math.abs(
		getPerceptualContrastMagnitude(
			displayBackground,
			getColorString( solvedColor )
		) - target
	);

	for ( let offset = -0.004; offset <= 0.004; offset += 0.00025 ) {
		const lightness = Math.max(
			minimumLightness,
			Math.min( maximumLightness, solvedLightness + offset )
		);
		const candidate = getColorAtLightness( seed, lightness );
		const difference = Math.abs(
			getPerceptualContrastMagnitude(
				displayBackground,
				getColorString( candidate )
			) - target
		);
		if ( difference < bestDifference ) {
			bestColor = candidate;
			bestDifference = difference;
		}
	}

	return bestColor;
}

function findColorAtContrastTarget( {
	getColorAtLightness,
	seed,
	weakColor,
	strongColor,
	references,
	target,
}: {
	getColorAtLightness: GetColorForLightness;
	seed: PlainColorObject;
	weakColor: PlainColorObject;
	strongColor: PlainColorObject;
	references: readonly string[];
	target: number;
} ) {
	const weakMargin = getContrastTargetMargin( weakColor, references, target );
	if ( weakMargin >= 0 ) {
		return weakColor;
	}

	const strongMargin = getContrastTargetMargin(
		strongColor,
		references,
		target
	);
	if ( strongMargin < 0 ) {
		return strongColor;
	}

	return solveWithBisect(
		( lightness ) => getColorAtLightness( seed, lightness ),
		( color ) => getContrastTargetMargin( color, references, target ),
		get( weakColor, [ OKLCH, 'l' ] ),
		weakMargin,
		get( strongColor, [ OKLCH, 'l' ] ),
		strongMargin
	);
}

function colorMeetsContrastTarget(
	color: PlainColorObject,
	stepIndex: number,
	ramp: RampResult,
	backgroundRamp: RampResult
) {
	return (
		getContrastTargetMargin(
			color,
			getForegroundConstraintReferences(
				stepIndex,
				ramp,
				backgroundRamp
			),
			FOREGROUND_CONTRAST_TARGETS[ stepIndex ]
		) >= 0
	);
}

function findStrongBoundary( {
	getColorAtLightness,
	seed,
	ramp,
	backgroundRamp,
	currentStrongColor,
}: {
	getColorAtLightness: GetColorForLightness;
	seed: PlainColorObject;
	ramp: RampResult;
	backgroundRamp: RampResult;
	currentStrongColor: PlainColorObject;
} ) {
	const references = getForegroundConstraintReferences(
		4,
		ramp,
		backgroundRamp
	);
	if (
		getContrastTargetMargin(
			currentStrongColor,
			references,
			FOREGROUND_CONTRAST_TARGETS[ 4 ]
		) >= 0
	) {
		return currentStrongColor;
	}

	const endpoint = getColorAtLightness(
		seed,
		ramp.direction === 'lighter' ? 1 : 0
	);
	return findColorAtContrastTarget( {
		getColorAtLightness,
		seed,
		weakColor: currentStrongColor,
		strongColor: endpoint,
		references,
		target: FOREGROUND_CONTRAST_TARGETS[ 4 ],
	} );
}

function getFloorColor( {
	getColorAtLightness,
	stepIndex,
	seed,
	weakColor,
	strongColor,
	ramp,
	backgroundRamp,
}: {
	getColorAtLightness: GetColorForLightness;
	stepIndex: number;
	seed: PlainColorObject;
	weakColor: PlainColorObject;
	strongColor: PlainColorObject;
	ramp: RampResult;
	backgroundRamp: RampResult;
} ) {
	return findColorAtContrastTarget( {
		getColorAtLightness,
		seed,
		weakColor,
		strongColor,
		references: getForegroundConstraintReferences(
			stepIndex,
			ramp,
			backgroundRamp
		),
		target: FOREGROUND_CONTRAST_TARGETS[ stepIndex ],
	} );
}

function serializeScale(
	colors: readonly [
		PlainColorObject,
		PlainColorObject,
		PlainColorObject,
		PlainColorObject,
		PlainColorObject,
	]
): ExperimentalForegroundScale[ 'colors' ] {
	return [
		getColorString( colors[ 0 ] ),
		getColorString( colors[ 1 ] ),
		getColorString( colors[ 2 ] ),
		getColorString( colors[ 3 ] ),
		getColorString( colors[ 4 ] ),
	];
}

function getMinimumContrasts(
	colors: ExperimentalForegroundScale[ 'colors' ],
	ramp: RampResult,
	backgroundRamp: RampResult
) {
	return colors.map( ( color, stepIndex ) =>
		Math.min(
			...getForegroundConstraintReferences(
				stepIndex,
				ramp,
				backgroundRamp
			).map( ( reference ) => getContrast( reference, color ) )
		)
	) as [ number, number, number, number, number ];
}

function createScaleResult(
	colors: ExperimentalForegroundScale[ 'colors' ],
	ramp: RampResult,
	backgroundRamp: RampResult
): ExperimentalForegroundScale {
	const minimumContrasts = getMinimumContrasts(
		colors,
		ramp,
		backgroundRamp
	);
	return {
		colors,
		minimumContrasts,
		contrastTargets: FOREGROUND_CONTRAST_TARGETS,
		meetsContrastTargets: minimumContrasts.every(
			( contrast, stepIndex ) =>
				contrast >= FOREGROUND_CONTRAST_TARGETS[ stepIndex ]
		),
	};
}

function getUniformFreeEndpointTargets(
	floorContrasts: readonly number[],
	maximumContrast: number
) {
	const buildTargets = ( interval: number ) => {
		const start = Math.max(
			...floorContrasts.map(
				( floorContrast, stepIndex ) =>
					floorContrast - stepIndex * interval
			)
		);
		return floorContrasts.map(
			( _, stepIndex ) => start + stepIndex * interval
		);
	};

	const preferredTargets = buildTargets(
		FREE_ENDPOINT_MINIMUM_APCA_INTERVAL
	);
	if ( preferredTargets.at( -1 )! <= maximumContrast ) {
		return preferredTargets;
	}

	const availableInterval = Math.min(
		...floorContrasts
			.slice( 0, -1 )
			.map(
				( floorContrast, stepIndex ) =>
					( maximumContrast - floorContrast ) /
					( floorContrasts.length - stepIndex - 1 )
			)
	);
	return buildTargets( Math.max( 0, availableInterval ) );
}

function strengthenColorsForSerialization( {
	colors,
	getColorAtLightness,
	seed,
	strongColor,
	ramp,
	backgroundRamp,
}: {
	colors: readonly PlainColorObject[];
	getColorAtLightness: GetColorForLightness;
	seed: PlainColorObject;
	strongColor: PlainColorObject;
	ramp: RampResult;
	backgroundRamp: RampResult;
} ) {
	return colors.map( ( candidate, stepIndex ) => {
		const references = getForegroundConstraintReferences(
			stepIndex,
			ramp,
			backgroundRamp
		);
		if (
			references.every(
				( reference ) =>
					getContrast( reference, getColorString( candidate ) ) >=
					FOREGROUND_CONTRAST_TARGETS[ stepIndex ]
			)
		) {
			return candidate;
		}

		const candidateLightness = get( candidate, [ OKLCH, 'l' ] );
		const strongLightness = get( strongColor, [ OKLCH, 'l' ] );
		const direction = Math.sign( strongLightness - candidateLightness );
		const maximumOffset = Math.abs( strongLightness - candidateLightness );
		for (
			let offset = 0.00025;
			offset < maximumOffset;
			offset += 0.00025
		) {
			const strengthened = getColorAtLightness(
				seed,
				candidateLightness + direction * offset
			);
			if (
				references.every(
					( reference ) =>
						getContrast(
							reference,
							getColorString( strengthened )
						) >= FOREGROUND_CONTRAST_TARGETS[ stepIndex ]
				)
			) {
				return strengthened;
			}
		}

		return strongColor;
	} ) as [
		PlainColorObject,
		PlainColorObject,
		PlainColorObject,
		PlainColorObject,
		PlainColorObject,
	];
}

function buildUniformFreeEndpointColors( {
	getColorAtLightness,
	seed,
	ramp,
	backgroundRamp,
}: {
	getColorAtLightness: GetColorForLightness;
	seed: PlainColorObject;
	ramp: RampResult;
	backgroundRamp: RampResult;
} ) {
	const displayBackground = backgroundRamp.ramp.surface2;
	const displayBackgroundColor = clampToGamut( displayBackground );
	const weakColor = getColorAtLightness(
		seed,
		get( displayBackgroundColor, [ OKLCH, 'l' ] )
	);
	const strongColor = getColorAtLightness(
		seed,
		ramp.direction === 'lighter' ? 1 : 0
	);
	const floorColors = FOREGROUND_CONTRAST_TARGETS.map( ( _, stepIndex ) =>
		getFloorColor( {
			getColorAtLightness,
			stepIndex,
			seed,
			weakColor,
			strongColor,
			ramp,
			backgroundRamp,
		} )
	);
	const floorContrasts = floorColors.map( ( color ) =>
		getPerceptualContrastMagnitude( displayBackground, color )
	);
	const targets = getUniformFreeEndpointTargets(
		floorContrasts,
		getPerceptualContrastMagnitude( displayBackground, strongColor )
	);

	const colors = targets.map( ( target ) =>
		findColorAtPerceptualContrast( {
			displayBackground,
			getColorAtLightness,
			seed,
			weakColor,
			strongColor,
			target,
		} )
	);

	return strengthenColorsForSerialization( {
		colors,
		getColorAtLightness,
		seed,
		strongColor,
		ramp,
		backgroundRamp,
	} );
}

export function buildPerceptualForegroundScale( {
	method,
	ramp,
	backgroundRamp,
	seed: seedArg,
	scaleType,
}: {
	method: ExperimentalForegroundMethod;
	ramp: RampResult;
	backgroundRamp: RampResult;
	seed: string;
	scaleType: ExperimentalForegroundScaleType;
} ): ExperimentalForegroundScale {
	const currentColors = [
		ramp.ramp.fgSurface1,
		ramp.ramp.fgSurface2,
		ramp.ramp.fgSurface3,
		ramp.ramp.fgSurface4,
		ramp.ramp.fgSurface4,
	] as const;

	if ( method === 'current' ) {
		return createScaleResult( currentColors, ramp, backgroundRamp );
	}

	const seed = clampToGamut( seedArg );
	let getColorAtLightness = getChromaPreservingColorForLightness;
	if ( scaleType === 'neutral' ) {
		getColorAtLightness = getNeutralColorForLightness;
	} else if (
		method === 'state-skewed-relative-chroma' ||
		method === 'anchored-state-skewed-relative-chroma'
	) {
		getColorAtLightness = createGamutRelativeColorForLightness( seed );
	} else if ( method === 'state-skewed-okhsl' ) {
		getColorAtLightness = createOkhslColorForLightness( seed );
	}
	if ( method === 'uniform-free-endpoint' ) {
		const colors = serializeScale(
			buildUniformFreeEndpointColors( {
				getColorAtLightness,
				seed,
				ramp,
				backgroundRamp,
			} )
		);
		return createScaleResult( colors, ramp, backgroundRamp );
	}

	const displayBackground = backgroundRamp.ramp.surface2;
	const currentWeakColor = clampToGamut( ramp.ramp.fgSurface1 );
	const currentStrongColor = clampToGamut( ramp.ramp.fgSurface4 );
	const strongColor = findStrongBoundary( {
		getColorAtLightness,
		seed,
		ramp,
		backgroundRamp,
		currentStrongColor,
	} );
	const weakColor = colorMeetsContrastTarget(
		currentWeakColor,
		0,
		ramp,
		backgroundRamp
	)
		? currentWeakColor
		: getFloorColor( {
				getColorAtLightness,
				stepIndex: 0,
				seed,
				weakColor: currentWeakColor,
				strongColor,
				ramp,
				backgroundRamp,
		  } );

	let experimentalColors: readonly [
		PlainColorObject,
		PlainColorObject,
		PlainColorObject,
		PlainColorObject,
		PlainColorObject,
	];

	if ( method === 'semantic-anchors' ) {
		const lowerAnchors = [
			weakColor,
			clampToGamut( ramp.ramp.fgSurface2 ),
			clampToGamut( ramp.ramp.fgSurface3 ),
		] as const;
		const constrainedAnchors = lowerAnchors.map( ( anchor, stepIndex ) =>
			colorMeetsContrastTarget( anchor, stepIndex, ramp, backgroundRamp )
				? anchor
				: getFloorColor( {
						getColorAtLightness,
						stepIndex,
						seed,
						weakColor,
						strongColor,
						ramp,
						backgroundRamp,
				  } )
		) as [ PlainColorObject, PlainColorObject, PlainColorObject ];
		const normalContrast = getPerceptualContrastMagnitude(
			displayBackground,
			constrainedAnchors[ 2 ]
		);
		const strongContrast = getPerceptualContrastMagnitude(
			displayBackground,
			strongColor
		);
		const restCandidate = findColorAtPerceptualContrast( {
			displayBackground,
			getColorAtLightness,
			seed,
			weakColor: constrainedAnchors[ 2 ],
			strongColor,
			target: normalContrast + ( strongContrast - normalContrast ) / 2,
		} );
		const restColor = colorMeetsContrastTarget(
			restCandidate,
			3,
			ramp,
			backgroundRamp
		)
			? restCandidate
			: getFloorColor( {
					getColorAtLightness,
					stepIndex: 3,
					seed,
					weakColor: constrainedAnchors[ 2 ],
					strongColor,
					ramp,
					backgroundRamp,
			  } );

		experimentalColors = [ ...constrainedAnchors, restColor, strongColor ];
	} else if ( method === 'anchored-state-skewed-relative-chroma' ) {
		const constrainedAnchors = [
			currentWeakColor,
			clampToGamut( ramp.ramp.fgSurface2 ),
		].map( ( currentAnchor, stepIndex ) => {
			if (
				colorMeetsContrastTarget(
					currentAnchor,
					stepIndex,
					ramp,
					backgroundRamp
				)
			) {
				return currentAnchor;
			}

			return getFloorColor( {
				getColorAtLightness: ( _, lightness ) =>
					getChromaPreservingColorForLightness(
						currentAnchor,
						lightness
					),
				stepIndex,
				seed: currentAnchor,
				weakColor: currentAnchor,
				strongColor,
				ramp,
				backgroundRamp,
			} );
		} ) as [ PlainColorObject, PlainColorObject ];

		const weakContrast = getPerceptualContrastMagnitude(
			displayBackground,
			constrainedAnchors[ 0 ]
		);
		const strongContrast = getPerceptualContrastMagnitude(
			displayBackground,
			strongColor
		);
		const colors = [ ...constrainedAnchors ];

		for ( const stepIndex of [ 2, 3 ] ) {
			const previousColor = colors.at( -1 )!;
			const target =
				weakContrast +
				( strongContrast - weakContrast ) *
					STATE_SKEWED_PROGRESS[ stepIndex ];
			const previousContrast = getPerceptualContrastMagnitude(
				displayBackground,
				previousColor
			);
			const candidate =
				target <= previousContrast
					? previousColor
					: findColorAtPerceptualContrast( {
							displayBackground,
							getColorAtLightness,
							seed,
							weakColor: getColorAtLightness(
								seed,
								get( previousColor, [ OKLCH, 'l' ] )
							),
							strongColor,
							target,
					  } );

			colors.push(
				colorMeetsContrastTarget(
					candidate,
					stepIndex,
					ramp,
					backgroundRamp
				)
					? candidate
					: getFloorColor( {
							getColorAtLightness,
							stepIndex,
							seed,
							weakColor: candidate,
							strongColor,
							ramp,
							backgroundRamp,
					  } )
			);
		}

		experimentalColors = [
			colors[ 0 ],
			colors[ 1 ],
			colors[ 2 ],
			colors[ 3 ],
			strongColor,
		];
	} else {
		const initialWeakContrast = getPerceptualContrastMagnitude(
			displayBackground,
			weakColor
		);
		const strongContrast = getPerceptualContrastMagnitude(
			displayBackground,
			strongColor
		);
		const progressValues = FOREGROUND_CONTRAST_TARGETS.map(
			( _, stepIndex ) => {
				const progress =
					stepIndex / ( FOREGROUND_CONTRAST_TARGETS.length - 1 );
				if (
					method === 'state-skewed' ||
					method === 'state-skewed-relative-chroma' ||
					method === 'state-skewed-okhsl'
				) {
					return STATE_SKEWED_PROGRESS[ stepIndex ];
				}
				return method === 'eased'
					? Math.pow( progress, EASED_SPACING_POWER )
					: progress;
			}
		);
		const floorContrasts = FOREGROUND_CONTRAST_TARGETS.map(
			( _, stepIndex ) =>
				getPerceptualContrastMagnitude(
					displayBackground,
					getFloorColor( {
						getColorAtLightness,
						stepIndex,
						seed,
						weakColor,
						strongColor,
						ramp,
						backgroundRamp,
					} )
				)
		);
		const requiredWeakContrast = progressValues
			.slice( 0, -1 )
			.reduce( ( requiredContrast, progress, stepIndex ) => {
				const minimumStartContrast =
					( floorContrasts[ stepIndex ] -
						progress * strongContrast ) /
					( 1 - progress );
				return Math.max( requiredContrast, minimumStartContrast );
			}, initialWeakContrast );
		const adjustedWeakColor = findColorAtPerceptualContrast( {
			displayBackground,
			getColorAtLightness,
			seed,
			weakColor,
			strongColor,
			target: requiredWeakContrast,
		} );
		const weakContrast = getPerceptualContrastMagnitude(
			displayBackground,
			adjustedWeakColor
		);
		const colors = FOREGROUND_CONTRAST_TARGETS.map( ( _, stepIndex ) => {
			if ( stepIndex === 0 ) {
				return adjustedWeakColor;
			}
			if ( stepIndex === FOREGROUND_CONTRAST_TARGETS.length - 1 ) {
				return strongColor;
			}

			const perceptualProgress = progressValues[ stepIndex ];
			const candidate = findColorAtPerceptualContrast( {
				displayBackground,
				getColorAtLightness,
				seed,
				weakColor: adjustedWeakColor,
				strongColor,
				target:
					weakContrast +
					( strongContrast - weakContrast ) * perceptualProgress,
			} );

			if (
				colorMeetsContrastTarget(
					candidate,
					stepIndex,
					ramp,
					backgroundRamp
				)
			) {
				return candidate;
			}

			return getFloorColor( {
				getColorAtLightness,
				stepIndex,
				seed,
				weakColor: adjustedWeakColor,
				strongColor,
				ramp,
				backgroundRamp,
			} );
		} );

		experimentalColors = colors as [
			PlainColorObject,
			PlainColorObject,
			PlainColorObject,
			PlainColorObject,
			PlainColorObject,
		];
	}

	const colors = serializeScale(
		strengthenColorsForSerialization( {
			colors: experimentalColors,
			getColorAtLightness,
			seed,
			strongColor,
			ramp,
			backgroundRamp,
		} )
	);
	return createScaleResult( colors, ramp, backgroundRamp );
}
