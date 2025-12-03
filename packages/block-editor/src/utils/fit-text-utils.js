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
	let maxSize = 2400;
	let bestSize = minSize;

	const computedStyle = window.getComputedStyle( textElement );
	const paddingLeft = parseFloat( computedStyle.paddingLeft ) || 0;
	const paddingRight = parseFloat( computedStyle.paddingRight ) || 0;
	const range = document.createRange();
	range.selectNodeContents( textElement );

	while ( minSize <= maxSize ) {
		const midSize = Math.floor( ( minSize + maxSize ) / 2 );
		applyFontSize( midSize );

		// When there is padding if the text overflows to the
		// padding area, it should be considered overflowing.
		// Use Range API to measure actual text content dimensions.
		const rect = range.getBoundingClientRect();
		const textWidth = rect.width;

		// Check if text fits within the element's width and is not
		// overflowing into the padding area.
		const fitsWidth =
			textElement.scrollWidth <= textElement.clientWidth &&
			textWidth <= textElement.clientWidth - paddingLeft - paddingRight;
		// Check if text fits within the element's height.
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
	range.detach();

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
