/**
 * Analyzes an image and calculates the bounding box of non-transparent content.
 *
 * This function scans all pixels in the image data to find the smallest rectangle
 * that contains all non-transparent pixels. Useful for automatically cropping
 * images with transparent backgrounds.
 *
 * @param {ImageData} imageData              - Canvas ImageData object containing pixel data
 * @param {Object}    options                - Configuration options
 * @param {number}    options.alphaThreshold - Alpha threshold (0-255) for transparency detection. Pixels with alpha values above this are considered content.
 * @param {boolean}   options.detectWhite    - If true, also detect white/near-white pixels as empty space
 * @param {number}    options.whiteThreshold - RGB threshold (0-255) for white detection. Pixels with all RGB values above this are considered white.
 * @param {number}    options.padding        - Optional padding (in pixels) to add around detected content
 *
 * @return {Object|null} Bounding box {x, y, width, height} or null if no content found
 */
export function calculateContentBounds( imageData, options = {} ) {
	const {
		alphaThreshold = 10,
		detectWhite = false,
		whiteThreshold = 250,
		padding = 0,
	} = options;

	const { data, width, height } = imageData;

	// Initialize bounds to impossible values
	let minX = width;
	let minY = height;
	let maxX = 0;
	let maxY = 0;
	let hasContent = false;

	// Scan all pixels to find content boundaries
	for ( let y = 0; y < height; y++ ) {
		for ( let x = 0; x < width; x++ ) {
			const index = ( y * width + x ) * 4;
			const r = data[ index ];
			const g = data[ index + 1 ];
			const b = data[ index + 2 ];
			const alpha = data[ index + 3 ];

			let isContent = false;

			// Check transparency
			if ( alpha > alphaThreshold ) {
				// If we're also detecting white backgrounds
				if ( detectWhite ) {
					// Pixel is content if it's not white
					isContent =
						r < whiteThreshold ||
						g < whiteThreshold ||
						b < whiteThreshold;
				} else {
					// Any non-transparent pixel is content
					isContent = true;
				}
			}

			if ( isContent ) {
				hasContent = true;
				minX = Math.min( minX, x );
				minY = Math.min( minY, y );
				maxX = Math.max( maxX, x );
				maxY = Math.max( maxY, y );
			}
		}
	}

	// Return null if no content was found
	if ( ! hasContent ) {
		return null;
	}

	// Calculate final bounds with padding
	const bounds = {
		x: Math.max( 0, minX - padding ),
		y: Math.max( 0, minY - padding ),
		width: Math.min( width - minX, maxX - minX + 1 + padding * 2 ),
		height: Math.min( height - minY, maxY - minY + 1 + padding * 2 ),
	};

	// Ensure bounds don't exceed image dimensions
	if ( bounds.x + bounds.width > width ) {
		bounds.width = width - bounds.x;
	}
	if ( bounds.y + bounds.height > height ) {
		bounds.height = height - bounds.y;
	}

	return bounds;
}

/**
 * Optimized version that scans from edges inward for better performance.
 * Stops scanning once content is found on each edge.
 *
 * @param {ImageData} imageData - Canvas ImageData object
 * @param {Object}    options   - Configuration options (same as calculateContentBounds)
 *
 * @return {Object|null} Bounding box {x, y, width, height} or null if no content found
 */
