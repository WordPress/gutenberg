/**
 * A string representing the name of an edge.
 *
 * @typedef {'top'|'right'|'bottom'|'left'} WPEdgeName
 */

/**
 * @typedef  {Object} WPPoint
 * @property {number} x The horizontal position.
 * @property {number} y The vertical position.
 */

/**
 * Given a point, a DOMRect and the name of an edge, returns the distance to
 * that edge of the rect.
 *
 * This function works for edges that are horizontal or vertical (e.g. not
 * rotated), the following terms are used so that the function works in both
 * orientations:
 *
 * - Forward, meaning the axis running horizontally when an edge is vertical
 *   and vertically when an edge is horizontal.
 * - Lateral, meaning the axis running vertically when an edge is vertical
 *   and horizontally when an edge is horizontal.
 *
 * @param {WPPoint}    point The point to measure distance from.
 * @param {DOMRect}    rect  A DOM Rect containing edge positions.
 * @param {WPEdgeName} edge  The edge to measure to.
 */
export function getDistanceFromPointToEdge( point, rect, edge ) {
	const isHorizontal = edge === 'top' || edge === 'bottom';
	const { x, y } = point;
	const pointLateralPosition = isHorizontal ? x : y;
	const pointForwardPosition = isHorizontal ? y : x;
	const edgeStart = isHorizontal ? rect.left : rect.top;
	const edgeEnd = isHorizontal ? rect.right : rect.bottom;
	const edgeForwardPosition = rect[ edge ];

	// Measure the straight line distance to the edge of the rect, when the
	// point is adjacent to the edge.
	// Else, if the point is positioned diagonally to the edge of the rect,
	// measure diagonally to the nearest corner that the edge meets.
	let edgeLateralPosition;
	if (
		pointLateralPosition >= edgeStart &&
		pointLateralPosition <= edgeEnd
	) {
		edgeLateralPosition = pointLateralPosition;
	} else if ( pointLateralPosition < edgeEnd ) {
		edgeLateralPosition = edgeStart;
	} else {
		edgeLateralPosition = edgeEnd;
	}

	return Math.sqrt(
		( pointLateralPosition - edgeLateralPosition ) ** 2 +
			( pointForwardPosition - edgeForwardPosition ) ** 2
	);
}

/**
 * Given a point, a DOMRect and a list of allowed edges returns the name of and
 * distance to the nearest edge.
 *
 * @param {WPPoint}      point        The point to measure distance from.
 * @param {DOMRect}      rect         A DOM Rect containing edge positions.
 * @param {WPEdgeName[]} allowedEdges A list of the edges included in the
 *                                    calculation. Defaults to all edges.
 *
 * @return {[number, string]} An array where the first value is the distance
 *                              and a second is the edge name.
 */
export function getDistanceToNearestEdge(
	point,
	rect,
	allowedEdges = [ 'top', 'bottom', 'left', 'right' ]
) {
	let candidateDistance;
	let candidateEdge;

	allowedEdges.forEach( ( edge ) => {
		const distance = getDistanceFromPointToEdge( point, rect, edge );

		if ( candidateDistance === undefined || distance < candidateDistance ) {
			candidateDistance = distance;
			candidateEdge = edge;
		}
	} );

	return [ candidateDistance, candidateEdge ];
}

/**
 * Is the point contained by the rectangle.
 *
 * @param {WPPoint} point The point.
 * @param {DOMRect} rect  The rectangle.
 *
 * @return {boolean} True if the point is contained by the rectangle, false otherwise.
 */
export function isPointContainedByRect( point, rect ) {
	return (
		rect.left <= point.x &&
		rect.right >= point.x &&
		rect.top <= point.y &&
		rect.bottom >= point.y
	);
}

/**
 * Is the point within the top and bottom boundaries of the rectangle.
 *
 * @param {WPPoint} point The point.
 * @param {DOMRect} rect  The rectangle.
 *
 * @return {boolean} True if the point is within top and bottom of rectangle, false otherwise.
 */
export function isPointWithinTopAndBottomBoundariesOfRect( point, rect ) {
	return rect.top <= point.y && rect.bottom >= point.y;
}
