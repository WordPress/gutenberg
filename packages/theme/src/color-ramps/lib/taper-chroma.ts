import {
	get,
	toGamutCSS,
	OKLCH,
	sRGB,
	type ColorSpace,
	type PlainColorObject,
} from 'colorjs.io/fn';

export interface TaperChromaOptions {
	gamut?: ColorSpace; // target gamut (default `sRGB`)
	alpha?: number; // base fraction of Cmax at target (default 0.62)
	carry?: number; // seed vividness carry exponent β in [0..1] (default 0.5)
	// Continuous taper around the seed (desaturate both sides slightly)
	radiusLight?: number; // distance in L where kLight is reached (default 0.20)
	radiusDark?: number; // distance in L where kDark is reached (default 0.20)
	kLight?: number; // floor multiplier near lighter side (default 0.85)
	kDark?: number; // floor multiplier near darker side (default 0.85)
	// Achromatic handling
	hueFallback?: number; // degrees: if seed is achromatic and you still want color
	achromaEpsilon?: number; // ≤ this chroma → treat as achromatic (default 0.005)
}

/**
 * Given the seed and the target lightness, tapers the chroma smoothly.
 * - C_intended = Cmax(Lt,H0) * alpha * (seedRelative^carry)
 * - Continuous taper vs |Lt - Ls| to softly reduce chroma for neighbors
 * - Downward-only clamp on C (preserve L & H)
 * @param seed
 * @param lTarget
 * @param options
 */
export function taperChroma(
	seed: PlainColorObject, // already OKLCH
	lTarget: number, // [0..1]
	options: TaperChromaOptions = {}
): { l: number; c: number } | PlainColorObject {
	const gamut = options.gamut ?? sRGB;
	const alpha = options.alpha ?? 0.65; // 0.7-0.8 works well for accent surface
	const carry = options.carry ?? 0.5;
	const radiusLight = options.radiusLight ?? 0.2;
	const radiusDark = options.radiusDark ?? 0.2;
	const kLight = options.kLight ?? 0.85;
	const kDark = options.kDark ?? 0.85;
	const achromaEpsilon = options.achromaEpsilon ?? 0.005;

	const cSeed = Math.max( 0, get( seed, [ OKLCH, 'c' ] ) );
	let hSeed = get( seed, [ OKLCH, 'h' ] );

	const chromaIsTiny = cSeed < achromaEpsilon;
	const hueIsInvalid = hSeed === null || ! Number.isFinite( hSeed );

	if ( chromaIsTiny || hueIsInvalid ) {
		if ( typeof options.hueFallback === 'number' ) {
			hSeed = normalizeHue( options.hueFallback );
		} else {
			// Respect achromatic intent: grayscale at target L
			return {
				space: OKLCH,
				coords: [ clamp01( lTarget ), 0, 0 ],
				alpha: 1,
			};
		}
	}

	// Capacity at seed and target
	const lSeed = clamp01( get( seed, [ OKLCH, 'l' ] ) );
	const cmaxSeed = getCachedMaxChromaAtLH( lSeed, hSeed, gamut );
	const cmaxTarget = getCachedMaxChromaAtLH(
		clamp01( lTarget ),
		hSeed,
		gamut
	);

	// Seed vividness ratio (hue-fair normalization)
	let seedRelative = 0;
	const denom = cmaxSeed > 0 ? cmaxSeed : 1e-6;
	seedRelative = clamp01( cSeed / denom );

	// Intended chroma from local capacity, tempered by seed vividness
	const cIntendedBase = alpha * cmaxTarget;
	const cWithCarry =
		cIntendedBase * Math.pow( seedRelative, clamp01( carry ) );

	// Gentle, symmetric desaturation vs distance in L
	const t = continuousTaper( lSeed, lTarget, {
		radiusLight,
		radiusDark,
		kLight,
		kDark,
	} );
	const cPlanned = cWithCarry * t;

	// Downward-only clamp (preserve L & H)
	const lOut = clamp01( lTarget );

	return { l: lOut, c: cPlanned };
}

/* ---------------- helpers & caches ---------------- */

function clamp01( x: number ): number {
	if ( x < 0 ) {
		return 0;
	}
	if ( x > 1 ) {
		return 1;
	}
	return x;
}
function normalizeHue( h: number ): number {
	let hue = h % 360;
	if ( hue < 0 ) {
		hue += 360;
	}
	return hue;
}
function raisedCosine( u: number ): number {
	const x = clamp01( u );
	return 0.5 - 0.5 * Math.cos( Math.PI * x );
}

/**
 * smooth, distance-from-seed chroma taper (raised-cosine per side)
 * @param seedL
 * @param targetL
 * @param opts
 * @param opts.radiusLight
 * @param opts.radiusDark
 * @param opts.kLight
 * @param opts.kDark
 */
function continuousTaper(
	seedL: number,
	targetL: number,
	opts: {
		radiusLight: number;
		radiusDark: number;
		kLight: number;
		kDark: number;
	}
): number {
	const d = targetL - seedL;
	if ( d >= 0 ) {
		const u = opts.radiusLight > 0 ? Math.abs( d ) / opts.radiusLight : 1;
		const w = raisedCosine( u > 1 ? 1 : u );
		return 1 - ( 1 - opts.kLight ) * w;
	}
	const u = opts.radiusDark > 0 ? Math.abs( d ) / opts.radiusDark : 1;
	const w = raisedCosine( u > 1 ? 1 : u );
	return 1 - ( 1 - opts.kDark ) * w;
}

