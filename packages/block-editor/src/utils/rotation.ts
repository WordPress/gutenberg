import type { CSSProperties } from 'react';
import { cleanEmptyObject, isPlainObject } from './object';
import {
	DEFAULT_BLOCK_STYLE_STATE,
	getStyleForState,
	hasViewportBlockStyleState,
	setStyleForState,
} from '../hooks/block-style-state';

type BlockStyle = Record< string, any >;

interface BlockStyleState {
	viewport?: string;
	pseudo?: string;
}

/**
 * Wraps an angle into the (-180, 180] range used to store rotation.
 *
 * @param angle Angle in degrees.
 *
 * @return The equivalent angle in (-180, 180].
 */
export function normalizeAngle( angle: number ): number {
	// Only add or remove a turn when needed, so that angles which are already
	// in range come back exactly as they are.
	let normalized = angle % 360;
	if ( normalized > 180 ) {
		normalized -= 360;
	} else if ( normalized <= -180 ) {
		normalized += 360;
	}
	// Avoid returning -0.
	return normalized || 0;
}

/**
 * Rounds an angle to two decimals the way PHP's `round()` does: halves are
 * rounded away from zero after removing floating point noise, so 1.005 is
 * 1.01 and -12.345 is -12.35.
 *
 * @param angle Angle in degrees.
 *
 * @return The angle rounded to two decimals.
 */
export function roundAngle( angle: number ): number {
	return (
		( Math.sign( angle ) *
			Math.round(
				Number( ( Math.abs( angle ) * 100 ).toPrecision( 15 ) )
			) ) /
		100
	);
}

// A single CSS angle, as the transform block support stores it in
// `style.transform.rotate`. Mirror of `WP_Style_Engine::VALID_ANGLE_PATTERN`
// in PHP, with the number and the unit captured.
const ANGLE_PATTERN =
	/^(?:([+-]?(?:\d+(?:\.\d+)?|\.\d+))(deg|grad|rad|turn)|0)$/i;

const DEGREES_PER_UNIT: Record< string, number > = {
	deg: 1,
	grad: 0.9,
	rad: 180 / Math.PI,
	turn: 360,
};

/**
 * Returns a block style attribute when it is an object, which is the only
 * kind of style attribute rotation is read from or written to.
 *
 * @param style Block style attribute.
 *
 * @return The style attribute, or undefined when it is not an object.
 */
export function getStyleObject( style: unknown ): BlockStyle | undefined {
	return isPlainObject( style ) ? style : undefined;
}

/**
 * Reads a rotation in degrees from the value the transform block support
 * stores, a single CSS angle such as `45deg` or `0.25turn`. A number is taken
 * as degrees. Anything else, such as a list of angles or a `calc()`, is
 * ignored, as the style engine ignores it.
 *
 * @param value Stored rotation.
 *
 * @return The rotation in (-180, 180], rounded to two decimals, or undefined.
 */
export function getRotateValue( value: unknown ): number | undefined {
	let angle: number | undefined;
	if ( typeof value === 'number' ) {
		angle = value;
	} else if ( typeof value === 'string' ) {
		const match = ANGLE_PATTERN.exec( value.trim() );
		if ( ! match ) {
			return undefined;
		}
		angle = match[ 1 ]
			? Number( match[ 1 ] ) *
				DEGREES_PER_UNIT[ match[ 2 ].toLowerCase() ]
			: 0;
	}
	if ( angle === undefined || ! Number.isFinite( angle ) ) {
		return undefined;
	}
	return normalizeAngle( roundAngle( angle ) );
}

/**
 * Formats a rotation in degrees as the CSS angle the transform block support
 * stores.
 *
 * @param angle Rotation in degrees.
 *
 * @return The angle, such as `45deg`.
 */
export function toCSSAngle( angle: number ): string {
	return `${ angle }deg`;
}

/**
 * Returns the state that holds rotation for a selected style state. Rotation
 * is stored per viewport only, so a pseudo state such as `:hover` is ignored.
 *
 * @param selectedState Selected block style state.
 *
 * @return The style state rotation is stored in.
 */
function getRotateState( selectedState: BlockStyleState ): BlockStyleState {
	return {
		viewport: hasViewportBlockStyleState( selectedState )
			? selectedState.viewport
			: DEFAULT_BLOCK_STYLE_STATE.viewport,
		pseudo: DEFAULT_BLOCK_STYLE_STATE.pseudo,
	};
}