export function calculateContentBoundsOptimized( imageData, options = {} ) {
	const {
		alphaThreshold = 10,
		detectWhite = false,
		whiteThreshold = 250,
		padding = 0,
	} = options;

	const { data, width, height } = imageData;

	/**
	 * Check if a pixel is considered content
	 *
	 * @param {number} index - Pixel data index
	 * @return {boolean} True if pixel is content
	 */
	const isContentPixel = ( index ) => {
		const alpha = data[ index + 3 ];
		if ( alpha <= alphaThreshold ) {
			return false;
		}

		if ( detectWhite ) {
			const r = data[ index ];
			const g = data[ index + 1 ];
			const b = data[ index + 2 ];
			return (
				r < whiteThreshold || g < whiteThreshold || b < whiteThreshold
			);
		}

		return true;
	};

	// Find top boundary
	let top = 0;
	topLoop: for ( let y = 0; y < height; y++ ) {
		for ( let x = 0; x < width; x++ ) {
			const index = ( y * width + x ) * 4;
			if ( isContentPixel( index ) ) {
				top = y;
				break topLoop;
			}
		}
	}

	// Find bottom boundary
	let bottom = height - 1;
	bottomLoop: for ( let y = height - 1; y >= top; y-- ) {
		for ( let x = 0; x < width; x++ ) {
			const index = ( y * width + x ) * 4;
			if ( isContentPixel( index ) ) {
				bottom = y;
				break bottomLoop;
			}
		}
	}

	// Find left boundary
	let left = 0;
	leftLoop: for ( let x = 0; x < width; x++ ) {
		for ( let y = top; y <= bottom; y++ ) {
			const index = ( y * width + x ) * 4;
			if ( isContentPixel( index ) ) {
				left = x;
				break leftLoop;
			}
		}
	}

	// Find right boundary
	let right = width - 1;
	rightLoop: for ( let x = width - 1; x >= left; x-- ) {
		for ( let y = top; y <= bottom; y++ ) {
			const index = ( y * width + x ) * 4;
			if ( isContentPixel( index ) ) {
				right = x;
				break rightLoop;
			}
		}
	}

	// Check if any content was found
	if ( top > bottom || left > right ) {
		return null;
	}

	// Calculate final bounds with padding
	const bounds = {
		x: Math.max( 0, left - padding ),
		y: Math.max( 0, top - padding ),
		width: Math.min( width, right - left + 1 + padding * 2 ),
		height: Math.min( height, bottom - top + 1 + padding * 2 ),
	};

	// Ensure bounds don't exceed image dimensions
	if ( bounds.x + bounds.width > width ) {
		bounds.width = width - bounds.x;
	}
	if ( bounds.y + bounds.height > height ) {
		bounds.height = height - bounds.y;
	}

	return bounds;
}

/**
 * Validates that crop bounds are reasonable
 *
 * @param {Object} bounds         - Bounding box to validate
 * @param {number} originalWidth  - Original image width
 * @param {number} originalHeight - Original image height
 * @param {number} minSize        - Minimum dimension size (default: 10px)
 *
 * @return {boolean} True if bounds are valid
 */
export function validateBounds(
	bounds,
	originalWidth,
	originalHeight,
	minSize = 10
) {
	if ( ! bounds ) {
		return false;
	}

	const { x, y, width, height } = bounds;

	// Check basic validity
	if ( x < 0 || y < 0 || width <= 0 || height <= 0 ) {
		return false;
	}

	// Check bounds don't exceed image
	if ( x + width > originalWidth || y + height > originalHeight ) {
		return false;
	}

	// Check minimum size
	if ( width < minSize || height < minSize ) {
		return false;
	}

	return true;
}

/**
 * Calculate crop percentage to show user how much will be cropped
 *
 * @param {Object} bounds         - Crop bounds
 * @param {number} originalWidth  - Original image width
 * @param {number} originalHeight - Original image height
 *
 * @return {Object} Statistics about the crop {areaCropped, percentCropped}
 */
export function getCropStatistics( bounds, originalWidth, originalHeight ) {
	const originalArea = originalWidth * originalHeight;
	const newArea = bounds.width * bounds.height;
	const areaCropped = originalArea - newArea;
	const percentCropped = ( areaCropped / originalArea ) * 100;

	return {
		areaCropped,
		percentCropped: Math.round( percentCropped ),
		originalDimensions: { width: originalWidth, height: originalHeight },
		newDimensions: { width: bounds.width, height: bounds.height },
	};
}
