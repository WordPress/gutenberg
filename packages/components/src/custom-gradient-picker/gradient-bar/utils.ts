/**
 * Internal dependencies
 */
import { MINIMUM_DISTANCE_BETWEEN_POINTS } from './constants';
import type { ControlPoint } from '../types';

/**
 * Clamps a number between 0 and 100.
 *
 * @param value Value to clamp.
 *
 * @return Value clamped between 0 and 100.
 */
export function clampPercent( value: number ) {
	return Math.max( 0, Math.min( 100, value ) );
}

/**
 * Check if a control point is overlapping with another.
 *
 * @param value        Array of control points.
 * @param initialIndex Index of the position to test.
 * @param newPosition  New position of the control point.
 * @param minDistance  Distance considered to be overlapping.
 *
 * @return True if the point is overlapping.
 */
export function isOverlapping(
	value: ControlPoint[],
	initialIndex: number,
	newPosition: number,
	minDistance: number = MINIMUM_DISTANCE_BETWEEN_POINTS
) {
	const initialPosition = value[ initialIndex ].position;
	const minPosition = Math.min( initialPosition, newPosition );
	const maxPosition = Math.max( initialPosition, newPosition );

	return value.some( ( { position }, index ) => {
		return (
			index !== initialIndex &&
			( Math.abs( position - newPosition ) < minDistance ||
				( minPosition < position && position < maxPosition ) )
		);
	} );
}

/**
 * Adds a control point from an array and returns the new array.
 *
 * @param points   Array of control points.
 * @param position Position to insert the new point.
 * @param color    Color to update the control point at index.
 *
 * @return New array of control points.
 */
export function addControlPoint(
	points: ControlPoint[],
	position: number,
	color: ControlPoint[ 'color' ]
) {
	const nextIndex = points.findIndex(
		( point ) => point.position > position
	);
	const newPoint = { color, position };
	const newPoints = points.slice();
	newPoints.splice( nextIndex - 1, 0, newPoint );
	return newPoints;
}

/**
 * Removes a control point from an array and returns the new array.
 *
 * @param points Array of control points.
 * @param index  Index to remove.
 *
 * @return New array of control points.
 */
export function removeControlPoint( points: ControlPoint[], index: number ) {
	return points.filter( ( _point, pointIndex ) => {
		return pointIndex !== index;
	} );
}
/**
 * Updates a control point from an array and returns the new array.
 *
 * @param points   Array of control points.
 * @param index    Index to update.
 * @param newPoint New control point to replace the index.
 *
 * @return New array of control points.
 */
export function updateControlPoint(
	points: ControlPoint[],
	index: number,
	newPoint: ControlPoint
) {
	const newValue = points.slice();
	newValue[ index ] = newPoint;
	return newValue;
}

/**
 * Updates the position of a control point from an array and returns the new array.
 *
 * @param points      Array of control points.
 * @param index       Index to update.
 * @param newPosition Position to move the control point at index.
 *
 * @return New array of control points.
 */
export function updateControlPointPosition(
	points: ControlPoint[],
	index: number,
	newPosition: ControlPoint[ 'position' ]
) {
	if ( isOverlapping( points, index, newPosition ) ) {
		return points;
	}
	const newPoint = {
		...points[ index ],
		position: newPosition,
	};
	return updateControlPoint( points, index, newPoint );
}

/**
 * Updates the position of a control point from an array and returns the new array.
 *
 * @param points   Array of control points.
 * @param index    Index to update.
 * @param newColor Color to update the control point at index.
 *
 * @return New array of control points.
 */
export function updateControlPointColor(
	points: ControlPoint[],
	index: number,
	newColor: ControlPoint[ 'color' ]
) {
	const newPoint = {
		...points[ index ],
		color: newColor,
	};
	return updateControlPoint( points, index, newPoint );
}

/**
 * Updates the position of a control point from an array and returns the new array.
 *
 * @param points   Array of control points.
 * @param position Position of the color stop.
 * @param newColor Color to update the control point at index.
 *
 * @return New array of control points.
 */
export function updateControlPointColorByPosition(
	points: ControlPoint[],
	position: ControlPoint[ 'position' ],
	newColor: ControlPoint[ 'color' ]
) {
	const index = points.findIndex( ( point ) => point.position === position );
	return updateControlPointColor( points, index, newColor );
}

/**
 * Gets the horizontal coordinate when dragging a control point with the mouse.
 *
 * @param mouseXcoordinate Horizontal coordinate of the mouse position.
 * @param containerElement Container for the gradient picker.
 *
 * @return Whole number percentage from the left.
 */
export function getHorizontalRelativeGradientPosition(
	mouseXcoordinate: number,
	containerElement: HTMLDivElement
): number;
export function getHorizontalRelativeGradientPosition(
	mouseXcoordinate: number,
	containerElement: null
): undefined;
export function getHorizontalRelativeGradientPosition(
	mouseXCoordinate: number,
	containerElement: HTMLDivElement | null
) {
	if ( ! containerElement ) {
		return;
	}
	const { x, width } = containerElement.getBoundingClientRect();
	const absolutePositionValue = mouseXCoordinate - x;
	return Math.round(
		clampPercent( ( absolutePositionValue * 100 ) / width )
	);
}
