/**
 * External dependencies
 */
import memize from 'memize';
/**
 * Internal dependencies
 */
import type { Position } from './types';

/**
 * The conversion factor from degrees to radians.
 */
export const DEGREE_TO_RADIAN = Math.PI / 180;

/**
 * 90 degrees in radians.
 */
export const PI_OVER_TWO = Math.PI / 2;

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

/**
 * Row-major 3x3 matrix for 2D transformations.
 */
// prettier-ignore
export type Matrix3x3 = [
	number, number, number,
	number, number, number,
	number, number, number,
];

/**
 * Generate an identity matrix.
 * @return Identity matrix
 */
export function identity3x3(): Matrix3x3 {
	// prettier-ignore
	return [
		1, 0, 0,
		0, 1, 0,
		0, 0, 1,
	];
}

/**
 * Generate a rotation matrix.
 * @param angle Angle in radians
 * @return Rotation matrix
 */
export function rotate3x3( angle: number ): Matrix3x3 {
	const cos = Math.cos( angle );
	const sin = Math.sin( angle );
	// prettier-ignore
	return [
		cos, -sin, 0,
		sin, cos,  0,
		0,   0,    1,
	];
}

/**
 * Generate a translation matrix.
 * @param x Horizontal translation
 * @param y Vertical translation
 * @return Translation matrix
 */
export function translate3x3( x: number, y: number ): Matrix3x3 {
	// prettier-ignore
	return [
		1, 0, x,
		0, 1, y,
		0, 0, 1,
	];
}

/**
 * Generate a scale matrix.
 * @param x Horizontal scale
 * @param y Vertical scale
 * @return Scale matrix
 */
export function scale3x3( x: number, y: number ): Matrix3x3 {
	// prettier-ignore
	return [
		x, 0, 0,
		0, y, 0,
		0, 0, 1,
	];
}

/**
 * Multiply 3x3 matrices.
 * @param first First matrix
 * @param rest  Additional matrices to multiply in order
 * @return Resulting matrix
 */
export function multiply3x3(
	first: Matrix3x3,
	...rest: Matrix3x3[]
): Matrix3x3 {
	let a = first;
	for ( const b of rest ) {
		a = [
			a[ 0 ] * b[ 0 ] + a[ 1 ] * b[ 3 ] + a[ 2 ] * b[ 6 ],
			a[ 0 ] * b[ 1 ] + a[ 1 ] * b[ 4 ] + a[ 2 ] * b[ 7 ],
			a[ 0 ] * b[ 2 ] + a[ 1 ] * b[ 5 ] + a[ 2 ] * b[ 8 ],
			a[ 3 ] * b[ 0 ] + a[ 4 ] * b[ 3 ] + a[ 5 ] * b[ 6 ],
			a[ 3 ] * b[ 1 ] + a[ 4 ] * b[ 4 ] + a[ 5 ] * b[ 7 ],
			a[ 3 ] * b[ 2 ] + a[ 4 ] * b[ 5 ] + a[ 5 ] * b[ 8 ],
			a[ 6 ] * b[ 0 ] + a[ 7 ] * b[ 3 ] + a[ 8 ] * b[ 6 ],
			a[ 6 ] * b[ 1 ] + a[ 7 ] * b[ 4 ] + a[ 8 ] * b[ 7 ],
			a[ 6 ] * b[ 2 ] + a[ 7 ] * b[ 5 ] + a[ 8 ] * b[ 8 ],
		];
	}
	return a;
}

/**
 * Convert transforms state into a 3x3 matrix.
 * @param state State
 * @return 3x3 matrix
 */
export function state3x3( state: any ): Matrix3x3 {
	const {
		transforms: { scale, rotate, translate },
	} = state;
	// prettier-ignore
	return [
		scale.x * Math.cos( rotate ), scale.y * Math.sin( rotate ), translate.x,
		scale.x * -Math.sin( rotate ), scale.y * Math.cos( rotate ), translate.y,
		0, 0, 1,
	];
}

// Column-major versions of the above functions for CSS matrix. Harder to read, but more performant.

/**
 * Column-major 3x3 matrix for 2D transformations without the final [0,0,1] row. Same as CSS matrix order.
 *
 * [ a, b, c, d, e, f ] is equivalent to: | a c e |
 *                                        | b d f |
 *                                        | 0 0 1 |
 */
export type MatrixCSS = [ number, number, number, number, number, number ];

/**
 * Convert a 3x3 matrix to a CSS matrix.
 * @param matrix 3x3 matrix
 * @return CSS matrix
 */
export function matrix3x3ToCSS( matrix: Matrix3x3 ): MatrixCSS {
	// prettier-ignore
	return [
		matrix[ 0 ], matrix[ 3 ],
		matrix[ 1 ], matrix[ 4 ],
		matrix[ 2 ], matrix[ 5 ],
	];
}

/**
 * Generate an identity CSS matrix.
 * @return Identity CSS matrix
 */
export function identityCSS(): MatrixCSS {
	return [ 1, 0, 0, 1, 0, 0 ];
}

/**
 * Generate a rotation CSS matrix.
 * @param angle Angle in radians
 * @return Rotation CSS matrix
 */
export function rotateCSS( angle: number ): MatrixCSS {
	const cos = Math.cos( angle );
	const sin = Math.sin( angle );
	return [ cos, sin, -sin, cos, 0, 0 ];
}

/**
 * Generate a translation CSS matrix.
 * @param x Horizontal translation
 * @param y Vertical translation
 * @return Translation CSS matrix
 */
export function translateCSS( x: number, y: number ): MatrixCSS {
	return [ 1, 0, 0, 1, x, y ];
}

/**
 * Generate a scale CSS matrix.
 * @param x Horizontal scale
 * @param y Vertical scale
 * @return Scale CSS matrix
 */
export function scaleCSS( x: number, y: number ): MatrixCSS {
	return [ x, 0, 0, y, 0, 0 ];
}

/**
 * Multiply CSS matrices.
 * @param first First matrix
 * @param rest  Additional matrices to multiply in order
 * @return Resulting matrix
 */
export function multiplyCSS(
	first: MatrixCSS,
	...rest: MatrixCSS[]
): MatrixCSS {
	let a = first;
	for ( const b of rest ) {
		a = [
			a[ 0 ] * b[ 0 ] + a[ 2 ] * b[ 1 ],
			a[ 1 ] * b[ 0 ] + a[ 3 ] * b[ 1 ],
			a[ 0 ] * b[ 2 ] + a[ 2 ] * b[ 3 ],
			a[ 1 ] * b[ 2 ] + a[ 3 ] * b[ 3 ],
			a[ 0 ] * b[ 4 ] + a[ 2 ] * b[ 5 ] + a[ 4 ],
			a[ 1 ] * b[ 4 ] + a[ 3 ] * b[ 5 ] + a[ 5 ],
		];
	}
	return a;
}

/**
 * Convert transforms state into a CSS matrix.
 * @param state State
 * @return CSS matrix
 */
export function stateToMatrixCSS( state: any ): MatrixCSS {
	const {
		transforms: { scale, rotate, translate },
	} = state;
	return multiplyCSS(
		translateCSS( translate.x, translate.y ),
		scaleCSS( scale.x, scale.y ),
		rotateCSS( rotate )
	);
}

/**
 * Convert a CSS matrix to a string.
 * @param matrix CSS matrix
 * @return CSS matrix string
 */
export function matrixCSSToString( matrix: MatrixCSS ): string {
	return `matrix(${ matrix.join( ',' ) })`;
}
