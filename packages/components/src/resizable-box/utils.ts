import {
	privateApis as domPrivateApis,
	type DOMPrivateApis,
} from '@wordpress/dom';
import { unlock } from '../lock-unlock';

export const getViewportLinearTransform: DOMPrivateApis[ 'getViewportLinearTransform' ] =
	unlock< DOMPrivateApis >( domPrivateApis ).getViewportLinearTransform;
export type LinearTransform = ReturnType< typeof getViewportLinearTransform >;

/**
 * Maps a pointer movement on screen into an element's own axes.
 *
 * @param matrix The element's screen transform.
 * @param x      Horizontal movement on screen.
 * @param y      Vertical movement on screen.
 *
 * @return The movement along the element's own axes.
 */
export function toLocalDelta(
	matrix: LinearTransform,
	x: number,
	y: number
): { x: number; y: number } {
	const determinant = matrix.a * matrix.d - matrix.b * matrix.c;
	if ( ! determinant ) {
		return { x, y };
	}
	return {
		x: ( matrix.d * x - matrix.c * y ) / determinant,
		y: ( matrix.a * y - matrix.b * x ) / determinant,
	};
}

export type HandleDirection =
	| 'top'
	| 'right'
	| 'bottom'
	| 'left'
	| 'topRight'
	| 'bottomRight'
	| 'bottomLeft'
	| 'topLeft';

// The way each handle points in the box's own axes, with y pointing down.
const HANDLE_VECTORS: Record< HandleDirection, [ number, number ] > = {
	top: [ 0, -1 ],
	right: [ 1, 0 ],
	bottom: [ 0, 1 ],
	left: [ -1, 0 ],
	topRight: [ 1, -1 ],
	bottomRight: [ 1, 1 ],
	bottomLeft: [ -1, 1 ],
	topLeft: [ -1, -1 ],
};

// Indexed by the handle's angle on screen, in steps of 45deg from the x axis.
const RESIZE_CURSORS = [
	'ew-resize',
	'nwse-resize',
	'ns-resize',
	'nesw-resize',
];

function getCursorIndex( x: number, y: number ) {
	const angle = ( Math.atan2( y, x ) * 180 ) / Math.PI;
	return ( ( Math.round( angle / 45 ) % 4 ) + 4 ) % 4;
}

/**
 * Returns the resize cursor nearest to the way a handle points on screen.
 *
 * @param matrix    The box's screen transform.
 * @param direction The handle.
 *
 * @return The cursor, or `undefined` when the handle's default cursor already
 * points the same way.
 */
export function getHandleCursor(
	matrix: LinearTransform,
	direction: HandleDirection
): string | undefined {
	const [ x, y ] = HANDLE_VECTORS[ direction ];
	const index = getCursorIndex(
		matrix.a * x + matrix.c * y,
		matrix.b * x + matrix.d * y
	);
	return index === getCursorIndex( x, y )
		? undefined
		: RESIZE_CURSORS[ index ];
}

/**
 * Returns how much the box's own x and y axes are stretched on screen.
 *
 * @param matrix The box's screen transform.
 *
 * @return The scale along each of the box's axes.
 */
export function getAxisScale( matrix: LinearTransform ): {
	x: number;
	y: number;
} {
	return {
		x: Math.hypot( matrix.a, matrix.b ),
		y: Math.hypot( matrix.c, matrix.d ),
	};
}

/**
 * Returns the way a handle points in the box's own axes.
 *
 * @param direction The handle.
 *
 * @return `-1`, `0` or `1` along each axis.
 */
export function getHandleVector( direction: HandleDirection ) {
	return HANDLE_VECTORS[ direction ];
}

export function isIdentity( { a, b, c, d }: LinearTransform ) {
	return a === 1 && b === 0 && c === 0 && d === 1;
}

