/**
 * Internal dependencies
 */
import type { ImageSizeCrop } from '../types';

export async function convertImageFormat(
	bufferOrBlob: ArrayBuffer | Blob,
	sourceType: string,
	destType: string,
	quality = 0.82
) {
	const imgBlob =
		bufferOrBlob instanceof ArrayBuffer
			? new Blob( [ bufferOrBlob ], { type: sourceType } )
			: bufferOrBlob;

	const bitmap = await createImageBitmap( imgBlob );
	const { width, height } = bitmap;

	const canvas = new OffscreenCanvas( width, height );

	const ctx = canvas.getContext( '2d', {
		// TODO: Make this based on actual opacity.
		alpha: [ 'image/png', 'image/webp' ].includes( sourceType ),
	} );

	// If the contextType doesn't match a possible drawing context,
	// or differs from the first contextType requested, null is returned.
	if ( ! ctx ) {
		throw new Error( 'Could not get context' );
	}

	ctx.drawImage( bitmap, 0, 0, canvas.width, canvas.height );

	const blob = await canvas.convertToBlob( {
		type: destType,
		quality,
	} );

	return blob.arrayBuffer();
}

export async function compressImage(
	buffer: ArrayBuffer,
	sourceType: string,
	quality = 0.82
) {
	return convertImageFormat( buffer, sourceType, sourceType, quality );
}

/**
 * Resizes and crops an image using createImageBitmap and canvas.
 *
 * @param buffer     Image buffer.
 * @param sourceType Source mime type.
 * @param resize     Resize options.
 */
export async function resizeImage(
	buffer: ArrayBuffer,
	sourceType: string,
	resize: ImageSizeCrop
) {
	const imgBlob = new Blob( [ buffer ], { type: sourceType } );

	let bitmap = await createImageBitmap( imgBlob );
	const { width, height } = bitmap;

	// Prevent upscaling images.
	resize.width = resize.width > width ? width : resize.width;

	// If resize.height is zero.
	resize.height = resize.height || ( height / width ) * resize.width;

	let resizeWidth: number | undefined;
	let resizeHeight: number | undefined;

	let expectedWidth = resize.width;
	let expectedHeight = resize.height;

	if ( ! resize.crop ) {
		if ( width < height ) {
			if ( resize.width <= resize.height ) {
				if ( resize.height > height ) {
					resizeWidth = resize.width;
				} else {
					resizeHeight = resize.height;
				}
			} else if ( resize.width > width ) {
				resizeHeight = resize.height;
			} else {
				resizeWidth = resize.width;
			}
		} else if ( resize.width <= resize.height ) {
			resizeWidth = resize.width > width ? width : resize.width;
			if ( resize.width > width ) {
				resizeHeight = resize.height;
			} else {
				resizeWidth = resize.width;
			}
		} else if ( resize.height > height ) {
			resizeWidth = resize.width;
		} else {
			resizeHeight = resize.height;
		}

		if ( resizeWidth ) {
			expectedWidth = resizeWidth;
			expectedHeight = ( height / width ) * resizeWidth;
		} else if ( resizeHeight ) {
			expectedHeight = resizeHeight;
			expectedWidth = ( width / height ) * resizeHeight;
		}

		bitmap = await createImageBitmap( bitmap, 0, 0, width, height, {
			resizeWidth,
			resizeHeight,
			resizeQuality: 'pixelated', // Not currently supported in Firefox.
			premultiplyAlpha: 'none',
			colorSpaceConversion: 'none',
		} );
	} else {
		// These are equal.
		if ( true === resize.crop ) {
			resize.crop = [ 'center', 'center' ];
		}

		// First resize, then do the cropping.
		// This allows operating on the second bitmap with the correct dimensions.

		if ( width < height || ! resize.height ) {
			resizeWidth = resize.width;
		} else {
			resizeHeight = resize.height;
		}

		bitmap = await createImageBitmap( bitmap, 0, 0, width, height, {
			resizeWidth,
			resizeHeight,
			resizeQuality: 'high', // Not currently supported in Firefox.
			premultiplyAlpha: 'none',
			colorSpaceConversion: 'none',
		} );

		let sx = 0;
		let sy = 0;
		const sw = resize.width;
		const sh = resize.height;

		if ( 'center' === resize.crop[ 0 ] ) {
			sx = ( bitmap.width - resize.width ) / 2;
		} else if ( 'right' === resize.crop[ 0 ] ) {
			sx = bitmap.width - resize.width;
		}

		if ( 'center' === resize.crop[ 1 ] ) {
			sy = ( bitmap.height - resize.height ) / 2;
		} else if ( 'bottom' === resize.crop[ 1 ] ) {
			sy = bitmap.height - resize.height;
		}

		bitmap = await createImageBitmap( bitmap, sx, sy, sw, sh, {
			resizeQuality: 'pixelated', // Not currently supported in Firefox.
			premultiplyAlpha: 'none',
			colorSpaceConversion: 'none',
		} );
	}

	// Using expected width/height over bitmap.width / bitmap.height to fix 1px rounding errors.
	expectedWidth = Math.round( Number( expectedWidth.toFixed( 1 ) ) );
	expectedHeight = Math.round( Number( expectedHeight.toFixed( 1 ) ) );

	const canvas = new OffscreenCanvas( expectedWidth, expectedHeight );
	const ctx = canvas.getContext( '2d', {
		// TODO: Make this based on actual opacity.
		alpha: [ 'image/png', 'image/webp' ].includes( sourceType ),
	} );

	// If the contextType doesn't match a possible drawing context,
	// or differs from the first contextType requested, null is returned.
	if ( ! ctx ) {
		throw new Error( 'Could not get context' );
	}

	ctx.drawImage( bitmap, 0, 0, expectedWidth, expectedHeight );

	const blob = await canvas.convertToBlob( { type: sourceType } );

	return {
		buffer: await blob.arrayBuffer(),
		width: canvas.width,
		height: canvas.height,
		originalWidth: width,
		originalHeight: height,
	};
}
