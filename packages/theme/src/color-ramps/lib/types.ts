import type { TaperChromaOptions } from './taper-chroma.ts';

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
	// Foreground (text, icon) colors
	fgSurface2: string;
	fgSurface3: string;
	fgSurface4: string;
	fgSurface5: string;
	// Foreground (text, icon) colors on top of bgFill
	fgFill: string;
	fgFillInverted: string;
};

export type RampDirection = 'lighter' | 'darker';
// FGS4/FGS5 are produced by the foreground pass, not the base constraint solve.
export type BaseRamp = Omit< Ramp, 'fgSurface4' | 'fgSurface5' >;
export type BaseRampStep = keyof BaseRamp;
// Internal calculation profiles. ThemeProvider chooses from semantic usage;
// full ramps remain available for generation and diagnostics.
export type AccentRampPurpose = 'full' | 'interactive' | 'status';
export type FollowDirection = 'main' | 'opposite' | 'best' | RampDirection;
export type ContrastRequirement = {
	/** The reference color against which to calculate the contrast */
	reference: BaseRampStep | 'seed';
	/**
	 * Other colors against which the generated color must meet the same target.
	 * The solver uses the reference with the least contrast headroom for the
	 * selected direction.
	 */
	additionalReferences?: readonly ( BaseRampStep | 'seed' )[];
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
	sameAsIfPossible?: BaseRampStep;
};

export type RampStepsConfig = Record< BaseRampStep, RampStepConfig >;

export type ForegroundRampStep =
	| 'fgSurface2'
	| 'fgSurface3'
	| 'fgSurface4'
	| 'fgSurface5';

export type ForegroundScaleConfig = {
	/** Ramp step whose hue and chroma define the foreground scale. */
	seed: BaseRampStep;
	/** Background step used to measure the APCA contrast range. */
	perceptualReference: BaseRampStep;
	perceptualTargets: {
		/** Preferred APCA contrast for normal content and resting controls. */
		normalContrast: number;
		/** APCA contrast left unused unless the foreground intervals need it. */
		endpointReserve: number;
		/** Minimum APCA interval from weak to normal emphasis. */
		weakToNormal: number;
		/** Minimum APCA interval from a resting control to its active state. */
		normalToActive: number;
	};
	chroma:
		| {
				mode: 'tapered';
				options: TaperChromaOptions;
		  }
		| {
				mode: 'gamut-relative';
		  };
	steps: readonly ( {
		contrast: {
			references: readonly BaseRampStep[];
			target: number;
		};
	} & (
		| {
				name: Extract< ForegroundRampStep, BaseRampStep >;
				/** Preserve a base color when it meets every WCAG floor. */
				preserveAnchor: true;
		  }
		| { name: ForegroundRampStep; preserveAnchor?: false }
	) )[];
};

export type RampConfig = {
	steps: RampStepsConfig;
	foregroundScale: ForegroundScaleConfig;
};

export type RampResult< Colors = Ramp > = {
	ramp: Colors;
	warnings?: ( keyof Ramp )[];
	direction: RampDirection;
};

export type BaseRampResult = RampResult< BaseRamp >;

export type AccentRampResult = RampResult<
	Omit< Ramp, 'surface6' | 'stroke2' | 'stroke4' | 'fgSurface5' > &
		Partial<
			Pick< Ramp, 'surface6' | 'stroke2' | 'stroke4' | 'fgSurface5' >
		>
>;
