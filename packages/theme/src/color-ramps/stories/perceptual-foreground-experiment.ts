import {
	ColorSpace,
	get,
	OKLCH,
	sRGB,
	contrastAPCA,
	type PlainColorObject,
} from 'colorjs.io/fn';
import { clampToGamut, getColorString, getContrast } from '../lib/color-utils';
import { UNIVERSAL_CONTRAST_TOPUP } from '../lib/constants';
import type { RampResult } from '../lib/types';
import { solveWithBisect } from '../lib/utils';

export const EXPERIMENTAL_FOREGROUND_METHODS = [
	'current',
	'uniform',
	'uniform-free-endpoint',
	'semantic-anchors',
	'eased',
] as const;

export type ExperimentalForegroundMethod =
	( typeof EXPERIMENTAL_FOREGROUND_METHODS )[ number ];

export type ExperimentalForegroundScale = {
	colors: readonly [ string, string, string, string, string ];
	minimumWcagContrasts: readonly [ number, number, number, number, number ];
	meetsWcagFloors: boolean;
};

const FOREGROUND_WCAG_FLOORS = [ 2, 3, 4.5, 4.5, 4.5 ] as const;
const EASED_SPACING_POWER = 1.35;
const FREE_ENDPOINT_MINIMUM_APCA_INTERVAL = 7;

ColorSpace.register( sRGB );
ColorSpace.register( OKLCH );

/**
 * APCA is used only as an experimental perceptual coordinate. WCAG contrast
 * remains the pass/fail accessibility constraint.
 */
