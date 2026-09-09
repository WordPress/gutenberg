import {
	get,
	to,
	OKLab,
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
	const cmaxSeed = maxInGamutChromaAtLH( lSeed, hSeed, gamut );
	const cmaxTarget = maxInGamutChromaAtLH( clamp01( lTarget ), hSeed, gamut );

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

/* ---- chroma capacity ---- */

/**
 * The `a` and `b` columns of the OKLab-to-LMS' matrix. The `L` column is all
 * ones, so with `a = C·cos(H)` and `b = C·sin(H)` every LMS' component is
 * `L + C·k`, linear in chroma.
 */
const OKLAB_AB_TO_LMS: [ number, number ][] = [
	[ 0.3963377773761749, 0.2158037573099136 ],
	[ -0.1055613458156586, -0.0638541728258133 ],
	[ -0.0894841775298119, -1.2914855480194092 ],
];

/**
 * The LMS' basis vectors expressed in OKLab, i.e. the columns of the inverse
 * of the matrix above. Converting these three colors into a gamut's
 * linear-light space yields the columns of that gamut's LMS-to-linear-RGB
 * matrix, which is the only gamut-specific input the boundary solve needs.
 */
const LMS_BASIS_IN_OKLAB: [ number, number, number ][] = [
	[ 0.210454268309314, 1.9779985324311684, 0.0259040424655478 ],
	[ 0.7936177747023054, -2.42859224204858, 0.7827717124575296 ],
	[ -0.0040720430116193, 0.450593709617411, -0.8086757549230774 ],
];

/** Coefficients below this magnitude are treated as absent. */
const CUBIC_EPSILON = 1e-12;

/**
 * How far outside `[ 0, 1 ]` a channel may drift and still count as being on
 * the gamut surface, absorbing the rounding in the root solve.
 */
const SURFACE_EPSILON = 1e-9;

const lmsToLinearRGBCache = new WeakMap< ColorSpace, number[][] >();

function hasRGBCoords( space: ColorSpace | null ): boolean {
	return (
		!! space &&
		'r' in space.coords &&
		'g' in space.coords &&
		'b' in space.coords
	);
}

/**
 * A gamut boundary is only a cubic in chroma in linear light, so a
 * gamma-encoded space has to be resolved to its linear counterpart, which
 * `colorjs` models as the space's `base`. Both encodings share the same
 * `[ 0, 1 ]` bounds, because a transfer function maps that range onto itself.
 *
 * @param gamutSpace The gamut to resolve.
 */
function linearRGBSpace( gamutSpace: ColorSpace ): ColorSpace {
	if ( ! hasRGBCoords( gamutSpace ) ) {
		throw new TypeError(
			`Unsupported gamut "${ gamutSpace.id }": expected an RGB color space.`
		);
	}
	const { base } = gamutSpace;
	return base && hasRGBCoords( base ) ? base : gamutSpace;
}

/**
 * The matrix taking LMS cone values to a gamut's linear RGB channels, derived
 * by converting the LMS' basis through `colorjs` so that any RGB gamut works,
 * including ones with a non-D65 white point. Memoized per gamut: the three
 * conversions cost more than the boundary solve they feed, and the result
 * never changes.
 *
 * @param gamutSpace The gamut to derive the matrix for.
 */
function lmsToLinearRGB( gamutSpace: ColorSpace ): number[][] {
	const cached = lmsToLinearRGBCache.get( gamutSpace );
	if ( cached ) {
		return cached;
	}

	const linearSpace = linearRGBSpace( gamutSpace );
	const columns = LMS_BASIS_IN_OKLAB.map(
		( coords ) =>
			to( { space: OKLab, coords, alpha: 1 }, linearSpace ).coords
	);
	const matrix = [ 0, 1, 2 ].map( ( channel ) =>
		columns.map( ( column ) => column[ channel ] ?? 0 )
	);

	lmsToLinearRGBCache.set( gamutSpace, matrix );
	return matrix;
}

/**
 * Appends every strictly positive real root of `a·x³ + b·x² + c·x + d` to
 * `roots`.
 *
 * @param a     Cubic coefficient.
 * @param b     Quadratic coefficient.
 * @param c     Linear coefficient.
 * @param d     Constant term.
 * @param roots Collected roots, appended to in place.
 */
function collectPositiveRoots(
	a: number,
	b: number,
	c: number,
	d: number,
	roots: number[]
): void {
	const consider = ( root: number ) => {
		if ( root > CUBIC_EPSILON ) {
			roots.push( root );
		}
	};

	// Degenerate leading coefficients: fall back to the quadratic, then the
	// linear, case.
	if ( Math.abs( a ) < CUBIC_EPSILON ) {
		if ( Math.abs( b ) < CUBIC_EPSILON ) {
			if ( Math.abs( c ) > CUBIC_EPSILON ) {
				consider( -d / c );
			}
			return;
		}
		const discriminant = c * c - 4 * b * d;
		if ( discriminant >= 0 ) {
			const offset = Math.sqrt( discriminant );
			consider( ( -c + offset ) / ( 2 * b ) );
			consider( ( -c - offset ) / ( 2 * b ) );
		}
		return;
	}

	// Depress to `t³ + p·t + q`, where `x = t - b / (3·a)`.
	const bn = b / a;
	const cn = c / a;
	const dn = d / a;
	const p = cn - ( bn * bn ) / 3;
	const q = ( 2 * bn * bn * bn ) / 27 - ( bn * cn ) / 3 + dn;
	const shift = -bn / 3;
	const discriminant = ( q * q ) / 4 + ( p * p * p ) / 27;

	if ( discriminant > 0 ) {
		// A single real root.
		const offset = Math.sqrt( discriminant );
		consider(
			Math.cbrt( -q / 2 + offset ) + Math.cbrt( -q / 2 - offset ) + shift
		);
		return;
	}

	// Three real roots. The trigonometric form avoids complex arithmetic, and
	// degrades correctly to the repeated-root case when the discriminant is
	// zero.
	const radius = Math.sqrt( -( p * p * p ) / 27 );
	const angle =
		Math.acos( clampToUnit( radius === 0 ? 0 : -q / ( 2 * radius ) ) ) / 3;
	const scale = 2 * Math.cbrt( radius );
	for ( let k = 0; k < 3; k++ ) {
		consider( scale * Math.cos( angle + ( 2 * Math.PI * k ) / 3 ) + shift );
	}
}

function clampToUnit( x: number ): number {
	if ( x < -1 ) {
		return -1;
	}
	if ( x > 1 ) {
		return 1;
	}
	return x;
}

/**
 * Highest chroma that is still inside `gamutSpace` at a fixed OKLCH lightness
 * and hue, i.e. the outermost point where the ray leaving the achromatic axis
 * meets the gamut surface. Where the lightness and hue line up with a corner
 * of the RGB cube, that point is the corner itself.
 *
 * Chroma enters the OKLab pipeline linearly and is then cubed, so each linear
 * RGB channel is an exact cubic polynomial in chroma, and the ray can only
 * meet the surface at a root of one of those cubics against one of its bounds.
 * All the roots are solved in closed form and the outermost one lying on the
 * surface is returned.
 *
 * @param l          Lightness, in `[ 0, 1 ]`.
 * @param h          Hue, in degrees.
 * @param gamutSpace The gamut to stay inside.
 */
export function maxInGamutChromaAtLH(
	l: number,
	h: number,
	gamutSpace: ColorSpace
): number {
	// Both ends of the lightness axis admit no chroma at all.
	if ( l <= 0 || l >= 1 ) {
		return 0;
	}

	const hueRadians = ( h * Math.PI ) / 180;
	const cos = Math.cos( hueRadians );
	const sin = Math.sin( hueRadians );
	const [ kl, km, ks ] = OKLAB_AB_TO_LMS.map(
		( [ toA, toB ] ) => toA * cos + toB * sin
	);

	// channel( C ) = Σ w·( l + C·k )³, expanded into powers of C.
	const channels = lmsToLinearRGB( gamutSpace ).map( ( [ wl, wm, ws ] ) => [
		wl * kl ** 3 + wm * km ** 3 + ws * ks ** 3,
		3 * l * ( wl * kl ** 2 + wm * km ** 2 + ws * ks ** 2 ),
		3 * l * l * ( wl * kl + wm * km + ws * ks ),
		l ** 3 * ( wl + wm + ws ),
	] );

	const crossings: number[] = [];
	for ( const [ c3, c2, c1, c0 ] of channels ) {
		collectPositiveRoots( c3, c2, c1, c0, crossings );
		collectPositiveRoots( c3, c2, c1, c0 - 1, crossings );
	}
	crossings.sort( ( first, second ) => second - first );

	// A root only lies on the surface when every other channel is still within
	// its own bounds there.
	return (
		crossings.find( ( chroma ) =>
			channels.every( ( [ c3, c2, c1, c0 ] ) => {
				const value =
					( ( c3 * chroma + c2 ) * chroma + c1 ) * chroma + c0;
				return (
					value >= -SURFACE_EPSILON && value <= 1 + SURFACE_EPSILON
				);
			} )
		) ?? 0
	);
}
