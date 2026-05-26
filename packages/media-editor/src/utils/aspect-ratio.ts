const MAX_RATIO_PART = 20;
const SNAP_TOLERANCE = 0.005;

/**
 * Formats dimensions as a compact width:height aspect ratio.
 *
 * Snaps to the nearest small-integer ratio (a:b with both ≤ 20) when the
 * approximation is within tolerance, so off-spec resolutions like 1350×899
 * still read as "3:2" — matching the labels used by the aspect-ratio presets
 * in the same panel. Ratios that can't be approximated cleanly fall back to
 * a short decimal form. The search is run on the ≥1 form of the ratio so
 * portrait and landscape orientations of the same dimensions snap symmetrically.
 *
 * @param width  Width in pixels.
 * @param height Height in pixels.
 * @return A compact aspect ratio label, or undefined for invalid dimensions.
 */
export function formatAspectRatio(
	width: number,
	height: number
): string | undefined {
	if (
		! Number.isFinite( width ) ||
		! Number.isFinite( height ) ||
		width <= 0 ||
		height <= 0
	) {
		return undefined;
	}

	const landscape = width >= height;
	const r = landscape ? width / height : height / width;
	let bestA = 0;
	let bestB = 0;
	let bestErr = Infinity;
	for ( let b = 1; b <= MAX_RATIO_PART; b++ ) {
		const a = Math.round( r * b );
		if ( a < b || a > MAX_RATIO_PART ) {
			continue;
		}
		const err = Math.abs( r - a / b );
		if ( err < bestErr ) {
			bestErr = err;
			bestA = a;
			bestB = b;
		}
	}

	if ( bestErr <= SNAP_TOLERANCE ) {
		return landscape ? `${ bestA }:${ bestB }` : `${ bestB }:${ bestA }`;
	}

	const formatted = r.toFixed( 2 ).replace( /\.?0+$/, '' );
	return landscape ? `${ formatted }:1` : `1:${ formatted }`;
}
