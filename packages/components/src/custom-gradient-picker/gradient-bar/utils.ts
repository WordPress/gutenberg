// @ts-nocheck

/**
 * Internal dependencies
 */
import { MINIMUM_DISTANCE_BETWEEN_POINTS } from './constants';
import type { ControlPoint } from '../types';

export function clampPercent( value: number ) {
	return Math.max( 0, Math.min( 100, value ) );
}

export function isOverlapping(
	value: ControlPoint[],
	initialIndex: number,
	newPosition: number,
	minDistance = MINIMUM_DISTANCE_BETWEEN_POINTS
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

export function addControlPoint(
	points: ControlPoint[],
	position: number,
	color: string
) {
	const nextIndex = points.findIndex(
		( point ) => point.position > position
	);
	const newPoint = { color, position };
	const newPoints = points.slice();
	newPoints.splice( nextIndex - 1, 0, newPoint );
	return newPoints;
}

export function removeControlPoint( points: ControlPoint[], index: number ) {
	return points.filter( ( _point, pointIndex ) => {
		return pointIndex !== index;
	} );
}

export function updateControlPoint(
	points: ControlPoint[],
	index: number,
	newPoint: ControlPoint
) {
	const newValue = points.slice();
	newValue[ index ] = newPoint;
	return newValue;
}

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

export function updateControlPointColor(
	points: ControlPoint[],
	index: number,
	newColor: string
) {
	const newPoint = {
		...points[ index ],
		color: newColor,
	};
	return updateControlPoint( points, index, newPoint );
}

export function updateControlPointColorByPosition(
	points: ControlPoint[],
	position: ControlPoint[ 'position' ],
	newColor: string
) {
	const index = points.findIndex( ( point ) => point.position === position );
	return updateControlPointColor( points, index, newColor );
}

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