export function getPerceptualContrast(
	background: string | PlainColorObject,
	foreground: string | PlainColorObject
) {
	return Math.abs( contrastAPCA( background, foreground ) );
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

function getWcagFloorMargin(
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
	getColorAtLightness = getChromaPreservingColorForLightness,
	seed,
	weakColor,
	strongColor,
	target,
}: {
	displayBackground: string;
	getColorAtLightness?: GetColorForLightness;
	seed: PlainColorObject;
	weakColor: PlainColorObject;
	strongColor: PlainColorObject;
	target: number;
} ) {
	const weakContrast = getPerceptualContrast( displayBackground, weakColor );
	if ( target <= weakContrast ) {
		return weakColor;
	}

	const strongContrast = getPerceptualContrast(
		displayBackground,
		strongColor
	);
	if ( target >= strongContrast ) {
		return strongColor;
	}

	const solvedColor = solveWithBisect(
		( lightness ) => getColorAtLightness( seed, lightness ),
		( color ) => getPerceptualContrast( displayBackground, color ) - target,
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
		getPerceptualContrast(
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
			getPerceptualContrast(
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

function findColorAtWcagFloor( {
	getColorAtLightness = getChromaPreservingColorForLightness,
	seed,
	weakColor,
	strongColor,
	references,
	target,
}: {
	getColorAtLightness?: GetColorForLightness;
	seed: PlainColorObject;
	weakColor: PlainColorObject;
	strongColor: PlainColorObject;
	references: readonly string[];
	target: number;
} ) {
	const weakMargin = getWcagFloorMargin( weakColor, references, target );
	if ( weakMargin >= 0 ) {
		return weakColor;
	}

	const strongMargin = getWcagFloorMargin( strongColor, references, target );
	if ( strongMargin < 0 ) {
		return strongColor;
	}

	return solveWithBisect(
		( lightness ) => getColorAtLightness( seed, lightness ),
		( color ) => getWcagFloorMargin( color, references, target ),
		get( weakColor, [ OKLCH, 'l' ] ),
		weakMargin,
		get( strongColor, [ OKLCH, 'l' ] ),
		strongMargin
	);
}

function colorMeetsWcagFloor(
	color: PlainColorObject,
	stepIndex: number,
	ramp: RampResult,
	backgroundRamp: RampResult
) {
	return (
		getWcagFloorMargin(
			color,
			getForegroundConstraintReferences(
				stepIndex,
				ramp,
				backgroundRamp
			),
			FOREGROUND_WCAG_FLOORS[ stepIndex ]
		) >= 0
	);
}

function findStrongBoundary( {
	seed,
	ramp,
	backgroundRamp,
	currentStrongColor,
}: {
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
		getWcagFloorMargin(
			currentStrongColor,
			references,
			FOREGROUND_WCAG_FLOORS[ 4 ]
		) >= 0
	) {
		return currentStrongColor;
	}

	const endpoint = getChromaPreservingColorForLightness(
		seed,
		ramp.direction === 'lighter' ? 1 : 0
	);
	return findColorAtWcagFloor( {
		seed,
		weakColor: currentStrongColor,
		strongColor: endpoint,
		references,
		target: FOREGROUND_WCAG_FLOORS[ 4 ],
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
	getColorAtLightness?: GetColorForLightness;
	stepIndex: number;
	seed: PlainColorObject;
	weakColor: PlainColorObject;
	strongColor: PlainColorObject;
	ramp: RampResult;
	backgroundRamp: RampResult;
} ) {
	return findColorAtWcagFloor( {
		getColorAtLightness,
		seed,
		weakColor,
		strongColor,
		references: getForegroundConstraintReferences(
			stepIndex,
			ramp,
			backgroundRamp
		),
		target: FOREGROUND_WCAG_FLOORS[ stepIndex ],
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

function getMinimumWcagContrasts(
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
	const minimumWcagContrasts = getMinimumWcagContrasts(
		colors,
		ramp,
		backgroundRamp
	);
	return {
		colors,
		minimumWcagContrasts,
		meetsWcagFloors: minimumWcagContrasts.every(
			( contrast, stepIndex ) =>
				contrast >= FOREGROUND_WCAG_FLOORS[ stepIndex ]
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
	seed,
	strongColor,
	ramp,
	backgroundRamp,
}: {
	colors: readonly PlainColorObject[];
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
					FOREGROUND_WCAG_FLOORS[ stepIndex ]
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
			const strengthened = getChromaPreservingColorForLightness(
				seed,
				candidateLightness + direction * offset
			);
			if (
				references.every(
					( reference ) =>
						getContrast(
							reference,
							getColorString( strengthened )
						) >= FOREGROUND_WCAG_FLOORS[ stepIndex ]
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
	seed,
	ramp,
	backgroundRamp,
}: {
	seed: PlainColorObject;
	ramp: RampResult;
	backgroundRamp: RampResult;
} ) {
	const displayBackground = backgroundRamp.ramp.surface2;
	const displayBackgroundColor = clampToGamut( displayBackground );
	const weakColor = getChromaPreservingColorForLightness(
		seed,
		get( displayBackgroundColor, [ OKLCH, 'l' ] )
	);
	const strongColor = getChromaPreservingColorForLightness(
		seed,
		ramp.direction === 'lighter' ? 1 : 0
	);
	const floorColors = FOREGROUND_WCAG_FLOORS.map( ( _, stepIndex ) =>
		getFloorColor( {
			getColorAtLightness: getChromaPreservingColorForLightness,
			stepIndex,
			seed,
			weakColor,
			strongColor,
			ramp,
			backgroundRamp,
		} )
	);
	const floorContrasts = floorColors.map( ( color ) =>
		getPerceptualContrast( displayBackground, color )
	);
	const targets = getUniformFreeEndpointTargets(
		floorContrasts,
		getPerceptualContrast( displayBackground, strongColor )
	);

	const colors = targets.map( ( target ) =>
		findColorAtPerceptualContrast( {
			displayBackground,
			getColorAtLightness: getChromaPreservingColorForLightness,
			seed,
			weakColor,
			strongColor,
			target,
		} )
	);

	return strengthenColorsForSerialization( {
		colors,
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
}: {
	method: ExperimentalForegroundMethod;
	ramp: RampResult;
	backgroundRamp: RampResult;
	seed: string;
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
	if ( method === 'uniform-free-endpoint' ) {
		const colors = serializeScale(
			buildUniformFreeEndpointColors( { seed, ramp, backgroundRamp } )
		);
		return createScaleResult( colors, ramp, backgroundRamp );
	}

	const displayBackground = backgroundRamp.ramp.surface2;
	const currentWeakColor = clampToGamut( ramp.ramp.fgSurface1 );
	const currentStrongColor = clampToGamut( ramp.ramp.fgSurface4 );
	const strongColor = findStrongBoundary( {
		seed,
		ramp,
		backgroundRamp,
		currentStrongColor,
	} );
	const weakColor = colorMeetsWcagFloor(
		currentWeakColor,
		0,
		ramp,
		backgroundRamp
	)
		? currentWeakColor
		: getFloorColor( {
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
			colorMeetsWcagFloor( anchor, stepIndex, ramp, backgroundRamp )
				? anchor
				: getFloorColor( {
						stepIndex,
						seed,
						weakColor,
						strongColor,
						ramp,
						backgroundRamp,
				  } )
		) as [ PlainColorObject, PlainColorObject, PlainColorObject ];
		const normalContrast = getPerceptualContrast(
			displayBackground,
			constrainedAnchors[ 2 ]
		);
		const strongContrast = getPerceptualContrast(
			displayBackground,
			strongColor
		);
		const restCandidate = findColorAtPerceptualContrast( {
			displayBackground,
			seed,
			weakColor: constrainedAnchors[ 2 ],
			strongColor,
			target: normalContrast + ( strongContrast - normalContrast ) / 2,
		} );
		const restColor = colorMeetsWcagFloor(
			restCandidate,
			3,
			ramp,
			backgroundRamp
		)
			? restCandidate
			: getFloorColor( {
					stepIndex: 3,
					seed,
					weakColor: constrainedAnchors[ 2 ],
					strongColor,
					ramp,
					backgroundRamp,
			  } );

		experimentalColors = [ ...constrainedAnchors, restColor, strongColor ];
	} else {
		const initialWeakContrast = getPerceptualContrast(
			displayBackground,
			weakColor
		);
		const strongContrast = getPerceptualContrast(
			displayBackground,
			strongColor
		);
		const progressValues = FOREGROUND_WCAG_FLOORS.map( ( _, stepIndex ) => {
			const progress = stepIndex / ( FOREGROUND_WCAG_FLOORS.length - 1 );
			return method === 'eased'
				? Math.pow( progress, EASED_SPACING_POWER )
				: progress;
		} );
		const floorContrasts = FOREGROUND_WCAG_FLOORS.map( ( _, stepIndex ) =>
			getPerceptualContrast(
				displayBackground,
				getFloorColor( {
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
			seed,
			weakColor,
			strongColor,
			target: requiredWeakContrast,
		} );
		const weakContrast = getPerceptualContrast(
			displayBackground,
			adjustedWeakColor
		);
		const colors = FOREGROUND_WCAG_FLOORS.map( ( _, stepIndex ) => {
			const perceptualProgress = progressValues[ stepIndex ];
			const candidate = findColorAtPerceptualContrast( {
				displayBackground,
				seed,
				weakColor: adjustedWeakColor,
				strongColor,
				target:
					weakContrast +
					( strongContrast - weakContrast ) * perceptualProgress,
			} );

			if (
				colorMeetsWcagFloor(
					candidate,
					stepIndex,
					ramp,
					backgroundRamp
				)
			) {
				return candidate;
			}

			return getFloorColor( {
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
			seed,
			strongColor,
			ramp,
			backgroundRamp,
		} )
	);
	return createScaleResult( colors, ramp, backgroundRamp );
}
