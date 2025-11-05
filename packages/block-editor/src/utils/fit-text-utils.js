/**
 * Shared utility functions for fit text functionality.
 * Uses callback-based approach for maximum code reuse between editor and frontend.
 */

/**
 * Find optimal font size using simple binary search between 5-600px.
 *
 * @param {HTMLElement} textElement   The text element
 * @param {Function}    applyFontSize Function that receives font size in pixels
 * @return {number} Optimal font size
 */
function findOptimalFontSize( textElement, applyFontSize ) {
	const alreadyHasScrollableHeight =
		textElement.scrollHeight > textElement.clientHeight;
	let minSize = 5;
	let maxSize = 600;
	let bestSize = minSize;

	while ( minSize <= maxSize ) {
		const midSize = Math.floor( ( minSize + maxSize ) / 2 );
		applyFontSize( midSize );

		const fitsWidth = textElement.scrollWidth <= textElement.clientWidth;
		const fitsHeight =
			alreadyHasScrollableHeight ||
			textElement.scrollHeight <= textElement.clientHeight;

		if ( fitsWidth && fitsHeight ) {
			bestSize = midSize;
			minSize = midSize + 1;
		} else {
			maxSize = midSize - 1;
		}
	}

	return bestSize;
}

/**
 * Complete fit text optimization for a single text element.
 * Handles the full flow using callbacks for font size application.
 *
 * @param {HTMLElement} textElement   The text element (paragraph, heading, etc.)
 * @param {Function}    applyFontSize Function that receives font size in pixels (0 to clear, >0 to apply)
 */
export function optimizeFitText( textElement, applyFontSize ) {
	if ( ! textElement ) {
		return;
	}

	applyFontSize( 0 );

	const optimalSize = findOptimalFontSize( textElement, applyFontSize );

	applyFontSize( optimalSize );
	return optimalSize;
}
