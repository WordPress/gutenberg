import {
	MINIMUM_NON_TEXT_CONTRAST,
	MINIMUM_TEXT_CONTRAST,
} from '../../semantic-color-contrast-pairs.ts';
import type { RampStepConfig, RampConfig, RampDirection } from './types.ts';
import { getContrastReferences } from './utils.ts';
import type { TaperChromaOptions } from './taper-chroma.ts';

const lightnessConstraintForegroundHighContrast = (
	direction: RampDirection
) =>
	direction === 'lighter'
		? 0.9551 // lightness of #f0f0f0 (ie $gray-100)
		: 0.235; // lightness of #1e1e1e (ie $gray-900)
const lightnessConstraintForegroundMediumContrast = (
	direction: RampDirection
) =>
	direction === 'lighter'
		? 0.77 // lightness of #b4b4b4
		: 0.56; // lightness of #747474
const lightnessConstraintBgFill = ( direction: RampDirection ) =>
	direction === 'lighter'
		? 0.67 // lightness of #969696 (7:1 vs black)
		: 0.45; // lightness of #555555 (7:1 vs white)

const BG_SURFACE_TAPER_CHROMA: TaperChromaOptions = {
	alpha: 0.7,
};
const FG_TAPER_CHROMA: TaperChromaOptions = {
	alpha: 0.6,
	kLight: 0.2,
	kDark: 0.2,
};
const STROKE_TAPER_CHROMA: TaperChromaOptions = {
	alpha: 0.6,
	radiusDark: 0.01,
	radiusLight: 0.01,
	kLight: 0.8,
	kDark: 0.8,
};
const ACCENT_SURFACE_TAPER_CHROMA: TaperChromaOptions = {
	alpha: 0.75,
	radiusDark: 0.01,
	radiusLight: 0.01,
};

// Keep the existing inverted active-fill behavior independent from the new
// foreground endpoint policy.
const highContrastInvertedFillConfig: RampStepConfig = {
	contrast: {
		reference: 'surface3',
		followDirection: 'main',
		target: 7,
		preferLighter: true,
	},
	lightness: lightnessConstraintForegroundHighContrast,
	taperChromaOptions: FG_TAPER_CHROMA,
};

const FOREGROUND_PERCEPTUAL_TARGETS = {
	// These are design targets, not accessibility thresholds. WCAG ratios remain
	// the hard gates for every surface on which a foreground can appear.
	// Prefer strong normal text, but lower it when that is necessary to preserve
	// a visible active state before the gamut endpoint.
	normalContrast: 90,
	// Let strong content and interaction states approach black or white.
	// WCAG remains a hard floor.
	endpointReserve: 1,
	// Separate weak supporting content from normal content, while leaving a
	// smaller interval for strong content and interaction states.
	weakToNormal: 12,
	normalToActive: 10,
	// Near black or white, sRGB has little room for chroma. Stop normal
	// emphasis before it loses most of its color. Neutral paths stay below
	// the chroma minimum, so this does not move gray text.
	chromaRetention: { share: 0.8, minimumChroma: 0.04 },
} as const;

const FOREGROUND_SCALE_STEPS = [
	{
		name: 'fgSurface2',
		preserveAnchor: true,
		contrast: { references: [ 'surface3' ], target: 3 },
	},
	{
		name: 'fgSurface3',
		contrast: {
			references: [ 'surface1', 'surface2', 'surface3' ],
			target: 4.5,
		},
	},
	{
		name: 'fgSurface4',
		contrast: {
			references: [
				'surface1',
				'surface2',
				'surface3',
				'surface4',
				'surface5',
			],
			target: 4.5,
		},
	},
	{
		name: 'fgSurface5',
		contrast: {
			references: [
				'surface1',
				'surface2',
				'surface3',
				'surface4',
				'surface5',
			],
			target: 4.5,
		},
	},
] as const;

