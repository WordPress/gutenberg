import { normalizeAngle } from '../../utils/rotation';

// Rotation snaps to multiples of this many degrees...
const SNAP_STEP = 15;
// ...when it is within this many degrees of one.
const SNAP_THRESHOLD = 5;
// Angles this close to 0 count as no rotation.
const DEAD_ZONE = 2;

/**
 * Snaps an angle the way the rotate handle does: whole degrees, a pull towards
 * multiples of 15°, and a dead zone around 0.
 *
 * @param {number}  angle        Angle in degrees.
 * @param {Object}  options
 * @param {boolean} options.snap Whether to pull towards multiples of 15°.
 *
 * @return {number} The snapped angle in (-180, 180].
 */
export function snapAngle( angle, { snap = true } = {} ) {
	let snapped = angle;
	if ( snap ) {
		const nearestStep = Math.round( angle / SNAP_STEP ) * SNAP_STEP;
		if ( Math.abs( angle - nearestStep ) < SNAP_THRESHOLD ) {
			snapped = nearestStep;
		}
	}
	snapped = normalizeAngle( Math.round( snapped ) );
	if ( Math.abs( snapped ) < DEAD_ZONE ) {
		return 0;
	}
	return snapped;
}

/**
 * Works out the rotation of a block from where the rotate handle is being
 * dragged. The handle sits below the block, so a pointer straight below the
 * block's center is 0°, and moving it clockwise around the center rotates the
 * block clockwise.
 *
 * @param {Object}  options
 * @param {number}  options.centerX  Horizontal position of the block's center.
 * @param {number}  options.centerY  Vertical position of the block's center.
 * @param {number}  options.pointerX Horizontal position of the pointer.
 * @param {number}  options.pointerY Vertical position of the pointer.
 * @param {boolean} options.snap     Whether to pull towards multiples of 15°.
 *
 * @return {number} The rotation in degrees, in (-180, 180].
 */
export function getRotationFromPointer( {
	centerX,
	centerY,
	pointerX,
	pointerY,
	snap = true,
} ) {
	const angle =
		( -Math.atan2( pointerX - centerX, pointerY - centerY ) * 180 ) /
		Math.PI;
	return snapAngle( angle, { snap } );
}

/**
 * Gets the transform that places an overlay over a rotated element.
 *
 * Block popovers are positioned at the top-left corner of the element's
 * bounding box, which grows when the element is rotated. The overlay keeps the
 * element's unrotated size, so it is moved to the center of the bounding box
 * and rotated by the same angle.
 *
 * @param {Object} options
 * @param {number} options.width  Unrotated width of the element.
 * @param {number} options.height Unrotated height of the element.
 * @param {number} options.angle  Rotation in degrees.
 *
 * @return {Object|undefined} Style properties for the overlay, or undefined when not rotated.
 */
export function getRotatedOverlayStyle( { width, height, angle } ) {
	if ( ! angle ) {
		return undefined;
	}
	const radians = ( angle * Math.PI ) / 180;
	const cos = Math.abs( Math.cos( radians ) );
	const sin = Math.abs( Math.sin( radians ) );
	const boundingWidth = width * cos + height * sin;
	const boundingHeight = width * sin + height * cos;
	const x = Math.round( ( ( boundingWidth - width ) / 2 ) * 100 ) / 100;
	const y = Math.round( ( ( boundingHeight - height ) / 2 ) * 100 ) / 100;
	return {
		transform: `translate(${ x }px, ${ y }px) rotate(${ angle }deg)`,
		transformOrigin: 'center',
	};
}
