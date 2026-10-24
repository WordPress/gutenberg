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

/**
 * Converts a stored rotation to the [0, 360) range used by `AnglePickerControl`.
 *
 * @param rotate Stored rotation in degrees.
 *
 * @return The angle in [0, 360).
 */
export function toPickerAngle( rotate: number | undefined ): number {
	return ( ( ( rotate ?? 0 ) % 360 ) + 360 ) % 360;
}

/**
 * Converts an `AnglePickerControl` value to a stored rotation.
 *
 * @param value Angle in degrees, in [0, 360].
 *
 * @return The rotation in (-180, 180], rounded to two decimals.
 */
export function fromPickerAngle( value: number | string | undefined ): number {
	const angle = Number( value );
	return Number.isFinite( angle ) ? normalizeAngle( roundAngle( angle ) ) : 0;
}

// A number in decimal notation, as PHP's `is_numeric()` accepts it. Hex,
// binary and octal strings such as `0x10`, which `Number()` would read, are
// not rotations.
const DECIMAL_NUMBER_PATTERN = /^\s*[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?\s*$/i;

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
 * Reads a stored rotation, which is a number of degrees. Anything that is not
 * a finite number, or a string holding one in decimal notation, is ignored.
 * Matches `gutenberg_get_rotate_value()` in PHP.
 *
 * @param value Stored rotation.
 *
 * @return The rotation in (-180, 180], rounded to two decimals, or undefined.
 */
export function getRotateValue( value: unknown ): number | undefined {
	const angle =
		typeof value === 'string' && DECIMAL_NUMBER_PATTERN.test( value )
			? Number( value )
			: value;
	if ( typeof angle !== 'number' || ! Number.isFinite( angle ) ) {
		return undefined;
	}
	return normalizeAngle( roundAngle( angle ) );
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
		getRotateValue( getStyleObject( style )?.rotate ) ?? 0;
	if ( ! hasViewportBlockStyleState( selectedState ) ) {
		return defaultRotate;
	}
	return (
		getRotateValue( getRotateStateStyle( style, selectedState )?.rotate ) ??
		defaultRotate
	);
}

/**
 * Returns a block style attribute with the rotation of a style state set.
 *
 * In the default state, no rotation is stored as no value. In a viewport
 * state, 0 is kept, because it undoes the default rotation on that viewport.
 * An undefined angle removes the state's rotation.
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

	if ( ! isViewportState ) {
		return cleanEmptyObject( { ...baseStyle, rotate } );
	}

	return setStyleForState( baseStyle ?? {}, rotateState, {
		...getRotateStateStyle( baseStyle, rotateState ),
		rotate,
	} );
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
