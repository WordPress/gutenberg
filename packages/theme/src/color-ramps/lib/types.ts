import type { TaperChromaOptions } from './taper-chroma.ts';

export type Ramp = {
	// Surface backgrounds: elevation (1–3) and emphasis (4–6).
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
	// Surface foregrounds: disabled (2), weak (3), normal (4), interaction (5).
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
	/** Color against which to calculate the WCAG contrast ratio. */
	reference: BaseRampStep | 'seed';
	/**
	 * Other colors against which the generated color must meet the same target.
	 * The solver uses the reference with the least contrast headroom for the
	 * selected direction.
	 */
	additionalReferences?: readonly ( BaseRampStep | 'seed' )[];
	/**
	 * Search direction: follow the ramp (`main`), reverse it (`opposite`),
	 * choose by endpoint contrast (`best`), or always use `lighter` / `darker`.
	 */
	followDirection: FollowDirection;
	/**
	 * Bias `best` toward white text. This affects direction selection, not the
	 * required contrast ratio, and does not force the lighter direction.
	 */
	preferLighter?: boolean;
	/**
	 * Required WCAG contrast ratio. A target of 1 copies the reference color.
	 */
	target: number;
	/**
	 * Exclude this target from seed adjustment and base-pass warnings.
	 */
	ignoreWhenAdjustingSeed?: boolean;
};

export type RampStepConfig = {
	contrast: ContrastRequirement;
	/** Preferred OKLCH lightness, used only when it meets the contrast target. */
	lightness?: ( direction: RampDirection ) => number;
	taperChromaOptions?: TaperChromaOptions;
	/**
	 * Reuse this base step's color if it meets all contrast requirements.
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
	/** Step in the background ramp used to measure the APCA contrast range. */
	perceptualReference: BaseRampStep;
	/** Preferred APCA magnitudes and gaps in Lc, not accessibility thresholds. */
	perceptualTargets: {
		/** Preferred APCA contrast for normal content and resting controls. */
		normalContrast: number;
		/** Preferred gap below black/white; spent if the foreground gaps need it. */
		endpointReserve: number;
		/** Preferred gap from weak to normal emphasis; compresses if necessary. */
		weakToNormal: number;
		/** Preferred gap from resting to interaction-state foreground. */
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
			/** Check these steps in both the current and background ramps. */
			references: readonly BaseRampStep[];
			/** Required WCAG contrast ratio, including after hex serialization. */
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
	/** Dependency-based WCAG solve, before perceptual reconstruction. */
	steps: RampStepsConfig;
	/** Foreground placement after surfaces and strokes have been rebuilt. */
	foregroundScale: ForegroundScaleConfig;
};

export type RampResult< Colors = Ramp > = {
	ramp: Colors;
	/** Steps still failing their checked constraints; not all possible pairs. */
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
