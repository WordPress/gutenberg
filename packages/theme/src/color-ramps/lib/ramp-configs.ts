import type { RampStepConfig, RampConfig, RampDirection } from './types.ts';
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

const fgSurface5Config: RampStepConfig = {
	// The foreground scale pass derives the strong endpoint from APCA targets.
	// The base solver only needs to establish the WCAG floor and direction.
	contrast: {
		reference: 'surface3',
		followDirection: 'main',
		target: 4.5,
		preferLighter: true,
	},
	taperChromaOptions: FG_TAPER_CHROMA,
};

const FOREGROUND_PERCEPTUAL_TARGETS = {
	// These are design targets, not accessibility thresholds. WCAG ratios remain
	// the hard gates for every surface on which a foreground can appear.
	// Prefer strong normal text, but lower it when that is necessary to preserve
	// a visible active state before the gamut endpoint.
	normalContrast: 86,
	// Let the interaction-state endpoint approach black or white when that makes
	// the state change more visible. WCAG remains a hard floor.
	endpointReserve: 1,
	// Keep weak supporting content visibly separate from normal content, then
	// reserve a larger interval for the interaction-state-only endpoint.
	weakToNormal: 12,
	normalToActive: 14,
} as const;

const FOREGROUND_SCALE_STEPS = [
	{
		name: 'fgSurface1',
		preserveAnchor: true,
		contrast: { references: [ 'surface3' ], target: 2 },
	},
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

const BG_RAMP_STEPS: RampConfig[ 'steps' ] = {
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
			followDirection: 'darker',
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
	fgSurface1: {
		contrast: {
			reference: 'surface3',
			followDirection: 'main',
			target: 2,
			preferLighter: true,
		},
		taperChromaOptions: FG_TAPER_CHROMA,
	},
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
	fgSurface4: {
		contrast: {
			reference: 'surface3',
			followDirection: 'main',
			target: 4.5,
			preferLighter: true,
		},
		taperChromaOptions: FG_TAPER_CHROMA,
		sameAsIfPossible: 'fgSurface5',
	},
	fgSurface5: fgSurface5Config,
	// fgFill
	fgFill: {
		contrast: {
			reference: 'bgFill1',
			additionalReferences: [ 'bgFill2' ],
			followDirection: 'best',
			// Preserve the 4.5:1 WCAG floor after 8-bit sRGB serialization.
			target: 4.55,
		},
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

export const BG_RAMP_CONFIG: RampConfig = {
	steps: BG_RAMP_STEPS,
	foregroundScale: {
		seed: 'surface2',
		perceptualReference: 'surface2',
		perceptualTargets: FOREGROUND_PERCEPTUAL_TARGETS,
		chroma: {
			mode: 'tapered',
			options: FG_TAPER_CHROMA,
		},
		steps: FOREGROUND_SCALE_STEPS,
	},
};

// BG_RAMP: seed => surface2 => {bgFill, surface3 => all other tokens}
// ACCENT_RAMP: seed => bgFill1 => surface2 => surface3 => all other tokens
export const ACCENT_RAMP_CONFIG: RampConfig = {
	steps: {
		...BG_RAMP_CONFIG.steps,
		surface1: {
			...BG_RAMP_CONFIG.steps.surface1,
			taperChromaOptions: ACCENT_SURFACE_TAPER_CHROMA,
		},
		surface2: {
			contrast: {
				reference: 'bgFill1',
				followDirection: 'opposite',
				target: BG_RAMP_CONFIG.steps.bgFill1.contrast.target,
				ignoreWhenAdjustingSeed: true,
			},
			taperChromaOptions: ACCENT_SURFACE_TAPER_CHROMA,
		},
		surface3: {
			...BG_RAMP_CONFIG.steps.surface3,
			taperChromaOptions: ACCENT_SURFACE_TAPER_CHROMA,
		},
		surface4: {
			...BG_RAMP_CONFIG.steps.surface4,
			taperChromaOptions: ACCENT_SURFACE_TAPER_CHROMA,
		},
		surface5: {
			...BG_RAMP_CONFIG.steps.surface5,
			taperChromaOptions: ACCENT_SURFACE_TAPER_CHROMA,
		},
		surface6: {
			...BG_RAMP_CONFIG.steps.surface6,
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
			...BG_RAMP_CONFIG.steps.stroke1,
		},
		stroke2: {
			...BG_RAMP_CONFIG.steps.stroke2,
		},
		stroke3: {
			...BG_RAMP_CONFIG.steps.stroke3,
			sameAsIfPossible: 'fgSurface3',
			taperChromaOptions: undefined,
		},
		stroke4: {
			...BG_RAMP_CONFIG.steps.stroke4,
			taperChromaOptions: undefined,
		},
		// fgSurface: do not de-saturate
		fgSurface1: {
			...BG_RAMP_CONFIG.steps.fgSurface1,
			taperChromaOptions: undefined,
		},
		fgSurface2: {
			...BG_RAMP_CONFIG.steps.fgSurface2,
			taperChromaOptions: undefined,
		},
		fgSurface3: {
			...BG_RAMP_CONFIG.steps.fgSurface3,
			taperChromaOptions: undefined,
			sameAsIfPossible: 'bgFill1',
		},
		fgSurface4: {
			...BG_RAMP_CONFIG.steps.fgSurface4,
			taperChromaOptions: undefined,
		},
		fgSurface5: {
			...BG_RAMP_CONFIG.steps.fgSurface5,
			taperChromaOptions: undefined,
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
