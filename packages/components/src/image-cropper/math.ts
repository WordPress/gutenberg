/**
 * External dependencies
 */
import memize from 'memize';
/**
 * Internal dependencies
 */
import type { Position } from './types';

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

export const getRotatedScale = memize(
	( angle: number, scale: number, width: number, height: number ) => {
		const radian = degreeToRadian( angle );
		if ( radian === 0 ) {
			return scale;
		}

		// Calculate bounding box of the rotated image.
		const sin = Math.sin( radian );
		const cos = Math.cos( radian );
		const newWidth = Math.abs( width * cos ) + Math.abs( height * sin );
		const newHeight = Math.abs( width * sin ) + Math.abs( height * cos );

		// Calculate the scaling factor to cover the entire container.
		const scaleX = newWidth / width;
		const scaleY = newHeight / height;
		const minScale = Math.max( scaleX, scaleY );

		return scale * minScale;
	},
	{ maxSize: 1 }
);