/* ---- chroma-capacity queries with small caches ---- */

// Leave headroom above sRGB's maximum chroma of about 0.32.
const MAX_CHROMA = 0.45;
// Cosine spacing concentrates 31 lightness samples near the gamut boundaries,
// where chroma capacity changes fastest. Together with four-degree hue
// samples, this kept the measured error of fully vivid, default-alpha output
// probes below the CSS Color 4 DeltaEOK just-noticeable difference of 0.02.
const LIGHTNESS_INTERVAL_COUNT = 30;
const HUE_SAMPLE_COUNT = 90;
const SAMPLES_PER_GAMUT = ( LIGHTNESS_INTERVAL_COUNT + 1 ) * HUE_SAMPLE_COUNT;
const maxChromaCache = new WeakMap< ColorSpace, Float64Array >();

function interpolate( start: number, end: number, amount: number ): number {
	return start + ( end - start ) * amount;
}

function getLightnessSample( index: number ): number {
	return (
		( 1 - Math.cos( ( Math.PI * index ) / LIGHTNESS_INTERVAL_COUNT ) ) / 2
	);
}

function getInterpolatedChromaAtLightnessSample(
	lightnessIndex: number,
	hueLowerIndex: number,
	hueUpperIndex: number,
	hueAmount: number,
	gamutSpace: ColorSpace
): number {
	const lower = getCachedMaxChromaAtSample(
		lightnessIndex,
		hueLowerIndex,
		gamutSpace
	);
	if ( hueAmount === 0 ) {
		return lower;
	}
	const upper = getCachedMaxChromaAtSample(
		lightnessIndex,
		hueUpperIndex,
		gamutSpace
	);
	return interpolate( lower, upper, hueAmount );
}

function getCachedMaxChromaAtLH(
	l: number,
	h: number,
	gamutSpace: ColorSpace
): number {
	const lightness = clamp01( l );
	const lightnessPosition =
		( Math.acos( 1 - 2 * lightness ) / Math.PI ) * LIGHTNESS_INTERVAL_COUNT;
	const lightnessLowerIndex = Math.floor( lightnessPosition );
	const lightnessUpperIndex = Math.ceil( lightnessPosition );
	const lightnessLower = getLightnessSample( lightnessLowerIndex );
	const lightnessUpper = getLightnessSample( lightnessUpperIndex );
	const lightnessAmount =
		lightnessLower === lightnessUpper
			? 0
			: ( lightness - lightnessLower ) /
			  ( lightnessUpper - lightnessLower );

	const huePosition = ( normalizeHue( h ) / 360 ) * HUE_SAMPLE_COUNT;
	const hueLowerIndex = Math.floor( huePosition );
	const hueUpperIndex = ( hueLowerIndex + 1 ) % HUE_SAMPLE_COUNT;
	const hueAmount = huePosition - hueLowerIndex;

	const lower = getInterpolatedChromaAtLightnessSample(
		lightnessLowerIndex,
		hueLowerIndex,
		hueUpperIndex,
		hueAmount,
		gamutSpace
	);
	if ( lightnessAmount === 0 ) {
		return lower;
	}
	const upper = getInterpolatedChromaAtLightnessSample(
		lightnessUpperIndex,
		hueLowerIndex,
		hueUpperIndex,
		hueAmount,
		gamutSpace
	);
	return interpolate( lower, upper, lightnessAmount );
}

function getCachedMaxChromaAtSample(
	lightnessIndex: number,
	hueIndex: number,
	gamutSpace: ColorSpace
): number {
	let gamutCache = maxChromaCache.get( gamutSpace );
	if ( ! gamutCache ) {
		gamutCache = new Float64Array( SAMPLES_PER_GAMUT );
		gamutCache.fill( Number.NaN );
		maxChromaCache.set( gamutSpace, gamutCache );
	}

	const key = lightnessIndex * HUE_SAMPLE_COUNT + hueIndex;
	const hit = gamutCache[ key ];
	if ( ! Number.isNaN( hit ) ) {
		return hit;
	}

	const computed = maxInGamutChromaAtLH(
		getLightnessSample( lightnessIndex ),
		( hueIndex * 360 ) / HUE_SAMPLE_COUNT,
		gamutSpace,
		MAX_CHROMA
	);
	gamutCache[ key ] = computed;
	return computed;
}

/**
 * Find the max in-gamut chroma at fixed (L,H) in the target gamut
 * @param l
 * @param h
 * @param gamutSpace
 * @param cap
 */
function maxInGamutChromaAtLH(
	l: number,
	h: number,
	gamutSpace: ColorSpace,
	cap: number
): number {
	// Construct a color with maximum chroma.
	const probe: PlainColorObject = {
		space: OKLCH,
		coords: [ l, cap, h ],
		alpha: 1,
	};

	// Let `toGamut` reduce the chroma to the gamut maximum.
	const clamped = toGamutCSS( probe, { space: gamutSpace } );

	return get( clamped, [ OKLCH, 'c' ] );
}