/**
 * Returns how much a box must grow to bring its handle to the pointer.
 *
 * @param matrix    The box's screen transform.
 * @param direction The dragged handle.
 * @param offset    From the handle to the pointer, on screen.
 * @param offset.x  Horizontal offset.
 * @param offset.y  Vertical offset.
 * @param gain      How far the handle moves on screen per pixel of growth,
 *                  relative to what `matrix` predicts.
 *
 * @return The change in width and height.
 */
export function getResizeStep(
	matrix: LinearTransform,
	direction: HandleDirection,
	offset: { x: number; y: number },
	gain: number
): { width: number; height: number } {
	const [ x, y ] = getHandleVector( direction );
	const local = toLocalDelta( matrix, offset.x, offset.y );
	return {
		width: x ? ( x * local.x ) / gain : 0,
		height: y ? ( y * local.y ) / gain : 0,
	};
}

/**
 * Measures how far a handle moved on screen for a change in size, relative
 * to what `matrix` predicts. A transform origin at the box's centre, the
 * usual case, moves while the box grows, so the handle covers less ground.
 *
 * @param matrix            The box's screen transform.
 * @param direction         The dragged handle.
 * @param sizeChange        The change in width and height.
 * @param sizeChange.width  Change in width.
 * @param sizeChange.height Change in height.
 * @param handleMove        How far the handle moved on screen.
 * @param handleMove.x      Horizontal movement.
 * @param handleMove.y      Vertical movement.
 *
 * @return The gain, or `undefined` when the size barely changed.
 */
export function measureGain(
	matrix: LinearTransform,
	direction: HandleDirection,
	sizeChange: { width: number; height: number },
	handleMove: { x: number; y: number }
): number | undefined {
	const [ x, y ] = HANDLE_VECTORS[ direction ];
	const localX = x * sizeChange.width;
	const localY = y * sizeChange.height;
	const expectedX = matrix.a * localX + matrix.c * localY;
	const expectedY = matrix.b * localX + matrix.d * localY;
	const length = expectedX * expectedX + expectedY * expectedY;
	if ( length < 1 ) {
		return undefined;
	}
	return ( handleMove.x * expectedX + handleMove.y * expectedY ) / length;
}

const DOT_SCALE_PROPERTY = '--wp-components-resizable-box-handle-dot-scale';

function inverse( scale: number ) {
	return scale > 0.01 && Math.abs( scale - 1 ) > 0.001
		? Math.round( 10000 / scale ) / 10000
		: 1;
}

/**
 * Returns inline styles that turn each handle's cursor with the box and keep
 * the handles the same size on screen when the box is scaled.
 *
 * @param matrix The box's screen transform.
 *
 * @return Styles by handle, or `undefined` for an untransformed box.
 */
export function getTransformedHandleStyles(
	matrix: LinearTransform
): Record< HandleDirection, Record< string, string > > | undefined {
	if ( isIdentity( matrix ) ) {
		return undefined;
	}
	const scale = getAxisScale( matrix );
	const x = inverse( scale.x );
	const y = inverse( scale.y );
	const styles = {} as Record< HandleDirection, Record< string, string > >;
	for ( const direction of Object.keys(
		HANDLE_VECTORS
	) as HandleDirection[] ) {
		const style: Record< string, string > = {};
		const cursor = getHandleCursor( matrix, direction );
		if ( cursor ) {
			style.cursor = cursor;
		}
		if ( x !== 1 || y !== 1 ) {
			const [ vx, vy ] = HANDLE_VECTORS[ direction ];
			if ( vx && vy ) {
				style.scale = `${ x } ${ y }`;
			} else if ( vy ) {
				// A side handle only counter-scales across its length, so
				// its dot takes the rest.
				style.scale = `1 ${ y }`;
				style[ DOT_SCALE_PROPERTY ] = `${ x } 1`;
			} else {
				style.scale = `${ x } 1`;
				style[ DOT_SCALE_PROPERTY ] = `1 ${ y }`;
			}
		}
		styles[ direction ] = style;
	}
	return styles;
}
