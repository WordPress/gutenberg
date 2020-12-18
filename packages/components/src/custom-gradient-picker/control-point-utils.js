/**
 * Control point for the gradient bar.
 *
 * @typedef {Object} ControlPoint
 * @property {string} color    Color of the control point.
 * @property {number} position Integer position of the control point as a percentage.
 */

/**
 * Color as parsed from the gradient by gradient-parser.
 *
 * @typedef {Object} Color
 * @property {string} r   Red component.
 * @property {string} g   Green component.
 * @property {string} b   Green component.
 * @property {string} [a] Optional alpha component.
 */

/**
 * Adds an amount to a percentage, clamped to [0,100].
 *
 * @param {number} position Integer representing the percentage.
 * @param {number} amount   Integer amount to add to that percentage.
 *
 * @return {number} Clamped percentage.
 */
export function addPositionClamped( position, amount ) {
	return Math.max( 0, Math.min( 100, position + amount ) );
}

/**
 * Check if a control point is overlapping with another.
 *
 * @param {ControlPoint[]} value        Array of control points.
 * @param {number}         initialIndex Index of the position to test.
 * @param {number}         newPosition  New position of the control point.
 * @param {number}         minDistance  Distance considered to be overlapping.
 *
 * @return {boolean} True if the point is overlapping.
 */
export function isOverlapping(
	value,
	initialIndex,
	newPosition,
	minDistance = 0
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
 * @param {ControlPoint[]} points   Array of control points.
 * @param {number}         position Position to insert the new point.
 * @param {Color}          color    Color to update the control point at index.
 *
 * @return {ControlPoint[]} New array of control points.
 */
export function addControlPoint( points, position, color ) {
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
 * @param {ControlPoint[]} points Array of control points.
 * @param {number}         index  Index to remove.
 *
 * @return {ControlPoint[]} New array of control points.
 */
export function removeControlPoint( points, index ) {
	return points.filter( ( point, pointIndex ) => {
		return pointIndex !== index;
	} );
}

/**
 * Updates a control point from an array and returns the new array.
 *
 * @param {ControlPoint[]} points   Array of control points.
 * @param {number}         index    Index to update.
 * @param {ControlPoint[]} newPoint New control point to replace the index.
 *
 * @return {ControlPoint[]} New array of control points.
 */
export function updateControlPoint( points, index, newPoint ) {
	const newValue = points.slice();
	newValue[ index ] = newPoint;
	return newValue;
}

/**
 * Updates the position of a control point from an array and returns the new array.
 *
 * @param {ControlPoint[]} points      Array of control points.
 * @param {number}         index       Index to update.
 * @param {number}         newPosition Position to move the control point at index.
 *
 * @return {ControlPoint[]} New array of control points.
 */
export function updateControlPointPosition( points, index, newPosition ) {
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
 * @param {ControlPoint[]} points   Array of control points.
 * @param {number}         index    Index to update.
 * @param {Color}          newColor Color to update the control point at index.
 *
 * @return {ControlPoint[]} New array of control points.
 */
export function updateControlPointColor( points, index, newColor ) {
	const newPoint = {
		...points[ index ],
		color: newColor,
	};
	return updateControlPoint( points, index, newPoint );
}

/**
 * Updates the position of a control point from an array and returns the new array.
 *
 * @param {ControlPoint[]} points   Array of control points.
 * @param {number}         position Position of the color stop.
 * @param {string}         newColor Color to update the control point at index.
 *
 * @return {ControlPoint[]} New array of control points.
 */
export function updateControlPointColorByPosition(
	points,
	position,
	newColor
) {
	const index = points.findIndex( ( point ) => point.position === position );
	return updateControlPointColor( points, index, newColor );
}