const BASE_RAMP_STEPS: RampConfig[ 'steps' ] = {
	// Surface
	surface1: {
		contrast: {
			reference: 'surface2',
			followDirection: 'opposite',
			target: 1.06,
			ignoreWhenAdjustingSeed: true,
		},
		taperChromaOptions: BG_SURFACE_TAPER_CHROMA,
	},
	surface2: {
		contrast: {
			reference: 'seed',
			followDirection: 'main',
			target: 1,
		},
	},
	surface3: {
		contrast: {
			reference: 'surface2',
			followDirection: 'main',
			target: 1.06,
		},
		taperChromaOptions: BG_SURFACE_TAPER_CHROMA,
	},
	surface4: {
		contrast: {
			reference: 'surface2',
			followDirection: 'main',
			target: 1.12,
		},
		taperChromaOptions: BG_SURFACE_TAPER_CHROMA,
	},
	surface5: {
		contrast: {
			reference: 'surface2',
			followDirection: 'main',
			target: 1.2,
		},
		taperChromaOptions: BG_SURFACE_TAPER_CHROMA,
	},
	surface6: {
		contrast: {
			reference: 'surface2',
			followDirection: 'main',
			target: 1.4,
		},
		taperChromaOptions: BG_SURFACE_TAPER_CHROMA,
	},
	// Bg fill
	bgFill1: {
		contrast: {
			reference: 'surface2',
			followDirection: 'main',
			target: 4,
		},
		lightness: lightnessConstraintBgFill,
	},
	bgFill2: {
		contrast: {
			reference: 'bgFill1',
			followDirection: 'main',
			target: 1.2,
		},
	},
	bgFillInverted1: {
		contrast: {
			reference: 'bgFillInverted2',
			followDirection: 'opposite',
			target: 1.2,
		},
	},
	bgFillInverted2: highContrastInvertedFillConfig,
	bgFillDark: {
		contrast: {
			reference: 'surface3',
			followDirection: 'darker', // This is what causes the token to be always dark
			target: 7,
			ignoreWhenAdjustingSeed: true,
		},
		lightness: lightnessConstraintForegroundHighContrast,
		taperChromaOptions: FG_TAPER_CHROMA,
	},
	// Stroke
	stroke1: {
		contrast: {
			reference: 'stroke3',
			followDirection: 'opposite',
			target: 2.9,
		},
		taperChromaOptions: STROKE_TAPER_CHROMA,
	},
	stroke2: {
		contrast: {
			reference: 'stroke3',
			followDirection: 'opposite',
			target: 2.4,
		},
		taperChromaOptions: STROKE_TAPER_CHROMA,
	},
	stroke3: {
		contrast: {
			reference: 'surface3',
			followDirection: 'main',
			target: 3,
		},
		taperChromaOptions: STROKE_TAPER_CHROMA,
	},
	stroke4: {
		contrast: {
			reference: 'stroke3',
			followDirection: 'main',
			target: 1.5,
		},
		taperChromaOptions: STROKE_TAPER_CHROMA,
	},
	// fgSurface
	fgSurface2: {
		contrast: {
			reference: 'surface3',
			followDirection: 'main',
			target: 3,
			preferLighter: true,
		},
		taperChromaOptions: FG_TAPER_CHROMA,
	},
	fgSurface3: {
		contrast: {
			reference: 'surface3',
			followDirection: 'main',
			target: 4.5,
			preferLighter: true,
		},
		lightness: lightnessConstraintForegroundMediumContrast,
		taperChromaOptions: FG_TAPER_CHROMA,
	},
	// fgFill
	fgFill: {
		contrast: {
			reference: 'bgFill1',
			additionalReferences: [ { reference: 'bgFill2', target: 4.5 } ],
			followDirection: 'best',
			target: 4.5,
		},
		lightness: lightnessConstraintForegroundHighContrast,
		taperChromaOptions: FG_TAPER_CHROMA,
	},
	fgFillInverted: {
		contrast: {
			reference: 'bgFillInverted1',
			followDirection: 'best',
			target: 4.5,
			preferLighter: true,
		},
		lightness: lightnessConstraintForegroundHighContrast,
		taperChromaOptions: FG_TAPER_CHROMA,
	},
	fgFillDark: {
		contrast: {
			reference: 'bgFillDark',
			followDirection: 'best',
			target: 4.5,
			preferLighter: true,
		},
		lightness: lightnessConstraintForegroundHighContrast,
		taperChromaOptions: FG_TAPER_CHROMA,
	},
};

const withNearGrayChromaLimit = ( step: RampStepConfig ): RampStepConfig =>
	step.taperChromaOptions
		? {
				...step,
				taperChromaOptions: {
					...step.taperChromaOptions,
					preserveNearGrayTint: true,
					preserveSeedSaturation:
						step.taperChromaOptions === BG_SURFACE_TAPER_CHROMA ||
						step.taperChromaOptions === STROKE_TAPER_CHROMA,
				},
			}
		: step;

// Carry faint tints at close to their seed chroma. The quadratic allowance
// releases the bound for richer backgrounds; accent ramps retain their treatment.
export const BG_RAMP_CONFIG: RampConfig = {
	steps: Object.fromEntries(
		Object.entries( BASE_RAMP_STEPS ).map( ( [ stepName, step ] ) => [
			stepName,
			withNearGrayChromaLimit( step ),
		] )
	) as RampConfig[ 'steps' ],
	foregroundScale: {
		seed: 'surface2',
		perceptualReference: 'surface2',
		perceptualTargets: FOREGROUND_PERCEPTUAL_TARGETS,
		chroma: {
			mode: 'tapered',
			options: { ...FG_TAPER_CHROMA, preserveNearGrayTint: true },
		},
		steps: FOREGROUND_SCALE_STEPS,
	},
};

