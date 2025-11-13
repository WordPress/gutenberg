/**
 * Internal dependencies
 */
import type { TaperChromaOptions } from './taper-chroma';

export type Ramp = {
	// Backgrounds for surfaces (nuanced, slight variations compared to bg)
	surface1: string;
	surface2: string;
	surface3: string;
	surface4: string;
	surface5: string;
	surface6: string;
	// Strokes
	stroke1: string;
	stroke2: string;
	stroke3: string;
	stroke4: string;
	// Stronger backgrounds for primary UI elements
	bgFill1: string;
	bgFill2: string;
	bgFillInverted1: string;
	bgFillInverted2: string;
	bgFillDark: string;
	// Foreground (text, icon) colors
	fgSurface1: string;
	fgSurface2: string;
	fgSurface3: string;
	fgSurface4: string;
	// Foreground (text, icon) colors on top of bgFill
	fgFill: string;
	fgFillInverted: string;
	fgFillDark: string;
};

export type RampDirection = 'lighter' | 'darker';
export type FollowDirection = 'main' | 'opposite' | 'best' | RampDirection;
export type ContrastRequirement = {
	/** The reference color against which to calculate the contrast */
	reference: keyof Ramp | 'seed';
	/**
	 * Which direction should the algorithm search a matching color in:
	 * - main: follow the same direction as the ramp's main direction
	 * - opposite: follow the opposite direction of the ramp
	 * - best: pick the direction that has the most contrast headroom
	 * - hardcoded ramp direction (useful for generating colors that always
	 *   light/dark regardless of the ramp direction)
	 */
	followDirection: FollowDirection;
	/**
	 *  Prefer "lighter" direction when searching for a contrasting color.
	 * Especially useful for foreground color to counter the poor results that the
	 * WCAG algo gives when contrasting white text over mid-lightness backgrounds.
	 */
	preferLighter?: boolean;
	/**
	 * The contrast target to meet.
	 */
	target: number;
	/**
	 * When true, the algorithm won't count a failure in meeting the contrast
	 * target as a reason to recalculate the ramp.
	 */
	ignoreWhenAdjustingSeed?: boolean;
};

export type RampStepConfig = {
	contrast: ContrastRequirement;
	lightness?: ( direction: RampDirection ) => number;
	taperChromaOptions?: TaperChromaOptions;
	/**
	 * If specified, try to reuse the color from this step if it meets
	 * the contrast requirements. This reduces the number of unique colors
	 * in the ramp and improves consistency.
	 */
	sameAsIfPossible?: keyof Ramp;
};

export type RampConfig = Record< keyof Ramp, RampStepConfig >;

export type RampResult = {
	ramp: Record< keyof Ramp, string >;
	warnings?: string[];
	direction: RampDirection;
};
