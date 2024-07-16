/**
 * External dependencies
 */
import memize from 'memize';
/**
 * Internal dependencies
 */
import type { Position, Size } from './types';

export function rotatePoint(
	point: Position,
	center: Position,
	radian: number
): Position {
	const cos = Math.cos( radian );
	const sin = Math.sin( radian );
	const dx = point.x - center.x;
	const dy = point.y - center.y;
	return {
		x: center.x + dx * cos - dy * sin,
		y: center.y + dx * sin + dy * cos,
	};
}

export function degreeToRadian( degree: number ): number {
	return ( degree * Math.PI ) / 180;
}

export const getFurthestVector = memize(
	(
		width: number,
		height: number,
		radian: number,
		size: Size,
		position: Position
	): Position => {
		const windowVertices = [
			{ x: size.width / 2, y: -size.height / 2 }, // top right
			{ x: size.width / 2, y: size.height / 2 }, // bottom right
			{ x: -size.width / 2, y: +size.height / 2 }, // bottom left
			{ x: -size.width / 2, y: -size.height / 2 }, // top left
		];

		const minX = position.x - width / 2;
		const maxX = position.x + width / 2;
		const minY = position.y - height / 2;
		const maxY = position.y + height / 2;

		let furthestX = 0;
		let furthestY = 0;

		for ( const point of windowVertices ) {
			const rotatedPoint = rotatePoint( point, position, -radian );

			if ( rotatedPoint.x < minX ) {
				furthestX =
					Math.abs( rotatedPoint.x - minX ) > Math.abs( furthestX )
						? rotatedPoint.x - minX
						: furthestX;
			}
			if ( rotatedPoint.x > maxX ) {
				furthestX =
					Math.abs( rotatedPoint.x - maxX ) > Math.abs( furthestX )
						? rotatedPoint.x - maxX
						: furthestX;
			}
			if ( rotatedPoint.y < minY ) {
				furthestY =
					Math.abs( rotatedPoint.y - minY ) > Math.abs( furthestY )
						? rotatedPoint.y - minY
						: furthestY;
			}
			if ( rotatedPoint.y > maxY ) {
				furthestY =
					Math.abs( rotatedPoint.y - maxY ) > Math.abs( furthestY )
						? rotatedPoint.y - maxY
						: furthestY;
			}
		}

		return { x: furthestX, y: furthestY };
	},
	{ maxSize: 1 }
);
