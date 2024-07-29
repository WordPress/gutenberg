/**
 * External dependencies
 */
import memize from 'memize';
/**
 * Internal dependencies
 */
import type { Position } from './types';

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

export const getMinScale = memize(
	(
		radian: number,
		imageWidth: number,
		imageHeight: number,
		cropperWidth: number,
		cropperHeight: number,
		imageX: number,
		imageY: number
	) => {
		// Calculate the boundaries of the area where the cropper can move.
		// These boundaries ensure the cropper stays within the image.
		const { minX, maxX, minY, maxY } = calculateRotatedBounds(
			radian,
			imageWidth,
			imageHeight,
			cropperWidth,
			cropperHeight
		);

		// Rotate the image center to align with the rotated coordinate system.
		const rotatedPoint = rotatePoint( { x: imageX, y: imageY }, -radian );

		// Calculate the maximum distances the cropper can move from the current position.
		const maxDistanceX = Math.max(
			minX - rotatedPoint.x,
			rotatedPoint.x - maxX,
			0
		);
		const maxDistanceY = Math.max(
			minY - rotatedPoint.y,
			rotatedPoint.y - maxY,
			0
		);

		// Calculate the minimum scales that fit the cropper within the image.
		const widthScale = ( maxDistanceX * 2 + imageWidth ) / imageWidth;
		const heightScale = ( maxDistanceY * 2 + imageHeight ) / imageHeight;

		return Math.max( widthScale, heightScale );
	},
	{ maxSize: 1 }
);
