/**
 * Internal dependencies
 */
import type { CropperState } from '../types';

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
 * because extreme finite numbers (`MAX_VALUE`, sub-normal denormals) can
 * still overflow downstream trig/matrix math even though the spec reports
 * them as finite.
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
	// overflow. Subnormals (e.g. Number.MIN_VALUE) pass `> 0` but make
	// division explode, so guard against them with Number.EPSILON.
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
		cropRect: {
			x: safeBoundedNumber( state.cropRect.x, 0 ),
			y: safeBoundedNumber( state.cropRect.y, 0 ),
			width: safeBoundedNumber( state.cropRect.width, 0 ),
			height: safeBoundedNumber( state.cropRect.height, 0 ),
		},
	};
}
