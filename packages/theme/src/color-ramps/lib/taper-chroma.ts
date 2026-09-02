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
	cUpperBound?: number; // hard search cap for C (default 0.45)
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
	const cUpperBound = options.cUpperBound ?? 0.45;
	const radiusLight = options.radiusLight ?? 0.2;
	const radiusDark = options.radiusDark ?? 0.2;
	const kLight = options.kLight ?? 0.85;
	const kDark = options.kDark ?? 0.85;
	const achromaEpsilon = options.achromaEpsilon ?? 0.005;

	const cSeed = Math.max( 0, seed.coords[ 1 ] ?? 0 );
	let hSeed = seed.coords[ 2 ];

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
	const lSeed = clamp01( seed.coords[ 0 ] ?? 0 );
	const resolvedHue = hSeed as number;
	const cmaxSeed = maxInGamutChromaAtLH(
		lSeed,
		resolvedHue,
		gamut,
		cUpperBound
	);
	const cmaxTarget = maxInGamutChromaAtLH(
		clamp01( lTarget ),
		resolvedHue,
		gamut,
		cUpperBound
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

const MAX_CACHED_CHROMA_CAPACITIES = 2_048;
// Exact keys preserve deterministic output. Rounded buckets can return a
// capacity calculated for an earlier, slightly different color.
const maxChromaCache = new WeakMap< ColorSpace, Map< string, number > >();

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
	let gamutCache = maxChromaCache.get( gamutSpace );
	if ( ! gamutCache ) {
		gamutCache = new Map();
		maxChromaCache.set( gamutSpace, gamutCache );
	}
	const cacheKey = `${ l }|${ h }|${ cap }`;
	const cachedChroma = gamutCache.get( cacheKey );
	if ( cachedChroma !== undefined ) {
		return cachedChroma;
	}

	// Construct a color with maximum chroma.
	const probe: PlainColorObject = {
		space: OKLCH,
		coords: [ l, cap, h ],
		alpha: 1,
	};

	// Let `toGamut` reduce the chroma to the gamut maximum.
	const clamped = toGamutCSS( probe, { space: gamutSpace } );
	const chroma = get( clamped, [ OKLCH, 'c' ] );

	if ( gamutCache.size >= MAX_CACHED_CHROMA_CAPACITIES ) {
		const oldestKey = gamutCache.keys().next().value;
		if ( oldestKey !== undefined ) {
			gamutCache.delete( oldestKey );
		}
	}
	gamutCache.set( cacheKey, chroma );

	return chroma;
}