/**
 * Returns the styles of a block for the state rotation is stored in.
 *
 * @param style         Block style attribute.
 * @param selectedState Selected block style state.
 *
 * @return The styles of that state, if any.
 */
export function getRotateStateStyle(
	style: BlockStyle | undefined,
	selectedState: BlockStyleState
): BlockStyle | undefined {
	return getStyleObject(
		getStyleForState(
			getStyleObject( style ) ?? {},
			getRotateState( selectedState )
		)
	);
}

/**
 * Returns the rotation a block has in a style state: the viewport's own
 * rotation when it sets one, otherwise the default rotation.
 *
 * @param style         Block style attribute.
 * @param selectedState Selected block style state.
 *
 * @return The rotation in degrees, in (-180, 180]. 0 when not rotated.
 */
export function getRotateForState(
	style: BlockStyle | undefined,
	selectedState: BlockStyleState
): number {
	const defaultRotate =
		getRotateValue( getStyleObject( style )?.transform?.rotate ) ?? 0;
	if ( ! hasViewportBlockStyleState( selectedState ) ) {
		return defaultRotate;
	}
	return (
		getRotateValue(
			getRotateStateStyle( style, selectedState )?.transform?.rotate
		) ?? defaultRotate
	);
}

/**
 * Returns a block style attribute with the rotation of a style state set, in
 * `transform.rotate`, where the transform block support reads it.
 *
 * In the default state, no rotation is stored as no value. In a viewport
 * state, `0deg` is kept, because it undoes the default rotation on that
 * viewport. An undefined angle removes the state's rotation.
 *
 * @param style         Block style attribute.
 * @param angle         Rotation in degrees.
 * @param selectedState Selected block style state.
 *
 * @return The updated block style attribute.
 *
 * @example
 * ```js
 * setAttributes( {
 * 	style: getUpdatedRotateStyle( attributes.style, 30, { viewport: '@mobile' } ),
 * } );
 * ```
 */
export function getUpdatedRotateStyle(
	style: BlockStyle | undefined,
	angle: number | undefined,
	selectedState: BlockStyleState
): BlockStyle | undefined {
	const baseStyle = getStyleObject( style );
	const rotateState = getRotateState( selectedState );
	const isViewportState = hasViewportBlockStyleState( rotateState );
	let rotate = getRotateValue( angle );
	if ( rotate === 0 && ! isViewportState ) {
		rotate = undefined;
	}
	const withRotate = ( stateStyle: BlockStyle | undefined ): BlockStyle => ( {
		...stateStyle,
		transform: cleanEmptyObject( {
			...getStyleObject( stateStyle?.transform ),
			rotate: rotate === undefined ? undefined : toCSSAngle( rotate ),
		} ),
	} );

	if ( ! isViewportState ) {
		return cleanEmptyObject( withRotate( baseStyle ) );
	}

	return setStyleForState(
		baseStyle ?? {},
		rotateState,
		withRotate( getRotateStateStyle( baseStyle, rotateState ) )
	);
}

/** A rectangle, in pixels. */
export interface PixelRect {
	left: number;
	top: number;
	right: number;
	bottom: number;
}

/** The positions of a block's center and of the pointer, in pixels. */
interface PointerPosition {
	/** Horizontal position of the block's center. */
	centerX: number;
	/** Vertical position of the block's center. */
	centerY: number;
	/** Horizontal position of the pointer. */
	pointerX: number;
	/** Vertical position of the pointer. */
	pointerY: number;
}

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
 * @param angle        Angle in degrees.
 * @param options
 * @param options.snap Whether to pull towards multiples of 15°.
 *
 * @return The snapped angle in (-180, 180].
 */
