/**
 * External dependencies
 */
import memize from 'memize';
/**
 * Internal dependencies
 */
import type { Position, Size } from './types';

const DEGREE_TO_RADIAN = Math.PI / 180;

/**
 * Rotate a point around a center point by a given degree.
 * @param point  The point to rotate.
 * @param radian The radian to rotate by.
 * @param center The optional center point to rotate around. If not provided then the origin is used.
 */
export function rotatePoint(
	point: Position,
	radian: number,
	center: Position = { x: 0, y: 0 }
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

/**
 * Convert degree to radian.
 * @param degree The degree to convert.
 */
export function degreeToRadian( degree: number ): number {
	return degree * DEGREE_TO_RADIAN;
}

/**
 * Get the maximum (rotated) pair of (x,y) vector for each corner of a rotated rectangle (window)
 * that is the furthest from a un-rotated rectangle.
 */
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
			const rotatedPoint = rotatePoint( point, -radian, position );

			if (
				rotatedPoint.x < minX &&
				Math.abs( rotatedPoint.x - minX ) > Math.abs( furthestX )
			) {
				furthestX = rotatedPoint.x - minX;
			}
			if (
				rotatedPoint.x > maxX &&
				Math.abs( rotatedPoint.x - maxX ) > Math.abs( furthestX )
			) {
				furthestX = rotatedPoint.x - maxX;
			}
			if (
				rotatedPoint.y < minY &&
				Math.abs( rotatedPoint.y - minY ) > Math.abs( furthestY )
			) {
				furthestY = rotatedPoint.y - minY;
			}
			if (
				rotatedPoint.y > maxY &&
				Math.abs( rotatedPoint.y - maxY ) > Math.abs( furthestY )
			) {
				furthestY = rotatedPoint.y - maxY;
			}
		}

		return { x: furthestX, y: furthestY };
	},
	{ maxSize: 1 }
);

export const calculateRotatedBounds = memize(
	(
		radian: number,
		imageWidth: number,
		imageHeight: number,
		cropperWidth: number,
		cropperHeight: number
	) => {
		// Calculate half dimensions of the image and cropper.
		const halfImageWidth = imageWidth / 2;
		const halfImageHeight = imageHeight / 2;
		const halfCropperWidth = cropperWidth / 2;
		const halfCropperHeight = cropperHeight / 2;

		// Calculate absolute values of sin and cos for the rotation angle.
		// This works for all angles due to the periodicity of sine and cosine.
		const sin = Math.abs( Math.sin( radian ) );
		const cos = Math.abs( Math.cos( radian ) );

		// Calculate the dimensions of the rotated rectangle's bounding box.
		// This formula works for all angles because it considers the maximum extent
		// of the rotated rectangle in each direction.
		const rotatedWidth = halfCropperWidth * cos + halfCropperHeight * sin;
		const rotatedHeight = halfCropperHeight * cos + halfCropperWidth * sin;

		// Calculate the boundaries of the area where the cropper can move.
		// These boundaries ensure the cropper stays within the image.
		const minX = -halfImageWidth + rotatedWidth;
		const maxX = halfImageWidth - rotatedWidth;
		const minY = -halfImageHeight + rotatedHeight;
		const maxY = halfImageHeight - rotatedHeight;

		return {
			minX,
			maxX,
			minY,
			maxY,
		};
	},
	{ maxSize: 1 }
);
