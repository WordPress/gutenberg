/**
 * Internal dependencies
 */
import { MAX_ROTATION_OFFSET } from './constants';
import type { Flip } from './types';

const FINE_ROTATION_EPSILON = 1e-6;
/**
 * Distance to keep absolute rotations strictly inside the ±MAX boundary.
 *
 * Landing rotation exactly on a 90° midpoint (e.g., 45°, -45°, 135°) makes
 * the next render's `Math.round(rotation / 90) * 90` snap base flip, which
 * reverses the derived offset sign and lets the cropper spiral past its
 * intended ±MAX range on successive edits. A small pullback keeps the
 * offset stably representable in the same snap base.
 */
const FINE_ROTATION_BOUNDARY_EPSILON = 0.01;
const FINE_ROTATION_SAFE_MAX =
	MAX_ROTATION_OFFSET - FINE_ROTATION_BOUNDARY_EPSILON;

/**
 * Normalize the internal boundary pullback back to the advertised endpoint.
 *
 * The cropper stores ±44.99° instead of ±45° to keep snap-base derivation
 * stable, but the fine-rotation control should still read that state as the
 * public ±45° endpoint it committed.
 *
 * @param offset Signed fine-rotation offset in degrees.
 * @return Offset normalized for display and consumers.
 */
function normalizeOffsetForDisplay( offset: number ): number {
	const absOffset = Math.abs( offset );

	if ( absOffset >= FINE_ROTATION_SAFE_MAX - FINE_ROTATION_EPSILON ) {
		return Math.sign( offset ) * MAX_ROTATION_OFFSET;
	}

	return offset;
}

/**
 * Fine-rotation policy: discrete `±MAX_ROTATION_OFFSET` adjustment around the
 * current 90° snap, exposed to the advanced crop panel, the bottom toolbar
 * ruler, and any automation that needs to read or write the visual rotation
 * offset directly.
 *
 * `offset` is signed in viewport space: a positive offset rotates the framed
 * content clockwise on screen regardless of the underlying flip state. Use
 * `absoluteFromOffset` to convert back to the absolute angle the cropper
 * stores in `state.rotation`.
 */
export const fineRotation = {
	step: 0.5,
	min: -MAX_ROTATION_OFFSET,
	max: MAX_ROTATION_OFFSET,

	/**
	 * Visual rotation direction for the current flip state.
	 *
	 * Single-axis flips invert the apparent rotation direction; matching flips
	 * (none or both) leave it alone.
	 *
	 * @param flip Cropper flip state.
	 * @return 1 or -1.
	 */
	visualDirection( flip: Flip ): 1 | -1 {
		return flip.horizontal !== flip.vertical ? -1 : 1;
	},

	/**
	 * Read the current fine-rotation offset from an absolute rotation angle.
	 *
	 * @param rotation Absolute rotation in degrees from cropper state.
	 * @param flip     Cropper flip state.
	 * @return Signed offset in degrees relative to the nearest 90° snap.
	 */
	offsetFromState( rotation: number, flip: Flip ): number {
		const baseAngle = Math.round( rotation / 90 ) * 90;
		return normalizeOffsetForDisplay(
			( rotation - baseAngle ) * this.visualDirection( flip )
		);
	},

	/**
	 * Compute the absolute rotation angle that produces the given offset.
	 *
	 * The offset is pulled strictly inside the ±MAX boundary by a small
	 * epsilon before being applied. Without this, an exact-boundary commit
	 * lands `state.rotation` on a 90° midpoint where the snap-base derivation
	 * flips on the next render, causing subsequent edits to spiral past the
	 * intended range.
	 *
	 * @param rotation Current absolute rotation (used to derive the snap base).
	 * @param flip     Cropper flip state.
	 * @param offset   Signed offset in degrees in viewport space.
	 * @return Absolute rotation angle to pass to `setRotation`.
	 */
	absoluteFromOffset( rotation: number, flip: Flip, offset: number ): number {
		const baseAngle = Math.round( rotation / 90 ) * 90;
		const safeOffset = Math.max(
			-FINE_ROTATION_SAFE_MAX,
			Math.min( FINE_ROTATION_SAFE_MAX, offset )
		);
		return baseAngle + safeOffset * this.visualDirection( flip );
	},

	/**
	 * Clamp a candidate offset to the fine-rotation range, snapped to the
	 * commit step.
	 *
	 * @param value Candidate offset in degrees.
	 * @return Clamped, step-snapped offset.
	 */
	clamp( value: number ): number {
		const snapped = Math.round( value / this.step ) * this.step;
		return Math.max( this.min, Math.min( this.max, snapped ) );
	},

	/**
	 * Whether two offsets differ by more than the floating-point tolerance.
	 *
	 * @param a First offset.
	 * @param b Second offset.
	 * @return True when the offsets are meaningfully different.
	 */
	hasChanged( a: number, b: number ): boolean {
		return Math.abs( a - b ) >= FINE_ROTATION_EPSILON;
	},
} as const;
