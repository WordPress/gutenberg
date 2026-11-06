/**
 * Normalizes a rotation value to be within the range of 0-360 degrees.
 * So a rotation of -90 becomes 270, -45 becomes 315, etc.
 * This is required because the `/media/edit` calculates the rotation value
 * by subtracting the rotation value from 0. ImageMagick rotates clockwise only and will subtract the rotation value from 360.
 * It's utterly confusing, and probably in need of a refactor.
 *
 * @param {number} rotation - The rotation value to normalize.
 * @return {number} The normalized rotation value.
 */
export const normalizeRotation = ( rotation: number ) => {
	if ( rotation >= 0 ) {
		return rotation % 360;
	}

	// For negative rotations, convert to positive clockwise equivalent
	return ( 360 + ( rotation % 360 ) ) % 360;
};

/**
 * Converts a degree value to a radian value.
 *
 * @param {number} degreeValue - The degree value to convert.
 * @return {number} The radian value.
 */
export function getRadianAngle( degreeValue: number ) {
	return ( degreeValue * Math.PI ) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle.
 *
 * @param {number} width    - The width of the rectangle.
 * @param {number} height   - The height of the rectangle.
 * @param {number} rotation - The rotation of the rectangle.
 * @return {Object} The new bounding area of the rotated rectangle.
 */
export function rotateSize( width: number, height: number, rotation: number ) {
	const rotRad = getRadianAngle( rotation );

	return {
		width:
			Math.abs( Math.cos( rotRad ) * width ) +
			Math.abs( Math.sin( rotRad ) * height ),
		height:
			Math.abs( Math.sin( rotRad ) * width ) +
			Math.abs( Math.cos( rotRad ) * height ),
	};
}
