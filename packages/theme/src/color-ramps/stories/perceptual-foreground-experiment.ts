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
import { taperChroma } from '../lib/taper-chroma';
import type { RampResult } from '../lib/types';
import { solveWithBisect } from '../lib/utils';

export const EXPERIMENTAL_FOREGROUND_METHODS = [
	'current',
	'uniform',
	'semantic-anchors',
	'eased',
] as const;

export type ExperimentalForegroundMethod =
	( typeof EXPERIMENTAL_FOREGROUND_METHODS )[ number ];

export type ExperimentalForegroundScale = {
	colors: readonly [ string, string, string, string, string ];
	meetsWcagFloors: boolean;
};

const FOREGROUND_WCAG_FLOORS = [ 2, 3, 4.5, 4.5, 4.5 ] as const;
const EASED_SPACING_POWER = 1.35;
const FOREGROUND_TAPER_CHROMA_OPTIONS = {
	alpha: 0.6,
	kLight: 0.2,
	kDark: 0.2,
} as const;

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

function getColorForLightness( seed: PlainColorObject, lightness: number ) {
	const tapered = taperChroma(
		seed,
		lightness,
		FOREGROUND_TAPER_CHROMA_OPTIONS
	);

	if ( 'space' in tapered ) {
		return clampToGamut( tapered );
	}

	return clampToGamut( {
		space: OKLCH,
		coords: [ tapered.l, tapered.c, get( seed, [ OKLCH, 'h' ] ) ],
		alpha: seed.alpha,
	} );
}

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
	seed,
	weakColor,
	strongColor,
	target,
}: {
	displayBackground: string;
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
		( lightness ) => getColorForLightness( seed, lightness ),
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
		const candidate = getColorForLightness( seed, lightness );
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
	seed,
	weakColor,
	strongColor,
	references,
	target,
}: {
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
		( lightness ) => getColorForLightness( seed, lightness ),
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

	const endpoint = getColorForLightness(
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
	stepIndex,
	seed,
	weakColor,
	strongColor,
	ramp,
	backgroundRamp,
}: {
	stepIndex: number;
	seed: PlainColorObject;
	weakColor: PlainColorObject;
	strongColor: PlainColorObject;
	ramp: RampResult;
	backgroundRamp: RampResult;
} ) {
	return findColorAtWcagFloor( {
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

function scaleMeetsWcagFloors(
	colors: ExperimentalForegroundScale[ 'colors' ],
	ramp: RampResult,
	backgroundRamp: RampResult
) {
	return colors.every( ( color, stepIndex ) =>
		getForegroundConstraintReferences(
			stepIndex,
			ramp,
			backgroundRamp
		).every(
			( reference ) =>
				getContrast( reference, color ) >=
				FOREGROUND_WCAG_FLOORS[ stepIndex ]
		)
	);
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
		return {
			colors: currentColors,
			meetsWcagFloors: scaleMeetsWcagFloors(
				currentColors,
				ramp,
				backgroundRamp
			),
		};
	}

	const seed = clampToGamut( seedArg );
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

	const colors = serializeScale( experimentalColors );
	return {
		colors,
		meetsWcagFloors: scaleMeetsWcagFloors( colors, ramp, backgroundRamp ),
	};
}
