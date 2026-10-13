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
 * Creates an image from a URL.
 *
 * @param {string} url - The URL of the image to create.
 * @return {Promise<HTMLImageElement>} A promise that resolves to the image.
 */
export const createImage = ( url: string ) =>
	new Promise( ( resolve, reject ) => {
		const image = new Image();
		image.addEventListener( 'load', () => resolve( image ) );
		image.addEventListener( 'error', ( error ) => reject( error ) );
		image.setAttribute( 'crossOrigin', 'anonymous' );
		image.src = url;
	} );

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

/**
 * Crops an image to a given area.
 *
 * @param {string} imageSrc         - The source of the image to crop.
 * @param {Object} pixelCrop        - The area to crop.
 * @param          pixelCrop.x
 * @param          pixelCrop.y
 * @param          pixelCrop.width
 * @param          pixelCrop.height
 * @param {number} rotation         - The rotation of the image.
 * @param {Object} flip             - The flip of the image.
 * @return {Promise<string | null>} A promise that resolves to the cropped image.
 */
export async function getCroppedImage(
	imageSrc: string,
	pixelCrop: { x: number; y: number; width: number; height: number },
	rotation = 0,
	flip = { horizontal: false, vertical: false }
): Promise< string | null > {
	try {
		const image = ( await createImage( imageSrc ) ) as HTMLImageElement;
		const canvas = document.createElement( 'canvas' );
		const ctx = canvas.getContext( '2d' );

		if ( ! ctx ) {
			return null;
		}

		// Calculate the rotation angle in radians.
		const rotRad = getRadianAngle( rotation );

		const { width: boundingBoxWidth, height: boundingBoxHeight } =
			rotateSize( image.width, image.height, rotation );

		// Set canvas size to match the bounding box.
		canvas.width = boundingBoxWidth;
		canvas.height = boundingBoxHeight;

		// Translate and draw canvas context to a central location to allow rotating and flipping around the center.
		ctx.translate( boundingBoxWidth / 2, boundingBoxHeight / 2 );
		ctx.rotate( rotRad );
		ctx.scale( flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1 );
		ctx.translate( -image.width / 2, -image.height / 2 );
		ctx.drawImage( image, 0, 0 );

		const croppedCanvas = document.createElement( 'canvas' );
		const croppedCtx = croppedCanvas.getContext( '2d' );

		if ( ! croppedCtx ) {
			return null;
		}

		// Set the size of the cropped canvas.
		croppedCanvas.width = pixelCrop.width;
		croppedCanvas.height = pixelCrop.height;

		// Draw the cropped image onto the new canvas.
		croppedCtx.drawImage(
			canvas,
			pixelCrop.x,
			pixelCrop.y,
			pixelCrop.width,
			pixelCrop.height,
			0,
			0,
			pixelCrop.width,
			pixelCrop.height
		);

		// Return as a blob.
		return new Promise( ( resolve ) => {
			croppedCanvas.toBlob( ( file ) => {
				if ( file ) {
					resolve( URL.createObjectURL( file ) );
				}
			}, 'image/jpeg' );
		} );
	} catch {
		return null;
	}
}
