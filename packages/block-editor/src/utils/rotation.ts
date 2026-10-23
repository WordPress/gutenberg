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
