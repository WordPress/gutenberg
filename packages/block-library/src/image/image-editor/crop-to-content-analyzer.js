import { calculateContentBoundsOptimized } from './crop-to-content';

/**
 * Crop to Content - Plain Function Version
 *
 * Analyzes an image from a URL and returns crop bounds.
 * Supports PNG, WebP, AVIF (transparency), and JPEG (white backgrounds).
 *
 * @param {string} imageUrl    - URL of the image to analyze
 * @param {number} imageWidth  - Natural width of the image
 * @param {number} imageHeight - Natural height of the image
 * @return {Promise<Object|null>} Crop bounds and statistics, or null if no crop needed
 */
export async function analyzeCropToContent(
	imageUrl,
	imageWidth,
	imageHeight
) {
	if ( ! imageUrl || ! imageWidth || ! imageHeight ) {
		return null;
	}

	try {
		// Create image element
		const img = new window.Image();
		img.crossOrigin = 'anonymous';

		// Load image
		await new Promise( ( resolve, reject ) => {
			img.onload = resolve;
			img.onerror = () => reject( new Error( 'Failed to load image' ) );
			img.src = imageUrl;
		} );

		// Create canvas
		const canvas = document.createElement( 'canvas' );
		canvas.width = img.naturalWidth;
		canvas.height = img.naturalHeight;
		const ctx = canvas.getContext( '2d', { willReadFrequently: true } );
		ctx.drawImage( img, 0, 0 );

		// Get pixel data
		const imageData = ctx.getImageData( 0, 0, canvas.width, canvas.height );

		// Detect image format
		const imageExt = imageUrl.toLowerCase();
		const hasTransparency =
			imageExt.endsWith( '.png' ) ||
			imageExt.endsWith( '.webp' ) ||
			imageExt.endsWith( '.avif' );
		const isJPEG = imageExt.match( /\.jpe?g(\?|$)/i );

		// Calculate bounds
		// For formats with transparency (PNG, WebP, AVIF): detect transparency
		// For JPEGs: detect white/light backgrounds
		const bounds = calculateContentBoundsOptimized( imageData, {
			alphaThreshold: 10,
			detectWhite: isJPEG, // Enable white detection for JPEGs
			whiteThreshold: 250, // Detect very light backgrounds
		} );

		if ( ! bounds || bounds.width <= 0 || bounds.height <= 0 ) {
			return {
				success: false,
				message: hasTransparency
					? 'No transparent areas found to remove.'
					: 'No white background found to remove.',
			};
		}

		// Calculate percentage
		const originalArea = canvas.width * canvas.height;
		const newArea = bounds.width * bounds.height;
		const percentCropped = Math.round(
			( ( originalArea - newArea ) / originalArea ) * 100
		);

		if ( percentCropped < 5 ) {
			return {
				success: false,
				message:
					'Image has minimal empty space (less than 5%). No significant crop needed.',
			};
		}

		// Return success with crop data
		return {
			success: true,
			bounds,
			stats: {
				originalWidth: canvas.width,
				originalHeight: canvas.height,
				percentCropped,
			},
		};
	} catch ( error ) {
		return {
			success: false,
			message:
				'An error occurred while analyzing the image: ' + error.message,
		};
	}
}