export function snapAngle(
	angle: number,
	{ snap = true }: { snap?: boolean } = {}
): number {
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
 * @param options
 * @param options.centerX  Horizontal position of the block's center.
 * @param options.centerY  Vertical position of the block's center.
 * @param options.pointerX Horizontal position of the pointer.
 * @param options.pointerY Vertical position of the pointer.
 *
 * @return The direction in degrees, in [-180, 180].
 */
export function getPointerAngle( {
	centerX,
	centerY,
	pointerX,
	pointerY,
}: PointerPosition ): number {
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
 * @param options
 * @param options.centerX  Horizontal position of the block's center.
 * @param options.centerY  Vertical position of the block's center.
 * @param options.pointerX Horizontal position of the pointer.
 * @param options.pointerY Vertical position of the pointer.
 * @param options.offset   Degrees added to the pointer's direction.
 * @param options.snap     Whether to pull towards multiples of 15°.
 *
 * @return The rotation in degrees, in (-180, 180].
 */
export function getRotationFromPointer( {
	centerX,
	centerY,
	pointerX,
	pointerY,
	offset = 0,
	snap = true,
}: PointerPosition & {
	offset?: number;
	snap?: boolean;
} ): number {
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
 * @param options
 * @param options.width  Unrotated width of the element.
 * @param options.height Unrotated height of the element.
 * @param options.angle  Rotation in degrees.
 *
 * @return Style properties for the overlay, or undefined when not rotated.
 */
export function getRotatedOverlayStyle( {
	width,
	height,
	angle,
}: {
	width: number;
	height: number;
	angle: number;
} ): CSSProperties | undefined {
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
 * A corner of a block in its own frame: `x` is -1 for its left edge and 1 for
 * its right edge, and `y` is -1 for its top edge and 1 for its bottom edge.
 */
export interface Corner {
	x: number;
	y: number;
}

// Sines and cosines this close to 0 count as 0, so that the corners of a
// level edge count as level.
const EPSILON = 1e-9;

function getSign( value: number ): number {
	if ( Math.abs( value ) < EPSILON ) {
		return 0;
	}
	return value > 0 ? 1 : -1;
}

/**
 * Gets the lowest corner of a block rotated around its center, on screen.
 * When two corners are equally low, on a level bottom edge, it is the one on
 * the right. The lowest corner only depends on the angle, not on the block's
 * size.
 *
 * @param angle Rotation in degrees.
 *
 * @return The corner in the block's own frame: `x` is -1 for its left edge and
 *         1 for its right edge, and `y` is -1 for its top edge and 1 for its
 *         bottom edge.
 */
export function getLowestCorner( angle: number ): Corner {
	const radians = ( angle * Math.PI ) / 180;
	const sin = getSign( Math.sin( radians ) );
	const cos = getSign( Math.cos( radians ) );
	// The lowest corner is on the side of the sine across the block and of the
	// cosine along it. On a level edge, one of them is 0, and the corner on
	// the right of the screen is picked instead.
	if ( sin === 0 ) {
		return { x: cos, y: cos };
	}
	if ( cos === 0 ) {
		return { x: sin, y: -sin };
	}
	return { x: sin, y: cos };
}

/**
 * Gets the style that places an element upright under a corner of a rotated
 * block, from inside an overlay that turns with the block (see
 * `getRotatedOverlayStyle`).
 *
 * The corner is at a fixed place in the overlay, so the element follows it
 * while the block turns. Its top-left corner is placed a gap below the block's
 * corner on screen, and it turns back by the block's angle around that point
 * and moves left by its own width, so that it is upright with its top-right
 * corner there.
 *
 * @param angle  Rotation of the overlay in degrees.
 * @param corner The corner, as returned by `getLowestCorner`.
 * @param gap    Space between the corner and the element, in pixels.
 *
 * @return Style properties for the element.
 */
export function getCornerToolbarStyle(
	angle: number,
	corner: Corner,
	gap: number
): CSSProperties {
	const radians = ( angle * Math.PI ) / 180;
	const round = ( value: number ) => Math.round( value * 10000 ) / 10000;
	// The gap points down the screen, which is turned back by the block's
	// angle in the overlay.
	const gapX = round( Math.sin( radians ) * gap );
	const gapY = round( Math.cos( radians ) * gap );
	return {
		left: `calc(${ ( ( corner.x + 1 ) / 2 ) * 100 }% + ${ gapX }px)`,
		top: `calc(${ ( ( corner.y + 1 ) / 2 ) * 100 }% + ${ gapY }px)`,
		transformOrigin: '0 0',
		transform: `rotate(${ -angle }deg) translateX(-100%)`,
	};
}

/**
 * Gets the bounding box of a rectangle rotated around its center.
 *
 * @param rect  The unrotated rectangle.
 * @param angle Rotation in degrees.
 *
 * @return The bounding box, around the same center.
 */
export function getRotatedBoundingRect(
	rect: PixelRect,
	angle: number | undefined
): PixelRect {
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
