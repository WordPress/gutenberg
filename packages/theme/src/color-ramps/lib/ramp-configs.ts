/**
 * Internal dependencies
 */
import type { RampStepConfig, RampConfig, RampDirection } from './types';
import type { TaperChromaOptions } from './taper-chroma';

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

const fgSurface4Config: RampStepConfig = {
	contrast: {
		reference: 'surface3',
		followDirection: 'main',
		target: 7,
		preferLighter: true,
	},
	lightness: lightnessConstraintForegroundHighContrast,
	taperChromaOptions: FG_TAPER_CHROMA,
};

export const BG_RAMP_CONFIG: RampConfig = {
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
	bgFillInverted2: fgSurface4Config,
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
			target: 2.6,
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
	fgSurface4: fgSurface4Config,
	// fgFill
	fgFill: {
		contrast: {
			reference: 'bgFill1',
			followDirection: 'best',
			target: 4.5,
			preferLighter: true,
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

// BG_RAMP: seed => surface2 => {bgFill, surface3 => all other tokens}
// ACCENT_RAMP: seed => bgFill1 => surface2 => surface3 => all other tokens
export const ACCENT_RAMP_CONFIG: RampConfig = {
	...BG_RAMP_CONFIG,
	surface1: {
		...BG_RAMP_CONFIG.surface1,
		taperChromaOptions: ACCENT_SURFACE_TAPER_CHROMA,
	},
	surface2: {
		contrast: {
			reference: 'bgFill1',
			followDirection: 'opposite',
			target: BG_RAMP_CONFIG.bgFill1.contrast.target,
			ignoreWhenAdjustingSeed: true,
		},
		taperChromaOptions: ACCENT_SURFACE_TAPER_CHROMA,
	},
	surface3: {
		...BG_RAMP_CONFIG.surface3,
		taperChromaOptions: ACCENT_SURFACE_TAPER_CHROMA,
	},
	surface4: {
		...BG_RAMP_CONFIG.surface4,
		taperChromaOptions: ACCENT_SURFACE_TAPER_CHROMA,
	},
	surface5: {
		...BG_RAMP_CONFIG.surface5,
		taperChromaOptions: ACCENT_SURFACE_TAPER_CHROMA,
	},
	surface6: {
		...BG_RAMP_CONFIG.surface6,
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
		...BG_RAMP_CONFIG.stroke1,
	},
	stroke2: {
		...BG_RAMP_CONFIG.stroke2,
	},
	stroke3: {
		...BG_RAMP_CONFIG.stroke3,
		sameAsIfPossible: 'fgSurface3',
		taperChromaOptions: undefined,
	},
	stroke4: {
		...BG_RAMP_CONFIG.stroke4,
		taperChromaOptions: undefined,
	},
	// fgSurface: do not de-saturate
	fgSurface1: {
		...BG_RAMP_CONFIG.fgSurface1,
		taperChromaOptions: undefined,
	},
	fgSurface2: {
		...BG_RAMP_CONFIG.fgSurface2,
		taperChromaOptions: undefined,
	},
	fgSurface3: {
		...BG_RAMP_CONFIG.fgSurface3,
		taperChromaOptions: undefined,
		sameAsIfPossible: 'bgFill1',
	},
	fgSurface4: {
		...BG_RAMP_CONFIG.fgSurface4,
		taperChromaOptions: undefined,
	},
};
