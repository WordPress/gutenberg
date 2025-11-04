/**
 * External dependencies
 */
import {
	get,
	inGamut,
	OKLCH,
	P3,
	sRGB,
	type ColorTypes,
	type ColorObject,
	// Disable reason: ESLint resolver can't handle `exports`. Import resolver
	// checking is redundant in TypeScript files.
	// eslint-disable-next-line import/no-unresolved
} from 'colorjs.io/fn';

/**
 * Internal dependencies
 */
import './register-color-spaces';

export interface TaperChromaOptions {
	gamut?: 'p3' | 'srgb'; // target gamut (default "p3")
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
	seed: ColorTypes, // already OKLCH
	lTarget: number, // [0..1]
	options: TaperChromaOptions = {}
): { l: number; c: number } | ColorObject {
	const gamut = options.gamut ?? 'p3';
	const gamutSpace = gamut === 'p3' ? P3 : sRGB;
	const alpha = options.alpha ?? 0.65; // 0.7-0.8 works well for accent surface
	const carry = options.carry ?? 0.5;
	const cUpperBound = options.cUpperBound ?? 0.45;
	const radiusLight = options.radiusLight ?? 0.2;
	const radiusDark = options.radiusDark ?? 0.2;
	const kLight = options.kLight ?? 0.85;
	const kDark = options.kDark ?? 0.85;
	const achromaEpsilon = options.achromaEpsilon ?? 0.005;

	const cSeed = Math.max( 0, get( seed, [ OKLCH, 'c' ] ) );
	let hSeed = Number( get( seed, [ OKLCH, 'h' ] ) );

	const chromaIsTiny = cSeed < achromaEpsilon;
	const hueIsInvalid = ! Number.isFinite( hSeed );

	if ( chromaIsTiny || hueIsInvalid ) {
		if ( typeof options.hueFallback === 'number' ) {
			hSeed = normalizeHue( options.hueFallback );
		} else {
			// Respect achromatic intent: grayscale at target L
			return {
				spaceId: 'oklch',
				coords: [ clamp01( lTarget ), 0, 0 ],
			};
		}
	}

	// Capacity at seed and target
	const lSeed = clamp01( get( seed, [ OKLCH, 'l' ] ) );
	const cmaxSeed = getCachedMaxChromaAtLH(
		lSeed,
		hSeed,
		gamutSpace,
		cUpperBound
	);
	const cmaxTarget = getCachedMaxChromaAtLH(
		clamp01( lTarget ),
		hSeed,
		gamutSpace,
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
	let cPlanned = cWithCarry * t;

	// Downward-only clamp (preserve L & H)
	const lOut = clamp01( lTarget );
	const candidate: ColorTypes = {
		spaceId: 'oklch',
		coords: [ lOut, cPlanned, hSeed ],
	};
	if ( ! inGamut( candidate, gamutSpace ) ) {
		const cap = Math.min( cPlanned, cUpperBound );
		cPlanned = getCachedMaxChromaAtLH( lOut, hSeed, gamutSpace, cap );
	}

	cPlanned = Math.min( cPlanned, cSeed );

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

const maxChromaCache = new Map< string, number >();

function keyMax(
	l: number,
	h: number,
	gamut: 'p3' | 'srgb',
	cap: number
): string {
	// Quantize to keep cache compact
	const lq = quantize( l, 1e-3 );
	const hq = quantize( normalizeHue( h ), 1e-1 );
	const cq = quantize( cap, 1e-3 );
	return `${ gamut }|L:${ lq }|H:${ hq }|cap:${ cq }`;
}
function quantize( x: number, step: number ): number {
	const k = Math.round( x / step );
	return k * step;
}

function getCachedMaxChromaAtLH(
	l: number,
	h: number,
	gamutSpace: typeof P3 | typeof sRGB,
	cap: number
): number {
	const gamut = gamutSpace === P3 ? 'p3' : 'srgb';
	const key = keyMax( l, h, gamut, cap );
	const hit = maxChromaCache.get( key );
	if ( typeof hit === 'number' ) {
		return hit;
	}

	const computed = maxInGamutChromaAtLH( l, h, gamutSpace, cap );
	maxChromaCache.set( key, computed );
	return computed;
}

/**
 * Binary-search the max in-gamut chroma at fixed (L,H) in the target gamut
 * @param l
 * @param h
 * @param gamutSpace
 * @param cap
 */
function maxInGamutChromaAtLH(
	l: number,
	h: number,
	gamutSpace: typeof P3 | typeof sRGB,
	cap: number
): number {
	let lo = 0;
	let hi = cap;
	let ok = 0;

	const lFixed = clamp01( l );
	const hFixed = normalizeHue( h );

	for ( let i = 0; i < 18; i++ ) {
		const mid = ( lo + hi ) / 2;
		const probe: ColorTypes = {
			spaceId: 'oklch',
			coords: [ lFixed, mid, hFixed ],
		};
		if ( inGamut( probe, gamutSpace ) ) {
			ok = mid;
			lo = mid;
		} else {
			hi = mid;
		}
	}
	return ok;
}
