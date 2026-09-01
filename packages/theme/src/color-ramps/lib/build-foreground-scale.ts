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

/**
 * Rebuild the foreground part of an otherwise complete ramp. APCA positions
 * the intermediate steps within the visible contrast range, while WCAG ratios
 * remain hard floors across the surfaces where each step is used.
 *
 * @param ramp           Ramp whose foreground steps will be rebuilt.
 * @param backgroundRamp Background ramp on which the colors will appear.
 * @param config         Foreground scale anchors, positions, and constraints.
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
	const strongStep = config.steps.at( -1 )!;
	const currentStrongColor = clampToGamut( ramp.ramp[ strongStep.name ] );
	const strongEndpoint = getColorAtLightness(
		ramp.direction === 'lighter' ? 1 : 0
	);
	const strongColor = meetsContrastTarget(
		currentStrongColor,
		strongStep,
		ramp,
		backgroundRamp
	)
		? currentStrongColor
		: findColorAtContrastTarget( {
				getColorAtLightness,
				weakColor: currentStrongColor,
				strongColor: strongEndpoint,
				references: getConstraintReferences(
					strongStep,
					ramp,
					backgroundRamp
				),
				target: strongStep.contrast.target,
		  } );
	const colors = new Map< ForegroundRampStep, PlainColorObject >();

	for ( const step of config.steps.filter(
		( { preserveAnchor } ) => preserveAnchor
	) ) {
		if ( step === strongStep ) {
			colors.set( step.name, strongColor );
			continue;
		}

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
						strongColor,
						references: getConstraintReferences(
							step,
							ramp,
							backgroundRamp
						),
						target: step.contrast.target,
				  } )
		);
	}

	const firstStep = config.steps[ 0 ];
	const firstColor = colors.get( firstStep.name )!;
	const weakContrast = getPerceptualContrastMagnitude(
		displayBackground,
		firstColor
	);
	const strongContrast = getPerceptualContrastMagnitude(
		displayBackground,
		strongColor
	);

	for ( const step of config.steps.filter(
		( { preserveAnchor } ) => ! preserveAnchor
	) ) {
		const stepIndex = config.steps.indexOf( step );
		const previousStep = config.steps[ stepIndex - 1 ];
		const previousColor = colors.get( previousStep.name )!;
		const target =
			weakContrast + ( strongContrast - weakContrast ) * step.progress;
		const previousContrast = getPerceptualContrastMagnitude(
			displayBackground,
			previousColor
		);
		const candidate =
			target <= previousContrast
				? previousColor
				: findColorAtPerceptualContrast( {
						background: displayBackground,
						getColorAtLightness,
						weakColor: getColorAtLightness(
							get( previousColor, [ OKLCH, 'l' ] )
						),
						strongColor,
						target,
				  } );

		colors.set(
			step.name,
			meetsContrastTarget( candidate, step, ramp, backgroundRamp )
				? candidate
				: findColorAtContrastTarget( {
						getColorAtLightness,
						weakColor: candidate,
						strongColor,
						references: getConstraintReferences(
							step,
							ramp,
							backgroundRamp
						),
						target: step.contrast.target,
				  } )
		);
	}

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