// BG_RAMP: seed => surface2 => {bgFill, surface3 => all other tokens}
// ACCENT_RAMP: seed => bgFill1 => surface2 => surface3 => all other tokens
export const ACCENT_RAMP_CONFIG: RampConfig = {
	steps: {
		...BASE_RAMP_STEPS,
		surface1: {
			...BASE_RAMP_STEPS.surface1,
			taperChromaOptions: ACCENT_SURFACE_TAPER_CHROMA,
		},
		surface2: {
			contrast: {
				reference: 'bgFill1',
				followDirection: 'opposite',
				target: BASE_RAMP_STEPS.bgFill1.contrast.target,
				ignoreWhenAdjustingSeed: true,
			},
			taperChromaOptions: ACCENT_SURFACE_TAPER_CHROMA,
		},
		surface3: {
			...BASE_RAMP_STEPS.surface3,
			taperChromaOptions: ACCENT_SURFACE_TAPER_CHROMA,
		},
		surface4: {
			...BASE_RAMP_STEPS.surface4,
			taperChromaOptions: ACCENT_SURFACE_TAPER_CHROMA,
		},
		surface5: {
			...BASE_RAMP_STEPS.surface5,
			taperChromaOptions: ACCENT_SURFACE_TAPER_CHROMA,
		},
		surface6: {
			...BASE_RAMP_STEPS.surface6,
			taperChromaOptions: ACCENT_SURFACE_TAPER_CHROMA,
		},
		bgFill1: {
			contrast: {
				reference: 'seed',
				followDirection: 'main',
				target: 1,
			},
		},
		stroke1: {
			...BASE_RAMP_STEPS.stroke1,
		},
		stroke2: {
			...BASE_RAMP_STEPS.stroke2,
		},
		stroke3: {
			...BASE_RAMP_STEPS.stroke3,
			sameAsIfPossible: 'fgSurface3',
			taperChromaOptions: undefined,
		},
		stroke4: {
			...BASE_RAMP_STEPS.stroke4,
			taperChromaOptions: undefined,
		},
		// fgSurface: do not de-saturate
		fgSurface2: {
			...BASE_RAMP_STEPS.fgSurface2,
			taperChromaOptions: undefined,
		},
		fgSurface3: {
			...BASE_RAMP_STEPS.fgSurface3,
			taperChromaOptions: undefined,
			sameAsIfPossible: 'bgFill1',
		},
	},
	foregroundScale: {
		seed: 'bgFill1',
		perceptualReference: 'surface2',
		perceptualTargets: FOREGROUND_PERCEPTUAL_TARGETS,
		chroma: { mode: 'gamut-relative' },
		steps: FOREGROUND_SCALE_STEPS,
	},
};

// PRIMARY_RAMP: seed => surface2 => surface1, surface3 => bgFill1 => ...
// The surfaces keep the lightness pinned from the background ramp, so the
// fills, focus ring and brand text can use the public brand surface as a
// contrast reference. Before the elevation swap for darker ramps, that is
// `surface1` for lighter ramps and `surface3` for darker ones.
function createPrimaryRampConfig(
	brandSurface: 'surface1' | 'surface3'
): RampConfig {
	// Add each surface target the step does not already meet or exceed.
	const withSurfaceTargets = (
		config: RampStepConfig,
		target: number
	): RampStepConfig => {
		const existing = getContrastReferences( config.contrast );
		return {
			...config,
			contrast: {
				...config.contrast,
				additionalReferences: [
					...( config.contrast.additionalReferences ?? [] ),
					...( [ 'neutralSurface', brandSurface ] as const )
						.filter(
							( reference ) =>
								! existing.some(
									( current ) =>
										current.reference === reference &&
										current.target >= target
								)
						)
						.map( ( reference ) => ( { reference, target } ) ),
				],
			},
		};
	};

	const { steps } = ACCENT_RAMP_CONFIG;
	return {
		...ACCENT_RAMP_CONFIG,
		steps: {
			...steps,
			surface2: {
				...steps.surface2,
				contrast: {
					...steps.surface2.contrast,
					reference: 'seed',
				},
			},
			bgFill1: withSurfaceTargets(
				{
					sameAsIfPossible: 'seed',
					contrast: {
						reference: 'neutralSurface',
						target: MINIMUM_NON_TEXT_CONTRAST,
						followDirection: 'main',
					},
				},
				MINIMUM_NON_TEXT_CONTRAST
			),
			bgFill2: withSurfaceTargets(
				steps.bgFill2,
				MINIMUM_NON_TEXT_CONTRAST
			),
			stroke3: withSurfaceTargets(
				steps.stroke3,
				MINIMUM_NON_TEXT_CONTRAST
			),
			fgSurface3: withSurfaceTargets(
				steps.fgSurface3,
				MINIMUM_TEXT_CONTRAST
			),
		},
	};
}

export const PRIMARY_RAMP_CONFIGS: Record< RampDirection, RampConfig > = {
	lighter: createPrimaryRampConfig( 'surface1' ),
	darker: createPrimaryRampConfig( 'surface3' ),
};
