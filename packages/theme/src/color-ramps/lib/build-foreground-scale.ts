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
import { clampToGamut, getColorString, getContrast } from './color-utils.ts';
import { UNIVERSAL_CONTRAST_TOPUP } from './constants.ts';
import { taperChroma } from './taper-chroma.ts';
import type {
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

function getConstraintReferences(
	step: ForegroundScaleConfig[ 'steps' ][ number ],
	ramp: RampResult,
	backgroundRamp: RampResult
) {
	return Array.from(
		new Set( [
			...step.contrast.references.map( ( name ) => ramp.ramp[ name ] ),
			...step.contrast.references.map(
				( name ) => backgroundRamp.ramp[ name ]
			),
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

function meetsContrastTarget(
	color: PlainColorObject,
	step: ForegroundScaleConfig[ 'steps' ][ number ],
	ramp: RampResult,
	backgroundRamp: RampResult
) {
	return (
		getContrastTargetMargin(
			color,
			getConstraintReferences( step, ramp, backgroundRamp ),
			step.contrast.target
		) >= 0
	);
}

function findColorAtContrastTarget( {
	getColorAtLightness,
	weakColor,
	strongColor,
	references,
	target,
}: {
	getColorAtLightness: GetColorForLightness;
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
		getColorAtLightness,
		( color ) => getContrastTargetMargin( color, references, target ),
		get( weakColor, [ OKLCH, 'l' ] ),
		weakMargin,
		get( strongColor, [ OKLCH, 'l' ] ),
		strongMargin
	);
}

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

function serializeColorMeetingContrast( {
	color,
	getColorAtLightness,
	strongColor,
	references,
	target,
}: {
	color: PlainColorObject;
	getColorAtLightness: GetColorForLightness;
	strongColor: PlainColorObject;
	references: readonly string[];
	target: number;
} ) {
	const serializedColor = getColorString( color );
	if (
		references.every(
			( reference ) => getContrast( reference, serializedColor ) >= target
		)
	) {
		return serializedColor;
	}

	const colorLightness = get( color, [ OKLCH, 'l' ] );
	const strongLightness = get( strongColor, [ OKLCH, 'l' ] );
	const direction = Math.sign( strongLightness - colorLightness );
	const maximumOffset = Math.abs( strongLightness - colorLightness );

	for ( let offset = 0.00025; offset < maximumOffset; offset += 0.00025 ) {
		const strengthened = getColorString(
			getColorAtLightness( colorLightness + direction * offset )
		);
		if (
			references.every(
				( reference ) =>
					getContrast( reference, strengthened ) >= target
			)
		) {
			return strengthened;
		}
	}

	return getColorString( strongColor );
}

function serializeColorMeetingPerceptualInterval( {
	background,
	normalColor,
	strongColor,
	strongEndpoint,
	getColorAtLightness,
	references,
	wcagTarget,
	perceptualTarget,
}: {
	background: PlainColorObject;
	normalColor: string;
	strongColor: string;
	strongEndpoint: PlainColorObject;
	getColorAtLightness: GetColorForLightness;
	references: readonly string[];
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
		references.some(
			( reference ) =>
				getContrast( reference, serializedEndpoint ) < wcagTarget
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
			references.every(
				( reference ) =>
					getContrast( reference, strengthened ) >= wcagTarget
			)
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
 * @param ramp           Ramp whose foreground steps will be rebuilt.
 * @param backgroundRamp Background ramp on which the colors will appear.
 * @param config         Foreground scale anchors, targets, and constraints.
 */
export function buildForegroundScale(
	ramp: RampResult,
	backgroundRamp: RampResult,
	config: ForegroundScaleConfig
): RampResult {
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
	const strongStep = steps.fgSurface5;
	const strongEndpoint = getColorAtLightness(
		ramp.direction === 'lighter' ? 1 : 0
	);
	const colors = new Map< ForegroundRampStep, PlainColorObject >();

	for ( const step of config.steps.filter(
		( { preserveAnchor } ) => preserveAnchor
	) ) {
		const currentColor = clampToGamut( ramp.ramp[ step.name ] );
		colors.set(
			step.name,
			meetsContrastTarget( currentColor, step, ramp, backgroundRamp )
				? currentColor
				: findColorAtContrastTarget( {
						getColorAtLightness: ( lightness ) =>
							getChromaPreservingColorForLightness(
								currentColor,
								lightness
							),
						weakColor: currentColor,
						strongColor: strongEndpoint,
						references: getConstraintReferences(
							step,
							ramp,
							backgroundRamp
						),
						target: step.contrast.target,
				  } )
		);
	}

	const fgSurface2 = colors.get( 'fgSurface2' )!;
	const fgSurface3 = findColorAtContrastTarget( {
		getColorAtLightness,
		weakColor: getColorAtLightness( get( fgSurface2, [ OKLCH, 'l' ] ) ),
		strongColor: strongEndpoint,
		references: getConstraintReferences(
			steps.fgSurface3,
			ramp,
			backgroundRamp
		),
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
		references: getConstraintReferences(
			steps.fgSurface4,
			ramp,
			backgroundRamp
		),
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
			steps.fgSurface4,
			ramp,
			backgroundRamp
		)
	) {
		normalColor = findColorAtContrastTarget( {
			getColorAtLightness,
			weakColor: normalColor,
			strongColor: strongEndpoint,
			references: getConstraintReferences(
				steps.fgSurface4,
				ramp,
				backgroundRamp
			),
			target: steps.fgSurface4.contrast.target,
		} );
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
	let strongColor = findColorAtPerceptualContrast( {
		background: displayBackground,
		getColorAtLightness,
		weakColor: normalColor,
		strongColor: strongEndpoint,
		target: requestedStrongContrast,
	} );
	if (
		! meetsContrastTarget( strongColor, strongStep, ramp, backgroundRamp )
	) {
		strongColor = findColorAtContrastTarget( {
			getColorAtLightness,
			weakColor: strongColor,
			strongColor: strongEndpoint,
			references: getConstraintReferences(
				strongStep,
				ramp,
				backgroundRamp
			),
			target: strongStep.contrast.target,
		} );
	}

	colors.set( 'fgSurface3', fgSurface3 );
	colors.set( 'fgSurface4', normalColor );
	colors.set( 'fgSurface5', strongColor );

	const nextRamp = { ...ramp.ramp };
	for ( const step of config.steps ) {
		const color = colors.get( step.name )!;
		nextRamp[ step.name ] = serializeColorMeetingContrast( {
			color,
			getColorAtLightness:
				step.preserveAnchor && step !== strongStep
					? ( lightness ) =>
							getChromaPreservingColorForLightness(
								color,
								lightness
							)
					: getColorAtLightness,
			strongColor,
			references: getConstraintReferences( step, ramp, backgroundRamp ),
			target: step.contrast.target,
		} );
	}
	nextRamp.fgSurface5 = serializeColorMeetingPerceptualInterval( {
		background: displayBackground,
		normalColor: nextRamp.fgSurface4,
		strongColor: nextRamp.fgSurface5,
		strongEndpoint,
		getColorAtLightness,
		references: getConstraintReferences( strongStep, ramp, backgroundRamp ),
		wcagTarget: strongStep.contrast.target,
		perceptualTarget: normalToActive,
	} );

	const foregroundStepNames = new Set< keyof typeof ramp.ramp >(
		config.steps.map( ( { name } ) => name )
	);
	const warnings = ( ramp.warnings ?? [] ).filter(
		( step ) => ! foregroundStepNames.has( step )
	);
	for ( const step of config.steps ) {
		if (
			getConstraintReferences( step, ramp, backgroundRamp ).some(
				( reference ) =>
					getContrast( reference, nextRamp[ step.name ] ) <
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
