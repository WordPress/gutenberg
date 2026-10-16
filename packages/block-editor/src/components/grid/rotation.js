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
 * Gets the direction of the pointer from the center of a block, in degrees.
 * Straight below the center is 0°, and the angle grows clockwise.
 *
 * @param {Object} options
 * @param {number} options.centerX  Horizontal position of the block's center.
 * @param {number} options.centerY  Vertical position of the block's center.
 * @param {number} options.pointerX Horizontal position of the pointer.
 * @param {number} options.pointerY Vertical position of the pointer.
 *
 * @return {number} The direction in degrees, in [-180, 180].
 */
export function getPointerAngle( { centerX, centerY, pointerX, pointerY } ) {
	return (
		( -Math.atan2( pointerX - centerX, pointerY - centerY ) * 180 ) /
		Math.PI
	);
}

/**
 * Works out the rotation of a block from where the rotate handle is being
 * dragged. Moving the pointer clockwise around the block's center rotates the
 * block clockwise.
 *
 * The offset is the difference between the block's rotation and the
 * pointer's direction when the drag started. With it, the block turns by as
 * much as the pointer does, wherever the handle is, rather than jumping to
 * the pointer's direction.
 *
 * @param {Object}  options
 * @param {number}  options.centerX  Horizontal position of the block's center.
 * @param {number}  options.centerY  Vertical position of the block's center.
 * @param {number}  options.pointerX Horizontal position of the pointer.
 * @param {number}  options.pointerY Vertical position of the pointer.
 * @param {number}  options.offset   Degrees added to the pointer's direction.
 * @param {boolean} options.snap     Whether to pull towards multiples of 15°.
 *
 * @return {number} The rotation in degrees, in (-180, 180].
 */
export function getRotationFromPointer( {
	centerX,
	centerY,
	pointerX,
	pointerY,
	offset = 0,
	snap = true,
} ) {
	const angle =
		getPointerAngle( { centerX, centerY, pointerX, pointerY } ) + offset;
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

/**
 * Gets the style that places an element under the bottom right corner of a
 * rotated block's bounding box, upright, from inside an overlay that turns with
 * the block (see `getRotatedOverlayStyle`).
 *
 * The corner's position in the overlay depends on both the overlay's width and
 * height, so the overlay must be a size container: the position is given in
 * `cqw` and `cqh` units, and follows the overlay's size without measuring it.
 * The element turns back by the same angle around its top-left corner, and is
 * moved left by its own width, so that its top-right corner is at the point.
 *
 * @param {number} angle Rotation of the overlay in degrees.
 * @param {number} gap   Space between the bounding box and the element, in pixels.
 *
 * @return {Object} Style properties for the element.
 */
export function getBoundingBoxCornerStyle( angle, gap ) {
	const radians = ( angle * Math.PI ) / 180;
	const cos = Math.cos( radians );
	const sin = Math.sin( radians );
	const absCos = Math.abs( cos );
	const absSin = Math.abs( sin );
	const round = ( value ) => Math.round( value * 10000 ) / 10000;
	// The corner is half the bounding box's size from the center, turned back
	// into the overlay's frame. Each term is a share of the overlay's width or
	// height, or of the gap.
	const left = [
		round( ( ( 1 + cos * absCos + sin * absSin ) / 2 ) * 100 ),
		round( ( ( cos * absSin + sin * absCos ) / 2 ) * 100 ),
		round( sin * gap ),
	];
	const top = [
		round( ( ( cos * absSin - sin * absCos ) / 2 ) * 100 ),
		round( ( ( 1 + cos * absCos - sin * absSin ) / 2 ) * 100 ),
		round( cos * gap ),
	];
	const toCalc = ( [ width, height, pixels ] ) =>
		`calc(${ width }cqw + ${ height }cqh + ${ pixels }px)`;
	return {
		left: toCalc( left ),
		top: toCalc( top ),
		transformOrigin: '0 0',
		transform: `rotate(${ -angle }deg) translateX(-100%)`,
	};
}

/**
 * Gets the bounding box of a rectangle rotated around its center.
 *
 * @param {{left: number, top: number, right: number, bottom: number}} rect  The unrotated rectangle.
 * @param {number}                                                     angle Rotation in degrees.
 *
 * @return {{left: number, top: number, right: number, bottom: number}} The bounding box, around the same center.
 */
export function getRotatedBoundingRect( rect, angle ) {
	if ( ! angle ) {
		return rect;
	}
	const radians = ( angle * Math.PI ) / 180;
	const cos = Math.abs( Math.cos( radians ) );
	const sin = Math.abs( Math.sin( radians ) );
	const width = rect.right - rect.left;
	const height = rect.bottom - rect.top;
	const halfWidth = ( width * cos + height * sin ) / 2;
	const halfHeight = ( width * sin + height * cos ) / 2;
	const centerX = ( rect.left + rect.right ) / 2;
	const centerY = ( rect.top + rect.bottom ) / 2;
	return {
		left: centerX - halfWidth,
		top: centerY - halfHeight,
		right: centerX + halfWidth,
		bottom: centerY + halfHeight,
	};
}
