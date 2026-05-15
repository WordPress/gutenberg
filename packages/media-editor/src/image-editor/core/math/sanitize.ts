/**
 * Internal dependencies
 */
import type { CropperState, NormalizedRect, Size } from '../types';

/**
 * Magnitude beyond which any cropper-math input is treated as corrupt.
 * Picks a value well above any realistic image/rotation/zoom/pan but far
 * below `Number.MAX_VALUE`, so multiplications inside trig and matrix code
 * can't overflow to `Infinity`.
 */
const MAX_SAFE_MAGNITUDE = 1e6;

/**
 * Returns `value` if it's finite and within `[-MAX_SAFE_MAGNITUDE,
 * MAX_SAFE_MAGNITUDE]`, otherwise `fallback`. Stricter than `Number.isFinite`
 * because extreme finite magnitudes (e.g. `Number.MAX_VALUE`) overflow
 * downstream trig/matrix math even though the spec reports them as finite.
 *
 * Note: sub-normal denormals (e.g. `Number.MIN_VALUE`) are accepted by this
 * function — they don't overflow on their own. Protection against divisions
 * by sub-normal values lives in `sanitizeCropperState`'s zoom guard.
 *
 * @param value    The candidate value.
 * @param fallback The replacement to return when `value` is unsafe.
 * @return Either `value` or `fallback`.
 */
export function safeBoundedNumber( value: number, fallback: number ): number {
	if ( ! Number.isFinite( value ) ) {
		return fallback;
	}
	if ( Math.abs( value ) > MAX_SAFE_MAGNITUDE ) {
		return fallback;
	}
	return value;
}

/**
 * Returns `true` when `value` is finite and within `[-MAX_SAFE_MAGNITUDE,
 * MAX_SAFE_MAGNITUDE]`. The predicate companion to {@link safeBoundedNumber}
 * for callers that need to short-circuit rather than substitute a fallback.
 *
 * @param value The candidate value.
 * @return Whether `value` is safe to use in math.
 */
export function isSafeNumber( value: number ): boolean {
	return Number.isFinite( value ) && Math.abs( value ) <= MAX_SAFE_MAGNITUDE;
}

/**
 * Returns `true` when both dimensions are finite, strictly positive, and
 * within the safe magnitude range. Use this to short-circuit math that
 * would otherwise divide by zero, produce `Infinity` from large dims, or
 * propagate `NaN`.
 *
 * @param size The size to check.
 * @return Whether `size` is safe to use in math.
 */
export function isValidSize( size: Size ): boolean {
	return (
		Number.isFinite( size.width ) &&
		Number.isFinite( size.height ) &&
		size.width > 0 &&
		size.height > 0 &&
		size.width <= MAX_SAFE_MAGNITUDE &&
		size.height <= MAX_SAFE_MAGNITUDE
	);
}

/**
 * Returns a copy of `rect` with every numeric field replaced by a safe
 * value via {@link safeBoundedNumber}. Returns the same reference when no
 * field needed substitution so callers can keep their reference-equality
 * short-circuits intact for clean inputs.
 *
 * @param rect The rect to sanitize.
 * @return A rect with all numeric fields finite.
 */
export function sanitizeRect( rect: NormalizedRect ): NormalizedRect {
	const x = safeBoundedNumber( rect.x, 0 );
	const y = safeBoundedNumber( rect.y, 0 );
	const width = safeBoundedNumber( rect.width, 0 );
	const height = safeBoundedNumber( rect.height, 0 );
	if (
		x === rect.x &&
		y === rect.y &&
		width === rect.width &&
		height === rect.height
	) {
		return rect;
	}
	return { x, y, width, height };
}

/**
 * Returns a copy of `state` with any non-finite numeric fields replaced by
 * safe defaults. The reducer already normalizes these on every action, so
 * downstream math layers can call this as defense-in-depth without changing
 * behavior under normal flows.
 *
 * @param state The cropper state to sanitize.
 * @return A cropper state with all numeric fields finite.
 */
export function sanitizeCropperState( state: CropperState ): CropperState {
	const zoom = safeBoundedNumber( state.zoom, 1 );
	const baseZoom = safeBoundedNumber( state.baseZoom, 1 );
	// Zoom must be strictly positive AND large enough that 1/zoom doesn't
	// overflow. Sub-normals (e.g. Number.MIN_VALUE) pass `> 0` but make
	// division explode, so guard against them with Number.EPSILON.
	// Note: `state.image` is intentionally not cloned here. The math layer
	// receives image dimensions as a separate `imageSize` argument, so the
	// `state.image` numeric fields don't feed into any math we need to defend.
	// Sanitizing them would force a new image object every call and break
	// reference-equality optimizations the reducer relies on.
	return {
		...state,
		pan: {
			x: safeBoundedNumber( state.pan.x, 0 ),
			y: safeBoundedNumber( state.pan.y, 0 ),
		},
		zoom: zoom >= Number.EPSILON ? zoom : 1,
		rotation: safeBoundedNumber( state.rotation, 0 ),
		basePan: {
			x: safeBoundedNumber( state.basePan.x, 0 ),
			y: safeBoundedNumber( state.basePan.y, 0 ),
		},
		baseZoom: baseZoom >= Number.EPSILON ? baseZoom : 1,
		baseRotation: safeBoundedNumber( state.baseRotation, 0 ),
		cropRect: sanitizeRect( state.cropRect ),
	};
}
