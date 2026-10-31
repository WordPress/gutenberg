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
	// Near-gray handling: cap C at C_seed * nearGrayChromaRatio * (1 + (C_seed / nearGrayChroma)²)
	nearGrayChromaRatio?: number; // cap multiplier for a near-gray seed (default 4)
	nearGrayChroma?: number; // seed C above which the cap quickly stops binding (default 0.005)
}

/**
 * Given the seed and the target lightness, tapers the chroma smoothly.
 * - C_intended = Cmax(Lt,H0) * alpha * (seedRelative^carry)
 * - Continuous taper vs |Lt - Ls| to softly reduce chroma for neighbors
 * - C capped relative to C_seed, so a near-gray seed stays near-gray
 * - Seeds without a hue produce grayscale
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
	return createChromaTaper( seed, options )( lTarget );
}

/**
 * Prepare a chroma taper for repeated target-lightness calculations.
 *
 * @param seed    Seed color in OKLCH.
 * @param options Chroma taper options.
 */
export function createChromaTaper(
	seed: PlainColorObject,
	options: TaperChromaOptions = {}
): ( lTarget: number ) => { l: number; c: number } | PlainColorObject {
	const gamut = options.gamut ?? sRGB;
	const alpha = options.alpha ?? 0.65; // 0.7-0.8 works well for accent surface
	const carry = options.carry ?? 0.5;
	const radiusLight = options.radiusLight ?? 0.2;
	const radiusDark = options.radiusDark ?? 0.2;
	const kLight = options.kLight ?? 0.85;
	const kDark = options.kDark ?? 0.85;
	const nearGrayChromaRatio = options.nearGrayChromaRatio ?? 4;
	const nearGrayChroma = options.nearGrayChroma ?? 0.005;

	const hSeed = get( seed, [ OKLCH, 'h' ] );

	if ( hSeed === null || ! Number.isFinite( hSeed ) ) {
		// Respect achromatic intent: grayscale at target L
		return ( lTarget ) => ( {
			space: OKLCH,
			coords: [ clamp01( lTarget ), 0, 0 ],
			alpha: 1,
		} );
	}

	const cSeed = Math.max( 0, get( seed, [ OKLCH, 'c' ] ) );

	// Capacity at seed
	const lSeed = clamp01( get( seed, [ OKLCH, 'l' ] ) );
	const cmaxSeed = getMaxChromaAtLH( lSeed, hSeed, gamut );

	// Seed vividness ratio (hue-fair normalization)
	const denom = cmaxSeed > 0 ? cmaxSeed : 1e-6;
	const seedRelative = clamp01( cSeed / denom );
	const seedCarry = Math.pow( seedRelative, clamp01( carry ) );

	// Near the lightness extremes the seed's capacity approaches zero, so even
	// an imperceptible tint reads as vivid. Bound the carried chroma by the
	// seed's own chroma, which also fades near-gray seeds smoothly to gray.
	// The allowance grows quadratically, so it stops binding for tinted seeds.
	const cCap =
		cSeed *
		nearGrayChromaRatio *
		( 1 + Math.pow( cSeed / Math.max( nearGrayChroma, 1e-6 ), 2 ) );

	return ( lTarget ) => {
		const cmaxTarget = getMaxChromaAtLH( clamp01( lTarget ), hSeed, gamut );

		// Intended chroma from local capacity, tempered by seed vividness
		const cIntendedBase = alpha * cmaxTarget;
		const cWithCarry = cIntendedBase * seedCarry;

		// Gentle, symmetric desaturation vs distance in L
		const t = continuousTaper( lSeed, lTarget, {
			radiusLight,
			radiusDark,
			kLight,
			kDark,
		} );
		const cPlanned = Math.min( cWithCarry * t, cCap );

		// Downward-only clamp (preserve L & H)
		const lOut = clamp01( lTarget );

		return { l: lOut, c: cPlanned };
	};
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

/* ---- chroma-capacity queries ---- */

// Leave headroom above sRGB's maximum chroma of about 0.32.
const MAX_CHROMA = 0.45;
function getMaxChromaAtLH(
	l: number,
	h: number,
	gamutSpace: ColorSpace
): number {
	// Construct a color with maximum chroma.
	const probe: PlainColorObject = {
		space: OKLCH,
		coords: [ clamp01( l ), MAX_CHROMA, normalizeHue( h ) ],
		alpha: 1,
	};

	// Let `toGamut` reduce the chroma to the gamut maximum.
	const clamped = toGamutCSS( probe, { space: gamutSpace } );

	return get( clamped, [ OKLCH, 'c' ] );
}
